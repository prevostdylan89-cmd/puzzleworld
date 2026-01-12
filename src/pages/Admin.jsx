import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Shield,
  TrendingUp,
  Users,
  Puzzle as PuzzleIcon,
  Loader2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import EditPuzzleModal from '@/components/admin/EditPuzzleModal';

export default function Admin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [globalPuzzles, setGlobalPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user.role !== 'admin') {
        toast.error('Access denied: Admin privileges required');
        window.location.href = '/';
        return;
      }

      loadGlobalPuzzles();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Failed to verify access');
    }
  };

  const loadGlobalPuzzles = async () => {
    try {
      setIsLoading(true);
      const data = await base44.entities.GlobalPuzzle.list('-created_date');
      setGlobalPuzzles(data);
    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast.error('Failed to load puzzles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (puzzle) => {
    setEditingPuzzle(puzzle);
    setShowEditModal(true);
  };

  const handleDelete = async (puzzleId) => {
    if (!confirm('Are you sure you want to delete this puzzle? This action cannot be undone.')) {
      return;
    }

    try {
      await base44.entities.GlobalPuzzle.delete(puzzleId);
      setGlobalPuzzles(globalPuzzles.filter(p => p.id !== puzzleId));
      toast.success('Puzzle deleted successfully');
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      toast.error('Failed to delete puzzle');
    }
  };

  const filteredPuzzles = globalPuzzles.filter(puzzle =>
    !searchQuery || 
    puzzle.puzzle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    puzzle.puzzle_brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    puzzle.puzzle_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalPuzzles: globalPuzzles.length,
    totalCompletions: globalPuzzles.reduce((sum, p) => sum + (p.completion_count || 0), 0),
    totalPlayers: new Set(globalPuzzles.flatMap(p => p.unique_players || [])).size,
    withAffiliateLinks: globalPuzzles.filter(p => p.affiliate_link).length
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-16 lg:top-16 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-orange-400" />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <PuzzleIcon className="w-4 h-4 text-orange-400" />
                <span className="text-white/50 text-sm">Total Puzzles</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalPuzzles}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-white/50 text-sm">Completions</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalCompletions}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-white/50 text-sm">Players</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalPlayers}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink className="w-4 h-4 text-purple-400" />
                <span className="text-white/50 text-sm">With Links</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.withAffiliateLinks}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search puzzles by name, brand, or reference..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>
      </div>

      {/* Puzzles List */}
      <div className="px-4 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPuzzles.map((puzzle) => (
              <motion.div
                key={puzzle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={puzzle.image_url || 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=200&h=200&fit=crop'}
                      alt={puzzle.puzzle_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold mb-1">{puzzle.puzzle_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/60 mb-2">
                      {puzzle.puzzle_brand && <span>{puzzle.puzzle_brand}</span>}
                      {puzzle.puzzle_brand && <span>•</span>}
                      <span>{puzzle.puzzle_pieces} pieces</span>
                      <span>•</span>
                      <span>Ref: {puzzle.puzzle_reference}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-white/5 text-white/70">
                        {puzzle.completion_count || 0} completions
                      </Badge>
                      <Badge variant="secondary" className="bg-white/5 text-white/70">
                        {puzzle.unique_players?.length || 0} players
                      </Badge>
                      {puzzle.affiliate_link && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Has Affiliate Link
                        </Badge>
                      )}
                      {puzzle.difficulty && (
                        <Badge variant="secondary" className="bg-white/5 text-white/70">
                          {puzzle.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(puzzle)}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(puzzle.id)}
                      className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredPuzzles.length === 0 && (
              <div className="text-center py-12">
                <PuzzleIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No puzzles found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditPuzzleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPuzzle(null);
        }}
        puzzle={editingPuzzle}
        onPuzzleUpdated={loadGlobalPuzzles}
      />
    </div>
  );
}
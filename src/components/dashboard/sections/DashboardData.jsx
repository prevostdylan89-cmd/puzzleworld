import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Heart, Loader2, Bookmark, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function DashboardData() {
  const [loading, setLoading] = useState(true);
  const [puzzles, setPuzzles] = useState([]);
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', brand: '' });

  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    setLoading(true);
    try {
      const allPuzzles = await base44.entities.PuzzleCatalog.list('-created_date', 1000);
      setPuzzles(allPuzzles);
    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (puzzle) => {
    setEditingPuzzle(puzzle.id);
    setEditForm({
      title: puzzle.title || '',
      brand: puzzle.brand || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingPuzzle(null);
    setEditForm({ title: '', brand: '' });
  };

  const handleSaveEdit = async (puzzle) => {
    try {
      await base44.entities.PuzzleCatalog.update(puzzle.id, {
        title: editForm.title,
        brand: editForm.brand
      });
      
      // Update local state
      setPuzzles(puzzles.map(p => 
        p.id === puzzle.id 
          ? { ...p, title: editForm.title, brand: editForm.brand }
          : p
      ));
      
      setEditingPuzzle(null);
      toast.success('Puzzle mis à jour');
    } catch (error) {
      console.error('Error updating puzzle:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (puzzleId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce puzzle ?')) return;
    
    try {
      await base44.entities.PuzzleCatalog.delete(puzzleId);
      setPuzzles(puzzles.filter(p => p.id !== puzzleId));
      toast.success('Puzzle supprimé');
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  const puzzlesBySocial = [...puzzles].sort((a, b) => 
    (b.socialScore || 0) - (a.socialScore || 0)
  );

  const puzzlesByWishlist = [...puzzles].sort((a, b) => 
    (b.wishlistCount || 0) - (a.wishlistCount || 0)
  );

  const renderPuzzleRow = (puzzle, index) => {
    const isEditing = editingPuzzle === puzzle.id;

    return (
      <div
        key={puzzle.id}
        className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-white/10 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
            #{index + 1}
          </div>
          
          <img
            src={puzzle.image_hd}
            alt={puzzle.title}
            className="w-16 h-16 object-cover rounded"
          />
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Titre"
                  className="bg-white/5 border-white/10 text-white text-sm"
                />
                <Input
                  value={editForm.brand}
                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                  placeholder="Marque"
                  className="bg-white/5 border-white/10 text-white text-sm"
                />
              </div>
            ) : (
              <>
                <h4 className="text-white font-medium line-clamp-1">{puzzle.title}</h4>
                <p className="text-white/50 text-xs">
                  {puzzle.brand} • {puzzle.piece_count} pièces • {puzzle.category_tag}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-green-400 font-bold text-lg">{puzzle.socialScore || 0}</div>
              <div className="text-white/50 text-xs">Score Social</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-bold text-lg">{puzzle.wishlistCount || 0}</div>
              <div className="text-white/50 text-xs">Wishlist</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={() => handleSaveEdit(puzzle)}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => handleStartEdit(puzzle)}
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(puzzle.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Données & Analytics</h2>
        <p className="text-white/60">Classements basés sur les interactions sociales</p>
      </div>

      <Tabs defaultValue="social" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="social" className="data-[state=active]:bg-orange-500">
            <TrendingUp className="w-4 h-4 mr-2" />
            Classement par Popularité (Likes)
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="data-[state=active]:bg-orange-500">
            <Bookmark className="w-4 h-4 mr-2" />
            Classement par Convoitise (Wishlist)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="space-y-4">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Puzzles triés par Score Social
              </h3>
              <div className="text-white/60 text-sm">
                {puzzlesBySocial.length} puzzles
              </div>
            </div>
            
            <div className="space-y-2 max-h-[700px] overflow-y-auto">
              {puzzlesBySocial.map((puzzle, index) => renderPuzzleRow(puzzle, index))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Puzzles triés par Convoitise (Wishlist)
              </h3>
              <div className="text-white/60 text-sm">
                {puzzlesByWishlist.length} puzzles
              </div>
            </div>
            
            <div className="space-y-2 max-h-[700px] overflow-y-auto">
              {puzzlesByWishlist.map((puzzle, index) => renderPuzzleRow(puzzle, index))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
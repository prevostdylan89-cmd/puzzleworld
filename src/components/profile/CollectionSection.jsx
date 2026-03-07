import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeContext';
import { Package, CheckCircle, Loader2, Puzzle, MoreVertical, Trash2, ArrowRight, ArrowUpDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export default function CollectionSection({ user }) {
  const { isDark } = useTheme();
  const [inboxPuzzles, setInboxPuzzles] = useState([]);
  const [completedPuzzles, setCompletedPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'pieces-asc', 'pieces-desc'

  useEffect(() => {
    loadPuzzles();
  }, [user]);

  const loadPuzzles = async () => {
    try {
      const [inbox, completed] = await Promise.all([
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'inbox' }),
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'done' })
      ]);

      setInboxPuzzles(inbox);
      setCompletedPuzzles(completed);
    } catch (error) {
      console.error('Error loading puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedPuzzles = (puzzles) => {
    const sorted = [...puzzles];
    
    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      case 'pieces-asc':
        return sorted.sort((a, b) => (a.puzzle_pieces || 0) - (b.puzzle_pieces || 0));
      case 'pieces-desc':
        return sorted.sort((a, b) => (b.puzzle_pieces || 0) - (a.puzzle_pieces || 0));
      default:
        return sorted;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  const handleOptimisticMove = (puzzleId, newStatus) => {
    if (newStatus === 'done') {
      const puzzle = inboxPuzzles.find(p => p.id === puzzleId);
      if (puzzle) {
        setInboxPuzzles(prev => prev.filter(p => p.id !== puzzleId));
        setCompletedPuzzles(prev => [...prev, { ...puzzle, status: 'done' }]);
      }
    } else {
      const puzzle = completedPuzzles.find(p => p.id === puzzleId);
      if (puzzle) {
        setCompletedPuzzles(prev => prev.filter(p => p.id !== puzzleId));
        setInboxPuzzles(prev => [...prev, { ...puzzle, status: 'inbox' }]);
      }
    }
  };

  const sortedInboxPuzzles = getSortedPuzzles(inboxPuzzles);
  const sortedCompletedPuzzles = getSortedPuzzles(completedPuzzles);

  return (
    <Tabs defaultValue="inbox" className="w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger 
            value="inbox" 
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Dans sa boîte ({inboxPuzzles.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Terminés ({completedPuzzles.length})
          </TabsTrigger>
        </TabsList>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Trier par
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
            <DropdownMenuItem 
              onClick={() => setSortBy('date-desc')}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'date-desc' ? 'bg-orange-500/20' : ''}`}
            >
              Date (Plus récent)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('date-asc')}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'date-asc' ? 'bg-orange-500/20' : ''}`}
            >
              Date (Plus ancien)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('pieces-asc')}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'pieces-asc' ? 'bg-orange-500/20' : ''}`}
            >
              Pièces (Croissant)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('pieces-desc')}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'pieces-desc' ? 'bg-orange-500/20' : ''}`}
            >
              Pièces (Décroissant)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TabsContent value="inbox">
        {inboxPuzzles.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">Aucun puzzle dans sa boîte</p>
            <p className="text-white/30 text-sm mt-2">Scannez vos puzzles pour les ajouter ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedInboxPuzzles.map((puzzle, index) => (
              <PuzzleCard key={puzzle.id} puzzle={puzzle} index={index} onUpdate={loadPuzzles} onOptimisticMove={handleOptimisticMove} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        {completedPuzzles.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
            <CheckCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">Aucun puzzle terminé</p>
            <p className="text-white/30 text-sm mt-2">Complétez vos premiers puzzles pour les voir ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedCompletedPuzzles.map((puzzle, index) => (
              <PuzzleCard key={puzzle.id} puzzle={puzzle} index={index} onUpdate={loadPuzzles} onOptimisticMove={handleOptimisticMove} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function PuzzleCard({ puzzle, index, onUpdate, onOptimisticMove }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleMove = async () => {
    if (isUpdating) return;
    
    const newStatus = puzzle.status === 'inbox' ? 'done' : 'inbox';
    
    // Optimistic update — move instantly in UI
    onOptimisticMove(puzzle.id, newStatus);
    setIsUpdating(true);
    try {
      await base44.entities.UserPuzzle.update(puzzle.id, { status: newStatus });
      
      if (newStatus === 'done') {
        const user = await base44.auth.me();
        const currentXP = user.xp || 0;
        await base44.auth.updateMe({ xp: currentXP + 100 });
        toast.success('🎉 +100 XP ! Puzzle terminé !');
      } else {
        toast.success('Puzzle remis dans sa boîte !');
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating puzzle:', error);
      toast.error('Erreur lors de la mise à jour');
      // Revert optimistic update on error
      onOptimisticMove(puzzle.id, puzzle.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isUpdating) return;
    
    if (!confirm('Êtes-vous sûr de vouloir retirer ce puzzle de votre collection ?')) {
      return;
    }
    
    setIsUpdating(true);
    try {
      await base44.entities.UserPuzzle.delete(puzzle.id);
      toast.success('Puzzle retiré de votre collection');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group relative"
    >
      {/* Menu d'actions */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isUpdating}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
            <DropdownMenuItem 
              onClick={handleMove}
              className="text-white cursor-pointer hover:bg-white/10"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {puzzle.status === 'inbox' ? 'Marquer comme terminé' : 'Remettre dans sa boîte'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-400 cursor-pointer hover:bg-white/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Retirer de ma collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="aspect-square overflow-hidden bg-white/5">
        {puzzle.image_url ? (
          <img
            src={puzzle.image_url}
            alt={puzzle.puzzle_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Puzzle className="w-12 h-12 text-white/20" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
          {puzzle.puzzle_name}
        </h3>
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{puzzle.puzzle_brand}</span>
          <span>{puzzle.puzzle_pieces} pcs</span>
        </div>
      </div>
    </motion.div>
  );
}
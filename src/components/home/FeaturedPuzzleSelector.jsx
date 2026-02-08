import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Puzzle } from 'lucide-react';
import { toast } from 'sonner';

export default function FeaturedPuzzleSelector({ open, onClose, position, currentPuzzle, onUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPuzzles();
    }
  }, [open, searchQuery]);

  const loadPuzzles = async () => {
    setIsLoading(true);
    try {
      const allPuzzles = await base44.entities.PuzzleCatalog.list('-total_likes', 50);
      
      if (searchQuery) {
        const filtered = allPuzzles.filter(p => 
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setPuzzles(filtered);
      } else {
        setPuzzles(allPuzzles);
      }
    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPuzzle = async (puzzle) => {
    try {
      // Check if already exists at this position
      const existing = await base44.entities.FeaturedPuzzle.filter({ position });
      
      if (existing.length > 0) {
        // Update existing
        await base44.entities.FeaturedPuzzle.update(existing[0].id, {
          puzzle_catalog_id: puzzle.id,
          puzzle_asin: puzzle.asin,
          puzzle_title: puzzle.title,
          puzzle_image: puzzle.image_hd
        });
      } else {
        // Create new
        await base44.entities.FeaturedPuzzle.create({
          puzzle_catalog_id: puzzle.id,
          puzzle_asin: puzzle.asin,
          puzzle_title: puzzle.title,
          puzzle_image: puzzle.image_hd,
          position
        });
      }

      toast.success('Puzzle mis en avant!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating featured puzzle:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Sélectionner un puzzle pour la position {position}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un puzzle..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : puzzles.length === 0 ? (
              <div className="text-center py-12">
                <Puzzle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Aucun puzzle trouvé</p>
              </div>
            ) : (
              puzzles.map((puzzle) => (
                <button
                  key={puzzle.id}
                  onClick={() => handleSelectPuzzle(puzzle)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-orange-500/30"
                >
                  <img
                    src={puzzle.image_hd}
                    alt={puzzle.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-medium text-sm line-clamp-1">{puzzle.title}</h4>
                    <p className="text-white/50 text-xs">{puzzle.brand} • {puzzle.piece_count} pcs</p>
                    <p className="text-orange-400 text-xs">❤️ {puzzle.total_likes + puzzle.total_superlikes}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
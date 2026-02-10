import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Puzzle, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CommunityPuzzleCard from '@/components/collection/CommunityPuzzleCard';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function LikedPuzzlesSection({ userEmail }) {
  const [likedPuzzles, setLikedPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLikedPuzzles();
  }, [userEmail]);

  const loadLikedPuzzles = async () => {
    setIsLoading(true);
    try {
      const likes = await base44.entities.UserPuzzleLike.filter({
        created_by: userEmail
      });
      
      // Fetch full puzzle data for each liked puzzle with like ID
      const puzzlesData = [];
      for (const like of likes) {
        if (like.puzzle_asin) {
          const catalogPuzzles = await base44.entities.PuzzleCatalog.filter({
            asin: like.puzzle_asin
          });
          if (catalogPuzzles.length > 0) {
            puzzlesData.push({
              ...catalogPuzzles[0],
              likeId: like.id
            });
          }
        }
      }
      
      setLikedPuzzles(puzzlesData);
    } catch (error) {
      console.error('Error loading liked puzzles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLike = async (puzzle) => {
    try {
      await base44.entities.UserPuzzleLike.delete(puzzle.likeId);
      setLikedPuzzles(prev => prev.filter(p => p.id !== puzzle.id));
      toast.success('Puzzle retiré de vos likes');
    } catch (error) {
      console.error('Error removing like:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (likedPuzzles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-white/70 font-medium mb-2">Aucun puzzle liké</h3>
        <p className="text-white/40 text-sm">
          Découvrez des puzzles sur le feed social et likez ceux que vous aimez!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {likedPuzzles.map((puzzle) => (
        <motion.div
          key={puzzle.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group"
        >
          <CommunityPuzzleCard puzzle={puzzle} showAffiliateLink={true} />
          <Button
            onClick={() => handleRemoveLike(puzzle)}
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
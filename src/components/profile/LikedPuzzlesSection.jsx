import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Puzzle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CommunityPuzzleCard from '@/components/collection/CommunityPuzzleCard';

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
      
      // Fetch full puzzle data for each liked puzzle
      const puzzlesData = [];
      for (const like of likes) {
        if (like.puzzle_asin) {
          const catalogPuzzles = await base44.entities.PuzzleCatalog.filter({
            asin: like.puzzle_asin
          });
          if (catalogPuzzles.length > 0) {
            puzzlesData.push(catalogPuzzles[0]);
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
        >
          <CommunityPuzzleCard puzzle={puzzle} showAffiliateLink={true} />
        </motion.div>
      ))}
    </div>
  );
}
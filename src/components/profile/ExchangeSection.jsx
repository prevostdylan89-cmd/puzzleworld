import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, Loader2, Puzzle } from 'lucide-react';

export default function ExchangeSection({ user }) {
  const [exchangePuzzles, setExchangePuzzles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPuzzles();
  }, [user]);

  const loadPuzzles = async () => {
    try {
      const puzzles = await base44.entities.UserPuzzle.filter({ 
        created_by: user.email, 
        status: 'cemetery' 
      });
      setExchangePuzzles(puzzles);
    } catch (error) {
      console.error('Error loading exchange puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (exchangePuzzles.length === 0) {
    return (
      <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
        <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">Aucun puzzle à vendre ou échanger</p>
        <p className="text-white/30 text-sm mt-2">Les puzzles que vous n'avez pas aimés apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {exchangePuzzles.map((puzzle, index) => (
        <motion.div
          key={puzzle.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group"
        >
          <div className="aspect-square overflow-hidden bg-white/5 relative">
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
            <div className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded">
              À vendre
            </div>
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
      ))}
    </div>
  );
}
import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Star, Package } from 'lucide-react';

export default function SwipeCard({ puzzle, onSwipe, style, dragControls }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 100) {
      const direction = info.offset.x > 0 ? 'like' : 'dislike';
      onSwipe(direction);
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ 
        x, 
        rotate, 
        opacity,
        ...style 
      }}
      className="absolute w-full h-full"
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-white shadow-2xl">
        {/* Image principale */}
        <div className="relative h-[65%]">
          <img 
            src={puzzle.image_hd} 
            alt={puzzle.title}
            className="w-full h-full object-cover"
          />
          
          {/* Overlays de swipe */}
          <motion.div 
            style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
            className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
          >
            <div className="bg-green-500 rounded-full p-4">
              <Heart className="w-12 h-12 text-white fill-white" />
            </div>
          </motion.div>
          
          <motion.div 
            style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
            className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
          >
            <div className="bg-red-500 rounded-full p-4">
              <X className="w-12 h-12 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Informations du puzzle */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pb-8">
          {/* Titre et Marque */}
          <h3 className="text-white text-2xl font-bold mb-2 line-clamp-2">
            {puzzle.title}
          </h3>
          
          <div className="flex items-center gap-4 text-white/90 text-sm mb-3">
            <span className="font-semibold">{puzzle.brand}</span>
          </div>

          {/* Badges informatifs */}
          <div className="flex gap-2 flex-wrap">
            {puzzle.piece_count && (
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Package className="w-4 h-4 text-white" />
                <span className="text-white font-medium">{puzzle.piece_count} pièces</span>
              </div>
            )}
            
            {puzzle.category_tag && (
              <div className="bg-orange-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-white font-medium">{puzzle.category_tag}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
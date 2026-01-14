import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Puzzle, Users, Star, Clock, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PuzzleCard({ puzzle, variant = 'default' }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const {
    title = 'Mystery Puzzle',
    image = 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=300&fit=crop',
    pieces = 1000,
    difficulty = 'Medium',
    plays = 234,
    rating = 4.5,
    creator = 'Anonymous'
  } = puzzle || {};

  const isLarge = variant === 'large';
  const isFeatured = variant === 'featured';

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const user = await base44.auth.me();
      
      const existing = await base44.entities.Wishlist.filter({
        puzzle_name: title,
        created_by: user.email
      });

      if (existing.length > 0) {
        toast.info('Already in your wishlist');
        return;
      }

      await base44.entities.Wishlist.create({
        puzzle_name: title,
        puzzle_brand: creator || '',
        puzzle_pieces: pieces || 0,
        image_url: image || '',
        priority: 'medium'
      });

      setIsWishlisted(true);
      toast.success('Added to wishlist!');
    } catch (error) {
      if (error.message?.includes('not authenticated')) {
        toast.error('Please log in to add to wishlist');
        base44.auth.redirectToLogin();
      } else {
        toast.error('Failed to add to wishlist');
      }
    }
  };

  return (
    <Link to={createPageUrl('PuzzleDetail')}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
          isFeatured ? 'aspect-[16/10]' : isLarge ? 'aspect-[4/3]' : 'aspect-square'
        }`}
      >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000019] via-[#000019]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        {/* Difficulty Badge & Wishlist */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleAddToWishlist}
            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
              isWishlisted 
                ? 'bg-orange-500 text-white' 
                : 'bg-black/30 text-white hover:bg-orange-500/50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
            difficulty === 'Easy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            difficulty === 'Medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {difficulty}
          </span>
        </div>

        {/* Title & Info */}
        <div className="space-y-2">
          <h3 className={`font-semibold text-white leading-tight ${
            isFeatured ? 'text-2xl' : isLarge ? 'text-xl' : 'text-base'
          }`}>
            {title}
          </h3>
          
          <p className="text-white/50 text-sm">by {creator}</p>

          <div className="flex items-center gap-4 text-white/70 text-xs">
            <span className="flex items-center gap-1">
              <Puzzle className="w-3.5 h-3.5 text-orange-400" />
              {pieces} pcs
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-orange-400" />
              {plays}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              {rating}
            </span>
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
    </Link>
  );
}
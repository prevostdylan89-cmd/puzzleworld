import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit3, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WishlistSection({ user }) {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    try {
      const items = await base44.entities.Wishlist.filter(
        { created_by: user.email },
        '-created_date'
      );
      setWishlist(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await base44.entities.Wishlist.delete(itemId);
      setWishlist(wishlist.filter(item => item.id !== itemId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to remove item');
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  if (isLoading) {
    return <p className="text-white/50 text-center py-8">Loading wishlist...</p>;
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 mb-2">Your wishlist is empty</p>
        <p className="text-white/30 text-sm">Add puzzles from posts to start your wishlist</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {wishlist.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden hover:border-orange-500/30 transition-colors group"
        >
          {item.image_url && (
            <div className="aspect-video overflow-hidden">
              <img
                src={item.image_url}
                alt={item.puzzle_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">{item.puzzle_name}</h4>
                {item.puzzle_brand && (
                  <p className="text-white/50 text-sm">{item.puzzle_brand}</p>
                )}
              </div>
              <Badge className={priorityColors[item.priority || 'medium']}>
                {item.priority || 'medium'}
              </Badge>
            </div>
            
            {item.puzzle_pieces > 0 && (
              <p className="text-white/40 text-xs mb-2">{item.puzzle_pieces} pieces</p>
            )}
            
            {item.notes && (
              <p className="text-white/60 text-sm mb-3 line-clamp-2">{item.notes}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
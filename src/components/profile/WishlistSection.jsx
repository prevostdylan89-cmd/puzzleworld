import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit3, ExternalLink, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import PuzzleDetailModal from '@/components/collection/PuzzleDetailModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useScrollSafeDropdown() {
  const [open, setOpen] = useState(false);
  const pointerStartRef = useRef(null);
  const handlePointerDown = useCallback((e) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handleClick = useCallback((e) => {
    if (pointerStartRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      if (dx > 8 || dy > 8) { e.preventDefault(); e.stopPropagation(); return; }
    }
    setOpen(o => !o);
  }, []);
  return { open, setOpen, handlePointerDown, handleClick };
}

export default function WishlistSection({ user }) {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const sortDropdown = useScrollSafeDropdown();

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    try {
      // Load both old Wishlist entity AND UserPuzzle with status='wishlist'
      const [oldWishlistItems, userPuzzleWishlist] = await Promise.all([
        base44.entities.Wishlist.filter({ created_by: user.email }, '-created_date'),
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'wishlist' }, '-created_date'),
      ]);
      
      // Normalize UserPuzzle wishlist items to same shape
      const normalizedUserPuzzles = userPuzzleWishlist.map(p => ({
        id: p.id,
        puzzle_name: p.puzzle_name,
        puzzle_brand: p.puzzle_brand,
        puzzle_pieces: p.puzzle_pieces,
        image_url: p.image_url,
        notes: p.notes || '',
        priority: 'medium',
        created_date: p.created_date,
        _source: 'user_puzzle',
        _raw: p,
        catalogData: null,
      }));

      // Enrich old wishlist items with catalog data
      const enrichedOld = [];
      for (const item of oldWishlistItems) {
        const catalogPuzzles = await base44.entities.PuzzleCatalog.filter({ title: item.puzzle_name });
        enrichedOld.push({
          ...item,
          _source: 'wishlist',
          catalogData: catalogPuzzles.length > 0 ? catalogPuzzles[0] : null
        });
      }
      
      // Merge, dedup by puzzle_name
      const seen = new Set();
      const merged = [];
      for (const item of [...normalizedUserPuzzles, ...enrichedOld]) {
        const key = item.puzzle_name?.toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }

      setWishlist(merged);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      if (item._source === 'user_puzzle') {
        await base44.entities.UserPuzzle.delete(item.id);
      } else {
        await base44.entities.Wishlist.delete(item.id);
      }
      setWishlist(wishlist.filter(w => w.id !== item.id));
      toast.success('Retiré de la wishlist');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getSortedWishlist = (items) => {
    const sorted = [...items];
    
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

  const sortedWishlist = getSortedWishlist(wishlist);

  return (
    <>
      <div className="flex justify-end mb-6">
        <DropdownMenu open={sortDropdown.open} onOpenChange={sortDropdown.setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
              onPointerDown={sortDropdown.handlePointerDown}
              onClick={sortDropdown.handleClick}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Trier par
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
            <DropdownMenuItem 
              onClick={() => { setSortBy('date-desc'); sortDropdown.setOpen(false); }}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'date-desc' ? 'bg-orange-500/20' : ''}`}
            >
              Date (Plus récent)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortBy('date-asc'); sortDropdown.setOpen(false); }}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'date-asc' ? 'bg-orange-500/20' : ''}`}
            >
              Date (Plus ancien)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortBy('pieces-asc'); sortDropdown.setOpen(false); }}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'pieces-asc' ? 'bg-orange-500/20' : ''}`}
            >
              Pièces (Croissant)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortBy('pieces-desc'); sortDropdown.setOpen(false); }}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'pieces-desc' ? 'bg-orange-500/20' : ''}`}
            >
              Pièces (Décroissant)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedWishlist.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden hover:border-orange-500/30 transition-colors group cursor-pointer"
          onClick={() => item.catalogData && setSelectedPuzzle(item.catalogData)}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </motion.div>
        ))}
      </div>

      {selectedPuzzle && (
        <PuzzleDetailModal
          open={!!selectedPuzzle}
          onClose={() => setSelectedPuzzle(null)}
          puzzle={selectedPuzzle}
        />
      )}
    </>
  );
}
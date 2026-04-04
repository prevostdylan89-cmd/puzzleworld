import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Package, CheckCircle, Loader2, Puzzle, MoreVertical, Trash2, ArrowRight, ArrowUpDown, Camera, ImagePlus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

// Hook to prevent dropdown from opening when user is scrolling
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
      if (dx > 8 || dy > 8) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    setOpen(o => !o);
  }, []);

  return { open, setOpen, handlePointerDown, handleClick };
}

export default function CollectionSection({ user }) {
  const [inboxPuzzles, setInboxPuzzles] = useState([]);
  const [completedPuzzles, setCompletedPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc');
  const sortDropdown = useScrollSafeDropdown();

  useEffect(() => {
    loadPuzzles();
  }, [user]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadPuzzles();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  const loadPuzzles = async () => {
    try {
      const [inbox, completed] = await Promise.all([
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'inbox' }),
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'done' }),
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
    const allPuzzles = [...inboxPuzzles, ...completedPuzzles];
    const puzzle = allPuzzles.find(p => p.id === puzzleId);
    if (!puzzle) return;

    setInboxPuzzles(prev => prev.filter(p => p.id !== puzzleId));
    setCompletedPuzzles(prev => prev.filter(p => p.id !== puzzleId));

    const updated = { ...puzzle, status: newStatus };
    if (newStatus === 'done') setCompletedPuzzles(prev => [...prev, updated]);
    else if (newStatus === 'inbox') setInboxPuzzles(prev => [...prev, updated]);
  };

  const sortedInboxPuzzles = getSortedPuzzles(inboxPuzzles);
  const sortedCompletedPuzzles = getSortedPuzzles(completedPuzzles);

  return (
    <Tabs defaultValue="inbox" className="w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="inbox" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" />
            Boîte ({inboxPuzzles.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Terminés ({completedPuzzles.length})
          </TabsTrigger>
        </TabsList>

        <DropdownMenu open={sortDropdown.open} onOpenChange={sortDropdown.setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-white/20 text-white bg-transparent hover:bg-white/5"
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const handleCompletionPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.UserPuzzle.update(puzzle.id, { progress_photo: file_url });
      toast.success('📸 Photo ajoutée !');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleMove = async (newStatus) => {
    if (isUpdating) return;
    onOptimisticMove(puzzle.id, newStatus);
    setIsUpdating(true);
    try {
      await base44.entities.UserPuzzle.update(puzzle.id, { status: newStatus });
      if (newStatus === 'done') {
        const user = await base44.auth.me();
        await base44.auth.updateMe({ xp: (user.xp || 0) + 100 });
        toast.success('🎉 +100 XP ! Puzzle terminé !');
      } else if (newStatus === 'inbox') {
        toast.success('Puzzle mis dans sa boîte !');
      } else if (newStatus === 'wishlist') {
        toast.success('Puzzle mis en wishlist !');
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      onOptimisticMove(puzzle.id, puzzle.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const moveOptions = [
    { status: 'wishlist', label: '⭐ Wishlist', hidden: puzzle.status === 'wishlist' },
    { status: 'inbox', label: '📦 Dans sa boîte', hidden: puzzle.status === 'inbox' },
    { status: 'done', label: '🏆 Terminé', hidden: puzzle.status === 'done' },
  ].filter(o => !o.hidden);

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
            {moveOptions.map(({ status, label }) => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleMove(status)}
                className="text-white cursor-pointer hover:bg-white/10"
              >
                {label}
              </DropdownMenuItem>
            ))}
            {puzzle.status === 'done' && (
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="text-orange-400 cursor-pointer hover:bg-white/10"
                disabled={isUploadingPhoto}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isUploadingPhoto ? 'Upload...' : puzzle.progress_photo ? 'Changer ma photo' : 'Ajouter ma photo'}
              </DropdownMenuItem>
            )}
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCompletionPhotoUpload}
      />

      <div className="aspect-square overflow-hidden bg-white/5 relative">
        {/* For done puzzles: show completion photo if available, then puzzle image */}
        {(puzzle.status === 'done' && puzzle.progress_photo) ? (
          <>
            <img
              src={puzzle.progress_photo}
              alt={`${puzzle.puzzle_name} - terminé`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute bottom-1 right-1 bg-green-500/80 rounded-full p-1">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </>
        ) : puzzle.image_url ? (
          <>
            <img
              src={puzzle.image_url}
              alt={puzzle.puzzle_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {puzzle.status === 'done' && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-1 text-white">
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-xs font-medium">Ma photo</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={puzzle.status === 'done' ? () => fileInputRef.current?.click() : undefined}
          >
            {puzzle.status === 'done' ? (
              <div className="flex flex-col items-center gap-2 text-white/30 hover:text-orange-400 transition-colors">
                <ImagePlus className="w-10 h-10" />
                <span className="text-xs">Ajouter ma photo</span>
              </div>
            ) : (
              <Puzzle className="w-12 h-12 text-white/20" />
            )}
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
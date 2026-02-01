import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CompletedPuzzlesModal({ open, onClose, user }) {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPieces, setTotalPieces] = useState(0);

  useEffect(() => {
    if (open && user) {
      loadCompletedPuzzles();
    }
  }, [open, user]);

  const loadCompletedPuzzles = async () => {
    try {
      const completed = await base44.entities.UserPuzzle.filter({
        created_by: user.email,
        status: 'done'
      });
      setPuzzles(completed);
      const total = completed.reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);
      setTotalPieces(total);
    } catch (error) {
      console.error('Error loading completed puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Package className="w-6 h-6 text-green-400" />
            Puzzles Complétés
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-white">{puzzles.length}</div>
                  <div className="text-white/60 text-sm">Puzzles terminés</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">{totalPieces.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">Pièces complétées</div>
                </div>
              </div>
            </div>

            {puzzles.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                Aucun puzzle complété
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {puzzles.map((puzzle) => (
                  <div key={puzzle.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-green-500/30 transition-all">
                    <div className="flex gap-3">
                      {puzzle.image_url ? (
                        <img src={puzzle.image_url} alt={puzzle.puzzle_name} className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center">
                          <Package className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{puzzle.puzzle_name}</h4>
                        <p className="text-white/50 text-sm">{puzzle.puzzle_brand}</p>
                        <p className="text-orange-400 text-sm">{puzzle.puzzle_pieces} pièces</p>
                        {puzzle.end_date && (
                          <p className="text-white/40 text-xs flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(puzzle.end_date), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AchievementsModal({ open, onClose, user }) {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      loadAchievements();
    }
  }, [open, user]);

  const loadAchievements = async () => {
    try {
      const [allAchievements, userUnlocked] = await Promise.all([
        base44.entities.Achievement.list(),
        base44.entities.Achievement.filter({ created_by: user.email })
      ]);
      setAchievements(allAchievements);
      setUserAchievements(userUnlocked);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId) => {
    return userAchievements.some(ua => ua.achievement_type === achievementId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            Succès ({userAchievements.length} / {achievements.length})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-white/50">
                Aucun succès disponible
              </div>
            ) : (
              achievements.map((achievement) => {
                const unlocked = isUnlocked(achievement.achievement_type);
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border transition-all ${
                      unlocked
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-3xl ${unlocked ? '' : 'grayscale opacity-50'}`}>
                        {achievement.icon || '🏆'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{achievement.title}</h4>
                        <p className="text-white/60 text-sm">{achievement.description}</p>
                        <div className="mt-2">
                          {unlocked ? (
                            <span className="text-green-400 text-xs font-medium">✓ Débloqué</span>
                          ) : (
                            <span className="text-white/40 text-xs">Non débloqué</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function WishlistModal({ open, onClose, user }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      loadWishlist();
    }
  }, [open, user]);

  const loadWishlist = async () => {
    try {
      const items = await base44.entities.UserPuzzle.filter({
        created_by: user.email,
        status: 'wishlist'
      });
      setWishlist(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            Ma Wishlist ({wishlist.length})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            Aucun puzzle en wishlist
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlist.map((puzzle) => (
              <div key={puzzle.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-pink-500/30 transition-all">
                <div className="flex gap-3">
                  {puzzle.image_url ? (
                    <img src={puzzle.image_url} alt={puzzle.puzzle_name} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center">
                      <Package className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{puzzle.puzzle_name}</h4>
                    <p className="text-white/50 text-sm">{puzzle.puzzle_brand}</p>
                    <p className="text-pink-400 text-sm">{puzzle.puzzle_pieces} pièces</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
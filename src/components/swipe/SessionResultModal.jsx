import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingUp, Heart, Star, Target } from 'lucide-react';

export default function SessionResultModal({ open, onClose, stats, onContinue }) {
  const { topCategory, categoryPercentage, totalLikes, totalSuperLikes, topBrand, kidsMode } = stats;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#0a0a2e] to-[#1a1a4e] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {kidsMode ? '🎉 Super travail !' : '🎉 Bilan de Session !'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Statistiques principales */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <div className="text-center mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                25
              </div>
              <p className="text-white/70 text-sm mt-1">
                {kidsMode ? 'Puzzles découverts 🌟' : 'Puzzles découverts'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Heart className="w-6 h-6 text-pink-400" />
                </div>
                <div className="text-2xl font-bold text-white">{totalLikes}</div>
                <div className="text-xs text-white/60">Likes</div>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white">{totalSuperLikes}</div>
                <div className="text-xs text-white/60">Super Likes</div>
              </div>
            </div>
          </motion.div>

          {/* Insight principal */}
          {topCategory && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl p-4 border border-orange-500/30"
            >
              <div className="flex items-start gap-3">
                <div className="bg-orange-500/20 rounded-full p-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold mb-1">
                    {kidsMode ? '🎨 Tes préférences' : 'Votre préférence'}
                  </p>
                  <p className="text-white/80 text-sm">
                    {kidsMode ? (
                      <>Tu as adoré <span className="text-orange-400 font-bold">{categoryPercentage}%</span> de puzzles <span className="text-orange-400 font-bold">{topCategory}</span> ! 🎉</>
                    ) : (
                      <>Vous avez aimé <span className="text-orange-400 font-bold">{categoryPercentage}%</span> de puzzles <span className="text-orange-400 font-bold">{topCategory}</span> !</>
                    )}
                  </p>
                  {topBrand && !kidsMode && (
                    <p className="text-white/60 text-xs mt-2">
                      Marque favorite: <span className="text-orange-400">{topBrand}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Bouton de continuation */}
          <Button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg py-6 rounded-xl"
          >
            <Target className="w-5 h-5 mr-2" />
            Lancer une nouvelle série
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
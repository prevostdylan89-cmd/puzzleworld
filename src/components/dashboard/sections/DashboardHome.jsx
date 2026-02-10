import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Puzzle, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeaturedPuzzleSelector from '@/components/home/FeaturedPuzzleSelector';
import { toast } from 'sonner';

export default function DashboardHome() {
  const [featuredPuzzles, setFeaturedPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  useEffect(() => {
    loadFeaturedPuzzles();
  }, []);

  const loadFeaturedPuzzles = async () => {
    setLoading(true);
    try {
      const puzzles = await base44.entities.FeaturedPuzzle.list('position');
      setFeaturedPuzzles(puzzles);
    } catch (error) {
      console.error('Error loading featured puzzles:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const openSelector = (position) => {
    setSelectedPosition(position);
    setShowSelector(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Accueil</h2>
        <p className="text-white/60">Gérez le contenu de la page d'accueil</p>
      </div>

      {/* Top 4 Puzzles Section */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Top 4 Puzzles en Vedette</h3>
        <p className="text-white/60 text-sm mb-6">
          Sélectionnez les 4 puzzles à afficher sur la page d'accueil
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((position) => {
            const puzzle = featuredPuzzles.find(p => p.position === position);
            
            return (
              <div
                key={position}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden hover:border-orange-500/30 transition-all"
              >
                {puzzle ? (
                  <>
                    <div className="aspect-square bg-white/5">
                      <img
                        src={puzzle.puzzle_image}
                        alt={puzzle.puzzle_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                        {puzzle.puzzle_title}
                      </p>
                      <Button
                        onClick={() => openSelector(position)}
                        size="sm"
                        className="w-full bg-white/10 hover:bg-white/20 text-white"
                      >
                        <Edit2 className="w-3 h-3 mr-2" />
                        Changer
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="aspect-square bg-white/5 flex flex-col items-center justify-center p-4">
                    <Puzzle className="w-12 h-12 text-white/20 mb-3" />
                    <p className="text-white/50 text-sm mb-3 text-center">
                      Position {position} vide
                    </p>
                    <Button
                      onClick={() => openSelector(position)}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Sélectionner
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Puzzle Selector Modal */}
      {showSelector && (
        <FeaturedPuzzleSelector
          open={showSelector}
          onClose={() => {
            setShowSelector(false);
            setSelectedPosition(null);
          }}
          position={selectedPosition}
          currentPuzzle={featuredPuzzles.find(p => p.position === selectedPosition)}
          onUpdate={loadFeaturedPuzzles}
        />
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Baby, Puzzle } from 'lucide-react';

const PIECE_OPTIONS = [
  { value: 500, label: '500 pièces', difficulty: 'Débutant' },
  { value: 1000, label: '1000 pièces', difficulty: 'Intermédiaire' },
  { value: 1500, label: '1500 pièces', difficulty: 'Avancé' },
  { value: 2000, label: '2000 pièces', difficulty: 'Expert' },
  { value: 3000, label: '3000+ pièces', difficulty: 'Maître' }
];

export default function ConfigModal({ open, onClose, filters, onApply }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#0a0a2e] to-[#1a1a4e] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-400" />
            Configuration des filtres
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Enfant */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 rounded-lg p-2">
                  <Baby className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <Label className="text-white font-semibold">Mode Enfant</Label>
                  <p className="text-xs text-white/60 mt-0.5">Maximum 150 pièces</p>
                </div>
              </div>
              <Switch
                checked={localFilters.kidsMode}
                onCheckedChange={(checked) => 
                  setLocalFilters({ ...localFilters, kidsMode: checked })
                }
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          </div>

          {/* Nombre de pièces (si pas mode enfant) */}
          {!localFilters.kidsMode && (
            <div>
              <Label className="text-white/70 text-sm mb-3 block flex items-center gap-2">
                <Puzzle className="w-4 h-4" />
                Nombre de pièces
              </Label>
              
              <div className="space-y-2">
                {PIECE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLocalFilters({ ...localFilters, pieceCount: option.value })}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      localFilters.pieceCount === option.value
                        ? 'bg-orange-500/20 border-orange-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-xs text-white/50">{option.difficulty}</div>
                      </div>
                      {localFilters.pieceCount === option.value && (
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Résumé */}
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg p-4 border border-orange-500/20">
            <p className="text-sm text-white/80">
              {localFilters.kidsMode ? (
                <>
                  🎨 <strong>Mode Enfant activé</strong> - Puzzles jusqu'à 150 pièces, vocabulaire simplifié
                </>
              ) : (
                <>
                  🧩 Recherche de puzzles autour de <strong>{localFilters.pieceCount} pièces</strong>
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
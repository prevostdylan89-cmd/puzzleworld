import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Ruler, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function DimensionManagement() {
  const [dimensions, setDimensions] = useState([]);
  const [puzzleCounts, setPuzzleCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDimension, setNewDimension] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allPuzzles = await base44.entities.PuzzleCatalog.list('-created_date', 1000);
      
      // Extraire toutes les dimensions uniques
      const dimensionMap = new Map();
      allPuzzles.forEach(puzzle => {
        if (puzzle.dimensions) {
          const dim = puzzle.dimensions.trim();
          dimensionMap.set(dim, (dimensionMap.get(dim) || 0) + 1);
        }
      });

      // Convertir en tableau
      const dimensionList = Array.from(dimensionMap.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count);

      setDimensions(dimensionList);
      const counts = {};
      dimensionList.forEach(d => counts[d.name] = d.count);
      setPuzzleCounts(counts);
    } catch (error) {
      console.error('Error loading dimensions:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (dimension) => {
    setEditingId(dimension.name);
    setEditValue(dimension.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveEdit = async (oldName) => {
    if (!editValue.trim()) {
      toast.error('Le nom ne peut pas être vide');
      return;
    }

    try {
      // Mettre à jour tous les puzzles avec cette dimension
      const puzzles = await base44.entities.PuzzleCatalog.filter({ dimensions: oldName });
      
      for (const puzzle of puzzles) {
        await base44.entities.PuzzleCatalog.update(puzzle.id, {
          dimensions: editValue.trim()
        });
      }

      toast.success(`${puzzles.length} puzzle(s) mis à jour`);
      setEditingId(null);
      setEditValue('');
      await loadData();
    } catch (error) {
      console.error('Error updating dimension:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (dimensionName) => {
    if (!confirm(`Supprimer la dimension "${dimensionName}" ? Les puzzles concernés auront leur dimension effacée.`)) {
      return;
    }

    try {
      const puzzles = await base44.entities.PuzzleCatalog.filter({ dimensions: dimensionName });
      
      for (const puzzle of puzzles) {
        await base44.entities.PuzzleCatalog.update(puzzle.id, {
          dimensions: ''
        });
      }

      toast.success(`Dimension supprimée (${puzzles.length} puzzle(s) affectés)`);
      await loadData();
    } catch (error) {
      console.error('Error deleting dimension:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddDimension = async () => {
    if (!newDimension.trim()) {
      toast.error('Veuillez entrer une dimension');
      return;
    }

    // Vérifier si la dimension existe déjà
    if (dimensions.some(d => d.name.toLowerCase() === newDimension.trim().toLowerCase())) {
      toast.error('Cette dimension existe déjà');
      return;
    }

    // Note: On ajoute juste à la liste locale, elle sera utilisée lors de l'ajout/modification de puzzles
    toast.success('Dimension ajoutée à la liste');
    setNewDimension('');
    setShowAddForm(false);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Ruler className="w-5 h-5 text-orange-400" />
            Gestion des Dimensions
          </h3>
          <p className="text-white/50 text-sm mt-1">
            {dimensions.length} dimension(s) différente(s) dans le catalogue
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une dimension
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <Input
              value={newDimension}
              onChange={(e) => setNewDimension(e.target.value)}
              placeholder="Ex: 70 x 50 cm"
              className="bg-white/5 border-white/10 text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleAddDimension()}
            />
            <Button
              onClick={handleAddDimension}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setNewDimension('');
              }}
              variant="ghost"
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {dimensions.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Ruler className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune dimension trouvée dans le catalogue</p>
            <p className="text-sm mt-1">Ajoutez des dimensions aux puzzles pour les voir ici</p>
          </div>
        ) : (
          dimensions.map((dimension) => (
            <div
              key={dimension.name}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 flex items-center gap-4 hover:border-orange-500/30 transition-all"
            >
              {editingId === dimension.name ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 bg-white/5 border-white/10 text-white"
                  autoFocus
                />
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Ruler className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-medium">{dimension.name}</span>
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    {puzzleCounts[dimension.name] || 0} puzzle(s)
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {editingId === dimension.name ? (
                  <>
                    <Button
                      onClick={() => handleSaveEdit(dimension.name)}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="ghost"
                      className="text-white/70 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleStartEdit(dimension)}
                      size="sm"
                      variant="ghost"
                      className="text-white/70 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(dimension.name)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Save, X, Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function BrandManagement() {
  const queryClient = useQueryClient();
  const [editingBrand, setEditingBrand] = useState(null);
  const [editForm, setEditForm] = useState({ name: '' });
  const [newBrandName, setNewBrandName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const allBrands = await base44.entities.Brand.list();
      return allBrands.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  const { data: puzzles = [] } = useQuery({
    queryKey: ['puzzleCatalog'],
    queryFn: () => base44.entities.PuzzleCatalog.list()
  });

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.Brand.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Marque mise à jour');
      setEditingBrand(null);
    }
  });

  const createBrandMutation = useMutation({
    mutationFn: async (name) => {
      await base44.entities.Brand.create({ name, puzzle_count: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Marque ajoutée');
      setNewBrandName('');
      setShowAddForm(false);
    }
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Brand.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Marque supprimée');
    }
  });

  const handleStartEdit = (brand) => {
    setEditingBrand(brand.id);
    setEditForm({ name: brand.name });
  };

  const handleSaveEdit = (brand) => {
    if (!editForm.name.trim()) {
      toast.error('Le nom de la marque est requis');
      return;
    }
    updateBrandMutation.mutate({ id: brand.id, data: editForm });
  };

  const handleCancelEdit = () => {
    setEditingBrand(null);
    setEditForm({ name: '' });
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) {
      toast.error('Le nom de la marque est requis');
      return;
    }
    createBrandMutation.mutate(newBrandName);
  };

  const handleDeleteBrand = (brand) => {
    if (confirm(`Supprimer la marque "${brand.name}" ?`)) {
      deleteBrandMutation.mutate(brand.id);
    }
  };

  const getBrandPuzzleCount = (brandName) => {
    return puzzles.filter(p => p.brand === brandName).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/60">Chargement des marques...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Base de données des Marques
          </h3>
          <p className="text-white/50 text-sm mt-1">
            {brands.length} marques référencées
          </p>
        </div>
        
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une marque
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Nom de la nouvelle marque"
              className="bg-white/5 border-white/10 text-white flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
            />
            <Button
              onClick={handleAddBrand}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setNewBrandName('');
              }}
              variant="ghost"
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p className="text-blue-400 text-sm">
          <strong>📦 Base de données centralisée :</strong> Gérez toutes les marques de puzzles. Ces marques seront disponibles pour tous les puzzles de l'application.
        </p>
      </div>
      
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {brands.map((brand) => {
          const isEditing = editingBrand === brand.id;
          const puzzleCount = getBrandPuzzleCount(brand.name);
          
          return (
            <div
              key={brand.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-400" />
                </div>
                
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nom de la marque"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  ) : (
                    <>
                      <h4 className="text-white font-semibold text-lg">{brand.name}</h4>
                      <p className="text-white/50 text-sm">
                        {puzzleCount} puzzle{puzzleCount !== 1 ? 's' : ''} référencé{puzzleCount !== 1 ? 's' : ''}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={() => handleSaveEdit(brand)}
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
                        onClick={() => handleStartEdit(brand)}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteBrand(brand)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {brands.length === 0 && (
          <div className="text-center py-12 text-white/50">
            Aucune marque référencée. Cliquez sur "Ajouter une marque" pour commencer.
          </div>
        )}
      </div>
    </div>
  );
}
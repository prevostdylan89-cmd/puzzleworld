import React, { useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Code2 } from 'lucide-react';

export default function ScanPuzzleModal({ open, onClose, onPuzzleAdded, skipCollectionAdd = false }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null); // null | 'barcode' | 'manual'
  const [puzzleData, setPuzzleData] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [barcodeCode, setBarcodeCode] = useState('');
  const [manualData, setManualData] = useState({
    name: '',
    brand: '',
    pieces: '',
    image: '',
    sku: ''
  });

  const handleBarcodeSubmit = async () => {
    if (!barcodeCode.trim()) {
      toast.error('Veuillez entrer un code ASIN ou EAN');
      return;
    }

    setLoading(true);
    try {
      // D'abord vérifier si le puzzle existe dans la base de données locale
      const existingPuzzles = await base44.entities.PuzzleCatalog.filter({ asin: barcodeCode });

      if (existingPuzzles.length > 0) {
        const puzzle = existingPuzzles[0];
        setPuzzleData({
          name: puzzle.title || '',
          brand: puzzle.brand || '',
          pieces: puzzle.piece_count || 0,
          image: puzzle.image_hd || '',
          sku: barcodeCode,
          asin: barcodeCode,
          title: puzzle.title || '',
          image_hd: puzzle.image_hd || '',
          piece_count: puzzle.piece_count || 0,
          catalog_id: puzzle.id
        });
        toast.success('Puzzle trouvé dans la base!');
      } else {
        // Si pas trouvé localement, chercher avec Rainforest
        const response = await base44.functions.invoke('searchPuzzleWithRainforest', { asin: barcodeCode });
        const puzzleInfo = response.data.puzzle;

        setPuzzleData({
          name: puzzleInfo.title || '',
          brand: puzzleInfo.brand || '',
          pieces: puzzleInfo.piece_count || 0,
          image: puzzleInfo.image_hd || '',
          sku: barcodeCode,
          asin: barcodeCode,
          title: puzzleInfo.title || '',
          image_hd: puzzleInfo.image_hd || '',
          piece_count: puzzleInfo.piece_count || 0
        });
        toast.success('Puzzle trouvé via Rainforest!');
      }
      
      setMode(null);
    } catch (error) {
      toast.error('Code non trouvé');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualDataSubmit = () => {
    if (!manualData.name || !manualData.pieces) {
      toast.error('Veuillez remplir au moins le nom et le nombre de pièces');
      return;
    }
    
    const data = {
      name: manualData.name,
      brand: manualData.brand,
      pieces: parseInt(manualData.pieces),
      image: manualData.image,
      sku: manualData.sku,
      asin: manualData.sku,
      title: manualData.name,
      image_hd: manualData.image,
      piece_count: parseInt(manualData.pieces)
    };
    
    setPuzzleData(data);
    
    if (skipCollectionAdd && onPuzzleAdded) {
      onPuzzleAdded(data);
    }
  };

  const handleAddPuzzle = async () => {
    if (!puzzleData || !selectedStatus) {
      toast.error('Veuillez sélectionner un statut');
      return;
    }
    try {
      let catalogPuzzleId = null;
      const asinToCheck = puzzleData.sku || puzzleData.asin || '';

      if (asinToCheck) {
        const existingInCatalog = await base44.entities.PuzzleCatalog.filter({ asin: asinToCheck });

        if (existingInCatalog.length > 0) {
          catalogPuzzleId = existingInCatalog[0].id;
          toast.success('✨ Ce puzzle est déjà dans la collection communautaire !');

          const updateData = {
            added_count: (existingInCatalog[0].added_count || 0) + 1
          };
          
          if (!existingInCatalog[0].piece_count && puzzleData.pieces) {
            updateData.piece_count = puzzleData.pieces;
          }
          if (!existingInCatalog[0].brand && puzzleData.brand) {
            updateData.brand = puzzleData.brand;
          }
          if (!existingInCatalog[0].image_hd && puzzleData.image) {
            updateData.image_hd = puzzleData.image;
          }
          
          await base44.entities.PuzzleCatalog.update(catalogPuzzleId, updateData);
        } else {
          try {
            const catalogData = {
              asin: asinToCheck,
              image_hd: puzzleData.image || '',
              title: puzzleData.name || '',
              brand: puzzleData.brand || '',
              piece_count: puzzleData.pieces || 0,
              category_tag: 'Autre',
              socialScore: 0,
              wishlistCount: 0,
              added_count: 1,
              total_likes: 0,
              total_dislikes: 0
            };
            
            const newCatalogEntry = await base44.entities.PuzzleCatalog.create(catalogData);
            catalogPuzzleId = newCatalogEntry.id;
            toast.success('🎉 Nouveau puzzle ajouté à la collection communautaire !');
          } catch (catalogError) {
            const retry = await base44.entities.PuzzleCatalog.filter({ asin: asinToCheck });
            if (retry.length > 0) {
              catalogPuzzleId = retry[0].id;
            }
          }
        }
      }
      
      const statusMapping = {
        'liked': 'done',
        'not_liked': 'done',
        'wishlist': 'wishlist',
        'inbox': 'inbox'
      };

      const puzzleToCreate = {
        puzzle_name: puzzleData.name || '',
        puzzle_brand: puzzleData.brand || '',
        puzzle_pieces: puzzleData.pieces || 0,
        image_url: puzzleData.image || '',
        puzzle_reference: asinToCheck || '',
        catalog_puzzle_id: catalogPuzzleId,
        status: statusMapping[selectedStatus] || 'inbox'
      };
      
      await base44.entities.UserPuzzle.create(puzzleToCreate);
      
      if (catalogPuzzleId) {
        const catalog = await base44.entities.PuzzleCatalog.filter({ id: catalogPuzzleId });
        if (catalog.length > 0) {
          const puzzle = catalog[0];
          
          if (selectedStatus === 'liked') {
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              socialScore: (puzzle.socialScore || 0) + 1,
              total_likes: (puzzle.total_likes || 0) + 1
            });
          } else if (selectedStatus === 'not_liked') {
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              socialScore: (puzzle.socialScore || 0) - 1,
              total_dislikes: (puzzle.total_dislikes || 0) + 1
            });
          } else if (selectedStatus === 'wishlist') {
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              wishlistCount: (puzzle.wishlistCount || 0) + 1
            });
          }
        }
      }
      
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['userPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['completedPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['wishlistPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['globalPuzzles'] });
    } catch (error) {
      console.error('Error adding puzzle:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleClose = () => {
    setPuzzleData(null);
    setShowSuccess(false);
    setSelectedStatus('');
    setMode(null);
    setBarcodeCode('');
    setManualData({ name: '', brand: '', pieces: '', image: '', sku: '' });
    onClose();
  };

  const handleReset = () => {
    setPuzzleData(null);
    setShowSuccess(false);
    setSelectedStatus('');
    setMode(null);
    setBarcodeCode('');
    setManualData({ name: '', brand: '', pieces: '', image: '', sku: '' });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Ajouter un Puzzle</DialogTitle>
        </DialogHeader>

        {!mode && !puzzleData && !showSuccess && (
          <div className="space-y-3 mt-4">
            <button
              onClick={() => setMode('barcode')}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white"
            >
              <Code2 className="w-5 h-5" />
              <span className="font-medium">Entrer le code-barres (ASIN/EAN)</span>
            </button>
            <button
              onClick={() => setMode('manual')}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="font-medium">Saisir manuellement</span>
            </button>
          </div>
        )}

        {mode === 'barcode' && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Code ASIN ou EAN</label>
              <Input
                placeholder="Ex: B00ABC1234"
                value={barcodeCode}
                onChange={(e) => setBarcodeCode(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <Button
              onClick={handleBarcodeSubmit}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recherche...
                </>
              ) : (
                'Rechercher'
              )}
            </Button>
            <Button
              onClick={() => setMode(null)}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/5"
            >
              Retour
            </Button>
          </div>
        )}

        {mode === 'manual' && !puzzleData && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Nom du Puzzle *</label>
              <Input
                placeholder="Ex: Tour Eiffel au coucher de soleil"
                value={manualData.name}
                onChange={(e) => setManualData({...manualData, name: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Marque</label>
              <Input
                placeholder="Ex: Ravensburger"
                value={manualData.brand}
                onChange={(e) => setManualData({...manualData, brand: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Nombre de Pièces *</label>
              <Input
                type="number"
                placeholder="Ex: 1000"
                value={manualData.pieces}
                onChange={(e) => setManualData({...manualData, pieces: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Image URL</label>
              <Input
                placeholder="https://..."
                value={manualData.image}
                onChange={(e) => setManualData({...manualData, image: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Référence / SKU</label>
              <Input
                placeholder="Ex: 12345678"
                value={manualData.sku}
                onChange={(e) => setManualData({...manualData, sku: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <Button
              onClick={handleManualDataSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Continuer
            </Button>
            <Button
              onClick={() => setMode(null)}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/5"
            >
              Retour
            </Button>
          </div>
        )}

        {puzzleData && !showSuccess && !skipCollectionAdd && (
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.4 }}
              className="rounded-lg overflow-hidden border border-white/10 bg-black/20 relative"
            >
              {puzzleData.image ? (
                <img 
                  src={puzzleData.image} 
                  alt={puzzleData.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-white/5">
                  <ImageIcon className="w-12 h-12 text-white/30" />
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="space-y-3"
            >
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <label className="text-white/50 text-xs mb-1 block">Nom du puzzle</label>
                <p className="text-white text-sm leading-relaxed break-words">{puzzleData.name || 'Non renseigné'}</p>
              </div>

              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <label className="text-white/50 text-xs mb-1 block">Marque</label>
                <p className="text-white text-sm">{puzzleData.brand || 'Non renseigné'}</p>
              </div>

              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <label className="text-white/50 text-xs mb-1 block">Nombre de pièces</label>
                <p className="text-white text-sm">{puzzleData.pieces ? `${puzzleData.pieces} pièces` : 'Non renseigné'}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm text-white/70 mb-3 block">Que pensez-vous de ce puzzle?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('liked')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedStatus === 'liked'
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-green-500/50 hover:bg-green-500/10'
                    }`}
                  >
                    <span className="text-3xl">👍</span>
                    <span className="text-sm font-medium">J'ai aimé</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('not_liked')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedStatus === 'not_liked'
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-red-500/50 hover:bg-red-500/10'
                    }`}
                  >
                    <span className="text-3xl">👎</span>
                    <span className="text-sm font-medium">Pas aimé</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('wishlist')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedStatus === 'wishlist'
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-yellow-500/50 hover:bg-yellow-500/10'
                    }`}
                  >
                    <span className="text-3xl">⭐</span>
                    <span className="text-sm font-medium">Wishlist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('inbox')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedStatus === 'inbox'
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-blue-500/50 hover:bg-blue-500/10'
                    }`}
                  >
                    <span className="text-3xl">📦</span>
                    <span className="text-sm font-medium">Dans sa boîte</span>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleAddPuzzle}
                disabled={!selectedStatus}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valider l'ajout
              </Button>
            </motion.div>
          </div>
        )}

        {showSuccess && (
          <div className="space-y-6 py-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center items-center mb-6 relative h-24"
            >
              <motion.div
                initial={{ x: -100, rotate: -15 }}
                animate={{ x: 0, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
                className="text-6xl absolute"
                style={{ left: 'calc(50% - 48px)' }}
              >
                🧩
              </motion.div>

              <motion.div
                initial={{ x: 100, rotate: 15 }}
                animate={{ x: 0, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
                className="text-6xl absolute"
                style={{ right: 'calc(50% - 48px)' }}
              >
                🧩
              </motion.div>

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400"
                style={{ filter: 'blur(20px)' }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Puzzle ajouté !</h3>
              <p className="text-white/60 mb-6">Votre collection a été mise à jour</p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleReset}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  ➕ Ajouter un autre puzzle
                </Button>

                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/5"
                >
                  ✓ Terminer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
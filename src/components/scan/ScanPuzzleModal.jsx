import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, Barcode, Edit, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ScanPuzzleModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('scanner');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [manualData, setManualData] = useState({
    name: '',
    brand: '',
    pieces: '',
    image: '',
    sku: ''
  });
  
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (open && activeTab === 'scanner' && !scanning) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [open, activeTab]);

  const startScanner = async () => {
    try {
      setScanning(true);
      const html5QrcodeScanner = new Html5Qrcode("reader");
      html5QrcodeScannerRef.current = html5QrcodeScanner;

      await html5QrcodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 }
        },
        async (decodedText) => {
          await html5QrcodeScanner.stop();
          setScanning(false);
          await fetchPuzzleData(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setScanning(false);
      toast.error('Impossible de démarrer la caméra');
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeScannerRef.current && scanning) {
      try {
        await html5QrcodeScannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const fetchPuzzleData = async (barcode) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.rainforestapi.com/request?api_key=6DA586EEF04D4AFA912388EA8A29547F&type=product&amazon_domain=amazon.fr&gtin=${barcode}`
      );
      
      const data = await response.json();
      
      if (data.product) {
        const product = data.product;
        
        // Extract pieces count from title using regex
        const piecesMatch = product.title?.match(/(\d+)\s*(pièces?|pieces?)/i);
        const pieces = piecesMatch ? parseInt(piecesMatch[1]) : null;
        
        setPuzzleData({
          name: product.title || '',
          brand: product.brand || '',
          image: product.main_image?.link || '',
          link: product.link ? `${product.link}&tag=MON_PUZZLE_ID-21` : '',
          sku: product.model_number || barcode,
          pieces: pieces
        });
      } else {
        toast.error('Produit non trouvé');
      }
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Erreur lors de la recherche du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualData.name || !manualData.pieces) {
      toast.error('Veuillez remplir au moins le nom et le nombre de pièces');
      return;
    }
    
    setPuzzleData({
      name: manualData.name,
      brand: manualData.brand,
      pieces: parseInt(manualData.pieces),
      image: manualData.image,
      sku: manualData.sku
    });
  };

  const handleAddToWishlist = async () => {
    try {
      await base44.entities.UserPuzzle.create({
        puzzle_name: puzzleData.name,
        puzzle_brand: puzzleData.brand,
        puzzle_pieces: puzzleData.pieces,
        image_url: puzzleData.image,
        puzzle_reference: puzzleData.sku,
        status: 'wishlist'
      });
      
      toast.success('Ajouté aux souhaits');
      handleClose();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleAddToCollection = () => {
    setShowRating(true);
  };

  const handleConfirmRating = async () => {
    if (rating === 0) {
      toast.error('Veuillez donner une note');
      return;
    }

    try {
      await base44.entities.UserPuzzle.create({
        puzzle_name: puzzleData.name,
        puzzle_brand: puzzleData.brand,
        puzzle_pieces: puzzleData.pieces,
        image_url: puzzleData.image,
        puzzle_reference: puzzleData.sku,
        status: 'inbox',
        notes: `Note: ${rating}/5`
      });
      
      toast.success('Ajouté à votre collection');
      handleClose();
      
      // Redirect to collection page
      setTimeout(() => {
        window.location.href = '/Collection';
      }, 500);
    } catch (error) {
      console.error('Error adding to collection:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleClose = () => {
    stopScanner();
    setPuzzleData(null);
    setShowRating(false);
    setRating(0);
    setManualData({ name: '', brand: '', pieces: '', image: '', sku: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Ajouter un Puzzle</DialogTitle>
        </DialogHeader>

        {!puzzleData && !showRating && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10 w-full">
              <TabsTrigger 
                value="scanner" 
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1"
              >
                <Barcode className="w-4 h-4 mr-2" />
                Scanner
              </TabsTrigger>
              <TabsTrigger 
                value="manual"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Saisie Manuelle
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scanner" className="mt-4">
              <div className="space-y-4">
                <div 
                  id="reader" 
                  ref={scannerRef}
                  className="w-full rounded-lg overflow-hidden bg-black/50 border border-white/10"
                  style={{ minHeight: '300px' }}
                />
                
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                    <span className="ml-2 text-white/70">Recherche en cours...</span>
                  </div>
                )}
                
                <p className="text-white/50 text-sm text-center">
                  Positionnez le code-barres devant la caméra
                </p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <div className="space-y-4">
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
                  onClick={handleManualSubmit}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  Continuer
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {puzzleData && !showRating && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-white/10">
              <img 
                src={puzzleData.image || 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400&h=400&fit=crop'} 
                alt={puzzleData.name}
                className="w-full h-64 object-cover"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                value={puzzleData.name}
                onChange={(e) => setPuzzleData({...puzzleData, name: e.target.value})}
                className="bg-white/5 border-white/10 text-white text-lg font-semibold"
              />
              <div className="flex gap-2 text-white/60 text-sm">
                {puzzleData.brand && <span>{puzzleData.brand}</span>}
                {puzzleData.pieces && <span>• {puzzleData.pieces} pièces</span>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddToWishlist}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/5"
              >
                Ajouter à ma Wishlist
              </Button>
              <Button
                onClick={handleAddToCollection}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Ajouter à ma Collection
              </Button>
            </div>
          </div>
        )}

        {showRating && (
          <div className="space-y-6 text-center py-4">
            <h3 className="text-xl font-semibold text-white">
              Quelle note donnes-tu à ce puzzle ?
            </h3>
            
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= rating 
                        ? 'fill-orange-400 text-orange-400' 
                        : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
            </div>

            <Button
              onClick={handleConfirmRating}
              disabled={rating === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
            >
              Confirmer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
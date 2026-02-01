import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, Barcode, Edit, Star, Image as ImageIcon } from 'lucide-react';
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
  const [cameraReady, setCameraReady] = useState(false);
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
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [open]);

  const handleActivateCamera = async () => {
    setCameraReady(true);
    try {
      setScanning(true);
      
      // Wait a bit for the DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html5QrcodeScanner = new Html5Qrcode("reader");
      html5QrcodeScannerRef.current = html5QrcodeScanner;

      await html5QrcodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          formatsToSupport: [ 
            Html5QrcodeSupportedFormats.EAN_13, 
            Html5QrcodeSupportedFormats.EAN_8 
          ]
        },
        async (decodedText) => {
          console.log("Code détecté : " + decodedText);
          
          // Vibrate if available
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          
          // Stop scanner immediately
          try {
            await html5QrcodeScanner.stop();
          } catch (e) {
            console.log("Error stopping scanner:", e);
          }
          
          setScanning(false);
          setCameraReady(false);
          
          // Start API fetch
          await fetchPuzzleData(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setScanning(false);
      setCameraReady(false);
      toast.error('Impossible de démarrer la caméra. Vérifiez les permissions.');
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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("🖥️ Tentative de scan sur Desktop...", { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });

    // Reset file input
    e.target.value = '';

    // FORCER l'arrêt de la caméra pour libérer les ressources PC
    if (cameraReady || scanning) {
      console.log("🛑 Arrêt du flux caméra avant upload...");
      await stopScanner();
      setCameraReady(false);
      setScanning(false);
    }

    // VERROUILLER la modale en mode chargement
    setLoading(true);
    setShowBarcodeInput(false);
    toast.info('Analyse du code-barres en cours...', { duration: 10000 });

    // Timer de secours pour PC (2 secondes)
    const fallbackTimer = setTimeout(() => {
      if (loading && !puzzleData) {
        console.warn("⏱️ Timeout de scan - activation du mode secours");
        setLoading(false);
        setShowBarcodeInput(true);
        toast.warning('Code-barres introuvable. Saisis les 13 chiffres manuellement.');
      }
    }, 2000);

    try {
      // Normaliser l'image pour optimiser la lecture sur PC
      const processedFile = await normalizeImageForScan(file);
      console.log("✅ Image normalisée pour le scan");

      // Create a temporary scanner instance for file scanning
      const tempScanner = new Html5Qrcode("file-reader-temp");
      
      console.log("🔍 Tentative de décodage avec html5-qrcode...");
      const decodedText = await tempScanner.scanFile(processedFile, true);
      
      clearTimeout(fallbackTimer);
      console.log("✅ Code EAN détecté depuis l'image : " + decodedText);
      
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      toast.success('Code-barres détecté ! Recherche en cours...', { duration: 3000 });
      
      // NE PAS arrêter le loading ici - fetchPuzzleData le fera
      await fetchPuzzleData(decodedText);
      
    } catch (error) {
      clearTimeout(fallbackTimer);
      console.error('❌ Erreur lors du scan de l\'image:', error);
      setLoading(false);
      
      // Activer le mode secours avec saisie manuelle
      setShowBarcodeInput(true);
      toast.error('Code-barres introuvable. Tape les 13 chiffres ci-dessous.');
    }
  };

  const handleBarcodeInputChange = (value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 13);
    setBarcodeInput(cleanValue);
    
    // Auto-lancer la recherche dès 13 chiffres saisis
    if (cleanValue.length === 13) {
      console.log("✅ 13 chiffres saisis, lancement auto de la recherche");
      setShowBarcodeInput(false);
      setBarcodeInput('');
      fetchPuzzleData(cleanValue);
    }
  };

  const normalizeImageForScan = (file) => {
    return new Promise((resolve, reject) => {
      console.log("📐 Normalisation de l'image pour le scan PC...");
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Redimensionner pour optimiser la lecture (max 800px pour scan)
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          
          // Dessiner l'image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Augmenter le contraste pour améliorer la lecture du code-barres
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const contrast = 1.5;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          
          for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;     // R
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              reject(new Error('Échec de la conversion canvas'));
            }
          }, 'image/jpeg', 0.95);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fetchPuzzleData = async (barcode) => {
    // Le loading est déjà à true depuis handleFileSelect ou le scan caméra
    console.log("🔍 Recherche API pour le code-barres:", barcode);
    toast.info('Recherche du puzzle en cours...', { duration: 5000 });
    
    try {
      const response = await fetch(
        `https://api.rainforestapi.com/request?api_key=6DA586EEF04D4AFA912388EA8A29547F&type=product&amazon_domain=amazon.fr&gtin=${barcode.trim()}`
      );
      
      if (!response.ok) {
        throw new Error(`API HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📦 Réponse API complète:", data);
      
      if (data.product) {
        const product = data.product;
        
        // Extract pieces count from title using regex
        const piecesMatch = product.title?.match(/(\d+)\s*(pièces?|pieces?)/i);
        const pieces = piecesMatch ? parseInt(piecesMatch[1]) : null;
        
        // SÉCURITÉ: Garantir une image - fallback générique
        let imageUrl = product.main_image?.link || product.images?.[0]?.link || '';
        if (!imageUrl) {
          imageUrl = 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400&h=400&fit=crop';
          console.warn("⚠️ Aucune image API, utilisation image par défaut");
        }
        console.log("🖼️ Image URL finale:", imageUrl);
        
        const puzzleInfo = {
          name: product.title || 'Puzzle sans titre',
          brand: product.brand || '',
          image: imageUrl,
          link: product.link ? `${product.link}&tag=MON_PUZZLE_ID-21` : '',
          sku: product.model_number || barcode,
          pieces: pieces
        };
        
        console.log("✅ Données puzzle créées:", puzzleInfo);
        
        // FORCER l'affichage du résultat
        setPuzzleData(puzzleInfo);
        setLoading(false);
        
        toast.success('Puzzle trouvé !');
      } else {
        console.error("❌ Aucun produit dans la réponse API");
        toast.error('Produit non trouvé dans la base de données');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Erreur API:', error);
      toast.error('Erreur lors de la recherche du produit');
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
    // Empêcher la fermeture si en cours de chargement
    if (loading) {
      toast.warning('Veuillez patienter pendant l\'analyse...');
      return;
    }
    
    stopScanner();
    setPuzzleData(null);
    setShowRating(false);
    setRating(0);
    setCameraReady(false);
    setLoading(false);
    setShowBarcodeInput(false);
    setBarcodeInput('');
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
                {/* Hidden div for file scanning */}
                <div id="file-reader-temp" style={{ display: 'none' }}></div>
                
                {!cameraReady && !loading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center">
                      <Barcode className="w-12 h-12 text-orange-400" />
                    </div>
                    <Button
                      onClick={handleActivateCamera}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      📸 Activer la Caméra
                    </Button>
                    <div className="text-white/50 text-sm text-center">ou</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/5"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Choisir une photo
                    </Button>
                    <p className="text-white/50 text-sm text-center max-w-sm">
                      Scannez en direct ou importez une photo du code-barres
                    </p>
                  </div>
                )}
                
                {cameraReady && (
                  <>
                    <div 
                      id="reader" 
                      ref={scannerRef}
                      className="w-full rounded-lg overflow-hidden bg-black/50 border border-white/10"
                      style={{ minHeight: '300px' }}
                    />
                    <p className="text-white/50 text-sm text-center">
                      Positionnez le code-barres devant la caméra
                    </p>
                  </>
                )}
                
                {loading && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <div className="bg-[#0a0a2e]/90 border border-white/10 rounded-2xl p-8 space-y-4 max-w-sm mx-4">
                      <Loader2 className="w-16 h-16 text-orange-400 animate-spin mx-auto" />
                      <div className="text-center">
                        <p className="text-white font-semibold text-lg mb-2">Analyse en cours...</p>
                        <p className="text-white/50 text-sm">Décodage du code-barres et recherche du puzzle</p>
                        <p className="text-orange-400/70 text-xs mt-3">Veuillez ne pas fermer cette fenêtre</p>
                      </div>
                    </div>
                  </div>
                )}

                {showBarcodeInput && !loading && (
                  <div className="space-y-4 py-6">
                    <div className="text-center mb-4">
                      <p className="text-white font-semibold mb-2">Code-barres introuvable</p>
                      <p className="text-white/60 text-sm">Tape les 13 chiffres du code-barres ci-dessous</p>
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="3 070900 123456"
                      value={barcodeInput}
                      onChange={(e) => handleBarcodeInputChange(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-wider font-mono"
                      autoFocus
                      maxLength={13}
                    />
                    <p className="text-white/40 text-xs text-center">
                      {barcodeInput.length}/13 chiffres • Recherche automatique à 13
                    </p>
                  </div>
                )}
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
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20 relative">
              {puzzleData.image ? (
                <img 
                  src={puzzleData.image} 
                  alt={puzzleData.name}
                  className="w-full h-64 object-cover"
                  onLoad={() => console.log("Image chargée avec succès:", puzzleData.image)}
                  onError={(e) => {
                    console.error("Erreur de chargement de l'image:", puzzleData.image);
                    e.target.src = 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400&h=400&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-white/5">
                  <div className="text-center space-y-2">
                    <ImageIcon className="w-16 h-16 text-white/30 mx-auto" />
                    <p className="text-white/50 text-sm">Aucune image disponible</p>
                  </div>
                </div>
              )}
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
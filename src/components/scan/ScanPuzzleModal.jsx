import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, Barcode, Edit, Star, Image as ImageIcon, Check, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [barcodeInput, setBarcodeInput] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    // Reset file input
    e.target.value = '';

    // Stop camera if active
    if (cameraReady) {
      await stopScanner();
      setCameraReady(false);
      setScanning(false);
    }

    setLoading(true);
    toast.info('Analyse de l\'image en cours...');

    try {
      // Compress/resize image if too large (> 2MB)
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await compressImage(file);
      }

      // Create a temporary scanner instance for file scanning
      const tempScanner = new Html5Qrcode("file-reader-temp");
      
      const decodedText = await tempScanner.scanFile(processedFile, true);
      
      console.log("Code détecté depuis l'image : " + decodedText);
      
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      toast.success('Code-barres détecté !');
      await fetchPuzzleData(decodedText);
    } catch (error) {
      console.error('Error scanning file:', error);
      setLoading(false);
      
      // Basculer vers l'onglet manuel en cas d'échec
      toast.error('Code-barres illisible sur cette photo, merci de saisir les infos manuellement');
      setActiveTab('manual');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large (max 1500px)
          const maxDim = 1500;
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
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const cleanTitle = (title, brand, pieces) => {
    let cleanedTitle = title;
    
    // Enlever la marque du titre
    if (brand) {
      cleanedTitle = cleanedTitle.replace(new RegExp(brand, 'gi'), '').trim();
    }
    
    // Enlever le nombre de pièces
    if (pieces) {
      cleanedTitle = cleanedTitle.replace(/\d+\s*(pièces?|pieces?)/gi, '').trim();
    }
    
    // Enlever les dimensions (ex: 70x50, 70 x 50 cm, etc)
    cleanedTitle = cleanedTitle.replace(/\d+\s*[xX×]\s*\d+\s*(cm|mm)?/g, '').trim();
    
    // Nettoyer les tirets, virgules et espaces multiples
    cleanedTitle = cleanedTitle.replace(/^[\s\-,]+|[\s\-,]+$/g, '').replace(/\s+/g, ' ');
    
    return cleanedTitle;
  };

  const fetchPuzzleData = async (barcode) => {
    setLoading(true);
    toast.info('Recherche du puzzle en cours...');
    
    try {
      const response = await fetch(
        `https://api.rainforestapi.com/request?api_key=6DA586EEF04D4AFA912388EA8A29547F&type=product&amazon_domain=amazon.fr&gtin=${barcode}`
      );
      
      const data = await response.json();
      console.log("Réponse API complète:", data);
      
      if (data.product) {
        const product = data.product;
        
        // Extract pieces count from title using regex
        const piecesMatch = product.title?.match(/(\d+)\s*(pièces?|pieces?)/i);
        const pieces = piecesMatch ? parseInt(piecesMatch[1]) : null;
        
        // Extract dimensions from title (ex: 70x50, 70 x 50 cm)
        const dimensionsMatch = product.title?.match(/(\d+)\s*[xX×]\s*(\d+)\s*(cm|mm)?/);
        const dimensions = dimensionsMatch ? `${dimensionsMatch[1]} x ${dimensionsMatch[2]} cm` : '';
        
        // Sécurité pour l'image avec fallback
        let imageUrl = product.main_image?.link || product.images?.[0]?.link || '';
        if (!imageUrl) {
          imageUrl = 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400&h=400&fit=crop';
          console.warn("Aucune image trouvée, utilisation de l'image par défaut");
        }
        console.log("Image URL récupérée:", imageUrl);
        
        // Clean the title
        const cleanedName = cleanTitle(product.title || '', product.brand || '', pieces);
        
        const puzzleInfo = {
          name: cleanedName,
          brand: product.brand || '',
          image: imageUrl,
          link: product.link ? `${product.link}&tag=MON_PUZZLE_ID-21` : '',
          sku: product.model_number || barcode,
          pieces: pieces,
          dimensions: dimensions
        };
        
        console.log("Données puzzle créées:", puzzleInfo);
        setPuzzleData(puzzleInfo);
        
        toast.success('Puzzle trouvé !');
      } else {
        console.error("Aucun produit dans la réponse API");
        toast.error('Produit non trouvé');
        setLoading(false);
      }
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Erreur lors de la recherche du produit');
      setLoading(false);
    } finally {
      // S'assurer que loading est toujours arrêté
      if (!puzzleData) {
        setLoading(false);
      }
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
    setCameraReady(false);
    setManualData({ name: '', brand: '', pieces: '', image: '', sku: '' });
    setBarcodeInput('');
    setEditingField(null);
    onClose();
  };



  const handleBarcodeSubmit = async () => {
    if (barcodeInput.length !== 13) {
      toast.error('Le code-barres doit contenir 13 chiffres');
      return;
    }
    await fetchPuzzleData(barcodeInput);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Ajouter un Puzzle</DialogTitle>
        </DialogHeader>

        {!puzzleData && !showRating && (
          <>
            {isMobile ? (
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
                  <div className="flex flex-col items-center justify-center py-8 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center">
                      <Barcode className="w-12 h-12 text-orange-400" />
                    </div>
                    <Button
                      onClick={handleActivateCamera}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      📸 Activer la Caméra
                    </Button>

                    <div className="w-full max-w-sm">
                      <div className="text-white/50 text-sm text-center mb-3">ou saisir le code-barres</div>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="13 chiffres"
                          value={barcodeInput}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                            setBarcodeInput(value);
                          }}
                          className="bg-white/5 border-white/10 text-white text-center tracking-wider"
                          maxLength={13}
                        />
                        <Button
                          onClick={handleBarcodeSubmit}
                          disabled={barcodeInput.length !== 13}
                          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                        >
                          OK
                        </Button>
                      </div>
                    </div>
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
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
                    <p className="text-white font-semibold">Recherche du puzzle en cours...</p>
                    <p className="text-white/50 text-sm">Nous récupérons les informations</p>
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
            ) : (
              <div className="space-y-4 mt-4">
                <div className="text-center mb-6">
                  <Barcode className="w-16 h-16 text-orange-500 mx-auto mb-3" />
                  <h3 className="text-white text-lg font-semibold mb-1">Saisir le code-barres</h3>
                  <p className="text-white/60 text-sm">Entrez les 13 chiffres du code-barres</p>
                </div>

                {/* Visual guide */}
                <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                  <p className="text-white/70 text-xs text-center mb-3">Les chiffres se trouvent sous les barres :</p>
                  <div className="flex flex-col items-center gap-2">
                    {/* Barcode bars */}
                    <div className="flex gap-[2px] justify-center">
                      {[1,0,1,0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,0].map((bar, i) => (
                        <div 
                          key={i} 
                          className={`w-1 h-12 ${bar ? 'bg-black' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                    {/* Numbers with red box */}
                    <div className="relative">
                      <div className="absolute -top-1 -left-1 right-[-4px] bottom-[-4px] border-2 border-red-500 rounded animate-pulse"></div>
                      <div className="text-black font-mono text-sm tracking-wider bg-white px-2 py-1 rounded">
                        5 412345 678901
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="13 chiffres"
                    value={barcodeInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                      setBarcodeInput(value);
                    }}
                    className="bg-white/5 border-white/10 text-white text-center tracking-wider text-lg"
                    maxLength={13}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleBarcodeSubmit}
                    disabled={barcodeInput.length !== 13 || loading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-6"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'OK'}
                  </Button>
                </div>

                {loading && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
                    <p className="text-white font-semibold">Recherche du puzzle en cours...</p>
                  </div>
                )}
              </div>
            )}
            </>
            )}

        {puzzleData && !showRating && (
          <div className="space-y-4">
            {/* Image - Animation 1 */}
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

            {/* Nom - Animation 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className={`relative rounded-lg bg-white/5 border ${!puzzleData.name ? 'border-orange-500' : 'border-white/10'} p-3`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="text-white/50 text-xs mb-1 block">Nom du puzzle</label>
                  {editingField === 'name' ? (
                    <input
                      type="text"
                      value={puzzleData.name}
                      onChange={(e) => setPuzzleData({...puzzleData, name: e.target.value})}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="w-full bg-transparent text-white text-sm border-none outline-none"
                    />
                  ) : (
                    <p className="text-white text-sm leading-relaxed break-words">{puzzleData.name || 'Non renseigné'}</p>
                  )}
                  </div>
                  <button
                  onClick={() => setEditingField('name')}
                  className="flex-shrink-0 text-white/40 hover:text-orange-400 transition-colors"
                  >
                  <Edit2 className="w-4 h-4" />
                  </button>
              </div>
            </motion.div>

            {/* Marque - Animation 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative rounded-lg bg-white/5 border border-white/10 p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="text-white/50 text-xs mb-1 block">Marque</label>
                  {editingField === 'brand' ? (
                    <input
                      type="text"
                      value={puzzleData.brand}
                      onChange={(e) => setPuzzleData({...puzzleData, brand: e.target.value})}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="w-full bg-transparent text-white text-sm border-none outline-none"
                    />
                  ) : (
                    <p className="text-white text-sm">{puzzleData.brand || 'Non renseigné'}</p>
                  )}
                  </div>
                  <button
                  onClick={() => setEditingField('brand')}
                  className="flex-shrink-0 text-white/40 hover:text-orange-400 transition-colors"
                  >
                  <Edit2 className="w-4 h-4" />
                  </button>
              </div>
            </motion.div>

            {/* Pièces - Animation 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className={`relative rounded-lg bg-white/5 border ${!puzzleData.pieces ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-white/10'} p-3`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="text-white/50 text-xs mb-1 block">Nombre de pièces {!puzzleData.pieces && <span className="text-orange-400">*</span>}</label>
                  {editingField === 'pieces' ? (
                    <input
                      type="number"
                      value={puzzleData.pieces || ''}
                      onChange={(e) => setPuzzleData({...puzzleData, pieces: parseInt(e.target.value) || null})}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="w-full bg-transparent text-white text-sm border-none outline-none"
                    />
                  ) : (
                    <p className="text-white text-sm">{puzzleData.pieces ? `${puzzleData.pieces} pièces` : 'À remplir'}</p>
                  )}
                  </div>
                  <button
                  onClick={() => setEditingField('pieces')}
                  className="flex-shrink-0 text-white/40 hover:text-orange-400 transition-colors"
                  >
                  <Edit2 className="w-4 h-4" />
                  </button>
              </div>
            </motion.div>

            {/* Dimensions - Animation 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="relative rounded-lg bg-white/5 border border-white/10 p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="text-white/50 text-xs mb-1 block">Dimensions</label>
                  {editingField === 'dimensions' ? (
                    <input
                      type="text"
                      value={puzzleData.dimensions || ''}
                      onChange={(e) => setPuzzleData({...puzzleData, dimensions: e.target.value})}
                      onBlur={() => setEditingField(null)}
                      placeholder="Ex: 70 x 50 cm"
                      autoFocus
                      className="w-full bg-transparent text-white text-sm border-none outline-none"
                    />
                  ) : (
                    <p className="text-white text-sm">{puzzleData.dimensions || 'Non renseigné'}</p>
                  )}
                  </div>
                  <button
                  onClick={() => setEditingField('dimensions')}
                  className="flex-shrink-0 text-white/40 hover:text-orange-400 transition-colors"
                  >
                  <Edit2 className="w-4 h-4" />
                  </button>
              </div>
            </motion.div>

            {/* Boutons - Animation 6 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.4 }}
              className="flex flex-col gap-3 pt-2"
            >
              <Button
                onClick={handleAddToCollection}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                ✓ Confirmer et Noter
              </Button>
              <Button
                onClick={handleAddToWishlist}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/5"
              >
                Mettre en Wishlist
              </Button>
            </motion.div>
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
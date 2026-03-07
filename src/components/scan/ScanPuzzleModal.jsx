import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, Barcode, Edit, Star, Image as ImageIcon, Check, Edit2 } from 'lucide-react';
import ManualAddPuzzleModal from './ManualAddPuzzleModal';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Package } from 'lucide-react';

export default function ScanPuzzleModal({ open, onClose, onPuzzleAdded, skipCollectionAdd = false }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('scanner');
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [manualData, setManualData] = useState({
    name: '',
    brand: '',
    pieces: '',
    image: '',
    sku: ''
  });
  const [barcode, setBarcode] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [existingPuzzle, setExistingPuzzle] = useState(null);
  const [scanMessage, setScanMessage] = useState(null); // { type: 'error'|'community'|'pending'|'new', text: '' }
  const [puzzleConfirmed, setPuzzleConfirmed] = useState(false);
  const [showNotMyPuzzle, setShowNotMyPuzzle] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
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

  const fetchPuzzleData = async (code) => {
    setBarcode(code);
    setLoading(true);
    setPuzzleData(null);
    setExistingPuzzle(null);
    setScanMessage(null);

    // ÉTAPE 1 : Vérifier si déjà dans la collection personnelle de l'utilisateur
    if (!skipCollectionAdd) {
      try {
        const user = await base44.auth.me();
        const existingInCollection = await base44.entities.UserPuzzle.filter({
          puzzle_reference: code,
          created_by: user.email
        });
        if (existingInCollection.length > 0) {
          setScanMessage({ type: 'error', text: '⚠️ Vous possédez déjà ce puzzle dans votre collection !' });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking user collection:', err);
      }
    }

    // ÉTAPE 2 : Vérification dans la base catalogue (avant d'appeler Rainforest)
    try {
      const existingInCatalog = await base44.entities.PuzzleCatalog.filter({ ean: code });
      if (existingInCatalog.length > 0) {
        const catalogPuzzle = existingInCatalog[0];
        const isCommunity = catalogPuzzle.status === 'active';
        setScanMessage({
          type: 'community',
          text: isCommunity
            ? '✨ Super ! Ce puzzle fait déjà partie de la collection communautaire.'
            : '🕐 Ce puzzle est déjà connu mais en attente de validation par notre équipe.'
        });
        setExistingPuzzle(catalogPuzzle);
        const puzzleInfo = {
          catalog_id: catalogPuzzle.id,
          name: catalogPuzzle.title,
          title: catalogPuzzle.title,
          brand: catalogPuzzle.brand,
          image: catalogPuzzle.image_hd,
          image_hd: catalogPuzzle.image_hd,
          pieces: catalogPuzzle.piece_count,
          piece_count: catalogPuzzle.piece_count,
          asin: catalogPuzzle.asin,
          ean: catalogPuzzle.ean || code,
          sku: catalogPuzzle.asin || code,
          category_tag: catalogPuzzle.category_tag,
          amazon_price: catalogPuzzle.amazon_price,
          amazon_rating: catalogPuzzle.amazon_rating,
          link: catalogPuzzle.asin ? `https://www.amazon.fr/dp/${catalogPuzzle.asin}?tag=puzzleworld-21` : '',
        };
        setPuzzleData(puzzleInfo);
        setLoading(false);
        if (skipCollectionAdd && onPuzzleAdded) onPuzzleAdded(puzzleInfo);
        return;
      }
    } catch (err) {
      console.error('Error checking catalog:', err);
    }

    // ÉTAPE 3 : Puzzle inconnu → appel Rainforest via backend
    try {
      let response;
      try {
        response = await base44.functions.invoke('lookupPuzzleByEan', { ean: code });
      } catch (axiosError) {
        const errData = axiosError?.response?.data;
        if (errData?.error === 'not_a_puzzle') {
          setScanMessage({ type: 'error', text: '🚫 ' + errData.message });
          setLoading(false);
          return;
        }
        if (errData?.error && (errData.error.includes('non trouvé') || errData.error.includes('introuvable') || axiosError?.response?.status === 404)) {
          setScanMessage({ type: 'error', text: '😕 Désolé, ce puzzle n\'est pas encore dans notre base. Ajoutez-le manuellement !' });
          setActiveTab('manual');
        } else {
          setScanMessage({ type: 'error', text: '😴 Désolé, notre scanner est fatigué ! Réessayez dans quelques secondes ou ajoutez manuellement.' });
          setActiveTab('manual');
        }
        setLoading(false);
        return;
      }

      const result = response.data;

      if (result.error) {
        if (result.error === 'not_a_puzzle') {
          setScanMessage({ type: 'error', text: '🚫 ' + result.message });
          setLoading(false);
          return;
        }
        if (result.error.includes('trouvé') || result.error.includes('introuvable')) {
          setScanMessage({ type: 'error', text: '😕 Désolé, ce puzzle n\'est pas encore dans notre base. Ajoutez-le manuellement !' });
          setActiveTab('manual');
        } else {
          setScanMessage({ type: 'error', text: '😴 Désolé, notre scanner est fatigué ! Réessayez dans quelques secondes.' });
        }
        setLoading(false);
        return;
      }

      // ÉTAPE 4 : Puzzle trouvé → pas de message ici, il sera affiché après validation
      const puzzleInfo = {
        catalog_id: result.catalog_id,
        name: result.title,
        title: result.title,
        brand: result.brand,
        image: result.image_hd,
        image_hd: result.image_hd,
        pieces: result.piece_count,
        piece_count: result.piece_count,
        asin: result.asin,
        ean: result.ean || code,
        sku: result.asin || code,
        dimensions: result.dimensions || '',
        category_tag: result.category_tag,
        amazon_price: result.amazon_price,
        amazon_rating: result.amazon_rating,
        link: result.asin ? `https://www.amazon.fr/dp/${result.asin}?tag=puzzleworld-21` : '',
        isPending: result.source === 'rainforest_new',
      };

      setPuzzleData(puzzleInfo);
      setLoading(false);

      if (skipCollectionAdd && onPuzzleAdded) onPuzzleAdded(puzzleInfo);
    } catch (error) {
      console.error('fetchPuzzleData error:', error);
      setScanMessage({ type: 'error', text: '😴 Désolé, notre scanner est fatigué ! Réessayez dans quelques secondes.' });
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
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
    
    // If in post mode, call callback immediately
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
      // Si nouveau puzzle (pas encore dans le catalogue), créer l'entrée avec status pending
      let catalogPuzzleId = puzzleData.catalog_id || null;
      if (!catalogPuzzleId && puzzleData.isPending) {
        const newEntry = await base44.entities.PuzzleCatalog.create({
          title: puzzleData.title || puzzleData.name,
          brand: puzzleData.brand || '',
          piece_count: puzzleData.piece_count || puzzleData.pieces || 0,
          image_hd: puzzleData.image_hd || puzzleData.image || '',
          ean: puzzleData.ean || '',
          asin: puzzleData.asin || '',
          category_tag: puzzleData.category_tag || 'Autre',
          amazon_price: puzzleData.amazon_price || null,
          amazon_rating: puzzleData.amazon_rating || null,
          status: 'pending',
        });
        catalogPuzzleId = newEntry.id;
      }
      const refCode = puzzleData.ean || puzzleData.asin || puzzleData.sku || barcode;

      const statusMapping = { liked: 'done', not_liked: 'done', wishlist: 'wishlist', inbox: 'inbox' };

      // Ajouter à la collection personnelle
      await base44.entities.UserPuzzle.create({
        puzzle_name: puzzleData.name || puzzleData.title || '',
        puzzle_brand: puzzleData.brand || '',
        puzzle_pieces: puzzleData.pieces || puzzleData.piece_count || 0,
        image_url: puzzleData.image || puzzleData.image_hd || '',
        puzzle_reference: refCode,
        catalog_puzzle_id: catalogPuzzleId,
        status: statusMapping[selectedStatus] || 'inbox',
        notes: selectedStatus === 'not_liked' ? 'Non aimé' : '',
      });

      // Mettre à jour les scores dans PuzzleCatalog
      if (catalogPuzzleId) {
        const catalogEntries = await base44.entities.PuzzleCatalog.filter({ id: catalogPuzzleId });
        if (catalogEntries.length > 0) {
          const cat = catalogEntries[0];
          const updates = { added_count: (cat.added_count || 0) + 1 };
          if (selectedStatus === 'liked') {
            updates.socialScore = (cat.socialScore || 0) + 1;
            updates.total_likes = (cat.total_likes || 0) + 1;
          } else if (selectedStatus === 'not_liked') {
            updates.socialScore = (cat.socialScore || 0) - 1;
            updates.total_dislikes = (cat.total_dislikes || 0) + 1;
          } else if (selectedStatus === 'wishlist') {
            updates.wishlistCount = (cat.wishlistCount || 0) + 1;
          }
          await base44.entities.PuzzleCatalog.update(catalogPuzzleId, updates);
        }
      }

      // XP bonus pour "aimé"
      if (selectedStatus === 'liked') {
        const user = await base44.auth.me();
        await base44.auth.updateMe({ xp: (user.xp || 0) + 100 });
      }

      setShowSuccess(true);
      toast.success('✅ Puzzle ajouté à votre collection !');
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
    stopScanner();
    setPuzzleData(null);
    setShowSuccess(false);
    setCameraReady(false);
    setSelectedStatus('');
    setBarcode('');
    setManualData({ name: '', brand: '', pieces: '', image: '', sku: '' });
    setBarcodeInput('');
    setExistingPuzzle(null);
    setScanMessage(null);
    setActiveTab(isMobile ? 'scanner' : 'manual');
    onClose();
  };

  const handleReset = () => {
    setPuzzleData(null);
    setShowSuccess(false);
    setSelectedStatus('');
    setBarcode('');
    setManualData({ name: '', brand: '', pieces: '', image: '', sku: '' });
    setBarcodeInput('');
    setExistingPuzzle(null);
    setScanMessage(null);
    setPuzzleConfirmed(false);
    setShowNotMyPuzzle(false);
    setActiveTab(isMobile ? 'scanner' : 'manual');
  };

  const handleNotMyPuzzle = () => {
    setShowNotMyPuzzle(true);
  };

  const handleGoManual = () => {
    setShowManualModal(true);
    setShowNotMyPuzzle(false);
  };

  const handleManualModalSubmit = (newPuzzleData) => {
    setShowManualModal(false);
    setShowNotMyPuzzle(false);
    setScanMessage(null);
    setPuzzleData(newPuzzleData);
    setPuzzleConfirmed(true);
  };



  const handleBarcodeSubmit = async () => {
    if (barcodeInput.length !== 13) {
      toast.error('Le code-barres doit contenir 13 chiffres');
      return;
    }
    await fetchPuzzleData(barcodeInput);
  };

  return (
    <div>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Ajouter un Puzzle</DialogTitle>
        </DialogHeader>

        {/* Message d'état (erreur, communauté, nouveau) — affiché quand pas de puzzleData visible */}
        {!puzzleData && !showSuccess && scanMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 text-center text-sm font-medium border ${
              scanMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : scanMessage.type === 'community'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
            }`}
          >
            {scanMessage.text}
          </motion.div>
        )}

        {!puzzleData && !showSuccess && (
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
                        <div className="flex-1">
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
                        </div>
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
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="13 chiffres"
                      value={barcodeInput}
                      onChange={async (e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                        setBarcodeInput(value);
                      }}
                      className="bg-white/5 border-white/10 text-white text-center tracking-wider text-lg"
                      maxLength={13}
                      disabled={loading}
                    />
                  </div>
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

        {puzzleData && !showSuccess && !skipCollectionAdd && (
          <div className="space-y-4">
            {/* Image */}
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

            {/* Badge statut puzzle */}
            {scanMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className={`rounded-xl p-4 text-center text-sm font-medium border ${
                  scanMessage.type === 'community'
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                }`}
              >
                {scanMessage.text}
              </motion.div>
            )}

            {/* Informations du puzzle */}
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
              {puzzleData.dimensions && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <label className="text-white/50 text-xs mb-1 block">Dimensions</label>
                  <p className="text-white text-sm">{puzzleData.dimensions}</p>
                </div>
              )}
            </motion.div>

            {/* Étape de confirmation */}
            {showNotMyPuzzle ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 bg-orange-500/5 border border-orange-500/20 rounded-xl p-5"
              >
                <div className="text-center">
                  <span className="text-3xl mb-3 block">🤔</span>
                  <p className="text-white font-semibold mb-1">Ce puzzle ne correspond pas ?</p>
                  <p className="text-white/50 text-sm">Vous pouvez l'ajouter manuellement avec les bonnes informations. Il sera mis en attente de validation.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleGoManual}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    ✏️ Ajouter manuellement
                  </Button>
                  <Button
                    onClick={() => setShowNotMyPuzzle(false)}
                    variant="ghost"
                    className="w-full text-white/50 hover:text-white hover:bg-white/5 text-sm"
                  >
                    ← Retour
                  </Button>
                </div>
              </motion.div>
            ) : !puzzleConfirmed ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="space-y-3"
              >
                <p className="text-white/70 text-sm text-center font-medium">C'est bien votre puzzle ?</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setPuzzleConfirmed(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    ✅ Oui, c'est lui !
                  </Button>
                  <Button
                    onClick={handleNotMyPuzzle}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                  >
                    ❌ Non, ce n'est pas lui
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* Status Selection */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
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
            )}
          </div>
        )}

        {showSuccess && (
          <div className="space-y-6 py-8">
            {/* Icône puzzle avec rebond */}
            <div className="flex justify-center items-center mb-6">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.1 }}
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/40"
              >
                <span className="text-5xl">🧩</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Puzzle ajouté !</h3>
              <p className="text-white/60 mb-2">Votre collection a été mise à jour</p>
              {puzzleData?.isPending && (
                <p className="text-yellow-400 text-sm mb-6">🎉 Merci d'avoir ajouté ce puzzle ! Il est en attente de validation par notre équipe avant d'apparaître dans le catalogue.</p>
              )}
              {!puzzleData?.isPending && <div className="mb-6" />}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleReset}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  📸 Scanner un autre puzzle
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

    {showManualModal && (
      <ManualAddPuzzleModal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSubmit={handleManualModalSubmit}
        prefillBarcode={barcode}
      />
    )}
    </div>
  );
}
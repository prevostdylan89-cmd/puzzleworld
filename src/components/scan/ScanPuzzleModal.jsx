import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, Barcode, Edit, Star, Image as ImageIcon, Check, Edit2 } from 'lucide-react';
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

  const checkExistingPuzzle = async (barcode) => {
    try {
      const existing = await base44.entities.PuzzleCatalog.filter({ asin: barcode });
      if (existing && existing.length > 0) {
        setExistingPuzzle(existing[0]);
        return existing[0];
      }
      return null;
    } catch (error) {
      console.error('Error checking existing puzzle:', error);
      return null;
    }
  };

  const fetchPuzzleData = async (code) => {
    setBarcode(code);
    setLoading(true);
    setPuzzleData(null);

    // Only check user collection if not in "post mode"
    if (!skipCollectionAdd) {
      try {
        const user = await base44.auth.me();
        const existingInCollection = await base44.entities.UserPuzzle.filter({
          puzzle_reference: code,
          created_by: user.email
        });

        if (existingInCollection.length > 0) {
          toast.error('Vous possédez déjà ce puzzle dans votre collection!');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking user collection:', error);
      }
    }

    // Check if puzzle already exists in global catalog
    const existing = await checkExistingPuzzle(code);
    if (existing) {
      toast.success('✨ Ce puzzle est déjà dans le catalogue communautaire !');
      
      // Use existing catalog data - preserve the original title
      const data = {
        name: existing.title,
        brand: existing.brand,
        image: existing.image_hd,
        link: existing.amazon_link,
        sku: existing.asin,
        asin: existing.asin,
        title: existing.title,
        image_hd: existing.image_hd,
        piece_count: existing.piece_count,
        pieces: existing.piece_count,
        dimensions: '',
        catalogId: existing.id // Store catalog ID for enrichment
      };
      setPuzzleData(data);
      setLoading(false);
      
      // If in post mode, call callback immediately
      if (skipCollectionAdd && onPuzzleAdded) {
        onPuzzleAdded(data);
      }
      return;
    }
    
    toast.info('Recherche du puzzle en cours...');
    
    try {
      const response = await base44.functions.invoke('scanPuzzleBarcode', { barcode: code });
      const data = response.data;

      console.log("Réponse scan:", data);

      if (!data.success) {
        toast.error(data.message || 'Produit non trouvé');
        setLoading(false);
        return;
      }

      if (data.product) {
        const product = data.product;

        // Clean the title
        const cleanedName = cleanTitle(product.title || '', product.brand, product.pieces);

        const puzzleInfo = {
          name: cleanedName,
          brand: product.brand || '',
          image: product.image_hd || '',
          link: product.link || '',
          sku: product.asin || code,
          asin: product.asin || code,
          title: cleanedName,
          image_hd: product.image_hd || '',
          piece_count: product.pieces,
          pieces: product.pieces,
          dimensions: product.dimensions || '',
          category_tag: product.category_tag || 'Autre',
          // Données pour PuzzleCatalog
          amazon_rating: product.rating || null,
          amazon_ratings_total: product.ratings_total || 0,
          amazon_price: product.price || null,
          description: product.description || product.title || ''
        };

        console.log("Données puzzle créées:", puzzleInfo);
        setPuzzleData(puzzleInfo);
        toast.success('Puzzle trouvé !');

        if (skipCollectionAdd && onPuzzleAdded) {
          onPuzzleAdded(puzzleInfo);
        }
      } else {
        toast.error('Produit non trouvé');
        setLoading(false);
      }
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Erreur lors de la recherche');
      setLoading(false);
    } finally {
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
      let catalogPuzzleId = null;
      
      // ÉTAPE 1: Vérification Globale - Chercher dans PuzzleCatalog par EAN/ASIN
      const asinToCheck = puzzleData.sku || puzzleData.asin || barcode;
      let isExistingInCatalog = false;

      if (asinToCheck) {
        const existingInCatalog = await base44.entities.PuzzleCatalog.filter({ asin: asinToCheck });

        if (existingInCatalog.length > 0) {
          // ACTION B: Le puzzle existe déjà dans la collection globale
          catalogPuzzleId = existingInCatalog[0].id;
          isExistingInCatalog = true;
          console.log('✓ Puzzle déjà dans la collection communautaire');
          toast.success('✨ Ce puzzle est déjà dans la collection communautaire !');

          // Enrichissement automatique : mettre à jour les champs manquants
          const updateData = {
            added_count: (existingInCatalog[0].added_count || 0) + 1
          };
          
          // Enrichir piece_count si manquant
          if (!existingInCatalog[0].piece_count && (puzzleData.pieces || puzzleData.piece_count)) {
            updateData.piece_count = puzzleData.pieces || puzzleData.piece_count;
            console.log('✓ Enrichissement: Ajout du nombre de pièces');
          }
          
          // Enrichir brand si manquant
          if (!existingInCatalog[0].brand && puzzleData.brand) {
            updateData.brand = puzzleData.brand;
            console.log('✓ Enrichissement: Ajout de la marque');
          }
          
          // Enrichir image_hd si manquante
          if (!existingInCatalog[0].image_hd && (puzzleData.image || puzzleData.image_hd)) {
            updateData.image_hd = puzzleData.image || puzzleData.image_hd;
            console.log('✓ Enrichissement: Ajout de l\'image HD');
          }
          
          // Enrichir amazon_link si manquant
          if (!existingInCatalog[0].amazon_link && puzzleData.link) {
            updateData.amazon_link = puzzleData.link;
            console.log('✓ Enrichissement: Ajout du lien Amazon');
          }
          
          // Enrichir dimensions si manquantes
          if (!existingInCatalog[0].dimensions && puzzleData.dimensions) {
            updateData.dimensions = puzzleData.dimensions;
            console.log('✓ Enrichissement: Ajout des dimensions');
          }
          
          // Enrichir données Amazon si disponibles
          if (!existingInCatalog[0].amazon_rating && puzzleData.amazon_rating) {
            updateData.amazon_rating = puzzleData.amazon_rating;
          }
          if (!existingInCatalog[0].amazon_ratings_total && puzzleData.amazon_ratings_total) {
            updateData.amazon_ratings_total = puzzleData.amazon_ratings_total;
          }
          if (!existingInCatalog[0].amazon_price && puzzleData.amazon_price) {
            updateData.amazon_price = puzzleData.amazon_price;
          }
          if (!existingInCatalog[0].description && puzzleData.description) {
            updateData.description = puzzleData.description;
          }
          
          await base44.entities.PuzzleCatalog.update(catalogPuzzleId, updateData);
        } else {
          // ACTION A: Nouveau puzzle - Créer dans la collection globale (Collection Communautaire)
          try {
            const catalogData = {
              asin: asinToCheck,
              image_hd: puzzleData.image || puzzleData.image_hd || '',
              title: puzzleData.name || puzzleData.title || '',
              brand: puzzleData.brand || '',
              piece_count: puzzleData.pieces || puzzleData.piece_count || 0,
              amazon_link: puzzleData.link || '',
              category_tag: puzzleData.category_tag || 'Autre',
              socialScore: 0,
              wishlistCount: 0,
              added_count: 1,
              total_likes: 0,
              total_dislikes: 0,
              amazon_rating: puzzleData.amazon_rating || null,
              amazon_ratings_total: puzzleData.amazon_ratings_total || 0,
              amazon_price: puzzleData.amazon_price || null,
              description: puzzleData.description || ''
            };
            
            const newCatalogEntry = await base44.entities.PuzzleCatalog.create(catalogData);
            catalogPuzzleId = newCatalogEntry.id;
            console.log('✓ Nouveau puzzle ajouté à la collection communautaire');
            toast.success('🎉 Nouveau puzzle ajouté à la collection communautaire !');
          } catch (catalogError) {
            // Protection contre race condition (2 users simultanés)
            console.log('Race condition détectée, récupération du puzzle existant...');
            const retry = await base44.entities.PuzzleCatalog.filter({ asin: asinToCheck });
            if (retry.length > 0) {
              catalogPuzzleId = retry[0].id;
            }
          }
        }
      }
      
      // FINALISATION: Ajouter à la collection personnelle (UserPuzzle)
      const statusMapping = {
        'liked': 'done',
        'not_liked': 'done',
        'wishlist': 'wishlist',
        'inbox': 'inbox'
      };

      const puzzleToCreate = {
        puzzle_name: puzzleData.name || puzzleData.title || '',
        puzzle_brand: puzzleData.brand || '',
        puzzle_pieces: puzzleData.pieces || puzzleData.piece_count || 0,
        image_url: puzzleData.image || puzzleData.image_hd || '',
        puzzle_reference: asinToCheck || '',
        catalog_puzzle_id: catalogPuzzleId,
        status: statusMapping[selectedStatus] || 'inbox',
        notes: selectedStatus === 'not_liked' ? 'Non aimé' : ''
      };
      
      await base44.entities.UserPuzzle.create(puzzleToCreate);
      
      // Update PuzzleCatalog scores based on status
      if (catalogPuzzleId) {
        const catalog = await base44.entities.PuzzleCatalog.filter({ id: catalogPuzzleId });
        if (catalog.length > 0) {
          const puzzle = catalog[0];
          
          if (selectedStatus === 'liked') {
            // Increment socialScore and total_likes
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              socialScore: (puzzle.socialScore || 0) + 1,
              total_likes: (puzzle.total_likes || 0) + 1
            });
          } else if (selectedStatus === 'not_liked') {
            // Decrement socialScore and increment total_dislikes
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              socialScore: (puzzle.socialScore || 0) - 1,
              total_dislikes: (puzzle.total_dislikes || 0) + 1
            });
          } else if (selectedStatus === 'wishlist') {
            // Increment wishlistCount
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              wishlistCount: (puzzle.wishlistCount || 0) + 1
            });
          }
        }
      }
      
      // Award XP if adding as liked
      if (selectedStatus === 'liked') {
        const user = await base44.auth.me();
        const currentXP = user.xp || 0;
        await base44.auth.updateMe({ xp: currentXP + 100 });
      }
      
      setShowSuccess(true);

      // Show appropriate success message
      if (isExistingInCatalog) {
        toast.success('✅ Puzzle ajouté à votre collection personnelle !');
      }

      // Refresh data in background
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
    setActiveTab(isMobile ? 'scanner' : 'manual');
  };



  const handleBarcodeSubmit = async () => {
      if (barcodeInput.length !== 13) {
        toast.error('Le code-barres doit contenir 13 chiffres');
        return;
      }
      await fetchPuzzleData(barcodeInput);
    };

    const handlePhotoSearch = async (e) => {
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
      toast.info('Analyse de la photo en cours...');

      try {
        const response = await base44.functions.invoke('searchPuzzleByImage', { image: file });
        const data = response.data;

        console.log("Réponse recherche par image:", data);

        if (!data.success) {
          toast.error(data.message || 'Aucun puzzle trouvé');
          setLoading(false);
          return;
        }

        if (data.product) {
          const product = data.product;

          // Sécurité pour l'image avec fallback
          let imageUrl = product.image_hd || '';
          if (!imageUrl) {
            imageUrl = 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400&h=400&fit=crop';
          }

          // Clean the title
          const cleanedName = cleanTitle(product.title || '', product.brand, product.pieces);

          const puzzleInfo = {
            name: cleanedName,
            brand: product.brand || '',
            image: imageUrl,
            link: product.link || '',
            sku: product.asin || '',
            asin: product.asin || '',
            title: cleanedName,
            image_hd: imageUrl,
            piece_count: product.pieces,
            pieces: product.pieces,
            dimensions: product.dimensions || '',
            category_tag: product.category_tag || 'Autre',
            rainforest_data: {
              rating: product.rating || null,
              ratings_total: product.ratings_total || 0,
              price: product.price || null,
              currency: 'EUR',
              description: product.description || product.title || '',
              features: []
            }
          };

          setPuzzleData(puzzleInfo);
          toast.success('Puzzle trouvé !');

          if (skipCollectionAdd && onPuzzleAdded) {
            onPuzzleAdded(puzzleInfo);
          }
        }
      } catch (error) {
        console.error('Erreur recherche par image:', error);
        toast.error('Erreur lors de la recherche');
      } finally {
        setLoading(false);
      }
    };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Ajouter un Puzzle</DialogTitle>
        </DialogHeader>

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

                        <div className="flex flex-col gap-3 w-full max-w-sm">
                          <Button
                            onClick={handleActivateCamera}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                          >
                            📸 Scanner le code-barres
                          </Button>

                          <div className="text-white/50 text-xs text-center">ou</div>

                          <Button
                            onClick={() => document.getElementById('photo-search-input')?.click()}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                          >
                            🖼️ Chercher par photo
                          </Button>
                          <input
                            id="photo-search-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoSearch}
                            className="hidden"
                          />
                        </div>

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
          <div className="flex flex-col max-h-[70vh]">
            {/* Contenu scrollable */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
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

              {/* Badge communauté si puzzle existant */}
              {existingPuzzle && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center"
                >
                  <p className="text-orange-400 text-sm">
                    ✨ Ce puzzle est déjà référencé par {existingPuzzle.total_likes + existingPuzzle.total_superlikes || 0} membres de la communauté
                  </p>
                </motion.div>
              )}

              {/* Informations du puzzle (non éditables) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="space-y-3"
              >
                {/* Nom */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <label className="text-white/50 text-xs mb-1 block">Nom du puzzle</label>
                  <p className="text-white text-sm leading-relaxed break-words">{puzzleData.name || 'Non renseigné'}</p>
                </div>

                {/* Marque */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <label className="text-white/50 text-xs mb-1 block">Marque</label>
                  <p className="text-white text-sm">{puzzleData.brand || 'Non renseigné'}</p>
                </div>

                {/* Pièces */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <label className="text-white/50 text-xs mb-1 block">Nombre de pièces</label>
                  <p className="text-white text-sm">{puzzleData.pieces ? `${puzzleData.pieces} pièces` : 'Non renseigné'}</p>
                </div>

                {/* Dimensions */}
                {puzzleData.dimensions && (
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <label className="text-white/50 text-xs mb-1 block">Dimensions</label>
                    <p className="text-white text-sm">{puzzleData.dimensions}</p>
                  </div>
                )}
              </motion.div>

              {/* Status Selection with Visual Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="space-y-4 pb-4"
              >
                <div>
                  <label className="text-sm text-white/70 mb-3 block">Que pensez-vous de ce puzzle?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Bouton J'ai aimé */}
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

                    {/* Bouton Je n'ai pas aimé */}
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

                    {/* Bouton Wishlist */}
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

                    {/* Bouton Dans sa boîte */}
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
              </motion.div>
            </div>

            {/* Bouton fixe en bas */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <Button
                onClick={handleAddPuzzle}
                disabled={!selectedStatus}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valider l'ajout
              </Button>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="space-y-6 py-8">
            {/* Animation de pièces de puzzle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center items-center mb-6 relative h-24"
            >
              {/* Pièce gauche */}
              <motion.div
                initial={{ x: -100, rotate: -15 }}
                animate={{ x: 0, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
                className="text-6xl absolute"
                style={{ left: 'calc(50% - 48px)' }}
              >
                🧩
              </motion.div>

              {/* Pièce droite */}
              <motion.div
                initial={{ x: 100, rotate: 15 }}
                animate={{ x: 0, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
                className="text-6xl absolute"
                style={{ right: 'calc(50% - 48px)' }}
              >
                🧩
              </motion.div>

              {/* Effet de brillance au centre */}
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
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, X, Star, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SwipeCard from '@/components/swipe/SwipeCard';
import SessionResultModal from '@/components/swipe/SessionResultModal';

const SEARCH_THEMES = ['Nature', 'Art', 'Disney', 'Panorama', 'Animals', 'Cities'];
const MIN_UNSEEN_PUZZLES = 50;

// Anti-gadget keywords
const ACCESSORY_KEYWORDS = [
  'tapis', 'colle', 'rangement', 'accessoire', 'tri', 'plateau', 
  'conservateur', 'roll', 'mural', 'cadre vide', 'table', 'lampe',
  'storage', 'mat', 'glue', 'frame', 'organizer'
];

export default function Discover() {
  const [user, setUser] = useState(null);
  const [userDNA, setUserDNA] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionStats, setSessionStats] = useState({});
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [filters, setFilters] = useState({
    pieceCount: 1000,
    kidsMode: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const extractPieceCount = (title) => {
    const match = title.match(/(\d+)\s*(pièces?|pieces?|pcs)/i);
    return match ? parseInt(match[1]) : null;
  };

  const extractCategory = (breadcrumbs) => {
    if (!breadcrumbs || breadcrumbs.length === 0) return 'Other';
    
    const categoryMap = {
      'nature': 'Nature',
      'animaux': 'Animals',
      'paysage': 'Nature',
      'ville': 'Urban',
      'art': 'Art',
      'disney': 'Disney',
      'panorama': 'Panorama',
      'abstrait': 'Abstract'
    };

    for (let crumb of breadcrumbs) {
      const name = crumb.name?.toLowerCase() || '';
      for (let [key, value] of Object.entries(categoryMap)) {
        if (name.includes(key)) return value;
      }
    }
    
    return 'Other';
  };

  const cleanTitle = (title, brand, pieces) => {
    let cleaned = title;
    if (brand) cleaned = cleaned.replace(new RegExp(brand, 'gi'), '').trim();
    if (pieces) cleaned = cleaned.replace(/\d+\s*(pièces?|pieces?|pcs)/gi, '').trim();
    cleaned = cleaned.replace(/\d+\s*[xX×]\s*\d+\s*(cm|mm)?/g, '').trim();
    cleaned = cleaned.replace(/^[\s\-,]+|[\s\-,]+$/g, '').replace(/\s+/g, ' ');
    return cleaned;
  };

  const isAccessory = (title, breadcrumbs) => {
    const titleLower = (title || '').toLowerCase();
    
    // Check title for accessory keywords
    if (ACCESSORY_KEYWORDS.some(keyword => titleLower.includes(keyword))) {
      return true;
    }
    
    // Check breadcrumbs for "Accessoires"
    if (breadcrumbs) {
      const hasAccessoryCategory = breadcrumbs.some(crumb => 
        (crumb.name || '').toLowerCase().includes('accessoire')
      );
      if (hasAccessoryCategory) return true;
    }
    
    return false;
  };

  const selectBestImage = (product) => {
    // Priority: Find assembled puzzle image or flat shot
    const images = product.images_flat || product.images || [];
    
    if (images.length > 1) {
      // Try to find image without too much text/packaging
      for (let i = 1; i < Math.min(images.length, 4); i++) {
        return images[i];
      }
    }
    
    // Fallback to main image
    return product.image || 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=800&h=800&fit=crop';
  };

  const fetchPuzzlesFromRainforest = async (theme) => {
    try {
      // Build search term based on filters
      let searchTerm = 'jigsaw puzzle';
      
      if (filters.kidsMode) {
        searchTerm += ' kids enfant';
      } else {
        searchTerm += ` ${filters.pieceCount} pieces`;
      }
      
      searchTerm += ` ${theme}`;

      const response = await fetch(
        `https://api.rainforestapi.com/request?api_key=6DA586EEF04D4AFA912388EA8A29547F&type=search&amazon_domain=amazon.fr&search_term=${encodeURIComponent(searchTerm)}&sort_by=featured`
      );
      
      const data = await response.json();
      
      if (!data.search_results || data.search_results.length === 0) {
        return [];
      }

      const newPuzzles = [];
      
      for (let product of data.search_results.slice(0, 20)) {
        if (!product.asin) continue;

        // ANTI-GADGET FILTER
        if (isAccessory(product.title, product.breadcrumbs)) {
          continue;
        }

        // Check if ASIN already exists
        const existing = await base44.entities.PuzzleCatalog.filter({ asin: product.asin });
        if (existing.length > 0) continue;

        const pieces = extractPieceCount(product.title || '');
        
        // Skip if kids mode and too many pieces
        if (filters.kidsMode && pieces && pieces > 150) {
          continue;
        }
        
        // Skip if not kids mode and pieces don't match filter range
        if (!filters.kidsMode && pieces) {
          const tolerance = 200;
          if (Math.abs(pieces - filters.pieceCount) > tolerance) {
            continue;
          }
        }

        const category = extractCategory(product.breadcrumbs);
        const cleanedTitle = cleanTitle(product.title || '', product.brand || '', pieces);
        const bestImage = selectBestImage(product);

        const puzzleData = {
          asin: product.asin,
          image_hd: bestImage,
          title: cleanedTitle,
          brand: product.brand || '',
          piece_count: pieces,
          category_tag: category,
          price: product.price?.value || 0,
          amazon_link: product.link ? `${product.link}&tag=MON_PUZZLE_ID-21` : ''
        };

        const created = await base44.entities.PuzzleCatalog.create(puzzleData);
        newPuzzles.push(created);
      }

      return newPuzzles;
    } catch (error) {
      console.error('Error fetching from Rainforest:', error);
      return [];
    }
  };

  const checkAndReplenishStock = async () => {
    // Get user's seen puzzles
    const seenPuzzles = await base44.entities.UserSeenPuzzle.list();
    const seenASINs = new Set(seenPuzzles.map(p => p.puzzle_asin));

    // Get total catalog
    const allPuzzles = await base44.entities.PuzzleCatalog.list();
    
    // Count unseen
    const unseenCount = allPuzzles.filter(p => !seenASINs.has(p.asin)).length;

    if (unseenCount < MIN_UNSEEN_PUZZLES) {
      toast.info('Chargement de nouveaux puzzles...');
      
      // Get next theme (rotate)
      const lastThemeIndex = parseInt(localStorage.getItem('lastThemeIndex') || '0');
      const nextThemeIndex = (lastThemeIndex + 1) % SEARCH_THEMES.length;
      const theme = SEARCH_THEMES[nextThemeIndex];
      
      localStorage.setItem('lastThemeIndex', nextThemeIndex.toString());

      await fetchPuzzlesFromRainforest(theme);
      toast.success(`Nouveaux puzzles ${theme} ajoutés !`);
    }
  };

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load or create UserDNA
      const dnaRecords = await base44.entities.UserDNA.list();
      if (dnaRecords.length === 0) {
        const newDNA = await base44.entities.UserDNA.create({
          score_brands: {},
          score_categories: {},
          total_swipes_count: 0,
          current_session_count: 0
        });
        setUserDNA(newDNA);
      } else {
        setUserDNA(dnaRecords[0]);
      }

      // Check and replenish puzzle stock
      await checkAndReplenishStock();

      // Load unseen puzzles
      const seenPuzzles = await base44.entities.UserSeenPuzzle.list();
      const seenASINs = new Set(seenPuzzles.map(p => p.puzzle_asin));
      
      const allPuzzles = await base44.entities.PuzzleCatalog.list();
      const unseenPuzzles = allPuzzles.filter(p => !seenASINs.has(p.asin));
      
      // Shuffle for variety
      const shuffled = unseenPuzzles.sort(() => Math.random() - 0.5);
      
      setPuzzles(shuffled.slice(0, 100)); // Load batch of 100
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur de chargement');
      setLoading(false);
    }
  };

  const updateScores = async (puzzle, scoreChange) => {
    const newScoreBrands = { ...userDNA.score_brands };
    const newScoreCategories = { ...userDNA.score_categories };

    // Update brand score
    if (puzzle.brand) {
      newScoreBrands[puzzle.brand] = (newScoreBrands[puzzle.brand] || 0) + scoreChange;
    }

    // Update category score
    if (puzzle.category_tag) {
      newScoreCategories[puzzle.category_tag] = (newScoreCategories[puzzle.category_tag] || 0) + scoreChange;
    }

    const newSessionCount = userDNA.current_session_count + 1;
    const newTotalCount = userDNA.total_swipes_count + 1;

    // Update UserDNA
    const updatedDNA = await base44.entities.UserDNA.update(userDNA.id, {
      score_brands: newScoreBrands,
      score_categories: newScoreCategories,
      total_swipes_count: newTotalCount,
      current_session_count: newSessionCount
    });

    setUserDNA(updatedDNA);

    // Check if session is complete (modulo 25)
    if (newSessionCount % 25 === 0) {
      await calculateSessionStats(newSessionCount - 24, newSessionCount);
    }
  };

  const calculateSessionStats = async (startCount, endCount) => {
    // Get last 25 interactions
    const interactions = await base44.entities.SwipeInteraction.list('-created_date', 25);
    
    const likes = interactions.filter(i => i.interaction_type === 'like').length;
    const superlikes = interactions.filter(i => i.interaction_type === 'superlike').length;

    // Find most liked category
    const categoryCounts = {};
    interactions.forEach(i => {
      if (i.interaction_type !== 'dislike' && i.puzzle_category) {
        categoryCounts[i.puzzle_category] = (categoryCounts[i.puzzle_category] || 0) + 1;
      }
    });

    const topCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b, '');
    
    const topCategoryCount = categoryCounts[topCategory] || 0;
    const categoryPercentage = Math.round((topCategoryCount / 25) * 100);

    // Find top brand
    const brandCounts = {};
    interactions.forEach(i => {
      if (i.interaction_type !== 'dislike' && i.puzzle_brand) {
        brandCounts[i.puzzle_brand] = (brandCounts[i.puzzle_brand] || 0) + 1;
      }
    });

    const topBrand = Object.keys(brandCounts).reduce((a, b) => 
      brandCounts[a] > brandCounts[b] ? a : b, '');

    setSessionStats({
      topCategory,
      categoryPercentage,
      topBrand,
      totalLikes: likes,
      totalSuperLikes: superlikes,
      kidsMode: filters.kidsMode
    });

    setShowSessionModal(true);
  };

  const handleSwipe = async (direction) => {
    if (currentIndex >= puzzles.length) return;

    const puzzle = puzzles[currentIndex];
    let scoreChange = 0;
    let interactionType = 'dislike';
    let updateFields = {};

    // Mark as seen
    await base44.entities.UserSeenPuzzle.create({
      puzzle_asin: puzzle.asin
    });

    if (direction === 'dislike') {
      scoreChange = -0.5;
      interactionType = 'dislike';
    } else if (direction === 'like') {
      scoreChange = 1.0;
      interactionType = 'like';
      updateFields.total_likes = (userDNA.total_likes || 0) + 1;
    } else if (direction === 'superlike') {
      scoreChange = 2.0;
      interactionType = 'superlike';
      updateFields.total_superlikes = (userDNA.total_superlikes || 0) + 1;
      
      // Add to wishlist
      await base44.entities.UserPuzzle.create({
        puzzle_name: puzzle.title,
        puzzle_brand: puzzle.brand,
        puzzle_pieces: puzzle.piece_count,
        image_url: puzzle.image_hd,
        puzzle_reference: puzzle.asin,
        status: 'wishlist'
      });
      
      toast.success('Ajouté à votre wishlist ⭐');
    }

    // Record interaction
    await base44.entities.SwipeInteraction.create({
      puzzle_id: puzzle.id,
      puzzle_asin: puzzle.asin,
      interaction_type: interactionType,
      puzzle_brand: puzzle.brand,
      puzzle_category: puzzle.category_tag
    });

    // Update scores
    await updateScores(puzzle, scoreChange);

    // Update DNA with additional fields
    if (Object.keys(updateFields).length > 0) {
      await base44.entities.UserDNA.update(userDNA.id, updateFields);
    }

    setCurrentIndex(prev => prev + 1);

    // Check if we need to reload more puzzles
    if (currentIndex >= puzzles.length - 10) {
      await checkAndReplenishStock();
    }
  };

  const handleContinueSession = async () => {
    // Reset session counter
    await base44.entities.UserDNA.update(userDNA.id, {
      current_session_count: 0
    });
    
    setUserDNA(prev => ({ ...prev, current_session_count: 0 }));
    setShowSessionModal(false);
    toast.success('Nouvelle session lancée !');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000019] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000019] flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Découvrez vos puzzles</h2>
          <p className="text-white/60 mb-6">Connectez-vous pour commencer</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-orange-500 hover:bg-orange-600">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  const currentPuzzle = puzzles[currentIndex];
  const progressPercentage = ((userDNA?.current_session_count || 0) % 25) * 4; // 25 * 4 = 100%

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000019] via-[#0a0a2e] to-[#1a1a4e]">
      {/* Config Modal */}
      <ConfigModal 
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowConfigModal(false);
          toast.success('Filtres appliqués !');
          // Reload puzzles with new filters
          loadData();
        }}
      />

      {/* Header avec progression */}
      <div className="sticky top-16 lg:top-16 z-20 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">Session en cours</span>
              {filters.kidsMode && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                  👶 Mode Enfant
                </span>
              )}
              {!filters.kidsMode && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                  {filters.pieceCount} pcs
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setShowConfigModal(true)}
                className="text-white/70 hover:text-white h-8 w-8"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
              <span className="text-orange-400 font-bold">
                {(userDNA?.current_session_count || 0) % 25}/25
              </span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-white/10" />
        </div>
      </div>

      {/* Main Swipe Area */}
      <div className="flex items-center justify-center px-4 py-8" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="relative w-full max-w-md" style={{ height: '600px' }}>
          {currentPuzzle ? (
            <>
              <AnimatePresence>
                <SwipeCard
                  key={currentPuzzle.id}
                  puzzle={currentPuzzle}
                  onSwipe={handleSwipe}
                />
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-6">
                <Button
                  onClick={() => handleSwipe('dislike')}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-white hover:bg-white/90 shadow-lg"
                >
                  <X className="w-8 h-8 text-red-500" />
                </Button>

                <Button
                  onClick={() => handleSwipe('superlike')}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 shadow-lg"
                >
                  <Star className="w-8 h-8 text-white fill-white" />
                </Button>

                <Button
                  onClick={() => handleSwipe('like')}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-white hover:bg-white/90 shadow-lg"
                >
                  <Heart className="w-8 h-8 text-green-500" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-white/70 text-lg">Plus de puzzles à découvrir</p>
                <Button onClick={() => window.location.reload()} className="mt-4 bg-orange-500 hover:bg-orange-600">
                  Recharger
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session Result Modal */}
      <SessionResultModal
        open={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        stats={sessionStats}
        onContinue={handleContinueSession}
      />
    </div>
  );
}
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

export default function Discover() {
  const [user, setUser] = useState(null);
  const [userDNA, setUserDNA] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionStats, setSessionStats] = useState({});

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

  const fetchPuzzlesFromRainforest = async (theme) => {
    try {
      const response = await fetch(
        `https://api.rainforestapi.com/request?api_key=6DA586EEF04D4AFA912388EA8A29547F&type=search&amazon_domain=amazon.fr&search_term=puzzle ${theme}&sort_by=featured`
      );
      
      const data = await response.json();
      
      if (!data.search_results || data.search_results.length === 0) {
        return [];
      }

      const newPuzzles = [];
      
      for (let product of data.search_results.slice(0, 20)) {
        if (!product.asin) continue;

        // Check if ASIN already exists
        const existing = await base44.entities.PuzzleCatalog.filter({ asin: product.asin });
        if (existing.length > 0) continue;

        const pieces = extractPieceCount(product.title || '');
        const category = extractCategory(product.breadcrumbs);
        const cleanedTitle = cleanTitle(product.title || '', product.brand || '', pieces);

        const puzzleData = {
          asin: product.asin,
          image_hd: product.image || 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=800&h=800&fit=crop',
          title: cleanedTitle,
          brand: product.brand || '',
          piece_count: pieces,
          category_tag: category,
          price: product.price?.value || 0,
          amazon_link: product.link || ''
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

    setSessionStats({
      topCategory,
      categoryPercentage,
      totalLikes: likes,
      totalSuperLikes: superlikes
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
      {/* Header avec progression */}
      <div className="sticky top-16 lg:top-16 z-20 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Session en cours</span>
            <span className="text-orange-400 font-bold">
              {(userDNA?.current_session_count || 0) % 25}/25
            </span>
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
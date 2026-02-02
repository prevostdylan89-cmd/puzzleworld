import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, X, Star, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SwipeCard from '@/components/swipe/SwipeCard';
import SessionResultModal from '@/components/swipe/SessionResultModal';

const MOCK_PUZZLES = [
  {
    id: '1',
    asin: 'B001',
    image_hd: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=800&fit=crop',
    title: 'Nuit Étoilée Abstraite',
    brand: 'Ravensburger',
    piece_count: 1000,
    category_tag: 'Abstract',
    price: 24.99
  },
  {
    id: '2',
    asin: 'B002',
    image_hd: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop',
    title: 'Montagne Majestueuse au Coucher du Soleil',
    brand: 'Clementoni',
    piece_count: 1500,
    category_tag: 'Nature',
    price: 29.99
  },
  {
    id: '3',
    asin: 'B003',
    image_hd: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=800&fit=crop',
    title: 'Plage Tropicale Paradisiaque',
    brand: 'Educa',
    piece_count: 2000,
    category_tag: 'Nature',
    price: 34.99
  },
  {
    id: '4',
    asin: 'B004',
    image_hd: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800&h=800&fit=crop',
    title: 'Concert Rock Ambiance',
    brand: 'Schmidt',
    piece_count: 1000,
    category_tag: 'Art',
    price: 22.99
  },
  {
    id: '5',
    asin: 'B005',
    image_hd: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=800&fit=crop',
    title: 'Ville Nocturne Illuminée',
    brand: 'Ravensburger',
    piece_count: 1500,
    category_tag: 'Urban',
    price: 27.99
  }
];

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

      // Load puzzles (use mock for now)
      setPuzzles(MOCK_PUZZLES);
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
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Sparkles, TrendingUp, Calendar, ChevronRight, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/shared/EventCard';
import SectionHeader from '@/components/shared/SectionHeader';
import ScanPuzzleModal from '@/components/scan/ScanPuzzleModal';
import EventModal from '@/components/events/EventModal';
import { base44 } from '@/api/base44Client';
import CommunityPuzzleCard from '@/components/collection/CommunityPuzzleCard';
import FeaturedPuzzleSelector from '@/components/home/FeaturedPuzzleSelector';
import PuzzleReplacementModal from '@/components/home/PuzzleReplacementModal';
import { Edit3 } from 'lucide-react';

const monthlyEvents = [
  {
    title: 'Speed Puzzle Challenge',
    description: 'Race against time to complete puzzles faster than anyone else',
    image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&h=200&fit=crop',
    date: 'Jan 15-31',
    participants: 2847,
    timeLeft: '5 days left',
    type: 'challenge'
  },
  {
    title: 'Winter Tournament',
    description: 'Compete in the seasonal championship for exclusive rewards',
    image: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400&h=200&fit=crop',
    date: 'Jan 20 - Feb 10',
    participants: 1523,
    timeLeft: '12 days left',
    type: 'tournament'
  },
  {
    title: 'Community Build',
    description: 'Collaborate with others to complete a massive 10,000 piece puzzle',
    image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=200&fit=crop',
    date: 'Ongoing',
    participants: 892,
    timeLeft: 'Join anytime',
    type: 'community'
  }
];



export default function Home() {
  const { t } = useLanguage();
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [topPuzzles, setTopPuzzles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadTopPuzzles();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const user = await base44.auth.me();
      setIsAdmin(user?.role === 'admin');
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const loadTopPuzzles = async () => {
    setLoadingPuzzles(true);
    try {
      // Load featured puzzles (positions 1-4)
      const featured = await base44.entities.FeaturedPuzzle.list('position', 4);
      
      if (featured.length > 0) {
        // Load full puzzle data for each featured puzzle
        const puzzlesData = [];
        for (const f of featured) {
          const puzzles = await base44.entities.PuzzleCatalog.filter({ id: f.puzzle_catalog_id });
          if (puzzles.length > 0) {
            puzzlesData.push(puzzles[0]);
          }
        }
        
        // Fill remaining slots with latest puzzles if needed
        if (puzzlesData.length < 4) {
          const latestPuzzles = await base44.entities.PuzzleCatalog.list('-created_date', 4 - puzzlesData.length);
          puzzlesData.push(...latestPuzzles);
        }
        
        setTopPuzzles(puzzlesData);
      } else {
        // No featured puzzles yet, show latest 4
        const puzzles = await base44.entities.PuzzleCatalog.list('-created_date', 4);
        setTopPuzzles(puzzles);
      }
    } catch (error) {
      console.error('Error loading puzzles:', error);
      // Fallback
      try {
        const fallbackPuzzles = await base44.entities.PuzzleCatalog.list('-created_date', 4);
        setTopPuzzles(fallbackPuzzles);
      } catch (err) {
        console.error('Fallback failed:', err);
      }
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const handleEditSlot = (index) => {
    setSelectedPosition(index + 1);
    setShowSelector(true);
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen">
      {/* Admin Edit Mode Toggle */}
      {isAdmin && (
        <div className="fixed top-20 right-4 lg:right-8 z-40">
          <Button
            onClick={() => setEditMode(!editMode)}
            className={`rounded-full shadow-lg ${
              editMode 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            {editMode ? '🔓 Mode Édition Activé' : '🔒 Mode Édition'}
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-4 lg:px-8 py-12 lg:py-16 max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>New puzzles added daily</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {t('heroTitle')}
              </span>
            </h1>
            <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
          </motion.div>

          {/* Action Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => setShowScanModal(true)}
              className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20"
            >
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">➕</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Ajouter votre puzzle</h3>
                  <p className="text-white/80 text-sm">Scannez le code-barres ou ajoutez manuellement</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link to={createPageUrl('Collection')}>
                <button className="group w-full relative overflow-hidden rounded-[2rem] bg-white/5 border-2 border-white/10 hover:border-orange-500/30 hover:bg-white/10 p-8 text-left transition-all hover:scale-[1.02]">
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl mb-2">Explorer la collection</h3>
                      <p className="text-white/60 text-sm">Découvrez des milliers de puzzles</p>
                    </div>
                  </div>
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Most Played */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="px-4 lg:px-8 py-8"
      >
        <SectionHeader 
          title={t('mostPlayed')}
          subtitle=""
          link="Collection"
          icon={TrendingUp}
        />
        
        {loadingPuzzles ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : topPuzzles.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {topPuzzles.map((puzzle, index) => (
              <motion.div key={puzzle.id} variants={item} className="relative group">
                <CommunityPuzzleCard puzzle={puzzle} showAffiliateLink={true} />
                {isAdmin && (
                  <button
                    onClick={() => handleEditSlot(index)}
                    className={`absolute top-2 right-2 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 z-10 transition-all ${
                      editMode ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {isAdmin && editMode && (
                  <div className="absolute bottom-2 left-2 right-2 bg-orange-500/90 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-lg text-center font-medium">
                    Position {index + 1}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-xl">
            <p className="text-white/50 text-sm">Aucun puzzle disponible</p>
          </div>
        )}
      </motion.section>

      {/* Monthly Events */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="px-4 lg:px-8 py-8"
      >
        <SectionHeader 
          title={t('monthlyEvents')}
          subtitle=""
          icon={Calendar}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {monthlyEvents.map((event, index) => (
            <motion.div 
              key={index} 
              variants={item}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <div onClick={() => setSelectedEvent(event)} className="cursor-pointer">
                <EventCard event={event} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <ScanPuzzleModal open={showScanModal} onClose={() => setShowScanModal(false)} />
      
      {selectedEvent && (
        <EventModal 
          open={true} 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}

      <FeaturedPuzzleSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        position={selectedPosition}
        onUpdate={loadTopPuzzles}
      />
    </div>
  );
}
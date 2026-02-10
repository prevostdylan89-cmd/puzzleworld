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
import PuzzleDetailModal from '@/components/collection/PuzzleDetailModal';


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
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);

  useEffect(() => {
    loadTopPuzzles();
    loadFeaturedEvents();
  }, []);

  const loadTopPuzzles = async () => {
    setLoadingPuzzles(true);
    try {
      const featured = await base44.entities.FeaturedPuzzle.list('position', 4);
      
      if (featured.length > 0) {
        const puzzlePromises = featured.map(fp => 
          base44.entities.PuzzleCatalog.filter({ id: fp.puzzle_catalog_id })
        );
        const puzzleResults = await Promise.all(puzzlePromises);
        const puzzles = puzzleResults.map(r => r[0]).filter(p => p);
        setTopPuzzles(puzzles);
      }
    } catch (error) {
      console.error('Error loading puzzles:', error);
      setTopPuzzles([]);
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const loadFeaturedEvents = async () => {
    setLoadingEvents(true);
    try {
      // Load featured events sorted by position
      const featured = await base44.entities.FeaturedEvent.list('position', 3);
      console.log('Featured events loaded:', featured);
      
      if (featured.length > 0) {
        // Load full event details for each featured event
        const eventPromises = featured.map(fe => 
          base44.entities.Event.filter({ id: fe.event_id })
        );
        const eventResults = await Promise.all(eventPromises);
        const events = eventResults.map(r => r[0]).filter(e => e);
        console.log('Full events loaded:', events);
        setFeaturedEvents(events);
      } else {
        console.log('No featured events found');
        setFeaturedEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setFeaturedEvents([]);
    } finally {
      setLoadingEvents(false);
    }
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

      {/* Featured Puzzles */}
      {topPuzzles.length > 0 && (
        <motion.section 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="px-4 lg:px-8 py-8"
        >
          <SectionHeader 
            title="Puzzles en Vedette"
            subtitle=""
            link="Collection"
            icon={TrendingUp}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {topPuzzles.map((puzzle) => (
              <motion.div 
                key={puzzle.id} 
                variants={item}
                onClick={() => {
                  localStorage.setItem('selectedPuzzleAsin', puzzle.asin);
                  window.location.href = createPageUrl('Collection');
                }}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={puzzle.image_hd}
                  alt={puzzle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold inline-block">
                    {puzzle.piece_count} pièces
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

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
        
        {loadingEvents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {featuredEvents.map((event) => (
              <motion.div 
                key={event.id} 
                variants={item}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <EventCard 
                  event={event}
                  onRegisterClick={(e) => setSelectedEvent(e)}
                  onMoreInfoClick={() => window.location.href = createPageUrl('Events')}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/50">Aucun événement sélectionné. Ajoutez-en depuis la page admin.</p>
          </div>
        )}
      </motion.section>

      <ScanPuzzleModal open={showScanModal} onClose={() => setShowScanModal(false)} />
      
      {selectedEvent && (
        <EventModal 
          open={true} 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}




    </div>
  );
}
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
      if (featured.length === 0) { setTopPuzzles([]); return; }

      const allCatalog = await base44.entities.PuzzleCatalog.list('-created_date', 500);
      const catalogMap = Object.fromEntries(allCatalog.map(p => [p.id, p]));
      const puzzles = featured.map(fp => catalogMap[fp.puzzle_catalog_id]).filter(Boolean);
      setTopPuzzles(puzzles);
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
      const featured = await base44.entities.FeaturedEvent.list('position', 3);
      if (featured.length === 0) { setFeaturedEvents([]); return; }

      const allEvents = await base44.entities.Event.list('-event_date', 100);
      const eventMap = Object.fromEntries(allEvents.map(e => [e.id, e]));
      const events = featured.map(fe => eventMap[fe.event_id]).filter(Boolean);
      setFeaturedEvents(events);
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
                  <div className="space-y-1">
                    <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold inline-block">
                      {puzzle.piece_count} pièces
                    </div>
                    {puzzle.amazon_rating && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="bg-yellow-500/90 text-black px-2 py-0.5 rounded-full font-semibold">
                          ⭐ {puzzle.amazon_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {puzzle.amazon_price && (
                      <div className="text-white text-sm font-bold bg-black/50 px-2 py-0.5 rounded-full inline-block">
                        {puzzle.amazon_price.toFixed(2)}€
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Événements Mensuels */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="px-4 lg:px-8 py-8"
      >
        <SectionHeader 
          title="Événements à Venir"
          subtitle=""
          icon={Calendar}
        />
        
        {loadingEvents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-orange-500/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <motion.div 
                key={event.id} 
                variants={item}
                onClick={() => setSelectedEvent(event)}
                className="group cursor-pointer relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-orange-500/30 hover:border-orange-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20"
              >
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full font-semibold">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block p-8 bg-orange-500/10 rounded-2xl border-2 border-orange-500/20">
              <Calendar className="w-12 h-12 text-orange-500 mb-4 mx-auto" />
              <p className="text-white/70 text-lg">Aucun événement sélectionné</p>
              <p className="text-white/50 text-sm">Ajoutez-en depuis la page admin</p>
            </div>
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
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Sparkles, TrendingUp, Calendar, ChevronRight, Scan, Star, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ScanPuzzleModal from '@/components/scan/ScanPuzzleModal';
import EventModal from '@/components/events/EventModal';
import PuzzleDetailModal from '@/components/collection/PuzzleDetailModal';
import { base44 } from '@/api/base44Client';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  const { t } = useLanguage();
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [topPuzzles, setTopPuzzles] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsInMaintenance, setEventsInMaintenance] = useState(false);

  useEffect(() => {
    Promise.all([loadTopPuzzles(), loadEvents(), loadPageSettings()]).finally(() => setLoading(false));
  }, []);

  const loadPageSettings = async () => {
    try {
      const settings = await base44.entities.PageSettings.filter({ page_name: 'Events' });
      if (settings.length > 0 && settings[0].is_active === false) {
        setEventsInMaintenance(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTopPuzzles = async () => {
    try {
      const puzzles = await base44.entities.PuzzleCatalog.filter({ status: 'active' }, '-socialScore', 10);
      setTopPuzzles(puzzles);
    } catch (e) {
      console.error(e);
    }
  };

  const loadEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const all = await base44.entities.Event.list('event_date', 20);
      const upcoming = all.filter(e => e.event_date >= today).slice(0, 4);
      setEvents(upcoming.length >= 4 ? upcoming : all.slice(0, 4));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative px-4 lg:px-8 py-12 lg:py-16 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Nouveaux puzzles ajoutés chaque jour</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-4">
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {t('heroTitle')}
              </span>
            </h1>
            <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
          </motion.div>

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
                  <Scan className="w-6 h-6 text-white" />
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

      {/* Top 10 Puzzles */}
      <section className="px-4 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Top 10 Puzzles</h2>
              <p className="text-white/40 text-xs">Les plus appréciés de la communauté</p>
            </div>
          </div>
          <Link to={createPageUrl('Collection')}>
            <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : topPuzzles.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun puzzle disponible</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            {topPuzzles.map((puzzle, index) => (
              <motion.div
                key={puzzle.id}
                variants={item}
                onClick={() => setSelectedPuzzle(puzzle)}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-[1.03] transition-transform duration-200"
              >
                {puzzle.image_hd ? (
                  <img src={puzzle.image_hd} alt={puzzle.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <Puzzle className="w-10 h-10 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Rank badge */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {index + 1}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-1">{puzzle.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-[10px]">{puzzle.piece_count} pcs</span>
                    {puzzle.amazon_rating && (
                      <span className="flex items-center gap-0.5 text-yellow-400 text-[10px] font-bold">
                        <Star className="w-3 h-3 fill-yellow-400" />{puzzle.amazon_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* 4 Événements */}
      <section className="px-4 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Événements à Venir</h2>
              <p className="text-white/40 text-xs">Ne manquez rien de la communauté</p>
            </div>
          </div>
          {!eventsInMaintenance && (
            <Link to={createPageUrl('Events')}>
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        {eventsInMaintenance ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-4xl mb-4 block">🔧</span>
            <p className="text-white/60 font-medium">Les événements sont temporairement en maintenance.</p>
            <p className="text-white/40 text-sm mt-1">Revenez bientôt !</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun événement disponible</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {events.map((event) => (
              <motion.div
                key={event.id}
                variants={item}
                onClick={() => setSelectedEvent(event)}
                className="group relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200 border border-white/[0.06] hover:border-purple-500/30"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-sm line-clamp-2 mb-2">{event.title}</p>
                  <div className="inline-flex items-center gap-1.5 bg-purple-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    <Calendar className="w-3 h-3" />
                    {new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <ScanPuzzleModal open={showScanModal} onClose={() => setShowScanModal(false)} />

      <PuzzleDetailModal
        open={!!selectedPuzzle}
        onClose={() => setSelectedPuzzle(null)}
        puzzle={selectedPuzzle}
      />

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
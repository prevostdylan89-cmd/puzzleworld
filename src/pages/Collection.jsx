import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PuzzleDetailModal from '@/components/collection/PuzzleDetailModal';
import ReclassifyButton from '@/components/collection/ReclassifyButton';
import PullToRefresh from '@/components/shared/PullToRefresh';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid,
  ChevronDown,
  X,
  Puzzle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const allPuzzles = [
  {
    title: 'Starry Night Dreams',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
    pieces: 2000,
    plays: 1523,
    rating: 4.9,
    creator: 'ArtMaster',
    category: 'Abstract'
  },
  {
    title: 'Ocean Sunset',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    pieces: 1000,
    plays: 892,
    rating: 4.7,
    creator: 'NatureVibes',
    category: 'Nature'
  },
  {
    title: 'Mountain Peak',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop',
    pieces: 500,
    plays: 2341,
    rating: 4.8,
    creator: 'Explorer',
    category: 'Nature'
  },
  {
    title: 'Cosmic Galaxy',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop',
    pieces: 1500,
    plays: 5672,
    rating: 4.9,
    creator: 'SpaceExplorer',
    category: 'Space'
  },
  {
    title: 'Cherry Blossoms',
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=400&fit=crop',
    pieces: 750,
    plays: 4231,
    rating: 4.6,
    creator: 'JapanLover',
    category: 'Nature'
  },
  {
    title: 'City Lights',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=400&fit=crop',
    pieces: 1000,
    plays: 3892,
    rating: 4.7,
    creator: 'UrbanArt',
    category: 'Urban'
  },
  {
    title: 'Aurora Borealis',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=400&fit=crop',
    pieces: 2000,
    plays: 3456,
    rating: 4.8,
    creator: 'NorthernLights',
    category: 'Nature'
  },
  {
    title: 'Ancient Temple',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=400&fit=crop',
    pieces: 1200,
    plays: 2134,
    rating: 4.7,
    creator: 'HistoryBuff',
    category: 'Architecture'
  },
  {
    title: 'Tropical Paradise',
    image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=400&fit=crop',
    pieces: 800,
    plays: 1876,
    rating: 4.5,
    creator: 'BeachLover',
    category: 'Nature'
  },
  {
    title: 'Abstract Colors',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop',
    pieces: 1500,
    plays: 2987,
    rating: 4.8,
    creator: 'ModernArt',
    category: 'Abstract'
  },
  {
    title: 'Forest Trail',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=400&fit=crop',
    pieces: 600,
    plays: 3421,
    rating: 4.6,
    creator: 'NatureWalk',
    category: 'Nature'
  },
  {
    title: 'Vintage Map',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop',
    pieces: 2500,
    plays: 1543,
    rating: 4.9,
    creator: 'Cartographer',
    category: 'Vintage'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Tous', icon: '🌍' },
  { id: 'Nature', label: 'Nature', icon: '🌳' },
  { id: 'Urbain', label: 'Urbain', icon: '🏙️' },
  { id: 'Disney', label: 'Disney', icon: '🏰' },
  { id: 'Art', label: 'Art', icon: '🎨' },
  { id: 'Animaux', label: 'Animaux', icon: '🦁' },
  { id: 'Monochrome', label: 'Monochrome', icon: '⚫' },
  { id: 'Vintage', label: 'Vintage', icon: '📜' },
  { id: 'Autre', label: 'Autre', icon: '🧩' }
];

export default function Collection() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [minPieces, setMinPieces] = useState('');
  const [maxPieces, setMaxPieces] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Fetch puzzles from global catalog
  const { data: globalPuzzles = [], isLoading, refetch } = useQuery({
    queryKey: ['globalPuzzles'],
    queryFn: async () => {
      const puzzles = await base44.entities.PuzzleCatalog.filter({ status: 'active' }, '-created_date', 500);
      return puzzles;
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds to sync with admin changes
  });

  useEffect(() => {
    const asin = localStorage.getItem('selectedPuzzleAsin');
    if (asin && globalPuzzles.length > 0) {
      localStorage.removeItem('selectedPuzzleAsin');
      const puzzle = globalPuzzles.find(p => p.asin === asin);
      if (puzzle) {
        setSelectedPuzzle(puzzle);
        setShowDetailModal(true);
      }
    }
  }, [globalPuzzles]);

  // Known brands from the catalog
  const KNOWN_BRANDS = ['Ravensburger', 'Clementoni', 'Jumbo', 'Trefl', 'Educa', 'Schmidt', 'Castorland', 'Heye', 'Cobble Hill', 'Buffalo Games', 'Ceaco', 'Epoch', 'MB', 'Nathan', 'Dino', 'Wrebbit', 'Helvetiq', 'AveJoys'];

  const brandOptions = React.useMemo(() => {
    const brandsInCatalog = new Set();
    let hasUnknown = false;
    globalPuzzles.forEach(p => {
      const b = p.brand?.trim();
      if (!b) {
        hasUnknown = true;
      } else {
        const known = KNOWN_BRANDS.find(kb => b.toLowerCase().includes(kb.toLowerCase()));
        if (known) brandsInCatalog.add(known);
        else brandsInCatalog.add(b);
      }
    });
    const sorted = [...brandsInCatalog].sort();
    if (hasUnknown) sorted.push('__unknown__');
    return sorted;
  }, [globalPuzzles]);

  const clearFilters = () => {
    setMinPieces('');
    setMaxPieces('');
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
  };

  // Filter puzzles
  const filteredPuzzles = globalPuzzles.filter(puzzle => {
    const matchesSearch = puzzle.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          puzzle.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinPieces = !minPieces || (puzzle.piece_count >= parseInt(minPieces));
    const matchesMaxPieces = !maxPieces || (puzzle.piece_count <= parseInt(maxPieces));
    const matchesCategory = selectedCategory === 'all' || puzzle.category_tag === selectedCategory;
    const puzzleBrand = puzzle.brand?.trim() || '';
    const matchesBrand = selectedBrand === 'all'
      || (selectedBrand === '__unknown__' && !puzzleBrand)
      || (selectedBrand !== '__unknown__' && puzzleBrand.toLowerCase().includes(selectedBrand.toLowerCase()));
    
    return matchesSearch && matchesMinPieces && matchesMaxPieces && matchesCategory && matchesBrand;
  });

  // Sort puzzles
  const sortedPuzzles = [...filteredPuzzles].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'popular':
        // Use socialScore instead of total_likes for popularity
        return (b.socialScore || 0) - (a.socialScore || 0);
      case 'pieces-asc':
        return (a.piece_count || 0) - (b.piece_count || 0);
      case 'pieces-desc':
        return (b.piece_count || 0) - (a.piece_count || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-white">Collection Communautaire</h1>
              <p className="text-white/50 text-sm mt-1">
                {isLoading ? 'Chargement...' : `${sortedPuzzles.length} puzzles partagés par la communauté`}
              </p>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPuzzles')}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
                />
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-white/10 text-white hover:bg-white/5">
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-[#000019] border-white/[0.06]">
                  <SheetHeader>
                    <SheetTitle className="text-white">{t('filters')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Piece Count Min/Max */}
                    <div>
                      <label className="text-sm text-white/70 mb-3 block">{t('pieceCount')}</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/50 mb-1.5 block">Minimum</label>
                          <Input
                            type="number"
                            value={minPieces}
                            onChange={(e) => setMinPieces(e.target.value)}
                            placeholder="Ex: 500"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/50 mb-1.5 block">Maximum</label>
                          <Input
                            type="number"
                            value={maxPieces}
                            onChange={(e) => setMaxPieces(e.target.value)}
                            placeholder="Ex: 2000"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Brand Filter */}
                    <div>
                      <label className="text-sm text-white/70 mb-3 block">Marque</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedBrand('all')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            selectedBrand === 'all'
                              ? 'bg-orange-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          Toutes
                        </button>
                        {brandOptions.map(brand => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(brand)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedBrand === brand
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {brand === '__unknown__' ? '❓ Marque inconnue' : brand}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={clearFilters}
                      variant="outline" 
                      className="w-full border-white/20 text-white hover:bg-white/5"
                    >
                      {t('clearAllFilters')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* View Mode Toggle */}
              <div className="hidden lg:flex bg-white/5 border border-white/10 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className={viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'large' ? 'default' : 'ghost'}
                  size="icon"
                  className={viewMode === 'large' ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white'}
                  onClick={() => setViewMode('large')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category Filters — desktop: scroll horizontal / mobile: select dropdown */}
          <div className="mt-3 mb-1">
            {/* Mobile: dropdown select */}
            <div className="flex gap-2 lg:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue>
                    {(() => {
                      const cat = CATEGORY_FILTERS.find(c => c.id === selectedCategory);
                      return cat ? `${cat.icon} ${cat.label}` : 'Catégorie';
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a2e] border-white/10">
                  {CATEGORY_FILTERS.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-white text-sm">
                      {c.icon} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue placeholder="Trier..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a2e] border-white/10">
                  <SelectItem value="newest" className="text-white text-sm">Nouveautés</SelectItem>
                  <SelectItem value="popular" className="text-white text-sm">Populaires</SelectItem>
                  <SelectItem value="pieces-asc" className="text-white text-sm">Pièces ↑</SelectItem>
                  <SelectItem value="pieces-desc" className="text-white text-sm">Pièces ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop: scroll horizontal */}
            <div className="hidden lg:block relative mt-2">
              <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-[#000019] to-transparent pointer-events-none z-10"></div>
              <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#000019] to-transparent pointer-events-none z-10"></div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORY_FILTERS.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                      selectedCategory === category.id
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sort Options — desktop only */}
          <div className="hidden lg:flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Puzzle className="w-4 h-4" />
              <span>Trier par:</span>
            </div>
            <div className="flex items-center gap-2">
              <ReclassifyButton onComplete={() => refetch()} />
              <Button
                variant={sortBy === 'newest' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('newest')}
                className={`rounded-full ${sortBy === 'newest' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >Nouveautés</Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('popular')}
                className={`rounded-full ${sortBy === 'popular' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >Populaires</Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm h-8">
                  <SelectValue placeholder="Plus..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a2e] border-white/10">
                  <SelectItem value="pieces-asc" className="text-white text-sm">Pièces (croissant)</SelectItem>
                  <SelectItem value="pieces-desc" className="text-white text-sm">Pièces (décroissant)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Puzzle Grid */}
      <PullToRefresh onRefresh={() => refetch()}>
        <div className="px-4 lg:px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className={`grid gap-2.5 lg:gap-4 ${
                viewMode === 'large' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}
            >
              {sortedPuzzles.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Puzzle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">Aucun puzzle trouvé</p>
                  <p className="text-white/30 text-sm mt-2">Soyez le premier à ajouter un puzzle à la communauté !</p>
                </div>
              ) : (
                sortedPuzzles.map((puzzle, index) => (
                  <CommunityPuzzleCard 
                    key={puzzle.id} 
                    puzzle={puzzle} 
                    index={index} 
                    variant={viewMode === 'large' ? 'large' : 'default'}
                    onClick={() => {
                      setSelectedPuzzle(puzzle);
                      setShowDetailModal(true);
                    }}
                  />
                ))
              )}
            </motion.div>
          )}

          {/* Load More */}
          <div className="flex justify-center mt-12">
            <Button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/5 rounded-full px-8"
            >
              {t('backToTop')}
              <ChevronDown className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
        </div>
      </PullToRefresh>

      {/* Puzzle Detail Modal */}
      <PuzzleDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        puzzle={selectedPuzzle}
      />
    </div>
  );
}

        function CommunityPuzzleCard({ puzzle, index, variant, onClick }) {
        return (
        <motion.div
        variants={item}
        onClick={onClick}
        className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group cursor-pointer active:scale-95"
        >
      <div className={`${variant === 'large' ? 'aspect-[4/3]' : 'aspect-[3/4]'} overflow-hidden bg-white/5`}>
        {puzzle.image_hd ? (
          <img
            src={puzzle.image_hd}
            alt={puzzle.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Puzzle className="w-8 h-8 text-white/20" />
          </div>
        )}
      </div>
      <div className="p-2 lg:p-3">
        <h3 className="text-white text-[11px] lg:text-sm font-semibold line-clamp-2 mb-0.5 leading-tight">
          {puzzle.title}
        </h3>
        <div className="flex items-center justify-between text-[10px] lg:text-xs text-white/40">
          <span className="truncate max-w-[60%]">{puzzle.brand || ''}</span>
          <span>{puzzle.piece_count} pcs</span>
        </div>
        {(puzzle.socialScore > 0 || puzzle.wishlistCount > 0) && (
          <div className="flex items-center gap-2 mt-1 text-[10px]">
            {puzzle.socialScore > 0 && <span className="text-green-400">❤️ {puzzle.socialScore}</span>}
            {puzzle.wishlistCount > 0 && <span className="text-orange-400">⭐ {puzzle.wishlistCount}</span>}
          </div>
        )}
      </div>
    </motion.div>
    );
    }
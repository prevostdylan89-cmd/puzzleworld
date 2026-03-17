import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PuzzleDetailModal from '@/components/collection/PuzzleDetailModal';
import ReclassifyButton from '@/components/collection/ReclassifyButton';
import DiscoverySection from '@/components/collection/DiscoverySection';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid,
  ChevronDown,
  X,
  Puzzle,
  Loader2,
  MoreVertical,
  Plus,
  CheckSquare,
  Square,
  Check,
  ShoppingBag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
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

const DEFAULT_categoryFilters = [
  { id: 'all', label: 'Tous', icon: '🌍' },
];

export default function Collection() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [categoryFilters, setCategoryFilters] = useState(DEFAULT_categoryFilters);

  // Load categories from DB
  useEffect(() => {
    base44.entities.PuzzleCategory.list('order', 100).then(data => {
      if (data.length > 0) {
        const sorted = data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategoryFilters([
          { id: 'all', label: 'Tous', icon: '🌍' },
          ...sorted.map(c => ({ id: c.name, label: c.name, icon: c.icon }))
        ]);
      }
    }).catch(() => {});
  }, []);
  const [minPieces, setMinPieces] = useState('');
  const [maxPieces, setMaxPieces] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);

  const addToMyCollection = useCallback(async (puzzles, status = 'inbox') => {
    try {
      const user = await base44.auth.me();
      if (!user) { toast.error('Connectez-vous pour ajouter à votre collection'); return; }
      let added = 0;
      for (const puzzle of puzzles) {
        const existing = await base44.entities.UserPuzzle.filter({ created_by: user.email, puzzle_reference: puzzle.asin || puzzle.id });
        if (existing.length === 0) {
          await base44.entities.UserPuzzle.create({
            puzzle_name: puzzle.title,
            puzzle_brand: puzzle.brand || '',
            puzzle_pieces: puzzle.piece_count || 0,
            puzzle_reference: puzzle.asin || puzzle.id,
            image_url: puzzle.image_hd || '',
            status
          });
          added++;
        }
      }
      const statusLabels = { wishlist: 'wishlist', inbox: 'collection', done: 'terminés' };
      if (added > 0) toast.success(`${added} puzzle${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} en ${statusLabels[status] || 'collection'} !`);
      else toast.info('Ces puzzles sont déjà dans votre collection');
    } catch (e) {
      toast.error("Erreur lors de l'ajout");
    }
  }, []);

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
                      const cat = categoryFilters.find(c => c.id === selectedCategory);
                      return cat ? `${cat.icon} ${cat.label}` : 'Catégorie';
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a2e] border-white/10">
                  {categoryFilters.map(c => (
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
                {categoryFilters.map((category) => (
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
                variant="outline"
                size="sm"
                onClick={() => setShowDiscovery(d => !d)}
                className={`rounded-full border-orange-500/40 gap-1.5 ${showDiscovery ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' : 'text-orange-400 hover:bg-orange-500/10'}`}
              >
                <span>✨</span>
                {showDiscovery ? 'Collection globale' : 'Découverte'}
              </Button>
              {!showDiscovery && (
                <Button
                  variant={sortBy === 'newest' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('newest')}
                  className={`rounded-full ${sortBy === 'newest' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                >Nouveautés</Button>
              )}
              {!showDiscovery && (
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue placeholder="Plus..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a2e] border-white/10">
                    <SelectItem value="pieces-asc" className="text-white text-sm">Pièces (croissant)</SelectItem>
                    <SelectItem value="pieces-desc" className="text-white text-sm">Pièces (décroissant)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Mode Bar — fixed floating bottom bar */}
      {selectionMode && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-orange-500 shadow-xl shadow-orange-500/30 rounded-full px-3 py-2">
          <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="text-white/80 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <span className="text-white font-semibold text-sm">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
          <div className="w-px h-4 bg-white/30" />
          <button
            onClick={() => {
              if (selectedIds.size === sortedPuzzles.length) setSelectedIds(new Set());
              else setSelectedIds(new Set(sortedPuzzles.map(p => p.id)));
            }}
            className="text-white/80 hover:text-white text-xs transition-colors"
          >
            {selectedIds.size === sortedPuzzles.length ? 'Désélect.' : 'Tout'}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={selectedIds.size === 0 || addingToCollection}
                className="flex items-center gap-1 bg-white text-orange-500 font-semibold px-3 py-1 rounded-full text-sm disabled:opacity-50"
              >
                {addingToCollection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Ajouter
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10 min-w-[180px]">
              {[
                { status: 'wishlist', label: 'Wishlist', emoji: '⭐' },
                { status: 'inbox', label: 'Dans sa boîte', emoji: '📦' },
                { status: 'done', label: 'Terminé', emoji: '🏆' },
              ].map(({ status, label, emoji }) => (
                <DropdownMenuItem
                  key={status}
                  onClick={async () => {
                    setAddingToCollection(true);
                    const puzzles = sortedPuzzles.filter(p => selectedIds.has(p.id));
                    await addToMyCollection(puzzles, status);
                    setAddingToCollection(false);
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="text-white hover:bg-white/10 cursor-pointer gap-2"
                >
                  {emoji} {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Discovery Section */}
      {showDiscovery && !isLoading && globalPuzzles.length > 0 && (
        <DiscoverySection globalPuzzles={globalPuzzles} />
      )}

      {/* Puzzle Grid */}
      {!showDiscovery && <div className="px-4 lg:px-8 py-6">

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
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(puzzle.id)}
                    onToggleSelect={() => {
                      setSelectedIds(prev => {
                        const next = new Set(prev);
                        if (next.has(puzzle.id)) next.delete(puzzle.id);
                        else next.add(puzzle.id);
                        return next;
                      });
                    }}
                    onAddToCollection={(status) => addToMyCollection([puzzle], status)}
                    onStartSelection={() => { setSelectionMode(true); setSelectedIds(new Set([puzzle.id])); }}
                    onClick={() => {
                      if (selectionMode) {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(puzzle.id)) next.delete(puzzle.id);
                          else next.add(puzzle.id);
                          return next;
                        });
                      } else {
                        setSelectedPuzzle(puzzle);
                        setShowDetailModal(true);
                      }
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
      </div>}

      <PuzzleDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        puzzle={selectedPuzzle}
      />
    </div>
  );
}


        function CommunityPuzzleCard({ puzzle, index, variant, onClick, selectionMode, isSelected, onToggleSelect, onAddToCollection, onStartSelection }) {
        // Icons needed
        const Star = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
        const Archive = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
        const Trophy = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
        return (
        <motion.div
        variants={item}
        onClick={onClick}
        className={`relative bg-white/[0.03] border rounded-xl overflow-hidden transition-all group cursor-pointer active:scale-95 ${
          isSelected ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-white/[0.06] hover:border-orange-500/30'
        }`}
        >
      {/* Selection checkbox overlay */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? 'bg-orange-500 border-orange-500' : 'bg-black/40 border-white/60'
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>
      )}

      {/* 3-dots menu (only when not in selection mode) */}
      {!selectionMode && (
        <div className="absolute top-1.5 right-1.5 z-10 opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10 z-50 min-w-[190px]">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onAddToCollection('wishlist'); }}
                className="text-white hover:bg-white/10 cursor-pointer gap-2"
              >
                <Star className="w-4 h-4 text-yellow-400" />
                Wishlist
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onAddToCollection('inbox'); }}
                className="text-white hover:bg-white/10 cursor-pointer gap-2"
              >
                <Archive className="w-4 h-4 text-blue-400" />
                Dans sa boîte
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onAddToCollection('done'); }}
                className="text-white hover:bg-white/10 cursor-pointer gap-2"
              >
                <Trophy className="w-4 h-4 text-green-400" />
                Terminé
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onStartSelection(); }}
                className="text-white/50 hover:bg-white/10 cursor-pointer gap-2 border-t border-white/10 mt-1 pt-1"
              >
                <CheckSquare className="w-4 h-4 text-orange-400" />
                Sélection multiple
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

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
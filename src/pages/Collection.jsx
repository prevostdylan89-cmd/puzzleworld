import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid,
  ChevronDown,
  X,
  Puzzle,
  Users,
  TrendingUp,
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
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const categories = ['All', 'Nature', 'Abstract', 'Urban', 'Space', 'Architecture', 'Vintage', 'Animals', 'Art'];

export default function Collection() {
  const [globalPuzzles, setGlobalPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [pieceFilter, setPieceFilter] = useState('');
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    loadGlobalPuzzles();
  }, [sortBy]);

  const loadGlobalPuzzles = async () => {
    try {
      setIsLoading(true);
      const sortOrder = sortBy === 'popular' ? '-completion_count' : 
                       sortBy === 'newest' ? '-created_date' :
                       sortBy === 'pieces-asc' ? 'puzzle_pieces' : '-puzzle_pieces';
      
      const data = await base44.entities.GlobalPuzzle.list(sortOrder);
      setGlobalPuzzles(data);

      // Extract unique brands
      const uniqueBrands = [...new Set(data.map(p => p.puzzle_brand).filter(Boolean))];
      setBrands(uniqueBrands);
    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast.error('Failed to load puzzles');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPuzzles = globalPuzzles.filter(puzzle => {
    const matchesSearch = !searchQuery || 
      puzzle.puzzle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      puzzle.puzzle_brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBrand = selectedBrand === 'all' || puzzle.puzzle_brand === selectedBrand;
    
    const matchesPieces = !pieceFilter || puzzle.puzzle_pieces?.toString() === pieceFilter;

    return matchesSearch && matchesBrand && matchesPieces;
  });

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-16 lg:top-16 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Global Puzzle Collection</h1>
              <p className="text-white/50 text-sm mt-1">Explore {globalPuzzles.length} puzzles from the community</p>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search puzzles..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
                />
              </div>

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

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a2e] border-white/10">
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              value={pieceFilter}
              onChange={(e) => setPieceFilter(e.target.value)}
              placeholder="Filter by pieces..."
              className="w-full sm:w-48 bg-white/5 border-white/10 text-white"
            />

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a2e] border-white/10">
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="pieces-asc">Pieces: Low to High</SelectItem>
                <SelectItem value="pieces-desc">Pieces: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Puzzle Grid */}
      <div className="px-4 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : filteredPuzzles.length === 0 ? (
          <div className="text-center py-12">
            <Puzzle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No puzzles found</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={`grid gap-4 ${
              viewMode === 'large' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}
          >
            {filteredPuzzles.map((puzzle) => (
              <motion.div 
                key={puzzle.id} 
                variants={item}
                className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-orange-500/30 transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-square overflow-hidden">
                  <img
                    src={puzzle.image_url || 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=400&fit=crop'}
                    alt={puzzle.puzzle_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-1">{puzzle.puzzle_name}</h3>
                  
                  <div className="space-y-2 text-sm">
                    {puzzle.puzzle_brand && (
                      <p className="text-white/60">{puzzle.puzzle_brand}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-white/50">
                        <Puzzle className="w-3.5 h-3.5 text-orange-400" />
                        {puzzle.puzzle_pieces} pcs
                      </span>
                      <span className="flex items-center gap-1 text-white/50">
                        <Users className="w-3.5 h-3.5 text-orange-400" />
                        {puzzle.completion_count || 0}
                      </span>
                    </div>

                    {puzzle.affiliate_link && (
                      <a
                        href={puzzle.affiliate_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center py-1.5 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Buy Now
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
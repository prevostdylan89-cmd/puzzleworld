import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid,
  ChevronDown,
  X,
  Puzzle
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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import PuzzleCard from '@/components/shared/PuzzleCard';

const allPuzzles = [
  {
    title: 'Starry Night Dreams',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
    pieces: 2000,
    difficulty: 'Hard',
    plays: 1523,
    rating: 4.9,
    creator: 'ArtMaster',
    category: 'Abstract'
  },
  {
    title: 'Ocean Sunset',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    pieces: 1000,
    difficulty: 'Medium',
    plays: 892,
    rating: 4.7,
    creator: 'NatureVibes',
    category: 'Nature'
  },
  {
    title: 'Mountain Peak',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop',
    pieces: 500,
    difficulty: 'Easy',
    plays: 2341,
    rating: 4.8,
    creator: 'Explorer',
    category: 'Nature'
  },
  {
    title: 'Cosmic Galaxy',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop',
    pieces: 1500,
    difficulty: 'Hard',
    plays: 5672,
    rating: 4.9,
    creator: 'SpaceExplorer',
    category: 'Space'
  },
  {
    title: 'Cherry Blossoms',
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=400&fit=crop',
    pieces: 750,
    difficulty: 'Medium',
    plays: 4231,
    rating: 4.6,
    creator: 'JapanLover',
    category: 'Nature'
  },
  {
    title: 'City Lights',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=400&fit=crop',
    pieces: 1000,
    difficulty: 'Medium',
    plays: 3892,
    rating: 4.7,
    creator: 'UrbanArt',
    category: 'Urban'
  },
  {
    title: 'Aurora Borealis',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=400&fit=crop',
    pieces: 2000,
    difficulty: 'Hard',
    plays: 3456,
    rating: 4.8,
    creator: 'NorthernLights',
    category: 'Nature'
  },
  {
    title: 'Ancient Temple',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=400&fit=crop',
    pieces: 1200,
    difficulty: 'Medium',
    plays: 2134,
    rating: 4.7,
    creator: 'HistoryBuff',
    category: 'Architecture'
  },
  {
    title: 'Tropical Paradise',
    image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=400&fit=crop',
    pieces: 800,
    difficulty: 'Easy',
    plays: 1876,
    rating: 4.5,
    creator: 'BeachLover',
    category: 'Nature'
  },
  {
    title: 'Abstract Colors',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop',
    pieces: 1500,
    difficulty: 'Hard',
    plays: 2987,
    rating: 4.8,
    creator: 'ModernArt',
    category: 'Abstract'
  },
  {
    title: 'Forest Trail',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=400&fit=crop',
    pieces: 600,
    difficulty: 'Easy',
    plays: 3421,
    rating: 4.6,
    creator: 'NatureWalk',
    category: 'Nature'
  },
  {
    title: 'Vintage Map',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop',
    pieces: 2500,
    difficulty: 'Hard',
    plays: 1543,
    rating: 4.9,
    creator: 'Cartographer',
    category: 'Vintage'
  }
];

const categories = ['All', 'Nature', 'Abstract', 'Urban', 'Space', 'Architecture', 'Vintage', 'Animals', 'Art'];
const difficulties = ['Easy', 'Medium', 'Hard'];

export default function Collection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilters, setActiveFilters] = useState([]);
  const [pieceRange, setPieceRange] = useState([0, 5000]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setActiveFilters([]);
    setPieceRange([0, 5000]);
    setSelectedDifficulties([]);
    setSearchQuery('');
  };

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
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Puzzle Collection</h1>
              <p className="text-white/50 text-sm mt-1">Explore {allPuzzles.length} puzzles</p>
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

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-white/10 text-white hover:bg-white/5">
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-[#000019] border-white/[0.06]">
                  <SheetHeader>
                    <SheetTitle className="text-white">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Piece Count */}
                    <div>
                      <label className="text-sm text-white/70 mb-3 block">Piece Count</label>
                      <Slider
                        value={pieceRange}
                        onValueChange={setPieceRange}
                        min={0}
                        max={5000}
                        step={100}
                        className="my-6"
                      />
                      <div className="flex justify-between text-sm text-white/50">
                        <span>{pieceRange[0]} pcs</span>
                        <span>{pieceRange[1]} pcs</span>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="text-sm text-white/70 mb-3 block">Difficulty</label>
                      <div className="space-y-2">
                        {difficulties.map((diff) => (
                          <div key={diff} className="flex items-center space-x-2">
                            <Checkbox
                              id={diff}
                              checked={selectedDifficulties.includes(diff)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDifficulties([...selectedDifficulties, diff]);
                                } else {
                                  setSelectedDifficulties(selectedDifficulties.filter(d => d !== diff));
                                }
                              }}
                              className="border-white/20 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <label htmlFor={diff} className="text-sm text-white/70">{diff}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={clearFilters}
                      variant="outline" 
                      className="w-full border-white/20 text-white hover:bg-white/5"
                    >
                      Clear All Filters
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

          {/* Categories */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                    : 'border-white/20 text-white/70 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Sort & Active Filters */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {activeFilters.map((filter, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="bg-orange-500/20 text-orange-400 border-orange-500/30 pl-2 pr-1"
                >
                  {filter}
                  <button 
                    className="ml-1 hover:bg-orange-500/30 rounded p-0.5"
                    onClick={() => setActiveFilters(activeFilters.filter((_, i) => i !== index))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a2e] border-white/10">
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="pieces-asc">Pieces: Low to High</SelectItem>
                <SelectItem value="pieces-desc">Pieces: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Puzzle Grid */}
      <div className="px-4 lg:px-8 py-6">
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
          {allPuzzles.map((puzzle, index) => (
            <motion.div key={index} variants={item}>
              <PuzzleCard puzzle={puzzle} variant={viewMode === 'large' ? 'large' : 'default'} />
            </motion.div>
          ))}
        </motion.div>

        {/* Load More */}
        <div className="flex justify-center mt-12">
          <Button 
            onClick={() => {
              // Scroll to top to see more puzzles
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/5 rounded-full px-8"
          >
            Back to Top
            <ChevronDown className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
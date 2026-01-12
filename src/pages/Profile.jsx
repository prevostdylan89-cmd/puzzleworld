import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Link as LinkIcon, 
  Edit3,
  Grid3X3,
  Trophy,
  Heart,
  Clock,
  Puzzle,
  Star,
  Search,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import AchievementBadge from '@/components/shared/AchievementBadge';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('completed');
  const [currentUser, setCurrentUser] = useState(null);
  const [completedPuzzles, setCompletedPuzzles] = useState([]);
  const [wishlistPuzzles, setWishlistPuzzles] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pieceFilter, setPieceFilter] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Load completed puzzles
      const completed = await base44.entities.CompletedPuzzle.filter(
        { user_email: user.email },
        '-created_date'
      );
      setCompletedPuzzles(completed);

      // Load wishlist
      const wishlist = await base44.entities.Wishlist.filter(
        { user_email: user.email },
        '-created_date'
      );
      setWishlistPuzzles(wishlist);

      // Load achievements
      const userAchievements = await base44.entities.Achievement.filter(
        { user_email: user.email }
      );
      setAchievements(userAchievements);

      // Check and award achievements
      await checkAchievements(user, completed);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAchievements = async (user, completed) => {
    const existingAchievements = await base44.entities.Achievement.filter({
      user_email: user.email
    });
    const existingTypes = existingAchievements.map(a => a.achievement_type);

    // First puzzle achievement
    if (completed.length >= 1 && !existingTypes.includes('first_puzzle')) {
      await base44.entities.Achievement.create({
        user_email: user.email,
        achievement_type: 'first_puzzle',
        title: 'First Steps',
        description: 'Complete your first puzzle',
        icon: 'trophy',
        color: 'orange',
        unlocked_at: new Date().toISOString()
      });
    }

    // Collector achievement (10 puzzles)
    if (completed.length >= 10 && !existingTypes.includes('collector')) {
      await base44.entities.Achievement.create({
        user_email: user.email,
        achievement_type: 'collector',
        title: 'Collector',
        description: 'Complete 10 puzzles',
        icon: 'star',
        color: 'blue',
        unlocked_at: new Date().toISOString()
      });
    }
  };

  const removeFromWishlist = async (itemId) => {
    try {
      await base44.entities.Wishlist.delete(itemId);
      setWishlistPuzzles(wishlistPuzzles.filter(p => p.id !== itemId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const filteredPuzzles = completedPuzzles.filter(puzzle => {
    const matchesSearch = !searchQuery || 
      puzzle.puzzle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      puzzle.puzzle_brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPieces = !pieceFilter || 
      puzzle.puzzle_pieces?.toString() === pieceFilter;

    return matchesSearch && matchesPieces;
  });

  const stats = [
    { label: 'Completed', value: completedPuzzles.length, icon: Puzzle },
    { label: 'Wishlist', value: wishlistPuzzles.length, icon: Heart },
    { label: 'Achievements', value: achievements.length, icon: Trophy },
    { label: 'Hours', value: '342', icon: Clock }
  ];

  const levelProgress = {
    current: Math.floor(completedPuzzles.length / 5) + 1,
    xp: completedPuzzles.length * 100,
    nextLevelXp: (Math.floor(completedPuzzles.length / 5) + 1) * 500,
    title: completedPuzzles.length > 20 ? 'Puzzle Master' : 'Puzzle Enthusiast'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 lg:h-64 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&h=400&fit=crop"
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000019] via-[#000019]/50 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="px-4 lg:px-8 -mt-20 relative">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Avatar className="h-32 w-32 lg:h-40 lg:w-40 ring-4 ring-[#000019] border-4 border-orange-500/30">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-3xl lg:text-4xl">
                  {currentUser?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    {currentUser?.full_name || 'User'}
                  </h1>
                  <p className="text-white/50">{currentUser?.email}</p>
                </div>
              </div>
              
              <p className="text-white/70 mt-3 max-w-xl">
                Puzzle enthusiast. I love landscapes, abstract art, and anything with 1000+ pieces! 🧩
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  Joined {format(new Date(currentUser?.created_date || new Date()), 'MMM yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 text-center"
              >
                <stat.icon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Level Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-white/[0.06] rounded-2xl p-5 mt-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-orange-400 font-bold text-lg">Level {levelProgress.current}</span>
                <span className="text-white/50 ml-2">{levelProgress.title}</span>
              </div>
              <span className="text-white/50 text-sm">
                {levelProgress.xp.toLocaleString()} / {levelProgress.nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <Progress 
              value={(levelProgress.xp / levelProgress.nextLevelXp) * 100} 
              className="h-2 bg-white/10"
            />
          </motion.div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 lg:px-8 mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 w-full lg:w-auto">
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 lg:flex-none"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Completed ({completedPuzzles.length})
            </TabsTrigger>
            <TabsTrigger 
              value="achievements"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 lg:flex-none"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger 
              value="wishlist"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 lg:flex-none"
            >
              <Heart className="w-4 h-4 mr-2" />
              Wishlist ({wishlistPuzzles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="mt-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or brand..."
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Input
                type="number"
                value={pieceFilter}
                onChange={(e) => setPieceFilter(e.target.value)}
                placeholder="Filter by pieces..."
                className="sm:w-48 bg-white/5 border-white/10 text-white"
              />
            </div>

            {filteredPuzzles.length === 0 ? (
              <div className="text-center py-12">
                <Puzzle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">
                  {searchQuery || pieceFilter ? 'No puzzles match your search' : 'No completed puzzles yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPuzzles.map((puzzle, index) => (
                  <motion.div
                    key={puzzle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden group"
                  >
                    {puzzle.image_url && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={puzzle.image_url}
                          alt={puzzle.puzzle_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1">{puzzle.puzzle_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        {puzzle.puzzle_brand && <span>{puzzle.puzzle_brand}</span>}
                        {puzzle.puzzle_brand && puzzle.puzzle_pieces && <span>•</span>}
                        {puzzle.puzzle_pieces && <span>{puzzle.puzzle_pieces} pieces</span>}
                      </div>
                      <p className="text-xs text-white/40 mt-2">
                        {format(new Date(puzzle.created_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            {achievements.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Complete puzzles to unlock achievements!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AchievementBadge 
                      achievement={{
                        title: achievement.title,
                        icon: achievement.icon,
                        color: achievement.color,
                        unlocked: true,
                        description: achievement.description
                      }} 
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6">
            {wishlistPuzzles.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Your wishlist is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistPuzzles.map((puzzle, index) => (
                  <motion.div
                    key={puzzle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden group relative"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWishlist(puzzle.id)}
                      className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {puzzle.image_url && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={puzzle.image_url}
                          alt={puzzle.puzzle_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1">{puzzle.puzzle_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        {puzzle.puzzle_brand && <span>{puzzle.puzzle_brand}</span>}
                        {puzzle.puzzle_brand && puzzle.puzzle_pieces && <span>•</span>}
                        {puzzle.puzzle_pieces && <span>{puzzle.puzzle_pieces} pieces</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
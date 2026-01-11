import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import PuzzleCard from '@/components/shared/PuzzleCard';
import AchievementBadge from '@/components/shared/AchievementBadge';

const stats = [
  { label: 'Completed', value: '127', icon: Puzzle },
  { label: 'Hours', value: '342', icon: Clock },
  { label: 'Followers', value: '1.2K', icon: Heart },
  { label: 'Rating', value: '4.9', icon: Star }
];

const completedPuzzles = [
  {
    title: 'Starry Night',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
    pieces: 2000,
    difficulty: 'Hard',
    plays: 234,
    rating: 4.9,
    creator: 'ArtMaster'
  },
  {
    title: 'Ocean Waves',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    pieces: 1000,
    difficulty: 'Medium',
    plays: 456,
    rating: 4.7,
    creator: 'NatureVibes'
  },
  {
    title: 'Forest Trail',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=400&fit=crop',
    pieces: 500,
    difficulty: 'Easy',
    plays: 789,
    rating: 4.6,
    creator: 'Explorer'
  },
  {
    title: 'City Skyline',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=400&fit=crop',
    pieces: 1500,
    difficulty: 'Hard',
    plays: 321,
    rating: 4.8,
    creator: 'UrbanArt'
  }
];

const wishlistPuzzles = [
  {
    title: 'Northern Lights',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=400&fit=crop',
    pieces: 3000,
    difficulty: 'Hard',
    plays: 567,
    rating: 4.9,
    creator: 'ArcticView'
  },
  {
    title: 'Ancient Temple',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=400&fit=crop',
    pieces: 2000,
    difficulty: 'Hard',
    plays: 890,
    rating: 4.8,
    creator: 'HistoryBuff'
  }
];

const achievements = [
  { title: 'First Steps', icon: 'trophy', color: 'orange', unlocked: true, description: 'Complete your first puzzle' },
  { title: 'Speed Demon', icon: 'zap', color: 'purple', unlocked: true, description: 'Complete under 1 hour' },
  { title: 'Perfectionist', icon: 'star', color: 'blue', unlocked: true, description: '10 puzzles with 5-star rating' },
  { title: 'Night Owl', icon: 'target', color: 'green', unlocked: true, description: 'Complete puzzle after midnight' },
  { title: 'Master', icon: 'crown', color: 'pink', unlocked: false, progress: 75, description: 'Complete 100 hard puzzles' },
  { title: 'Legend', icon: 'award', color: 'orange', unlocked: false, progress: 30, description: 'Reach top 100 leaderboard' }
];

const levelProgress = {
  current: 24,
  xp: 7250,
  nextLevelXp: 10000,
  title: 'Puzzle Enthusiast'
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState('completed');

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
                  JD
                </AvatarFallback>
              </Avatar>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">John Doe</h1>
                  <p className="text-white/50">@puzzlemaster</p>
                </div>
                <Button 
                  variant="outline" 
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 w-fit"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              
              <p className="text-white/70 mt-3 max-w-xl">
                Puzzle enthusiast since 2020. I love landscapes, abstract art, and anything with 2000+ pieces! 🧩
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  New York, USA
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  Joined March 2020
                </span>
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-orange-400" />
                  puzzlemaster.io
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
              Completed
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
              Wishlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="mt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {completedPuzzles.map((puzzle, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PuzzleCard puzzle={puzzle} />
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
                Load More
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AchievementBadge achievement={achievement} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {wishlistPuzzles.map((puzzle, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PuzzleCard puzzle={puzzle} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
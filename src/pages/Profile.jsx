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
  LogIn,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import AchievementBadge from '@/components/shared/AchievementBadge';
import CompletedPuzzlesSection from '@/components/profile/CompletedPuzzlesSection';
import WishlistSection from '@/components/profile/WishlistSection';



export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('completed');
  const [stats, setStats] = useState({
    completed: 0,
    hours: 0,
    achievements: 0,
    wishlist: 0
  });
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Load stats
      const [completedPuzzles, userAchievements, wishlistItems] = await Promise.all([
        base44.entities.CompletedPuzzle.filter({ created_by: currentUser.email }),
        base44.entities.Achievement.filter({ created_by: currentUser.email }),
        base44.entities.Wishlist.filter({ created_by: currentUser.email })
      ]);

      setStats({
        completed: completedPuzzles.length,
        hours: Math.floor(completedPuzzles.length * 8.5), // Estimate
        achievements: userAchievements.length,
        wishlist: wishlistItems.length
      });

      setAchievements(userAchievements);
    } catch (error) {
      console.log('User not logged in');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 text-center max-w-md"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to PuzzleHub</h2>
          <p className="text-white/60 mb-6">Log in to view your profile, track completed puzzles, and manage your wishlist</p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Log In
          </Button>
        </motion.div>
      </div>
    );
  }

  const userInitials = user.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const joinedDate = user.created_date 
    ? formatDistanceToNow(new Date(user.created_date), { addSuffix: true })
    : 'Recently';

  const levelProgress = {
    current: Math.floor(stats.completed / 5) + 1,
    xp: stats.completed * 100,
    nextLevelXp: (Math.floor(stats.completed / 5) + 1) * 500,
    title: stats.completed > 50 ? 'Puzzle Master' : stats.completed > 20 ? 'Puzzle Expert' : 'Puzzle Enthusiast'
  };

  const statItems = [
    { label: 'Completed', value: stats.completed, icon: Puzzle },
    { label: 'Hours', value: stats.hours, icon: Clock },
    { label: 'Achievements', value: stats.achievements, icon: Trophy },
    { label: 'Wishlist', value: stats.wishlist, icon: Heart }
  ];

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
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-3xl lg:text-4xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">{user.full_name || user.email}</h1>
                  <p className="text-white/50">@{user.email.split('@')[0]}</p>
                </div>
                <Button 
                  onClick={() => base44.auth.logout()}
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/5 w-fit"
                >
                  Log Out
                </Button>
              </div>
              
              <p className="text-white/70 mt-3 max-w-xl">
                Welcome to your puzzle journey dashboard! Track your completed puzzles and build your wishlist.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  Joined {joinedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {statItems.map((stat, index) => (
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
            <CompletedPuzzlesSection user={user} />
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            {achievements.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No achievements yet</p>
                <p className="text-white/30 text-sm mt-2">Complete puzzles to unlock badges!</p>
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
            <WishlistSection user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
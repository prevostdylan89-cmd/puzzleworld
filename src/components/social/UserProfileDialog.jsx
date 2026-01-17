import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Puzzle, Trophy, Heart, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function UserProfileDialog({ userEmail, onClose }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ completed: 0, achievements: 0, wishlist: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userEmail]);

  const loadUserProfile = async () => {
    try {
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length > 0) {
        const userData = users[0];
        setUser(userData);
        
        // Load stats
        const [completedPuzzles, userAchievements, wishlistItems] = await Promise.all([
          base44.entities.CompletedPuzzle.filter({ created_by: userEmail }),
          base44.entities.Achievement.filter({ created_by: userEmail }),
          base44.entities.Wishlist.filter({ created_by: userEmail })
        ]);

        setStats({
          completed: completedPuzzles.length,
          achievements: userAchievements.length,
          wishlist: wishlistItems.length
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement follow functionality in backend
  };

  if (!user) return null;

  const userInitials = user.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const joinedDate = user.created_date 
    ? formatDistanceToNow(new Date(user.created_date), { addSuffix: true })
    : 'Recently';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-orange-500/20 to-purple-500/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-16 mb-4">
            <Avatar className="h-24 w-24 ring-4 ring-[#0a0a2e] border-2 border-orange-500/30">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 mb-2">
              <Button 
                onClick={handleFollow}
                className={`w-full rounded-xl ${
                  isFollowing 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">{user.full_name || user.email}</h2>
            <p className="text-white/50 text-sm">@{user.email.split('@')[0]}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>Joined {joinedDate}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Puzzle className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.completed}</div>
              <div className="text-xs text-white/50">Completed</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Trophy className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.achievements}</div>
              <div className="text-xs text-white/50">Achievements</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Heart className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.wishlist}</div>
              <div className="text-xs text-white/50">Wishlist</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
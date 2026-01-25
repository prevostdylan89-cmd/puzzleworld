import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Puzzle, Trophy, Heart, UserPlus, UserCheck, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import UserBadge from '@/components/shared/UserBadge';

export default function UserProfileDialog({ userEmail, onClose }) {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({ completed: 0, achievements: 0, wishlist: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedPuzzles, setCompletedPuzzles] = useState([]);

  useEffect(() => {
    loadUserProfile();
  }, [userEmail]);

  const loadUserProfile = async () => {
    try {
      // Get current user
      const loggedUser = await base44.auth.me().catch(() => null);
      setCurrentUser(loggedUser);

      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length > 0) {
        const userData = users[0];
        setUser(userData);
        
        // Load stats and puzzles
        const [puzzles, userAchievements, wishlistItems, followers, following] = await Promise.all([
          base44.entities.CompletedPuzzle.filter({ created_by: userEmail }),
          base44.entities.Achievement.filter({ created_by: userEmail }),
          base44.entities.Wishlist.filter({ created_by: userEmail }),
          base44.entities.Follow.filter({ following_email: userEmail }),
          base44.entities.Follow.filter({ follower_email: userEmail })
        ]);

        setCompletedPuzzles(puzzles);
        setStats({
          completed: puzzles.length,
          achievements: userAchievements.length,
          wishlist: wishlistItems.length,
          followers: followers.length,
          following: following.length
        });

        // Check if following
        if (loggedUser) {
          const followCheck = await base44.entities.Follow.filter({
            follower_email: loggedUser.email,
            following_email: userEmail
          });
          setIsFollowing(followCheck.length > 0);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Connectez-vous pour suivre des utilisateurs');
      return;
    }

    try {
      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: userEmail
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
          setIsFollowing(false);
          setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
          toast.success('Vous ne suivez plus cet utilisateur');
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: userEmail
        });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        toast.success('Vous suivez maintenant cet utilisateur!');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Échec de la mise à jour du suivi');
    }
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
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
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

        {/* Profile Info - Scrollable */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <div className="flex items-end gap-4 -mt-16 mb-4">
            <Avatar className="h-24 w-24 ring-4 ring-[#0a0a2e] border-2 border-orange-500/30">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {currentUser && currentUser.email !== userEmail && (
              <div className="flex-1 mb-2">
                <Button 
                  onClick={handleFollow}
                  className={`w-full rounded-xl ${
                    isFollowing 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Suivi
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Suivre
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{user.full_name || user.email}</h2>
              <UserBadge userEmail={userEmail} size="md" showLabel={false} />
            </div>
            <p className="text-white/50 text-sm">@{user.email.split('@')[0]}</p>
          </div>

          <div className="flex items-center gap-4 text-sm mb-6">
            <span className="flex items-center gap-1.5 text-white/50">
              <Calendar className="w-4 h-4 text-orange-400" />
              Inscrit {joinedDate}
            </span>
            <span className="text-white/70">
              <span className="font-semibold text-white">{stats.followers}</span> Followers
            </span>
            <span className="text-white/70">
              <span className="font-semibold text-white">{stats.following}</span> Abonnements
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Puzzle className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.completed}</div>
              <div className="text-xs text-white/50">Puzzles</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Trophy className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.achievements}</div>
              <div className="text-xs text-white/50">Succès</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Heart className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.wishlist}</div>
              <div className="text-xs text-white/50">Souhaits</div>
            </div>
          </div>

          {/* Collection */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              Collection Personnelle
            </h3>
            {completedPuzzles.length === 0 ? (
              <div className="text-center py-8 text-white/50 text-sm">
                Aucun puzzle complété pour le moment
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {completedPuzzles.slice(0, 6).map((puzzle) => (
                  <div key={puzzle.id} className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                    {puzzle.image_url && (
                      <img 
                        src={puzzle.image_url} 
                        alt={puzzle.puzzle_name}
                        className="w-full h-24 object-cover"
                      />
                    )}
                    <div className="p-2">
                      <p className="text-white text-xs font-medium truncate">{puzzle.puzzle_name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-white/40 text-[10px]">{puzzle.puzzle_brand}</span>
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] px-1 py-0">
                          {puzzle.puzzle_pieces} pcs
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {completedPuzzles.length > 6 && (
              <p className="text-center text-white/40 text-xs mt-3">
                +{completedPuzzles.length - 6} autres puzzles
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
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
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestPending, setFriendRequestPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedPuzzles, setCompletedPuzzles] = useState([]);

  useEffect(() => {
    setUser(null);
    setLoading(true);
    setStats({ completed: 0, achievements: 0, wishlist: 0, followers: 0, following: 0 });
    setCompletedPuzzles([]);
    setIsFollowing(false);
    setIsFriend(false);
    setFriendRequestPending(false);
    loadUserProfile();
  }, [userEmail]);

  const loadUserProfile = async () => {
    try {
      // Get current user
      const loggedUser = await base44.auth.me().catch(() => null);
      setCurrentUser(loggedUser);

      // Try to get from UserProfile first (public data)
      const profiles = await base44.entities.UserProfile.filter({ email: userEmail });
      let userData = null;
      
      if (profiles.length > 0) {
        userData = profiles[0];
      } else {
        // Fallback to User entity if profile not found
        const users = await base44.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          userData = users[0];
        }
      }
      
      if (userData) {
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

        // Check if following and friend status
        if (loggedUser) {
          const [followCheck, friendships] = await Promise.all([
            base44.entities.Follow.filter({
              follower_email: loggedUser.email,
              following_email: userEmail
            }),
            base44.entities.Friendship.filter({})
          ]);
          setIsFollowing(followCheck.length > 0);

          // Check if already friends or has pending request
          const friendship = friendships.find(f => 
            (f.requester_email === loggedUser.email && f.addressee_email === userEmail) ||
            (f.addressee_email === loggedUser.email && f.requester_email === userEmail)
          );

          if (friendship) {
            setIsFriend(friendship.status === 'accepted');
            setFriendRequestPending(friendship.status === 'pending');
          }
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

    // Optimistic update
    const previousFollowing = isFollowing;
    const previousStats = stats;
    setIsFollowing(!isFollowing);
    setStats(prev => ({ 
      ...prev, 
      followers: isFollowing ? prev.followers - 1 : prev.followers + 1 
    }));
    toast.success(isFollowing ? 'Suivi retiré' : 'Vous suivez cet utilisateur');

    try {
      if (previousFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: userEmail
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: userEmail
        });
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(previousFollowing);
      setStats(previousStats);
      console.error('Error toggling follow:', error);
      toast.error('Échec de la mise à jour du suivi');
    }
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser) {
      toast.error('Connectez-vous pour ajouter des amis');
      return;
    }

    try {
      await base44.entities.Friendship.create({
        requester_email: currentUser.email,
        requester_name: currentUser.full_name || currentUser.email,
        addressee_email: userEmail,
        addressee_name: user.full_name || user.email,
        status: 'pending'
      });
      setFriendRequestPending(true);
      toast.success('Demande d\'ami envoyée');
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
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
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl w-full max-w-sm"
        style={{ height: '420px' }}
      >
        {/* Header banner */}
        <div className="relative h-20 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-t-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content — fixed height, no scroll */}
        <div className="px-5 pb-5" style={{ marginTop: '-40px' }}>
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between mb-3">
            <Avatar className="h-16 w-16 ring-4 ring-[#0a0a2e] border-2 border-orange-500/30 flex-shrink-0">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xl">
                  {userInitials}
                </AvatarFallback>
              )}
            </Avatar>

            {currentUser && currentUser.email !== userEmail && (
              <div className="flex gap-2 mb-1">
                <Button
                  onClick={handleFollow}
                  size="sm"
                  className={`rounded-lg text-xs h-8 ${
                    isFollowing
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {isFollowing ? <><UserCheck className="w-3 h-3 mr-1" />Suivi</> : <><UserPlus className="w-3 h-3 mr-1" />Suivre</>}
                </Button>
                {!isFriend && !friendRequestPending && (
                  <Button size="sm" onClick={handleSendFriendRequest} className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs h-8">
                    <Users className="w-3 h-3 mr-1" />Ami
                  </Button>
                )}
                {friendRequestPending && (
                  <Button size="sm" disabled className="rounded-lg bg-white/10 text-white/50 text-xs h-8">
                    <Users className="w-3 h-3 mr-1" />En attente
                  </Button>
                )}
                {isFriend && (
                  <Button size="sm" disabled className="rounded-lg bg-green-500/20 text-green-400 text-xs h-8">
                    <UserCheck className="w-3 h-3 mr-1" />Amis
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Name & tag */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{user.full_name || user.email}</h2>
              <UserBadge userEmail={userEmail} size="sm" showLabel={false} />
            </div>
            <p className="text-white/40 text-xs">@{user.email.split('@')[0]}</p>
          </div>

          {/* Followers row */}
          <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-orange-400" />
              Inscrit {joinedDate}
            </span>
            <span><span className="font-semibold text-white">{stats.followers}</span> Followers</span>
            <span><span className="font-semibold text-white">{stats.following}</span> Abonnements</span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Puzzle className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.completed}</div>
              <div className="text-[11px] text-white/50">Terminés</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Trophy className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.achievements}</div>
              <div className="text-[11px] text-white/50">Succès</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Heart className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.wishlist}</div>
              <div className="text-[11px] text-white/50">Wishlist</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
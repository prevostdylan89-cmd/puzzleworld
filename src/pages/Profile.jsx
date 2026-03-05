import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
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
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AchievementBadge from '@/components/shared/AchievementBadge';
import WishlistSection from '@/components/profile/WishlistSection';
import CollectionSection from '@/components/profile/CollectionSection';
import ExchangeSection from '@/components/profile/ExchangeSection';
import LikedPuzzlesSection from '@/components/profile/LikedPuzzlesSection';
import { CompletedPuzzlesModal, AchievementsModal, WishlistModal } from '@/components/profile/StatsModal';
import BadgesModal from '@/components/profile/BadgesModal';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import { Crown, Camera } from 'lucide-react';



export default function Profile() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('collection');
  const [stats, setStats] = useState({
    completed: 0,
    achievements: 0,
    wishlist: 0,
    followers: 0,
    following: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [currentBadge, setCurrentBadge] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Sync user profile to UserProfile entity
      await base44.functions.invoke('syncUserProfile', {});
      
      // Load stats
      const [completedPuzzles, userAchievements, wishlistItems, followers, following] = await Promise.all([
        base44.entities.UserPuzzle.filter({ created_by: currentUser.email, status: 'done' }),
        base44.entities.Achievement.filter({ created_by: currentUser.email }),
        base44.entities.UserPuzzle.filter({ created_by: currentUser.email, status: 'wishlist' }),
        base44.entities.Follow.filter({ following_email: currentUser.email }),
        base44.entities.Follow.filter({ follower_email: currentUser.email })
      ]);

      setStats({
        completed: completedPuzzles.length,
        achievements: userAchievements.length,
        wishlist: wishlistItems.length,
        followers: followers.length,
        following: following.length
      });

      setAchievements(userAchievements);
      
      // Load and initialize badges
      await initializeBadges(currentUser, completedPuzzles.length);
    } catch (error) {
      console.log('User not logged in');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeBadges = async (currentUser, completedCount) => {
    try {
      // Load all system badges
      let allBadges = await base44.entities.Badge.list();
      
      // If no badges exist, create default ones
      if (allBadges.length === 0) {
        const defaultBadges = [
          { name: 'Novice', description: 'Bienvenue ! Commencez votre aventure puzzle', icon: '🧩', color: '#94a3b8', requirement_type: 'puzzles_completed', requirement_value: 0, level: 1 },
          { name: 'Amateur', description: 'Complétez 5 puzzles', icon: '🎯', color: '#60a5fa', requirement_type: 'puzzles_completed', requirement_value: 5, level: 2 },
          { name: 'Passionné', description: 'Complétez 15 puzzles', icon: '⭐', color: '#fbbf24', requirement_type: 'puzzles_completed', requirement_value: 15, level: 3 },
          { name: 'Expert', description: 'Complétez 30 puzzles', icon: '💎', color: '#a78bfa', requirement_type: 'puzzles_completed', requirement_value: 30, level: 4 },
          { name: 'Maître', description: 'Complétez 50 puzzles', icon: '👑', color: '#f97316', requirement_type: 'puzzles_completed', requirement_value: 50, level: 5 },
          { name: 'Légende', description: 'Complétez 100 puzzles', icon: '🏆', color: '#ef4444', requirement_type: 'puzzles_completed', requirement_value: 100, level: 6 }
        ];

        for (const badge of defaultBadges) {
          await base44.entities.Badge.create(badge);
        }
        
        allBadges = await base44.entities.Badge.list();
      }

      // Find which badge user should have based on completed puzzles
      const sortedBadges = allBadges
        .filter(b => b.requirement_type === 'puzzles_completed')
        .sort((a, b) => b.requirement_value - a.requirement_value);

      const earnedBadge = sortedBadges.find(b => completedCount >= b.requirement_value) || sortedBadges[sortedBadges.length - 1];

      if (earnedBadge) {
        // Check if user already has this badge
        const userBadges = await base44.entities.UserBadge.filter({
          created_by: currentUser.email
        });

        const hasBadge = userBadges.some(ub => ub.badge_id === earnedBadge.id);

        if (!hasBadge) {
          // Deactivate all other badges
          for (const ub of userBadges) {
            await base44.entities.UserBadge.update(ub.id, { is_active: false });
          }
          
          // Create and activate the earned badge
          await base44.entities.UserBadge.create({
            badge_id: earnedBadge.id,
            badge_name: earnedBadge.name,
            is_active: true
          });
        } else {
          // Make sure the correct badge is active
          for (const ub of userBadges) {
            await base44.entities.UserBadge.update(ub.id, {
              is_active: ub.badge_id === earnedBadge.id
            });
          }
        }

        setCurrentBadge(earnedBadge);
      }
    } catch (error) {
      console.error('Error initializing badges:', error);
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
          <h2 className="text-2xl font-bold text-white mb-4">Bienvenue sur PuzzleWorld</h2>
          <p className="text-white/60 mb-6">{t('logInToViewProfile')}</p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {t('logIn')}
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

  const currentXP = user?.xp || 0;
  
  const getLevelInfo = (xp) => {
    if (xp < 500) return { level: 1, name: 'Novice', nextXP: 500 };
    if (xp < 1500) return { level: 2, name: 'Assembleur', nextXP: 1500 };
    if (xp < 3000) return { level: 3, name: 'Expert du Puzzle', nextXP: 3000 };
    return { level: 3, name: 'Expert du Puzzle', nextXP: 3000 };
  };

  const levelInfo = getLevelInfo(currentXP);
  const levelProgress = {
    current: levelInfo.level,
    xp: currentXP,
    nextLevelXp: levelInfo.nextXP,
    title: levelInfo.name
  };

  const statItems = [
    { label: t('completed'), value: stats.completed, icon: Puzzle, onClick: () => setShowCompletedModal(true) },
    { label: t('achievements'), value: stats.achievements, icon: Trophy, onClick: () => setShowAchievementsModal(true) },
    { label: t('wishlist'), value: stats.wishlist, icon: Heart, onClick: () => setShowWishlistModal(true) }
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 lg:h-64 relative overflow-hidden group">
          <img
            src={user.cover_photo || "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&h=400&fit=crop"}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000019] via-[#000019]/50 to-transparent" />
          <div className="absolute top-4 right-4">
            <EditProfileDialog user={user} onUpdate={loadUserData} />
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 lg:px-8 -mt-20 relative">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <Avatar className="h-32 w-32 lg:h-40 lg:w-40 ring-4 ring-[#000019] border-4 border-orange-500/30">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt={user.full_name || user.email} className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-3xl lg:text-4xl">
                    {userInitials}
                  </AvatarFallback>
                )}
              </Avatar>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">{user.full_name || user.email}</h1>
                    {currentBadge && (
                      <button
                        onClick={() => setShowBadgesModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:scale-105"
                        style={{
                          backgroundColor: `${currentBadge.color}20`,
                          borderColor: `${currentBadge.color}50`
                        }}
                      >
                        <span className="text-2xl">{currentBadge.icon || '🏆'}</span>
                        <span className="font-semibold text-sm" style={{ color: currentBadge.color }}>
                          {currentBadge.name}
                        </span>
                      </button>
                    )}
                  </div>
                  <p className="text-white/50">@{user.email.split('@')[0]}</p>
                </div>
                <Button 
                  onClick={() => base44.auth.logout()}
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/5 w-fit"
                >
                  {t('logOut')}
                </Button>
              </div>
              
              <p className="text-white/70 mt-3 max-w-xl">
                {t('welcomeToDashboard')}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1.5 text-white/50">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  {t('joined')} {joinedDate}
                </span>
                <span className="text-white/70">
                  <span className="font-semibold text-white">{stats.followers}</span> Followers
                </span>
                <span className="text-white/70">
                  <span className="font-semibold text-white">{stats.following}</span> Abonnements
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {statItems.map((stat, index) => (
              <motion.button
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={stat.onClick}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 text-center hover:border-orange-500/30 hover:bg-white/5 transition-all cursor-pointer"
              >
                <stat.icon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </motion.button>
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
                <span className="text-orange-400 font-bold text-lg">{t('level')} {levelProgress.current}</span>
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
          <TabsList className="bg-white/5 border border-white/10 w-full">
            <TabsTrigger 
              value="collection" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm"
            >
              <Puzzle className="w-4 h-4 shrink-0" />
              <span className="ml-1.5 hidden sm:inline">Ma Collection</span>
              <span className="ml-1.5 sm:hidden">Collection</span>
            </TabsTrigger>
            <TabsTrigger 
              value="wishlist" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm"
            >
              <Heart className="w-4 h-4 shrink-0" />
              <span className="ml-1.5">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger 
              value="exchange"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm"
            >
              <Grid3X3 className="w-4 h-4 shrink-0" />
              <span className="ml-1.5 hidden sm:inline">À Vendre / Échanger</span>
              <span className="ml-1.5 sm:hidden">Échange</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-6">
            <CollectionSection user={user} />
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6">
            <WishlistSection user={user} />
          </TabsContent>

          <TabsContent value="exchange" className="mt-6">
            <ExchangeSection user={user} />
          </TabsContent>


        </Tabs>

        {/* My Events Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-400" />
            {t('myEvents')}
          </h2>
          <MyEventsSection user={user} />
        </div>

        {/* Delete Account Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Paramètres du compte</h2>
          <DeleteAccountSection />
        </div>
      </div>

      {/* Modals */}
      <CompletedPuzzlesModal open={showCompletedModal} onClose={() => setShowCompletedModal(false)} user={user} />
      <AchievementsModal open={showAchievementsModal} onClose={() => setShowAchievementsModal(false)} user={user} />
      <WishlistModal open={showWishlistModal} onClose={() => setShowWishlistModal(false)} user={user} />
      <BadgesModal open={showBadgesModal} onClose={() => setShowBadgesModal(false)} user={user} />
    </div>
  );
}

function MyEventsSection({ user }) {
  const { t } = useLanguage();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserEvents();
  }, [user]);

  const loadUserEvents = async () => {
    try {
      // Get user's event participations
      const participations = await base44.entities.EventParticipant.filter({
        user_email: user.email
      });

      if (participations.length === 0) {
        setRegisteredEvents([]);
        setLoading(false);
        return;
      }

      // Get event details for each participation
      const eventIds = participations.map(p => p.event_id);
      const allEvents = await base44.entities.Event.list();
      const userEvents = allEvents.filter(event => eventIds.includes(event.id));

      // Sort by date
      userEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

      setRegisteredEvents(userEvents);
    } catch (error) {
      console.error('Error loading user events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (registeredEvents.length === 0) {
    return (
      <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
        <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">{t('noEvents')}</p>
        <p className="text-white/30 text-sm mt-2">Inscrivez-vous à des événements pour les voir ici</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = registeredEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  const pastEvents = registeredEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  });

  return (
    <div className="space-y-8">
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">{t('upcomingEvents')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} onUnregister={loadUserEvents} />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white/70 mb-4">Événements passés</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onUnregister }) {
  const [loading, setLoading] = useState(false);
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const isPast = eventDate && eventDate < new Date();

  const handleUnregister = async (e) => {
    e.stopPropagation();
    
    if (!confirm('Voulez-vous vraiment vous désinscrire de cet événement ?')) {
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Find and delete participation
      const participations = await base44.entities.EventParticipant.filter({
        event_id: event.id,
        user_email: user.email
      });

      if (participations.length > 0) {
        await base44.entities.EventParticipant.delete(participations[0].id);
        
        // Update participant count
        await base44.entities.Event.update(event.id, {
          current_participants: Math.max(0, event.current_participants - 1)
        });

        if (onUnregister) {
          onUnregister();
        }
      }
    } catch (error) {
      console.error('Error unregistering:', error);
      alert('Erreur lors de la désinscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all">
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h4 className="text-white font-semibold mb-2 line-clamp-1">{event.title}</h4>
        {eventDate && (
          <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>
              {format(eventDate, 'dd MMM yyyy', { locale: fr })}
              {event.event_time && ` • ${event.event_time}`}
            </span>
          </div>
        )}
        {isPast ? (
          <span className="inline-block text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
            Terminé
          </span>
        ) : (
          <Button
            onClick={handleUnregister}
            disabled={loading}
            size="sm"
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            {loading ? 'Désinscription...' : 'Se désinscrire'}
          </Button>
        )}
      </div>
    </div>
  );
}
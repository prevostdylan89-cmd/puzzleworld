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
import CompletedPuzzlesSection from '@/components/profile/CompletedPuzzlesSection';
import WishlistSection from '@/components/profile/WishlistSection';
import UserBadge from '@/components/shared/UserBadge';



export default function Profile() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('completed');
  const [stats, setStats] = useState({
    completed: 0,
    hours: 0,
    achievements: 0,
    wishlist: 0,
    followers: 0,
    following: 0
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
      const [completedPuzzles, userAchievements, wishlistItems, followers, following] = await Promise.all([
        base44.entities.CompletedPuzzle.filter({ created_by: currentUser.email }),
        base44.entities.Achievement.filter({ created_by: currentUser.email }),
        base44.entities.Wishlist.filter({ created_by: currentUser.email }),
        base44.entities.Follow.filter({ following_email: currentUser.email }),
        base44.entities.Follow.filter({ follower_email: currentUser.email })
      ]);

      setStats({
        completed: completedPuzzles.length,
        hours: Math.floor(completedPuzzles.length * 8.5),
        achievements: userAchievements.length,
        wishlist: wishlistItems.length,
        followers: followers.length,
        following: following.length
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
          <h2 className="text-2xl font-bold text-white mb-4">{t('welcomeProfile')}</h2>
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

  const levelProgress = {
    current: Math.floor(stats.completed / 5) + 1,
    xp: stats.completed * 100,
    nextLevelXp: (Math.floor(stats.completed / 5) + 1) * 500,
    title: stats.completed > 50 ? t('puzzleMaster') : stats.completed > 20 ? t('puzzleExpert') : t('puzzleEnthusiast')
  };

  const statItems = [
    { label: t('completed'), value: stats.completed, icon: Puzzle },
    { label: t('hours'), value: stats.hours, icon: Clock },
    { label: t('achievements'), value: stats.achievements, icon: Trophy },
    { label: t('wishlist'), value: stats.wishlist, icon: Heart }
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
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">{user.full_name || user.email}</h1>
                    <UserBadge userEmail={user.email} size="lg" showLabel={true} />
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
          <TabsList className="bg-white/5 border border-white/10 w-full lg:w-auto">
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 lg:flex-none"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              {t('completed')}
            </TabsTrigger>
            <TabsTrigger 
              value="achievements"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 lg:flex-none"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {t('achievements')}
            </TabsTrigger>
            <TabsTrigger 
              value="wishlist"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 lg:flex-none"
            >
              <Heart className="w-4 h-4 mr-2" />
              {t('wishlist')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="mt-6">
            <CompletedPuzzlesSection user={user} />
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            {achievements.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">{t('noAchievements')}</p>
                <p className="text-white/30 text-sm mt-2">{t('completeToUnlock')}</p>
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

        {/* My Events Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-400" />
            {t('myEvents')}
          </h2>
          <MyEventsSection user={user} />
        </div>
      </div>
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
              <EventCard key={event.id} event={event} />
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

function EventCard({ event }) {
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const isPast = eventDate && eventDate < new Date();

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
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>
              {format(eventDate, 'dd MMM yyyy', { locale: fr })}
              {event.event_time && ` • ${event.event_time}`}
            </span>
          </div>
        )}
        {isPast && (
          <span className="inline-block mt-2 text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
            Terminé
          </span>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Puzzle, Trophy, UserPlus, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';

const LEVELS = [
  { level: 1,  title: 'Apprenti Curieux',       threshold: 0,   emoji: '🌱' },
  { level: 2,  title: 'Trieur de Bordures',      threshold: 5,   emoji: '🔲' },
  { level: 3,  title: 'Chercheur de Pièces',     threshold: 15,  emoji: '🔍' },
  { level: 4,  title: 'Assembleur du Dimanche',  threshold: 30,  emoji: '🧩' },
  { level: 5,  title: 'Expert des Couleurs',     threshold: 60,  emoji: '🎨' },
  { level: 6,  title: 'Déchiffreur de Motifs',   threshold: 100, emoji: '🔓' },
  { level: 7,  title: 'Maître de la Forme',      threshold: 150, emoji: '⚡' },
  { level: 8,  title: 'Grand Collectionneur',    threshold: 250, emoji: '💎' },
  { level: 9,  title: 'Légende du Puzzle',       threshold: 400, emoji: '🏆' },
  { level: 10, title: 'Le Grand Architecte',     threshold: 600, emoji: '👑' },
];

function getLevelData(scanCount) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (scanCount >= lvl.threshold) current = lvl;
  }
  return current;
}

export default function UserProfileDialog({ userEmail, onClose }) {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({ completed: 0, achievements: 0, totalPieces: 0, scanCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(null);
    setLoading(true);
    loadUserProfile();
  }, [userEmail]);

  const loadUserProfile = async () => {
    try {
      const loggedUser = await base44.auth.me().catch(() => null);
      setCurrentUser(loggedUser);

      // Load user profile
      const profiles = await base44.entities.UserProfile.filter({ email: userEmail });
      let userData = profiles[0] || null;
      if (!userData) {
        const users = await base44.entities.User.filter({ email: userEmail });
        userData = users[0] || null;
      } else {
        // Also try User entity for richer data
        const users = await base44.entities.User.filter({ email: userEmail });
        if (users[0]) userData = users[0];
      }

      if (userData) {
        setUser(userData);

        const [completedPuzzles, achievements, catalogItems] = await Promise.all([
          base44.entities.UserPuzzle.filter({ created_by: userEmail, status: 'done' }),
          base44.entities.Achievement.filter({ created_by: userEmail }),
          base44.entities.PuzzleCatalog.filter({ created_by: userEmail }),
        ]);

        const totalPieces = completedPuzzles.reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);

        setStats({
          completed: completedPuzzles.length,
          achievements: achievements.length,
          totalPieces,
          scanCount: catalogItems.length,
        });

        if (loggedUser) {
          const followCheck = await base44.entities.Follow.filter({
            follower_email: loggedUser.email,
            following_email: userEmail,
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
    if (!currentUser) { toast.error(t('loginToFollow')); return; }
    const prev = isFollowing;
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? t('unfollowed') : t('followedUser'));
    try {
      if (prev) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: userEmail,
        });
        if (follows.length > 0) await base44.entities.Follow.delete(follows[0].id);
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: userEmail,
        });
      }
    } catch {
      setIsFollowing(prev);
      toast.error(t('followUpdateFailed'));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="w-8 h-8 border-4 border-white/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const userInitials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const levelData = getLevelData(stats.scanCount);
  const formatPieces = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header banner */}
        <div className="relative h-20 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5" style={{ marginTop: '-40px' }}>
          {/* Avatar + follow button */}
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
              <Button
                onClick={handleFollow}
                size="sm"
                className={`rounded-lg text-xs h-8 mb-1 ${
                  isFollowing
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isFollowing
                  ? <><UserCheck className="w-3 h-3 mr-1" />{t('following2')}</>
                  : <><UserPlus className="w-3 h-3 mr-1" />{t('follow')}</>
                }
              </Button>
            )}
          </div>

          {/* Name + level badge */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">{user.full_name || user.email}</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
                {levelData.emoji} Niveau {levelData.level}
              </span>
            </div>
            <p className="text-white/40 text-xs mt-0.5">{levelData.title}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Puzzle className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.completed}</div>
              <div className="text-[11px] text-white/50">{t('completed')}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <span className="text-lg block mb-1">🧩</span>
              <div className="text-lg font-bold text-white">{formatPieces(stats.totalPieces)}</div>
              <div className="text-[11px] text-white/50">Pièces posées</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center col-span-2">
              <Trophy className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.achievements}</div>
              <div className="text-[11px] text-white/50">{t('achievements')}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
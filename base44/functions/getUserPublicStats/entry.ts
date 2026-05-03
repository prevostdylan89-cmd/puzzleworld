import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LEVELS = [
  { level: 1, threshold: 0,   emoji: '🌱', title: 'Apprenti Curieux' },
  { level: 2, threshold: 5,   emoji: '🔲', title: 'Trieur de Bordures' },
  { level: 3, threshold: 15,  emoji: '🔍', title: 'Chercheur de Pièces' },
  { level: 4, threshold: 30,  emoji: '🧩', title: 'Assembleur du Dimanche' },
  { level: 5, threshold: 60,  emoji: '🎨', title: 'Expert des Couleurs' },
  { level: 6, threshold: 100, emoji: '🔓', title: 'Déchiffreur de Motifs' },
  { level: 7, threshold: 150, emoji: '⚡', title: 'Maître de la Forme' },
  { level: 8, threshold: 250, emoji: '💎', title: 'Grand Collectionneur' },
  { level: 9, threshold: 400, emoji: '🏆', title: 'Légende du Puzzle' },
  { level: 10, threshold: 600, emoji: '👑', title: 'Le Grand Architecte' },
];

function getLevelData(count) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (count >= lvl.threshold) current = lvl;
  }
  return current;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { targetEmail } = await req.json();

    if (!targetEmail) {
      return Response.json({ error: 'targetEmail required' }, { status: 400 });
    }

    // Use service role to bypass RLS and read other users' public stats
    const [completedPuzzles, achievements, catalogItems, profiles, wishlistItems, users] = await Promise.all([
      base44.asServiceRole.entities.UserPuzzle.filter({ created_by: targetEmail, status: 'done' }),
      base44.asServiceRole.entities.Achievement.filter({ created_by: targetEmail }),
      base44.asServiceRole.entities.PuzzleCatalog.filter({ created_by: targetEmail }),
      base44.asServiceRole.entities.UserProfile.filter({ email: targetEmail }),
      base44.asServiceRole.entities.UserPuzzle.filter({ created_by: targetEmail, status: 'wishlist' }),
      base44.asServiceRole.entities.User.filter({ email: targetEmail }),
    ]);

    const totalPieces = completedPuzzles.reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);
    const scanCount = catalogItems.length;
    const levelData = getLevelData(scanCount);

    const profile = profiles.find(p => p.email === targetEmail);
    const userRecord = users.find(u => u.email === targetEmail);

    // Prioritize UserProfile data, then fall back to User entity
    const profilePhoto = profile?.profile_photo || userRecord?.profile_photo || null;
    const displayName = profile?.display_name || profile?.full_name || userRecord?.full_name || userRecord?.username || targetEmail.split('@')[0] || null;
    const badgeIcon = profile?.current_badge_icon || userRecord?.current_badge_icon || null;
    const friendCode = profile?.friend_code || userRecord?.friend_code || null;

    return Response.json({
      displayName,
      profilePhoto,
      badgeIcon,
      friendCode,
      completed: completedPuzzles.length,
      achievements: achievements.length,
      totalPieces,
      scanCount,
      wishlist: wishlistItems.length,
      level: levelData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
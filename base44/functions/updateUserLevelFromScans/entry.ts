import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BADGE_LEVELS = [
  { level: 1, badgeName: 'Novice', threshold: 1 },
  { level: 2, badgeName: 'Débutant', threshold: 10 },
  { level: 3, badgeName: 'Apprenti', threshold: 20 },
  { level: 4, badgeName: 'Passionné', threshold: 35 },
  { level: 5, badgeName: 'Expert', threshold: 50 },
  { level: 6, badgeName: 'Maître', threshold: 75 },
  { level: 7, badgeName: 'Champion', threshold: 100 },
  { level: 8, badgeName: 'Légende', threshold: 150 },
  { level: 9, badgeName: 'Mythique', threshold: 250 },
  { level: 10, badgeName: 'Divin', threshold: 400 },
];

function getLevelForScans(scanCount) {
  let currentLevel = BADGE_LEVELS[0];
  for (const level of BADGE_LEVELS) {
    if (scanCount >= level.threshold) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Count puzzles added by this user
    const userPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.filter({
      created_by: userEmail,
    });
    const scanCount = userPuzzles.length;

    // Get the appropriate level
    const newLevel = getLevelForScans(scanCount);

    // Get the corresponding badge from the Badge entity
    const badges = await base44.asServiceRole.entities.Badge.filter({
      name: newLevel.badgeName,
    });
    const badge = badges.length > 0 ? badges[0] : null;

    // Update or create UserLevel record
    const existing = await base44.asServiceRole.entities.UserLevel.filter({
      created_by: userEmail,
    });

    const levelData = {
      level: newLevel.level,
      badge_name: newLevel.badgeName,
      total_puzzles: scanCount,
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.UserLevel.update(existing[0].id, levelData);
    } else {
      await base44.asServiceRole.entities.UserLevel.create(levelData);
    }

    // Also update the user's profile with the current badge icon
    if (badge) {
      await base44.auth.updateMe({
        current_badge_icon: badge.icon,
      });
    }

    return Response.json({
      success: true,
      userEmail,
      level: newLevel.level,
      badgeName: newLevel.badgeName,
      scanCount,
      badgeIcon: badge?.icon,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
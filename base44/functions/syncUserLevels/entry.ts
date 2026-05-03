import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LEVELS = [
  { level: 1,  threshold: 0,   emoji: '🌱' },
  { level: 2,  threshold: 5,   emoji: '🔲' },
  { level: 3,  threshold: 15,  emoji: '🔍' },
  { level: 4,  threshold: 30,  emoji: '🧩' },
  { level: 5,  threshold: 60,  emoji: '🎨' },
  { level: 6,  threshold: 100, emoji: '🔓' },
  { level: 7,  threshold: 150, emoji: '⚡' },
  { level: 8,  threshold: 250, emoji: '💎' },
  { level: 9,  threshold: 400, emoji: '🏆' },
  { level: 10, threshold: 600, emoji: '👑' },
];

function getLevelForCount(count) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (count >= lvl.threshold) current = lvl;
    else break;
  }
  return current;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Count total puzzles added by this user
    const addedPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.filter({
      created_by: userEmail,
    });
    const scannedCount = addedPuzzles.length;

    const newLevel = getLevelForCount(scannedCount);

    // Get badge from Badge table for this level
    const badges = await base44.asServiceRole.entities.Badge.filter({ level: newLevel.level });
    const badge = badges.length > 0 ? badges[0] : null;

    // Get or create UserLevel record
    const existing = await base44.asServiceRole.entities.UserLevel.filter({ created_by: userEmail });

    if (existing.length > 0) {
      const current = existing[0];
      await base44.asServiceRole.entities.UserLevel.update(current.id, {
        level: newLevel.level,
        badge_name: newLevel.title || `Level ${newLevel.level}`,
        total_puzzles: scannedCount,
        current_badge_icon: badge?.icon || newLevel.emoji,
      });
    } else {
      await base44.asServiceRole.entities.UserLevel.create({
        level: newLevel.level,
        badge_name: `Level ${newLevel.level}`,
        total_puzzles: scannedCount,
        current_badge_icon: badge?.icon || newLevel.emoji,
      });
    }

    return Response.json({ success: true, userEmail, level: newLevel.level, totalScanned: scannedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    const payload = await req.json();

    const { event, data } = payload;

    // Only fire when a new puzzle is added to the community catalog (created_by = scanner's email)
    if (event?.type !== 'create') {
      return Response.json({ skipped: true, reason: 'Not a create event' });
    }

    const userEmail = data.created_by;
    if (!userEmail) {
      return Response.json({ skipped: true, reason: 'No user email' });
    }

    // Count total puzzles added to the community catalog by this user
    const addedPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.filter({
      created_by: userEmail,
    });
    const scannedCount = addedPuzzles.length;

    const newLevel = getLevelForCount(scannedCount);

    // Get or create UserLevel record
    const existing = await base44.asServiceRole.entities.UserLevel.filter({ created_by: userEmail });

    if (existing.length > 0) {
      const current = existing[0];
      await base44.asServiceRole.entities.UserLevel.update(current.id, {
        level: newLevel.level,
        badge_name: newLevel.title,
        total_puzzles: scannedCount,
      });
    } else {
      await base44.asServiceRole.entities.UserLevel.create({
        level: newLevel.level,
        badge_name: newLevel.title,
        total_puzzles: scannedCount,
      });
    }

    return Response.json({ success: true, userEmail, level: newLevel.level, title: newLevel.title, totalScanned: scannedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
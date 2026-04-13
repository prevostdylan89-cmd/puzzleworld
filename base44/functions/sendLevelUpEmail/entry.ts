import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LEVEL_EMOJIS = {
  1:  '🌱',
  2:  '🔲',
  3:  '🔍',
  4:  '🧩',
  5:  '🎨',
  6:  '🔓',
  7:  '⚡',
  8:  '💎',
  9:  '🏆',
  10: '👑',
};

const LEVEL_TITLES = {
  1:  'Apprenti Curieux',
  2:  'Trieur de Bordures',
  3:  'Chercheur de Pièces',
  4:  'Assembleur du Dimanche',
  5:  'Expert des Couleurs',
  6:  'Déchiffreur de Motifs',
  7:  'Maître de la Forme',
  8:  'Grand Collectionneur',
  9:  'Légende du Puzzle',
  10: 'Le Grand Architecte',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only fire on create, or on update when the level actually changed
    if (event?.type === 'update' && payload.old_data) {
      if (payload.old_data.level === data.level) {
        return Response.json({ skipped: true, reason: 'Level did not change' });
      }
    }

    const userEmail = data.created_by;
    if (!userEmail) {
      return Response.json({ skipped: true, reason: 'No user email found' });
    }

    const level = data.level || 1;
    const badgeName = data.badge_name || 'Novice';
    const emoji = LEVEL_EMOJIS[level] || '🎉';

    const subject = `${emoji} Félicitations ! Tu as atteint le niveau ${level} – ${badgeName}`;

    const body = `
<div style="font-family: sans-serif; background: #000019; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 520px; margin: auto;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="https://media.base44.com/images/public/69637ed7a7bc12860b6763ca/4bbfd7a69_JUSTELAPIECE.png" alt="PuzzleWorld" style="height: 64px;" />
  </div>
  <h1 style="text-align: center; font-size: 28px; margin-bottom: 8px;">${emoji} Nouveau niveau atteint !</h1>
  <p style="text-align: center; color: #ff6b35; font-size: 22px; font-weight: bold; margin-bottom: 24px;">
    Niveau ${level} — ${badgeName}
  </p>
  <p style="color: #cccccc; font-size: 15px; line-height: 1.6;">
    Bravo ! Tu viens de franchir un nouveau palier sur <strong>PuzzleWorld</strong>. Ta passion pour les puzzles est remarquable et toute la communauté est fière de toi.
  </p>
  <p style="color: #cccccc; font-size: 15px; line-height: 1.6; margin-top: 12px;">
    Continue à compléter des puzzles, à partager tes réalisations et à interagir avec la communauté pour progresser encore plus vite !
  </p>
  <div style="text-align: center; margin-top: 32px;">
    <a href="https://puzzleworld.base44.app/Profile" style="background: #ff6b35; color: white; padding: 12px 28px; border-radius: 24px; text-decoration: none; font-weight: bold; font-size: 15px;">
      Voir mon profil
    </a>
  </div>
  <p style="text-align: center; color: #555; font-size: 12px; margin-top: 32px;">
    © 2026 PuzzleWorld · Tous droits réservés
  </p>
</div>
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject,
      body,
      from_name: 'PuzzleWorld',
    });

    return Response.json({ success: true, to: userEmail, level, badgeName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
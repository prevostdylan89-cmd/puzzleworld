import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Définition des 50 succès ────────────────────────────────────────────────
const ACHIEVEMENTS = [
  // Scan & Collection
  { type: 'premier_scan',           icon: '🔍', color: '#3B82F6', title: 'Premier Scan',           desc: 'Scanner son tout premier puzzle' },
  { type: 'main_a_la_pate',         icon: '🤝', color: '#10B981', title: 'Main à la pâte',         desc: 'Ajouter 10 puzzles à la communauté' },
  { type: 'le_rituel',              icon: '🔄', color: '#8B5CF6', title: 'Le Rituel',              desc: 'Ajouter 50 puzzles à la communauté' },
  { type: 'le_maniaque',            icon: '😤', color: '#F59E0B', title: 'Le Maniaque',            desc: 'Ajouter 100 puzzles à la communauté' },
  { type: 'collectionneur_serieux', icon: '📦', color: '#EF4444', title: 'Collectionneur Sérieux', desc: 'Ajouter 200 puzzles à la communauté' },
  { type: 'conservateur',           icon: '🏛️', color: '#6366F1', title: 'Conservateur',           desc: 'Ajouter 400 puzzles à la communauté' },
  { type: 'lencyclopedie',          icon: '📚', color: '#14B8A6', title: "L'Encyclopédie",         desc: 'Atteindre 800 puzzles scannés' },

  // Temps & Comportement
  { type: 'regularite',    icon: '📅', color: '#F97316', title: 'Régularité',    desc: 'Se connecter 7 jours d\'affilée' },
  { type: 'flash',         icon: '⚡', color: '#FACC15', title: 'Flash',         desc: 'Scanner 5 puzzles en moins de 10 minutes' },
  { type: 'oiseau_de_nuit',icon: '🦉', color: '#1E293B', title: 'Oiseau de nuit',desc: 'Scanner un puzzle entre 2h et 4h du matin' },

  // Taille des puzzles
  { type: 'echauffement',    icon: '🏃', color: '#84CC16', title: 'Échauffement',     desc: 'Scanner un puzzle de 150 pièces' },
  { type: 'le_standard',     icon: '🧩', color: '#06B6D4', title: 'Le Standard',      desc: 'Scanner un puzzle de 1000 pièces' },
  { type: 'patience_de_moine',icon:'🧘', color: '#7C3AED', title: 'Patience de Moine',desc: 'Scanner un puzzle de 3000 pièces' },
  { type: 'le_titan_puzzle', icon: '🗿', color: '#DC2626', title: 'Le Titan',          desc: 'Scanner un puzzle de 5000 pièces' },
  { type: 'lolympe',         icon: '🏔️', color: '#F59E0B', title: "L'Olympe",         desc: 'Scanner un puzzle de 10 000 pièces' },
  { type: 'petit_mais_costaud',icon:'💪',color: '#10B981', title: 'Petit mais costaud',desc: 'Avoir 20 puzzles de moins de 500 pièces' },
  { type: 'poids_lourd',     icon: '🏋️', color: '#6366F1', title: 'Poids Lourd',      desc: 'Atteindre 50 000 pièces cumulées complétées' },
  { type: 'demi_millionnaire',icon:'💎', color: '#EAB308', title: 'Demi-Millionnaire',desc: 'Atteindre 500 000 pièces cumulées complétées' },
  { type: 'geant_des_pieces', icon: '🐘', color: '#8B5CF6', title: 'Géant des pièces',  desc: 'Avoir 5 puzzles de plus de 3000 pièces complétés' },

  // Catégories
  { type: 'ami_des_betes',  icon: '🐾', color: '#78716C', title: 'Ami des bêtes',   desc: '10 puzzles dans la catégorie Animaux' },
  { type: 'main_verte',     icon: '🌿', color: '#22C55E', title: 'Main Verte',      desc: '10 puzzles dans la catégorie Nature' },
  { type: 'citadin',        icon: '🏙️', color: '#64748B', title: 'Citadin',         desc: '10 puzzles dans la catégorie Urbain' },
  { type: 'magie_disney',   icon: '🏰', color: '#EC4899', title: 'Magie Disney',    desc: '10 puzzles dans la catégorie Disney' },
  { type: 'esthete',        icon: '🎨', color: '#F43F5E', title: 'Esthète',         desc: '10 puzzles dans la catégorie Art' },
  { type: 'loeil_noir',     icon: '🖤', color: '#374151', title: "L'œil Noir",      desc: '5 puzzles dans la catégorie Monochrome' },
  { type: 'nostalgique',    icon: '📼', color: '#D97706', title: 'Nostalgique',     desc: '10 puzzles dans la catégorie Vintage' },
  { type: 'fan_de_pop',     icon: '🎭', color: '#C026D3', title: 'Fan de Pop',      desc: '10 puzzles dans la catégorie Pop Culture' },
  { type: 'inclassable',    icon: '❓', color: '#0EA5E9', title: 'Inclassable',     desc: '10 puzzles dans la catégorie Autres' },
  { type: 'touche_a_tout',  icon: '🌐', color: '#059669', title: 'Touche-à-tout',   desc: 'Avoir un puzzle dans chaque catégorie' },
  { type: 'le_specialiste', icon: '🎯', color: '#7C3AED', title: 'Le Spécialiste',  desc: '50 puzzles dans une seule catégorie' },

  // Communauté
  { type: 'premier_contact',  icon: '💬', color: '#06B6D4', title: 'Premier Contact', desc: 'Laisser un commentaire sur un post' },
  { type: 'critique',         icon: '⭐', color: '#F59E0B', title: 'Critique',         desc: 'Liker 10 puzzles différents' },
  { type: 'curieux',          icon: '👀', color: '#8B5CF6', title: 'Curieux',          desc: 'Suivre 10 utilisateurs différents' },
  { type: 'coup_de_foudre',   icon: '❤️', color: '#EF4444', title: 'Coup de Foudre',  desc: 'Ajouter 20 puzzles en favoris (wishlist)' },
  { type: 'fan_de',           icon: '🌟', color: '#FACC15', title: 'Fan de...',        desc: 'Suivre ton premier utilisateur' },
  { type: 'populaire',        icon: '📣', color: '#F97316', title: 'Populaire',        desc: 'Être suivi par 5 utilisateurs' },
  { type: 'leader_dopinion',  icon: '👑', color: '#EAB308', title: "Leader d'opinion", desc: 'Être suivi par 20 utilisateurs' },
  { type: 'bavard',           icon: '🗣️', color: '#10B981', title: 'Bavard',           desc: 'Poster 50 commentaires au total' },
  { type: 'juge_de_paix',    icon: '⚖️', color: '#6366F1', title: 'Juge de Paix',    desc: 'Liker 100 puzzles différents' },

  // Marques
  { type: 'ladepte_ravensburger', icon: '🔵', color: '#1D4ED8', title: 'L\'Adepte de Ravensburger', desc: '20 puzzles Ravensburger scannés' },
  { type: 'clementoni_fan',       icon: '🟡', color: '#CA8A04', title: 'Clementoni Fan',            desc: '20 puzzles Clementoni scannés' },
  { type: 'education_au_top',     icon: '🟠', color: '#EA580C', title: 'Education au Top',          desc: '20 puzzles Educa scannés' },
  { type: 'sans_frontieres',      icon: '🌍', color: '#059669', title: 'Sans frontières',           desc: 'Puzzles de 5 marques différentes' },
  { type: 'lexclusif',            icon: '💫', color: '#7C3AED', title: "L'Exclusif",               desc: 'Seul sur le site à avoir scanné un modèle' },
  { type: 'multi_marques',        icon: '🏪', color: '#0EA5E9', title: 'Multi-marques',             desc: '10 marques différentes dans sa collection' },

  // Hauts Faits
  { type: 'le_mur_du_son',         icon: '🚀', color: '#F97316', title: 'Le Mur du Son',          desc: 'Atteindre le Niveau 5' },
  { type: 'le_sommet',             icon: '🏔️', color: '#FACC15', title: 'Le Sommet',              desc: 'Atteindre le Niveau 10 (Le Grand Architecte)' },
  { type: 'anciennete',            icon: '⏳', color: '#6B7280', title: 'Ancienneté',             desc: 'Être inscrit depuis plus de 6 mois' },
  { type: 'le_pilier',             icon: '🏛️', color: '#DC2626', title: 'Le Pilier',              desc: 'Faire partie du Top 50 des contributeurs' },
  { type: 'grand_maitre_du_puzzle',icon: '🎖️', color: '#EAB308', title: 'Grand Maître du Puzzle', desc: 'Débloquer 40 succès' },
];

const CATEGORIES = ['Nature', 'Urbain', 'Disney', 'Art', 'Animaux', 'Monochrome', 'Vintage', 'Pop Culture', 'Autres'];

const LEVELS = [
  { level: 1, threshold: 0 }, { level: 2, threshold: 5 }, { level: 3, threshold: 15 },
  { level: 4, threshold: 30 }, { level: 5, threshold: 60 }, { level: 6, threshold: 100 },
  { level: 7, threshold: 150 }, { level: 8, threshold: 250 }, { level: 9, threshold: 400 },
  { level: 10, threshold: 600 },
];

function getUserLevel(scannedCount) {
  let level = 1;
  for (const l of LEVELS) {
    if (scannedCount >= l.threshold) level = l.level;
  }
  return level;
}

function categoryKey(cat) {
  if (!cat) return null;
  const c = cat.toLowerCase();
  if (c.includes('anim')) return 'ami_des_betes';
  if (c.includes('nature')) return 'main_verte';
  if (c.includes('urbain') || c.includes('city') || c.includes('architecture')) return 'citadin';
  if (c.includes('disney') || c.includes('manga') || c.includes('cartoon')) return 'magie_disney';
  if (c.includes('art') && !c.includes('pop')) return 'esthete';
  if (c.includes('mono') || c.includes('noir') || c.includes('black')) return 'loeil_noir';
  if (c.includes('vintage') || c.includes('retro')) return 'nostalgique';
  if (c.includes('pop') || c.includes('culture')) return 'fan_de_pop';
  return 'inclassable';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let userEmail = body.userEmail;

    // If called without email, use the current user
    if (!userEmail) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      userEmail = user.email;
    }

    // ─── Fetch all needed data in parallel ───────────────────────────────────
    const [
      allUserPuzzles,
      catalogPuzzles,
      comments,
      follows,
      followers,
      wishlistItems,
      puzzleLikes,
      existingAchievements,
      userRecord,
      allCatalogForExclusif,
    ] = await Promise.all([
      base44.asServiceRole.entities.UserPuzzle.filter({ created_by: userEmail }),
      base44.asServiceRole.entities.PuzzleCatalog.filter({ created_by: userEmail }),
      base44.asServiceRole.entities.Comment.filter({ created_by: userEmail }),
      base44.asServiceRole.entities.Follow.filter({ follower_email: userEmail }),
      base44.asServiceRole.entities.Follow.filter({ following_email: userEmail }),
      base44.asServiceRole.entities.Wishlist.filter({ created_by: userEmail }),
      base44.asServiceRole.entities.UserPuzzleLike.filter({ created_by: userEmail }).catch(() => []),
      base44.asServiceRole.entities.Achievement.filter({ created_by: userEmail }),
      base44.asServiceRole.entities.User.filter({ email: userEmail }).catch(() => []),
      base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 5000).catch(() => []),
    ]);

    const completedPuzzles = allUserPuzzles.filter(p => p.status === 'done');
    const scannedCount = catalogPuzzles.length;
    const totalScanned = allUserPuzzles.length;
    const unlockedTypes = new Set(existingAchievements.map(a => a.achievement_type));

    // ─── Compute stats ────────────────────────────────────────────────────────
    const totalPiecesCompleted = completedPuzzles.reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);
    const userLevel = getUserLevel(scannedCount);

    // Category counts from all user puzzles (catalog)
    const catCounts = {};
    for (const p of catalogPuzzles) {
      const cat = p.category || 'Autres';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    }

    // Brand counts
    const brandCounts = {};
    for (const p of allUserPuzzles) {
      const brand = (p.puzzle_brand || '').trim().toLowerCase();
      if (brand) brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    }
    const uniqueBrands = Object.keys(brandCounts).length;

    // Piece counts from completed
    const smallPuzzles = completedPuzzles.filter(p => (p.puzzle_pieces || 0) < 500).length;
    const bigPuzzles = completedPuzzles.filter(p => (p.puzzle_pieces || 0) > 3000).length;

    // Flash: 5 puzzles added within 10 minutes
    const sortedByDate = [...allUserPuzzles].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    let flashUnlocked = false;
    for (let i = 4; i < sortedByDate.length; i++) {
      const diff = new Date(sortedByDate[i].created_date) - new Date(sortedByDate[i - 4].created_date);
      if (diff <= 600000) { flashUnlocked = true; break; }
    }

    // Oiseau de nuit: any puzzle scanned between 2h-4h (UTC)
    const owlUnlocked = allUserPuzzles.some(p => {
      const h = new Date(p.created_date).getUTCHours();
      return h >= 2 && h < 4;
    });

    // Ancienneté: registered > 6 months
    const user6months = userRecord.length > 0
      ? (Date.now() - new Date(userRecord[0].created_date).getTime()) > 6 * 30 * 24 * 3600 * 1000
      : false;

    // Le Pilier: top 50 contributors by PuzzleCatalog count
    const contributorCounts = {};
    for (const p of allCatalogForExclusif) {
      if (p.created_by) contributorCounts[p.created_by] = (contributorCounts[p.created_by] || 0) + 1;
    }
    const sorted = Object.entries(contributorCounts).sort((a, b) => b[1] - a[1]);
    const userRank = sorted.findIndex(([email]) => email === userEmail);
    const isPilier = userRank !== -1 && userRank < 50;

    // L'Exclusif: only one to have scanned a specific puzzle (by puzzle_name)
    const puzzleNameCounts = {};
    for (const p of allCatalogForExclusif) {
      const key = (p.puzzle_name || '').toLowerCase().trim();
      if (key) puzzleNameCounts[key] = (puzzleNameCounts[key] || 0) + 1;
    }
    const isExclusif = catalogPuzzles.some(p => {
      const key = (p.puzzle_name || '').toLowerCase().trim();
      return key && puzzleNameCounts[key] === 1;
    });

    // Category max for Spécialiste
    const maxCatCount = catCounts && Object.values(catCounts).length > 0
      ? Math.max(...Object.values(catCounts))
      : 0;

    // Touche-à-tout: at least 1 in each of the 9 categories
    const allCatsRepresented = CATEGORIES.every(cat => {
      return Object.keys(catCounts).some(k => k.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(k.toLowerCase()));
    });

    // ─── Check each achievement ────────────────────────────────────────────────
    const toUnlock = [];

    const check = (type, condition) => {
      if (!unlockedTypes.has(type) && condition) {
        const def = ACHIEVEMENTS.find(a => a.type === type);
        if (def) toUnlock.push({ achievement_type: type, title: def.title, description: def.desc, icon: def.icon, color: def.color });
      }
    };

    // Scan & Collection
    check('premier_scan', totalScanned >= 1);
    check('main_a_la_pate', scannedCount >= 10);
    check('le_rituel', scannedCount >= 50);
    check('le_maniaque', scannedCount >= 100);
    check('collectionneur_serieux', scannedCount >= 200);
    check('conservateur', scannedCount >= 400);
    check('lencyclopedie', scannedCount >= 800);

    // Temps
    check('flash', flashUnlocked);
    check('oiseau_de_nuit', owlUnlocked);

    // Taille
    check('echauffement', allUserPuzzles.some(p => p.puzzle_pieces >= 150));
    check('le_standard', allUserPuzzles.some(p => p.puzzle_pieces >= 1000));
    check('patience_de_moine', allUserPuzzles.some(p => p.puzzle_pieces >= 3000));
    check('le_titan_puzzle', allUserPuzzles.some(p => p.puzzle_pieces >= 5000));
    check('lolympe', allUserPuzzles.some(p => p.puzzle_pieces >= 10000));
    check('petit_mais_costaud', smallPuzzles >= 20);
    check('poids_lourd', totalPiecesCompleted >= 50000);
    check('demi_millionnaire', totalPiecesCompleted >= 500000);
    check('geant_des_pieces', bigPuzzles >= 5);

    // Catégories (basé sur PuzzleCatalog)
    const catMatchCount = (targetCat) => {
      return catalogPuzzles.filter(p => {
        const cat = (p.category || 'Autres').toLowerCase();
        return cat.includes(targetCat.toLowerCase()) || targetCat.toLowerCase().includes(cat);
      }).length;
    };

    check('ami_des_betes', catMatchCount('Animaux') >= 10);
    check('main_verte', catMatchCount('Nature') >= 10);
    check('citadin', catMatchCount('Urbain') >= 10);
    check('magie_disney', catMatchCount('Disney') >= 10);
    check('esthete', catMatchCount('Art') >= 10);
    check('loeil_noir', catMatchCount('Monochrome') >= 5);
    check('nostalgique', catMatchCount('Vintage') >= 10);
    check('fan_de_pop', catMatchCount('Pop Culture') >= 10);
    check('inclassable', catMatchCount('Autres') >= 10);
    check('touche_a_tout', allCatsRepresented);
    check('le_specialiste', maxCatCount >= 50);

    // Communauté
    check('premier_contact', comments.length >= 1);
    check('critique', puzzleLikes.length >= 10);
    check('curieux', follows.length >= 10);
    check('coup_de_foudre', wishlistItems.length >= 20);
    check('fan_de', follows.length >= 1);
    check('populaire', followers.length >= 5);
    check('leader_dopinion', followers.length >= 20);
    check('bavard', comments.length >= 50);
    check('juge_de_paix', puzzleLikes.length >= 100);

    // Marques
    const brandMatch = (name) => allUserPuzzles.filter(p => (p.puzzle_brand || '').toLowerCase().includes(name.toLowerCase())).length;
    check('ladepte_ravensburger', brandMatch('ravensburger') >= 20);
    check('clementoni_fan', brandMatch('clementoni') >= 20);
    check('education_au_top', brandMatch('educa') >= 20);
    check('sans_frontieres', uniqueBrands >= 5);
    check('lexclusif', isExclusif);
    check('multi_marques', uniqueBrands >= 10);

    // Hauts Faits
    check('le_mur_du_son', userLevel >= 5);
    check('le_sommet', userLevel >= 10);
    check('anciennete', user6months);
    check('le_pilier', isPilier);

    // Grand Maître: unlock last (after others are counted)
    const totalUnlocked = unlockedTypes.size + toUnlock.length;
    check('grand_maitre_du_puzzle', totalUnlocked >= 40);

    // ─── Create new achievements ──────────────────────────────────────────────
    const created = [];
    for (const achievement of toUnlock) {
      try {
        await base44.asServiceRole.entities.Achievement.create(achievement);
        created.push(achievement.achievement_type);
      } catch (e) {
        console.error('Failed to create achievement:', achievement.achievement_type, e.message);
      }
    }

    return Response.json({
      success: true,
      userEmail,
      newlyUnlocked: created,
      totalUnlocked: unlockedTypes.size + created.length,
      stats: { scannedCount, totalPiecesCompleted, userLevel, uniqueBrands, commentsCount: comments.length, followsCount: follows.length, followersCount: followers.length }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
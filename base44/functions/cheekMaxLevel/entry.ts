import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current scan count
    const currentScans = await base44.asServiceRole.entities.PuzzleCatalog.filter({
      created_by: user.email
    });

    const currentCount = currentScans.length;
    const neededForMax = 400; // Level 10 requires 400 scans
    const scansToadd = Math.max(0, neededForMax - currentCount + 50); // Add extra to be safe

    // Create fake puzzle catalog entries
    const fakePuzzles = [];
    for (let i = 0; i < scansToadd; i++) {
      fakePuzzles.push({
        title: `[ADMIN CHEAT] Puzzle ${i + 1}`,
        piece_count: 1000 + (i % 3000),
        ean: `ADMIN-CHEAT-${Date.now()}-${i}`,
        brand: 'Admin Cheat',
        asin: `ADMIN-${i}`,
        socialScore: 0,
        status: 'active'
      });
    }

    // Bulk create
    if (fakePuzzles.length > 0) {
      await base44.asServiceRole.entities.PuzzleCatalog.bulkCreate(fakePuzzles);
    }

    const newTotal = currentCount + scansToadd;

    return Response.json({ 
      success: true, 
      message: `✨ Triche activée! Vous aviez ${currentCount} scans, maintenant vous en avez ${newTotal} (niveau max atteint 🎉)`,
      previousCount: currentCount,
      newCount: newTotal,
      added: scansToadd
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
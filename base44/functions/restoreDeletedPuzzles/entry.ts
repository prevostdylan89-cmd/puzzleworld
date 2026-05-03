import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Récupère les puzzles depuis Firebase (sauvegarde)
    const response = await fetch('https://us-central1-puzzleworld-prod.cloudfunctions.net/restorePuzzleCatalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (!result.success) {
      return Response.json({ error: result.message || 'Restoration failed' }, { status: 500 });
    }

    // Récupère la liste actuelle
    const currentPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 5000);
    const currentIds = new Set(currentPuzzles.map(p => p.asin));

    // Ajoute les puzzles manquants
    let addedCount = 0;
    if (result.puzzles && Array.isArray(result.puzzles)) {
      for (const puzzle of result.puzzles) {
        if (!currentIds.has(puzzle.asin)) {
          try {
            await base44.asServiceRole.entities.PuzzleCatalog.create(puzzle);
            addedCount++;
          } catch (error) {
            console.error(`Error creating puzzle ${puzzle.asin}:`, error.message);
          }
        }
      }
    }

    return Response.json({ 
      success: true, 
      message: `${addedCount} puzzles restaurés avec succès!`,
      restored: addedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
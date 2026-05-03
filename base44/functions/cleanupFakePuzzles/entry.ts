import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all puzzles from catalog
    const allPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.list();
    
    let deletedCount = 0;
    const deletedPuzzles = [];

    // Delete puzzles without valid EAN/ASIN or empty names
    for (const puzzle of allPuzzles) {
      const isInvalid = !puzzle.asin || 
                        !puzzle.name || 
                        puzzle.name.trim() === '' ||
                        puzzle.name.toLowerCase().includes('test') ||
                        puzzle.name.toLowerCase().includes('fake') ||
                        puzzle.name.toLowerCase().includes('temp');

      if (isInvalid) {
        try {
          await base44.asServiceRole.entities.PuzzleCatalog.delete(puzzle.id);
          deletedCount++;
          deletedPuzzles.push({
            id: puzzle.id,
            name: puzzle.name || 'N/A',
            asin: puzzle.asin || 'N/A'
          });
        } catch (err) {
          console.log(`Failed to delete puzzle ${puzzle.id}:`, err.message);
        }
      }
    }

    return Response.json({
      success: true,
      message: `${deletedCount} faux puzzles supprimés`,
      deletedCount: deletedCount,
      deletedPuzzles: deletedPuzzles.slice(0, 20) // Show first 20
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Count puzzles added by this user that are NEW (not duplicates)
    // We consider a puzzle scan as a contribution only if it was added by the user
    // and is not a duplicate of an existing puzzle in the catalog
    const userPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.filter({
      created_by: userEmail,
    });

    // For now, count all puzzles added by the user
    // In the future, could add logic to detect duplicates
    const scanCount = userPuzzles.length;

    return Response.json({ 
      success: true, 
      userEmail, 
      scanCount,
      totalPuzzles: userPuzzles.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
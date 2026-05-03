import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    let totalDeleted = 0;

    // Clean PuzzleCatalog - more aggressive
    const allCatalog = await base44.asServiceRole.entities.PuzzleCatalog.list();
    for (const puzzle of allCatalog) {
      const shouldDelete = !puzzle.asin || 
                          !puzzle.name || 
                          puzzle.name.trim() === '' ||
                          puzzle.name.toLowerCase().includes('test') ||
                          puzzle.name.toLowerCase().includes('fake') ||
                          puzzle.name.toLowerCase().includes('admin-') ||
                          puzzle.name.toLowerCase().includes('temp') ||
                          puzzle.name === 'N/A' ||
                          puzzle.asin.includes('ADMIN-') ||
                          !puzzle.image_url ||
                          puzzle.image_url === '';

      if (shouldDelete) {
        try {
          await base44.asServiceRole.entities.PuzzleCatalog.delete(puzzle.id);
          totalDeleted++;
        } catch (err) {
          // Silent fail on rate limit
        }
      }
    }

    // Clean UserPuzzle - remove entries with invalid puzzle names
    const allUserPuzzles = await base44.asServiceRole.entities.UserPuzzle.list();
    for (const up of allUserPuzzles) {
      if (!up.puzzle_name || 
          up.puzzle_name.trim() === '' ||
          up.puzzle_name.toLowerCase().includes('test') ||
          up.puzzle_name.toLowerCase().includes('fake')) {
        try {
          await base44.asServiceRole.entities.UserPuzzle.delete(up.id);
          totalDeleted++;
        } catch (err) {
          // Silent fail
        }
      }
    }

    // Clean Post - remove completion posts with invalid puzzle refs
    const allPosts = await base44.asServiceRole.entities.Post.list();
    for (const post of allPosts) {
      if (post.is_completion_post && 
          (!post.puzzle_name || 
           !post.puzzle_reference ||
           post.puzzle_name.toLowerCase().includes('test') ||
           post.puzzle_reference.includes('ADMIN-'))) {
        try {
          await base44.asServiceRole.entities.Post.delete(post.id);
          totalDeleted++;
        } catch (err) {
          // Silent fail
        }
      }
    }

    return Response.json({
      success: true,
      message: `Nettoyage complété: ${totalDeleted} entrées supprimées`,
      totalDeleted: totalDeleted
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
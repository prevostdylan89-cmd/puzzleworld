import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get count of all PuzzleCatalog items created by user
    const catalogs = await base44.entities.PuzzleCatalog.filter({
      created_by: user.email
    });

    const scanCount = catalogs.length;
    
    // Return the count for the profile to display
    return Response.json({ 
      success: true, 
      scanCount: scanCount,
      userEmail: user.email
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
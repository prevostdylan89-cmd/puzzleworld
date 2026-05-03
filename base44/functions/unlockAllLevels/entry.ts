import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if UserLevel exists for this user
    const existingLevels = await base44.asServiceRole.entities.UserLevel.filter({ 
      created_by: user.email 
    });

    if (existingLevels.length > 0) {
      // Update existing level to 10
      await base44.asServiceRole.entities.UserLevel.update(existingLevels[0].id, {
        level: 10,
        badge_name: 'Légende',
        total_puzzles: 600
      });
    } else {
      // Create new level entry at max
      await base44.asServiceRole.entities.UserLevel.create({
        level: 10,
        badge_name: 'Légende',
        total_puzzles: 600
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Tous les niveaux débloqués! 🎉 Vous êtes au niveau 10 - Légende!' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
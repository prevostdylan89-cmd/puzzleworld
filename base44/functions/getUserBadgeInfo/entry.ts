import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Get user level first (all users have levels)
    const userLevels = await base44.asServiceRole.entities.UserLevel.filter({ created_by: email });
    if (userLevels.length > 0) {
      const level = userLevels[0];
      
      // Get badge from Badge table
      const badges = await base44.asServiceRole.entities.Badge.filter({ level: level.level });
      const badge = badges.length > 0 ? badges[0] : null;
      
      return Response.json({ 
        badge: { 
          icon: badge?.icon || level.current_badge_icon || '📍',
          label: badge?.name || level.badge_name 
        } 
      });
    }

    return Response.json({ badge: null });
  } catch (error) {
    console.error('Error fetching badge:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Fetch all badges
    const badges = await base44.asServiceRole.entities.Badge.list();

    // Create UserBadge for each badge
    for (const badge of badges) {
      const existing = await base44.asServiceRole.entities.UserBadge.filter({
        badge_id: badge.id,
        created_by: email
      });

      if (existing.length === 0) {
        await base44.asServiceRole.entities.UserBadge.create({
          badge_id: badge.id,
          badge_name: badge.name,
          unlocked_at: new Date().toISOString(),
          is_active: false,
          created_by: email
        });
      }
    }

    return Response.json({ 
      success: true, 
      message: `All ${badges.length} badges unlocked for ${email}` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
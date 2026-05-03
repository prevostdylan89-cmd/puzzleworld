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

    // Count unlocked badges
    const userBadges = await base44.asServiceRole.entities.UserBadge.filter({
      created_by: email
    });

    const badgeCount = userBadges.length;
    const level = Math.min(6, Math.max(1, Math.ceil(badgeCount / 2)));

    // Update UserLevel
    const userLevels = await base44.asServiceRole.entities.UserLevel.filter({
      created_by: email
    });

    const badges = ['Novice', 'Amateur', 'Passionné', 'Expert', 'Maître', 'Légende'];

    if (userLevels.length > 0) {
      await base44.asServiceRole.entities.UserLevel.update(userLevels[0].id, {
        level: level,
        badge_name: badges[level - 1]
      });
    } else {
      await base44.asServiceRole.entities.UserLevel.create({
        level: level,
        badge_name: badges[level - 1],
        created_by: email
      });
    }

    return Response.json({ 
      success: true, 
      message: `Niveau mis à jour à ${level} (${badges[level - 1]}) pour ${email}` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
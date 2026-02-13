import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if profile exists
    const existingProfiles = await base44.entities.UserProfile.filter({
      email: user.email
    });

    if (existingProfiles.length > 0) {
      // Update existing profile
      await base44.entities.UserProfile.update(existingProfiles[0].id, {
        full_name: user.full_name || user.email,
        profile_photo: user.profile_photo || '',
        current_badge_icon: user.current_badge_icon || '',
        is_public: true
      });
    } else {
      // Create new profile
      await base44.asServiceRole.entities.UserProfile.create({
        email: user.email,
        full_name: user.full_name || user.email,
        profile_photo: user.profile_photo || '',
        current_badge_icon: user.current_badge_icon || '',
        is_public: true,
        created_by: user.email
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Fetch User and UserProfile for this email
    const users = await base44.entities.User.filter({ email });
    const profiles = await base44.entities.UserProfile.filter({ email });

    const userData = users.length > 0 ? users[0] : null;
    const profileData = profiles.length > 0 ? profiles[0] : null;

    return Response.json({
      email,
      userEntity: {
        id: userData?.id,
        display_name: userData?.display_name,
        full_name: userData?.full_name
      },
      userProfileEntity: {
        id: profileData?.id,
        display_name: profileData?.display_name,
        full_name: profileData?.full_name
      },
      // If User doesn't have display_name but UserProfile does, sync it
      shouldSync: !userData?.display_name && profileData?.display_name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
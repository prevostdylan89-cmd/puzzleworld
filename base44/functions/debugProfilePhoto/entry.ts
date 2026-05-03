import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Fetch User entity
    const users = await base44.entities.User.filter({ email });
    const user = users.length > 0 ? users[0] : null;

    // Fetch UserProfile entity
    const profiles = await base44.entities.UserProfile.filter({ email });
    const profile = profiles.length > 0 ? profiles[0] : null;

    return Response.json({
      email,
      user: user ? {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        data: user.data
      } : null,
      profile: profile ? {
        id: profile.id,
        email: profile.email,
        data: profile.data
      } : null,
      photoFromUser: user?.data?.profile_photo,
      photoFromProfile: profile?.data?.profile_photo,
      photoFromProfileRoot: profile?.profile_photo
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
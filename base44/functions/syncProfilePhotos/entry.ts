import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all users with profile photos
    const allUsers = await base44.entities.User.list();
    let updatedCount = 0;

    for (const user of allUsers) {
      if (!user.email || !user.data?.profile_photo) continue;

      try {
        // Find corresponding UserProfile
        const profiles = await base44.entities.UserProfile.filter({ email: user.email });
        
        if (profiles.length > 0) {
          const profile = profiles[0];
          // Only update if UserProfile doesn't have a photo or it's different
          if (!profile.profile_photo || profile.profile_photo !== user.data.profile_photo) {
            await base44.entities.UserProfile.update(profile.id, {
              profile_photo: user.data.profile_photo
            });
            updatedCount++;
          }
        }
      } catch (error) {
        console.log(`Failed to sync profile photo for ${user.email}:`, error.message);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Synchronized ${updatedCount} profile photos from User to UserProfile` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
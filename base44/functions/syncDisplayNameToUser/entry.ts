import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all UserProfile records
    const allProfiles = await base44.entities.UserProfile.list();
    let syncedCount = 0;

    for (const profile of allProfiles) {
      if (!profile.email || !profile.display_name) continue;

      try {
        // Update the User entity with display_name from UserProfile
        const users = await base44.entities.User.filter({ email: profile.email });
        if (users.length > 0) {
          await base44.entities.User.update(users[0].id, {
            display_name: profile.display_name
          });
          syncedCount++;
        }
      } catch (error) {
        console.log(`Failed to sync profile ${profile.email}:`, error.message);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Synchronized ${syncedCount} users with display_name from UserProfile` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
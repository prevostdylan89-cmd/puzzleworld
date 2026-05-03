import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all comments
    const comments = await base44.entities.Comment.list();
    let updatedCount = 0;

    for (const comment of comments) {
      if (!comment.author_name) continue;

      try {
        // Search profile by display_name (pseudo)
        const profiles = await base44.entities.UserProfile.filter({ display_name: comment.author_name });
        
        if (profiles.length > 0 && profiles[0].profile_photo) {
          // Update comment with profile photo URL if not already set
          await base44.entities.Comment.update(comment.id, {
            author_profile_photo: profiles[0].profile_photo
          });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating comment ${comment.id}:`, error);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Updated ${updatedCount} comments with profile photos` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
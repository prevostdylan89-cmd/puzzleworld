import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all posts
    const allPosts = await base44.entities.Post.list();
    let updatedCount = 0;

    for (const post of allPosts) {
      if (!post.created_by) continue;

      try {
        // Fetch user profile
        const profiles = await base44.entities.UserProfile.filter({ email: post.created_by });
        
        if (profiles.length > 0) {
          const profile = profiles[0];
          const displayName = profile.display_name || profile.full_name || post.created_by.split('@')[0];
          
          // Only update if author_name is missing or is just the email prefix
          const currentAuthorName = post.author_name || '';
          const emailPrefix = post.created_by.split('@')[0];
          
          if (!currentAuthorName || currentAuthorName === emailPrefix || currentAuthorName.trim() === '') {
            await base44.entities.Post.update(post.id, {
              author_name: displayName
            });
            updatedCount++;
          }
        }
      } catch (error) {
        console.log(`Failed to sync post ${post.id}:`, error.message);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Synchronized ${updatedCount} posts with correct author names` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
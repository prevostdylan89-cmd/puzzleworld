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
        // Fetch from both User and UserProfile
        const users = await base44.entities.User.filter({ email: post.created_by });
        const profiles = await base44.entities.UserProfile.filter({ email: post.created_by });
        
        const user = users.length > 0 ? users[0] : null;
        const profile = profiles.length > 0 ? profiles[0] : null;
        
        // Prioritize User.display_name, then UserProfile.display_name
        const displayName = user?.display_name || profile?.display_name || post.created_by.split('@')[0];
        
        // Always update with the correct display_name
        if (post.author_name !== displayName) {
          await base44.entities.Post.update(post.id, {
            author_name: displayName
          });
          updatedCount++;
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
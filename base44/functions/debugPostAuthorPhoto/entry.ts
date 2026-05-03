import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Search for Dylan Prevost's posts
    const posts = await base44.entities.Post.filter({ author_name: 'Dylan Prevost' });
    
    if (posts.length === 0) {
      return Response.json({ error: 'No posts found for Dylan Prevost' });
    }

    const post = posts[0];
    
    // Search for Dylan Prevost's profile
    const profiles = await base44.entities.UserProfile.filter({ display_name: 'Dylan Prevost' });
    
    if (profiles.length === 0) {
      // Try by email
      const userByEmail = await base44.entities.User.filter({ full_name: 'Dylan Prevost' });
      if (userByEmail.length > 0) {
        const profileByEmail = await base44.entities.UserProfile.filter({ email: userByEmail[0].email });
        if (profileByEmail.length > 0) {
          return Response.json({ 
            profilePhoto: profileByEmail[0].profile_photo,
            source: 'UserProfile by email',
            display_name: profileByEmail[0].display_name
          });
        }
      }
      return Response.json({ error: 'Profile photo not found for Dylan Prevost' });
    }

    return Response.json({ 
      profilePhoto: profiles[0].profile_photo,
      source: 'UserProfile by display_name',
      display_name: profiles[0].display_name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
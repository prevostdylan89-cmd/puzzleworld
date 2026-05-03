import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Use service role to safely check user role
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (users.length > 0 && users[0].role === 'admin') {
      return Response.json({ isAdmin: true });
    }

    return Response.json({ isAdmin: false });
  } catch (error) {
    console.error('Error checking user role:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
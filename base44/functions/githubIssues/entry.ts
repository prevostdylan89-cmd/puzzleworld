import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'listRepos';

    if (action === 'listRepos') {
      const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      const repos = await res.json();
      return Response.json({ repos: repos.map(r => ({ name: r.name, full_name: r.full_name, private: r.private })) });
    }

    if (action === 'getIssues') {
      const repo = body.repo; // e.g. "prevostdylan89-cmd/puzzleworld"
      const state = body.state || 'open';
      const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=${state}&per_page=50`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      const issues = await res.json();
      return Response.json({ issues });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
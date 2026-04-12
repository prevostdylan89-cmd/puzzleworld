import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { title, description, category, page, user_email } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");

    const categoryEmoji = {
      bug: '🐛',
      suggestion: '💡',
      contenu: '📝',
      autre: '❓',
    }[category] || '❓';

    const issueTitle = `${categoryEmoji} [${category?.toUpperCase()}] ${title}`;
    const issueBody = `## Signalement utilisateur\n\n**Page :** \`${page || 'inconnue'}\`\n**Catégorie :** ${category}\n${user_email ? `**Utilisateur :** ${user_email}\n` : ''}\n### Description\n\n${description}`;

    const response = await fetch('https://api.github.com/repos/prevostdylan89-cmd/puzzleworld/issues', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: [category || 'bug'],
      }),
    });

    const issue = await response.json();

    if (!response.ok) {
      return Response.json({ error: issue.message }, { status: response.status });
    }

    return Response.json({ success: true, issue_url: issue.html_url, issue_number: issue.number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
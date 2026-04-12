import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { type } = body;

    if (type === 'puzzles') {
      const puzzles = await base44.asServiceRole.entities.PuzzleCatalog.filter({ status: 'active' }, '-created_date', 500);
      return Response.json({ data: puzzles });
    }

    if (type === 'articles') {
      const [articles, categories] = await Promise.all([
        base44.asServiceRole.entities.BlogArticle.filter({ is_published: true }, '-created_date'),
        base44.asServiceRole.entities.BlogCategory.list('order'),
      ]);
      return Response.json({ data: articles, categories });
    }

    if (type === 'categories') {
      const categories = await base44.asServiceRole.entities.PuzzleCategory.list('order', 100);
      return Response.json({ data: categories });
    }

    return Response.json({ error: 'Unknown type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
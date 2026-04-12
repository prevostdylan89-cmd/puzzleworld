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

    if (type === 'home') {
      const today = new Date().toISOString().split('T')[0];
      const [featured, allEvents, featuredArticles, pageSettings] = await Promise.all([
        base44.asServiceRole.entities.FeaturedPuzzle.list('position', 10),
        base44.asServiceRole.entities.Event.list('event_date', 20),
        base44.asServiceRole.entities.FeaturedArticle.list('position', 5),
        base44.asServiceRole.entities.PageSettings.filter({ page_name: 'Events' }),
      ]);
      // Resolve featured puzzles
      let topPuzzles = [];
      if (featured.length > 0) {
        const allCatalog = await base44.asServiceRole.entities.PuzzleCatalog.list('-socialScore', 500);
        const catalogMap = {};
        allCatalog.forEach(p => { catalogMap[p.id] = p; });
        topPuzzles = featured.sort((a, b) => a.position - b.position).map(f => catalogMap[f.puzzle_catalog_id] || {
          id: f.puzzle_catalog_id, title: f.puzzle_title, image_hd: f.puzzle_image, asin: f.puzzle_asin,
        }).filter(Boolean);
      } else {
        topPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.filter({ status: 'active' }, '-socialScore', 10);
      }
      const upcoming = allEvents.filter(e => e.event_date >= today).slice(0, 4);
      const events = upcoming.length >= 4 ? upcoming : allEvents.slice(0, 4);
      const eventsInMaintenance = pageSettings.length > 0 && pageSettings[0].is_active === false;
      return Response.json({ topPuzzles, events, featuredArticles: featuredArticles.sort((a,b) => a.position - b.position), eventsInMaintenance });
    }

    if (type === 'posts') {
      const { sort = '-likes_count', limit = 10, skip = 0 } = body;
      const posts = await base44.asServiceRole.entities.Post.list(sort, limit, skip);
      return Response.json({ data: posts });
    }

    return Response.json({ error: 'Unknown type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun !== false;
  const batchSize = body.batchSize || 10;
  const RAINFOREST_API_KEY = Deno.env.get('RAINFOREST_API_KEY');

  const seenPuzzles = await base44.asServiceRole.entities.UserSeenPuzzle.list('-created_date', 10000);
  const allAsins = [...new Set(
    seenPuzzles
      .map(s => (s.puzzle_asin || '').trim())
      .filter(a => /^B[0-9A-Z]{9}$/.test(a))
  )];

  const existing = await base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 10000);
  const existingAsins = new Set(existing.map(p => p.asin).filter(Boolean));
  const missingAsins = allAsins.filter(a => !existingAsins.has(a));

  if (dryRun) {
    return Response.json({
      dryRun: true,
      totalSeen: allAsins.length,
      alreadyInCatalog: existingAsins.size,
      missing: missingAsins.length,
      missingAsins: missingAsins.slice(0, 30),
    });
  }

  const toProcess = missingAsins.slice(0, batchSize);
  let added = 0;
  let failed = 0;
  const errors = [];

  for (const asin of toProcess) {
    const url = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=product&asin=${asin}&amazon_domain=amazon.fr`;
    const res = await fetch(url);
    if (!res.ok) {
      failed++;
      errors.push({ asin, error: `HTTP ${res.status}` });
      continue;
    }
    const data = await res.json();
    const product = data.product;
    if (!product || !product.title) {
      failed++;
      errors.push({ asin, error: 'No product data' });
      continue;
    }

    const piecesMatch = product.title.match(/(\d[\d\s]*)\s*(pi[eè]ces?|pcs?|pieces?|Teile)/i);
    const pieceCount = piecesMatch ? parseInt(piecesMatch[1].replace(/\s/g, '')) : null;

    await base44.asServiceRole.entities.PuzzleCatalog.create({
      asin,
      title: product.title,
      brand: product.brand || product.manufacturer || '',
      piece_count: pieceCount,
      image_hd: product.main_image?.link || '',
      amazon_price: product.buybox_winner?.price?.value || null,
      amazon_rating: product.rating || null,
      amazon_ratings_total: product.ratings_total || null,
      amazon_link: `https://www.amazon.fr/dp/${asin}?tag=puzzleworld-21`,
      status: 'active',
      socialScore: 0,
      wishlistCount: 0,
      added_count: 0
    });
    added++;
  }

  return Response.json({
    success: true,
    totalMissing: missingAsins.length,
    processed: toProcess.length,
    remaining: missingAsins.length - toProcess.length,
    added,
    failed,
    errors
  });
});
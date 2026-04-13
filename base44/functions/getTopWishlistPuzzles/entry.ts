import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all wishlist UserPuzzles (all users) using service role
    const wishlistPuzzles = await base44.asServiceRole.entities.UserPuzzle.filter({ status: 'wishlist' }, '-created_date', 5000);

    // Count by puzzle_reference (ASIN) or fallback to puzzle_name
    const counts = {};
    const puzzleInfo = {};

    wishlistPuzzles.forEach(p => {
      const key = p.puzzle_reference || p.puzzle_name?.toLowerCase().trim();
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
      if (!puzzleInfo[key]) {
        puzzleInfo[key] = {
          key,
          name: p.puzzle_name,
          brand: p.puzzle_brand,
          pieces: p.puzzle_pieces,
          image: p.image_url,
          reference: p.puzzle_reference,
        };
      }
    });

    // Sort by count descending, top 50
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([key, count]) => ({ ...puzzleInfo[key], wishlistCount: count }));

    return Response.json({ puzzles: sorted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
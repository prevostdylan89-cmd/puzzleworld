import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Récupérer toutes les marques
    const brands = await base44.asServiceRole.entities.Brand.list();
    const brandNames = brands.map(b => b.name);

    // Récupérer tous les puzzles
    const puzzles = await base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 5000);

    let updated = 0;
    let alreadyHasBrand = 0;
    let notFound = 0;

    for (const puzzle of puzzles) {
      // Si le puzzle a déjà une marque, on skip
      if (puzzle.brand && puzzle.brand.trim() !== '') {
        alreadyHasBrand++;
        continue;
      }

      // Chercher une marque dans le titre
      const titleLower = (puzzle.title || '').toLowerCase();
      let foundBrand = null;

      for (const brandName of brandNames) {
        if (titleLower.includes(brandName.toLowerCase())) {
          foundBrand = brandName;
          break;
        }
      }

      if (foundBrand) {
        await base44.asServiceRole.entities.PuzzleCatalog.update(puzzle.id, {
          brand: foundBrand
        });
        updated++;
      } else {
        notFound++;
      }
    }

    return Response.json({
      success: true,
      updated,
      alreadyHasBrand,
      notFound,
      total: puzzles.length
    });
  } catch (error) {
    console.error('Error updating brands:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
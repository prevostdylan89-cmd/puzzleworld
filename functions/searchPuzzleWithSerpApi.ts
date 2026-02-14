import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { barcode } = await req.json();

    if (!barcode || barcode.length !== 13) {
      return Response.json({ error: 'Code-barres invalide' }, { status: 400 });
    }

    // Vérification interne uniquement
    const existingPuzzles = await base44.entities.PuzzleCatalog.filter({ asin: barcode });
    if (existingPuzzles.length > 0) {
      return Response.json({
        status: 'existing',
        puzzle: existingPuzzles[0]
      });
    }

    // Pas de recherche API externe - fallback manuel uniquement
    return Response.json({
      status: 'not_found',
      message: 'Veuillez saisir manuellement les informations du puzzle'
    }, { status: 404 });
  } catch (error) {
    console.error('Erreur:', error);
    return Response.json({ 
      error: error.message || 'Erreur serveur',
      status: 'error'
    }, { status: 500 });
  }
});
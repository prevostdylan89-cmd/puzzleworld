import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all puzzles
    const puzzles = await base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 10000);
    
    let updated = 0;
    let notFound = 0;
    
    for (const puzzle of puzzles) {
      // Skip if already has dimensions
      if (puzzle.dimensions && puzzle.dimensions !== '') {
        continue;
      }
      
      // Extract dimensions from title or description
      let dimensions = extractDimensions(puzzle.title, puzzle.description);
      
      if (!dimensions) {
        dimensions = 'Dimensions non connues';
        notFound++;
      }
      
      // Update puzzle
      await base44.asServiceRole.entities.PuzzleCatalog.update(puzzle.id, {
        dimensions: dimensions
      });
      
      updated++;
    }
    
    return Response.json({
      success: true,
      total: puzzles.length,
      updated: updated,
      notFound: notFound
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractDimensions(title, description) {
  const text = `${title || ''} ${description || ''}`;
  
  // Patterns pour trouver les dimensions
  const patterns = [
    /(\d+)\s*[xX×]\s*(\d+)\s*cm/i,           // "70x50 cm" ou "70 x 50 cm"
    /(\d+)\s*[xX×]\s*(\d+)\s*centim[eè]tres/i, // "70x50 centimètres"
    /(\d+)\s*cm\s*[xX×]\s*(\d+)\s*cm/i,       // "70 cm x 50 cm"
    /(\d+)\s*[xX×]\s*(\d+)(?!\d)/i,           // "70x50" (sans unité)
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      
      // Vérifier que c'est des dimensions réalistes (entre 10 et 300 cm)
      if (width >= 10 && width <= 300 && height >= 10 && height <= 300) {
        return `${width} x ${height} cm`;
      }
    }
  }
  
  return null;
}
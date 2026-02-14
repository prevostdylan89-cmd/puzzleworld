import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { barcode } = await req.json();

    if (!barcode) {
      return Response.json({ error: 'Barcode requis' }, { status: 400 });
    }

    // Utiliser l'IA avec recherche web pour trouver les infos du puzzle
    const prompt = `Recherche le puzzle correspondant au code EAN/GTIN ${barcode} sur Amazon.fr et extraie les informations suivantes en format structuré. Cherche bien le produit puzzle avec ce code-barres exact.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          found: { type: "boolean", description: "Si le produit a été trouvé" },
          title: { type: "string", description: "Titre complet du puzzle" },
          brand: { type: "string", description: "Marque du puzzle (Ravensburger, Educa, etc.)" },
          pieces: { type: "number", description: "Nombre de pièces" },
          image_url: { type: "string", description: "URL de l'image du produit" },
          price: { type: "number", description: "Prix en euros" },
          asin: { type: "string", description: "Code ASIN Amazon" },
          dimensions: { type: "string", description: "Dimensions du puzzle (ex: 70x50 cm)" }
        },
        required: ["found", "title"]
      }
    });

    if (!result.found) {
      return Response.json({ 
        success: false, 
        message: 'Produit non trouvé sur Amazon' 
      });
    }

    const productData = {
      title: result.title,
      brand: result.brand || '',
      image_hd: result.image_url || null,
      price: result.price || null,
      pieces: result.pieces || null,
      dimensions: result.dimensions || '',
      asin: result.asin || barcode,
      link: result.asin ? `https://www.amazon.fr/dp/${result.asin}?tag=puzzleworld0e-21` : ''
    };

    return Response.json({ 
      success: true, 
      product: productData 
    });

  } catch (error) {
    console.error('Erreur scan barcode:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
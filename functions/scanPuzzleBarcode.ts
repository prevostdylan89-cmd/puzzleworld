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
    const prompt = `Va sur Amazon.fr et cherche le produit avec le code-barres EAN-13: ${barcode}
    
    Utilise cette URL exacte pour chercher: https://www.amazon.fr/s?k=${barcode}
    
    Si tu trouves un puzzle (jigsaw puzzle), extrais:
    - Le titre complet du produit
    - La marque (Ravensburger, Educa, Clementoni, etc.)
    - Le nombre de pièces
    - L'URL de l'image principale
    - Le prix
    - Le code ASIN (10 caractères)
    - Les dimensions
    
    Si aucun résultat ou si ce n'est pas un puzzle, retourne found: false.`;

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
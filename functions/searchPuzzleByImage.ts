import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the body as blob
    const bodyBlob = await req.blob();
    
    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    
    if (!serpApiKey) {
      return Response.json({ 
        success: false, 
        message: 'Clé API Serpapi non configurée' 
      }, { status: 500 });
    }

    // Upload l'image pour obtenir une URL
    const uploadResult = await base44.integrations.Core.UploadFile({ file: bodyBlob });
    const imageUrl = uploadResult.file_url;

    // Recherche avec Google Lens via SerpApi
    const serpApiUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(imageUrl)}&api_key=${serpApiKey}`;
    
    const response = await fetch(serpApiUrl);
    const data = await response.json();

    if (data.error || (!data.visual_matches && !data.knowledge_graph)) {
      return Response.json({ 
        success: false, 
        message: 'Aucun puzzle trouvé'
      });
    }

    // Chercher un résultat pertinent
    let product = null;
    
    if (data.visual_matches && data.visual_matches.length > 0) {
      product = data.visual_matches[0];
    } else if (data.knowledge_graph) {
      product = {
        title: data.knowledge_graph.title,
        thumbnail: data.knowledge_graph.images?.[0]?.thumbnail,
        link: data.knowledge_graph.website
      };
    }

    if (!product) {
      return Response.json({ 
        success: false, 
        message: 'Aucun puzzle trouvé'
      });
    }

    // Vérifier si ce produit existe déjà par son titre
    const title = product.title || '';
    const existingPuzzles = await base44.entities.PuzzleCatalog.filter({ title: title });
    
    if (existingPuzzles && existingPuzzles.length > 0) {
      return Response.json({ 
        success: true, 
        exists: true,
        product: existingPuzzles[0]
      });
    }

    // Récupérer les marques
    const allBrands = await base44.entities.Brand.list();
    const brandNames = allBrands.map(b => b.name.toLowerCase());

    // Extraire les infos
    const titleLower = title.toLowerCase();
    
    let brand = 'Marque indisponible';
    for (const brandName of brandNames) {
      if (titleLower.includes(brandName)) {
        const originalBrand = allBrands.find(b => b.name.toLowerCase() === brandName);
        if (originalBrand) {
          brand = originalBrand.name;
        }
        break;
      }
    }

    const piecesMatch = title.match(/(\d+)\s*(pièces?|pieces?|p\s|p-)/i);
    const pieces = piecesMatch ? parseInt(piecesMatch[1]) : null;

    const productData = {
      title: title,
      brand: brand,
      piece_count: pieces,
      image_hd: product.thumbnail || '',
      amazon_price: null,
      amazon_rating: null,
      amazon_ratings_total: 0,
      description: title,
      category_tag: 'Autre',
      socialScore: 0,
      wishlistCount: 0,
      added_count: 1,
      total_likes: 0,
      total_dislikes: 0
    };

    return Response.json({ 
      success: true, 
      exists: false,
      product: productData,
      isNewFromApi: true
    });

  } catch (error) {
    console.error('Erreur recherche par image:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
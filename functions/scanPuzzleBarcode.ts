import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { barcode } = await req.json();

    if (!barcode || !barcode.trim()) {
      return Response.json({ error: 'Barcode requis' }, { status: 400 });
    }

    // ÉTAPE 1 : Vérifier si le puzzle existe déjà dans la base de données
    const existingPuzzles = await base44.entities.PuzzleCatalog.filter({ asin: barcode });
    
    if (existingPuzzles && existingPuzzles.length > 0) {
      // Le puzzle existe déjà, retourner les données existantes
      return Response.json({ 
        success: true, 
        exists: true,
        product: existingPuzzles[0]
      });
    }

    // ÉTAPE 2 : Le puzzle n'existe pas, appeler SerpApi
    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    
    if (!serpApiKey) {
      return Response.json({ 
        success: false, 
        message: 'Clé API Serpapi non configurée' 
      }, { status: 500 });
    }

    // Recherche via SerpApi
    const serpApiUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(barcode)}&hl=fr&gl=fr&api_key=${serpApiKey}`;
    
    const response = await fetch(serpApiUrl);
    const data = await response.json();

    if (data.error || !data.shopping_results || data.shopping_results.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Produit non trouvé sur Amazon'
      });
    }

    // Prendre le premier résultat
    const product = data.shopping_results[0];

    // ÉTAPE 3 : Récupérer toutes les marques de la base de données
    const allBrands = await base44.entities.Brand.list();
    const brandNames = allBrands.map(b => b.name.toLowerCase());

    // ÉTAPE 4 : Extraire les informations du produit
    const title = product.title || '';
    const titleLower = title.toLowerCase();
    
    // Chercher une marque correspondante
    let brand = 'Marque indisponible';
    for (const brandName of brandNames) {
      if (titleLower.includes(brandName)) {
        // Retrouver le nom original de la marque (avec casse)
        const originalBrand = allBrands.find(b => b.name.toLowerCase() === brandName);
        if (originalBrand) {
          brand = originalBrand.name;
        }
        break;
      }
    }

    // Extraire le nombre de pièces
    const piecesMatch = title.match(/(\d+)\s*(pièces?|pieces?|p\s|p-)/i);
    const pieces = piecesMatch ? parseInt(piecesMatch[1]) : null;

    // Construire les données du produit
    const productData = {
      asin: barcode,
      title: title,
      brand: brand,
      piece_count: pieces,
      image_hd: product.thumbnail || '',
      amazon_price: product.price ? parseFloat(product.price.toString().replace(/[^\d,\.]/g, '').replace(',', '.')) : null,
      amazon_rating: product.rating || null,
      amazon_ratings_total: product.reviews || 0,
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
    console.error('Erreur scan barcode:', error);
    return Response.json({ 
      success: false, 
      message: 'Erreur lors de la recherche',
      error: error.message 
    }, { status: 500 });
  }
});
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

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    
    if (!serpApiKey) {
      return Response.json({ 
        success: false, 
        message: 'Clé API Serpapi non configurée' 
      }, { status: 500 });
    }

    // Recherche générale sur Google Shopping (tous sites)
    console.log(`Recherche Google Shopping pour EAN: ${barcode}`);
    const serpApiUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(barcode)}&gl=fr&hl=fr&api_key=${serpApiKey}`;
    const response = await fetch(serpApiUrl);
    const data = await response.json();

    console.log('SerpApi Google Shopping response:', JSON.stringify(data));

    // Vérifier erreur API
    if (data.error) {
      return Response.json({ 
        success: false, 
        message: `Erreur API: ${data.error}` 
      });
    }

    // Vérification de sécurité : s'assurer que des résultats existent
    if (!data.shopping_results || data.shopping_results.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Produit non trouvé. Essayez la recherche par photo ou saisie manuelle.'
      });
    }

    // Prendre le premier résultat pertinent (tous sites confondus)
    const product = data.shopping_results[0];

    // Extraire l'ASIN si c'est un produit Amazon, sinon utiliser le barcode
    const asinMatch = product.link?.match(/\/dp\/([A-Z0-9]{10})/i) || 
                      product.link?.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    const asin = asinMatch ? asinMatch[1] : barcode;

    // Extraire le nombre de pièces du titre
    const extractPieces = (title) => {
      const match = title?.match(/(\d+)\s*(pièces?|pieces?|p\s|p-)/i);
      return match ? parseInt(match[1]) : null;
    };

    // Extraire les dimensions
    const extractDimensions = (title) => {
      const match = title?.match(/(\d+\s*[xX×]\s*\d+)\s*(cm)?/);
      return match ? match[1] + ' cm' : '';
    };

    // Liste des marques connues
    const KNOWN_BRANDS = [
      'Ravensburger', 'Educa', 'Clementoni', 'Schmidt Spiele', 'Jumbo', 'Wasgij',
      'Castorland', 'Trefl', 'Falcon', 'Galison', 'Eurographics', 'Heye',
      'Bluebird', 'Cobble Hill', 'Pomegranate', 'Grafika', 'Buffalo Games'
    ];

    const extractBrand = (title) => {
      if (!title) return '';
      const titleLower = title.toLowerCase();
      for (const brand of KNOWN_BRANDS) {
        if (titleLower.includes(brand.toLowerCase())) {
          return brand;
        }
      }
      return '';
    };

    // Extraire toutes les données nécessaires
    const pieces = extractPieces(product.title);
    const brand = extractBrand(product.title);
    const dimensions = extractDimensions(product.title);
    
    // Deviner la catégorie depuis le titre
    let categoryTag = 'Autre';
    const titleLower = product.title.toLowerCase();
    
    if (titleLower.includes('nature') || titleLower.includes('paysage') || titleLower.includes('landscape')) {
      categoryTag = 'Nature';
    } else if (titleLower.includes('disney')) {
      categoryTag = 'Disney';
    } else if (titleLower.includes('art') || titleLower.includes('tableau')) {
      categoryTag = 'Art';
    } else if (titleLower.includes('animal')) {
      categoryTag = 'Animaux';
    } else if (titleLower.includes('ville') || titleLower.includes('city') || titleLower.includes('urban')) {
      categoryTag = 'Urbain';
    } else if (titleLower.includes('vintage')) {
      categoryTag = 'Vintage';
    }

    const productData = {
      title: product.title || '',
      brand: brand,
      image_hd: product.thumbnail || null,
      price: product.price || null,
      pieces: pieces,
      dimensions: dimensions,
      asin: asin,
      link: asin ? `https://www.amazon.fr/dp/${asin}?tag=puzzleworld0e-21` : product.link,
      category_tag: categoryTag,
      source: product.source || 'Google Shopping',
      rating: product.rating || null,
      ratings_total: product.reviews || 0,
      description: product.title || ''
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
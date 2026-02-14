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

    // Essayer plusieurs méthodes de recherche
    let data = null;
    let product = null;
    
    // MÉTHODE 1: Recherche directe par EAN sur Amazon.fr
    console.log(`Tentative 1: Recherche Amazon.fr avec EAN ${barcode}`);
    let serpApiUrl = `https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.fr&k=${encodeURIComponent(barcode)}&api_key=${serpApiKey}`;
    let response = await fetch(serpApiUrl);
    data = await response.json();
    
    if (data.organic_results && data.organic_results.length > 0) {
      product = data.organic_results[0];
      console.log("✓ Trouvé avec recherche Amazon directe");
    }
    
    // MÉTHODE 2: Google Shopping
    if (!product) {
      console.log(`Tentative 2: Google Shopping`);
      serpApiUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${barcode}&gl=fr&hl=fr&api_key=${serpApiKey}`;
      response = await fetch(serpApiUrl);
      data = await response.json();
      
      if (data.shopping_results && data.shopping_results.length > 0) {
        // Prioriser Amazon dans les résultats
        const amazonResult = data.shopping_results.find(r => r.link && r.link.includes('amazon'));
        product = amazonResult || data.shopping_results[0];
        
        // Normaliser la structure
        product = {
          title: product.title,
          thumbnail: product.thumbnail,
          price: product.extracted_price || product.price,
          link: product.link,
          asin: product.product_id || null
        };
        console.log("✓ Trouvé avec Google Shopping");
      }
    }
    
    // MÉTHODE 3: Recherche avec préfixe "puzzle"
    if (!product) {
      console.log(`Tentative 3: Recherche Amazon avec mot-clé puzzle`);
      serpApiUrl = `https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.fr&k=puzzle+${encodeURIComponent(barcode)}&api_key=${serpApiKey}`;
      response = await fetch(serpApiUrl);
      data = await response.json();
      
      if (data.organic_results && data.organic_results.length > 0) {
        product = data.organic_results[0];
        console.log("✓ Trouvé avec recherche Amazon + puzzle");
      }
    }

    // Vérifier s'il y a une erreur de l'API
    if (data?.error) {
      return Response.json({ 
        success: false, 
        message: `Erreur API: ${data.error}` 
      });
    }

    if (!product) {
      return Response.json({ 
        success: false, 
        message: 'Produit non trouvé. Essayez la recherche par photo ou saisie manuelle.'
      });
    }

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
      price: product.extracted_price || product.price?.value || null,
      pieces: pieces,
      dimensions: dimensions,
      asin: product.asin || barcode,
      link: product.asin ? `https://www.amazon.fr/dp/${product.asin}?tag=puzzleworld0e-21` : '',
      category_tag: categoryTag,
      // Données Amazon pour affichage et stats
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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the body as blob first
    const bodyBlob = await req.blob();
    
    // Check content type
    const contentType = req.headers.get('content-type') || '';
    
    let imageFile;
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      imageFile = formData.get('image');
    } else {
      // Direct blob upload
      imageFile = bodyBlob;
    }

    if (!imageFile) {
      return Response.json({ error: 'Image requise' }, { status: 400 });
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    
    if (!serpApiKey) {
      return Response.json({ 
        success: false, 
        message: 'Clé API Serpapi non configurée' 
      }, { status: 500 });
    }

    // Upload l'image sur Base44 pour obtenir une URL publique
    const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
    const imageUrl = uploadResult.file_url;

    console.log('Image uploaded:', imageUrl);

    // Recherche avec Google Lens via Serpapi
    const serpApiUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(imageUrl)}&api_key=${serpApiKey}`;
    
    const response = await fetch(serpApiUrl);
    const data = await response.json();

    console.log('Google Lens response:', JSON.stringify(data));

    // Vérifier s'il y a une erreur de l'API
    if (data.error) {
      return Response.json({ 
        success: false, 
        message: `Erreur API: ${data.error}` 
      });
    }

    // Vérification de sécurité : s'assurer que des résultats existent
    let product = null;
    
    // Essayer visual_matches en premier (produits similaires)
    if (data.visual_matches && data.visual_matches.length > 0) {
      // Chercher un produit Amazon dans les visual_matches
      for (const match of data.visual_matches) {
        if (match.link && match.link.includes('amazon')) {
          product = match;
          break;
        }
      }
      // Si pas d'Amazon, prendre le premier
      if (!product) {
        product = data.visual_matches[0];
      }
    }

    // Essayer knowledge_graph (infos produit)
    if (!product && data.knowledge_graph) {
      product = {
        title: data.knowledge_graph.title,
        thumbnail: data.knowledge_graph.images?.[0]?.thumbnail,
        link: data.knowledge_graph.website,
        source: 'Knowledge Graph'
      };
    }

    // Vérification finale
    if (!product) {
      return Response.json({ 
        success: false, 
        message: 'Aucun puzzle trouvé correspondant à cette image' 
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

    // Extraire l'ASIN de l'URL Amazon si disponible
    let asin = null;
    if (product.link) {
      const asinMatch = product.link.match(/\/dp\/([A-Z0-9]{10})/i) || 
                        product.link.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      if (asinMatch) {
        asin = asinMatch[1];
      }
    }

    // Extraire le prix si disponible
    let price = null;
    if (product.price) {
      const priceMatch = product.price.match(/(\d+[.,]\d+)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', '.'));
      }
    }

    // Extraire toutes les données nécessaires
    const pieces = extractPieces(product.title);
    const brand = extractBrand(product.title);
    const dimensions = extractDimensions(product.title);
    
    // Deviner la catégorie depuis le titre
    let categoryTag = 'Autre';
    const titleLower = product.title?.toLowerCase() || '';
    
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
      image_hd: product.thumbnail || imageUrl,
      price: price,
      pieces: pieces,
      dimensions: dimensions,
      asin: asin || '',
      link: asin ? `https://www.amazon.fr/dp/${asin}?tag=puzzleworld0e-21` : product.link || '',
      category_tag: categoryTag,
      source: product.source || 'Google Lens',
      rating: null,
      ratings_total: 0,
      description: product.title || ''
    };

    return Response.json({ 
      success: true, 
      product: productData 
    });

  } catch (error) {
    console.error('Erreur recherche par image:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
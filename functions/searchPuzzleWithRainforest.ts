import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asin } = await req.json();

    if (!asin || asin.length < 10) {
      return Response.json({ error: 'ASIN invalide' }, { status: 400 });
    }

    // Étape 1: Vérifier si le puzzle existe déjà
    const existingPuzzles = await base44.entities.PuzzleCatalog.filter({ asin });
    
    if (existingPuzzles.length > 0) {
      return Response.json({
        status: 'existing',
        puzzle: existingPuzzles[0],
        message: 'Puzzle déjà dans le catalogue'
      });
    }

    // Étape 2: Appeler Rainforest API
    const apiKey = Deno.env.get('RAINFOREST_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Clé API non configurée' }, { status: 500 });
    }

    // Déterminer si c'est une recherche par ASIN ou par code EAN
    const isAsin = asin.length === 10 && /^[A-Z0-9]{10}$/.test(asin);
    const rainforestUrl = isAsin 
      ? `https://api.rainforestapi.com/request?api_key=${apiKey}&type=product&amazon_domain=amazon.fr&asin=${asin}`
      : `https://api.rainforestapi.com/request?api_key=${apiKey}&type=search&amazon_domain=amazon.fr&search_term=${encodeURIComponent(asin)}`;
    
    const apiResponse = await fetch(rainforestUrl);
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      if (errorData.error) {
        return Response.json({ 
          error: `Rainforest API Error: ${errorData.error}`,
          status: 'api_error'
        }, { status: 404 });
      }
    }

    const rainforestData = await apiResponse.json();
    
    let product = null;
    
    // Gérer les deux types de réponses (product ou search results)
    if (rainforestData.product) {
      product = rainforestData.product;
    } else if (rainforestData.search_results && rainforestData.search_results.length > 0) {
      // Pour les résultats de recherche, prendre le premier résultat
      product = rainforestData.search_results[0];
    } else {
      return Response.json({ 
        error: 'Produit non trouvé sur Amazon',
        status: 'not_found'
      }, { status: 404 });
    }

    // Étape 3: Parser les données Amazon
    // Note: product peut être un search result qui a une structure différente
    const parsedData = await parseAmazonData(product, base44);

    // Retourner les données parsées SANS créer automatiquement (pour validation utilisateur)
    return Response.json({
      status: 'found',
      puzzle: {
        ...parsedData,
        asin: asin
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message || 'Erreur serveur',
      status: 'error'
    }, { status: 500 });
  }
});

async function parseAmazonData(product, base44) {
  const title = product.title || '';
  const description = product.description || '';
  const featureBullets = product.feature_bullets || [];
  // Gérer les deux structures: product direct ou search result
  const mainImage = product.main_image?.link || product.image || '';
  const price = product.pricing?.price || product.price || null;
  const rating = product.rating || null;
  const ratingTotal = product.rating_total || 0;

  // Extraction du nombre de pièces
  const pieceCount = extractPieceCount(title, featureBullets, description);

  // Détection de la marque
  let brandName = '';
  const brandId = await detectBrand(title, base44);

  // Si une marque a été trouvée, récupérer son nom
  if (brandId) {
    const brands = await base44.entities.Brand.filter({ id: brandId });
    if (brands.length > 0) {
      brandName = brands[0].name;
    }
  }

  return {
    title: sanitizeTitle(title),
    brand: brandName,
    pieceCount,
    imageUrl: mainImage,
    price,
    rating,
    ratings_total: ratingTotal,
    description: description.substring(0, 500) // Limiter la description
  };
}

function extractPieceCount(title, featureBullets, description) {
  // Regex patterns pour extraire le nombre de pièces
  const patterns = [
    /(\d+)\s*(?:pièces?|pieces?|pcs|pc|teile)/i,
    /(?:pièces?|pieces?|pcs|pc|teile)\s*[:\s]*(\d+)/i
  ];

  // Chercher dans le titre
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  // Chercher dans les feature bullets
  for (const bullet of featureBullets) {
    for (const pattern of patterns) {
      const match = bullet.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }

  // Chercher dans la description
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return 0;
}

async function detectBrand(title, base44) {
  try {
    const brands = await base44.entities.Brand.list();
    
    // Chercher une marque dont le nom apparaît dans le titre
    for (const brand of brands) {
      if (title.includes(brand.name)) {
        return brand.id;
      }
    }
  } catch (error) {
    console.log('Error detecting brand:', error);
  }

  return null;
}

function sanitizeTitle(title) {
  // Nettoyer le titre en enlevant les répétitions et caractères inutiles
  return title
    .replace(/[^\w\s\-é&àèêëïîôûœçÀÈÊËÏÎÔÛŒÇ]/g, '')
    .trim()
    .substring(0, 255);
}
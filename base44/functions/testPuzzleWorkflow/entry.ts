import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const asin = 'B07B9S8X1Q';
    const rainforestKey = Deno.env.get('RAINFOREST_API_KEY');

    if (!rainforestKey) {
      return Response.json({ error: 'RAINFOREST_API_KEY not set' }, { status: 500 });
    }

    console.log('🔍 Recherche ASIN:', asin);

    // Étape 1: Appel Rainforest API
    const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${rainforestKey}&type=product&amazon_domain=amazon.fr&asin=${asin}`;
    console.log('📡 Appel API:', rainforestUrl);

    const response = await fetch(rainforestUrl);
    const data = await response.json();

    console.log('✅ Réponse reçue:', {
      hasProduct: !!data.product,
      status: data.status,
      error: data.error
    });

    if (!data.product) {
      return Response.json({
        error: 'Product not found',
        apiResponse: data
      }, { status: 404 });
    }

    const product = data.product;
    console.log('📦 Produit trouvé:', product.title);

    // Étape 2: Extraction du nombre de pièces avec Regex
    const patterns = [
      /(\d+)\s*(pièces?|pieces?)/i,
      /(\d+)\s*p\b/i,
      /puzzle\s*(\d+)/i,
      /(\d{3,4})\s*(?:pc|pcs)/i
    ];

    let pieces = null;
    for (const pattern of patterns) {
      const match = product.title?.match(pattern);
      if (match && parseInt(match[1]) >= 100) {
        pieces = parseInt(match[1]);
        console.log('✨ Pièces trouvées:', pieces, 'Pattern:', pattern);
        break;
      }
    }

    if (!pieces && product.description) {
      for (const pattern of patterns) {
        const match = product.description.match(pattern);
        if (match && parseInt(match[1]) >= 100) {
          pieces = parseInt(match[1]);
          console.log('✨ Pièces trouvées dans description:', pieces);
          break;
        }
      }
    }

    // Étape 3: Détection de marque
    const brand = product.brand || '';
    const brandsToDetect = ['Ravensburger', 'Trefl', 'Clementoni', 'Eurographics', 'Cobble Hill'];
    let detectedBrand = brand;

    for (const brandName of brandsToDetect) {
      if (product.title?.includes(brandName) || brand.includes(brandName)) {
        detectedBrand = brandName;
        console.log('🏷️ Marque détectée:', detectedBrand);
        break;
      }
    }

    // Étape 4: Vérifier si puzzle existe déjà
    const existing = await base44.asServiceRole.entities.PuzzleCatalog.filter({ asin });
    if (existing.length > 0) {
      return Response.json({
        status: 'already_exists',
        puzzle: existing[0]
      });
    }

    // Créer l'entrée PuzzleCatalog
    const imageUrl = product.main_image?.link || product.images?.[0]?.link || '';
    const dimensionsMatch = product.title?.match(/(\d+)\s*[xX×]\s*(\d+)\s*(cm|mm)?/);
    const dimensions = dimensionsMatch ? `${dimensionsMatch[1]} x ${dimensionsMatch[2]}` : '';

    const catalogData = {
      asin: asin,
      title: product.title,
      brand: detectedBrand,
      piece_count: pieces || 0,
      image_hd: imageUrl,
      amazon_link: product.link || '',
      category_tag: 'Autre',
      amazon_rating: product.rating || null,
      amazon_ratings_total: product.ratings_total || 0,
      amazon_price: product.buybox_winner?.price?.value || product.price?.value || null,
      description: product.description || '',
      socialScore: 0,
      wishlistCount: 0,
      added_count: 1,
      total_likes: 0,
      total_dislikes: 0
    };

    console.log('💾 Création de la fiche PuzzleCatalog...');
    const newPuzzle = await base44.asServiceRole.entities.PuzzleCatalog.create(catalogData);

    return Response.json({
      status: 'success',
      message: 'Puzzle créé avec succès',
      puzzle: {
        id: newPuzzle.id,
        asin: newPuzzle.asin,
        title: newPuzzle.title,
        brand: newPuzzle.brand,
        pieces: newPuzzle.piece_count,
        image: newPuzzle.image_hd,
        dimensions: dimensions,
        amazonUrl: newPuzzle.amazon_link
      },
      testResults: {
        piecesExtracted: pieces,
        brandDetected: detectedBrand,
        apiSuccess: true
      }
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});
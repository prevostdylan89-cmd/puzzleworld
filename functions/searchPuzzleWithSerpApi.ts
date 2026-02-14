import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { barcode } = await req.json();

    if (!barcode || barcode.length !== 13) {
      return Response.json({ error: 'Code-barres invalide (13 chiffres requis)' }, { status: 400 });
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    if (!serpApiKey) {
      return Response.json({ error: 'Clé SerpApi non configurée' }, { status: 500 });
    }

    // ÉTAPE 1 : Vérification interne - Le puzzle existe-t-il déjà?
    const existingPuzzles = await base44.entities.PuzzleCatalog.filter({ asin: barcode });
    if (existingPuzzles.length > 0) {
      return Response.json({
        status: 'existing',
        puzzle: existingPuzzles[0]
      });
    }

    // ÉTAPE 2 : Recherche externe via SerpApi (Moteur Amazon)
    const searchUrl = new URL('https://api.serpapi.com/search');
    searchUrl.searchParams.append('q', barcode);
    searchUrl.searchParams.append('type', 'shopping');
    searchUrl.searchParams.append('engine', 'amazon');
    searchUrl.searchParams.append('amazon_domain', 'amazon.fr');
    searchUrl.searchParams.append('api_key', serpApiKey);

    const serpResponse = await fetch(searchUrl.toString());
    const serpData = await serpResponse.json();

    if (!serpData.shopping_results || serpData.shopping_results.length === 0) {
      return Response.json({
        status: 'not_found',
        message: 'Produit non trouvé, création manuelle requise'
      }, { status: 404 });
    }

    const product = serpData.shopping_results[0];
    const brands = await base44.entities.Brand.list();

    // ÉTAPE 3 : Parsing et création de la fiche communautaire
    let brand = product.brand || '';
    
    // Fallback 1 : Chercher dans les marques existantes de la DB
    if (!brand && brands.length > 0) {
      const titleLower = (product.title || '').toLowerCase();
      for (const b of brands) {
        if (titleLower.includes(b.name.toLowerCase())) {
          brand = b.name;
          break;
        }
      }
    }

    // Fallback 2 : Liste des marques connues
    if (!brand) {
      const knownBrands = [
        'Ravensburger', 'Educa', 'Clementoni', 'Schmidt Spiele', 'Jumbo', 'Wasgij',
        'Castorland', 'Trefl', 'Falcon', 'Galison', 'Eurographics', 'Heye',
        'Bluebird', 'Cobble Hill', 'Pomegranate', 'Grafika', 'Buffalo Games',
        'New York Puzzle', 'Cloudberries', 'Mudpuppy', 'Wentworth', 'Piatnik',
        'Djeco', 'Melissa & Doug', 'Nathan', 'MB', 'Dujardin', 'Janod'
      ];
      const titleLower = (product.title || '').toLowerCase();
      for (const knownBrand of knownBrands) {
        if (titleLower.includes(knownBrand.toLowerCase())) {
          brand = knownBrand;
          break;
        }
      }
    }

    // Extraction du nombre de pièces via regex
    let pieces = null;
    const piecePatterns = [
      /(\d+)\s*(pièces?|pieces?)/i,
      /(\d+)\s*p\b/i,
      /(\d+)\s*teile/i,
      /puzzle\s*(\d+)/i,
      /(\d{3,4})\s*(?:pc|pcs)/i
    ];

    const titleAndDescription = (product.title || '') + ' ' + (product.description || '');
    for (const pattern of piecePatterns) {
      const match = titleAndDescription.match(pattern);
      if (match && parseInt(match[1]) >= 100) {
        pieces = parseInt(match[1]);
        break;
      }
    }

    // Extraction des dimensions
    let dimensions = null;
    const dimMatch = titleAndDescription.match(/(\d+)\s*[xX×]\s*(\d+)\s*(cm|mm)?/);
    if (dimMatch) {
      dimensions = `${dimMatch[1]} x ${dimMatch[2]} cm`;
    }

    // Catégorisation
    let categoryTag = 'Autre';
    const titleLower = (product.title || '').toLowerCase();
    if (titleLower.includes('nature') || titleLower.includes('paysage') || titleLower.includes('landscape')) {
      categoryTag = 'Nature';
    } else if (titleLower.includes('disney') || titleLower.includes('cartoon')) {
      categoryTag = 'Disney';
    } else if (titleLower.includes('art') || titleLower.includes('painting')) {
      categoryTag = 'Art';
    } else if (titleLower.includes('animal') || titleLower.includes('animaux')) {
      categoryTag = 'Animaux';
    } else if (titleLower.includes('city') || titleLower.includes('urban') || titleLower.includes('ville')) {
      categoryTag = 'Urbain';
    } else if (titleLower.includes('vintage') || titleLower.includes('retro')) {
      categoryTag = 'Vintage';
    }

    // Image avec fallback
    let imageUrl = product.image || 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400&h=400&fit=crop';

    // Réponse complète
    return Response.json({
      status: 'found',
      data: {
        asin: barcode,
        title: product.title || 'Sans titre',
        brand: brand,
        piece_count: pieces,
        dimensions: dimensions,
        image_hd: imageUrl,
        category_tag: categoryTag,
        amazon_link: product.link || '',
        amazon_price: product.price ? parseFloat(product.price.replace(/[^\d,.-]/g, '').replace(',', '.')) : null,
        description: product.description || '',
        is_verified: false
      }
    });
  } catch (error) {
    console.error('Erreur SerpApi:', error);
    return Response.json({ 
      error: error.message || 'Erreur serveur',
      status: 'error'
    }, { status: 500 });
  }
});
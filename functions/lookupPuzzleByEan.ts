import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const AFFILIATE_TAG = 'puzzleworld-21';

function extractPieces(text) {
  if (!text) return null;
  const patterns = [
    /(\d+)\s*(pièces?|pieces?)/i,
    /(\d+)\s*teile/i,
    /puzzle\s*(\d+)/i,
    /(\d{3,4})\s*(?:pc|pcs)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && parseInt(match[1]) >= 100) return parseInt(match[1]);
  }
  return null;
}

function cleanTitle(title, brand, pieces) {
  let t = title || '';
  if (brand) t = t.replace(new RegExp(brand, 'gi'), '').trim();
  if (pieces) t = t.replace(/\d+\s*(pièces?|pieces?)/gi, '').trim();
  t = t.replace(/\d+\s*[xX×]\s*\d+\s*(cm|mm)?/g, '').trim();
  t = t.replace(/^[\s\-,]+|[\s\-,]+$/g, '').replace(/\s+/g, ' ');
  return t;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ean } = await req.json();

    if (!ean || ean.length !== 13) {
      return Response.json({ error: 'EAN invalide (13 chiffres requis)' }, { status: 400 });
    }

    // ÉTAPE 1 : Recherche par EAN dans le catalogue
    const byEan = await base44.entities.PuzzleCatalog.filter({ ean });
    if (byEan.length > 0) {
      const p = byEan[0];
      return Response.json({
        source: 'catalog_ean',
        catalog_id: p.id,
        asin: p.asin,
        ean: p.ean,
        title: p.title,
        brand: p.brand,
        piece_count: p.piece_count,
        image_hd: p.image_hd,
        amazon_price: p.amazon_price,
        amazon_rating: p.amazon_rating,
        category_tag: p.category_tag,
      });
    }

    // ÉTAPE 2 : Appel Rainforest API
    const apiKey = Deno.env.get('RAINFOREST_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'RAINFOREST_API_KEY non configurée' }, { status: 500 });
    }

    const rfUrl = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=product&amazon_domain=amazon.fr&gtin=${ean}`;

    let rfData;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const rfResp = await fetch(rfUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!rfResp.ok) {
        const errText = await rfResp.text();
        console.error('Rainforest error:', rfResp.status, errText);
        return Response.json({ error: 'Erreur API Rainforest', details: errText }, { status: 502 });
      }

      rfData = await rfResp.json();
    } catch (fetchErr) {
      console.error('Rainforest fetch error:', fetchErr);
      return Response.json({ error: 'Timeout ou erreur réseau Rainforest' }, { status: 502 });
    }

    if (!rfData.product) {
      return Response.json({ error: 'Produit non trouvé sur Amazon' }, { status: 404 });
    }

    const product = rfData.product;
    const asin = product.asin || null;

    // Extraction pièces
    const allText = [
      product.title,
      product.description,
      ...(product.feature_bullets || [])
    ].join(' ');
    const pieces = extractPieces(allText);

    const brand = product.brand || 'À compléter';
    const rawTitle = product.title || 'À compléter';
    const cleanedTitle = cleanTitle(rawTitle, brand === 'À compléter' ? '' : brand, pieces);
    const imageUrl = product.main_image?.link || product.images?.[0]?.link || '';

    const price = product.buybox_winner?.price?.value || product.price?.value || null;
    const rating = product.rating || null;
    const ratingsTotal = product.ratings_total || 0;

    const dimensionsMatch = (product.title || '').match(/(\d+)\s*[xX×]\s*(\d+)\s*(cm|mm)?/);
    const dimensions = dimensionsMatch ? `${dimensionsMatch[1]} x ${dimensionsMatch[2]} cm` : '';

    const fullDescription = [
      product.description || '',
      ...(product.feature_bullets || [])
    ].filter(Boolean).join('\n\n');

    // Catégorie
    let categoryTag = 'Autre';
    const catStr = (product.categories || []).map(c => c.name).join(' ').toLowerCase();
    if (catStr.includes('nature') || catStr.includes('landscape')) categoryTag = 'Nature';
    else if (catStr.includes('disney') || catStr.includes('cartoon')) categoryTag = 'Disney';
    else if (catStr.includes('art') || catStr.includes('painting')) categoryTag = 'Art';
    else if (catStr.includes('animal') || catStr.includes('pet')) categoryTag = 'Animaux';
    else if (catStr.includes('city') || catStr.includes('urban') || catStr.includes('architecture')) categoryTag = 'Urbain';

    // ÉTAPE 3 : Si ASIN connu → vérifier si déjà en base par ASIN
    if (asin) {
      const byAsin = await base44.entities.PuzzleCatalog.filter({ asin });
      if (byAsin.length > 0) {
        // Mettre à jour l'EAN manquant
        const existing = byAsin[0];
        if (!existing.ean) {
          await base44.entities.PuzzleCatalog.update(existing.id, { ean });
        }
        return Response.json({
          source: 'catalog_asin',
          catalog_id: existing.id,
          asin: existing.asin,
          ean,
          title: existing.title,
          brand: existing.brand,
          piece_count: existing.piece_count,
          image_hd: existing.image_hd,
          amazon_price: existing.amazon_price,
          amazon_rating: existing.amazon_rating,
          category_tag: existing.category_tag,
        });
      }
    }

    // ÉTAPE 4 : Nouveau puzzle → créer avec status "pending"
    const newEntry = await base44.entities.PuzzleCatalog.create({
      asin: asin || '',
      ean,
      title: cleanedTitle,
      brand,
      piece_count: pieces || 0,
      image_hd: imageUrl,
      category_tag: categoryTag,
      amazon_link: asin ? `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}` : '',
      amazon_price: price,
      amazon_rating: rating,
      amazon_ratings_total: ratingsTotal,
      description: fullDescription,
      socialScore: 0,
      wishlistCount: 0,
      added_count: 0,
      total_likes: 0,
      total_dislikes: 0,
      status: 'pending',
    });

    return Response.json({
      source: 'rainforest_new',
      catalog_id: newEntry.id,
      asin: asin || '',
      ean,
      title: cleanedTitle,
      brand,
      piece_count: pieces,
      image_hd: imageUrl,
      dimensions,
      amazon_price: price,
      amazon_rating: rating,
      category_tag: categoryTag,
    });

  } catch (error) {
    console.error('lookupPuzzleByEan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
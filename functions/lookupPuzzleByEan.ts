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

    // Recherche par EAN via search Rainforest
    const rfUrl = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=search&amazon_domain=amazon.fr&search_term=${ean}&sort_by=relevance&include_fields=search_results.asin,search_results.title,search_results.image,search_results.brand,search_results.prices`;

    let rfData;
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const rfResp = await fetch(rfUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!rfResp.ok) {
          const errText = await rfResp.text();
          console.error(`Rainforest error (attempt ${attempt}):`, rfResp.status, errText);
          lastError = errText;
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 2000 * attempt));
            continue;
          }
          return Response.json({ error: 'Erreur API Rainforest après 3 tentatives', details: lastError }, { status: 502 });
        }

        rfData = await rfResp.json();

        // Rainforest peut retourner un 200 mais avec success:false
        if (rfData?.request_info?.success === false) {
          lastError = rfData.request_info.message;
          console.error(`Rainforest success:false (attempt ${attempt}):`, lastError);
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 2000 * attempt));
            rfData = null;
            continue;
          }
          return Response.json({ error: 'Rainforest indisponible, réessayez dans quelques instants.' }, { status: 502 });
        }

        break; // succès
      } catch (fetchErr) {
        console.error(`Rainforest fetch error (attempt ${attempt}):`, fetchErr);
        lastError = fetchErr.message;
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }
        return Response.json({ error: 'Timeout ou erreur réseau Rainforest' }, { status: 502 });
      }
    }

    const searchResults = rfData.search_results;
    if (!searchResults || searchResults.length === 0) {
      return Response.json({ error: 'Produit non trouvé sur Amazon pour cet EAN' }, { status: 404 });
    }

    // Prendre le premier résultat
    const product = searchResults[0];
    const asin = product.asin || null;

    const rawTitle = product.title || 'À compléter';
    const brand = product.brand || 'À compléter';
    const pieces = extractPieces(rawTitle);
    const cleanedTitle = cleanTitle(rawTitle, brand === 'À compléter' ? '' : brand, pieces);
    const imageUrl = product.image || '';

    const price = product.prices?.[0]?.value || null;
    const rating = null;
    const ratingsTotal = 0;
    const dimensions = '';
    const fullDescription = '';

    // Catégorie basique depuis le titre
    let categoryTag = 'Autre';
    const titleLower = rawTitle.toLowerCase();
    if (titleLower.includes('nature') || titleLower.includes('paysage')) categoryTag = 'Nature';
    else if (titleLower.includes('disney')) categoryTag = 'Disney';
    else if (titleLower.includes('art') || titleLower.includes('peinture')) categoryTag = 'Art';
    else if (titleLower.includes('animal')) categoryTag = 'Animaux';

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
      title: cleanedTitle || 'À compléter',
      brand: brand || 'À compléter',
      piece_count: pieces || 0,
      image_hd: imageUrl || '',
      category_tag: categoryTag,
      amazon_link: asin ? `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}` : '',
      amazon_price: price || null,
      amazon_rating: rating || null,
      amazon_ratings_total: ratingsTotal || 0,
      description: fullDescription || '',
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
      title: cleanedTitle || rawTitle,
      brand,
      piece_count: pieces,
      image_hd: imageUrl,
      dimensions: '',
      amazon_price: price,
      amazon_rating: null,
      category_tag: categoryTag,
    });

  } catch (error) {
    console.error('lookupPuzzleByEan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
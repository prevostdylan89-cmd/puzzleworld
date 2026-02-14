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

    // Utiliser Web Scraping simple sur Amazon.fr
    const amazonUrl = `https://www.amazon.fr/s?k=${barcode}`;
    
    const response = await fetch(amazonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    });

    const html = await response.text();

    // Parser basique HTML pour extraire les infos produit
    const titleMatch = html.match(/<span class="a-size-[^"]*"[^>]*>([^<]+)<\/span>/);
    const imageMatch = html.match(/<img[^>]*src="(https:\/\/[^"]*images[^"]*)"[^>]*>/);
    const priceMatch = html.match(/<span class="a-price-whole">([^<]+)<\/span>/);
    const asinMatch = html.match(/\/dp\/([A-Z0-9]{10})/);

    if (!titleMatch || !asinMatch) {
      return Response.json({ 
        success: false, 
        message: 'Produit non trouvé sur Amazon' 
      });
    }

    const productData = {
      title: titleMatch[1].trim(),
      asin: asinMatch[1],
      image_hd: imageMatch ? imageMatch[1] : null,
      price: priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null,
      link: `https://www.amazon.fr/dp/${asinMatch[1]}?tag=puzzleworld0e-21`
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
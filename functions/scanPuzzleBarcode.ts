import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { searchAmazon, formatProductData } from './fetchAmazonPuzzle.js';

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

    // Recherche sur Amazon via SerpApi
    const product = await searchAmazon(barcode, serpApiKey);
    
    if (!product) {
      return Response.json({ 
        success: false, 
        message: 'Produit non trouvé sur Amazon'
      });
    }

    const productData = formatProductData(product, barcode);

    return Response.json({ 
      success: true, 
      product: productData 
    });

  } catch (error) {
    console.error('Erreur scan barcode:', error);
    return Response.json({ 
      success: false, 
      message: 'Produit non trouvé sur Amazon',
      error: error.message 
    }, { status: 500 });
  }
});
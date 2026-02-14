import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { formatProductData } from './fetchAmazonPuzzle.js';

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
        message: 'Produit non trouvé sur Amazon'
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
        link: data.knowledge_graph.website
      };
    }

    // Vérification finale
    if (!product) {
      return Response.json({ 
        success: false, 
        message: 'Produit non trouvé sur Amazon'
      });
    }

    const productData = formatProductData(product, null);

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
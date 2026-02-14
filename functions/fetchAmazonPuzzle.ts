import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fonction centralisée pour rechercher sur Amazon via SerpApi
async function searchAmazon(query, serpApiKey) {
  console.log(`[SerpApi] Recherche EAN/Barcode: ${query}`);
  
  // Première tentative : chercher directement par code-barres
  const serpApiUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&hl=fr&gl=fr&api_key=${serpApiKey}`;
  
  const response = await fetch(serpApiUrl);
  const data = await response.json();
  
  console.log('[SerpApi] Response received');
  
  if (data.error) {
    throw new Error(`SerpApi error: ${data.error}`);
  }
  
  // S'assurer que des résultats existent
  if (!data.shopping_results || data.shopping_results.length === 0) {
    return null;
  }
  
  // Filtrer pour privilégier les résultats Amazon.fr
  let product = null;
  
  // Chercher d'abord un produit Amazon
  for (const result of data.shopping_results) {
    if (result.source && result.source.toLowerCase().includes('amazon')) {
      product = result;
      break;
    }
  }
  
  // Sinon, prendre le premier résultat
  if (!product) {
    product = data.shopping_results[0];
  }
  
  return product;
}

// Fonctions d'extraction de données
function extractPieces(title) {
  const match = title?.match(/(\d+)\s*(pièces?|pieces?|p\s|p-)/i);
  return match ? parseInt(match[1]) : null;
}

function extractDimensions(title) {
  const match = title?.match(/(\d+\s*[xX×]\s*\d+)\s*(cm)?/);
  return match ? match[1] + ' cm' : '';
}

function extractBrand(title) {
  const KNOWN_BRANDS = [
    'Ravensburger', 'Educa', 'Clementoni', 'Schmidt Spiele', 'Jumbo', 'Wasgij',
    'Castorland', 'Trefl', 'Falcon', 'Galison', 'Eurographics', 'Heye',
    'Bluebird', 'Cobble Hill', 'Pomegranate', 'Grafika', 'Buffalo Games'
  ];
  
  if (!title) return '';
  const titleLower = title.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return '';
}

function extractCategory(title) {
  const titleLower = title?.toLowerCase() || '';
  
  if (titleLower.includes('nature') || titleLower.includes('paysage') || titleLower.includes('landscape')) {
    return 'Nature';
  } else if (titleLower.includes('disney')) {
    return 'Disney';
  } else if (titleLower.includes('art') || titleLower.includes('tableau')) {
    return 'Art';
  } else if (titleLower.includes('animal')) {
    return 'Animaux';
  } else if (titleLower.includes('ville') || titleLower.includes('city') || titleLower.includes('urban')) {
    return 'Urbain';
  } else if (titleLower.includes('vintage')) {
    return 'Vintage';
  }
  return 'Autre';
}

function parsePrice(price) {
  if (!price) return null;
  const priceStr = price.toString().replace(/[^\d,\.]/g, '');
  const priceMatch = priceStr.match(/(\d+)[,\.](\d+)/);
  if (priceMatch) {
    return parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
  }
  return null;
}

function extractASIN(link) {
  if (!link) return null;
  const asinMatch = link.match(/\/dp\/([A-Z0-9]{10})/i) || 
                    link.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1] : null;
}

function buildAffiliateLink(asin) {
  return asin ? `https://www.amazon.fr/dp/${asin}?tag=puzzleworld0e-21` : null;
}

// Fonction principale de formatage
function formatProductData(product, fallbackId) {
  const title = product.title || '';
  const brand = extractBrand(title);
  const dimensions = extractDimensions(title);
  const pieces = extractPieces(title);
  const asin = extractASIN(product.link) || fallbackId;
  const affiliateLink = buildAffiliateLink(asin);
  
  return {
    title: title,
    brand: brand,
    image_hd: product.thumbnail || null,
    price: parsePrice(product.price),
    pieces: pieces,
    dimensions: dimensions,
    asin: asin,
    link: affiliateLink || product.link,
    category_tag: extractCategory(title),
    rating: product.rating || null,
    ratings_total: product.reviews || 0,
    description: title
  };
}

export { searchAmazon, formatProductData };
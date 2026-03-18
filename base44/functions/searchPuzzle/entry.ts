import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { barcode } = await req.json();

    if (!barcode || barcode.length !== 13) {
      return Response.json({ error: 'Invalid barcode' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RAINFOREST_API_KEY');
    if (!apiKey) {
      console.error('RAINFOREST_API_KEY not set');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log(`Searching for barcode: ${barcode}`);

    const response = await fetch(
      `https://api.rainforestapi.com/request?api_key=${apiKey}&type=product&amazon_domain=amazon.fr&gtin=${barcode}`
    );

    const data = await response.json();
    console.log('Rainforest response status:', response.status);
    console.log('Response has product:', !!data.product);

    if (!response.ok) {
      console.error('Rainforest API error:', data);
      return Response.json({ 
        error: 'API Error',
        details: data.error_message || data.message 
      }, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
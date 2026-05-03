import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function getFirebaseIdToken(serviceAccountKey) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  
  const toSign = `${header}.${payload}`;
  const keyData = serviceAccountKey.private_key;
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(keyData),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign));
  const sig64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  const jwt = `${toSign}.${sig64}`;
  
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      return Response.json({ error: 'Missing Firebase credentials' }, { status: 400 });
    }

    const serviceAccountKey = {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n')
    };

    // Get Firebase token
    const token = await getFirebaseIdToken(serviceAccountKey);

    // Fetch puzzles from Firestore
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/puzzles`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Firebase error:', err);
      return Response.json({
        success: false,
        message: 'Impossible d\'accéder à Firebase. Vérifiez les credentials.',
        error: err
      }, { status: 500 });
    }

    const data = await response.json();
    const puzzles = [];

    if (data.documents) {
      data.documents.forEach(doc => {
        const fields = doc.fields;
        if (fields?.asin?.stringValue) {
          puzzles.push({
            asin: fields.asin.stringValue,
            title: fields.title?.stringValue || '',
            brand: fields.brand?.stringValue || '',
            piece_count: parseInt(fields.piece_count?.integerValue || '0'),
            image_url: fields.image_url?.stringValue || '',
            image_hd: fields.image_hd?.stringValue || '',
            amazon_link: fields.amazon_link?.stringValue || '',
            category_tag: fields.category_tag?.stringValue || '',
            price: parseFloat(fields.price?.doubleValue || '0'),
            ean: fields.ean?.stringValue || ''
          });
        }
      });
    }

    if (puzzles.length === 0) {
      return Response.json({
        success: false,
        message: 'Aucun puzzle trouvé dans Firebase'
      }, { status: 404 });
    }

    // Get current puzzles
    const currentPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 10000);
    const currentAsins = new Set(currentPuzzles.map(p => p.asin));

    // Restore missing puzzles
    let addedCount = 0;
    const errors = [];

    for (const puzzle of puzzles) {
      if (!currentAsins.has(puzzle.asin)) {
        try {
          await base44.asServiceRole.entities.PuzzleCatalog.create({
            asin: puzzle.asin,
            title: puzzle.title,
            brand: puzzle.brand,
            piece_count: puzzle.piece_count,
            image_url: puzzle.image_url,
            image_hd: puzzle.image_hd,
            amazon_link: puzzle.amazon_link,
            category_tag: puzzle.category_tag,
            price: puzzle.price,
            socialScore: 0,
            wishlistCount: 0,
            added_count: 0,
            ean: puzzle.ean
          });
          addedCount++;
        } catch (error) {
          errors.push(`${puzzle.asin}: ${error.message}`);
        }
      }
    }

    return Response.json({
      success: true,
      message: `${addedCount} puzzles restaurés sur ${puzzles.length} trouvés!`,
      restored: addedCount,
      total: puzzles.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
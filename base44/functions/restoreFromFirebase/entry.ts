import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function getFirebaseAccessToken() {
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: clientEmail, sub: clientEmail, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600, scope: 'https://www.googleapis.com/auth/datastore' };
  const header = { alg: 'RS256', typ: 'JWT' };
  const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = `${encode(header)}.${encode(payload)}`;
  const pemContents = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}` });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('Token error: ' + JSON.stringify(tokenData));
  return tokenData.access_token;
}

function val(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue);
  if ('doubleValue' in v) return parseFloat(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    const accessToken = await getFirebaseAccessToken();

    let allDocs = [];
    let pageToken = null;
    do {
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/puzzles?pageSize=300`;
      if (pageToken) url += `&pageToken=${pageToken}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!res.ok) return Response.json({ error: await res.text() }, { status: 500 });
      const data = await res.json();
      if (data.documents) allDocs = allDocs.concat(data.documents);
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    const puzzles = allDocs.map(doc => {
      const f = doc.fields || {};
      return { asin: val(f.asin), title: val(f.title) || '', brand: val(f.brand) || '', piece_count: val(f.piece_count) || 0, image_hd: val(f.image_hd) || val(f.image_url) || '', amazon_link: val(f.amazon_link) || '', category_tag: val(f.category_tag) || '', amazon_price: val(f.price) || val(f.amazon_price) || 0, ean: val(f.ean) || '', status: 'active', socialScore: 0, wishlistCount: 0, added_count: 0 };
    }).filter(p => p.asin);

    const currentPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 10000);
    const currentAsins = new Set(currentPuzzles.map(p => p.asin).filter(Boolean));

    let addedCount = 0;
    for (const puzzle of puzzles) {
      if (!currentAsins.has(puzzle.asin)) {
        await base44.asServiceRole.entities.PuzzleCatalog.create(puzzle);
        addedCount++;
      }
    }

    return Response.json({ success: true, message: `${addedCount} puzzles restaurés sur ${puzzles.length} trouvés!`, restored: addedCount, total: puzzles.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
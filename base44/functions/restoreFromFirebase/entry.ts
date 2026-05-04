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

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;

    // Fetch all user_puzzles docs
    let allDocs = [];
    let pageToken = null;
    do {
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_puzzles?pageSize=300`;
      if (pageToken) url += `&pageToken=${pageToken}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!res.ok) return Response.json({ error: await res.text() }, { status: 500 });
      const data = await res.json();
      if (data.documents) allDocs = allDocs.concat(data.documents);
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    // Extract unique puzzles by asin or title+brand+pieces
    const seen = new Map();
    for (const doc of allDocs) {
      const f = doc.fields || {};
      const asin = val(f.asin);
      const title = val(f.puzzle_name) || val(f.title) || '';
      const brand = val(f.puzzle_brand) || val(f.brand) || '';
      const pieces = val(f.puzzle_pieces) || val(f.piece_count) || 0;
      const imageUrl = val(f.image_url) || val(f.image_hd) || '';
      const ean = val(f.ean) || '';
      if (!title) continue;
      const key = asin || `${title}__${brand}__${pieces}`;
      if (!seen.has(key)) {
        seen.set(key, { asin: asin || '', ean, title, brand, piece_count: pieces, image_hd: imageUrl, status: 'active', socialScore: 0, wishlistCount: 0, added_count: 0 });
      }
    }
    const uniquePuzzles = Array.from(seen.values());

    if (dryRun) {
      return Response.json({
        dryRun: true,
        totalDocs: allDocs.length,
        uniquePuzzles: uniquePuzzles.length,
        sample: uniquePuzzles.slice(0, 5),
        message: `DRY RUN: ${uniquePuzzles.length} puzzles uniques dans ${allDocs.length} docs. Envoie dryRun:false pour importer.`
      });
    }

    // Import missing ones
    const existing = await base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 10000);
    const existingAsins = new Set(existing.map(p => p.asin).filter(Boolean));
    const existingKeys = new Set(existing.map(p => `${p.title}__${p.brand}__${p.piece_count}`));
    let added = 0, skipped = 0;
    for (const puzzle of uniquePuzzles) {
      const key = `${puzzle.title}__${puzzle.brand}__${puzzle.piece_count}`;
      if ((puzzle.asin && existingAsins.has(puzzle.asin)) || existingKeys.has(key)) { skipped++; continue; }
      await base44.asServiceRole.entities.PuzzleCatalog.create(puzzle);
      added++;
    }
    return Response.json({ success: true, totalDocs: allDocs.length, uniquePuzzles: uniquePuzzles.length, added, skipped, message: `${added} puzzles ajoutés (${skipped} déjà présents).` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
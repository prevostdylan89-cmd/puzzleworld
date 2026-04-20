import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Helper to get a Firebase access token using service account credentials
async function getFirebaseAccessToken() {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  };

  // Create JWT
  const header = { alg: 'RS256', typ: 'JWT' };
  const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Import private key
  const pemContents = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// Write a document to Firestore
async function writeToFirestore(collection, docId, data) {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const accessToken = await getFirebaseAccessToken();

  // Convert data to Firestore fields format
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'object') {
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore write failed: ${err}`);
  }

  return await res.json();
}

// Delete a document from Firestore
async function deleteFromFirestore(collection, docId) {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const accessToken = await getFirebaseAccessToken();

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Firestore delete failed: ${err}`);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    if (!event || !data) {
      return Response.json({ error: 'Missing event or data' }, { status: 400 });
    }

    const entityName = event.entity_name;
    const entityId = event.entity_id;
    const eventType = event.type;

    // Map entity names to Firestore collection names
    const collectionMap = {
      'UserPuzzle': 'user_puzzles',
      'PuzzleCatalog': 'puzzle_catalog',
      'Post': 'posts',
      'Comment': 'comments',
      'Like': 'likes',
      'Follow': 'follows',
      'User': 'users',
      'Achievement': 'achievements',
      'SwipeInteraction': 'swipe_interactions',
      'UserDNA': 'user_dna',
      'Event': 'events',
      'EventParticipant': 'event_participants',
    };

    const firestoreCollection = collectionMap[entityName];
    if (!firestoreCollection) {
      return Response.json({ skipped: true, reason: `Entity ${entityName} not mapped` });
    }

    if (eventType === 'delete') {
      await deleteFromFirestore(firestoreCollection, entityId);
      console.log(`Deleted ${entityName}/${entityId} from Firestore`);
    } else {
      // create or update
      await writeToFirestore(firestoreCollection, entityId, { ...data, _synced_at: new Date().toISOString() });
      console.log(`Synced ${entityName}/${entityId} to Firestore (${eventType})`);
    }

    return Response.json({ success: true, entity: entityName, id: entityId, action: eventType });
  } catch (error) {
    console.error('Firebase sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
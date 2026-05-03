import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as admin from 'npm:firebase-admin@12.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Initialize Firebase
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');

    const serviceAccount = {
      type: 'service_account',
      project_id: projectId,
      private_key_id: 'key-id',
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: clientEmail,
      client_id: '123456789',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token'
    };

    // For now, create some sample puzzle data that was typical
    // This is a simplified restoration - you should have a proper backup
    const puzzles = [];
    
    // Fetch from syncToFirebase to get latest data
    const firebaseSync = await base44.functions.invoke('syncToFirebase', {});
    
    // Try to fetch from Firestore REST API
    const projectId2 = projectId;
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId2}/databases/(default)/documents/puzzles`, {
      headers: {
        'Authorization': 'Bearer ya29.a0AfH6SMBx...' // Would need proper token
      }
    }).catch(() => null);

    // If that fails, use a minimal set to restore
    if (!response || !response.ok) {
      return Response.json({
        success: false,
        message: 'Impossible d\'accéder aux puzzles supprimés. Avez-vous une sauvegarde CSV ou JSON?'
      }, { status: 500 });
    }

    const data = await response.json();
    if (data.documents) {
      data.documents.forEach(doc => {
        const fields = doc.fields;
        puzzles.push({
          asin: fields.asin?.stringValue,
          title: fields.title?.stringValue,
          brand: fields.brand?.stringValue,
          piece_count: fields.piece_count?.integerValue,
          image_url: fields.image_url?.stringValue,
          image_hd: fields.image_hd?.stringValue,
          amazon_link: fields.amazon_link?.stringValue,
          category_tag: fields.category_tag?.stringValue,
          price: fields.price?.doubleValue,
          ean: fields.ean?.stringValue
        });
      });
    }

    // Get current puzzles from base44
    const currentPuzzles = await base44.asServiceRole.entities.PuzzleCatalog.list('-created_date', 10000);
    const currentAsins = new Set(currentPuzzles.map(p => p.asin));

    // Add missing puzzles
    let addedCount = 0;
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
            socialScore: puzzle.socialScore || 0,
            wishlistCount: puzzle.wishlistCount || 0,
            added_count: puzzle.added_count || 0,
            ean: puzzle.ean
          });
          addedCount++;
        } catch (error) {
          console.error(`Error creating puzzle ${puzzle.asin}:`, error.message);
        }
      }
    }

    return Response.json({
      success: true,
      message: `${addedCount} puzzles restaurés avec succès!`,
      totalInFirebase: puzzles.length,
      restored: addedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
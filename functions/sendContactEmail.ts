import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, subject, message } = await req.json();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'questionpuzzleworld@outlook.fr',
      from_name: 'PuzzleWorld Contact',
      subject: `[Contact PuzzleWorld] ${subject}`,
      body: `Nouveau message de contact :\n\nNom : ${name}\nEmail : ${email}\nSujet : ${subject}\n\nMessage :\n${message}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
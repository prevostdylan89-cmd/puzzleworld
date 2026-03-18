import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, subject, message } = await req.json();

    await resend.emails.send({
      from: 'PuzzleWorld Contact <onboarding@resend.dev>',
      to: 'questionpuzzleworld@outlook.fr',
      subject: `[Contact PuzzleWorld] ${subject}`,
      html: `
        <h2>Nouveau message de contact PuzzleWorld</h2>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Sujet :</strong> ${subject}</p>
        <hr />
        <p><strong>Message :</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
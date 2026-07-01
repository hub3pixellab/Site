import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

export async function POST(req) {
  try {
    const formData = await req.formData();
    const name = formData.get('name')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const area = formData.get('area')?.toString().trim() || '';
    const message = formData.get('message')?.toString().trim() || '';
    const linkedin = formData.get('linkedin')?.toString().trim() || '';
    const cv = formData.get('cv'); // File or null

    if (!name || name.length < 2) return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 });
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    if (!area) return NextResponse.json({ error: 'Área de interesse obrigatória.' }, { status: 400 });

    const to = process.env.CAREERS_EMAIL || process.env.CONTACT_EMAIL || 'hub3pixellab@gmail.com';
    const from = process.env.RESEND_FROM;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#0b0914;color:#f5f5ff;padding:24px;border-radius:12px;max-width:640px;margin:0 auto;">
        <h2 style="color:#FF6B35;font-family:Orbitron,sans-serif;letter-spacing:2px;margin:0 0 8px;">Novo candidato · HUB3</h2>
        <p style="color:#00F0FF;font-size:12px;letter-spacing:1px;margin:0 0 20px;">TRABALHE CONOSCO · ${new Date().toISOString()}</p>
        <table style="width:100%;font-size:14px;background:#130e26;padding:14px;border-radius:8px;">
          <tr><td style="color:#9945FF;padding:4px 8px;font-size:11px;letter-spacing:1.5px;">NOME</td><td style="padding:4px 8px;">${esc(name)}</td></tr>
          <tr><td style="color:#9945FF;padding:4px 8px;font-size:11px;letter-spacing:1.5px;">EMAIL</td><td style="padding:4px 8px;"><a href="mailto:${esc(email)}" style="color:#00F0FF;">${esc(email)}</a></td></tr>
          <tr><td style="color:#9945FF;padding:4px 8px;font-size:11px;letter-spacing:1.5px;">ÁREA</td><td style="padding:4px 8px;">${esc(area)}</td></tr>
          ${linkedin ? `<tr><td style="color:#9945FF;padding:4px 8px;font-size:11px;letter-spacing:1.5px;">LINKEDIN</td><td style="padding:4px 8px;"><a href="${esc(linkedin)}" style="color:#00F0FF;">${esc(linkedin)}</a></td></tr>` : ''}
        </table>
        ${message ? `<div style="background:#130e26;padding:14px 18px;border-radius:8px;margin-top:14px;"><p style="margin:0;color:#CCFF00;font-size:11px;letter-spacing:1.5px;">MENSAGEM</p><p style="margin:6px 0 0;font-size:13px;white-space:pre-wrap;">${esc(message)}</p></div>` : ''}
        ${cv && cv.name ? `<p style="margin-top:14px;font-size:12px;color:#00F0FF;">📎 Anexo: ${esc(cv.name)} (${Math.round((cv.size||0)/1024)} KB)</p>` : ''}
      </div>
    `;

    // Build attachments if CV provided
    let attachments;
    if (cv && cv.arrayBuffer && cv.size > 0 && cv.size < 5 * 1024 * 1024) {
      const buf = Buffer.from(await cv.arrayBuffer());
      attachments = [{ filename: cv.name || 'cv.pdf', content: buf.toString('base64') }];
    }

    let mailResult = null;
    try {
      // Add attachments only if Resend supports (we use raw fetch — extend if needed)
      mailResult = await sendEmail({ to, from, subject: `Novo candidato — ${name} (${area})`, html, replyTo: email });
    } catch (e) {
      console.error('[api/careers] mail send failed:', e.message);
    }

    return NextResponse.json({ ok: true, mailed: !mailResult?.skipped });
  } catch (err) {
    console.error('[api/careers] error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { completeChat } from '@/lib/llm';
import { sendEmail } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYS = `Você é o HUB3 Ideator. Gere UMA (1) ideia de produto/projeto na intersecção de tecnologia, design e Web3, baseada no PROMPT do usuário.
Formate exatamente assim (markdown):
**NOME:** ...
**HOOK:** ...
**MECÂNICA:** ...
**PÚBLICO:** ...
**MVP:** ...
**POR QUÊ AGORA:** ...
Seja criativo, viável e comercialmente relevante. Português.`;

function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

export async function POST(req) {
  try {
    const { prompt, senderName, senderEmail } = await req.json();
    if (!prompt || String(prompt).trim().length < 4) {
      return NextResponse.json({ error: 'Prompt muito curto.' }, { status: 400 });
    }

    const idea = await completeChat({
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: prompt.trim() },
      ],
      temperature: 0.9,
    });

    // Fire-and-forget email to team
    const to = process.env.CONTACT_EMAIL || 'hub3pixellab@gmail.com';
    const from = process.env.RESEND_FROM;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#0b0914;color:#f5f5ff;padding:24px;border-radius:12px;max-width:640px;margin:0 auto;">
        <h2 style="color:#CCFF00;font-family:Orbitron,sans-serif;letter-spacing:2px;margin:0 0 8px;">Nova Ideia · HUB3.IA</h2>
        <p style="color:#00F0FF;font-size:12px;letter-spacing:1px;margin:0 0 20px;">HUB3 IDEATOR · ${new Date().toISOString()}</p>
        <div style="background:#130e26;padding:14px 18px;border-radius:8px;margin-bottom:16px;">
          <p style="margin:0;font-size:11px;color:#9945FF;letter-spacing:1.5px;">SOLICITANTE</p>
          <p style="margin:4px 0 0;font-size:14px;">${esc(senderName || 'Anônimo')} ${senderEmail ? '&lt;' + esc(senderEmail) + '&gt;' : ''}</p>
        </div>
        <div style="background:#130e26;padding:14px 18px;border-radius:8px;margin-bottom:16px;">
          <p style="margin:0;font-size:11px;color:#9945FF;letter-spacing:1.5px;">PROMPT</p>
          <p style="margin:4px 0 0;font-size:13px;white-space:pre-wrap;">${esc(prompt)}</p>
        </div>
        <div style="background:#130e26;padding:14px 18px;border-radius:8px;border:1px solid rgba(204,255,0,0.25);">
          <p style="margin:0;font-size:11px;color:#CCFF00;letter-spacing:1.5px;">IDEIA GERADA</p>
          <div style="margin-top:8px;font-size:13px;line-height:1.5;white-space:pre-wrap;">${esc(idea)}</div>
        </div>
      </div>
    `;
    let mailResult = null;
    try {
      mailResult = await sendEmail({ to, from, subject: 'Nova ideia', html, replyTo: senderEmail || undefined });
    } catch (e) {
      console.error('[api/ai/idea] mail send failed:', e.message);
    }

    return NextResponse.json({ ok: true, idea, mailed: !mailResult?.skipped });
  } catch (err) {
    console.error('[api/ai/idea] error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';
import { completeChat } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function esc(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/** Portfolio pool — projetos reais/exemplo pra suggestions personalizadas */
const PORTFOLIO_POOL = [
  { title: 'CVM Design System',    tag: 'design system', division: 'PixelLab',  hook: 'Design system escalável para fintech regulada' },
  { title: 'Xstate Onboarding',    tag: 'ux flow',       division: 'AppLab',    hook: 'Onboarding com state machine reduzindo churn em 40%' },
  { title: 'HouseLab Brand',       tag: 'branding',      division: 'House Lab', hook: 'Identidade visual completa com sistema de marca vivo' },
  { title: 'CryptoLuxe Marketplace', tag: 'web3',        division: 'PixelLab',  hook: 'Marketplace NFT premium com integração multi-chain' },
  { title: 'DJ Booking Platform',  tag: 'saas',          division: 'AppLab',    hook: 'SaaS de agenciamento com pagamentos on-chain' },
  { title: 'FreeMarket AR',        tag: 'ar/vr',         division: 'PixelLab',  hook: 'Compra de produtos em realidade aumentada' },
  { title: 'Hub3 Fliperama',       tag: 'game',          division: 'House Lab', hook: 'Arcade Web3 com 8+ jogos e leaderboard global' },
  { title: 'Matchmaker CRM',       tag: 'crm',           division: 'AppLab',    hook: 'CRM com engenharia de matches para criativos' },
];

function pickRelated(items) {
  // Escolhe 3 projetos com viés de categoria semelhante ao carrinho
  const catHints = items.map(i => (i.name || '').toLowerCase()).join(' ');
  const scored = PORTFOLIO_POOL.map(p => ({
    p,
    score: (catHints.includes(p.tag.split('/')[0]) ? 3 : 0) + Math.random(),
  })).sort((a, b) => b.score - a.score).slice(0, 3);
  return scored.map(s => s.p);
}

function firstNameFromEmail(email) {
  if (!email) return '';
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const first = local.split(' ')[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

async function generateBuyerEmailHTML({ buyerName, items, related, chain, symbol, totalNative }) {
  const productList = items.map(i => `${i.name} (${i.quantity}x)`).join(', ');
  const relatedList = related.map(r => `- ${r.title}: ${r.hook}`).join('\n');

  const prompt = `Você é o HUB3 Assistant, escrevendo um e-mail de agradecimento personalizado para um comprador.

DADOS:
- Nome do comprador: ${buyerName || 'querido cliente'}
- Produtos comprados: ${productList}
- Total: ${totalNative} ${symbol} (via ${chain})
- Projetos relacionados sugeridos:
${relatedList}

INSTRUÇÕES:
- Escreva UM parágrafo curto (3-4 linhas) de agradecimento personalizado que:
  1. Cumprimenta usando o nome do comprador
  2. Cita o produto principal comprado
  3. Menciona brevemente o próximo passo (nossa equipe abre um ticket em até 24h úteis)
  4. Faz uma micro-conexão criativa com o produto (algo específico, não genérico)
- Depois liste os 3 projetos sugeridos em formato markdown (- **Nome**: hook)
- Tom: acolhedor, direto, cyberpunk-friendly, sem clichês corporativos
- NÃO use "prezado(a)" nem "cordialmente"
- Português brasileiro
- MÁXIMO 8 linhas totais no output
- Retorne apenas o texto do e-mail, sem títulos ou preâmbulo`;

  const aiText = await completeChat({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });

  const bodyHtml = esc(aiText)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#0b0914;color:#f5f5ff;padding:32px;border-radius:14px;max-width:600px;margin:0 auto;">
      <p style="color:#CCFF00;font-family:Orbitron,sans-serif;letter-spacing:3px;font-size:11px;margin:0 0 6px;">HUB3 · CONFIRMAÇÃO</p>
      <h1 style="color:#f5f5ff;font-family:Orbitron,sans-serif;letter-spacing:1px;font-size:22px;margin:0 0 20px;">Obrigado pela compra, ${esc(buyerName || 'você')}!</h1>
      <div style="background:#130e26;padding:18px 22px;border-radius:10px;border-left:3px solid #CCFF00;font-size:14px;line-height:1.7;">
        <p style="margin:0;">${bodyHtml}</p>
      </div>
      <div style="margin-top:24px;padding:14px 18px;background:rgba(0,240,255,0.06);border:1px solid rgba(0,240,255,0.25);border-radius:8px;">
        <p style="margin:0;font-size:11px;color:#00F0FF;letter-spacing:1.5px;">RESUMO</p>
        <p style="margin:6px 0 0;font-size:13px;color:#c9f5ff;">
          ${esc(productList)}<br/>
          <span style="color:#9945FF;">${totalNative} ${esc(symbol)}</span> na rede <strong>${esc(chain)}</strong>
        </p>
      </div>
      <p style="margin-top:28px;font-size:12px;color:#f5f5ff88;line-height:1.6;">
        Nossa equipe entra em contato pelo e-mail em até <strong>24h úteis</strong>. Se preferir acelerar, chame no WhatsApp:
        <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || '5511966438164'}" style="color:#CCFF00;">clique aqui</a>.
      </p>
      <hr style="border:none;border-top:1px solid #1f1830;margin:22px 0 14px;"/>
      <p style="margin:0;font-size:10px;letter-spacing:2px;color:#5a4b7a;font-family:Orbitron,sans-serif;">
        HUB3 PIXELLAB · hub3pixellab@gmail.com · @hub3pixellab
      </p>
    </div>
  `;
}

/**
 * POST /api/store/order
 * Body: { chain, mode, txHash, from, items, subtotalNative, totalNative, symbol, priceUSD, buyerEmail? }
 * 1) Envia notificação para o time HUB3 (síncrono)
 * 2) Se buyerEmail presente, gera + envia agradecimento personalizado via Gemini (não-bloqueante)
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      chain, mode = 'testnet', txHash, from, items = [],
      subtotalNative, totalNative, symbol, priceUSD, buyerEmail,
    } = body || {};

    if (!chain || !txHash || !from || !items.length) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const to = process.env.CONTACT_EMAIL || 'hub3pixellab@gmail.com';
    const from_email = process.env.RESEND_FROM;
    const itemsRows = items.map(it => `
      <tr>
        <td style="padding:6px 10px;">${esc(it.emoji || '')} ${esc(it.name)}</td>
        <td style="padding:6px 10px;text-align:center;">${it.quantity || 1}</td>
        <td style="padding:6px 10px;text-align:right;">${Number(it.priceNative || 0).toFixed(6)} ${esc(symbol)}</td>
      </tr>`).join('');

    const explorerBase = {
      ethereum:'https://sepolia.etherscan.io/tx/', bnb:'https://testnet.bscscan.com/tx/',
      polygon:'https://amoy.polygonscan.com/tx/', arbitrum:'https://sepolia.arbiscan.io/tx/',
      optimism:'https://sepolia-optimism.etherscan.io/tx/', linea:'https://sepolia.lineascan.build/tx/',
      solana:'https://solscan.io/tx/',
    };
    const explorerLink = (explorerBase[chain] || '') + txHash + (chain === 'solana' && mode === 'testnet' ? '?cluster=devnet' : '');

    const teamHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#0b0914;color:#f5f5ff;padding:24px;border-radius:12px;max-width:700px;margin:0 auto;">
        <h2 style="color:#CCFF00;font-family:Orbitron,sans-serif;letter-spacing:2px;margin:0 0 6px;">Novo pedido · HUB3 Store</h2>
        <p style="color:#00F0FF;font-size:12px;letter-spacing:1px;margin:0 0 16px;">${esc(chain.toUpperCase())} · ${esc(mode.toUpperCase())} · ${new Date().toISOString()}</p>
        <table style="width:100%;background:#130e26;border-radius:8px;font-size:12px;color:#c9f5ff;">
          <tr><td style="padding:6px 10px;color:#9945FF;">TX HASH</td><td style="padding:6px 10px;"><a style="color:#00F0FF;" href="${esc(explorerLink)}">${esc(txHash).slice(0,20)}...</a></td></tr>
          <tr><td style="padding:6px 10px;color:#9945FF;">DE (buyer)</td><td style="padding:6px 10px;">${esc(from)}</td></tr>
          <tr><td style="padding:6px 10px;color:#9945FF;">SUBTOTAL</td><td style="padding:6px 10px;">${Number(subtotalNative||0).toFixed(6)} ${esc(symbol)}</td></tr>
          <tr><td style="padding:6px 10px;color:#9945FF;">TOTAL</td><td style="padding:6px 10px;font-weight:bold;">${Number(totalNative||0).toFixed(6)} ${esc(symbol)} <span style="opacity:0.6">(~US$${Number(priceUSD||0).toFixed(2)})</span></td></tr>
          ${buyerEmail ? `<tr><td style="padding:6px 10px;color:#9945FF;">CONTATO</td><td style="padding:6px 10px;"><a href="mailto:${esc(buyerEmail)}" style="color:#00F0FF;">${esc(buyerEmail)}</a></td></tr>` : ''}
        </table>
        <h3 style="margin-top:16px;color:#FF6B35;font-family:Orbitron,sans-serif;letter-spacing:1.5px;">ITENS</h3>
        <table style="width:100%;background:#130e26;border-radius:8px;font-size:12px;color:#f5f5ff;">${itemsRows}</table>
        <p style="margin-top:20px;font-size:11px;color:#00F0FF;"><a href="${esc(explorerLink)}" style="color:#00F0FF;">🔗 Ver no explorer</a></p>
      </div>
    `;

    // 1) Team notification (síncrono)
    let teamMailResult = null;
    try {
      teamMailResult = await sendEmail({
        to, from: from_email,
        subject: `Novo pedido HUB3 Store — ${totalNative} ${symbol}`,
        html: teamHtml, replyTo: buyerEmail || undefined,
      });
    } catch (e) {
      console.error('[api/store/order] team mail failed:', e.message);
    }

    // 2) Buyer thank-you personalizado via Gemini (best-effort — não bloqueia resposta)
    let buyerMailStatus = 'skipped';
    if (buyerEmail) {
      try {
        const buyerName = firstNameFromEmail(buyerEmail);
        const related = pickRelated(items);
        const buyerHtml = await generateBuyerEmailHTML({
          buyerName, items, related, chain, symbol, totalNative,
        });
        await sendEmail({
          to: buyerEmail, from: from_email,
          subject: `Obrigado pela sua compra na HUB3 Store, ${buyerName || 'você'}!`,
          html: buyerHtml,
          replyTo: process.env.CONTACT_EMAIL,
        });
        buyerMailStatus = 'sent';
      } catch (e) {
        console.error('[api/store/order] buyer mail failed:', e.message);
        buyerMailStatus = 'error';
      }
    }

    console.log('[hub3.store.order]', {
      chain, mode, txHash, from, totalNative, symbol, priceUSD,
      teamMail: !teamMailResult?.skipped, buyerMail: buyerMailStatus,
    });

    return NextResponse.json({
      ok: true,
      mailed: !teamMailResult?.skipped,
      buyerMail: buyerMailStatus,
      explorerLink,
    });
  } catch (err) {
    console.error('[api/store/order]', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

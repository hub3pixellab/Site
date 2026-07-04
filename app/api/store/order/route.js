import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function esc(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/**
 * POST /api/store/order
 * Body: { chain, mode, txHash, from, items, subtotalNative, totalNative, symbol, priceUSD, buyerEmail? }
 * Loga o pedido (console/e-mail) e retorna ok. Não valida on-chain (V1) — apenas registra.
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

    const html = `
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
        <table style="width:100%;background:#130e26;border-radius:8px;font-size:12px;color:#f5f5ff;">
          ${itemsRows}
        </table>
        <p style="margin-top:20px;font-size:11px;color:#00F0FF;">
          <a href="${esc(explorerLink)}" style="color:#00F0FF;">🔗 Ver no explorer</a>
        </p>
      </div>
    `;

    let mailResult = null;
    try {
      mailResult = await sendEmail({
        to, from: from_email,
        subject: `Novo pedido HUB3 Store — ${totalNative} ${symbol}`,
        html, replyTo: buyerEmail || undefined,
      });
    } catch (e) {
      console.error('[api/store/order] mail send failed:', e.message);
    }

    console.log('[hub3.store.order]', { chain, mode, txHash, from, totalNative, symbol, priceUSD });

    return NextResponse.json({ ok: true, mailed: !mailResult?.skipped, explorerLink });
  } catch (err) {
    console.error('[api/store/order]', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

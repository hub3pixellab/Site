import { NextResponse } from 'next/server';
import { sanityReadClient, isSanityConfigured, sanityEnv } from '@/lib/sanity.client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/whitepaper?redirect=1  → 302 para o CDN do Sanity (arquivo direto)
 * GET /api/whitepaper             → 302 (padrão, otimizado para download)
 * GET /api/whitepaper?json=1      → JSON { url, title, version, updatedAt }
 *
 * O documento singleton `whitepaper` mais recentemente publicado é usado.
 */
export async function GET(req) {
  try {
    if (!isSanityConfigured || !sanityReadClient) {
      return NextResponse.json(
        { error: 'Sanity não configurado. Configure NEXT_PUBLIC_SANITY_PROJECT_ID.' },
        { status: 503 }
      );
    }

    const query = `*[_type == "whitepaper" && published == true] | order(updatedAt desc)[0]{
      title, version, updatedAt, "assetRef": pdf.asset._ref
    }`;

    const doc = await sanityReadClient.fetch(query, {}, { cache: 'no-store' });
    if (!doc || !doc.assetRef) {
      return NextResponse.json(
        { error: 'Nenhum whitepaper publicado. Suba um documento no Studio (/studio).' },
        { status: 404 }
      );
    }

    // Sanity file ref format: file-<id>-<ext> → URL: https://cdn.sanity.io/files/<project>/<dataset>/<id>.<ext>
    const parts = doc.assetRef.split('-');
    if (parts[0] !== 'file' || parts.length < 3) {
      return NextResponse.json({ error: 'Asset ref inválido.' }, { status: 500 });
    }
    const ext = parts.pop();
    const id = parts.slice(1).join('-');
    const cdnUrl = `https://cdn.sanity.io/files/${sanityEnv.projectId}/${sanityEnv.dataset}/${id}.${ext}`;

    const wantsJson = new URL(req.url).searchParams.get('json') === '1';
    if (wantsJson) {
      return NextResponse.json({
        url: cdnUrl,
        title: doc.title,
        version: doc.version,
        updatedAt: doc.updatedAt,
      });
    }
    // Default: redirect for direct download (browser follows and downloads/opens)
    return NextResponse.redirect(cdnUrl, 302);
  } catch (err) {
    console.error('[api/whitepaper] error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

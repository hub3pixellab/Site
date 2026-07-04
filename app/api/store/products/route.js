import { NextResponse } from 'next/server';
import { sanityReadClient, isSanityConfigured } from '@/lib/sanity.client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Seed fictício — usado quando Sanity ainda não configurado */
const SEED_PRODUCTS = [
  {
    id: 'seed-1', name: 'Design System Audit', category: 'services',
    emoji: '\u{1F3A8}', description: 'Auditoria completa do seu design system com relatório executivo.',
    details: 'Análise de tokens, componentes, acessibilidade e escalabilidade.',
    badge: 'HOT', priceUSD: 490,
    priceByChain: { ethereum: 0.13, polygon: 490, bnb: 0.7, arbitrum: 0.13, optimism: 0.13, linea: 0.13, solana: 3.5 },
    stock: -1, order: 1,
  },
  {
    id: 'seed-2', name: 'UX Consulting (1h)', category: 'services',
    emoji: '\u{1F9E0}', description: 'Uma hora de mentoria 1:1 com nossos leads em UX/Product.',
    badge: null, priceUSD: 120,
    priceByChain: { ethereum: 0.033, polygon: 120, bnb: 0.17, arbitrum: 0.033, optimism: 0.033, linea: 0.033, solana: 0.85 },
    stock: 20, order: 2,
  },
  {
    id: 'seed-3', name: 'HUB3 Setup Pack', category: 'software',
    emoji: '\u{1F4E6}', description: 'Snippets, componentes React e templates que usamos internamente.',
    badge: 'NEW', priceUSD: 39,
    priceByChain: { ethereum: 0.011, polygon: 39, bnb: 0.055, arbitrum: 0.011, optimism: 0.011, linea: 0.011, solana: 0.28 },
    stock: -1, order: 3,
  },
  {
    id: 'seed-4', name: 'Neon Wallpaper Pack', category: 'nft',
    emoji: '\u{1F5BC}', description: 'Coleção de 12 wallpapers cyberpunk 4K originais HUB3.',
    badge: 'LIMITED', priceUSD: 15,
    priceByChain: { ethereum: 0.004, polygon: 15, bnb: 0.02, arbitrum: 0.004, optimism: 0.004, linea: 0.004, solana: 0.11 },
    stock: 100, order: 4,
  },
  {
    id: 'seed-5', name: 'HUB3 Sticker Pack (físico)', category: 'hardware',
    emoji: '\u{1F3F7}', description: '10 stickers vinil holográficos. Envio Brasil.',
    badge: null, priceUSD: 12,
    priceByChain: { ethereum: 0.003, polygon: 12, bnb: 0.017, arbitrum: 0.003, optimism: 0.003, linea: 0.003, solana: 0.09 },
    stock: 200, order: 5,
  },
  {
    id: 'seed-6', name: 'Web3 Onboarding Workshop', category: 'services',
    emoji: '\u{1F393}', description: 'Workshop 4h remoto para times aprenderem Web3 do zero.',
    badge: 'HOT', priceUSD: 890,
    priceByChain: { ethereum: 0.24, polygon: 890, bnb: 1.25, arbitrum: 0.24, optimism: 0.24, linea: 0.24, solana: 6.3 },
    stock: 10, order: 6,
  },
];

export async function GET() {
  try {
    if (!isSanityConfigured || !sanityReadClient) {
      return NextResponse.json({ products: SEED_PRODUCTS, source: 'seed' });
    }
    const query = `*[_type == "product" && published == true] | order(order asc) {
      "id": _id, name, category, emoji, description, details, badge,
      priceUSD, priceByChain, stock, order,
      "image": image.asset->url
    }`;
    const products = await sanityReadClient.fetch(query, {}, { cache: 'no-store' });
    if (!products || products.length === 0) {
      return NextResponse.json({ products: SEED_PRODUCTS, source: 'seed-fallback' });
    }
    return NextResponse.json({ products, source: 'sanity' });
  } catch (err) {
    console.error('[api/store/products]', err);
    return NextResponse.json({ products: SEED_PRODUCTS, source: 'seed-error', error: err.message });
  }
}

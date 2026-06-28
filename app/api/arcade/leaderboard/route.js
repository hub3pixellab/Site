import { NextResponse } from 'next/server';
import { sanityReadClient, isSanityConfigured } from '@/lib/sanity.client';
import { topLeadsQuery } from '@/lib/queries';

export const runtime = 'edge';
export const revalidate = 10;

/**
 * GET /api/arcade/leaderboard
 * Retorna o top 10 (nickname, score) ordenado desc.
 * ISR: revalida a cada 60s.
 */
export async function GET() {
  try {
    if (!isSanityConfigured || !sanityReadClient) {
      return NextResponse.json(
        { ok: true, configured: false, leaderboard: [] },
        { status: 200 }
      );
    }
    const leaderboard = await sanityReadClient.fetch(topLeadsQuery);
    return NextResponse.json(
      { ok: true, configured: true, leaderboard: leaderboard || [] },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'unknown error' },
      { status: 500 }
    );
  }
}

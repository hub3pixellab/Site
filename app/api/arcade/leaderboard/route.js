import { NextResponse } from 'next/server';
import { sanityReadClient, isSanityConfigured } from '@/lib/sanity.client';
import { topLeadsQuery, topLeadsByGameQuery } from '@/lib/queries';

export const runtime = 'edge';
export const revalidate = 10;

/**
 * GET /api/arcade/leaderboard[?game=xxx]
 * Retorna o top 10 (nickname, score, game) ordenado desc.
 * Se ?game=xxx for passado, filtra por jogo.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get('game');

    if (!isSanityConfigured || !sanityReadClient) {
      return NextResponse.json(
        { ok: true, configured: false, leaderboard: [], game: game || null },
        { status: 200 }
      );
    }
    const leaderboard = game
      ? await sanityReadClient.fetch(topLeadsByGameQuery, { game })
      : await sanityReadClient.fetch(topLeadsQuery);
    return NextResponse.json(
      { ok: true, configured: true, leaderboard: leaderboard || [], game: game || null },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'unknown error' },
      { status: 500 }
    );
  }
}

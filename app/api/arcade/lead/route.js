import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  sanityReadClient,
  sanityWriteClient,
  isSanityConfigured,
} from '@/lib/sanity.client';
import { findLeadByNicknameAndGameQuery } from '@/lib/queries';

export const runtime = 'edge';

/**
 * POST /api/arcade/lead
 * Body: { nickname, email, phone, score, game }
 *
 * • Score é único por (nickname, game). Cada jogo tem seu próprio highscore.
 * • Cria lead se (nickname, game) inexistente.
 * • Atualiza score apenas se novo > existente.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { nickname, email, phone } = body || {};
    const score = Number(body?.score);
    const game = (body?.game && typeof body.game === 'string') ? body.game : 'general';

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'nickname is required' },
        { status: 400 }
      );
    }
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'email is required' },
        { status: 400 }
      );
    }
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'phone is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(score) || score < 0) {
      return NextResponse.json(
        { ok: false, error: 'score must be a non-negative number' },
        { status: 400 }
      );
    }

    if (!isSanityConfigured || !sanityReadClient || !sanityWriteClient) {
      return NextResponse.json(
        {
          ok: true,
          configured: false,
          message: 'Sanity is not configured yet. Lead accepted in-memory only.',
          lead: { nickname, email, phone, score, game, timestamp: new Date().toISOString() },
          updated: false,
        },
        { status: 200 }
      );
    }

    const existing = await sanityWriteClient.fetch(findLeadByNicknameAndGameQuery, {
      nickname, game,
    });
    const now = new Date().toISOString();

    if (!existing) {
      const created = await sanityWriteClient.create({
        _id: uuidv4(),
        _type: 'lead',
        nickname, email, phone, score, game,
        timestamp: now,
      });
      return NextResponse.json(
        { ok: true, created: true, updated: true, lead: created },
        { status: 200 }
      );
    }

    if (score > (existing.score || 0)) {
      const patched = await sanityWriteClient
        .patch(existing._id)
        .set({ score, timestamp: now, email, phone, game })
        .commit();
      return NextResponse.json(
        { ok: true, created: false, updated: true, lead: patched },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true, created: false, updated: false,
        reason: 'existing score is greater or equal',
        lead: existing,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'unknown error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { sanityReadClient, isSanityConfigured } from '@/lib/sanity.client';
import { matchmakerQuestionsQuery } from '@/lib/queries';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/matchmaker/questions
 * Retorna as cards do matchmaker em ordem (sortOrder asc).
 */
export async function GET() {
  try {
    if (!isSanityConfigured || !sanityReadClient) {
      return NextResponse.json(
        { ok: true, configured: false, questions: [] },
        { status: 200 }
      );
    }
    const questions = await sanityReadClient.fetch(matchmakerQuestionsQuery);
    return NextResponse.json(
      { ok: true, configured: true, questions: questions || [] },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'unknown error' },
      { status: 500 }
    );
  }
}

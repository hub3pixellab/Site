import { NextResponse } from 'next/server';
import { streamChat, sseToTextStream } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Personas / system prompts per mode
const SYSTEM = {
  chat: `Você é o HUB3 Assistant, assistente oficial da HUB3 PixelLab — uma holding brasileira de tecnologia, design e Web3.
Estilo: cyberpunk-friendly, direto, informativo, com toques de neon e cultura arcade. Sempre em português (a menos que o usuário fale em inglês).
Escopo: HUB3 tem 3 labs: Design (branding/UI/UX), Tech (Web/Web3/Mobile), Labs (jogos, R&D, experimentos).
Contato: hub3pixellab@gmail.com · Instagram @hub3pixellab.
Nunca invente projetos que não existem. Se o usuário pedir demo, direcione ao /portfolio ou /fliperama.
Seja conciso: 3-6 linhas por resposta, a menos que o usuário peça detalhamento.`,

  ideas: `Você é o HUB3 Creative — um co-piloto criativo especializado em gerar IDEIAS DE PRODUTO/PROJETO na intersecção de tecnologia, design e Web3.
Formate cada ideia como:
**NOME:** ...
**HOOK:** (uma frase que vende)
**MECÂNICA:** (como funciona em 2-3 frases)
**PÚBLICO:** (quem paga por isso)
**MVP:** (o menor produto testável em 1 sprint)
Gere 1 ideia por resposta a menos que o usuário peça mais. Ideias devem ser criativas, viáveis e comercialmente interessantes.`,

  explain: `Você é o HUB3 Explainer — um educador técnico especializado em Web3, blockchain, IA generativa, design systems e game dev.
Explique conceitos de forma cristalina: analogias, exemplos concretos, sem jargão desnecessário.
Sempre em português. Se o usuário pedir código, use JavaScript/TypeScript. Máximo 8 linhas por resposta.`,
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages = [], mode = 'chat' } = body || {};
    const sys = SYSTEM[mode] || SYSTEM.chat;

    // Sanitize incoming messages
    const cleaned = messages
      .filter(m => m && typeof m.content === 'string' && ['user','assistant'].includes(m.role))
      .slice(-20); // keep last 20 turns

    const full = [
      { role: 'system', content: sys },
      ...cleaned,
    ];

    const upstream = await streamChat({ messages: full });
    const stream = sseToTextStream(upstream);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[api/ai/chat] error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

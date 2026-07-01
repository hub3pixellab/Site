// Emergent LLM proxy — OpenAI-compatible (litellm)
// Docs: proxy URL from emergentintegrations utils. Model naming: `gemini/<model-id>`.

const PROXY = process.env.INTEGRATION_PROXY_URL || 'https://integrations.emergentagent.com';
const KEY = process.env.EMERGENT_LLM_KEY;
const APP_ID = process.env.APP_URL || '';

export const GEMINI_MODEL = 'gemini/gemini-2.5-flash';

export function assertKey() {
  if (!KEY) throw new Error('EMERGENT_LLM_KEY missing.');
}

/**
 * Chat completion — streaming SSE.
 * Returns a ReadableStream of text chunks (already decoded).
 * @param {{ messages: {role:string,content:string}[], model?: string, temperature?: number }} opts
 */
export async function streamChat({ messages, model = GEMINI_MODEL, temperature = 0.7 }) {
  assertKey();
  const upstream = await fetch(`${PROXY}/llm/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'X-App-ID': APP_ID,
    },
    body: JSON.stringify({ model, messages, stream: true, temperature }),
  });
  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    throw new Error(`LLM proxy error ${upstream.status}: ${errText.slice(0, 200)}`);
  }
  return upstream.body;
}

/**
 * Non-streaming completion — returns the assistant text.
 */
export async function completeChat({ messages, model = GEMINI_MODEL, temperature = 0.7 }) {
  assertKey();
  const res = await fetch(`${PROXY}/llm/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'X-App-ID': APP_ID,
    },
    body: JSON.stringify({ model, messages, stream: false, temperature }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`LLM proxy error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

/**
 * Passes an SSE upstream body directly to the client, converting OpenAI SSE
 * `data: {json}` events to plain text chunks the browser can consume via ReadableStream.
 */
export function sseToTextStream(upstreamBody) {
  const reader = upstreamBody.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';
        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') { controller.close(); return; }
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(new TextEncoder().encode(delta));
          } catch { /* skip malformed */ }
        }
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() { reader.cancel(); },
  });
}

// Email dispatch via Resend (transactional).
// If RESEND_API_KEY is missing, we no-op and return { skipped:true } so
// upstream API routes can still succeed (and log locally for later replay).

const RESEND_URL = 'https://api.resend.com/emails';

export async function sendEmail({ to, subject, html, text, replyTo, from }) {
  const key = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.RESEND_FROM || 'HUB3 <onboarding@resend.dev>';
  if (!key) {
    console.warn('[mailer] RESEND_API_KEY missing — email not sent (dev mode).', { to, subject });
    return { skipped: true };
  }
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${t.slice(0,200)}`);
  }
  return res.json();
}

# HUB3 Test Credentials

## App Details
- Base URL (preview): use REACT_APP_BACKEND_URL if set, otherwise http://localhost:3000
- Frontend runs on port 3000 (Next.js dev)
- Backend/API: same origin, endpoints prefixed with /api/

## Authentication
- No auth required. All routes are public.
- Games save score via lead capture form (nickname + email + phone).

## Third-party integrations
- Emergent LLM Key (Gemini via proxy): pre-configured in /app/.env.local
  - Model: gemini/gemini-2.5-flash
  - Proxy: https://integrations.emergentagent.com
- Resend (email): RESEND_API_KEY not yet set — mailer no-ops gracefully.
- Sanity CMS: dummy keys in env; leaderboard writes may fail silently but game flow works.

## Contact
- CONTACT_EMAIL: hub3pixellab@gmail.com
- WHATSAPP_NUMBER: 5511999999999 (placeholder)

## Test endpoints (curl)
- POST /api/ai/chat  { mode:'chat'|'ideas'|'explain', messages:[{role,content}] } → streaming text
- POST /api/ai/idea  { prompt, senderName?, senderEmail? } → { ok, idea, mailed }
- POST /api/careers  FormData(name,email,area,linkedin?,message?,cv?) → { ok, mailed }
- POST /api/arcade/lead { nickname, email, phone, score, game, stage?, distance?, platform? }

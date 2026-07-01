# HUB3 Lab — Site (PRD)

## Original problem statement
HUB3 PixelLab: site institucional/portfolio + arcade + IA + loja + carreiras.
Stack: **Next.js 15 App Router** (unified, sem backend separado), Tailwind, Framer Motion, Sanity CMS (leaderboard), Canvas 2D.

## Personas
- Visitante / prospect que quer conhecer a holding, ver portfolio, iniciar conversa
- Jogador que compete no fliperama
- Candidato que quer trabalhar na HUB3
- Time HUB3 que recebe leads, ideias e candidaturas por e-mail (Resend, quando setado)

## Core requirements (rodando)
1. Home Candy Crush style, Nav gated com "Sistema Bloqueado" até unlock
2. `/equipe` `/holding` `/portfolio` — páginas institucionais
3. `/fliperama` — 7 cabines de canvas games com leaderboard global (Sanity)
   - Cyber Galaga, Memory Sequence, Cripto Snake, Pac3Lab, Hub3tris, **HUB3DURO** (Enduro), **HUB3RUNNER** (endless runner Web3)
   - Livro de Records global via botão no Nav
   - Filtro de scores por jogo (tabs no modal)
4. `/ia` — HUB3.IA com Gemini (via Emergent LLM proxy)
   - 3 modos: Chat / Gerador de ideias / Explicador
   - Streaming em chat/explain (text/plain), non-stream em idea
   - "Nova ideia" enviada por e-mail para hub3pixellab@gmail.com
5. `/loja` — 3 cards placeholder EM BREVE (Apple, Google, HUB3 Store)
6. `/contato` — 3 tabs:
   - HUB3 Assistant (chat AI) → botões continuar em WhatsApp / e-mail
   - Contato direto (WhatsApp, e-mail, Instagram)
   - Trabalhe conosco (formulário + CV upload) → e-mail "Novo candidato"

## Third-party integrations
- **Emergent LLM Key** (Gemini 2.5 Flash) via `https://integrations.emergentagent.com/llm/v1/chat/completions`
- **Resend** — não configurada. `RESEND_API_KEY` ausente → mailer no-op grácil, APIs retornam `{ok:true, mailed:false}`
- **Sanity CMS** — leaderboard writes (dummy env em dev)

## API endpoints
- `POST /api/ai/chat` — streaming Gemini (modes: chat / ideas / explain via system prompt)
- `POST /api/ai/idea` — non-streaming Gemini + Resend "Nova ideia"
- `POST /api/careers` — multipart FormData + Resend "Novo candidato"
- `POST /api/arcade/lead` — Sanity leaderboard
- `GET /api/arcade/leaderboard` — leaderboard filtrado por `game`

## Env vars (obrigatórias em .env.local)
```
EMERGENT_LLM_KEY=sk-emergent-...
INTEGRATION_PROXY_URL=https://integrations.emergentagent.com
CONTACT_EMAIL=hub3pixellab@gmail.com
CAREERS_EMAIL=hub3pixellab@gmail.com
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
NEXT_PUBLIC_CONTACT_EMAIL=hub3pixellab@gmail.com
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=...
SANITY_WRITE_TOKEN=...
RESEND_API_KEY=re_...     # PENDING - user is creating account
RESEND_FROM=HUB3 <noreply@hub3.com.br>
```

## Changelog

### 2026-02-07 — Sessão atual
- **HUB3RUNNER**: novo endless runner cyberpunk implementado do zero (~800 linhas). 10 stages temáticos (NEON CITY → VOID), 6 tipos de obstáculos (wall/spike/beam/low/tall/step), 5 tokens crypto (₿ Ξ ◎ ✦ ⚡), 4 powerups (shield/magnet/slow/×2), combo system (×1.5/×2/×3), touch + keyboard + d-pad mobile
- **HUB3DURO**: refatorado para modo Enduro puro (removida a lógica runner que estava fundida). 12 dias × 10 fases climáticas
- **/loja**: nova página com 3 placeholders EM BREVE
- **/ia**: nova página com Gemini streaming, 3 modos (Chat / Ideas / Explain), envio de ideias por e-mail
- **/contato**: refeito com 3 tabs (Assistant chat AI + Direct + Careers com upload de CV)
- **Nav**: adicionados links /ia e /loja (PT + EN)
- **lib/llm.js**: helper para Emergent LLM proxy (OpenAI-compatible)
- **lib/mailer.js**: wrapper Resend, no-ops se sem key
- **API routes**: /api/ai/chat (streaming), /api/ai/idea, /api/careers (multipart+attachment)
- Testing agent: 100% backend (9/9), ~95% frontend (todos os fluxos críticos)

### Sessões anteriores
- Hub3tris integrado
- Matchmaker refatorado com UI Tinder swipe
- Livro de Records global no Nav com tabs por jogo
- Pac3Lab: bug de progressão de nível + velocidade + mapa corrigido
- ElevatorAction e Hub3steroids removidos

## Roadmap (P0/P1/P2)

### P0 (bloqueadores)
- [ ] Configurar `RESEND_API_KEY` real e verificar domínio de envio
- [ ] Verificar/atualizar `NEXT_PUBLIC_WHATSAPP_NUMBER` real (hoje é placeholder)

### P1 (próximas features)
- [ ] Trophy Wall / Top 3 ranking na Home
- [ ] Timestamp / data no leaderboard
- [ ] Foto real dos founders na página Equipe
- [ ] Deploy Vercel — validar env vars + rotas API

### P2 (backlog)
- [ ] App mobile (React Native / Expo) usando os canvas games
- [ ] Adição de fotos reais na página Portfolio
- [ ] Otimizações SEO (metadata, OG, JSON-LD)
- [ ] Refactor de PixelMatch (hydration warning + createPattern guard)
- [ ] Marketplace real na HUB3 Store (Web3 drops)

## Known issues (low priority)
- PixelMatch: warning de hydration em `/` (React re-renderiza client-side, funciona ok)
- PixelMatch: erro dev-only `createPattern` quando source canvas ainda tem 0×0
- Hub3duro idle screen: alguns labels de controle podem se sobrepor em telas muito estreitas

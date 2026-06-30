# HUB3 Lab — Site (Next.js + Sanity)

## Iter. 5 — Score progressivo + cadastro obrigatório + 2ª cabine (30 Jun)
- ✅ **PixelMatch nova progressão** (tabela fixa, matematicamente possível):
  - L1: 320 / 20 moves · L2: 640 / 25 · L3: 1280 / 32 · L4: 2520 / 42
  - L5–L25: cresce gradualmente até L25 = 70.000 pts / 175 moves
  - Score **reseta a cada nível** + acumula em `totalScore` para ranking
- ✅ **Cadastro obrigatório (lead)** no fim do Nível 1 do PixelMatch — forma de acesso à plataforma. Após cadastro = **acesso livre** a todos os jogos (sem necessidade de novo form).
- ✅ Novo `RegistrationProvider` (Context + localStorage `hub3_registration_v1`) compartilhado entre todos os jogos.
- ✅ **CyberGalaga** e **MemorySequence** integrados ao `useRegistration`: usuário não registrado → form obrigatório; já registrado → botão "Registrar Score" direto.
- ✅ **Nova cabine `MemorySequence`** (DJ Challenge — Simon Says com 4 drum pads + Web Audio sintetizado: kick/snare/hi-hat/synth) adicionada ao Fliperama.
- ✅ Fliperama com **seletor de cabines** (CyberGalaga / Memory Sequence) + sidebar de Records contextual.
- ✅ Banner "Acesso livre" no header do Fliperama quando o usuário está registrado.
- ✅ Build prod: 10 rotas, OK.

## API ativa
- `POST /api/arcade/lead` — registra/atualiza lead + highscore por nickname (Sanity)
- `GET /api/arcade/leaderboard` — top 10 (revalidate 10s)

## Next Action Items (usuário)
1. **Save to GitHub** novamente — novos arquivos: `RegistrationProvider.js`, `MemorySequence.js`. Modificados: `PixelMatch.js`, `CyberGalaga.js`, `fliperama/page.js`, `providers.js`, `i18n-dict.js`.
2. Vercel rebuilda em ~2 min após push.
3. Confirme `SANITY_WRITE_TOKEN` no Vercel para persistir leads.

## Backlog
- Mais cabines (Tetris, Asteroids)
- Ranking por jogo (atualmente compartilha)
- Foto real dos founders
- Webhook Sanity → revalidação automática

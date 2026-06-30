# HUB3 Lab — Site (Next.js + Sanity)

## Iter. 7 — Records no top nav + Pac3Lab fix + ElevatorAction (30 Jun)
- ✅ **Pac3Lab bug fix (P0)**: RAF chain morria após "LEVEL 1 CLEAR" porque `if (phase !== 'playing') return` ocorria ANTES de `requestAnimationFrame` ser agendado. Movido o RAF pro topo da função frame. Verificado por testing agent: tick counter incrementou +182 em 1.5s após transição L1→L2.
- ✅ **Pac3Lab mais lento**: PAC_SPEED 5→7, GHOST_SPEED 6→8 (frames/move).
- ✅ **Pac3Lab mapa tradicional**: redesenhado 23×21 simétrico com ghost house centrada (rows 9-11 cols 10-12), tunnel no row 10 com wraparound, 4 power pellets nos cantos.
- ✅ **Top Nav: botão RECORDS** — dispara modal global de Livro de Records via custom event `hub3:open-records` (na /fliperama) ou navega para `/fliperama?records=1` (em outras páginas). Funciona em desktop e mobile.
- ✅ **ElevatorAction.js** completo: 8 andares, 3 shafts de elevador, intel tokens nas portas (BTC/ETH/SOL/PEPE/BNB), inimigos com alerta, swipe touch, qualify 500pts → form de lead.
- ✅ **Hub3duro** stub criado (código completo veio truncado — usuário deve reenviar a partir do Header).
- ✅ Build prod OK (`/fliperama` 24.9kB).

## Iter. 6 anterior — Hub3tris + Hub3steroids + Matchmaker Tinder
- Tetris/Asteroids completos, Matchmaker estilo Tinder com botões X/Heart.

## API ativa
- `POST /api/arcade/lead` — registra lead + highscore (Sanity)
- `GET /api/arcade/leaderboard` — top 10 (revalidate 10s)

## Next Action Items (usuário)
1. **Save to GitHub** — modificados: `Pac3Lab.js`, `Nav.js`, `app/fliperama/page.js`. Novos: `ElevatorAction.js`, `Hub3duro.js` (stub).
2. Reenviar código completo do **Hub3duro** (a parte truncada — header em diante) para popular a cabine.
3. Aguarde Vercel rebuild (~2min). Pac-Man passará do level 1 sem congelar.

## Backlog
- Hub3duro código completo
- Ranking por jogo (atualmente compartilhado)
- Foto real dos founders
- Webhook Sanity → revalidação automática
- SFX/música nos jogos novos
- Splitting Pac3Lab.js (724 linhas) em módulos: maze render, ghost AI, particles

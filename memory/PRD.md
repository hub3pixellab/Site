# HUB3 Lab — Site (Next.js + Sanity)

## Iter. 6 — Hub3tris + Hub3steroids + Matchmaker Tinder-style (30 Jun)
- ✅ **Hub3tris** populado: Tetris completo com hold, ghost piece, wall-kicks, combos, line clear flash, partículas, painel lateral (HOLD/NEXT/SCORE/BEST/BLOCKS legend), keyboard (←→↑↓/WASD/Space/C/P) + touch swipe, qualify 500pts → lead form.
- ✅ **Hub3steroids** populado: Asteroids com 3 tiers, tokens cripto (BTC/ETH/SOL/PEPE) dentro de asteroides, saucer inimigo com tiros perseguidores, sistema de waves, bonus life a cada 3 waves, shield power-up, ship debris, controles teclado + touch (tap esq=shield, tap dir=fire, swipe=movimento).
- ✅ **Matchmaker refatorado estilo Tinder**:
  - Cards 3D com gradient color por divisão (House=verde, Pixel=ciano, App=magenta)
  - Ícone hero grande por divisão (Briefcase / Layers / Smartphone)
  - **Botões circulares Tinder** (X magenta / Heart verde) com pulse animation
  - Swipe drag mantido + botões para click programático
  - Badges SOLVE/SKIP rotacionados ao arrastar
  - Painel de divisões com ícones e estado lock/unlock
- ✅ Fliperama com **6 cabines ativas**: CyberGalaga, MemorySequence, CriptoSnake, Pac3Lab, Hub3tris, Hub3steroids.
- ✅ Build prod: 10 rotas, `/fliperama` 24kB, OK.

## Iter. 5 — Score progressivo + cadastro obrigatório (anterior)
- PixelMatch progressivo, RegistrationProvider, CyberGalaga + MemorySequence integrados.

## API ativa
- `POST /api/arcade/lead` — registra lead + highscore por nickname (Sanity)
- `GET /api/arcade/leaderboard` — top 10 (revalidate 10s)
- `GET /api/matchmaker/questions` — perguntas opcionais do Sanity

## Next Action Items (usuário)
1. **Save to GitHub** — modificados: `Hub3tris.js`, `Hub3steroids.js`, `Matchmaker.js`.
2. Aguarde Vercel rebuild (~2min) e teste:
   - `/fliperama` → trocar entre cabines Hub3tris e Hub3steroids
   - `/holding` → swipe nos cards + botões X/Heart Tinder
3. Confirme `SANITY_WRITE_TOKEN` no Vercel.

## Backlog
- Ranking por jogo (atualmente compartilha)
- Foto real dos founders
- Webhook Sanity → revalidação automática
- Música/SFX nos novos jogos

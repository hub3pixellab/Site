# HUB3 Lab — Site (Next.js + Sanity)

## Iter. 8 — Hub3duro completo + Score por jogo + Cleanup (1 Jul)
- ✅ **Hub3duro** populado: modo Enduro (corrida com dia/noite/neve/blizzard, ultrapassagens) + Runner Bonus (endless runner com jump/duck e coleta de cripto BTC/ETH/PEPE). Transição automática Enduro↔Runner ao completar cada dia.
- ✅ **Score separado por jogo (P0)**:
  - Backend: `POST /api/arcade/lead` recebe `game` no body e usa (nickname, game) como chave composta — cada jogo tem seu próprio highscore por nickname.
  - Backend: `GET /api/arcade/leaderboard?game=xxx` filtra por jogo. Sem query = geral.
  - Query nova `topLeadsByGameQuery` + `findLeadByNicknameAndGameQuery` (via `game` field no schema Sanity).
  - Hook: `useArcadeData(game)` aceita parâmetro opcional.
  - Modal: 7 tabs (Geral + Cyber Galaga + Memory + CriptoSnake + Pac3Lab + Hub3tris + Hub3duro).
- ✅ **Removidos**: Hub3steroids (asteroid) e ElevatorAction do arcade + arquivos deletados.
- ✅ Build prod: 6 cabines ativas, /fliperama 24.6kB.

## Iter. 7 anterior — Pac3Lab fix + Records nav + ElevatorAction
- Bug Pac3Lab L1→L2 corrigido (RAF chain).

## API atualizada
- `POST /api/arcade/lead` — Body: `{ nickname, email, phone, score, game }`. Retorna 200 com highscore preservado por (nickname, game).
- `GET /api/arcade/leaderboard[?game=xxx]` — Top 10, filtrável.

## ⚠️ Ação necessária no Sanity (usuário)
Adicionar campo `game` (tipo `string`) no schema `lead` do Sanity Studio. Registros existentes sem esse campo aparecerão apenas na aba GERAL. Novos scores serão salvos com game filtrado.

## Next Action Items (usuário)
1. **Save to GitHub** — modificados: `fliperama/page.js`, `hooks/useArcadeData.js`, `lib/queries.js`, api routes. Novos: `Hub3duro.js` completo. Deletados: `Hub3steroids.js`, `ElevatorAction.js`.
2. **Sanity Studio**: adicionar campo `game` (string) no schema `lead`.
3. Aguarde Vercel rebuild (~2min).

## Backlog
- Ranking com timestamp visível
- Foto real dos founders
- Webhook Sanity → revalidação automática
- SFX/música nos jogos
- Splitting Pac3Lab.js (724 linhas) em módulos

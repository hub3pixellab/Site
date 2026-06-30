# HUB3 Lab — Site (Next.js + Sanity)

## Original Problem Statement
Site corporativo da HUB3 PixelLab com deploy no Vercel + Sanity.

## Iterações
### Iter. 1 — Deploy readiness (29 Jun)
- `.gitignore`, `.env.example`, `vercel.json`, `README.md`, `next.config.js` saneado, `.npmrc` legacy-peer-deps.

### Iter. 2 — Identidade + Equipe + jogo match-3 (29 Jun)
- Paleta do logo aplicada (navy/cyan/laranja)
- Página `/equipe` (Diogo + Bruno)
- `PixelMatch` substitui TerminalNode
- Holding limpa de seção founders
- i18n pt/en

### Iter. 3 — Estrutura no GitHub corrigida (29 Jun)
- Arquivos movidos de `/app/site/*` para `/app/*` (root correto)
- Save to GitHub agora sincroniza com Vercel

### Iter. 4 — Fliperama + 25 níveis + leads + mobile menu (29 Jun)
- ✅ Logo principal **removido** da home
- ✅ `PixelMatch` ampliado para **25 níveis** com progressão (alvo 240→2160, moves 18→54)
- ✅ Logo HUB3 incluído como **7ª peça** do jogo
- ✅ Modal de **vitória/derrota** com captação de lead (POST `/api/arcade/lead`)
- ✅ Modal de **Leaderboard top 10** (GET `/api/arcade/leaderboard`)
- ✅ Menus **mobile**: hamburger com dropdown
- ✅ Nova página `/fliperama` com cabine **CyberGalaga** (shoot'em up)
- ✅ Sidebar de **Livro de Records** no fliperama
- ✅ **Footer** com `© 2026 HUB3 PIXEL LAB` + Instagram `@hub3pixellab`
- ✅ Página `/contato`: botões Instagram + email
- ✅ Skills da equipe re-atribuídas:
  - **Diogo Zachi**: REGEN/Liderança Regenerativa + **Smart Contracts** + **Tokenomics** + MBA + Produtor Musical
  - **Bruno Xavier**: Computação Gráfica + **Artes Gráficas** + **Controle de Planilhas** + **Relatórios Inteligentes** + Auditoria Financeira
- ✅ Build prod: 10 rotas estáticas/edge, OK

## Environment Variables (Vercel)
- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_WRITE_TOKEN`, `CORS_ORIGINS` (opcional)

## APIs ativas
- `POST /api/arcade/lead` — captura lead + atualiza highscore por nickname (Sanity)
- `GET /api/arcade/leaderboard` — top 10 (revalidate 10s)
- `GET /api/matchmaker/questions` — perguntas Sanity

## Next Action Items (usuário)
1. **Save to GitHub** novamente
2. Aguardar Vercel rebuildar (~2-3 min)
3. Confirmar Sanity vars no Vercel
4. Testar fliperama e leaderboard

## Backlog
- Mais cabines no fliperama (Tetris, Asteroids)
- Foto real dos founders
- Som no PixelMatch via AudioEngine
- Ranking por jogo (atualmente compartilha o mesmo leaderboard global)

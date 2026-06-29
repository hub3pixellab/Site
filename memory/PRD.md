# HUB3 Lab — Site (Next.js + Sanity)

## Original Problem Statement
Analisar o repositório `hub3pixellab/Site` e corrigir o que falta para deploy no Vercel + Sanity.
**Iteração 2:** Criar página `/equipe` (Diogo Zachi + Bruno Xavier), remover seção de fundadores do Matchmaker (holding), substituir o jogo da home por match-3 estilo Candy Crush, aplicar paleta do logo (navy + cyan + laranja), incluir o logo na home.

## Architecture
- **Framework:** Next.js 15.5.16 (App Router)
- **CMS:** Sanity v3 (Studio embarcado em `/studio`)
- **Runtime:** Edge (API routes)
- **Deploy target:** Vercel
- **Code location:** `/app/site`

## What's been implemented

### Iter. 1 — Deploy readiness (29 Jun 2025)
- ✅ `.gitignore`, `.env.example`, `vercel.json`, `README.md`
- ✅ `next.config.js` saneado para Vercel
- ✅ Build de produção validado

### Iter. 2 — Identidade + Equipe + Novo jogo (29 Jun 2025)
- ✅ **Paleta do logo** aplicada: navy `#06121F`, cyan `#22E0F5`, laranja `#FF9416` (tailwind + globals.css)
- ✅ **Logo** adicionado: `/public/logo-hub3.jpg` (renderizado na home + miniatura no nav)
- ✅ **Jogo match-3 PixelMatch** (`components/games/PixelMatch.js`): 6x6, swap por clique adjacente, cascata, 6 ícones tech, score 240 desbloqueia o hub. Substitui o `TerminalNode` na home.
- ✅ **Página `/equipe`** com cards dos 2 fundadores (Diogo Zachi + Bruno Xavier), quotes, bios completas, tags coloridas por accent.
- ✅ **Holding limpa**: removida seção de fundadores; link "Conheça os fundadores" → `/equipe`.
- ✅ **Nav atualizado**: logo + link "Equipe" entre Home e Holding.
- ✅ **i18n**: novos strings pt/en (`equipe.*`, `home.team`, `home.boot/instruction` atualizados).
- ✅ Build prod ✓ — 9 rotas geradas, incl. `/equipe`.
- ✅ Smoke tests: `/`, `/equipe`, `/holding` → 200.
- ✅ Visual validado por screenshot.

## Environment Variables (Vercel)
- `NEXT_PUBLIC_SANITY_PROJECT_ID` · `NEXT_PUBLIC_SANITY_DATASET=production`
- `NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01` · `SANITY_WRITE_TOKEN`
- `CORS_ORIGINS` (opcional)

## Next Action Items (usuário)
1. **Save to GitHub** para enviar 8 arquivos modificados + 7 novos
2. Adicionar fotos reais dos fundadores em `/public/team/diogo.jpg` e `/public/team/bruno.jpg` e setar `avatar` em `lib/content.js`
3. Deploy no Vercel (instruções no README.md)

## Backlog
- Foto real dos fundadores
- Adicionar mais membros do time (já tem estrutura pronta em `team`)
- Hover/tilt 3D nos cards de equipe
- Sound effects no PixelMatch (já existe AudioEngine)
- Botão "Share score" no fim do jogo match-3
- Resolver peer-deps `next-sanity@10 ↔ sanity@3`
- Remover dep `mongodb` (não usada)
- Otimizar bundle do `/studio` (1.55 MB)

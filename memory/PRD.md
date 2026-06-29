# HUB3 Lab — Site (Next.js + Sanity)

## Original Problem Statement
Analisar o repositório https://github.com/hub3pixellab/Site e corrigir o que falta para fazer deploy no Vercel.
Usuário escolheu: clonar e configurar no melhor ambiente possível com **Vercel + Sanity**.

## Architecture
- **Framework:** Next.js 15.5.16 (App Router)
- **CMS:** Sanity v3 (Studio embarcado em `/studio`)
- **Runtime:** Edge (API routes)
- **Deploy target:** Vercel
- **Localização do código clonado:** `/app/site`

## What's been implemented (29 Jun 2025)
- ✅ Adicionado `.gitignore` (Next.js + Vercel + Sanity)
- ✅ Adicionado `.env.example` com todas as vars do Sanity
- ✅ Adicionado `vercel.json` (preset Next.js, região `gru1`)
- ✅ Adicionado `README.md` com passo-a-passo de deploy
- ✅ Refatorado `next.config.js`:
  - Removido `output: 'standalone'` (não recomendado no Vercel)
  - Removido `serverExternalPackages: ['mongodb']` (mongo não é usado)
  - Removido `webpack.watchOptions` dev-only (não impacta Vercel)
  - Adicionado `cdn.sanity.io` em `remotePatterns` para `next/image`
- ✅ Build de produção validado: `yarn build` → ✓
- ✅ Smoke test: `GET /api/arcade/leaderboard` → 200 OK

## Environment Variables (set in Vercel)
- `NEXT_PUBLIC_SANITY_PROJECT_ID` (obrigatória)
- `NEXT_PUBLIC_SANITY_DATASET` (obrigatória — `production`)
- `NEXT_PUBLIC_SANITY_API_VERSION` (obrigatória — `2024-01-01`)
- `SANITY_WRITE_TOKEN` (obrigatória para `POST /api/arcade/lead`)
- `CORS_ORIGINS` (opcional)

## Next Action Items (usuário)
1. Push das alterações para `hub3pixellab/Site` (5 arquivos novos + `next.config.js` editado)
2. Em <https://www.sanity.io/manage>: criar projeto e gerar token (Editor)
3. Em <https://vercel.com/new>: importar o repo, setar as env vars listadas acima, Deploy
4. Adicionar a URL `https://<seu-dominio>.vercel.app` em **Sanity → API → CORS Origins**
5. (Opcional) Rodar `node scripts/seed-sanity.mjs` para popular dataset

## Backlog (futuro)
- Resolver mismatch de peer-deps (`next-sanity@10` ↔ `sanity@3`) — funciona, mas pode subir para `sanity@^4`
- Remover dep `mongodb` do `package.json` (não usada) para reduzir tempo de install
- Otimizar bundle do `/studio` (1.55 MB) — code-splitting ou lazy mount
- CI: GitHub Action de `next build` em pull requests

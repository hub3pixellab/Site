# HUB3 LAB — Corporate Portal

Portal corporativo gamificado da HUB3 Lab (House Lab · PixelLab · AppLab).
Construído com **Next.js 15 (App Router)** + **Sanity v3 CMS** + **Tailwind CSS**.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Edge Runtime nas APIs)
- **CMS:** Sanity v3 (Studio embarcado em `/studio`)
- **UI:** Tailwind CSS, Radix UI, Framer Motion
- **Tipografia:** Space Grotesk, Orbitron, JetBrains Mono
- **Deploy:** Vercel

## Desenvolvimento Local

```bash
# 1. Instalar dependências
yarn install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha os valores do Sanity em .env.local

# 3. Rodar em dev
yarn dev
# → http://localhost:3000

# 4. Acessar o Studio
# → http://localhost:3000/studio
```

## Deploy no Vercel

### 1. Pré-requisitos

- Conta Vercel: <https://vercel.com>
- Projeto Sanity criado: <https://www.sanity.io/manage>
- Repositório GitHub conectado ao Vercel

### 2. Configurar Sanity

1. Crie um projeto em <https://www.sanity.io/manage>
2. Em **API → CORS Origins**, adicione:
   - `http://localhost:3000`
   - `https://<seu-dominio>.vercel.app`
   - `https://<seu-dominio-custom>` (se houver)
3. Em **API → Tokens**, crie um token com permissão **Editor** (ou Write). Copie o valor.

### 3. Importar no Vercel

1. <https://vercel.com/new> → importe este repositório
2. **Framework Preset:** Next.js (auto-detectado)
3. **Build Command:** `next build` (padrão)
4. **Install Command:** `yarn install`
5. **Root Directory:** `./`

### 4. Variáveis de ambiente no Vercel

Em **Project Settings → Environment Variables**, adicione (em `Production`, `Preview`, `Development`):

| Variável | Valor | Obrigatória |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | ID do seu projeto Sanity | ✅ |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` | ✅ |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-01-01` | ✅ |
| `SANITY_WRITE_TOKEN` | Token criado no passo 2.3 | ✅ |
| `CORS_ORIGINS` | `https://seu-dominio.com` | ⚪ opcional |

### 5. Deploy

Clique em **Deploy**. O Vercel detecta Next.js automaticamente.

### 6. (Opcional) Seed do Sanity

```bash
# Preencha o dataset com dados iniciais (matchmaker, projetos, etc)
node scripts/seed-sanity.mjs
```

## Estrutura do Projeto

```
app/
  ├── api/              # API Routes (Edge)
  │   ├── arcade/       # Leaderboard + lead capture
  │   └── matchmaker/   # Perguntas
  ├── contato/          # Página de contato
  ├── holding/          # Página institucional
  ├── portfolio/        # Portfólio
  ├── studio/           # Sanity Studio (/studio)
  ├── layout.js
  └── page.js           # Home (terminal interativo)
components/
  ├── audio/            # Engine de áudio + mini player
  ├── effects/          # PixelExplosion, MatrixRain
  ├── games/            # TerminalNode, Matchmaker, etc
  ├── i18n/             # Provider pt-BR / en
  ├── layout/           # Nav, UnlockProvider
  └── ui/               # Radix UI primitives (shadcn-style)
lib/
  ├── sanity.client.js  # Read/Write clients
  └── queries.js        # GROQ queries
sanity/
  └── schemas/          # lead, matchmaker, project
```

## APIs

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/arcade/lead` | POST | Cria/atualiza lead (mantém highscore por nickname) |
| `/api/arcade/leaderboard` | GET | Top 10 leaderboard |
| `/api/matchmaker/questions` | GET | Lista perguntas do matchmaker |

## Modo "Sanity desligado"

Se `NEXT_PUBLIC_SANITY_PROJECT_ID` não estiver configurado, as APIs retornam
`{ ok: true, configured: false, ... }` sem persistir — útil para preview/dev.

## Licença

Proprietário — HUB3 Lab © 2026

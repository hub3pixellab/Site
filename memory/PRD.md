# HUB3 Lab — Site (PRD)

## Original problem statement
HUB3 PixelLab: site institucional/portfolio + arcade + IA + loja + carreiras + whitepaper gated. Stack: **Next.js 15 App Router**, Tailwind, Framer Motion, Sanity CMS, Canvas 2D, Emergent LLM (Gemini).

## Personas
- Visitante/prospect explorando serviços e portfolio
- Jogador do fliperama (competitivo/casual)
- Candidato via /contato → Trabalhe Conosco
- Lead qualificado via /ia → e-mail
- Investidor/parceiro lê o Whitepaper (gated pelo jogo Sincronizador)

## Páginas ativas
| Rota | Descrição | Status |
|---|---|---|
| `/` | Home Candy Crush + gate | ✅ |
| `/equipe` `/holding` `/portfolio` | Institucional | ✅ |
| `/fliperama` | 8 canvas games + leaderboard global | ✅ |
| `/ia` | HUB3.IA Gemini streaming (3 modos) | ✅ |
| `/loja` | 3 placeholders EM BREVE | ✅ |
| `/contato` | 3 tabs: Chat AI, Direto, Carreiras | ✅ |
| `/whitepaper` | Gated via localStorage — desbloqueia jogando Sincronizador | ✅ |

## Jogos do Fliperama (8)
1. Cyber Galaga (Shoot 'em Up)
2. Memory Sequence (DJ Challenge)
3. Cripto Snake (Web3 Collector)
4. Pac3Lab (Maze Runner)
5. Hub3tris (Block Builder)
6. **HUB3DURO** (Enduro Race, 12 dias / 10 fases climáticas)
7. **HUB3RUNNER** (Web3 Endless Runner, 10 stages, tokens ₿ Ξ ◎ ✦ ⚡)
8. **SINCRONIZADOR** (Network Match-3 6×6, 25 moves, desbloqueia Whitepaper)

## Third-party integrations
- **Emergent LLM Key** (Gemini 2.5 Flash) — chat streaming em /ia e /contato ✅
- **Resend** — envio real de e-mails ativado ✅ (API key: `re_C8fudqwb_6HxbTxaza2SG7rkd83yUQyWA`)
- **Sanity CMS** — leaderboard global + schema `whitepaper` para PDF gerenciável via Studio (dummy env em dev — pending real project ID)
- **Wallets Web3 salvos** — para próxima fase (Store):
  - EVM (Ethereum/BNB/Polygon/Arbitrum/Optimism/Linea): `0xeB60e2a71e266d0541Dc6DEdAC0f9a537611A0bc`
  - Bitcoin: `bc1qf6ufjvdqkdy7chwse7a2cwyekfh4wak0sql6qc`
  - Solana: `616Cf24b9nzBhS68xEG4nSxBzhUtts7YY3bDz4W89Xnw`
  - Tron: `THfz3Hv6CjUJhPoEBUkvgexAuXdLSujwzj`
- **WhatsApp**: `+55 11 96643-8164` — link wa.me ativo

## API endpoints
- `POST /api/ai/chat` — streaming Gemini (modes: chat/ideas/explain)
- `POST /api/ai/idea` — non-streaming Gemini + Resend "Nova ideia"
- `POST /api/careers` — multipart FormData + Resend "Novo candidato"
- `POST /api/arcade/lead` — Sanity leaderboard (com campo `game`)
- `GET /api/arcade/leaderboard` — leaderboard filtrado por `game`

## Env vars (.env.local)
```
EMERGENT_LLM_KEY=sk-emergent-4AdCcA90dB48c23A66
INTEGRATION_PROXY_URL=https://integrations.emergentagent.com
CONTACT_EMAIL=hub3pixellab@gmail.com
CAREERS_EMAIL=hub3pixellab@gmail.com
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
NEXT_PUBLIC_CONTACT_EMAIL=hub3pixellab@gmail.com
NEXT_PUBLIC_SANITY_PROJECT_ID=dummy
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_WRITE_TOKEN=dummy
HUB3_WALLET_EVM=0xeB60e2a71e266d0541Dc6DEdAC0f9a537611A0bc
HUB3_WALLET_BITCOIN=bc1qf6ufjvdqkdy7chwse7a2cwyekfh4wak0sql6qc
HUB3_WALLET_SOLANA=616Cf24b9nzBhS68xEG4nSxBzhUtts7YY3bDz4W89Xnw
HUB3_WALLET_TRON=THfz3Hv6CjUJhPoEBUkvgexAuXdLSujwzj
NEXT_PUBLIC_HUB3_WALLET_*=(mirror pra frontend)
RESEND_API_KEY=re_...     # PENDING - user criando conta
```

## Changelog

### 2026-02-07 (Iter 5) — HUB3 Store Web3 multi-chain 🏪
- **`/loja` refeita como Store Web3 completa** com wallet connect + cart + checkout
- **7 chains suportadas** (testnet mode default): Ethereum Sepolia, Polygon Amoy, Arbitrum Sepolia, Optimism Sepolia, Linea Sepolia, BNB Testnet, Solana Devnet
- **Wallets**: MetaMask (EVM) + Phantom (Solana) nativos (sem dependências extras). WalletConnect/Coinbase marcados "em breve"
- **Sanity schema `product`** com priceByChain (7 redes) + category (software/hardware/nft/services) + priceUSD + stock + badge
- **API `/api/store/products`**: retorna produtos do Sanity ou fallback com 6 seeds fictícios (Design System Audit, UX Consulting, HUB3 Setup Pack, Neon Wallpaper Pack, HUB3 Sticker Pack, Web3 Onboarding Workshop)
- **API `/api/store/order`**: registra pedido no console + envia e-mail via Resend (mailed:true confirmado) com hash + link do explorer
- **Cart persistente** via localStorage, event listener `hub3:cart-changed` para sync entre tabs
- **Checkout flow**: assinar na wallet → hash retornado → e-mail para HUB3 + comprovante ao buyer (opcional) → modal de sucesso com link do explorer
- **Chain switching em tempo real**: dropdown atualiza preços em todos os cards + carrinho + botão de pagamento
- **Wallets Web3 salvas**: EVM (Sepolia/Amoy/etc) + Solana Devnet · Bitcoin/Tron salvos em env para uso futuro
- **`@solana/web3.js`** instalado como dependência real (era dynamic import)
- Testing agent 100% backend + 100% frontend, zero bugs críticos
- **Sanity schema `whitepaper`**: singleton document com campos title/version/pdf(file)/coverImage/published/updatedAt — visível no Studio como "📄 Whitepaper"
- **API `/api/whitepaper`**: rota Node.js que busca o whitepaper publicado mais recente do Sanity, constrói URL do CDN (`cdn.sanity.io/files/...`), aceita `?json=1` (retorna metadata) ou redirect direto para download
- **Botão "Baixar .PDF"** na página `/whitepaper` agora consulta a API — se Sanity não configurado retorna 503 gracioso, se ok abre o PDF em nova aba
- **Resend LIVE** — `RESEND_API_KEY` real setada. E-mails de careers e ideas agora chegam de verdade em hub3pixellab@gmail.com (`mailed:true` confirmado em curl)
- **WhatsApp real** `+55 11 96643-8164` — link wa.me ativo em /contato e no chat AI
- `isSanityConfigured` melhorado para filtrar valores dummy/placeholder

### 2026-02-07 (Iter 3) — Sincronizador + Whitepaper
- **/fliperama**: adicionada 8ª cabine **SINCRONIZADOR** (Network Match-3 6×6, 25 moves, 6 tipos de nós ⚡ 🔌 🌐 🔋 💾 📡, cascatas com combo multiplicador, animações de swap+queda)
- **/whitepaper**: nova página com conteúdo institucional completo (10+ seções + tabela KPIs 2026)
  - Estado LOCKED: mostra CTA para jogar Sincronizador
  - Estado UNLOCKED (via localStorage `hub3.whitepaper.unlocked`): mostra whitepaper completo + botões Imprimir e Baixar PDF
- **Nav**: link Whitepaper com ícone Lock (dimmed) quando bloqueado, FileText (normal) após desbloqueio; listener em evento custom `hub3:whitepaper-unlocked`
- **Wallets Web3**: endereços reais salvos em env para uso futuro no Store multi-chain
- Testing agent 100% backend + 100% frontend, zero issues

### 2026-02-07 (Iter 2) — Games + IA + Contato
- HUB3RUNNER novo (~800 linhas, 10 stages, 6 obstáculos, 5 tokens, 4 powerups)
- HUB3DURO refatorado como Enduro puro
- /loja com 3 placeholders EM BREVE
- /ia com Gemini streaming (3 modos)
- /contato com 3 tabs (Chat AI + Direct + Careers com upload de CV)
- APIs: /api/ai/chat, /api/ai/idea, /api/careers
- Testing: 100% backend, 95% frontend

### Sessões anteriores
- Hub3tris, Matchmaker Tinder-style, Livro de Records global, filtro por game, Pac3Lab bug fix

## Roadmap (P0/P1/P2)

### P0 (blockers do próximo passo)
- [ ] **Sanity Studio deploy** — usuário precisa configurar `NEXT_PUBLIC_SANITY_PROJECT_ID` real + subir o primeiro PDF do Whitepaper via `/studio` para que o botão "Baixar .PDF" funcione

### P1 (próxima rodada — sugerido: Store Web3)
- [ ] **HUB3 Store multi-chain** — implementar carrinho + MetaMask/Phantom/Coinbase/WalletConnect connectors + transações em testnet (Sepolia, Solana Devnet, BNB Testnet, Polygon Mumbai)
- [ ] Schema Sanity `produto` com `priceByChain` + seed inicial fictício (6-8 items)
- [ ] Detectar wallet instalada + seletor de rede no header da /loja
- [ ] Bloco de histórico de transações no localStorage
- [ ] Link para block explorer por rede

### P2 (backlog)
- [ ] Whitepaper.pdf real (hoje é HTML print-friendly)
- [ ] Trophy Wall / Top 3 na Home
- [ ] Timestamp/data no leaderboard
- [ ] Foto real dos founders (Diogo + Bruno + members)
- [ ] Rodapé global padronizado com 4 colunas (EMPRESA/PRODUTOS/WEB3/SUPORTE) + modais Missão/Visão/Valores
- [ ] Emergent Auth para admin-only dashboards
- [ ] App mobile React Native/Expo
- [ ] SEO metadata + OG images
- [ ] Token utility HUB3 opcional (governance + descontos)

## Known issues (low priority)
- PixelMatch: warning de hydration em `/` (React re-renderiza client-side, funciona ok)
- PixelMatch: erro dev-only `createPattern` quando source canvas 0×0
- Whitepaper PDF: hoje é HTML+print (`/whitepaper.pdf` retorna 404 se clicado). Substituir por PDF real quando disponível

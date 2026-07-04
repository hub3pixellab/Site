'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Download, Sparkles, FileText, Gamepad2, ChevronRight, Printer } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';

// ─── Whitepaper content ─────────────────────────────────────────────
const SECTIONS = [
  {
    title: 'Sumário Executivo',
    body: `HUB3 é uma holding brasileira de tecnologia, design e Web3 estruturada em 3 labs verticais: Design (branding, UI/UX, design systems), Tech (Web, Web3, mobile) e Labs (jogos, R&D, experimentos criativos). Nossa missão é transformar como empresas atraem, engajam e convertem clientes através da gamificação de dados e ecossistemas descentralizados.`,
  },
  {
    title: 'Visão dos Fundadores',
    body: `Diogo Zachi (Founder & Mastermind) e Bruno Xavier (Co-founder & Head de Engenharia) uniram uma década de experiência em infraestrutura tech, VoIP, computação gráfica e produtos digitais para criar um ecossistema onde a diversão é o vetor de aquisição. Cada jogo do fliperama é um "brief comercial" — uma amostra da nossa capacidade técnica que também qualifica leads.`,
  },
  {
    title: 'Ecossistema HUB3',
    body: `Três pilares interconectados: (1) HUB3 Arcade — fliperama com 8+ jogos originais em Canvas 2D, cada um projetado para reter, encantar e capturar leads qualificados; (2) HUB3 Matchmaker — plataforma que conecta talentos criativos a projetos; (3) HUB3 Projects — casos reais entregues para clientes B2B, Web3 e SaaS.`,
  },
  {
    title: 'Arquitetura Técnica',
    body: `Stack: Next.js 15 (App Router) na Edge Runtime da Vercel, Sanity CMS headless para conteúdo dinâmico, integrações Web3 (Ethereum, Solana, BNB, Polygon, Arbitrum, Linea, Tron, Bitcoin), Emergent LLM (Gemini) para o HUB3 Assistant. Performance-first: TTFB < 200ms, Lighthouse 95+, mobile-first responsivo.`,
  },
  {
    title: 'Fliperama App (Freemium + Premium)',
    body: `Roadmap para app mobile nativo (React Native/Expo) trazendo os canvas games para iOS/Android. Modelo freemium: acesso gratuito aos jogos + leaderboard global; premium libera skins exclusivas, boosters, drops NFT trimestrais e acesso antecipado a novos jogos. Monetização via assinatura ($4.99/mês) + micropagamentos on-chain.`,
  },
  {
    title: 'HUB3 Store Web3',
    body: `Marketplace descentralizado multi-chain aceitando ETH, SOL, BNB, MATIC, ARB, LINEA, BTC e TRX. Produtos: serviços (design system, UX audit, Web3 consulting), hardware curado (setup criativo), NFTs de arte generativa exclusiva, software próprio (plugins, snippets, componentes). Preços dinâmicos por rede via oráculo de câmbio (CoinGecko).`,
  },
  {
    title: 'Estratégia de Aquisição',
    body: `Funil por camadas: (1) Descoberta orgânica via SEO + jogos virais nas redes; (2) Engajamento no fliperama gera dados comportamentais (tempo médio, jogos favoritos, retorno); (3) Qualificação via HUB3.IA (chat Gemini) que roteia leads para WhatsApp/e-mail; (4) Conversão via Store Web3 ou proposta comercial direta.`,
  },
  {
    title: 'KPIs Prioritários',
    body: `MAU (Monthly Active Users), taxa de retorno D7, ARPU (Average Revenue Per User), CAC blended, LTV/CAC ratio (meta ≥ 3), Net Promoter Score. Metas Q4 2026: 50k MAU no fliperama web, 5k downloads no app mobile, 10% de conversão jogador → lead qualificado, ticket médio de R$ 8k em serviços B2B.`,
  },
  {
    title: 'Roadmap 2026',
    body: `Q1: Store Web3 multi-chain live · Q2: App mobile em beta fechada · Q3: Programa de creators (parceria com devs indie para publicar jogos no fliperama) · Q4: Token utility HUB3 opcional (governance + descontos na Store).`,
  },
  {
    title: 'Conclusão',
    body: `HUB3 não é uma agência tradicional nem uma plataforma Web3 genérica. É uma holding onde design, tecnologia e diversão se entrelaçam para criar um ativo comercial vivo — um produto que se autoafirma, se autoqualifica e se autopropaganda. O Sincronizador que você acabou de jogar é a nossa metáfora: coisas isoladas viram valor quando você as sincroniza.`,
  },
];

const P_STYLE = 'text-base md:text-[15px] leading-[1.85] text-foreground/80 tracking-[0.005em]';

export default function WhitepaperPage() {
  const [unlocked, setUnlocked] = useState(null); // null while loading

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = localStorage.getItem('hub3.whitepaper.unlocked') === '1';
    setUnlocked(u);
    const listener = () => setUnlocked(true);
    window.addEventListener('hub3:whitepaper-unlocked', listener);
    return () => window.removeEventListener('hub3:whitepaper-unlocked', listener);
  }, []);

  if (unlocked === null) {
    return (
      <GameContainer>
        <div className="max-w-3xl mx-auto py-24 text-center font-mono text-xs tracking-widest text-foreground/40">
          CARREGANDO...
        </div>
      </GameContainer>
    );
  }

  if (!unlocked) {
    return (
      <GameContainer>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass rounded-2xl border border-magenta/30 p-8 md:p-12 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,0,122,0.12), transparent 60%)' }}
            />
            <div className="relative">
              <Lock className="w-14 h-14 text-magenta mx-auto mb-6" style={{filter: 'drop-shadow(0 0 12px #FF007A88)'}} data-testid="wp-locked-icon" />
              <p className="font-mono text-[11px] tracking-[0.3em] text-magenta mb-2">HUB3 · WHITEPAPER</p>
              <h1 className="font-display text-3xl md:text-4xl gradient-text mb-4" data-testid="whitepaper-locked-title">
                Conteúdo Bloqueado
              </h1>
              <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-8">
                Para desbloquear o Whitepaper HUB3 e ter acesso à visão completa do ecossistema,
                jogue uma partida do <strong className="text-primary">Sincronizador</strong> no fliperama.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/fliperama"
                  data-testid="wp-play-cta"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md font-mono text-xs tracking-widest bg-primary/15 border border-primary text-primary hover:bg-primary/25 hover:shadow-neon-primary transition-all"
                  style={{ borderColor: '#667eea', color: '#667eea', boxShadow: '0 0 12px #667eea33' }}
                >
                  <Gamepad2 className="w-4 h-4" /> JOGAR SINCRONIZADOR <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md font-mono text-xs tracking-widest text-foreground/60 border border-white/10 hover:border-white/30 hover:text-foreground/80 transition-all"
                >
                  VOLTAR PARA HOME
                </Link>
              </div>

              <div className="mt-10 pt-6 border-t border-white/10">
                <p className="font-mono text-[10px] tracking-widest text-foreground/40 leading-loose">
                  DICA: BASTA COMPLETAR OS 25 MOVIMENTOS · SEM PONTUAÇÃO MÍNIMA
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </GameContainer>
    );
  }

  // Unlocked — show whitepaper content
  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-mono text-xs tracking-[0.3em] text-primary mb-2" style={{color:'#667eea'}}>
            <Sparkles className="inline w-3 h-3 mr-1" /> HUB3 · WHITEPAPER
          </p>
          <h1 className="font-display text-4xl md:text-6xl gradient-text mb-4" data-testid="whitepaper-title">
            HUB3 Lab
          </h1>
          <p className="font-mono text-xs md:text-sm text-cyanElectric tracking-widest">
            <FileText className="inline w-3.5 h-3.5 mr-1" />
            V1.0 · 2026 · CONFIDENTIAL DOCUMENTATION
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => window.print()}
              data-testid="wp-print"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs tracking-widest border transition-all"
              style={{ borderColor: '#667eea88', color: '#667eea', background: 'rgba(102,126,234,0.06)' }}
            >
              <Printer className="w-3.5 h-3.5" /> IMPRIMIR / SALVAR PDF
            </button>
            <a
              href="/whitepaper.pdf"
              download
              data-testid="wp-download"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs tracking-widest border transition-all"
              style={{ borderColor: '#764ba288', color: '#a56cd6', background: 'rgba(118,75,162,0.08)' }}
            >
              <Download className="w-3.5 h-3.5" /> BAIXAR .PDF
            </a>
          </div>
        </div>

        {/* Content sections */}
        <div
          className="glass rounded-2xl p-6 md:p-10 border relative overflow-hidden print:bg-white print:text-black"
          style={{ borderColor: 'rgba(102,126,234,0.35)' }}
          data-testid="whitepaper-content"
        >
          <div
            className="absolute inset-0 pointer-events-none print:hidden"
            style={{ background: 'radial-gradient(circle at 20% 0%, rgba(102,126,234,0.08), transparent 60%)' }}
          />
          <div className="relative space-y-8 md:space-y-10">
            {SECTIONS.map((sec, i) => (
              <section key={sec.title} data-testid={`wp-section-${i}`}>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-mono text-xs tracking-widest" style={{ color: '#667eea' }}>
                    §{String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-display text-xl md:text-2xl text-foreground print:text-black">
                    {sec.title}
                  </h2>
                </div>
                <p className={`${P_STYLE} print:text-black`}>{sec.body}</p>
              </section>
            ))}

            {/* KPIs table */}
            <section data-testid="wp-kpis-table">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono text-xs tracking-widest" style={{ color: '#667eea' }}>§11</span>
                <h2 className="font-display text-xl md:text-2xl text-foreground print:text-black">
                  Tabela de KPIs · Metas 2026
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse font-mono">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'rgba(102,126,234,0.35)' }}>
                      <th className="text-left py-2 px-3 tracking-widest text-[11px]" style={{ color: '#667eea' }}>MÉTRICA</th>
                      <th className="text-left py-2 px-3 tracking-widest text-[11px]" style={{ color: '#667eea' }}>Q1</th>
                      <th className="text-left py-2 px-3 tracking-widest text-[11px]" style={{ color: '#667eea' }}>Q2</th>
                      <th className="text-left py-2 px-3 tracking-widest text-[11px]" style={{ color: '#667eea' }}>Q3</th>
                      <th className="text-left py-2 px-3 tracking-widest text-[11px]" style={{ color: '#667eea' }}>Q4</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/80 print:text-black">
                    {[
                      ['MAU (web)',   '5k',  '15k', '30k', '50k'],
                      ['Downloads',   '0',   '500', '2k',  '5k'],
                      ['Leads/mês',   '80',  '200', '500', '1k'],
                      ['ARPU',        'R$0', 'R$4', 'R$8', 'R$12'],
                      ['CAC ratio',   'n/a', '1.8', '2.4', '3.0+'],
                    ].map(([m, ...vals]) => (
                      <tr key={m} className="border-b border-white/5">
                        <td className="py-2 px-3 tracking-wide">{m}</td>
                        {vals.map((v, k) => <td key={k} className="py-2 px-3">{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 mb-4">
          <p className="font-mono text-[10px] tracking-[0.3em] text-foreground/40">
            HUB3 PIXELLAB · WHITEPAPER V1.0 · hub3pixellab@gmail.com
          </p>
        </div>

        {/* Print stylesheet */}
      </motion.div>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
          @media print {
            body { background: white !important; }
            nav, footer, .print\\:hidden { display: none !important; }
          }
        `}</style>
    </GameContainer>
  );
}

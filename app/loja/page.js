'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Smartphone, Store as StoreIcon, Sparkles } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';

const CARDS = [
  {
    id: 'apple',
    title: 'App Store',
    subtitle: 'iOS · iPadOS',
    tag: 'EM BREVE',
    icon: Apple,
    accent: '#00F0FF',
    hint: 'Nosso app oficial estará disponível na Apple App Store.',
  },
  {
    id: 'google',
    title: 'Google Play',
    subtitle: 'Android',
    tag: 'EM BREVE',
    icon: Smartphone,
    accent: '#CCFF00',
    hint: 'Nosso app oficial estará disponível na Google Play Store.',
  },
  {
    id: 'hub3store',
    title: 'HUB3 Store',
    subtitle: 'Loja própria · Web3',
    tag: 'EM BREVE',
    icon: StoreIcon,
    accent: '#FF007A',
    hint: 'Marketplace próprio com wearables digitais, drops NFT e conteúdo exclusivo.',
  },
];

export default function LojaPage() {
  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto text-center mb-8"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-hubOrange mb-2">
          <Sparkles className="inline w-3 h-3 mr-1" /> HUB3 · STORE
        </p>
        <h1 className="font-display text-3xl md:text-5xl gradient-text" data-testid="loja-title">
          Loja HUB3
        </h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric tracking-widest">
          NOSSOS APPS · DROPS · WEARABLES DIGITAIS
        </p>
        <p className="mt-4 text-foreground/70 text-sm md:text-base max-w-xl mx-auto">
          Estamos finalizando as versões finais dos nossos apps e da nossa loja própria.
          Ative o &quot;me avise&quot; abaixo para saber quando cada lançamento acontecer.
        </p>
      </motion.div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" data-testid="loja-grid">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              data-testid={`loja-card-${card.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="glass rounded-2xl p-6 border relative overflow-hidden group"
              style={{ borderColor: `${card.accent}33` }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${card.accent}18, transparent 60%)`,
                }}
              />
              <div className="relative">
                <div
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest mb-4"
                  style={{ background: `${card.accent}12`, color: card.accent, border: `1px solid ${card.accent}44` }}
                >
                  {card.tag}
                </div>
                <Icon
                  className="w-10 h-10 mb-3"
                  style={{ color: card.accent, filter: `drop-shadow(0 0 12px ${card.accent}88)` }}
                />
                <h3 className="font-display text-xl tracking-wide mb-1" style={{ color: card.accent }}>
                  {card.title}
                </h3>
                <p className="font-mono text-[11px] tracking-widest text-foreground/50 mb-3">
                  {card.subtitle}
                </p>
                <p className="text-sm text-foreground/70 leading-relaxed mb-5">{card.hint}</p>

                <button
                  disabled
                  data-testid={`loja-notify-${card.id}`}
                  className="w-full py-2.5 rounded-md font-mono text-xs tracking-widest transition-all opacity-60 cursor-not-allowed"
                  style={{
                    background: `${card.accent}10`,
                    color: card.accent,
                    border: `1px solid ${card.accent}44`,
                  }}
                >
                  ME AVISE QUANDO SAIR
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto mt-12 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-foreground/40">
          HUB3 · V1 STORE LAUNCH · Q2 2026
        </p>
      </div>
    </GameContainer>
  );
}

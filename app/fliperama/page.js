'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Trophy, Cpu, Music, ChevronRight } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';
import CyberGalaga from '@/components/games/CyberGalaga';
import MemorySequence from '@/components/games/MemorySequence';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useArcadeData } from '@/hooks/useArcadeData';
import { useRegistration } from '@/components/layout/RegistrationProvider';

const CABINES = [
  {
    id: 'cybergalaga',
    name: 'CYBER GALAGA',
    tag: "SHOOT'EM UP",
    icon: Cpu,
    accent: '#22E0F5',
    Component: CyberGalaga,
  },
  {
    id: 'memory',
    name: 'MEMORY SEQUENCE',
    tag: 'DJ CHALLENGE',
    icon: Music,
    accent: '#CCFF00',
    Component: MemorySequence,
  },
];

export default function FliperamaPage() {
  const { t } = useI18n();
  const { leaderboard, leaderboardLoading } = useArcadeData();
  const { isRegistered, registration } = useRegistration();
  const [activeId, setActiveId] = useState('cybergalaga');

  const cabine = CABINES.find((c) => c.id === activeId) || CABINES[0];
  const ActiveGame = cabine.Component;

  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center mb-8 relative"
      >
        <div className="absolute inset-0 -z-10 bg-radial-cyan opacity-40 pointer-events-none" />
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 font-mono text-[10px] tracking-widest text-cyanElectric mb-3">
          <Gamepad2 className="h-3 w-3" />
          {t('fliperama.tag')}
        </div>
        <h1 className="font-display text-3xl md:text-5xl gradient-text">{t('fliperama.title')}</h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric/90 tracking-widest">{t('fliperama.subtitle')}</p>
        <p className="mt-3 text-foreground/70 max-w-2xl mx-auto text-sm md:text-base">{t('fliperama.intro')}</p>
        {isRegistered && (
          <div className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] text-acidGreen tracking-widest">
            <ChevronRight className="w-3 h-3" /> ACESSO LIVRE · {registration?.nickname?.toUpperCase()}
          </div>
        )}
      </motion.div>

      {/* Seletor de cabines */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-center gap-2">
        {CABINES.map((c) => (
          <CabineCard
            key={c.id}
            active={activeId === c.id}
            onClick={() => setActiveId(c.id)}
            Icon={c.icon}
            name={c.name}
            tag={c.tag}
            accent={c.accent}
            testId={`cabine-${c.id}`}
          />
        ))}
        <CabineCard
          active={false}
          disabled
          Icon={Gamepad2}
          name="???"
          tag={t('fliperama.soon')}
          accent="#FF9416"
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 max-w-5xl mx-auto">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={cabine.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <ActiveGame leaderboard={leaderboard} />
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="glass rounded-2xl p-4 border border-hubOrange/30 self-start" data-testid="leaderboard-sidebar">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-hubOrange" />
            <h3 className="font-display text-sm text-hubOrange tracking-wider">LIVRO DE RECORDS</h3>
          </div>
          <div className="font-mono text-[9px] tracking-widest text-foreground/40 mb-3">TOP 10 · GERAL</div>

          {leaderboardLoading ? (
            <div className="text-center text-foreground/50 font-mono text-xs py-4">Carregando...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center text-foreground/50 font-mono text-xs py-4">
              Nenhum record ainda.<br />Seja o primeiro a entrar.
            </div>
          ) : (
            <ol className="space-y-1.5">
              {leaderboard.map((entry, idx) => (
                <li
                  key={entry._id || idx}
                  className="flex items-center justify-between bg-white/[0.02] rounded-md px-2.5 py-1.5 font-mono text-xs"
                  data-testid={`fliperama-row-${idx}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-hubOrange font-bold text-[11px]">{idx + 1}.</span>
                    <span className="text-foreground/90 truncate">{entry.nickname}</span>
                  </span>
                  <span className="text-cyanElectric font-bold">{entry.score}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-4 pt-3 border-t border-cyanElectric/10">
            <div className="font-mono text-[10px] text-foreground/55 tracking-wider mb-2 inline-flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-cyanElectric" /> CABINE
            </div>
            <p className="text-[11px] text-foreground/70 leading-relaxed">
              <span style={{ color: cabine.accent }} className="font-bold">{cabine.name}</span>
              <br />
              {cabine.id === 'cybergalaga' && 'Inimigos hexagonais valem 50pts × wave. Sobreviva mais ondas pra subir.'}
              {cabine.id === 'memory' && 'Streak de 3+ rounds dobra os pontos. Cada round adiciona +1 batida.'}
            </p>
          </div>
        </aside>
      </div>
    </GameContainer>
  );
}

function CabineCard({ active, disabled, onClick, Icon, name, tag, accent, testId }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`group inline-flex items-center gap-3 px-4 py-2.5 rounded-lg font-mono text-xs tracking-widest transition-all ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
      }`}
      style={{
        background: active ? `${accent}15` : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${active ? accent : 'rgba(34,224,245,0.15)'}`,
        boxShadow: active ? `0 0 16px ${accent}44` : 'none',
        color: active ? accent : 'rgba(232,244,255,0.7)',
      }}
    >
      <span style={{ color: accent }}><Icon className="w-4 h-4" /></span>
      <span className="flex flex-col items-start">
        <span className="font-display text-sm tracking-wider">{name}</span>
        <span className="text-[9px] opacity-70">{tag}</span>
      </span>
    </button>
  );
}

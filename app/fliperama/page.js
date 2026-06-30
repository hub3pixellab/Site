'use client';
import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Trophy, Cpu, Music, Zap, Ghost, Square, Rocket, Building2, Car, ChevronRight, X } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';
import CyberGalaga from '@/components/games/CyberGalaga';
import MemorySequence from '@/components/games/MemorySequence';
import CriptoSnake from '@/components/games/CriptoSnake';
import Pac3Lab from '@/components/games/Pac3Lab';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useArcadeData } from '@/hooks/useArcadeData';
import { useRegistration } from '@/components/layout/RegistrationProvider';

// Lazy load — só carrega quando o arquivo existir e for selecionado
const Hub3tris = dynamic(() => import('@/components/games/Hub3tris').catch(() => () => <SoonPlaceholder name="HUB3TRIS" />), { ssr: false });
const Hub3steroids = dynamic(() => import('@/components/games/Hub3steroids').catch(() => () => <SoonPlaceholder name="HUB3STEROIDS" />), { ssr: false });
const ElevatorAction = dynamic(() => import('@/components/games/ElevatorAction').catch(() => () => <SoonPlaceholder name="ELEVATOR ACTION" />), { ssr: false });
const Hub3duro = dynamic(() => import('@/components/games/Hub3duro').catch(() => () => <SoonPlaceholder name="HUB3DURO" />), { ssr: false });

function SoonPlaceholder({ name }) {
  return (
    <div className="glass rounded-2xl p-10 text-center border border-cyanElectric/20" style={{ minHeight: 320 }}>
      <Gamepad2 className="w-10 h-10 text-cyanElectric mx-auto mb-3" />
      <h3 className="font-display text-xl text-cyanElectric">{name}</h3>
      <p className="text-foreground/60 text-sm mt-2 font-mono">CABINE EM PREPARAÇÃO · Em breve</p>
    </div>
  );
}

const CABINES = [
  { id: 'cybergalaga', name: 'CYBER GALAGA', tag: "SHOOT'EM UP", icon: Cpu, accent: '#22E0F5', Component: CyberGalaga,
    hint: 'Inimigos hexagonais valem 50pts × wave. Sobreviva mais ondas pra subir.' },
  { id: 'memory', name: 'MEMORY SEQUENCE', tag: 'DJ CHALLENGE', icon: Music, accent: '#CCFF00', Component: MemorySequence,
    hint: 'Streak de 3+ rounds dobra os pontos. Cada round adiciona +1 batida.' },
  { id: 'snake', name: 'CRIPTO SNAKE', tag: 'WEB3 COLLECTOR', icon: Zap, accent: '#FF9416', Component: CriptoSnake,
    hint: 'Colete tokens cripto. Power-up ⚡ dobra pontos. PEPE ✦ = 50pts!' },
  { id: 'pac3lab', name: 'PAC3LAB', tag: 'MAZE RUNNER', icon: Ghost, accent: '#FF007A', Component: Pac3Lab,
    hint: 'Coma todas as pellets fugindo dos 4 fantasmas. Power Pellet = 200pts × combo.' },
  { id: 'hub3tris', name: 'HUB3TRIS', tag: 'BLOCK BUILDER', icon: Square, accent: '#7AEEFF', Component: Hub3tris,
    hint: 'Encaixe os blocos. Linhas múltiplas dão bônus. Hold (C) salva uma peça.' },
  { id: 'hub3steroids', name: 'HUB3STEROIDS', tag: 'ASTEROID FIELD', icon: Rocket, accent: '#FFB347', Component: Hub3steroids,
    hint: 'Atire nos asteroides. Cuidado com o saucer! Vida extra a cada 3 waves.' },
  { id: 'elevator', name: 'ELEVATOR ACTION', tag: 'INTEL RETRIEVAL', icon: Building2, accent: '#9945FF', Component: ElevatorAction,
    hint: 'Suba pelos elevadores, colete os tokens nas portas e elimine os agentes inimigos.' },
  { id: 'hub3duro', name: 'HUB3DURO', tag: 'RACE & RUN', icon: Car, accent: '#FF6B35', Component: Hub3duro,
    hint: 'Corra ultrapassando carros pelo dia/noite/neve. A cada dia, fase runner bonus!' },
];

export default function FliperamaPage() {
  return (
    <React.Suspense fallback={null}>
      <FliperamaInner />
    </React.Suspense>
  );
}

function FliperamaInner() {
  const { t } = useI18n();
  const { leaderboard, leaderboardLoading } = useArcadeData();
  const { isRegistered, registration } = useRegistration();
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = useState('cybergalaga');
  const [recordsOpen, setRecordsOpen] = useState(false);

  // Open records on ?records=1 (from Nav button on other pages)
  useEffect(() => {
    if (searchParams.get('records') === '1') {
      setRecordsOpen(true);
    }
  }, [searchParams]);

  // Listen to global event from Nav button (when already on /fliperama)
  useEffect(() => {
    const handler = () => setRecordsOpen(true);
    window.addEventListener('hub3:open-records', handler);
    return () => window.removeEventListener('hub3:open-records', handler);
  }, []);

  const cabine = useMemo(() => CABINES.find((c) => c.id === activeId) || CABINES[0], [activeId]);
  const ActiveGame = cabine.Component;

  return (
    <GameContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center mb-6 relative"
      >
        <div className="absolute inset-0 -z-10 bg-radial-cyan opacity-40 pointer-events-none" />
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 font-mono text-[10px] tracking-widest text-cyanElectric mb-3">
          <Gamepad2 className="h-3 w-3" />
          {t('fliperama.tag')}
        </div>
        <h1 className="font-display text-3xl md:text-5xl gradient-text">{t('fliperama.title')}</h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric/90 tracking-widest">{t('fliperama.subtitle')}</p>
        {isRegistered && (
          <div className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] text-acidGreen tracking-widest">
            <ChevronRight className="w-3 h-3" /> ACESSO LIVRE · {registration?.nickname?.toUpperCase()}
          </div>
        )}
      </motion.div>

      {/* Barra de cabines (records button moved to top Nav) */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-center" data-testid="cabines-bar">
        <div className="flex flex-wrap items-center gap-2 justify-center">
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
        </div>
      </div>

      {/* Jogo full-width (mesma largura da home) */}
      <div className="max-w-4xl mx-auto">
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

        {/* Cabine info bar */}
        <div className="mt-4 glass rounded-lg p-3 flex items-start gap-3 border" style={{ borderColor: `${cabine.accent}33` }}>
          <div className="font-mono text-[10px] tracking-widest" style={{ color: cabine.accent }}>
            <ChevronRight className="w-3 h-3 inline" /> CABINE ATIVA
          </div>
          <p className="text-[12px] text-foreground/75 leading-relaxed flex-1">
            <span style={{ color: cabine.accent }} className="font-bold">{cabine.name}</span> — {cabine.hint}
          </p>
        </div>
      </div>

      {/* Records modal */}
      <AnimatePresence>
        {recordsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bgDark/85 backdrop-blur-sm"
            onClick={() => setRecordsOpen(false)}
            data-testid="records-modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 max-w-md w-full border border-hubOrange/40 shadow-neon-orange max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-hubOrange" />
                  <h3 className="font-display text-lg text-hubOrange">LIVRO DE RECORDS</h3>
                </div>
                <button onClick={() => setRecordsOpen(false)} className="p-1 rounded-md text-foreground/60 hover:text-cyanElectric">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="font-mono text-[9px] tracking-widest text-foreground/40 mb-3">TOP 10 · GERAL · ATUALIZA A CADA 30s</div>
              {leaderboardLoading ? (
                <div className="text-center text-foreground/50 font-mono text-xs py-8">Carregando...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center text-foreground/50 font-mono text-xs py-8">
                  Nenhum record ainda.<br />Seja o primeiro a entrar no ranking.
                </div>
              ) : (
                <ol className="space-y-1.5">
                  {leaderboard.map((entry, idx) => (
                    <li
                      key={entry._id || idx}
                      className="flex items-center justify-between bg-white/[0.03] rounded-md px-3 py-2 font-mono text-xs"
                      data-testid={`record-row-${idx}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-6 text-hubOrange font-bold">{idx + 1}.</span>
                        <span className="text-foreground/90 truncate">{entry.nickname}</span>
                      </span>
                      <span className="text-cyanElectric font-bold">{entry.score}</span>
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameContainer>
  );
}

function CabineCard({ active, disabled, onClick, Icon, name, tag, accent, testId }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`group inline-flex items-center gap-2.5 px-3 py-2 rounded-lg font-mono text-xs tracking-widest transition-all ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.03]'
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

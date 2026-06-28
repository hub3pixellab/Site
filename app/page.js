'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, ArrowRight, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import TerminalNode from '@/components/games/TerminalNode';
import PixelExplosion from '@/components/effects/PixelExplosion';
import GameContainer from '@/components/ui/GameContainer';
import { useUnlock } from '@/components/layout/UnlockProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useAudio } from '@/components/audio/AudioEngine';

export default function HomePage() {
  const { unlocked, unlock, reset } = useUnlock();
  const { t } = useI18n();
  const { setMuted } = useAudio();
  const [explode, setExplode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(unlocked);

  const handleComplete = () => {
    setExplode(true);
    setShowSuccess(true);
    unlock();
    // libera o som assim que o usuário interage (gesto humano permitido autoplay)
    setMuted(false);
    setTimeout(() => setExplode(false), 1800);
  };

  const restart = () => {
    reset();
    setShowSuccess(false);
  };

  return (
    <GameContainer>
      {explode && <PixelExplosion x={0.5} y={0.5} />}

      <div className="max-w-3xl mx-auto text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 font-mono text-[10px] tracking-widest text-acidGreen mb-4"
        >
          <Power className="h-3 w-3" />
          {t('home.tag')}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-4xl md:text-6xl leading-tight tracking-tight"
        >
          <span className="gradient-text">HUB3 LAB</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 font-mono text-xs md:text-sm text-acidGreen tracking-widest animate-flicker"
        >
          {t('home.boot')}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-4 text-foreground/70 max-w-xl mx-auto"
        >
          {t('home.instruction')}
        </motion.p>
      </div>

      <TerminalNode onComplete={handleComplete} />

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto mt-10 glass rounded-xl p-6 border border-acidGreen/40 shadow-neon-green text-center"
          >
            <div className="font-mono text-xs tracking-widest text-acidGreen mb-3">
              {t('home.success')}
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/holding"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-acidGreen text-bgDark font-mono text-xs hover:shadow-neon-green transition-all"
              >
                {t('home.enter')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={restart}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground/70 font-mono text-xs hover:text-acidGreen hover:border-acidGreen/40"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t('home.restart')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameContainer>
  );
}

'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import PixelMatch from '@/components/games/PixelMatch';
import GameContainer from '@/components/ui/GameContainer';
import { useUnlock } from '@/components/layout/UnlockProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useAudio } from '@/components/audio/AudioEngine';

export default function HomePage() {
  const { unlocked, unlock, reset } = useUnlock();
  const { t } = useI18n();
  const { setMuted } = useAudio();
  const [showSuccess, setShowSuccess] = useState(unlocked);

  const handleComplete = () => {
    setShowSuccess(true);
    unlock();
    setMuted(false);
  };

  const restart = () => {
    reset();
    setShowSuccess(false);
  };

  return (
    <GameContainer>
      {/* HERO com logo */}
      <div className="max-w-4xl mx-auto text-center mb-10 relative">
        <div className="absolute inset-0 -z-10 bg-radial-cyan opacity-60 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex justify-center mb-4"
        >
          <div className="relative w-44 h-44 md:w-56 md:h-56 animate-float-y" data-testid="hub3-logo">
            <Image
              src="/logo-hub3.jpg"
              alt="HUB3 PixelLab"
              fill
              priority
              className="object-contain rounded-2xl"
              style={{ filter: 'drop-shadow(0 0 30px rgba(34,224,245,0.35))' }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 font-mono text-[10px] tracking-widest text-cyanElectric mb-3"
        >
          <Sparkles className="h-3 w-3" />
          {t('home.tag')}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-4xl md:text-6xl leading-tight tracking-tight"
        >
          <span className="gradient-text">HUB3 LAB</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-3 font-mono text-xs md:text-sm text-cyanElectric/90 tracking-widest animate-flicker"
        >
          {t('home.boot')}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-foreground/70 max-w-xl mx-auto"
        >
          {t('home.instruction')}
        </motion.p>
      </div>

      <PixelMatch onComplete={handleComplete} />

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto mt-8 glass rounded-xl p-6 border border-cyanElectric/40 shadow-neon-cyan text-center"
            data-testid="home-success-card"
          >
            <div className="font-mono text-xs tracking-widest text-cyanElectric mb-3">
              {t('home.success')}
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/holding"
                data-testid="enter-hub-btn"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-cyanElectric text-bgDark font-mono text-xs hover:shadow-neon-cyan transition-all"
              >
                {t('home.enter')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/equipe"
                data-testid="meet-team-btn"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-hubOrange/90 text-bgDark font-mono text-xs hover:shadow-neon-orange transition-all"
              >
                {t('home.team')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={restart}
                data-testid="restart-btn"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground/70 font-mono text-xs hover:text-cyanElectric hover:border-cyanElectric/40"
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

'use client';
import React, { useState } from 'react';
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
  const [bannerVisible, setBannerVisible] = useState(unlocked);

  const handleUnlock = () => {
    setBannerVisible(true);
    unlock();
    setMuted(false);
  };

  const handleResetUnlock = () => {
    reset();
    setBannerVisible(false);
  };

  return (
    <GameContainer>
      <div className="max-w-4xl mx-auto text-center mb-8 relative">
        <div className="absolute inset-0 -z-10 bg-radial-cyan opacity-50 pointer-events-none" />

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
          className="mt-3 text-foreground/70 max-w-xl mx-auto text-sm md:text-base"
        >
          {t('home.instruction')}
        </motion.p>
      </div>

      <PixelMatch onUnlock={handleUnlock} />

      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto mt-6 glass rounded-xl p-4 md:p-5 border border-cyanElectric/40 shadow-neon-cyan text-center"
            data-testid="home-unlocked-banner"
          >
            <div className="font-mono text-[10px] md:text-xs tracking-widest text-cyanElectric mb-3">
              {t('home.success')}
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Link
                href="/holding"
                data-testid="enter-hub-btn"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyanElectric text-bgDark font-mono text-xs hover:shadow-neon-cyan"
              >
                {t('home.enter')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/equipe"
                data-testid="meet-team-btn"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-hubOrange/90 text-bgDark font-mono text-xs hover:shadow-neon-orange"
              >
                {t('home.team')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/fliperama"
                data-testid="arcade-btn"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-cyanElectric/40 text-cyanElectric font-mono text-xs hover:bg-cyanElectric/10"
              >
                {t('home.arcade')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={handleResetUnlock}
                data-testid="restart-btn"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-foreground/70 font-mono text-xs hover:text-cyanElectric"
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

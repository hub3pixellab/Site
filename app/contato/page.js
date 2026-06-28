'use client';
import React from 'react';
import { motion } from 'framer-motion';
import GameContainer from '@/components/ui/GameContainer';
import EasterEggCLI from '@/components/games/EasterEggCLI';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function ContatoPage() {
  const { t } = useI18n();
  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto text-center mb-8"
      >
        <h1 className="font-display text-3xl md:text-5xl gradient-text">{t('contato.title')}</h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric tracking-widest">{t('contato.hint')}</p>
      </motion.div>
      <div className="max-w-3xl mx-auto">
        <EasterEggCLI />
      </div>
    </GameContainer>
  );
}

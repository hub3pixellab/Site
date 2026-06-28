'use client';
import React from 'react';
import { motion } from 'framer-motion';
import GameContainer from '@/components/ui/GameContainer';
import BlueprintDecoder from '@/components/games/BlueprintDecoder';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function PortfolioPage() {
  const { t } = useI18n();
  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto text-center mb-8"
      >
        <h1 className="font-display text-3xl md:text-5xl gradient-text">{t('portfolio.title')}</h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric tracking-widest">{t('portfolio.subtitle')}</p>
      </motion.div>
      <BlueprintDecoder />
    </GameContainer>
  );
}

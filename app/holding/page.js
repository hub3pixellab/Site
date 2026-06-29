'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';
import Matchmaker from '@/components/games/Matchmaker';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function HoldingPage() {
  const { t } = useI18n();

  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center mb-10"
      >
        <h1 className="font-display text-3xl md:text-5xl gradient-text">{t('holding.title')}</h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric tracking-widest">{t('holding.subtitle')}</p>

        <Link
          href="/equipe"
          data-testid="holding-team-link"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-hubOrange/40 text-hubOrange font-mono text-xs hover:bg-hubOrange/10 transition-colors"
        >
          <Users className="h-3.5 w-3.5" />
          {t('holding.meetTeam')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>

      <div className="mb-6">
        <div className="font-display text-xl text-cyanElectric">{t('holding.gameTitle')}</div>
        <div className="text-foreground/60 text-sm mt-1">{t('holding.gameDesc')}</div>
      </div>

      <Matchmaker />
    </GameContainer>
  );
}

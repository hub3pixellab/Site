'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Music2, GraduationCap } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';
import Matchmaker from '@/components/games/Matchmaker';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function HoldingPage() {
  const { t, lang } = useI18n();

  const founderTags = [
    { icon: Briefcase, label: lang === 'pt' ? 'Gestão Pública' : 'Public Mgmt' },
    { icon: Users,     label: lang === 'pt' ? 'Pessoas & Times' : 'People & Teams' },
    { icon: GraduationCap, label: lang === 'pt' ? 'MBA Hospitalidade' : 'Hospitality MBA' },
    { icon: Music2,    label: lang === 'pt' ? '10+ anos Música/DJ' : '10+ yrs Music/DJ' },
  ];

  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center mb-10"
      >
        <h1 className="font-display text-3xl md:text-5xl gradient-text">{t('holding.title')}</h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric tracking-widest">{t('holding.subtitle')}</p>
        <p className="mt-6 text-foreground/70 max-w-2xl mx-auto">{t('holding.founders')}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {founderTags.map(({ icon: Icon, label }) => (
            <div key={label} className="inline-flex items-center gap-1.5 glass rounded-full px-3 py-1 font-mono text-[11px] text-foreground/70">
              <Icon className="h-3 w-3 text-acidGreen" />
              {label}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mb-6">
        <div className="font-display text-xl text-acidGreen">{t('holding.gameTitle')}</div>
        <div className="text-foreground/60 text-sm mt-1">{t('holding.gameDesc')}</div>
      </div>

      <Matchmaker />
    </GameContainer>
  );
}

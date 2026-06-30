'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Mail } from 'lucide-react';
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

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <a
            href="https://instagram.com/hub3pixellab"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="contato-instagram"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-hubOrange/40 bg-hubOrange/5 text-hubOrange font-mono text-xs tracking-widest hover:bg-hubOrange/15 hover:shadow-neon-orange transition-all"
          >
            <Instagram className="h-4 w-4" />
            @hub3pixellab
          </a>
          <a
            href="mailto:contato@hub3pixellab.com"
            data-testid="contato-email"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-cyanElectric/40 bg-cyanElectric/5 text-cyanElectric font-mono text-xs tracking-widest hover:bg-cyanElectric/15 hover:shadow-neon-cyan transition-all"
          >
            <Mail className="h-4 w-4" />
            contato@hub3pixellab.com
          </a>
        </div>
      </motion.div>

      <div className="max-w-3xl mx-auto">
        <EasterEggCLI />
      </div>
    </GameContainer>
  );
}

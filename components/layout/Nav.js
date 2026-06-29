'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useUnlock } from '@/components/layout/UnlockProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import LangSwitch from '@/components/i18n/LangSwitch';

export default function Nav() {
  const pathname = usePathname();
  const { unlocked } = useUnlock();
  const { t } = useI18n();

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/equipe', label: t('nav.equipe') },
    { href: '/holding', label: t('nav.holding') },
    { href: '/portfolio', label: t('nav.portfolio') },
    { href: '/contato', label: t('nav.contato') },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 glass rounded-lg px-3 py-2">
        <Link href="/" className="flex items-center gap-2.5 group" data-testid="nav-logo">
          <div className="relative w-8 h-8 rounded-md overflow-hidden border border-cyanElectric/30">
            <Image
              src="/logo-hub3.jpg"
              alt="HUB3 PixelLab"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-display tracking-[0.22em] text-sm">
            <span className="text-foreground">HUB</span>
            <span className="text-cyanElectric">3</span>
            <span className="text-hubOrange ml-1">LAB</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {unlocked ? (
              <motion.nav
                key="nav-unlocked"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="hidden md:flex items-center gap-1 font-mono text-xs"
              >
                {links.map((l) => {
                  const active = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      data-testid={`nav-link-${l.href.replace('/', '') || 'home'}`}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        active
                          ? 'bg-cyanElectric/10 text-cyanElectric shadow-neon-cyan'
                          : 'text-foreground/70 hover:text-cyanElectric hover:bg-cyanElectric/5'
                      }`}
                    >
                      {l.label.toUpperCase()}
                    </Link>
                  );
                })}
              </motion.nav>
            ) : (
              <motion.div
                key="nav-locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden md:flex items-center gap-2 font-mono text-xs text-foreground/40"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="tracking-widest">{t('nav.locked').toUpperCase()}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <LangSwitch />
        </div>
      </div>
    </header>
  );
}

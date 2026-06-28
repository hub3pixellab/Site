'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Cpu } from 'lucide-react';
import { useUnlock } from '@/components/layout/UnlockProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import LangSwitch from '@/components/i18n/LangSwitch';

export default function Nav() {
  const pathname = usePathname();
  const { unlocked } = useUnlock();
  const { t } = useI18n();

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/holding', label: t('nav.holding') },
    { href: '/portfolio', label: t('nav.portfolio') },
    { href: '/contato', label: t('nav.contato') },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 glass rounded-lg px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 group">
          <Cpu className="h-5 w-5 text-acidGreen group-hover:rotate-90 transition-transform" />
          <span className="font-display tracking-[0.25em] text-sm">
            <span className="text-acidGreen">HUB</span>
            <span className="text-cyanElectric">3</span>
            <span className="text-foreground/70 ml-1">LAB</span>
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
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        active
                          ? 'bg-acidGreen/10 text-acidGreen shadow-neon-green'
                          : 'text-foreground/70 hover:text-acidGreen hover:bg-acidGreen/5'
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

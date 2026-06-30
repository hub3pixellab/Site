'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Menu, X, Trophy } from 'lucide-react';
import { useUnlock } from '@/components/layout/UnlockProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import LangSwitch from '@/components/i18n/LangSwitch';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { unlocked } = useUnlock();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/equipe', label: t('nav.equipe') },
    { href: '/holding', label: t('nav.holding') },
    { href: '/portfolio', label: t('nav.portfolio') },
    { href: '/fliperama', label: t('nav.fliperama') },
    { href: '/contato', label: t('nav.contato') },
  ];

  const openRecords = () => {
    if (pathname === '/fliperama') {
      window.dispatchEvent(new CustomEvent('hub3:open-records'));
    } else {
      router.push('/fliperama?records=1');
    }
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-3 md:px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 glass rounded-lg px-3 py-2">
        <Link href="/" className="flex items-center gap-2.5 group" data-testid="nav-logo">
          <div className="relative w-8 h-8 rounded-md overflow-hidden border border-cyanElectric/30">
            <Image src="/logo-hub3.jpg" alt="HUB3 PixelLab" fill className="object-cover" sizes="32px" />
          </div>
          <span className="font-display tracking-[0.22em] text-sm">
            <span className="text-foreground">HUB</span>
            <span className="text-cyanElectric">3</span>
            <span className="text-hubOrange ml-1 hidden sm:inline">LAB</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop nav */}
          <AnimatePresence mode="wait">
            {unlocked ? (
              <motion.nav
                key="nav-unlocked"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
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
                <button
                  onClick={openRecords}
                  data-testid="nav-records-btn"
                  className="ml-1 px-3 py-1.5 rounded-md transition-all inline-flex items-center gap-1.5 border border-hubOrange/40 text-hubOrange hover:bg-hubOrange/10 hover:shadow-neon-orange font-bold tracking-widest"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  RECORDS
                </button>
              </motion.nav>
            ) : (
              <motion.div
                key="nav-locked"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="hidden md:flex items-center gap-2 font-mono text-xs text-foreground/40"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="tracking-widest">{t('nav.locked').toUpperCase()}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <LangSwitch />

          {/* Mobile hamburger */}
          {unlocked && (
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden ml-1 p-2 rounded-md border border-cyanElectric/30 text-cyanElectric hover:bg-cyanElectric/10"
              data-testid="mobile-menu-toggle"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && unlocked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden max-w-6xl mx-auto mt-2 glass rounded-lg p-2 flex flex-col gap-1"
            data-testid="mobile-menu"
          >
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`mobile-nav-link-${l.href.replace('/', '') || 'home'}`}
                  className={`px-3 py-2 rounded-md font-mono text-xs tracking-widest transition-colors ${
                    active
                      ? 'bg-cyanElectric/10 text-cyanElectric'
                      : 'text-foreground/75 hover:text-cyanElectric hover:bg-cyanElectric/5'
                  }`}
                >
                  {l.label.toUpperCase()}
                </Link>
              );
            })}
            <button
              onClick={openRecords}
              data-testid="mobile-nav-records-btn"
              className="px-3 py-2 rounded-md font-mono text-xs tracking-widest text-hubOrange border border-hubOrange/30 hover:bg-hubOrange/10 inline-flex items-center gap-2"
            >
              <Trophy className="w-3.5 h-3.5" /> LIVRO DE RECORDS
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

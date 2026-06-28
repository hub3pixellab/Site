'use client';
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { matchmakerCards as fallbackCards, divisions } from '@/lib/content';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useMatchmakerQuestions } from '@/hooks/useMatchmakerQuestions';

// Mapeia divisions vindo do Sanity (HouseLab/PixelLab/AppLab) para o id do nosso array divisions
const DIV_MAP = { HouseLab: 'house-lab', PixelLab: 'pixel-lab', AppLab: 'app-lab' };

export default function Matchmaker() {
  const { t, lang } = useI18n();
  const { questions: sanityQuestions, loading } = useMatchmakerQuestions();

  // Normaliza: se houver dados do Sanity usa eles, senão fallback para /lib/content.js
  const sourceCards = useMemo(() => {
    if (sanityQuestions && sanityQuestions.length > 0) {
      return sanityQuestions.map((q) => ({
        id: q._id,
        division: DIV_MAP[q.yesVector] || 'house-lab',
        pain: { pt: q.cardText, en: q.cardText },
        solution: { pt: '', en: '' },
      }));
    }
    return fallbackCards;
  }, [sanityQuestions]);

  const [deck, setDeck] = useState(sourceCards);
  const [unlocked, setUnlocked] = useState(new Set());

  // Re-sincroniza deck quando sourceCards mudar (primeira chegada do Sanity)
  React.useEffect(() => {
    setDeck(sourceCards);
  }, [sourceCards]);

  const reset = () => {
    setDeck(sourceCards);
    setUnlocked(new Set());
  };

  const handleSwipe = (card, dir) => {
    if (dir === 'right') {
      setUnlocked((prev) => new Set(prev).add(card.division));
    }
    setDeck((prev) => prev.filter((c) => c.id !== card.id));
  };

  const done = deck.length === 0;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <div className="relative h-[460px] flex items-center justify-center">
        <AnimatePresence>
          {deck.length === 0 ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-8 text-center max-w-md"
            >
              <div className="text-acidGreen font-mono text-xs tracking-widest mb-2">
                {t('holding.done')}
              </div>
              <button
                onClick={reset}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-acidGreen/40 text-acidGreen text-xs font-mono hover:bg-acidGreen/10"
              >
                <RotateCcw className="h-3 w-3" /> {t('holding.reset')}
              </button>
            </motion.div>
          ) : (
            deck.slice(0, 3).reverse().map((card, idx, arr) => {
              const isTop = idx === arr.length - 1;
              return (
                <SwipeCard
                  key={card.id}
                  card={card}
                  isTop={isTop}
                  depth={arr.length - 1 - idx}
                  onSwipe={handleSwipe}
                  lang={lang}
                />
              );
            })
          )}
        </AnimatePresence>

        {!done && (
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-4 font-mono text-[10px] text-foreground/50 tracking-widest">
            <span><X className="inline h-3 w-3 text-magentaSunset" /> {t('holding.swipeLeft')}</span>
            <span>{t('holding.swipeRight')} <Check className="inline h-3 w-3 text-acidGreen" /></span>
          </div>
        )}
      </div>

      {/* Divisions panel */}
      <div className="space-y-3">
        <div className="font-mono text-xs text-foreground/60 tracking-widest">{t('holding.unlocked').toUpperCase()}</div>
        {divisions.map((d) => {
          const open = unlocked.has(d.id);
          return (
            <motion.div
              key={d.id}
              animate={{
                opacity: open ? 1 : 0.4,
                scale: open ? 1 : 0.98,
              }}
              className={`glass rounded-xl p-4 border ${
                open ? `border-${d.color}/40 shadow-neon-violet` : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`font-display tracking-wider text-${d.color}`}>{d.name}</div>
                <div className="text-[10px] font-mono text-foreground/40">{open ? 'UNLOCKED' : 'LOCKED'}</div>
              </div>
              <div className="text-xs text-foreground/60 mt-1">{d.short}</div>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-foreground/80 mt-3">{d.description[lang]}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {d.skills.map((s) => (
                        <span key={s} className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border border-${d.color}/30 text-${d.color}/90 bg-${d.color}/5`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SwipeCard({ card, isTop, depth, onSwipe, lang }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const rightOpacity = useTransform(x, [40, 140], [0, 1]);
  const leftOpacity = useTransform(x, [-140, -40], [1, 0]);

  const divisionMeta = divisions.find((d) => d.id === card.division);

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={{ scale: 1 - depth * 0.04, y: depth * 10, opacity: 1 }}
      animate={{ scale: 1 - depth * 0.04, y: depth * 10, opacity: 1 }}
      exit={(custom) => ({
        x: custom?.dir === 'right' ? 600 : -600,
        opacity: 0,
        rotate: custom?.dir === 'right' ? 25 : -25,
        transition: { duration: 0.45 },
      })}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onSwipe(card, 'right');
        else if (info.offset.x < -120) onSwipe(card, 'left');
      }}
      className={`absolute w-[300px] md:w-[340px] h-[400px] glass rounded-2xl p-6 ${
        isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      } shadow-neon-violet`}
    >
      <motion.div
        style={{ opacity: rightOpacity }}
        className="absolute top-4 right-4 text-acidGreen border border-acidGreen rounded-md px-2 py-1 font-mono text-xs tracking-widest"
      >SOLVE</motion.div>
      <motion.div
        style={{ opacity: leftOpacity }}
        className="absolute top-4 left-4 text-magentaSunset border border-magentaSunset rounded-md px-2 py-1 font-mono text-xs tracking-widest"
      >SKIP</motion.div>

      <div className="font-mono text-[10px] text-foreground/40 tracking-widest mb-3">{divisionMeta?.name.toUpperCase()}</div>
      <div className="text-foreground text-lg font-medium leading-snug">
        {card.pain[lang]}
      </div>
      <div className="mt-6 text-xs font-mono text-foreground/50">
        → {card.solution[lang]}
      </div>

      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between font-mono text-[10px] text-foreground/40">
        <span>HUB3.PAIN/{card.id.toUpperCase()}</span>
        <span>{divisionMeta?.short}</span>
      </div>
    </motion.div>
  );
}

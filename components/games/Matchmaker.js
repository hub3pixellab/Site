'use client';
import React, { useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, RotateCcw, Sparkles, Briefcase, Layers, Smartphone } from 'lucide-react';
import { matchmakerCards as fallbackCards, divisions } from '@/lib/content';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useMatchmakerQuestions } from '@/hooks/useMatchmakerQuestions';

// Mapeia divisions vindo do Sanity (HouseLab/PixelLab/AppLab) para o id do nosso array divisions
const DIV_MAP = { HouseLab: 'house-lab', PixelLab: 'pixel-lab', AppLab: 'app-lab' };

// Ícones por divisão (estilo Tinder cards)
const DIV_ICONS = {
  'house-lab': Briefcase,
  'pixel-lab': Layers,
  'app-lab':   Smartphone,
};

// Color hex para os accent das divisões (Tailwind names → hex)
const DIV_HEX = {
  'house-lab': '#CCFF00',
  'pixel-lab': '#22E0F5',
  'app-lab':   '#FF007A',
};

export default function Matchmaker() {
  const { t, lang } = useI18n();
  const { questions: sanityQuestions } = useMatchmakerQuestions();

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
  const [lastAction, setLastAction] = useState(null); // 'like' | 'nope'
  const topCardRef = useRef(null);

  React.useEffect(() => {
    setDeck(sourceCards);
  }, [sourceCards]);

  const reset = () => {
    setDeck(sourceCards);
    setUnlocked(new Set());
    setLastAction(null);
  };

  const handleSwipe = (card, dir) => {
    if (dir === 'right') {
      setUnlocked((prev) => new Set(prev).add(card.division));
      setLastAction('like');
    } else {
      setLastAction('nope');
    }
    setDeck((prev) => prev.filter((c) => c.id !== card.id));
  };

  // Action via botão (dispara animação no card top)
  const triggerSwipe = (dir) => {
    if (deck.length === 0) return;
    const top = deck[0];
    // animação programática via ref
    if (topCardRef.current?.swipeProgrammatic) {
      topCardRef.current.swipeProgrammatic(dir);
    } else {
      handleSwipe(top, dir);
    }
  };

  const done = deck.length === 0;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      {/* Card stack + Tinder buttons */}
      <div className="flex flex-col items-center" data-testid="matchmaker-deck">
        <div className="relative h-[480px] w-full flex items-center justify-center">
          <AnimatePresence>
            {deck.length === 0 ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-8 text-center max-w-md border border-acidGreen/40"
                data-testid="matchmaker-done"
              >
                <Sparkles className="w-10 h-10 text-acidGreen mx-auto mb-3" />
                <div className="text-acidGreen font-mono text-xs tracking-widest mb-2">
                  {t('holding.done')}
                </div>
                <p className="text-foreground/60 text-sm mt-2">
                  {unlocked.size} {unlocked.size === 1 ? 'divisão' : 'divisões'} desbloqueadas
                </p>
                <button
                  onClick={reset}
                  data-testid="matchmaker-reset-btn"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-acidGreen/40 text-acidGreen text-xs font-mono hover:bg-acidGreen/10 tracking-widest"
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
                    ref={isTop ? topCardRef : null}
                  />
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Tinder-style action buttons */}
        {!done && (
          <div className="flex items-center justify-center gap-6 mt-2" data-testid="matchmaker-actions">
            <TinderButton
              onClick={() => triggerSwipe('left')}
              color="#FF007A"
              ariaLabel="Skip"
              testId="matchmaker-skip-btn"
              pulse={lastAction === 'nope'}
            >
              <X className="w-8 h-8" strokeWidth={3} />
            </TinderButton>

            <div className="flex flex-col items-center gap-1 font-mono text-[9px] tracking-widest text-foreground/40">
              <span>{deck.length} {deck.length === 1 ? 'CARD' : 'CARDS'}</span>
              <span className="text-cyanElectric">→ ARRASTE OU CLIQUE</span>
            </div>

            <TinderButton
              onClick={() => triggerSwipe('right')}
              color="#CCFF00"
              ariaLabel="Solve"
              testId="matchmaker-like-btn"
              pulse={lastAction === 'like'}
            >
              <Heart className="w-8 h-8" strokeWidth={2.5} fill="currentColor" />
            </TinderButton>
          </div>
        )}
      </div>

      {/* Divisions panel */}
      <div className="space-y-3">
        <div className="font-mono text-xs text-foreground/60 tracking-widest">
          {t('holding.unlocked').toUpperCase()}
        </div>
        {divisions.map((d) => {
          const open = unlocked.has(d.id);
          const Icon = DIV_ICONS[d.id] || Briefcase;
          return (
            <motion.div
              key={d.id}
              animate={{
                opacity: open ? 1 : 0.4,
                scale: open ? 1 : 0.98,
              }}
              data-testid={`division-${d.id}`}
              className={`glass rounded-xl p-4 border ${
                open ? `border-${d.color}/40 shadow-neon-violet` : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${d.color}`} />
                  <div className={`font-display tracking-wider text-${d.color}`}>{d.name}</div>
                </div>
                <div className="text-[10px] font-mono text-foreground/40">
                  {open ? 'UNLOCKED' : 'LOCKED'}
                </div>
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

// ─── Tinder-style circular action button ──────────────────────────────────────
function TinderButton({ children, onClick, color, ariaLabel, testId, pulse }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={testId}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      animate={pulse ? { scale: [1, 1.25, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'rgba(11,9,20,0.9)',
        border: `2.5px solid ${color}`,
        color,
        boxShadow: `0 0 18px ${color}55, inset 0 0 12px ${color}22`,
      }}
      className="w-16 h-16 rounded-full flex items-center justify-center transition-colors hover:bg-white/5 cursor-pointer"
    >
      {children}
    </motion.button>
  );
}

// ─── Card with imperative swipe ───────────────────────────────────────────────
const SwipeCard = React.forwardRef(function SwipeCard({ card, isTop, depth, onSwipe, lang }, ref) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const rightOpacity = useTransform(x, [40, 140], [0, 1]);
  const leftOpacity = useTransform(x, [-140, -40], [1, 0]);
  const divisionMeta = divisions.find((d) => d.id === card.division);
  const Icon = DIV_ICONS[card.division] || Briefcase;
  const accent = DIV_HEX[card.division] || '#CCFF00';

  // Programmatic swipe (used by Tinder buttons)
  React.useImperativeHandle(ref, () => ({
    swipeProgrammatic: (dir) => {
      const target = dir === 'right' ? 600 : -600;
      x.set(target * 0.3); // trigger transform
      setTimeout(() => onSwipe(card, dir), 100);
    },
  }), [card, onSwipe, x]);

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={{ scale: 1 - depth * 0.04, y: depth * 10, opacity: 1 }}
      animate={{ scale: 1 - depth * 0.04, y: depth * 10, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 600 : -600,
        opacity: 0,
        rotate: x.get() > 0 ? 25 : -25,
        transition: { duration: 0.4 },
      }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onSwipe(card, 'right');
        else if (info.offset.x < -120) onSwipe(card, 'left');
      }}
      data-testid={isTop ? 'matchmaker-top-card' : undefined}
      className={`absolute w-[300px] md:w-[340px] h-[420px] rounded-3xl overflow-hidden ${
        isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
    >
      {/* Card surface */}
      <div
        className="relative w-full h-full p-6 flex flex-col"
        style={{
          background: `linear-gradient(155deg, ${accent}18 0%, rgba(11,9,20,0.95) 55%, rgba(11,9,20,0.98) 100%)`,
          border: `1.5px solid ${accent}55`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.45), 0 0 30px ${accent}22, inset 0 0 24px ${accent}10`,
        }}
      >
        {/* Tinder-style action badges */}
        <motion.div
          style={{ opacity: rightOpacity }}
          className="absolute top-6 right-6 z-10"
        >
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs tracking-widest"
            style={{
              border: '2.5px solid #CCFF00',
              color: '#CCFF00',
              background: 'rgba(204,255,0,0.08)',
              transform: 'rotate(-12deg)',
            }}
          >
            <Heart className="w-4 h-4" fill="currentColor" /> SOLVE
          </div>
        </motion.div>
        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute top-6 left-6 z-10"
        >
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs tracking-widest"
            style={{
              border: '2.5px solid #FF007A',
              color: '#FF007A',
              background: 'rgba(255,0,122,0.08)',
              transform: 'rotate(12deg)',
            }}
          >
            <X className="w-4 h-4" /> SKIP
          </div>
        </motion.div>

        {/* Top: division tag with icon */}
        <div className="flex items-center justify-between">
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full font-mono text-[10px] tracking-widest"
            style={{
              background: `${accent}15`,
              border: `1px solid ${accent}55`,
              color: accent,
            }}
          >
            <Icon className="w-3 h-3" />
            {divisionMeta?.name.toUpperCase()}
          </div>
          <span className="font-mono text-[9px] text-foreground/35 tracking-widest">
            HUB3.PAIN
          </span>
        </div>

        {/* Hero icon */}
        <div className="flex items-center justify-center mt-6 mb-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`,
              border: `1px solid ${accent}33`,
            }}
          >
            <Icon className="w-10 h-10" style={{ color: accent }} />
          </div>
        </div>

        {/* Pain text */}
        <div className="flex-1 flex items-start">
          <p className="text-foreground text-lg md:text-xl font-medium leading-snug">
            {card.pain[lang]}
          </p>
        </div>

        {/* Solution hint */}
        {card.solution?.[lang] && (
          <div
            className="mt-4 pt-3 text-xs font-mono leading-relaxed"
            style={{ borderTop: `1px dashed ${accent}33`, color: `${accent}cc` }}
          >
            <span className="text-foreground/40">→ </span>
            {card.solution[lang]}
          </div>
        )}

        {/* Footer ID */}
        <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-foreground/40">
          <span>#{String(card.id).toUpperCase()}</span>
          <span>{divisionMeta?.short}</span>
        </div>
      </div>
    </motion.div>
  );
});

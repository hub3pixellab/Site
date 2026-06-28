'use client';
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ExternalLink, Terminal, Cloud } from 'lucide-react';
import { cases as fallbackCases, allTags as fallbackTags } from '@/lib/content';
import { useI18n } from '@/components/i18n/I18nProvider';
import { usePortfolioProjects } from '@/hooks/usePortfolioProjects';

const DIVISION_MAP = { 'House Lab': 'house-lab', 'PixelLab': 'pixel-lab', 'AppLab': 'app-lab' };

export default function BlueprintDecoder() {
  const { t, lang } = useI18n();
  const { projects: sanityProjects, configured } = usePortfolioProjects();
  const [selected, setSelected] = useState(new Set());

  // Normaliza: Sanity tem prioridade; senão usa fallback
  const cases = useMemo(() => {
    if (sanityProjects && sanityProjects.length > 0) {
      return sanityProjects.map((p) => ({
        id: p._id,
        division: DIVISION_MAP[p.division] || 'house-lab',
        name: p.title,
        url: p.liveUrl || '#',
        summary: { pt: p.description, en: p.description },
        metrics: p.metrics || [],
        tags: p.tags || [],
      }));
    }
    return fallbackCases;
  }, [sanityProjects]);

  const allTags = useMemo(() => {
    if (sanityProjects && sanityProjects.length > 0) {
      const s = new Set();
      sanityProjects.forEach((p) => (p.tags || []).forEach((t) => s.add(t)));
      return Array.from(s);
    }
    return fallbackTags;
  }, [sanityProjects]);

  const toggleTag = (tag) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(tag)) n.delete(tag);
      else n.add(tag);
      return n;
    });
  };

  const decryptedCases = useMemo(() => {
    return cases.map((c) => {
      const required = c.tags;
      const decrypted = required.some((t) => selected.has(t));
      const matchCount = required.filter((t) => selected.has(t)).length;
      const fullyDecrypted = matchCount === required.length;
      return { ...c, decrypted, fullyDecrypted, matchCount };
    });
  }, [selected]);

  return (
    <div className="space-y-6">
      {/* tag terminal */}
      <div className="glass rounded-xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 font-mono text-xs text-acidGreen mb-3">
          <Terminal className="h-4 w-4" />
          <span className="tracking-widest">HUB3.DECODER · /tags --select</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const on = selected.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 rounded-sm font-mono text-[11px] transition-all border ${
                  on
                    ? 'bg-acidGreen text-bgDark border-acidGreen shadow-neon-green'
                    : 'bg-cardBg text-foreground/60 border-border hover:border-acidGreen/40 hover:text-acidGreen'
                }`}
              >
                {on ? '▸ ' : ''}{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* cases */}
      <div className="grid md:grid-cols-2 gap-4">
        {decryptedCases.map((c) => (
          <BlueprintCard key={c.id} item={c} lang={lang} t={t} />
        ))}
      </div>
    </div>
  );
}

function BlueprintCard({ item, lang, t }) {
  return (
    <motion.div
      layout
      className={`relative glass rounded-xl p-5 overflow-hidden transition-all ${
        item.decrypted ? 'shadow-neon-cyan border border-cyanElectric/30' : 'border border-border'
      }`}
    >
      {/* scanline overlay */}
      <div className="absolute inset-0 pointer-events-none crt-overlay" />

      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] tracking-widest text-foreground/50">
          BLUEPRINT::{item.id.toUpperCase()}
        </div>
        <div className="flex items-center gap-1">
          {item.decrypted ? (
            <Unlock className="h-3.5 w-3.5 text-acidGreen" />
          ) : (
            <Lock className="h-3.5 w-3.5 text-foreground/40" />
          )}
          <span className="font-mono text-[10px] text-foreground/50">
            {item.matchCount}/{item.tags.length}
          </span>
        </div>
      </div>

      <div className={`mt-2 font-display text-xl ${item.decrypted ? 'text-foreground' : 'text-foreground/30'}`}>
        {item.decrypted ? item.name : '██████ ██████'}
      </div>

      <AnimatePresence>
        {item.decrypted ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3"
          >
            <p className="text-sm text-foreground/80">{item.summary[lang]}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {item.metrics.map((m) => (
                <div key={m.k} className="rounded-md border border-border bg-cardBg p-2 text-center">
                  <div className="font-display text-acidGreen text-sm">{m.v}</div>
                  <div className="font-mono text-[9px] text-foreground/50 tracking-widest mt-0.5">{m.k}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-cyanElectric/10 text-cyanElectric border border-cyanElectric/20">
                  {tag}
                </span>
              ))}
            </div>

            {item.url && item.url !== '#' && (
              <a href={item.url} target="_blank" rel="noreferrer"
                 className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono text-acidGreen hover:underline">
                <ExternalLink className="h-3 w-3" /> {t('portfolio.visit')}
              </a>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 font-mono text-xs text-foreground/40"
          >
            {t('portfolio.pending')}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

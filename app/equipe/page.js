'use client';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Crown, Rocket, Briefcase, GraduationCap, Music2, Code2, Calculator, Target, Building2, Sparkles } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';
import { useI18n } from '@/components/i18n/I18nProvider';
import { team } from '@/lib/content';

const ICONS = {
  crown: Crown,
  rocket: Rocket,
  briefcase: Briefcase,
  graduation: GraduationCap,
  music: Music2,
  code: Code2,
  calculator: Calculator,
  target: Target,
  building: Building2,
  sparkles: Sparkles,
};

export default function EquipePage() {
  const { t, lang } = useI18n();

  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center mb-12 relative"
      >
        <div className="absolute inset-0 -z-10 bg-radial-cyan opacity-40 pointer-events-none" />
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 font-mono text-[10px] tracking-widest text-cyanElectric mb-4">
          <Sparkles className="h-3 w-3" />
          {t('equipe.tag')}
        </div>
        <h1 className="font-display text-3xl md:text-5xl gradient-text">{t('equipe.title')}</h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric/90 tracking-widest">{t('equipe.subtitle')}</p>
        <p className="mt-5 text-foreground/70 max-w-2xl mx-auto">{t('equipe.intro')}</p>
      </motion.div>

      <div className="space-y-10 max-w-5xl mx-auto">
        {team.map((m, idx) => (
          <MemberCard key={m.id} member={m} index={idx} lang={lang} />
        ))}
      </div>

      {/* Soon block */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto mt-14 glass rounded-2xl p-6 text-center border border-hubOrange/25"
      >
        <div className="font-mono text-[10px] tracking-widest text-hubOrange mb-2">{t('equipe.soonTag')}</div>
        <div className="text-foreground/75">{t('equipe.soonText')}</div>
      </motion.div>
    </GameContainer>
  );
}

function MemberCard({ member, index, lang }) {
  const isLeft = index % 2 === 0;
  const RoleIcon = ICONS[member.icon] || Crown;
  const accent = member.accent || '#22E0F5';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: 0.05 }}
      className={`grid md:grid-cols-[260px_1fr] gap-6 md:gap-10 items-start ${isLeft ? '' : 'md:[direction:rtl]'}`}
      data-testid={`team-card-${member.id}`}
    >
      <div className="md:[direction:ltr] flex flex-col items-center md:items-start">
        {/* Avatar with logo style frame */}
        <div
          className="relative w-44 h-44 md:w-60 md:h-60 rounded-2xl overflow-hidden glass flex items-center justify-center"
          style={{ borderColor: `${accent}44`, boxShadow: `0 0 36px ${accent}33` }}
        >
          {member.avatar ? (
            <Image src={member.avatar} alt={member.name} fill className="object-cover" />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 starfield opacity-50" />
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center font-display text-3xl"
                style={{
                  background: `radial-gradient(circle, ${accent}44 0%, transparent 70%)`,
                  color: accent,
                  textShadow: `0 0 14px ${accent}`,
                  border: `2px solid ${accent}88`,
                }}
              >
                {member.initials}
              </div>
            </div>
          )}
          <div
            className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] tracking-widest"
            style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}66` }}
          >
            <RoleIcon className="w-3 h-3" /> {member.roleTag}
          </div>
        </div>

        <div className="mt-4 text-center md:text-left">
          <div className="font-display text-xl md:text-2xl tracking-tight" style={{ color: accent }}>
            {member.name}
          </div>
          <div className="font-mono text-[11px] text-foreground/60 tracking-widest mt-1">
            {member.title[lang]}
          </div>
        </div>
      </div>

      <div className="md:[direction:ltr] space-y-4">
        <blockquote
          className="font-mono text-sm md:text-base italic border-l-2 pl-4"
          style={{ borderColor: accent, color: `${accent}` }}
        >
          “{member.quote[lang]}”
        </blockquote>

        <div className="space-y-3 text-foreground/80 leading-relaxed">
          {member.bio[lang].map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {member.tags.map((tag) => {
            const Tg = ICONS[tag.icon] || Sparkles;
            return (
              <span
                key={tag.label[lang]}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] tracking-wider"
                style={{
                  background: `${accent}10`,
                  color: `${accent}`,
                  border: `1px solid ${accent}44`,
                }}
              >
                <Tg className="w-3 h-3" /> {tag.label[lang]}
              </span>
            );
          })}
        </div>
      </div>
    </motion.article>
  );
}

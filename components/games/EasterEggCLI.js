'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw, Radio } from 'lucide-react';
import MatrixRain from '@/components/effects/MatrixRain';
import { useI18n } from '@/components/i18n/I18nProvider';

const flow = {
  pt: [
    { prompt: 'Qual seu nome?', key: 'name' },
    { prompt: 'E o seu e-mail de contato?', key: 'email' },
    { prompt: 'Sua empresa ou projeto?', key: 'company' },
    { prompt: 'Conta resumido o desafio que quer resolver:', key: 'message' },
  ],
  en: [
    { prompt: 'What\u2019s your name?', key: 'name' },
    { prompt: 'Your contact e-mail?', key: 'email' },
    { prompt: 'Your company or project?', key: 'company' },
    { prompt: 'Briefly describe your challenge:', key: 'message' },
  ],
};

export default function EasterEggCLI() {
  const { t, lang } = useI18n();
  const steps = flow[lang];
  const [logs, setLogs] = useState([
    { type: 'sys', text: 'HUB3.CLI v3.1.4 — secure channel ready.' },
    { type: 'sys', text: lang === 'pt' ? 'Inicializando coleta de dados...' : 'Initializing intake...' },
    { type: 'bot', text: flow[lang][0].prompt },
  ]);
  const [stepIdx, setStepIdx] = useState(0);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [easter, setEaster] = useState(false);
  const data = useRef({});
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const reset = () => {
    data.current = {};
    setStepIdx(0);
    setDone(false);
    setEaster(false);
    setLogs([
      { type: 'sys', text: 'HUB3.CLI v3.1.4 — secure channel ready.' },
      { type: 'sys', text: lang === 'pt' ? 'Inicializando coleta de dados...' : 'Initializing intake...' },
      { type: 'bot', text: flow[lang][0].prompt },
    ]);
  };

  const submit = (e) => {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;
    const next = [...logs, { type: 'user', text: val }];

    // Easter egg detection
    if (val.toUpperCase() === 'HUB3IA') {
      setEaster(true);
      next.push({ type: 'sys', text: t('contato.easterFound') });
      setLogs(next);
      setInput('');
      return;
    }

    if (done) {
      setLogs(next);
      setInput('');
      return;
    }

    const step = steps[stepIdx];
    data.current[step.key] = val;
    const nextIdx = stepIdx + 1;

    if (nextIdx < steps.length) {
      next.push({ type: 'bot', text: steps[nextIdx].prompt });
      setStepIdx(nextIdx);
    } else {
      next.push({ type: 'sys', text: t('contato.done') });
      next.push({
        type: 'sys',
        text: lang === 'pt'
          ? 'DICA: digite "HUB3IA" para acessar o stream privado.'
          : 'HINT: type "HUB3IA" to unlock the private stream.',
      });
      setDone(true);
    }
    setLogs(next);
    setInput('');
  };

  return (
    <div className="relative">
      <AnimatePresence>{easter && <MatrixRain active opacity={0.55} />}</AnimatePresence>

      <div className="glass rounded-xl overflow-hidden relative z-10">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bgDark/70">
          <div className="flex items-center gap-2 font-mono text-xs text-acidGreen">
            <span className="h-2 w-2 rounded-full bg-magentaSunset" />
            <span className="h-2 w-2 rounded-full bg-acidGreen" />
            <span className="h-2 w-2 rounded-full bg-cyanElectric" />
            <span className="ml-3 tracking-widest">hub3@portal:~$</span>
          </div>
          <button onClick={reset} className="flex items-center gap-1 text-[10px] font-mono text-foreground/50 hover:text-acidGreen">
            <RotateCcw className="h-3 w-3" /> {t('contato.reset')}
          </button>
        </div>

        <div ref={scrollRef} className="h-[360px] overflow-y-auto p-4 font-mono text-sm space-y-1.5">
          {logs.map((l, i) => (
            <div key={i} className={
              l.type === 'sys' ? 'text-cyanElectric/80' :
              l.type === 'bot' ? 'text-foreground/80' :
              'text-acidGreen'
            }>
              {l.type === 'user' && <span className="text-foreground/40 mr-2">$&gt;</span>}
              {l.type === 'bot' && <span className="text-magentaSunset mr-2">hub3:</span>}
              {l.type === 'sys' && <span className="text-foreground/40 mr-2">[sys]</span>}
              {l.text}
            </div>
          ))}
          {!done && <div className="text-acidGreen terminal-cursor">&nbsp;</div>}
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-bgDark/70 p-2">
          <span className="font-mono text-acidGreen pl-2">&gt;</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('contato.placeholder')}
            className="flex-1 bg-transparent outline-none font-mono text-sm text-foreground placeholder:text-foreground/30"
            autoFocus
          />
          <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-acidGreen text-bgDark font-mono text-xs hover:shadow-neon-green">
            <Send className="h-3 w-3" /> {t('contato.send')}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {easter && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-20 mt-6 glass rounded-xl p-5 border border-acidGreen/40 shadow-neon-green"
          >
            <div className="flex items-center gap-2 font-mono text-xs text-acidGreen tracking-widest mb-3">
              <Radio className="h-4 w-4" /> {t('contato.streamLabel').toUpperCase()}
            </div>
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent('https://soundcloud.com/massivejackmusic/sets/unreleased?secret_token=s-xH8mqZ5tU1d')}&color=%23ccff00&inverse=true&auto_play=false&show_user=true&hide_related=true&visual=false`}
              className="rounded-md"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

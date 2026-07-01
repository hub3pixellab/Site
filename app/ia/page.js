'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, MessageSquare, Lightbulb, GraduationCap, Send, RotateCcw, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';

const MODES = [
  { id: 'chat',    label: 'Chat',      Icon: MessageSquare, accent: '#00F0FF',
    hint: 'Converse livremente com o HUB3 Assistant. Tire dúvidas sobre a holding, projetos e cultura.' },
  { id: 'ideas',   label: 'Gerador de ideias', Icon: Lightbulb, accent: '#CCFF00',
    hint: 'Descreva um problema/setor e o HUB3 Ideator devolve uma ideia estruturada. Também enviamos por e-mail para nosso time.' },
  { id: 'explain', label: 'Explicador', Icon: GraduationCap, accent: '#FF007A',
    hint: 'Explicações claras sobre Web3, blockchain, IA, design systems, game dev — sem jargão.' },
];

function IdeaSubmitBanner({ status }) {
  if (status === 'idle') return null;
  const map = {
    sending: { text: 'Enviando ideia para o time HUB3...', color: '#00F0FF', Icon: Loader2, spin: true },
    sent:    { text: 'Ideia enviada com sucesso ao time HUB3!', color: '#CCFF00', Icon: CheckCircle2 },
    error:   { text: 'Ideia gerada, mas falha ao enviar por e-mail.', color: '#FF007A', Icon: Mail },
  };
  const cfg = map[status] || map.error;
  const Icon = cfg.Icon;
  return (
    <div
      className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md font-mono text-xs tracking-wider"
      style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}44`, color: cfg.color }}
    >
      <Icon className={`w-3.5 h-3.5 ${cfg.spin ? 'animate-spin' : ''}`} />
      {cfg.text}
    </div>
  );
}

export default function IAPage() {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([]); // { role, content }
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ideaStatus, setIdeaStatus] = useState('idle');
  const [ideaMeta, setIdeaMeta] = useState({ name:'', email:'' });
  const scrollRef = useRef(null);

  const modeCfg = MODES.find(m => m.id === mode) || MODES[0];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  // Reset conversation when mode changes
  useEffect(() => { setMessages([]); setIdeaStatus('idle'); }, [mode]);

  const clear = () => { setMessages([]); setIdeaStatus('idle'); };

  const submitChat = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const nextMsgs = [...messages, { role: 'user', content: text }];
    setMessages(nextMsgs);
    setBusy(true);

    if (mode === 'ideas') {
      setIdeaStatus('sending');
      try {
        const res = await fetch('/api/ai/idea', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text, senderName: ideaMeta.name, senderEmail: ideaMeta.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falhou');
        setMessages(m => [...m, { role: 'assistant', content: data.idea }]);
        setIdeaStatus(data.mailed ? 'sent' : 'error');
      } catch (err) {
        setMessages(m => [...m, { role: 'assistant', content: 'Falhou ao gerar ideia: ' + err.message }]);
        setIdeaStatus('error');
      } finally { setBusy(false); }
      return;
    }

    // Streaming for chat + explain
    setMessages(m => [...m, { role: 'assistant', content: '' }]);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, messages: nextMsgs }),
      });
      if (!res.ok || !res.body) throw new Error('Falha na conexão com HUB3.IA');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(m => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch (err) {
      setMessages(m => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: 'Erro: ' + err.message };
        return copy;
      });
    } finally { setBusy(false); }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitChat(); }
  };

  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto text-center mb-6"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-magenta mb-2">
          <Sparkles className="inline w-3 h-3 mr-1" /> HUB3 · IA
        </p>
        <h1 className="font-display text-3xl md:text-5xl gradient-text" data-testid="ia-title">
          HUB3.IA
        </h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric tracking-widest">
          <Brain className="inline w-3.5 h-3.5 mr-1" />
          POWERED BY GEMINI
        </p>
      </motion.div>

      {/* Mode selector */}
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2 mb-4" data-testid="ia-modes">
        {MODES.map(m => {
          const Icon = m.Icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              data-testid={`ia-mode-${m.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-mono text-xs tracking-widest transition-all"
              style={{
                background: active ? `${m.accent}18` : 'transparent',
                border: `1px solid ${active ? m.accent : m.accent + '44'}`,
                color: active ? m.accent : `${m.accent}bb`,
                boxShadow: active ? `0 0 14px ${m.accent}44` : 'none',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto glass rounded-2xl border p-4 md:p-6" style={{ borderColor: `${modeCfg.accent}33` }}>
        <p className="font-mono text-[11px] text-foreground/60 tracking-wider mb-4">{modeCfg.hint}</p>

        {mode === 'ideas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <input
              type="text" placeholder="Seu nome (opcional)"
              value={ideaMeta.name}
              onChange={e => setIdeaMeta(m => ({...m, name: e.target.value}))}
              data-testid="ia-idea-name"
              className="bg-white/5 border border-cyanElectric/30 rounded-md px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-cyanElectric transition-colors"
            />
            <input
              type="email" placeholder="Seu email (opcional)"
              value={ideaMeta.email}
              onChange={e => setIdeaMeta(m => ({...m, email: e.target.value}))}
              data-testid="ia-idea-email"
              className="bg-white/5 border border-cyanElectric/30 rounded-md px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-cyanElectric transition-colors"
            />
          </div>
        )}

        {/* Chat log */}
        <div
          ref={scrollRef}
          className="min-h-[280px] max-h-[420px] overflow-y-auto space-y-3 font-mono text-sm px-1"
          data-testid="ia-chat-log"
        >
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-foreground/40 text-xs italic tracking-wide py-8 text-center"
              >
                {mode === 'ideas'
                  ? 'Digite um setor, problema ou tema abaixo. O HUB3 Ideator gera 1 ideia estruturada e envia por e-mail.'
                  : 'Comece a conversa digitando abaixo. Enter envia.'}
              </motion.p>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed whitespace-pre-wrap"
                  style={
                    m.role === 'user'
                      ? { background: 'rgba(0,240,255,0.09)', border: '1px solid rgba(0,240,255,0.3)', color: '#c9f5ff' }
                      : { background: `${modeCfg.accent}12`, border: `1px solid ${modeCfg.accent}44`, color: '#f5f5ff' }
                  }
                >
                  {m.content || (busy && i === messages.length - 1 ? <span className="inline-block w-2 h-4 bg-current animate-pulse" /> : '')}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {mode === 'ideas' && <IdeaSubmitBanner status={ideaStatus} />}

        {/* Input */}
        <div className="mt-4 flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={mode === 'ideas' ? 'Ex: "app para bares mostrarem drinks em AR"...' : 'Digite sua mensagem...'}
            rows={2}
            disabled={busy}
            data-testid="ia-input"
            className="flex-1 bg-white/5 border rounded-md px-3 py-2 font-mono text-sm text-foreground focus:outline-none transition-colors resize-none disabled:opacity-50"
            style={{
              borderColor: `${modeCfg.accent}44`,
            }}
            onFocus={e => e.target.style.borderColor = modeCfg.accent}
            onBlur={e => e.target.style.borderColor = `${modeCfg.accent}44`}
          />
          <button
            onClick={submitChat}
            disabled={busy || !input.trim()}
            data-testid="ia-send"
            className="px-4 py-2.5 rounded-md font-mono text-xs tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            style={{
              background: `${modeCfg.accent}18`,
              border: `1px solid ${modeCfg.accent}`,
              color: modeCfg.accent,
              boxShadow: `0 0 12px ${modeCfg.accent}33`,
            }}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            ENVIAR
          </button>
          {messages.length > 0 && (
            <button
              onClick={clear}
              disabled={busy}
              data-testid="ia-clear"
              className="px-3 py-2.5 rounded-md font-mono text-xs tracking-widest text-foreground/50 border border-white/10 hover:border-white/30 hover:text-foreground/80 transition-all"
              title="Limpar conversa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </GameContainer>
  );
}

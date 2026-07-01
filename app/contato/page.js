'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Mail, MessageCircle, Bot, Briefcase, Send, Loader2, CheckCircle2, Phone, Paperclip, RotateCcw } from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';

// Read public env at build/runtime (Next.js inlines NEXT_PUBLIC_*)
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999';
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hub3pixellab@gmail.com';

const TABS = [
  { id: 'chat',    label: 'HUB3 Assistant', Icon: Bot,       accent: '#00F0FF' },
  { id: 'direct',  label: 'Contato direto', Icon: MessageCircle, accent: '#CCFF00' },
  { id: 'careers', label: 'Trabalhe conosco', Icon: Briefcase, accent: '#FF6B35' },
];

// ─────── Chat AI Tab ──────────────────────────────────────────────
function ChatTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const next = [...messages, { role: 'user', content: text }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setBusy(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ mode: 'chat', messages: next }),
      });
      if (!res.ok || !res.body) throw new Error('Falha na conexão');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages(m => {
          const c = [...m];
          c[c.length - 1] = { role: 'assistant', content: acc };
          return c;
        });
      }
    } catch (err) {
      setMessages(m => {
        const c = [...m];
        c[c.length - 1] = { role: 'assistant', content: 'Erro: ' + err.message };
        return c;
      });
    } finally { setBusy(false); }
  };

  const buildTranscript = () => messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
  const waLink = `https://wa.me/${WHATSAPP.replace(/\D/g,'')}?text=${encodeURIComponent('Olá HUB3! Vim pelo chat do site.\n\n' + buildTranscript())}`;
  const emailLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Contato via HUB3.IA')}&body=${encodeURIComponent(buildTranscript())}`;

  return (
    <div className="glass rounded-2xl border border-cyanElectric/30 p-4 md:p-6">
      <p className="font-mono text-[11px] text-foreground/60 tracking-wider mb-3">
        Converse com o HUB3 Assistant. Ao terminar, encaminhe a conversa para nosso WhatsApp ou e-mail.
      </p>

      <div
        ref={scrollRef}
        className="min-h-[240px] max-h-[380px] overflow-y-auto space-y-3 mb-4 px-1"
        data-testid="contato-chat-log"
      >
        {messages.length === 0 && (
          <p className="text-foreground/40 text-xs italic tracking-wide py-6 text-center font-mono">
            Comece a conversa. Ex: &quot;Vocês fazem branding para startup?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3.5 py-2.5 rounded-lg text-[13px] font-mono leading-relaxed whitespace-pre-wrap"
              style={m.role === 'user'
                ? { background: 'rgba(0,240,255,0.09)', border: '1px solid rgba(0,240,255,0.3)', color: '#c9f5ff' }
                : { background: 'rgba(204,255,0,0.06)', border: '1px solid rgba(204,255,0,0.3)', color: '#f5f5ff' }
              }
            >
              {m.content || (busy && i === messages.length - 1 ? <span className="inline-block w-2 h-4 bg-current animate-pulse" /> : '')}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Digite sua dúvida..."
          rows={2}
          disabled={busy}
          data-testid="contato-chat-input"
          className="flex-1 bg-white/5 border border-cyanElectric/40 rounded-md px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-cyanElectric transition-colors resize-none disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          data-testid="contato-chat-send"
          className="px-4 py-2.5 rounded-md font-mono text-xs tracking-widest bg-cyanElectric/15 border border-cyanElectric text-cyanElectric hover:bg-cyanElectric/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          ENVIAR
        </button>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            disabled={busy}
            data-testid="contato-chat-clear"
            className="px-3 py-2.5 rounded-md font-mono text-xs tracking-widest text-foreground/50 border border-white/10 hover:border-white/30 hover:text-foreground/80 transition-all"
            title="Limpar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="font-mono text-[10px] tracking-widest text-foreground/50 mb-2">CONTINUAR A CONVERSA:</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={waLink} target="_blank" rel="noopener noreferrer"
              data-testid="contato-continue-whatsapp"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-mono text-xs tracking-widest bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 transition-all"
            >
              <Phone className="w-3.5 h-3.5" /> Continuar no WhatsApp
            </a>
            <a
              href={emailLink}
              data-testid="contato-continue-email"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-mono text-xs tracking-widest bg-hubOrange/10 border border-hubOrange/40 text-hubOrange hover:bg-hubOrange/20 transition-all"
            >
              <Mail className="w-3.5 h-3.5" /> Enviar por e-mail
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────── Direct Contact Tab ──────────────────────────────────────
function DirectTab() {
  return (
    <div className="glass rounded-2xl border border-acidGreen/30 p-6 md:p-8 text-center">
      <p className="font-mono text-xs tracking-widest text-foreground/60 mb-6">
        CANAIS DIRETOS · HUB3 PIXELLAB
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={`https://wa.me/${WHATSAPP.replace(/\D/g,'')}`}
          target="_blank" rel="noopener noreferrer"
          data-testid="contato-direct-whatsapp"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-emerald-400/50 bg-emerald-500/10 text-emerald-300 font-mono text-xs tracking-widest hover:bg-emerald-500/20 transition-all"
        >
          <Phone className="h-4 w-4" /> WhatsApp
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          data-testid="contato-direct-email"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-cyanElectric/40 bg-cyanElectric/5 text-cyanElectric font-mono text-xs tracking-widest hover:bg-cyanElectric/15 hover:shadow-neon-cyan transition-all"
        >
          <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
        </a>
        <a
          href="https://instagram.com/hub3pixellab"
          target="_blank" rel="noopener noreferrer"
          data-testid="contato-direct-instagram"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-hubOrange/40 bg-hubOrange/5 text-hubOrange font-mono text-xs tracking-widest hover:bg-hubOrange/15 hover:shadow-neon-orange transition-all"
        >
          <Instagram className="h-4 w-4" /> @hub3pixellab
        </a>
      </div>
      <p className="mt-8 text-sm text-foreground/60 max-w-lg mx-auto">
        Prefere um brief formal? Use a aba <span className="text-acidGreen">&quot;HUB3 Assistant&quot;</span> para conversar
        com nossa IA — depois exportamos para WhatsApp ou e-mail com um clique.
      </p>
    </div>
  );
}

// ─────── Careers Tab ─────────────────────────────────────────────
function CareersTab() {
  const [status, setStatus] = useState('idle'); // idle|sending|sent|error
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name:'', email:'', area:'', linkedin:'', message:'' });
  const [cv, setCv] = useState(null);
  const fileInputRef = useRef(null);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (cv) fd.append('cv', cv);
      const res = await fetch('/api/careers', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar');
      setStatus('sent');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="glass rounded-2xl border border-acidGreen/40 p-8 md:p-10 text-center">
        <CheckCircle2 className="w-12 h-12 text-acidGreen mx-auto mb-4" />
        <h3 className="font-display text-2xl text-acidGreen mb-2">Candidatura recebida!</h3>
        <p className="text-foreground/70 text-sm max-w-md mx-auto">
          Nossa equipe vai analisar seu perfil e, se houver fit, retorna em até <strong>10 dias úteis</strong>.
          Um e-mail de confirmação foi disparado ao nosso time.
        </p>
        <button
          onClick={() => { setStatus('idle'); setForm({name:'',email:'',area:'',linkedin:'',message:''}); setCv(null); }}
          className="mt-6 px-4 py-2 rounded-md border border-cyanElectric/40 text-cyanElectric font-mono text-xs tracking-widest hover:bg-cyanElectric/10"
        >
          NOVA CANDIDATURA
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl border border-hubOrange/30 p-6 md:p-8" data-testid="careers-form">
      <p className="font-mono text-xs tracking-widest text-hubOrange mb-1">
        <Briefcase className="inline w-3.5 h-3.5 mr-1" /> TRABALHE CONOSCO
      </p>
      <h3 className="font-display text-xl md:text-2xl mb-2 text-foreground">Envie sua candidatura</h3>
      <p className="text-foreground/60 text-sm mb-6 max-w-lg">
        Buscamos gente com senioridade técnica e sensibilidade criativa. Estamos sempre abertos a novos talentos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input required placeholder="Nome completo *" value={form.name}
          onChange={e => setForm(f => ({...f, name: e.target.value}))}
          data-testid="careers-name"
          className="bg-white/5 border border-hubOrange/30 rounded-md px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-hubOrange transition-colors" />
        <input required type="email" placeholder="E-mail *" value={form.email}
          onChange={e => setForm(f => ({...f, email: e.target.value}))}
          data-testid="careers-email"
          className="bg-white/5 border border-hubOrange/30 rounded-md px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-hubOrange transition-colors" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <select required value={form.area}
          onChange={e => setForm(f => ({...f, area: e.target.value}))}
          data-testid="careers-area"
          className="bg-white/5 border border-hubOrange/30 rounded-md px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-hubOrange transition-colors">
          <option value="" style={{background:'#0b0914'}}>Área de interesse *</option>
          <option value="Design" style={{background:'#0b0914'}}>Design / UI-UX</option>
          <option value="Frontend" style={{background:'#0b0914'}}>Frontend Dev</option>
          <option value="Backend" style={{background:'#0b0914'}}>Backend Dev</option>
          <option value="Full-stack" style={{background:'#0b0914'}}>Full-stack Dev</option>
          <option value="Web3" style={{background:'#0b0914'}}>Web3 / Blockchain</option>
          <option value="Mobile" style={{background:'#0b0914'}}>Mobile Dev</option>
          <option value="Game Dev" style={{background:'#0b0914'}}>Game Dev</option>
          <option value="Product" style={{background:'#0b0914'}}>Product / PM</option>
          <option value="Marketing" style={{background:'#0b0914'}}>Marketing / Growth</option>
          <option value="Outro" style={{background:'#0b0914'}}>Outro</option>
        </select>
        <input placeholder="LinkedIn / Portfolio (opcional)" value={form.linkedin}
          onChange={e => setForm(f => ({...f, linkedin: e.target.value}))}
          data-testid="careers-linkedin"
          className="bg-white/5 border border-hubOrange/30 rounded-md px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-hubOrange transition-colors" />
      </div>
      <textarea placeholder="Fale um pouco sobre você e o que te move (opcional)" rows={4}
        value={form.message}
        onChange={e => setForm(f => ({...f, message: e.target.value}))}
        data-testid="careers-message"
        className="w-full bg-white/5 border border-hubOrange/30 rounded-md px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-hubOrange transition-colors mb-3" />

      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={e => setCv(e.target.files?.[0] || null)}
          className="hidden"
          data-testid="careers-cv-input"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-hubOrange/40 bg-hubOrange/5 text-hubOrange font-mono text-xs tracking-widest hover:bg-hubOrange/15 transition-all"
          data-testid="careers-cv-btn"
        >
          <Paperclip className="w-3.5 h-3.5" />
          {cv ? `${cv.name} (${Math.round(cv.size/1024)}KB)` : 'ANEXAR CV (PDF/DOC · até 5MB)'}
        </button>
      </div>

      {error && (
        <div className="mb-3 text-magenta text-xs font-mono">{error}</div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        data-testid="careers-submit"
        className="w-full md:w-auto px-6 py-3 rounded-md font-mono text-xs tracking-widest bg-hubOrange/15 border border-hubOrange text-hubOrange hover:bg-hubOrange/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
      >
        {status === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {status === 'sending' ? 'TRANSMITINDO...' : 'ENVIAR CANDIDATURA'}
      </button>
    </form>
  );
}

// ─────── Main Page ───────────────────────────────────────────────
export default function ContatoPage() {
  const [tab, setTab] = useState('chat');
  const active = TABS.find(t => t.id === tab) || TABS[0];

  return (
    <GameContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto text-center mb-6"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-cyanElectric mb-2">HUB3 · CONTATO</p>
        <h1 className="font-display text-3xl md:text-5xl gradient-text" data-testid="contato-title">Canal Direto</h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-foreground/60 tracking-widest">
          IA · WHATSAPP · E-MAIL · CARREIRA
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2 mb-4" data-testid="contato-tabs">
        {TABS.map(tb => {
          const Icon = tb.Icon;
          const isActive = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              data-testid={`contato-tab-${tb.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-mono text-xs tracking-widest transition-all"
              style={{
                background: isActive ? `${tb.accent}18` : 'transparent',
                border: `1px solid ${isActive ? tb.accent : tb.accent + '44'}`,
                color: isActive ? tb.accent : `${tb.accent}bb`,
                boxShadow: isActive ? `0 0 14px ${tb.accent}44` : 'none',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tb.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'chat' && <ChatTab />}
            {tab === 'direct' && <DirectTab />}
            {tab === 'careers' && <CareersTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameContainer>
  );
}

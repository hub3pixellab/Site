'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRegistration } from '@/components/layout/RegistrationProvider';

// ─── Constants ────────────────────────────────────────────────────────────────
const PADS = [
  { id: 0, label: 'KICK',   color: '#CCFF00', shadow: 'rgba(204,255,0,0.7)',  type: 'kick'   },
  { id: 1, label: 'SNARE',  color: '#22E0F5', shadow: 'rgba(34,224,245,0.7)', type: 'snare'  },
  { id: 2, label: 'HI-HAT', color: '#FF007A', shadow: 'rgba(255,0,122,0.7)',  type: 'hihat'  },
  { id: 3, label: 'SYNTH',  color: '#FF9416', shadow: 'rgba(255,148,22,0.7)', type: 'synth'  },
];
const COLORS = {
  bg: '#06121F', cyan: '#22E0F5', acid: '#CCFF00', magenta: '#FF007A',
  orange: '#FF9416', white: '#E8F4FF', grid: 'rgba(34,224,245,0.12)',
};
const LEVEL_SPEED = (level) => Math.max(280, 700 - level * 35);
const FLASH_MS = 320;

function useAudioEngine() {
  const ctxRef = useRef(null);
  const getCtx = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);
  const playKick = (ctx) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(160, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
    g.gain.setValueAtTime(1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.start(); o.stop(ctx.currentTime + 0.3);
  };
  const playSnare = (ctx) => {
    const sz = ctx.sampleRate * 0.15, b = ctx.createBuffer(1, sz, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000;
    const g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.7, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    s.start(); s.stop(ctx.currentTime + 0.18);
  };
  const playHihat = (ctx) => {
    const sz = ctx.sampleRate * 0.08, b = ctx.createBuffer(1, sz, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    s.start(); s.stop(ctx.currentTime + 0.09);
  };
  const playSynth = (ctx) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth'; o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 440;
    g.gain.setValueAtTime(0.35, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    o.start(); o.stop(ctx.currentTime + 0.28);
  };
  const playError = (ctx) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start(); o.stop(ctx.currentTime + 0.4);
  };
  const playWin = (ctx) => {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    });
  };
  return useCallback((type) => {
    const ctx = getCtx(); if (!ctx) return;
    if (type === 'kick') playKick(ctx);
    if (type === 'snare') playSnare(ctx);
    if (type === 'hihat') playHihat(ctx);
    if (type === 'synth') playSynth(ctx);
    if (type === 'error') playError(ctx);
    if (type === 'win') playWin(ctx);
  }, [getCtx]);
}

function randomPadId() { return Math.floor(Math.random() * 4); }

function GlowText({ children, color, size = 16, style = {} }) {
  return (
    <p style={{
      margin: 0, color, fontSize: size,
      fontFamily: '"Orbitron", "JetBrains Mono", monospace',
      letterSpacing: 2,
      textShadow: `0 0 10px ${color}, 0 0 24px ${color}55`,
      textAlign: 'center', lineHeight: 1.4, ...style,
    }}>{children}</p>
  );
}

function Overlay({ children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(6,18,31,0.9)', backdropFilter: 'blur(4px)',
      padding: 24, gap: 10, zIndex: 10,
    }}>{children}</div>
  );
}

function NeonButton({ children, onClick, color = COLORS.cyan, disabled, type = 'button', style = {}, testId }) {
  return (
    <button
      onClick={onClick} disabled={disabled} type={type} data-testid={testId}
      style={{
        marginTop: 12, padding: '10px 28px', background: 'transparent',
        border: `1.5px solid ${color}`, borderRadius: 6, color,
        fontSize: 13, fontFamily: '"Orbitron", monospace', letterSpacing: 3,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        boxShadow: `0 0 12px ${color}33`, transition: 'all 0.18s', ...style,
      }}
    >{children}</button>
  );
}

function NeonInput({ placeholder, value, onChange, type = 'text', testId, required }) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} required={required}
      onChange={(e) => onChange(e.target.value)} data-testid={testId}
      style={{
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.cyan}55`,
        borderRadius: 5, padding: '8px 12px', color: COLORS.white, fontSize: 12,
        fontFamily: '"JetBrains Mono", monospace', letterSpacing: 1, outline: 'none',
        width: '100%', boxSizing: 'border-box',
      }}
    />
  );
}

function DrumPad({ pad, lit, pressed, onClick }) {
  const isActive = lit || pressed;
  return (
    <button
      onPointerDown={onClick}
      data-testid={`pad-${pad.id}`}
      style={{
        position: 'relative', width: '100%', aspectRatio: '1',
        background: isActive
          ? `radial-gradient(circle at 40% 35%, ${pad.color}44 0%, ${pad.color}11 70%)`
          : 'rgba(255,255,255,0.03)',
        border: `${isActive ? 2 : 1.5}px solid ${isActive ? pad.color : pad.color + '55'}`,
        borderRadius: 12, cursor: 'pointer',
        transition: 'box-shadow 0.08s, background 0.08s, border 0.08s',
        boxShadow: isActive
          ? `0 0 28px ${pad.shadow}, 0 0 60px ${pad.shadow}55, inset 0 0 20px ${pad.color}18`
          : `0 0 8px ${pad.shadow}22`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, outline: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
      }}
    >
      <span style={{
        fontFamily: '"Orbitron", monospace', fontSize: 11, letterSpacing: 2,
        color: isActive ? pad.color : `${pad.color}88`,
        textShadow: isActive ? `0 0 8px ${pad.color}` : 'none',
      }}>{pad.label}</span>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
        color: `${COLORS.white}44`,
      }}>[{pad.id + 1}]</span>
    </button>
  );
}

export default function MemorySequence({ onGameOver }) {
  const playPad = useAudioEngine();
  const { isRegistered, registration, registerLead } = useRegistration();

  const [phase, setPhase] = useState('idle');
  const [sequence, setSequence] = useState([]);
  const [round, setRound] = useState(0);
  const [inputIdx, setInputIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [litPad, setLitPad] = useState(null);
  const [pressedPad, setPressedPad] = useState(null);
  const [message, setMessage] = useState('');
  const [streak, setStreak] = useState(0);

  const [leadForm, setLeadForm] = useState({ nickname: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const playSequence = useCallback(async (seq, level) => {
    setPhase('watching');
    setMessage('OBSERVE A BATIDA...');
    const speed = LEVEL_SPEED(level);
    await new Promise((r) => setTimeout(r, 600));
    for (let i = 0; i < seq.length; i++) {
      const pad = PADS[seq[i]];
      setLitPad(seq[i]);
      playPad(pad.type);
      await new Promise((r) => setTimeout(r, FLASH_MS));
      setLitPad(null);
      await new Promise((r) => setTimeout(r, speed - FLASH_MS));
    }
    setPhase('input');
    setMessage('SUA VEZ — REPITA!');
    setInputIdx(0);
  }, [playPad]);

  const startGame = useCallback(() => {
    const firstSeq = [randomPadId()];
    setSequence(firstSeq);
    setRound(1); setScore(0); setLives(3); setStreak(0);
    setSubmitted(false); setFormError(''); setInputIdx(0);
    playSequence(firstSeq, 1);
  }, [playSequence]);

  const handlePadPress = useCallback((padId) => {
    if (phase !== 'input') return;
    setPressedPad(padId);
    setTimeout(() => setPressedPad(null), 160);
    playPad(PADS[padId].type);
    const expected = sequence[inputIdx];
    if (padId !== expected) {
      playPad('error');
      setPhase('wrong');
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      setMessage(newLives > 0 ? `BATIDA ERRADA! ${newLives} VIDAS` : 'GAME OVER');
      setTimeout(() => {
        if (newLives <= 0) { setPhase('gameover'); onGameOver?.(score); }
        else { playSequence(sequence, round); }
      }, 1200);
      return;
    }
    const nextIdx = inputIdx + 1;
    if (nextIdx === sequence.length) {
      const newStreak = streak + 1;
      const bonus = newStreak >= 3 ? 2 : 1;
      const pts = sequence.length * 10 * bonus;
      const newScore = score + pts;
      setStreak(newStreak); setScore(newScore); setPhase('correct');
      playPad('win');
      setMessage(newStreak >= 3 ? `🔥 STREAK x${newStreak}! +${pts} PTS` : `✓ ROUND ${round} +${pts} PTS`);
      setTimeout(() => {
        const newSeq = [...sequence, randomPadId()];
        const newRound = round + 1;
        setSequence(newSeq); setRound(newRound);
        playSequence(newSeq, newRound);
      }, 1100);
    } else {
      setInputIdx(nextIdx);
    }
  }, [phase, sequence, inputIdx, lives, score, round, streak, playPad, playSequence, onGameOver]);

  useEffect(() => {
    const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
    const onKey = (e) => { if (map[e.key] !== undefined) handlePadPress(map[e.key]); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePadPress]);

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!leadForm.nickname.trim()) { setFormError('Nickname obrigatório.'); return; }
    if (!leadForm.email.trim())    { setFormError('Email obrigatório.'); return; }
    if (!leadForm.phone.trim())    { setFormError('Telefone obrigatório.'); return; }
    setSubmitting(true);
    try {
      await registerLead({ ...leadForm, score, game: 'memory-sequence' });
      setSubmitted(true);
    } catch (err) {
      setFormError(err?.message || 'Falha ao enviar.');
    } finally { setSubmitting(false); }
  };

  const logExistingScore = async () => {
    if (!registration) return;
    setSubmitting(true);
    try {
      await registerLead({
        nickname: registration.nickname,
        email: registration.email,
        phone: registration.phone,
        score, game: 'memory-sequence',
      });
      setSubmitted(true);
    } catch (err) { setFormError(err?.message || 'Falha'); }
    finally { setSubmitting(false); }
  };

  const statusColor =
    phase === 'correct' ? COLORS.acid :
    phase === 'wrong'   ? COLORS.magenta :
    phase === 'watching'? COLORS.cyan :
    phase === 'input'   ? COLORS.acid : COLORS.white;

  const mustRegister = phase === 'gameover' && !isRegistered && score > 0;

  return (
    <div data-testid="memory-root" style={{
      position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto',
      borderRadius: 16, overflow: 'hidden',
      border: `1.5px solid ${COLORS.cyan}`,
      boxShadow: `0 0 40px rgba(34,224,245,0.4), 0 0 80px rgba(34,224,245,0.18)`,
      background: COLORS.bg, fontFamily: '"JetBrains Mono", monospace', userSelect: 'none',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${COLORS.grid} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(60% 40% at 50% 20%, rgba(34,224,245,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', padding: '18px 20px 12px',
        borderBottom: `1px solid rgba(34,224,245,0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <GlowText color={COLORS.cyan} size={15} style={{ textAlign: 'left', letterSpacing: 3 }}>MEMORY SEQUENCE</GlowText>
          <p style={{ margin: '2px 0 0', fontSize: 10, letterSpacing: 2, color: `${COLORS.orange}99` }}>DJ CHALLENGE</p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}55` }}>SCORE</p>
            <GlowText color={COLORS.cyan} size={16}>{String(score).padStart(5, '0')}</GlowText>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}55` }}>LIVES</p>
            <GlowText color={COLORS.magenta} size={14} style={{ letterSpacing: 4 }}>
              {'♥'.repeat(Math.max(0, lives))}{'♡'.repeat(Math.max(0, 3 - lives))}
            </GlowText>
          </div>
        </div>
      </div>

      <div style={{
        position: 'relative', padding: '10px 20px', minHeight: 40,
        borderBottom: `1px solid rgba(34,224,245,0.18)`,
      }}>
        <GlowText color={statusColor} size={11} style={{ textAlign: 'left', letterSpacing: 2 }}>
          {message || (phase === 'idle' ? 'PRESSIONE START' : `ROUND ${round}`)}
        </GlowText>
      </div>

      {sequence.length > 0 && phase !== 'idle' && (
        <div style={{
          position: 'relative', padding: '8px 20px',
          display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center',
          borderBottom: `1px solid rgba(34,224,245,0.15)`, minHeight: 28,
        }}>
          {sequence.map((padId, i) => {
            const pad = PADS[padId];
            const done = phase === 'input' && i < inputIdx;
            const current = phase === 'input' && i === inputIdx;
            const shown = phase === 'watching';
            return (
              <div key={i} style={{
                width: 9, height: 9, borderRadius: '50%',
                background: (done || shown) ? pad.color : current ? `${pad.color}88` : `${pad.color}22`,
                boxShadow: (done || shown) ? `0 0 6px ${pad.color}` : current ? `0 0 10px ${pad.color}` : 'none',
                transition: 'all 0.15s',
              }} />
            );
          })}
          {phase === 'input' && (
            <span style={{ marginLeft: 8, fontSize: 10, color: `${COLORS.white}55` }}>{inputIdx}/{sequence.length}</span>
          )}
        </div>
      )}

      <div style={{
        position: 'relative', display: 'grid',
        gridTemplateColumns: '1fr 1fr', gap: 12, padding: 16,
      }}>
        {PADS.map((pad) => (
          <DrumPad
            key={pad.id} pad={pad}
            lit={litPad === pad.id}
            pressed={pressedPad === pad.id}
            onClick={() => handlePadPress(pad.id)}
          />
        ))}
      </div>

      {phase === 'idle' && (
        <Overlay>
          <GlowText color={COLORS.cyan} size={22}>MEMORY SEQUENCE</GlowText>
          <GlowText color={COLORS.orange} size={11} style={{ marginTop: 2 }}>O DESAFIO DO DJ</GlowText>
          <div style={{ margin: '14px 0 4px', padding: '12px 18px', border: `1px solid rgba(34,224,245,0.3)`, borderRadius: 8, maxWidth: 280 }}>
            <div style={{ fontSize: 11, color: `${COLORS.white}aa`, lineHeight: 1.6 }}>
              Observe a sequência de batidas → repita na ordem correta.<br />
              Cada round adiciona +1 batida.<br />
              <span style={{ color: COLORS.acid }}>Streak x3+ = bônus 2x pontos.</span>
            </div>
          </div>
          <NeonButton onClick={startGame} color={COLORS.cyan} testId="memory-start">START DJ SET</NeonButton>
        </Overlay>
      )}

      {phase === 'gameover' && (
        <Overlay>
          <GlowText color={COLORS.magenta} size={26}>GAME OVER</GlowText>
          <GlowText color={COLORS.white} size={11} style={{ opacity: 0.6 }}>ROUND {round} · {String(score).padStart(5, '0')} PTS</GlowText>

          {!submitted ? (
            !isRegistered ? (
              <>
                <div style={{
                  marginTop: 14, padding: '8px 14px', border: `1px solid ${COLORS.orange}55`,
                  background: `${COLORS.orange}10`, borderRadius: 6, maxWidth: 280, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: COLORS.orange, letterSpacing: 2 }}>🔒 CADASTRO OBRIGATÓRIO</div>
                  <div style={{ fontSize: 11, color: `${COLORS.white}aa`, marginTop: 4 }}>
                    Cadastre-se grátis para entrar no leaderboard e jogar livremente.
                  </div>
                </div>
                <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 260, marginTop: 8 }}>
                  <NeonInput placeholder="NICKNAME *" value={leadForm.nickname} onChange={(v) => setLeadForm((f) => ({ ...f, nickname: v }))} testId="mem-nickname" required />
                  <NeonInput placeholder="EMAIL *" type="email" value={leadForm.email} onChange={(v) => setLeadForm((f) => ({ ...f, email: v }))} testId="mem-email" required />
                  <NeonInput placeholder="WHATSAPP (+55...) *" value={leadForm.phone} onChange={(v) => setLeadForm((f) => ({ ...f, phone: v }))} testId="mem-phone" required />
                  {formError && <span style={{ color: COLORS.magenta, fontSize: 11, textAlign: 'center' }}>{formError}</span>}
                  <NeonButton type="submit" color={COLORS.cyan} disabled={submitting} testId="mem-submit">
                    {submitting ? 'ENVIANDO...' : 'CADASTRAR'}
                  </NeonButton>
                </form>
              </>
            ) : (
              <>
                <GlowText color={COLORS.acid} size={12} style={{ marginTop: 14 }}>
                  Olá, {registration?.nickname?.toUpperCase()}
                </GlowText>
                <NeonButton onClick={logExistingScore} color={COLORS.cyan} disabled={submitting} testId="mem-log-score">
                  {submitting ? 'ENVIANDO...' : 'REGISTRAR SCORE'}
                </NeonButton>
                <NeonButton onClick={startGame} color={COLORS.orange} style={{ marginTop: 6 }}>JOGAR DE NOVO</NeonButton>
              </>
            )
          ) : (
            <>
              <GlowText color={COLORS.acid} size={13} style={{ marginTop: 12 }}>✓ Score registrado!</GlowText>
              <NeonButton onClick={startGame} color={COLORS.cyan} style={{ marginTop: 8 }}>JOGAR DE NOVO</NeonButton>
            </>
          )}

          {!mustRegister && isRegistered && submitted && (
            <NeonButton onClick={startGame} color={COLORS.cyan}>JOGAR DE NOVO</NeonButton>
          )}
        </Overlay>
      )}
    </div>
  );
}

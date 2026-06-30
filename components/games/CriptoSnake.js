'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRegistration } from '@/components/layout/RegistrationProvider';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  bg:          '#06121F',
  ultraviolet: '#4F1487',
  acidGreen:   '#CCFF00',
  cyan:        '#22E0F5',
  magenta:     '#FF007A',
  orange:      '#FF9416',
  white:       '#E8F4FF',
  grid:        'rgba(34,224,245,0.12)',
};

const CELL        = 22;
const COLS        = 26;
const ROWS        = 22;
const W           = COLS * CELL;
const H           = ROWS * CELL;
const BASE_SPEED  = 140;
const MIN_SPEED   = 55;
const SPEED_STEP  = 4;

const TOKENS = [
  { symbol: '₿',  label: 'BTC',  color: '#F7931A', shadow: 'rgba(247,147,26,0.7)',  pts: 10 },
  { symbol: 'Ξ',  label: 'ETH',  color: '#22E0F5', shadow: 'rgba(34,224,245,0.7)',  pts: 15 },
  { symbol: '◎',  label: 'SOL',  color: '#9945FF', shadow: 'rgba(153,69,255,0.7)',  pts: 12 },
  { symbol: '●',  label: 'BNB',  color: '#F0B90B', shadow: 'rgba(240,185,11,0.7)',  pts: 8  },
  { symbol: '⬡',  label: 'MATIC',color: '#8247E5', shadow: 'rgba(130,71,229,0.7)',  pts: 20 },
  { symbol: '✦',  label: 'PEPE', color: '#FF007A', shadow: 'rgba(255,0,122,0.7)',   pts: 50 },
];

const DIR = { UP: [0,-1], DOWN: [0,1], LEFT: [-1,0], RIGHT: [1,0] };
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

function rnd(n) { return Math.floor(Math.random() * n); }
function cellKey(x, y) { return `${x},${y}`; }

function randomToken(snake) {
  const occupied = new Set(snake.map((s) => cellKey(s[0], s[1])));
  let x, y;
  do { x = rnd(COLS); y = rnd(ROWS); } while (occupied.has(cellKey(x, y)));
  const t = TOKENS[rnd(TOKENS.length)];
  return { x, y, ...t };
}

function randomPowerup(snake, tokens) {
  const occupied = new Set([
    ...snake.map((s) => cellKey(s[0], s[1])),
    ...tokens.map((t) => cellKey(t.x, t.y)),
  ]);
  let x, y;
  do { x = rnd(COLS); y = rnd(ROWS); } while (occupied.has(cellKey(x, y)));
  return { x, y, life: 300, type: 'slow' };
}

function drawGrid(ctx) {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
  }
}

function drawSnake(ctx, snake, tick) {
  const len = snake.length;
  snake.forEach(([cx, cy], i) => {
    const isHead = i === 0;
    const ratio = i / len;
    const px = cx * CELL, py = cy * CELL;
    const pad = isHead ? 1 : 2, r = isHead ? 5 : 3;
    const g = ctx.createLinearGradient(px, py, px + CELL, py + CELL);
    if (isHead) {
      g.addColorStop(0, COLORS.acidGreen); g.addColorStop(1, '#99cc00');
    } else {
      const t = ratio;
      const R = Math.round(34  + (204 - 34)  * (1 - t));
      const G = Math.round(224 + (255 - 224) * (1 - t));
      const B = Math.round(245 + (0   - 245) * (1 - t));
      g.addColorStop(0, `rgb(${R},${G},${B})`);
      g.addColorStop(1, `rgb(${Math.max(0,R-20)},${Math.max(0,G-20)},${Math.max(0,B-20)})`);
    }
    ctx.save();
    ctx.shadowColor = isHead ? COLORS.acidGreen : COLORS.cyan;
    ctx.shadowBlur = isHead ? 14 : 6;
    ctx.fillStyle = g;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, r);
    else ctx.rect(px + pad, py + pad, CELL - pad * 2, CELL - pad * 2);
    ctx.fill();
    if (isHead) {
      ctx.shadowBlur = 0; ctx.fillStyle = COLORS.bg;
      ctx.beginPath();
      ctx.arc(px + CELL * 0.3, py + CELL * 0.32, 2.5, 0, Math.PI * 2);
      ctx.arc(px + CELL * 0.7, py + CELL * 0.32, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.acidGreen;
      const blink = Math.floor(tick / 40) % 8 === 0;
      if (!blink) {
        ctx.beginPath();
        ctx.arc(px + CELL * 0.3, py + CELL * 0.32, 1.2, 0, Math.PI * 2);
        ctx.arc(px + CELL * 0.7, py + CELL * 0.32, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  });
}

function drawToken(ctx, token, tick) {
  const px = token.x * CELL + CELL / 2, py = token.y * CELL + CELL / 2;
  const pulse = 0.85 + 0.15 * Math.sin(tick * 0.07 + token.x + token.y);
  ctx.save();
  ctx.translate(px, py); ctx.scale(pulse, pulse);
  ctx.shadowColor = token.shadow; ctx.shadowBlur = 18;
  ctx.strokeStyle = token.color; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, 0, CELL * 0.42, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = `${token.color}22`;
  ctx.beginPath(); ctx.arc(0, 0, CELL * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 8; ctx.fillStyle = token.color;
  ctx.font = `bold ${CELL * 0.62}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(token.symbol, 0, 1);
  ctx.restore();
}

function drawPowerup(ctx, p, tick) {
  const px = p.x * CELL + CELL / 2, py = p.y * CELL + CELL / 2;
  const spin = tick * 0.04;
  ctx.save();
  ctx.translate(px, py); ctx.rotate(spin);
  ctx.shadowColor = 'rgba(34,224,245,0.8)'; ctx.shadowBlur = 20;
  ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    const a1 = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a1) * CELL * 0.44, Math.sin(a1) * CELL * 0.44);
    ctx.lineTo(Math.cos(a2) * CELL * 0.2, Math.sin(a2) * CELL * 0.2);
    ctx.stroke();
  }
  ctx.fillStyle = `${COLORS.cyan}18`;
  ctx.beginPath(); ctx.arc(0, 0, CELL * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.cyan;
  ctx.font = `${CELL * 0.45}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⚡', 0, 1);
  ctx.restore();
}

function drawParticles(ctx, particles) {
  particles.forEach((p) => {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
}

function drawHUD(ctx, score, length, slowed) {
  ctx.save();
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillStyle = COLORS.acidGreen;
  ctx.shadowColor = COLORS.acidGreen; ctx.shadowBlur = 8;
  ctx.fillText(`SCORE  ${String(score).padStart(6, '0')}`, 10, 18);
  ctx.fillStyle = COLORS.cyan; ctx.shadowColor = COLORS.cyan;
  ctx.fillText(`LEN  ${String(length).padStart(3, '0')}`, 10, 34);
  if (slowed) {
    ctx.fillStyle = COLORS.magenta; ctx.shadowColor = COLORS.magenta; ctx.shadowBlur = 12;
    ctx.fillText('⚡ SLOW MODE', W / 2 - 50, 18);
  }
  ctx.restore();
}

function makeParticles(x, y, color, count = 12) {
  return Array.from({ length: count }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    r: 2 + Math.random() * 4,
    color, life: 30 + Math.random() * 20, maxLife: 50,
  }));
}

function GlowText({ children, color, size = 16, style = {} }) {
  return (
    <p style={{
      margin: 0, color, fontSize: size,
      fontFamily: '"Orbitron", "JetBrains Mono", monospace',
      letterSpacing: 2, textShadow: `0 0 10px ${color}, 0 0 24px ${color}55`,
      textAlign: 'center', lineHeight: 1.4, ...style,
    }}>{children}</p>
  );
}

function Overlay({ children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(6,18,31,0.9)', backdropFilter: 'blur(4px)',
      padding: 24, gap: 8,
    }}>{children}</div>
  );
}

function NeonButton({ children, onClick, color = COLORS.cyan, disabled, type = 'button', testId }) {
  return (
    <button
      onClick={onClick} disabled={disabled} type={type} data-testid={testId}
      style={{
        marginTop: 14, padding: '10px 28px', background: 'transparent',
        border: `1.5px solid ${color}`, borderRadius: 6, color,
        fontSize: 13, fontFamily: '"Orbitron", monospace', letterSpacing: 3,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        boxShadow: `0 0 12px ${color}33`, transition: 'all 0.18s',
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
        borderRadius: 5, padding: '8px 12px', color: COLORS.white,
        fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: 1, outline: 'none', width: '100%', boxSizing: 'border-box',
      }}
    />
  );
}

export default function CriptoSnake({ onGameOver }) {
  const { isRegistered, registration, registerLead } = useRegistration();
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const loopRef = useRef(null);
  const lastTickRef = useRef(0);

  const [phase, setPhase] = useState('idle');
  const [uiScore, setUiScore] = useState(0);
  const [uiLen, setUiLen] = useState(3);
  const [uiHigh, setUiHigh] = useState(0);
  const highRef = useRef(0);

  const [leadForm, setLeadForm] = useState({ nickname: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const initState = useCallback(() => {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    const snake = [[startX, startY], [startX - 1, startY], [startX - 2, startY]];
    return {
      snake, dir: 'RIGHT', nextDir: 'RIGHT',
      tokens: [randomToken(snake)], powerup: null,
      pwTimer: 0, pwActive: 0, particles: [],
      score: 0, speed: BASE_SPEED, tick: 0, phase: 'playing',
    };
  }, []);

  const triggerDeath = useCallback((st, ctx) => {
    st.phase = 'dead';
    const [hx, hy] = st.snake[0];
    st.particles.push(...makeParticles(hx * CELL + CELL / 2, hy * CELL + CELL / 2, COLORS.magenta, 30));
    let flashTick = 0;
    const flashLoop = () => {
      flashTick++;
      ctx.save();
      ctx.fillStyle = `rgba(255,0,122,${Math.max(0, 0.35 - flashTick * 0.015)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      st.particles = st.particles
        .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 }))
        .filter((p) => p.life > 0);
      drawParticles(ctx, st.particles);
      if (flashTick < 28) requestAnimationFrame(flashLoop);
      else {
        setUiScore(st.score);
        setPhase('gameover');
        onGameOver?.(st.score);
      }
    };
    cancelAnimationFrame(loopRef.current);
    requestAnimationFrame(flashLoop);
  }, [onGameOver]);

  const startLoop = useCallback((s) => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    lastTickRef.current = performance.now();
    const frame = (now) => {
      const st = stateRef.current;
      if (!st || st.phase !== 'playing') return;
      st.tick++;
      st.particles = st.particles
        .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1, vx: p.vx * 0.92, vy: p.vy * 0.92 }))
        .filter((p) => p.life > 0);
      st.pwTimer--;
      if (st.pwTimer <= 0 && !st.powerup) {
        if (Math.random() < 0.3) {
          st.powerup = randomPowerup(st.snake, st.tokens);
          st.pwTimer = 600 + rnd(400);
        } else { st.pwTimer = 200 + rnd(300); }
      }
      if (st.powerup) { st.powerup.life--; if (st.powerup.life <= 0) st.powerup = null; }
      if (st.pwActive > 0) st.pwActive--;
      const effectiveSpeed = st.pwActive > 0 ? Math.min(BASE_SPEED, st.speed * 2.2) : st.speed;
      if (now - lastTickRef.current >= effectiveSpeed) {
        lastTickRef.current = now;
        st.dir = st.nextDir;
        const [dx, dy] = DIR[st.dir];
        const [hx, hy] = st.snake[0];
        const nx = hx + dx, ny = hy + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) { triggerDeath(st, ctx); return; }
        const bodySet = new Set(st.snake.slice(1).map(([x, y]) => cellKey(x, y)));
        if (bodySet.has(cellKey(nx, ny))) { triggerDeath(st, ctx); return; }
        st.snake.unshift([nx, ny]);
        let ate = false;
        const tIdx = st.tokens.findIndex((t) => t.x === nx && t.y === ny);
        if (tIdx !== -1) {
          const t = st.tokens[tIdx];
          st.score += t.pts * (st.pwActive > 0 ? 2 : 1);
          ate = true;
          st.particles.push(...makeParticles(nx * CELL + CELL / 2, ny * CELL + CELL / 2, t.color, 14));
          st.tokens.splice(tIdx, 1);
          st.tokens.push(randomToken(st.snake));
          if (Math.random() < 0.35) st.tokens.push(randomToken(st.snake));
          st.speed = Math.max(MIN_SPEED, st.speed - SPEED_STEP);
          setUiScore(st.score); setUiLen(st.snake.length);
          if (st.score > highRef.current) { highRef.current = st.score; setUiHigh(st.score); }
        }
        if (st.powerup && st.powerup.x === nx && st.powerup.y === ny) {
          st.pwActive = 180;
          st.particles.push(...makeParticles(nx * CELL + CELL / 2, ny * CELL + CELL / 2, COLORS.cyan, 20));
          st.powerup = null; ate = true;
        }
        if (!ate) st.snake.pop();
      }
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.save();
      for (let sy = 0; sy < H; sy += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, sy, W, 1);
      }
      ctx.restore();
      drawGrid(ctx);
      ctx.save();
      ctx.strokeStyle = COLORS.cyan; ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 16;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);
      ctx.restore();
      st.tokens.forEach((t) => drawToken(ctx, t, st.tick));
      if (st.powerup) drawPowerup(ctx, st.powerup, st.tick);
      drawSnake(ctx, st.snake, st.tick);
      drawParticles(ctx, st.particles);
      drawHUD(ctx, st.score, st.snake.length, st.pwActive > 0);
      loopRef.current = requestAnimationFrame(frame);
    };
    loopRef.current = requestAnimationFrame(frame);
  }, [triggerDeath]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(loopRef.current);
    const st = initState();
    stateRef.current = st;
    setUiScore(0); setUiLen(3);
    setSubmitted(false); setFormError('');
    setPhase('playing');
    startLoop(st);
  }, [initState, startLoop]);

  useEffect(() => () => cancelAnimationFrame(loopRef.current), []);

  useEffect(() => {
    const VALID = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d']);
    const onKey = (e) => {
      if (!VALID.has(e.key)) return;
      e.preventDefault();
      const st = stateRef.current;
      if (!st || st.phase !== 'playing') return;
      const map = {
        ArrowUp: 'UP', w: 'UP', ArrowDown: 'DOWN', s: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', ArrowRight: 'RIGHT', d: 'RIGHT',
      };
      const next = map[e.key];
      if (next && OPPOSITE[next] !== st.dir) st.nextDir = next;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const touchStart = useRef(null);
  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const st = stateRef.current;
    if (!st || st.phase !== 'playing') return;
    let next;
    if (Math.abs(dx) > Math.abs(dy)) next = dx > 0 ? 'RIGHT' : 'LEFT';
    else next = dy > 0 ? 'DOWN' : 'UP';
    if (OPPOSITE[next] !== st.dir) st.nextDir = next;
    touchStart.current = null;
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!leadForm.nickname.trim()) { setFormError('Nickname obrigatório.'); return; }
    if (!leadForm.email.trim()) { setFormError('Email obrigatório.'); return; }
    if (!leadForm.phone.trim()) { setFormError('Telefone obrigatório.'); return; }
    setSubmitting(true);
    try {
      await registerLead({ ...leadForm, score: uiScore, game: 'cripto-snake' });
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
        nickname: registration.nickname, email: registration.email,
        phone: registration.phone, score: uiScore, game: 'cripto-snake',
      });
      setSubmitted(true);
    } catch (err) { setFormError(err?.message || 'Falha'); }
    finally { setSubmitting(false); }
  };

  return (
    <div data-testid="criptosnake-root" style={{
      position: 'relative', width: '100%', maxWidth: W, margin: '0 auto',
      borderRadius: 12, overflow: 'hidden',
      border: `1.5px solid ${COLORS.cyan}`,
      boxShadow: `0 0 40px rgba(34,224,245,0.45), 0 0 80px rgba(34,224,245,0.2)`,
      background: COLORS.bg, fontFamily: '"JetBrains Mono", monospace', userSelect: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: `1px solid rgba(34,224,245,0.3)`,
        background: 'rgba(6,18,31,0.6)',
      }}>
        <GlowText color={COLORS.acidGreen} size={14} style={{ letterSpacing: 4, textAlign: 'left' }}>CRIPTO SNAKE</GlowText>
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>SCORE</p>
            <GlowText color={COLORS.acidGreen} size={15}>{String(uiScore).padStart(6,'0')}</GlowText>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>BEST</p>
            <GlowText color={COLORS.cyan} size={15}>{String(uiHigh).padStart(6,'0')}</GlowText>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>LEN</p>
            <GlowText color={COLORS.orange} size={15}>{String(uiLen).padStart(3,'0')}</GlowText>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
        <canvas
          ref={canvasRef} width={W} height={H}
          style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none' }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        />

        {phase === 'idle' && (
          <Overlay>
            <GlowText color={COLORS.acidGreen} size={26}>CRIPTO SNAKE</GlowText>
            <GlowText color={COLORS.cyan} size={11} style={{ marginTop: 4, opacity: 0.8 }}>WEB3 TOKEN COLLECTOR</GlowText>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              {TOKENS.map((t) => (
                <div key={t.label} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: `${t.color}0f`, border: `1px solid ${t.color}55`,
                  borderRadius: 6, padding: '4px 8px',
                }}>
                  <span style={{ fontSize: 14, color: t.color, textShadow: `0 0 8px ${t.color}` }}>{t.symbol}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: t.color, fontFamily: '"Orbitron", monospace' }}>{t.label}</p>
                    <p style={{ margin: 0, fontSize: 9, color: `${COLORS.white}66` }}>{t.pts} pts</p>
                  </div>
                </div>
              ))}
            </div>
            <GlowText color={COLORS.white} size={10} style={{ marginTop: 8, opacity: 0.5 }}>
              ↑ ↓ ← → / WASD · swipe no mobile
            </GlowText>
            <NeonButton onClick={startGame} color={COLORS.acidGreen} testId="snake-start">PLAY NOW</NeonButton>
          </Overlay>
        )}

        {phase === 'gameover' && (
          <Overlay>
            <GlowText color={COLORS.magenta} size={28}>REKT</GlowText>
            <GlowText color={COLORS.white} size={11} style={{ opacity: 0.6, marginTop: 2 }}>
              YOUR SNAKE HAS BEEN LIQUIDATED
            </GlowText>
            <GlowText color={COLORS.acidGreen} size={22} style={{ marginTop: 6 }}>
              {String(uiScore).padStart(6, '0')} PTS
            </GlowText>

            {!submitted ? (
              !isRegistered ? (
                <>
                  <div style={{
                    marginTop: 12, padding: '8px 14px', borderRadius: 6,
                    border: `1px solid ${COLORS.orange}55`, background: `${COLORS.orange}10`,
                    maxWidth: 280, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: COLORS.orange, letterSpacing: 2 }}>🔒 CADASTRO OBRIGATÓRIO</div>
                    <div style={{ fontSize: 11, color: `${COLORS.white}aa`, marginTop: 4 }}>
                      Cadastre-se grátis e tenha acesso livre.
                    </div>
                  </div>
                  <form onSubmit={handleLeadSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', maxWidth: 260, marginTop: 8 }}>
                    <NeonInput placeholder="NICKNAME *" value={leadForm.nickname}
                      onChange={(v) => setLeadForm((f) => ({ ...f, nickname: v }))}
                      testId="snake-nickname" required />
                    <NeonInput placeholder="EMAIL *" type="email" value={leadForm.email}
                      onChange={(v) => setLeadForm((f) => ({ ...f, email: v }))}
                      testId="snake-email" required />
                    <NeonInput placeholder="WHATSAPP (+55...) *" value={leadForm.phone}
                      onChange={(v) => setLeadForm((f) => ({ ...f, phone: v }))}
                      testId="snake-phone" required />
                    {formError && <span style={{ color: COLORS.magenta, fontSize: 11, textAlign: 'center' }}>{formError}</span>}
                    <NeonButton type="submit" disabled={submitting} color={COLORS.acidGreen} testId="snake-submit">
                      {submitting ? 'ENVIANDO...' : 'CADASTRAR'}
                    </NeonButton>
                  </form>
                </>
              ) : (
                <>
                  <GlowText color={COLORS.acidGreen} size={12} style={{ marginTop: 10 }}>
                    Olá, {registration?.nickname?.toUpperCase()}
                  </GlowText>
                  <NeonButton onClick={logExistingScore} color={COLORS.cyan} disabled={submitting} testId="snake-log">
                    {submitting ? 'ENVIANDO...' : 'REGISTRAR SCORE'}
                  </NeonButton>
                  <button onClick={startGame} style={{
                    marginTop: 6, background: 'none', border: 'none',
                    color: `${COLORS.white}44`, fontSize: 11, cursor: 'pointer',
                  }}>pular → jogar de novo</button>
                </>
              )
            ) : (
              <>
                <GlowText color={COLORS.acidGreen} size={13} style={{ marginTop: 10 }}>✓ Score registrado!</GlowText>
                <NeonButton onClick={startGame} color={COLORS.acidGreen}>PLAY AGAIN</NeonButton>
              </>
            )}
          </Overlay>
        )}
      </div>

      {/* Mobile D-pad */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 0 14px', gap: 4,
        borderTop: `1px solid rgba(34,224,245,0.2)`,
      }}>
        <DpadButton label="▲" onClick={() => { const st = stateRef.current; if (st && OPPOSITE['UP'] !== st.dir) st.nextDir = 'UP'; }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <DpadButton label="◀" onClick={() => { const st = stateRef.current; if (st && OPPOSITE['LEFT'] !== st.dir) st.nextDir = 'LEFT'; }} />
          <div style={{ width: 44, height: 44 }} />
          <DpadButton label="▶" onClick={() => { const st = stateRef.current; if (st && OPPOSITE['RIGHT'] !== st.dir) st.nextDir = 'RIGHT'; }} />
        </div>
        <DpadButton label="▼" onClick={() => { const st = stateRef.current; if (st && OPPOSITE['DOWN'] !== st.dir) st.nextDir = 'DOWN'; }} />
      </div>
    </div>
  );
}

function DpadButton({ label, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onPointerDown={() => { setPressed(true); onClick(); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: 44, height: 44,
        background: pressed ? 'rgba(34,224,245,0.35)' : 'rgba(34,224,245,0.1)',
        border: `1.5px solid ${pressed ? COLORS.cyan : 'rgba(34,224,245,0.4)'}`,
        borderRadius: 8,
        color: pressed ? COLORS.acidGreen : `${COLORS.white}88`,
        fontSize: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.08s',
        boxShadow: pressed ? `0 0 12px rgba(34,224,245,0.5)` : 'none',
        userSelect: 'none', WebkitTapHighlightColor: 'transparent',
      }}
    >{label}</button>
  );
}

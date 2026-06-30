'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRegistration } from '@/components/layout/RegistrationProvider';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  bg:        '#06121F',
  ultraviolet: '#4F1487',
  acidGreen: '#CCFF00',
  cyan:      '#22E0F5',
  orange:    '#FF9416',
  magenta:   '#FF007A',
  white:     '#E8F4FF',
  dimWhite:  'rgba(232,244,255,0.15)',
};

const PLAYER_SPEED   = 5;
const BULLET_SPEED   = 10;
const ENEMY_BULLET_SPEED = 3.5;
const ENEMY_ROWS     = 3;
const ENEMY_COLS     = 9;
const ENEMY_W        = 36;
const ENEMY_H        = 28;
const ENEMY_PAD_X    = 18;
const ENEMY_PAD_Y    = 22;
const PLAYER_W       = 44;
const PLAYER_H       = 36;
const LIVES_START    = 3;
const WAVE_DESCEND   = 28;
const FIRE_COOLDOWN  = 280;
const ENEMY_FIRE_RATE = 0.0012;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function neonShadow(ctx, color, blur = 14) { ctx.shadowColor = color; ctx.shadowBlur = blur; }

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawShip(ctx, x, y, w, h, color) {
  ctx.save();
  neonShadow(ctx, color, 18);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.fillStyle = `${color}22`;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h * 0.65);
  ctx.lineTo(x + w * 0.75, y + h);
  ctx.lineTo(x + w * 0.25, y + h);
  ctx.lineTo(x, y + h * 0.65);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.42, w * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.25, y + h * 0.7);
  ctx.lineTo(x - w * 0.18, y + h);
  ctx.lineTo(x + w * 0.2, y + h);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.75, y + h * 0.7);
  ctx.lineTo(x + w * 1.18, y + h);
  ctx.lineTo(x + w * 0.8, y + h);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawEnemy(ctx, x, y, w, h, type, tick) {
  const palette = [COLORS.magenta, COLORS.cyan, COLORS.orange];
  const color = palette[type % palette.length];
  const pulse = 1 + 0.08 * Math.sin(tick * 0.05 + type);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(pulse, pulse);
  neonShadow(ctx, color, 16);
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.fillStyle = `${color}18`;
  if (type === 0) {
    ctx.beginPath();
    ctx.moveTo(0, -h / 2); ctx.lineTo(w / 2, 0); ctx.lineTo(0, h / 2); ctx.lineTo(-w / 2, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-w * 0.2, -h * 0.08, w * 0.12, h * 0.12);
    ctx.fillRect(w * 0.08, -h * 0.08, w * 0.12, h * 0.12);
  } else if (type === 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.42, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(side * w * 0.38, -h * 0.1);
      ctx.lineTo(side * w * 0.65, -h * 0.38);
      ctx.lineTo(side * w * 0.55, -h * 0.1);
      ctx.stroke();
    });
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w * 0.22, h * 0.25);
      ctx.lineTo(i * w * 0.32, h * 0.5);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const r = w * 0.44;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
  ctx.restore();
}

function drawBullet(ctx, b, isEnemy) {
  ctx.save();
  const color = isEnemy ? COLORS.magenta : COLORS.acidGreen;
  neonShadow(ctx, color, 12);
  ctx.fillStyle = color;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(b.x - 2, b.y, 4, isEnemy ? 12 : 14, 2);
  else ctx.rect(b.x - 2, b.y, 4, isEnemy ? 12 : 14);
  ctx.fill();
  ctx.restore();
}

function drawStars(ctx, stars) {
  stars.forEach((s) => {
    ctx.globalAlpha = s.a; ctx.fillStyle = COLORS.white;
    ctx.fillRect(s.x, s.y, s.r, s.r);
  });
  ctx.globalAlpha = 1;
}

function drawExplosion(ctx, ex) {
  const ratio = ex.life / ex.maxLife;
  ex.particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = ratio * 0.9;
    neonShadow(ctx, p.color, 10);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(ex.x + p.vx * (1 - ratio) * 28, ex.y + p.vy * (1 - ratio) * 28, p.r * ratio, 0, Math.PI * 2);
    ctx.fill(); ctx.restore();
  });
}

function drawHUD(ctx, W, score, lives, wave) {
  ctx.save();
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillStyle = COLORS.cyan;
  neonShadow(ctx, COLORS.cyan, 8);
  ctx.fillText(`SCORE  ${String(score).padStart(6, '0')}`, 16, 24);
  ctx.fillText(`WAVE   ${wave}`, 16, 44);
  ctx.fillStyle = COLORS.orange;
  neonShadow(ctx, COLORS.orange, 8);
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES  ${'♥ '.repeat(lives).trim()}`, W - 16, 24);
  ctx.restore();
}

function makeStars(W, H, count = 80) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() < 0.15 ? 2 : 1,
    a: 0.2 + Math.random() * 0.7,
    speed: 0.2 + Math.random() * 0.5,
  }));
}

function makeEnemies(W) {
  const offsetX = (W - (ENEMY_COLS * (ENEMY_W + ENEMY_PAD_X))) / 2 + 20;
  const enemies = [];
  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      enemies.push({
        x: offsetX + col * (ENEMY_W + ENEMY_PAD_X),
        y: 60 + row * (ENEMY_H + ENEMY_PAD_Y),
        w: ENEMY_W, h: ENEMY_H, type: row, alive: true,
      });
    }
  }
  return enemies;
}

function makeExplosion(x, y, color) {
  return {
    x, y, life: 30, maxLife: 30,
    particles: Array.from({ length: 10 }, () => ({
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      r: 3 + Math.random() * 5,
      color,
    })),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CyberGalaga({ onGameOver, leaderboard = [] }) {
  const { isRegistered, registration, registerLead } = useRegistration();
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const keysRef = useRef({});
  const touchRef = useRef(null);

  const [phase, setPhase] = useState('idle');
  const [uiScore, setUiScore] = useState(0);
  const [leadForm, setLeadForm] = useState({ nickname: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const initState = useCallback((W, H) => ({
    W, H, tick: 0, score: 0, lives: LIVES_START, wave: 1, phase: 'playing',
    player: { x: W / 2 - PLAYER_W / 2, y: H - PLAYER_H - 24, w: PLAYER_W, h: PLAYER_H, invincible: 0 },
    bullets: [], enemyBullets: [], enemies: makeEnemies(W),
    stars: makeStars(W, H), explosions: [],
    enemyDir: 1, enemySpeed: 1.1, lastFire: 0,
  }), []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    stateRef.current = initState(canvas.width, canvas.height);
    setUiScore(0); setSubmitted(false); setFormError(''); setPhase('playing');
  }, [initState]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const loop = (timestamp) => {
      const s = stateRef.current; if (!s || s.phase !== 'playing') return;
      const { W, H } = s; s.tick++;
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) s.player.x = Math.max(0, s.player.x - PLAYER_SPEED);
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) s.player.x = Math.min(W - s.player.w, s.player.x + PLAYER_SPEED);
      if (keysRef.current[' '] || keysRef.current['z']) {
        if (timestamp - s.lastFire > FIRE_COOLDOWN) {
          s.bullets.push({ x: s.player.x + s.player.w / 2, y: s.player.y });
          s.lastFire = timestamp;
        }
      }
      if (touchRef.current !== null) {
        s.player.x = Math.min(W - s.player.w, Math.max(0, touchRef.current - s.player.w / 2));
      }
      s.stars.forEach((st) => { st.y += st.speed; if (st.y > H) { st.y = 0; st.x = Math.random() * W; } });
      s.bullets = s.bullets.map((b) => ({ ...b, y: b.y - BULLET_SPEED })).filter((b) => b.y > -20);
      s.enemyBullets = s.enemyBullets.map((b) => ({ ...b, y: b.y + ENEMY_BULLET_SPEED })).filter((b) => b.y < H + 20);
      const alive = s.enemies.filter((e) => e.alive);
      alive.forEach((e) => { e.x += s.enemyDir * s.enemySpeed; });
      if (alive.length > 0) {
        const rightmost = Math.max(...alive.map((e) => e.x + e.w));
        const leftmost = Math.min(...alive.map((e) => e.x));
        if (rightmost >= W - 8 || leftmost <= 8) {
          s.enemyDir *= -1;
          alive.forEach((e) => { e.y += WAVE_DESCEND; });
        }
      }
      alive.forEach((e) => {
        if (Math.random() < ENEMY_FIRE_RATE) s.enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h });
      });
      s.bullets.forEach((b) => {
        if (b.hit) return;
        s.enemies.forEach((e) => {
          if (!e.alive || b.hit) return;
          if (rectsCollide({ x: b.x - 2, y: b.y, w: 4, h: 14 }, e)) {
            e.alive = false; b.hit = true;
            const pts = e.type === 2 ? 50 : e.type === 1 ? 30 : 10;
            s.score += pts * s.wave;
            const pal = [COLORS.magenta, COLORS.cyan, COLORS.orange];
            s.explosions.push(makeExplosion(e.x + e.w / 2, e.y + e.h / 2, pal[e.type % 3]));
          }
        });
      });
      s.bullets = s.bullets.filter((b) => !b.hit);
      if (s.player.invincible <= 0) {
        s.enemyBullets.forEach((b) => {
          if (b.hit) return;
          if (rectsCollide({ x: b.x - 2, y: b.y, w: 4, h: 12 }, s.player)) {
            b.hit = true; s.lives--; s.player.invincible = 90;
            s.explosions.push(makeExplosion(s.player.x + s.player.w / 2, s.player.y, COLORS.acidGreen));
          }
        });
        s.enemyBullets = s.enemyBullets.filter((b) => !b.hit);
      } else {
        s.player.invincible--;
      }
      alive.forEach((e) => { if (e.y + e.h >= s.player.y + 10) s.lives = 0; });
      s.explosions = s.explosions.map((ex) => ({ ...ex, life: ex.life - 1 })).filter((ex) => ex.life > 0);
      const remaining = s.enemies.filter((e) => e.alive);
      if (remaining.length === 0) {
        s.wave++;
        s.enemySpeed = Math.min(3.5, 1.1 + (s.wave - 1) * 0.25);
        s.enemies = makeEnemies(W);
        s.enemyBullets = [];
      }
      if (s.lives <= 0) {
        s.phase = 'gameover';
        setUiScore(s.score);
        setPhase('gameover');
        onGameOver?.(s.score);
      }
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.strokeStyle = 'rgba(34,224,245,0.12)'; ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      ctx.restore();
      drawStars(ctx, s.stars);
      s.enemies.forEach((e) => { if (e.alive) drawEnemy(ctx, e.x, e.y, e.w, e.h, e.type, s.tick); });
      s.enemyBullets.forEach((b) => drawBullet(ctx, b, true));
      const showPlayer = s.player.invincible <= 0 || Math.floor(s.tick / 5) % 2 === 0;
      if (showPlayer) drawShip(ctx, s.player.x, s.player.y, s.player.w, s.player.h, COLORS.acidGreen);
      s.bullets.forEach((b) => drawBullet(ctx, b, false));
      s.explosions.forEach((ex) => drawExplosion(ctx, ex));
      drawHUD(ctx, W, s.score, Math.max(0, s.lives), s.wave);
      if (s.phase === 'playing') rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onGameOver]);

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if ([' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const handleTouchMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    touchRef.current = (e.touches[0].clientX - rect.left) * scaleX;
  };
  const handleTouchEnd = () => { touchRef.current = null; };
  const handleTouchStart = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    touchRef.current = (e.touches[0].clientX - rect.left) * scaleX;
    if (stateRef.current) {
      const s = stateRef.current;
      s.bullets.push({ x: s.player.x + s.player.w / 2, y: s.player.y });
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!leadForm.nickname.trim()) { setFormError('Nickname é obrigatório.'); return; }
    if (!leadForm.email.trim()) { setFormError('Email é obrigatório.'); return; }
    if (!leadForm.phone.trim()) { setFormError('Telefone é obrigatório.'); return; }
    setSubmitting(true);
    try {
      await registerLead({ ...leadForm, score: uiScore, game: 'cyber-galaga' });
      setSubmitted(true);
    } catch (err) {
      setFormError(err?.message || 'Erro de rede. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const logExistingScore = async () => {
    if (!registration) return;
    setSubmitting(true);
    try {
      await registerLead({
        nickname: registration.nickname,
        email: registration.email,
        phone: registration.phone,
        score: uiScore, game: 'cyber-galaga',
      });
      setSubmitted(true);
    } catch (err) { setFormError(err?.message || 'Falha'); }
    finally { setSubmitting(false); }
  };

  useEffect(() => {
    const canvas = canvasRef.current; const wrapper = canvas.parentElement;
    let timeout;
    const resize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }, 60);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrapper);
    return () => { ro.disconnect(); clearTimeout(timeout); };
  }, []);

  return (
    <div
      data-testid="cybergalaga-root"
      style={{
        position: 'relative', width: '100%', maxWidth: 720, margin: '0 auto', aspectRatio: '4/3',
        borderRadius: 12, overflow: 'hidden',
        border: `1.5px solid ${COLORS.cyan}`,
        boxShadow: `0 0 32px rgba(34,224,245,0.4), 0 0 8px rgba(34,224,245,0.25)`,
        background: COLORS.bg, fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {phase === 'idle' && (
        <Overlay>
          <GlowText color={COLORS.cyan} size={28}>CYBER GALAGA</GlowText>
          <GlowText color={COLORS.orange} size={13} style={{ marginTop: 8 }}>
            ← → para mover · ESPAÇO para atirar
          </GlowText>
          <GlowText color={COLORS.white} size={12} style={{ marginTop: 4, opacity: 0.5 }}>
            Mobile: arraste para mover, toque para atirar
          </GlowText>
          {leaderboard.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 10, color: COLORS.white, opacity: 0.65, textAlign: 'center' }}>
              🏆 TOP: <span style={{ color: COLORS.orange }}>{leaderboard[0]?.nickname}</span> · {leaderboard[0]?.score}
            </div>
          )}
          <StartButton onClick={startGame} testId="cybergalaga-start">START GAME</StartButton>
        </Overlay>
      )}

      {phase === 'gameover' && (
        <Overlay>
          <GlowText color={COLORS.magenta} size={30}>GAME OVER</GlowText>
          <GlowText color={COLORS.cyan} size={18} style={{ marginTop: 8 }}>
            SCORE: {String(uiScore).padStart(6, '0')}
          </GlowText>
          {!submitted ? (
            !isRegistered ? (
              <>
                <div style={{
                  marginTop: 12, padding: '8px 14px', border: `1px solid ${COLORS.orange}55`,
                  background: `${COLORS.orange}10`, borderRadius: 6, maxWidth: 280, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: COLORS.orange, letterSpacing: 2 }}>🔒 CADASTRO OBRIGATÓRIO</div>
                  <div style={{ fontSize: 11, color: `${COLORS.white}aa`, marginTop: 4 }}>
                    Cadastre-se grátis e tenha acesso livre a todos os jogos.
                  </div>
                </div>
                <form
                  onSubmit={handleLeadSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', maxWidth: 280, marginTop: 8 }}
                >
                  <NeonInput placeholder="NICKNAME *" value={leadForm.nickname} onChange={(v) => setLeadForm((f) => ({ ...f, nickname: v }))} testId="cg-nickname" required />
                  <NeonInput placeholder="EMAIL *" type="email" value={leadForm.email} onChange={(v) => setLeadForm((f) => ({ ...f, email: v }))} testId="cg-email" required />
                  <NeonInput placeholder="WHATSAPP (+55...) *" value={leadForm.phone} onChange={(v) => setLeadForm((f) => ({ ...f, phone: v }))} testId="cg-phone" required />
                  {formError && <span style={{ color: COLORS.magenta, fontSize: 11, textAlign: 'center' }}>{formError}</span>}
                  <StartButton type="submit" disabled={submitting} testId="cg-submit">
                    {submitting ? 'ENVIANDO...' : 'CADASTRAR'}
                  </StartButton>
                </form>
              </>
            ) : (
              <>
                <GlowText color={COLORS.acidGreen} size={12} style={{ marginTop: 12 }}>
                  Olá, {registration?.nickname?.toUpperCase()}
                </GlowText>
                <StartButton onClick={logExistingScore} disabled={submitting} testId="cg-log-score">
                  {submitting ? 'ENVIANDO...' : 'REGISTRAR SCORE'}
                </StartButton>
                <button
                  onClick={startGame}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: `${COLORS.white}66`, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}
                >
                  pular → jogar de novo
                </button>
              </>
            )
          ) : (
            <>
              <GlowText color={COLORS.cyan} size={14} style={{ marginTop: 16 }}>✓ Score registrado!</GlowText>
              <StartButton onClick={startGame} style={{ marginTop: 16 }}>JOGAR NOVAMENTE</StartButton>
            </>
          )}
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(6,18,31,0.85)', backdropFilter: 'blur(3px)', padding: 24, gap: 4,
    }}>{children}</div>
  );
}

function GlowText({ children, color, size, style }) {
  return (
    <p style={{
      margin: 0, color, fontSize: size,
      fontFamily: '"Orbitron", "JetBrains Mono", monospace',
      letterSpacing: 2,
      textShadow: `0 0 10px ${color}, 0 0 24px ${color}55`,
      textAlign: 'center', ...style,
    }}>{children}</p>
  );
}

function StartButton({ children, onClick, type = 'button', disabled, style, testId }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      style={{
        marginTop: 18, padding: '10px 28px', background: 'transparent',
        border: `1.5px solid ${COLORS.cyan}`, borderRadius: 6,
        color: COLORS.cyan, fontSize: 13, fontFamily: '"Orbitron", monospace',
        letterSpacing: 3, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: `0 0 12px rgba(34,224,245,0.4)`, transition: 'box-shadow 0.2s', ...style,
      }}
    >{children}</button>
  );
}

function NeonInput({ placeholder, value, onChange, type = 'text', testId, required }) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} required={required}
      data-testid={testId}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.cyan}55`,
        borderRadius: 5, padding: '8px 12px', color: COLORS.white, fontSize: 12,
        fontFamily: '"JetBrains Mono", monospace', letterSpacing: 1, outline: 'none',
        width: '100%', boxSizing: 'border-box',
      }}
      onFocus={(e) => { e.target.style.borderColor = COLORS.cyan; }}
      onBlur={(e) => { e.target.style.borderColor = `${COLORS.cyan}55`; }}
    />
  );
}

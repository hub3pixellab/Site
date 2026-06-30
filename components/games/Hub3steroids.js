// /components/games/Hub3steroids.js
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  bg:          '#0b0914',
  ultraviolet: '#4F1487',
  acidGreen:   '#CCFF00',
  cyan:        '#00F0FF',
  magenta:     '#FF007A',
  white:       '#f5f5ff',
  grid:        'rgba(79,20,135,0.12)',
};

const W = 600;
const H = 600;

const SHIP_SIZE       = 16;
const SHIP_THRUST     = 0.18;
const SHIP_FRICTION   = 0.97;
const SHIP_ROTATE     = 0.065;
const BULLET_SPEED    = 9;
const BULLET_LIFE     = 65;
const FIRE_COOLDOWN   = 180;  // ms
const INVINCIBLE_TIME = 180;  // frames
const LIVES_START     = 3;
const QUALIFY_SCORE   = 500;

// Asteroid tiers
const TIERS = [
  { r: 52, pts: 20,  speed: 0.8, label: 'L' },
  { r: 28, pts: 50,  speed: 1.4, label: 'M' },
  { r: 14, pts: 100, speed: 2.2, label: 'S' },
];

// Token types that appear inside asteroids
const TOKENS = [
  { symbol: '₿', color: '#F7931A', pts: 200, label: 'BTC' },
  { symbol: 'Ξ', color: COLORS.cyan, pts: 150, label: 'ETH' },
  { symbol: '◎', color: '#9945FF', pts: 180, label: 'SOL' },
  { symbol: '✦', color: COLORS.magenta, pts: 300, label: 'PEPE' },
];

// ─── Math helpers ─────────────────────────────────────────────────────────────
const TWO_PI  = Math.PI * 2;
function rndRange(a, b) { return a + Math.random() * (b - a); }
function rndSign()      { return Math.random() < 0.5 ? 1 : -1; }

function wrap(val, max) {
  if (val < 0)   return val + max;
  if (val > max) return val - max;
  return val;
}

function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── Shape generators ─────────────────────────────────────────────────────────
function makeAsteroidVerts(r, sides = 10) {
  return Array.from({ length: sides }, (_, i) => {
    const angle  = (TWO_PI / sides) * i;
    const jitter = rndRange(0.65, 1.2);
    return { x: Math.cos(angle) * r * jitter, y: Math.sin(angle) * r * jitter };
  });
}

function makeAsteroid(tier = 0, x, y) {
  const t   = TIERS[tier];
  const ang = rndRange(0, TWO_PI);
  const spd = t.speed * rndRange(0.7, 1.3);
  return {
    id:    Math.random(),
    tier,
    r:     t.r,
    x:     x ?? rndRange(0, W),
    y:     y ?? rndRange(0, H),
    vx:    Math.cos(ang) * spd * rndSign(),
    vy:    Math.sin(ang) * spd * rndSign(),
    rot:   rndRange(0, TWO_PI),
    rotV:  rndRange(0.005, 0.025) * rndSign(),
    verts: makeAsteroidVerts(t.r),
    color: [COLORS.ultraviolet, COLORS.cyan, COLORS.magenta][tier],
    token: Math.random() < 0.18 ? TOKENS[Math.floor(Math.random() * TOKENS.length)] : null,
  };
}

function spawnWave(wave, playerX, playerY) {
  const count = 3 + wave;
  return Array.from({ length: count }, () => {
    let x, y;
    do {
      x = rndRange(0, W);
      y = rndRange(0, H);
    } while (dist(x, y, playerX, playerY) < 120);
    return makeAsteroid(0, x, y);
  });
}

function makeParticles(x, y, color, count = 12, speed = 4) {
  return Array.from({ length: count }, () => {
    const ang = rndRange(0, TWO_PI);
    const spd = rndRange(0.5, speed);
    return {
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r:  rndRange(1.5, 4),
      life: rndRange(20, 45),
      maxLife: 45,
      color,
    };
  });
}

function makeShipDebris(ship) {
  const lines = [
    [{ x: 0, y: -SHIP_SIZE }, { x: -SHIP_SIZE * 0.8, y: SHIP_SIZE * 0.7 }],
    [{ x: 0, y: -SHIP_SIZE }, { x:  SHIP_SIZE * 0.8, y: SHIP_SIZE * 0.7 }],
    [{ x: -SHIP_SIZE * 0.8, y: SHIP_SIZE * 0.7 }, { x: SHIP_SIZE * 0.8, y: SHIP_SIZE * 0.7 }],
  ];
  return lines.map(pts => ({
    x: ship.x, y: ship.y,
    pts,
    vx: rndRange(-2, 2), vy: rndRange(-2, 2),
    rot: ship.angle,
    rotV: rndRange(-0.08, 0.08),
    life: 60, maxLife: 60,
  }));
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGrid(ctx) {
  ctx.save();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth   = 0.5;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
}

function drawStars(ctx, stars) {
  stars.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.a;
    ctx.fillStyle   = COLORS.white;
    ctx.fillRect(s.x, s.y, s.r, s.r);
    ctx.restore();
  });
}

function drawShip(ctx, ship, tick) {
  if (ship.dead) return;
  // Blink when invincible
  if (ship.invincible > 0 && Math.floor(tick / 5) % 2 === 0) return;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  // Engine flame
  if (ship.thrusting) {
    const flicker = 0.6 + 0.4 * Math.sin(tick * 0.5);
    ctx.save();
    ctx.shadowColor = COLORS.magenta;
    ctx.shadowBlur  = 18;
    ctx.strokeStyle = COLORS.magenta;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = flicker;
    ctx.beginPath();
    ctx.moveTo(-SHIP_SIZE * 0.5, SHIP_SIZE * 0.6);
    ctx.lineTo(0, SHIP_SIZE * 0.6 + SHIP_SIZE * 0.9 * flicker);
    ctx.lineTo(SHIP_SIZE * 0.5, SHIP_SIZE * 0.6);
    ctx.stroke();
    ctx.restore();
  }

  // Ship hull
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur  = 16;
  ctx.strokeStyle = COLORS.acidGreen;
  ctx.lineWidth   = 1.8;
  ctx.fillStyle   = 'rgba(204,255,0,0.07)';
  ctx.beginPath();
  ctx.moveTo(0, -SHIP_SIZE);
  ctx.lineTo(SHIP_SIZE * 0.8,  SHIP_SIZE * 0.7);
  ctx.lineTo(SHIP_SIZE * 0.3,  SHIP_SIZE * 0.4);
  ctx.lineTo(-SHIP_SIZE * 0.3, SHIP_SIZE * 0.4);
  ctx.lineTo(-SHIP_SIZE * 0.8, SHIP_SIZE * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit
  ctx.beginPath();
  ctx.arc(0, -SHIP_SIZE * 0.25, SHIP_SIZE * 0.18, 0, TWO_PI);
  ctx.fillStyle   = COLORS.acidGreen;
  ctx.shadowBlur  = 8;
  ctx.fill();

  ctx.restore();
}

function drawAsteroid(ctx, ast, tick) {
  ctx.save();
  ctx.translate(ast.x, ast.y);
  ctx.rotate(ast.rot);

  const pulse = 0.85 + 0.15 * Math.sin(tick * 0.04 + ast.id * 10);

  ctx.shadowColor = ast.color;
  ctx.shadowBlur  = 14 * pulse;
  ctx.strokeStyle = ast.color;
  ctx.lineWidth   = 1.5;
  ctx.fillStyle   = `${ast.color}14`;

  ctx.beginPath();
  ast.verts.forEach((v, i) => i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Token inside
  if (ast.token) {
    ctx.shadowColor = ast.token.color;
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = ast.token.color;
    ctx.font        = `bold ${ast.r * 0.55}px "JetBrains Mono", monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(ast.token.symbol, 0, 0);
  }

  ctx.restore();
}

function drawBullet(ctx, b) {
  const alpha = b.life / BULLET_LIFE;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur  = 12;
  ctx.fillStyle   = COLORS.acidGreen;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 3, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, particles) {
  particles.forEach(p => {
    const a = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * a, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  });
}

function drawDebris(ctx, debris) {
  debris.forEach(d => {
    const a = d.life / d.maxLife;
    ctx.save();
    ctx.globalAlpha  = a;
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.strokeStyle  = COLORS.acidGreen;
    ctx.shadowColor  = COLORS.acidGreen;
    ctx.shadowBlur   = 10;
    ctx.lineWidth    = 1.5;
    d.pts.forEach((pt, i) => {
      if (i === 0) ctx.beginPath(), ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.restore();
  });
}

function drawFloats(ctx, floats) {
  floats.forEach(f => {
    const a = f.life / f.maxLife;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle   = f.color || COLORS.acidGreen;
    ctx.shadowColor = f.color || COLORS.acidGreen;
    ctx.shadowBlur  = 10;
    ctx.font        = 'bold 13px "Orbitron", monospace';
    ctx.textAlign   = 'center';
    ctx.fillText(`+${f.pts}`, f.x, f.y);
    ctx.restore();
  });
}

function drawHUD(ctx, score, lives, wave, shield) {
  ctx.save();
  ctx.font      = '12px "JetBrains Mono", monospace';
  ctx.fillStyle = COLORS.acidGreen;
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur  = 8;
  ctx.fillText(`SCORE  ${String(score).padStart(6, '0')}`, 12, 22);
  ctx.fillText(`WAVE   ${wave}`, 12, 40);

  // Lives as ship icons
  ctx.fillStyle   = COLORS.magenta;
  ctx.shadowColor = COLORS.magenta;
  ctx.textAlign   = 'right';
  ctx.fillText('▲'.repeat(Math.max(0, lives)), W - 12, 22);

  if (shield > 0) {
    ctx.fillStyle   = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur  = 14;
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 11px "Orbitron", monospace';
    ctx.fillText('⚡ SHIELD ACTIVE', W / 2, 22);
  }

  ctx.restore();
}

function drawSaucer(ctx, s, tick) {
  if (!s) return;
  const pulse = 0.9 + 0.1 * Math.sin(tick * 0.1);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur  = 18 * pulse;
  ctx.strokeStyle = COLORS.magenta;
  ctx.fillStyle   = 'rgba(255,0,122,0.12)';
  ctx.lineWidth   = 1.8;
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 10, 0, 0, TWO_PI);
  ctx.fill(); ctx.stroke();
  // Dome
  ctx.beginPath();
  ctx.ellipse(0, -6, 12, 7, 0, Math.PI, TWO_PI);
  ctx.fill(); ctx.stroke();
  // Lights
  [-12, 0, 12].forEach(lx => {
    ctx.fillStyle = Math.floor(tick / 10) % 2 === 0 ? COLORS.cyan : COLORS.magenta;
    ctx.beginPath();
    ctx.arc(lx, 2, 2.5, 0, TWO_PI);
    ctx.fill();
  });
  ctx.restore();
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function GlowText({ children, color, size = 16, style = {} }) {
  return (
    <p style={{
      margin: 0, color, fontSize: size,
      fontFamily: '"Orbitron","JetBrains Mono",monospace',
      letterSpacing: 2,
      textShadow: `0 0 10px ${color}, 0 0 24px ${color}55`,
      textAlign: 'center', lineHeight: 1.4,
      ...style,
    }}>
      {children}
    </p>
  );
}

function Overlay({ children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(11,9,20,0.9)',
      backdropFilter: 'blur(4px)',
      padding: 28, gap: 8,
    }}>
      {children}
    </div>
  );
}

function NeonButton({ children, onClick, color = COLORS.acidGreen, disabled, style = {} }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        marginTop: 12, padding: '10px 32px',
        background: hover ? `${color}18` : 'transparent',
        border: `1.5px solid ${color}`, borderRadius: 6,
        color, fontSize: 13,
        fontFamily: '"Orbitron",monospace', letterSpacing: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: hover ? `0 0 18px ${color}55` : `0 0 8px ${color}33`,
        transition: 'all 0.18s', ...style,
      }}
    >
      {children}
    </button>
  );
}

function NeonInput({ placeholder, value, onChange, type = 'text' }) {
  return (
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${COLORS.ultraviolet}`,
        borderRadius: 5, padding: '8px 14px',
        color: COLORS.white, fontSize: 12,
        fontFamily: '"JetBrains Mono",monospace',
        letterSpacing: 1, outline: 'none',
        width: '100%', boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = COLORS.acidGreen; }}
      onBlur={e  => { e.target.style.borderColor = COLORS.ultraviolet; }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Hub3steroids({ onGameOver }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const rafRef    = useRef(null);
  const keysRef   = useRef({});
  const lastFire  = useRef(0);

  const [phase, setPhase]     = useState('idle');
  const [uiScore, setUiScore] = useState(0);
  const [uiHigh,  setUiHigh]  = useState(0);
  const highRef               = useRef(0);

  const [leadForm, setLeadForm]     = useState({ nickname: '', email: '', phone: '' });
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  // ── Init ─────────────────────────────────────────────────────────────────
  const initState = useCallback(() => {
    const ship = {
      x: W / 2, y: H / 2,
      vx: 0, vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      invincible: INVINCIBLE_TIME,
      dead: false,
      deathTimer: 0,
    };
    return {
      tick: 0,
      score: 0,
      lives: LIVES_START,
      wave: 1,
      ship,
      bullets: [],
      asteroids: spawnWave(1, ship.x, ship.y),
      particles: [],
      debris: [],
      floats: [],
      stars: Array.from({ length: 80 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() < 0.15 ? 2 : 1,
        a: 0.15 + Math.random() * 0.7,
        speed: 0.1 + Math.random() * 0.3,
      })),
      saucer: null,
      saucerTimer: 600 + Math.random() * 400,
      saucerBullets: [],
      shield: 0,
      phase: 'playing',
    };
  }, []);

  // ── Kill ship ─────────────────────────────────────────────────────────────
  const killShip = useCallback((s) => {
    s.lives--;
    s.particles.push(...makeParticles(s.ship.x, s.ship.y, COLORS.magenta, 30, 5));
    s.debris = makeShipDebris(s.ship);

    if (s.lives <= 0) {
      s.phase = 'gameover';
      setUiScore(s.score);
      if (s.score > highRef.current) { highRef.current = s.score; setUiHigh(s.score); }
      setPhase('gameover');
      onGameOver?.(s.score);
    } else {
      setTimeout(() => {
        const st = stateRef.current;
        if (!st) return;
        st.ship.x = W / 2; st.ship.y = H / 2;
        st.ship.vx = 0; st.ship.vy = 0;
        st.ship.angle = -Math.PI / 2;
        st.ship.dead = false;
        st.ship.invincible = INVINCIBLE_TIME;
        st.saucer = null;
        st.saucerBullets = [];
      }, 1200);
      s.ship.dead = true;
    }
  }, [onGameOver]);

  // ── Shoot saucer bullet ───────────────────────────────────────────────────
  const saucerShoot = useCallback((s) => {
    if (!s.saucer) return;
    const ang  = Math.atan2(s.ship.y - s.saucer.y, s.ship.x - s.saucer.x) + rndRange(-0.4, 0.4);
    s.saucerBullets.push({
      x: s.saucer.x, y: s.saucer.y,
      vx: Math.cos(ang) * 4,
      vy: Math.sin(ang) * 4,
      life: 90, maxLife: 90,
    });
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    const frame = (now) => {
      const s = stateRef.current;
      if (!s || s.phase !== 'playing') return;
      rafRef.current = requestAnimationFrame(frame);
      s.tick++;
      const { ship } = s;

      // ── Input ──────────────────────────────────────────────────────
      if (keysRef.current['ArrowLeft']  || keysRef.current['a']) ship.angle -= SHIP_ROTATE;
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) ship.angle += SHIP_ROTATE;

      ship.thrusting = !!(keysRef.current['ArrowUp'] || keysRef.current['w']);
      if (ship.thrusting && !ship.dead) {
        ship.vx += Math.cos(ship.angle) * SHIP_THRUST;
        ship.vy += Math.sin(ship.angle) * SHIP_THRUST;
      }

      // Fire
      if ((keysRef.current[' '] || keysRef.current['z']) && !ship.dead) {
        if (now - lastFire.current > FIRE_COOLDOWN) {
          lastFire.current = now;
          s.bullets.push({
            x:  ship.x + Math.cos(ship.angle) * SHIP_SIZE,
            y:  ship.y + Math.sin(ship.angle) * SHIP_SIZE,
            vx: Math.cos(ship.angle) * BULLET_SPEED + ship.vx * 0.4,
            vy: Math.sin(ship.angle) * BULLET_SPEED + ship.vy * 0.4,
            life: BULLET_LIFE,
          });
        }
      }

      // ── Ship physics ───────────────────────────────────────────────
      if (!ship.dead) {
        ship.vx *= SHIP_FRICTION;
        ship.vy *= SHIP_FRICTION;
        ship.x = wrap(ship.x + ship.vx, W);
        ship.y = wrap(ship.y + ship.vy, H);
        if (ship.invincible > 0) ship.invincible--;
        if (ship.shield > 0) ship.shield--;
      } else {
        ship.deathTimer++;
      }

      // ── Stars ─────────────────────────────────────────────────────
      s.stars.forEach(st => {
        st.y = wrap(st.y + st.speed, H);
      });

      // ── Bullets ───────────────────────────────────────────────────
      s.bullets = s.bullets
        .map(b => ({ ...b, x: wrap(b.x + b.vx, W), y: wrap(b.y + b.vy, H), life: b.life - 1 }))
        .filter(b => b.life > 0);

      // ── Saucer bullets ────────────────────────────────────────────
      s.saucerBullets = s.saucerBullets
        .map(b => ({ ...b, x: wrap(b.x + b.vx, W), y: wrap(b.y + b.vy, H), life: b.life - 1 }))
        .filter(b => b.life > 0);

      // ── Asteroids ─────────────────────────────────────────────────
      s.asteroids.forEach(a => {
        a.x   = wrap(a.x + a.vx, W);
        a.y   = wrap(a.y + a.vy, H);
        a.rot += a.rotV;
      });

      // ── Saucer logic ──────────────────────────────────────────────
      s.saucerTimer--;
      if (s.saucerTimer <= 0 && !s.saucer) {
        s.saucer = {
          x: Math.random() < 0.5 ? 0 : W,
          y: rndRange(60, H - 60),
          vx: rndRange(1, 2) * (Math.random() < 0.5 ? 1 : -1),
          vy: rndRange(-0.5, 0.5),
          fireTimer: 80,
          life: 400 + s.wave * 40,
        };
      }

      if (s.saucer) {
        s.saucer.x = wrap(s.saucer.x + s.saucer.vx, W);
        s.saucer.y += s.saucer.vy;
        if (s.saucer.y < 40 || s.saucer.y > H - 40) s.saucer.vy *= -1;
        s.saucer.life--;
        s.saucer.fireTimer--;
        if (s.saucer.fireTimer <= 0) {
          saucerShoot(s);
          s.saucer.fireTimer = Math.max(40, 90 - s.wave * 5);
        }
        if (s.saucer.life <= 0) {
          s.saucer = null;
          s.saucerTimer = 500 + Math.random() * 300;
        }
      }

      // ── Collisions: bullets vs asteroids ──────────────────────────
      const newAsteroids = [];
      s.bullets.forEach(b => {
        if (b.dead) return;
        s.asteroids.forEach(a => {
          if (a.dead || b.dead) return;
          if (dist(b.x, b.y, a.x, a.y) < a.r) {
            b.dead = true;
            a.dead = true;
            const pts = (a.token ? a.token.pts : 0) + TIERS[a.tier].pts;
            s.score += pts;
            s.floats.push({ x: a.x, y: a.y, pts, life: 40, maxLife: 40, color: a.token?.color || COLORS.acidGreen });
            s.particles.push(...makeParticles(a.x, a.y, a.color, 14, 3));
            if (a.token) {
              s.particles.push(...makeParticles(a.x, a.y, a.token.color, 10, 5));
            }
            // Split
            if (a.tier < 2) {
              for (let i = 0; i < 2; i++) newAsteroids.push(makeAsteroid(a.tier + 1, a.x, a.y));
            }
          }
        });
      });

      s.asteroids = [...s.asteroids.filter(a => !a.dead), ...newAsteroids];
      s.bullets   = s.bullets.filter(b => !b.dead);

      // ── Collisions: bullets vs saucer ─────────────────────────────
      if (s.saucer) {
        s.bullets.forEach(b => {
          if (b.dead) return;
          if (dist(b.x, b.y, s.saucer.x, s.saucer.y) < 24) {
            b.dead = true;
            const pts = 500 + s.wave * 100;
            s.score += pts;
            s.floats.push({ x: s.saucer.x, y: s.saucer.y, pts, life: 50, maxLife: 50, color: COLORS.magenta });
            s.particles.push(...makeParticles(s.saucer.x, s.saucer.y, COLORS.magenta, 24, 5));
            s.saucer = null;
            s.saucerTimer = 400 + Math.random() * 300;
          }
        });
        s.bullets = s.bullets.filter(b => !b.dead);
      }

      // ── Collisions: asteroids vs ship ─────────────────────────────
      if (!ship.dead && ship.invincible <= 0 && ship.shield <= 0) {
        for (const a of s.asteroids) {
          if (dist(ship.x, ship.y, a.x, a.y) < a.r * 0.75 + SHIP_SIZE * 0.6) {
            killShip(s);
            break;
          }
        }
      }

      // ── Collisions: saucer bullets vs ship ────────────────────────
      if (!ship.dead && ship.invincible <= 0 && ship.shield <= 0) {
        for (const b of s.saucerBullets) {
          if (dist(b.x, b.y, ship.x, ship.y) < SHIP_SIZE * 0.85) {
            killShip(s);
            break;
          }
        }
      }

      // ── Wave clear ────────────────────────────────────────────────
      if (s.asteroids.length === 0 && !ship.dead) {
        s.wave++;
        s.asteroids = spawnWave(s.wave, ship.x, ship.y);
        s.saucerTimer = 400 + Math.random() * 300;
        // Bonus life every 3 waves
        if (s.wave % 3 === 0) s.lives = Math.min(s.lives + 1, 5);
      }

      // ── Score sync ────────────────────────────────────────────────
      if (s.score > highRef.current) { highRef.current = s.score; setUiHigh(s.score); }
      setUiScore(s.score);

      // ── Particles/debris/floats ────────────────────────────────────
      s.particles = s.particles
        .map(p => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, life: p.life-1, vx: p.vx*0.92, vy: p.vy*0.92 }))
        .filter(p => p.life > 0);
      s.debris = s.debris
        .map(d => ({ ...d, x: d.x+d.vx, y: d.y+d.vy, rot: d.rot+d.rotV, life: d.life-1 }))
        .filter(d => d.life > 0);
      s.floats = s.floats
        .map(f => ({ ...f, y: f.y - 0.9, life: f.life - 1 }))
        .filter(f => f.life > 0);

      // ── Draw ──────────────────────────────────────────────────────
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);

      // Scanlines
      for (let sy = 0; sy < H; sy += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, sy, W, 1);
      }

      // Radial glow
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.65);
      grd.addColorStop(0, 'rgba(79,20,135,0.2)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      drawGrid(ctx);
      drawStars(ctx, s.stars);

      s.asteroids.forEach(a => drawAsteroid(ctx, a, s.tick));
      drawSaucer(ctx, s.saucer, s.tick);

      s.saucerBullets.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.life / b.maxLife;
        ctx.shadowColor = COLORS.magenta;
        ctx.shadowBlur  = 10;
        ctx.fillStyle   = COLORS.magenta;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
      });

      s.bullets.forEach(b => drawBullet(ctx, b));
      drawParticles(ctx, s.particles);
      drawDebris(ctx, s.debris);
      drawFloats(ctx, s.floats);
      drawShip(ctx, ship, s.tick);

      // Shield ring
      if (ship.shield > 0 && !ship.dead) {
        ctx.save();
        ctx.strokeStyle = COLORS.cyan;
        ctx.shadowColor = COLORS.cyan;
        ctx.shadowBlur  = 18;
        ctx.lineWidth   = 1.5;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(s.tick * 0.15);
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, SHIP_SIZE * 1.8, 0, TWO_PI);
        ctx.stroke();
        ctx.restore();
      }

      // Border
      ctx.save();
      ctx.strokeStyle = COLORS.ultraviolet;
      ctx.shadowColor = COLORS.ultraviolet;
      ctx.shadowBlur  = 14;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);
      ctx.restore();

      drawHUD(ctx, s.score, s.lives, s.wave, ship.shield);
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [killShip, saucerShoot]);

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stateRef.current = initState();
    setUiScore(0);
    setSubmitted(false);
    setFormError('');
    setPhase('playing');
    setTimeout(() => startLoop(), 0);
  }, [initState, startLoop]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      // Shield power-up key
      if (e.key === 's' || e.key === 'S') {
        const st = stateRef.current;
        if (st?.ship && !st.ship.dead) st.ship.shield = 150;
      }
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Touch ─────────────────────────────────────────────────────────────────
  const touchRef = useRef({});
  const handleTouchStart = (e) => {
    Array.from(e.changedTouches).forEach(t => {
      touchRef.current[t.identifier] = { x: t.clientX, y: t.clientY, time: Date.now() };
    });
  };
  const handleTouchEnd = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    Array.from(e.changedTouches).forEach(t => {
      const start = touchRef.current[t.identifier];
      if (!start) return;
      const dx  = t.clientX - start.x;
      const dy  = t.clientY - start.y;
      const dt  = Date.now() - start.time;
      const relX = (t.clientX - rect.left) / rect.width;

      // Tap on right half = fire, left half = shield
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 250) {
        if (relX > 0.5) {
          keysRef.current[' '] = true;
          setTimeout(() => { keysRef.current[' '] = false; }, 80);
        } else {
          const st = stateRef.current;
          if (st?.ship && !st.ship.dead) st.ship.shield = 150;
        }
      }
      // Swipe up = thrust
      if (dy < -30 && Math.abs(dy) > Math.abs(dx)) {
        keysRef.current['ArrowUp'] = true;
        setTimeout(() => { keysRef.current['ArrowUp'] = false; }, 300);
      }
      // Swipe left/right = rotate
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        const key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
        keysRef.current[key] = true;
        setTimeout(() => { keysRef.current[key] = false; }, 250);
      }
      delete touchRef.current[t.identifier];
    });
  };

  // ── Lead submit ───────────────────────────────────────────────────────────
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!leadForm.nickname.trim()) return setFormError('Nickname is required.');
    if (!leadForm.email.trim())    return setFormError('Email is required.');
    if (!leadForm.phone.trim())    return setFormError('Phone is required.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/arcade/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadForm, score: uiScore, game: 'hub3steroids' }),
      });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error || 'Submission failed.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setFormError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const qualifies = uiScore >= QUALIFY_SCORE;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: W,
      margin: '0 auto',
      borderRadius: 12,
      overflow: 'hidden',
      border: `1.5px solid ${COLORS.ultraviolet}`,
      boxShadow: `0 0 40px rgba(79,20,135,0.55), 0 0 80px rgba(79,20,135,0.2)`,
      background: COLORS.bg,
      fontFamily: '"JetBrains Mono", monospace',
      userSelect: 'none',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: `1px solid rgba(79,20,135,0.4)`,
        background: 'rgba(11,9,20,0.7)',
      }}>
        <GlowText color={COLORS.acidGreen} size={15} style={{ letterSpacing: 4, textAlign: 'left' }}>
          HUB3STEROIDS
        </GlowText>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>SCORE</p>
            <GlowText color={COLORS.acidGreen} size={16}>{String(uiScore).padStart(6, '0')}</GlowText>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>BEST</p>
            <GlowText color={COLORS.cyan} size={16}>{String(uiHigh).padStart(6, '0')}</GlowText>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={W} height={H}
          style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* IDLE */}
        {phase === 'idle' && (
          <Overlay>
            <GlowText color={COLORS.acidGreen} size={28}>HUB3STEROIDS</GlowText>
            <GlowText color={COLORS.cyan} size={11} style={{ marginTop: 4 }}>
              CRYPTO ASTEROID FIELD
            </GlowText>

            <div style={{
              marginTop: 16, display: 'grid',
              gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 340,
            }}>
              {[
                { k: '← →  /  A D',    d: 'Rotacionar' },
                { k: '↑  /  W',         d: 'Propulsão' },
                { k: 'SPACE  /  Z',     d: 'Atirar' },
                { k: 'S  /  TAP ESQ',  d: 'Shield (1.5s)' },
                { k: 'TAP DIR',         d: 'Atirar (mobile)' },
                { k: 'SWIPE ↑',         d: 'Thrust (mobile)' },
              ].map(({ k, d }) => (
                <div key={k} style={{
                  background: 'rgba(79,20,135,0.12)',
                  border: '1px solid rgba(79,20,135,0.35)',
                  borderRadius: 6, padding: '7px 10px',
                }}>
                  <p style={{ margin: 0, fontSize: 9, color: COLORS.acidGreen, fontFamily: '"Orbitron",monospace', letterSpacing: 1 }}>{k}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: `${COLORS.white}77` }}>{d}</p>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
            }}>
              {TOKENS.map(t => (
                <div key={t.label} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: `${t.color}0f`,
                  border: `1px solid ${t.color}44`,
                  borderRadius: 6, padding: '4px 10px',
                }}>
                  <span style={{ fontSize: 16, color: t.color, textShadow: `0 0 8px ${t.color}` }}>{t.symbol}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: t.color, fontFamily: '"Orbitron",monospace' }}>{t.label}</p>
                    <p style={{ margin: 0, fontSize: 9, color: `${COLORS.white}66` }}>+{t.pts} pts</p>
                  </div>
                </div>
              ))}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: `${COLORS.magenta}0f`,
                border: `1px solid ${COLORS.magenta}44`,
                borderRadius: 6, padding: '4px 10px',
              }}>
                <span style={{ fontSize: 16 }}>🛸</span>
                <div>
                  <p style={{ margin: 0, fontSize: 9, color: COLORS.magenta, fontFamily: '"Orbitron",monospace' }}>SAUCER</p>
                  <p style={{ margin: 0, fontSize: 9, color: `${COLORS.white}66` }}>500+ pts</p>
                </div>
              </div>
            </div>

            <GlowText color={`${COLORS.white}44`} size={10} style={{ marginTop: 10 }}>
              Vida extra a cada 3 waves completadas
            </GlowText>

            <NeonButton onClick={startGame}>LAUNCH MISSION</NeonButton>
          </Overlay>
        )}

        {/* GAME OVER */}
        {phase === 'gameover' && (
          <Overlay>
            <GlowText color={COLORS.magenta} size={26}>SHIP DESTROYED</GlowText>
            <GlowText color={`${COLORS.white}66`} size={11} style={{ marginTop: 4 }}>
              THE FIELD CLAIMED YOUR VESSEL
            </GlowText>
            <GlowText color={COLORS.acidGreen} size={22} style={{ marginTop: 8 }}>
              {String(uiScore).padStart(6, '0')} PTS
            </GlowText>
            {uiHigh > 0 && (
              <GlowText color={COLORS.cyan} size={11} style={{ marginTop: 2 }}>
                BEST: {String(uiHigh).padStart(6, '0')}
              </GlowText>
            )}

            {qualifies && !submitted && (
              <>
                <div style={{
                  margin: '12px 0 4px',
                  padding: '8px 16px',
                  background: 'rgba(204,255,0,0.06)',
                  border: `1px solid ${COLORS.acidGreen}44`,
                  borderRadius: 8,
                }}>
                  <GlowText color={COLORS.acidGreen} size={10}>
                    🏆 SCORE QUALIFICADO — LEADERBOARD
                  </GlowText>
                </div>
                <form
                  onSubmit={handleLeadSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', maxWidth: 270 }}
                >
                  <NeonInput placeholder="NICKNAME / CALL SIGN" value={leadForm.nickname}
                    onChange={v => setLeadForm(f => ({ ...f, nickname: v }))} />
                  <NeonInput placeholder="EMAIL" type="email" value={leadForm.email}
                    onChange={v => setLeadForm(f => ({ ...f, email: v }))} />
                  <NeonInput placeholder="PHONE (+55...)" value={leadForm.phone}
                    onChange={v => setLeadForm(f => ({ ...f, phone: v }))} />
                  {formError && (
                    <span style={{ color: COLORS.magenta, fontSize: 11, textAlign: 'center' }}>
                      {formError}
                    </span>
                  )}
                  <NeonButton type="submit" disabled={submitting} color={COLORS.acidGreen}>
                    {submitting ? 'TRANSMITTING...' : 'SUBMIT SCORE'}
                  </NeonButton>
                </form>
                <button onClick={startGame} style={{
                  marginTop: 6, background: 'none', border: 'none',
                  color: `${COLORS.white}44`, fontSize: 11, cursor: 'pointer',
                  letterSpacing: 1, fontFamily: '"JetBrains Mono",monospace',
                }}>
                  skip → play again
                </button>
              </>
            )}

            {qualifies && submitted && (
              <>
                <GlowText color={COLORS.acidGreen} size={13} style={{ marginTop: 10 }}>
                  ✓ Score transmitido ao ledger!
                </GlowText>
                <NeonButton onClick={startGame}>NEW MISSION</NeonButton>
              </>
            )}

            {!qualifies && (
              <>
                <GlowText color={`${COLORS.white}44`} size={10} style={{ marginTop: 8 }}>
                  {QUALIFY_SCORE}+ pts para o leaderboard
                </GlowText>
                <NeonButton onClick={startGame}>TRY AGAIN</NeonButton>
              </>
            )}
          </Overlay>
        )}
      </div>

      {/* Mobile hint bar */}
      <div style={{
        borderTop: `1px solid rgba(79,20,135,0.3)`,
        padding: '8px 16px',
        display: 'flex', justifyContent: 'center', gap: 24,
        background: 'rgba(11,9,20,0.6)',
      }}>
        {[
          { icon: '◀ ▶', label: 'SWIPE' },
          { icon: '▲',   label: 'THRUST' },
          { icon: '⚡',  label: 'TAP ESQ' },
          { icon: '●',   label: 'TAP DIR' },
        ].map(({ icon, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, color: COLORS.acidGreen,
              textShadow: `0 0 8px ${COLORS.acidGreen}` }}>{icon}</p>
            <p style={{ margin: '2px 0 0', fontSize: 8, color: `${COLORS.white}44`,
              fontFamily: '"Orbitron",monospace', letterSpacing: 1 }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

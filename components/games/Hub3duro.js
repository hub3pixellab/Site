// /components/games/Hub3duro.js
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
};

const W = 480;
const H = 560;

const QUALIFY_SCORE = 500;
const LIVES_START   = 3;
const CARS_PER_DAY  = [5, 10, 15, 20, 30, 40, 50];

const DAY_PHASES = [
  { name: 'DAWN',    duration: 600,  sky: ['#1a0a2e','#4F1487'],  road: '#2a1a4a', line: '#CCFF00',  fog: 0    },
  { name: 'DAY',     duration: 1200, sky: ['#0b0914','#1a0530'],  road: '#1a0a2e', line: '#CCFF00',  fog: 0    },
  { name: 'DUSK',    duration: 600,  sky: ['#2d0a1a','#FF007A'],  road: '#1a0520', line: '#FF007A',  fog: 0    },
  { name: 'NIGHT',   duration: 900,  sky: ['#050308','#0b0914'],  road: '#0a0520', line: '#00F0FF',  fog: 0.4  },
  { name: 'SNOW',    duration: 800,  sky: ['#0a0820','#1a1535'],  road: '#1a1840', line: '#f5f5ff',  fog: 0.25 },
  { name: 'BLIZZARD',duration: 600,  sky: ['#0a0820','#0f1030'],  road: '#12103a', line: '#4F1487',  fog: 0.6  },
];

const CAR_COLORS = ['#FF007A','#00F0FF','#9945FF','#F7931A','#CCFF00','#FF99CC'];

const OBSTACLES = [
  { w: 32, h: 28, color: '#FF007A', label: '🔴', pts: 0 },
  { w: 20, h: 40, color: '#9945FF', label: '🟣', pts: 0 },
  { w: 44, h: 24, color: '#F7931A', label: '🟠', pts: 0 },
];
const COLLECTIBLES = [
  { symbol: '₿', color: '#F7931A', pts: 200 },
  { symbol: 'Ξ', color: '#00F0FF', pts: 150 },
  { symbol: '✦', color: '#FF007A', pts: 300 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rnd(n)          { return Math.floor(Math.random() * n); }
function rndRange(a, b)  { return a + Math.random() * (b - a); }
function lerp(a, b, t)   { return a + (b - a) * t; }

function makeParticles(x, y, color, count = 10, spd = 3) {
  return Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const s = rndRange(0.5, spd);
    return { x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, r: rndRange(1.5, 4), life: rndRange(20,40), maxLife: 40, color };
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function shadeColor(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

function getPhase(phaseTimer, phases) {
  let t = phaseTimer;
  for (let i = 0; i < phases.length; i++) {
    if (t < phases[i].duration) return { phase: phases[i], idx: i, local: t / phases[i].duration };
    t -= phases[i].duration;
  }
  return { phase: phases[phases.length - 1], idx: phases.length - 1, local: 1 };
}

function roadXY(laneT, depthT, camX) {
  const horizon = H * 0.52;
  const y = lerp(horizon, H - 20, depthT);
  const roadHalfW = lerp(W * 0.35, W * 0.5, depthT);
  const cx = W / 2 + camX * (1 - depthT) * 60;
  const x  = cx + laneT * roadHalfW;
  const scale = lerp(0.15, 1, depthT);
  return { x, y, scale };
}

// ─── ENDURO DRAW ──────────────────────────────────────────────────────────────
function drawSky(ctx, phase, tick) {
  const [c1, c2] = phase.sky;
  const grd = ctx.createLinearGradient(0, 0, 0, H * 0.52);
  grd.addColorStop(0, c1);
  grd.addColorStop(1, c2);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H * 0.52);

  if (phase.name !== 'DAY' && phase.name !== 'SNOW') {
    ctx.save();
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137 + tick * 0.02) % W);
      const sy = ((i * 97) % (H * 0.45));
      const sa = 0.3 + 0.7 * Math.abs(Math.sin(tick * 0.01 + i));
      ctx.globalAlpha = sa * (1 - phase.fog);
      ctx.fillStyle   = '#f5f5ff';
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.restore();
  }
  if (phase.name === 'SNOW' || phase.name === 'BLIZZARD') {
    ctx.save();
    const count = phase.name === 'BLIZZARD' ? 60 : 30;
    for (let i = 0; i < count; i++) {
      const sx = ((i * 173 + tick * (phase.name === 'BLIZZARD' ? 3 : 1.5)) % W);
      const sy = ((i * 83  + tick * (0.8 + i * 0.02)) % H);
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(i);
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, rndRange(0.5, 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (phase.name === 'DAY' || phase.name === 'DAWN' || phase.name === 'DUSK') {
    const sunX = W * 0.72;
    const sunY = H * 0.18;
    const sunC = phase.name === 'DUSK' ? '#FF6B35' : phase.name === 'DAWN' ? '#CC88FF' : '#CCFF00';
    ctx.save();
    ctx.shadowColor = sunC;
    ctx.shadowBlur  = 30;
    ctx.fillStyle   = sunC;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawRoad(ctx, phase, camX, tick) {
  const horizon = H * 0.52;
  const grd = ctx.createLinearGradient(0, horizon, 0, H);
  grd.addColorStop(0, phase.road);
  grd.addColorStop(1, shadeColor(phase.road, -20));
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(W * 0.15, horizon);
  ctx.lineTo(W * 0.85, horizon);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  if (phase.fog > 0) {
    const fogGrd = ctx.createLinearGradient(0, horizon, 0, horizon + H * 0.25);
    fogGrd.addColorStop(0, `rgba(15,10,40,${phase.fog})`);
    fogGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGrd;
    ctx.fillRect(0, horizon, W, H * 0.3);
  }
  ctx.save();
  ctx.strokeStyle = phase.line;
  ctx.shadowColor = phase.line;
  ctx.shadowBlur  = 8;
  ctx.lineWidth   = 2;
  ctx.beginPath(); ctx.moveTo(W * 0.15, horizon); ctx.lineTo(0, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.85, horizon); ctx.lineTo(W, H); ctx.stroke();
  ctx.restore();
  const dashCount = 10;
  ctx.save();
  ctx.strokeStyle = phase.line;
  ctx.shadowColor = phase.line;
  ctx.shadowBlur  = 6;
  for (let i = 0; i < dashCount; i++) {
    const t1 = i / dashCount;
    const t2 = (i + 0.5) / dashCount;
    const y1 = lerp(horizon, H, t1);
    const y2 = lerp(horizon, H, t2);
    const offset = (camX * (1 - t1) * 60);
    ctx.lineWidth = lerp(0.5, 2.5, t1);
    const scrollOffset = ((tick * 3 * t1) % (H / dashCount));
    ctx.beginPath();
    ctx.moveTo(W/2 + offset, y1 - scrollOffset * t1);
    ctx.lineTo(W/2 + offset, Math.min(y2 - scrollOffset * t1, H));
    ctx.stroke();
  }
  ctx.restore();
}

function drawOpponentCar(ctx, car, phase) {
  const { x, y, scale } = roadXY(car.laneT, car.depthT, car.camX || 0);
  const cw = 36 * scale;
  const ch = 22 * scale;
  ctx.save();
  ctx.translate(x, y);
  if (phase.name === 'NIGHT' || phase.name === 'BLIZZARD') {
    ctx.save();
    const lightGrd = ctx.createRadialGradient(0, 0, 0, 0, ch * 2, cw * 3);
    lightGrd.addColorStop(0, 'rgba(255,255,200,0.35)');
    lightGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGrd;
    ctx.fillRect(-cw * 3, -ch, cw * 6, ch * 4);
    ctx.restore();
  }
  ctx.shadowColor = car.color;
  ctx.shadowBlur  = 10 * scale;
  ctx.fillStyle   = car.color;
  roundRect(ctx, -cw/2, -ch/2, cw, ch, 3 * scale);
  ctx.fill();
  ctx.fillStyle = `rgba(0,240,255,0.35)`;
  ctx.shadowBlur = 0;
  roundRect(ctx, -cw*0.28, -ch*0.38, cw*0.56, ch*0.42, 2*scale);
  ctx.fill();
  ctx.fillStyle = '#111';
  [-1,1].forEach(side => {
    [-1,1].forEach(front => {
      ctx.beginPath();
      ctx.ellipse(side * cw * 0.42, front * ch * 0.46, cw*0.09, ch*0.13, 0, 0, Math.PI*2);
      ctx.fill();
    });
  });
  ctx.fillStyle = '#FF2200';
  ctx.shadowColor = '#FF2200';
  ctx.shadowBlur = 8 * scale;
  ctx.fillRect(-cw*0.45, ch*0.3, cw*0.18, ch*0.15);
  ctx.fillRect( cw*0.27, ch*0.3, cw*0.18, ch*0.15);
  ctx.restore();
}

function drawPlayerCar(ctx, playerX, tick) {
  const cx = W/2 + playerX;
  const cy = H - 60;
  const cw = 44, ch = 26;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.save();
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur  = 24;
  ctx.fillStyle   = 'rgba(204,255,0,0.15)';
  ctx.fillRect(-cw*0.6, ch*0.3, cw*1.2, ch*0.4);
  ctx.restore();
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur  = 16;
  ctx.fillStyle   = COLORS.acidGreen;
  roundRect(ctx, -cw/2, -ch/2, cw, ch, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 0;
  roundRect(ctx, -cw*0.28, -ch*0.4, cw*0.56, ch*0.45, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,240,255,0.4)';
  ctx.fillRect(-cw*0.24, -ch*0.36, cw*0.48, ch*0.12);
  ctx.fillStyle = '#222';
  [-1,1].forEach(side => {
    [-1,1].forEach(front => {
      ctx.beginPath();
      ctx.ellipse(side * cw*0.44, front * ch*0.5, cw*0.1, ch*0.14, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = COLORS.acidGreen;
      ctx.lineWidth   = 1;
      ctx.shadowColor = COLORS.acidGreen;
      ctx.shadowBlur  = 4;
      ctx.stroke();
    });
  });
  ctx.fillStyle = '#ffffcc';
  ctx.shadowColor = '#ffffcc';
  ctx.shadowBlur  = 14;
  ctx.fillRect(-cw*0.45, -ch*0.42, cw*0.16, ch*0.18);
  ctx.fillRect( cw*0.29, -ch*0.42, cw*0.16, ch*0.18);
  if (Math.abs(tick % 4) < 2) {
    ctx.strokeStyle = `rgba(204,255,0,0.3)`;
    ctx.shadowBlur  = 0;
    ctx.lineWidth   = 1;
    [-16, -8, 8, 16].forEach(lx => {
      ctx.beginPath();
      ctx.moveTo(lx, ch*0.6);
      ctx.lineTo(lx, ch*0.6 + 12);
      ctx.stroke();
    });
  }
  ctx.restore();
}

// ─── RUNNER DRAW ──────────────────────────────────────────────────────────────
function drawRunnerBg(ctx, bgX, tick) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  for (let sy = 0; sy < H; sy += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(0, sy, W, 1);
  }
  const buildings = [
    { x: 0,   w: 60,  h: 200, color: '#0d0a20' },
    { x: 65,  w: 45,  h: 140, color: '#0f0c24' },
    { x: 115, w: 80,  h: 220, color: '#0b0918' },
    { x: 200, w: 55,  h: 170, color: '#100d22' },
    { x: 260, w: 70,  h: 250, color: '#0d0a1e' },
    { x: 335, w: 50,  h: 160, color: '#0f0c22' },
    { x: 390, w: 90,  h: 210, color: '#0c0920' },
  ];
  const groundY = H - 80;
  buildings.forEach(b => {
    const bx = ((b.x - bgX * 0.3) % (W + 100) + W + 100) % (W + 100) - 100;
    ctx.fillStyle = b.color;
    ctx.fillRect(bx, groundY - b.h, b.w, b.h);
    ctx.save();
    for (let wy = groundY - b.h + 10; wy < groundY - 10; wy += 22) {
      for (let wx = bx + 6; wx < bx + b.w - 6; wx += 16) {
        if (Math.random() < 0.003) continue;
        const wc = Math.random() < 0.15 ? COLORS.magenta : Math.random() < 0.3 ? COLORS.cyan : COLORS.ultraviolet;
        ctx.fillStyle = wc;
        ctx.shadowColor = wc;
        ctx.shadowBlur  = 4;
        ctx.globalAlpha = 0.3 + Math.sin(tick * 0.02 + wx + wy) * 0.2;
        ctx.fillRect(wx, wy, 8, 10);
      }
    }
    ctx.restore();
  });
  ctx.save();
  ctx.fillStyle = '#0d0a20';
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = COLORS.ultraviolet;
  ctx.shadowColor = COLORS.ultraviolet;
  ctx.shadowBlur  = 8;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(79,20,135,0.3)';
  ctx.lineWidth   = 0.5;
  ctx.shadowBlur  = 0;
  for (let gx = ((- bgX * 0.8) % 40 + 40) % 40; gx < W; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx - 20, H);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRunner(ctx, runner, tick) {
  const { x, y, ducking } = runner;
  const rh = ducking ? 18 : 32;
  const rw = 22;
  ctx.save();
  ctx.translate(x + rw/2, y + rh/2);
  if (runner.invincible > 0 && Math.floor(tick / 5) % 2 === 0) {
    ctx.restore();
    return;
  }
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur  = 14;
  ctx.fillStyle = COLORS.acidGreen;
  if (ducking) {
    ctx.fillRect(-rw/2, -rh/2, rw, rh);
  } else {
    const legPhase = Math.sin(tick * 0.25) * 6;
    ctx.fillRect(-rw/2, 0, rw, rh/2);
    ctx.fillRect(-rw/2, -rh/2, rw, rh/2);
    ctx.fillStyle = `${COLORS.acidGreen}cc`;
    ctx.fillRect(-rw/2 + 2, rh/2 - 4, rw/2 - 2, 8 + legPhase);
    ctx.fillRect(2, rh/2 - 4, rw/2 - 2, 8 - legPhase);
  }
  ctx.fillStyle = COLORS.acidGreen;
  ctx.shadowBlur = 10;
  if (!ducking) {
    ctx.beginPath();
    ctx.arc(0, -rh/2 - 8, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = COLORS.bg;
    ctx.shadowBlur = 0;
    ctx.fillRect(2, -rh/2 - 12, 7, 4);
  }
  ctx.restore();
}

function drawRunnerObstacle(ctx, obs) {
  ctx.save();
  ctx.shadowColor = obs.color;
  ctx.shadowBlur  = 12;
  ctx.fillStyle   = obs.color;
  roundRect(ctx, obs.x, obs.y, obs.w, obs.h, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(obs.x + 2, obs.y + obs.h*0.2, obs.w - 4, obs.h * 0.12);
  ctx.restore();
}

function drawCollectible(ctx, c, tick) {
  const pulse = 0.85 + 0.15 * Math.sin(tick * 0.08 + c.x);
  ctx.save();
  ctx.translate(c.x + 14, c.y + 14);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = c.color;
  ctx.shadowBlur  = 14;
  ctx.strokeStyle = c.color;
  ctx.lineWidth   = 1.5;
  ctx.fillStyle   = `${c.color}22`;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI*2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = c.color;
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.symbol, 0, 1);
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
    ctx.arc(p.x, p.y, p.r * a, 0, Math.PI*2);
    ctx.fill();
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

// ─── Sub-components ───────────────────────────────────────────────────────────
function GlowText({ children, color, size = 16, style = {} }) {
  return (
    <p style={{
      margin: 0, color, fontSize: size,
      fontFamily: '"Orbitron","JetBrains Mono",monospace',
      letterSpacing: 2,
      textShadow: `0 0 10px ${color}, 0 0 24px ${color}55`,
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
      background: 'rgba(11,9,20,0.92)',
      backdropFilter: 'blur(4px)',
      padding: 24, gap: 8,
    }}>{children}</div>
  );
}

function NeonButton({ children, onClick, color = COLORS.acidGreen, disabled, type = 'button' }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
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
        transition: 'all 0.18s',
      }}
    >{children}</button>
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
export default function Hub3duro({ onGameOver }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const rafRef    = useRef(null);
  const keysRef   = useRef({});

  const [phase, setPhase]       = useState('idle');
  const [uiScore, setUiScore]   = useState(0);
  const [uiHigh,  setUiHigh]    = useState(0);
  const [uiDay,   setUiDay]     = useState(1);
  const [uiMode,  setUiMode]    = useState('ENDURO');
  const highRef                 = useRef(0);

  const [leadForm, setLeadForm]     = useState({ nickname: '', email: '', phone: '' });
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const initEnduro = useCallback((day = 1, score = 0, lives = LIVES_START) => {
    const target = CARS_PER_DAY[Math.min(day - 1, CARS_PER_DAY.length - 1)];
    return {
      mode: 'enduro', tick: 0, score, lives, day,
      carsPassed: 0, carsTarget: target,
      playerX: 0, playerSpeed: 2 + day * 0.5,
      camX: 0, phaseTimer: 0,
      opponents: [], spawnTimer: 60,
      particles: [], floats: [],
      invincible: 90, crashed: false, crashTimer: 0,
      phase: 'playing',
    };
  }, []);

  const initRunner = useCallback((day = 1, score = 0, lives = LIVES_START) => {
    const groundY = H - 80 - 32;
    return {
      mode: 'runner', tick: 0, score, lives, day,
      distance: 0, speed: 4 + day * 0.4, bgX: 0,
      runner: { x: 60, y: groundY, vy: 0, onGround: true, ducking: false, invincible: 90 },
      obstacles: [], collectibles: [],
      obsTimer: 80, colTimer: 120,
      particles: [], floats: [], phase: 'playing',
    };
  }, []);

  const triggerTransition = useCallback((nextMode, day, score, lives) => {
    setPhase('transition');
    setTimeout(() => {
      if (nextMode === 'runner') {
        stateRef.current = initRunner(day, score, lives);
        setUiMode('RUNNER');
      } else {
        stateRef.current = initEnduro(day, score, lives);
        setUiMode('ENDURO');
      }
      setPhase(nextMode);
    }, 1800);
  }, [initRunner, initEnduro]);

  const updateEnduro = useCallback((s) => {
    s.tick++;
    s.phaseTimer++;
    const totalCycle = DAY_PHASES.reduce((a, p) => a + p.duration, 0);
    if (s.phaseTimer > totalCycle) s.phaseTimer = 0;
    const left  = keysRef.current['ArrowLeft']  || keysRef.current['a'];
    const right = keysRef.current['ArrowRight'] || keysRef.current['d'];
    if (!s.crashed) {
      if (left)  s.playerX = Math.max(-0.85, s.playerX - 0.045);
      if (right) s.playerX = Math.min( 0.85, s.playerX + 0.045);
      s.playerX += (0 - s.playerX) * 0.01;
      s.camX += (s.playerX - s.camX) * 0.08;
    }
    if (s.crashed) {
      s.crashTimer--;
      if (s.crashTimer <= 0) {
        s.crashed = false;
        s.invincible = 90;
        s.playerX = 0;
        s.camX = 0;
      }
      return;
    }
    if (s.invincible > 0) s.invincible--;
    s.spawnTimer--;
    if (s.spawnTimer <= 0) {
      const lanes = [-0.55, -0.18, 0.18, 0.55];
      const lane  = lanes[rnd(lanes.length)];
      s.opponents.push({
        laneT: lane, depthT: 0.05 + Math.random() * 0.15,
        speed: 0.006 + Math.random() * 0.004 + s.day * 0.001,
        color: CAR_COLORS[rnd(CAR_COLORS.length)],
        passed: false,
      });
      s.spawnTimer = Math.max(20, 70 - s.day * 5);
    }
    s.opponents.forEach(o => {
      o.depthT += o.speed * (s.playerSpeed / 3);
      if (o.depthT > 0.85 && !o.passed) {
        o.passed = true;
        s.carsPassed++;
        s.score += 10 * s.day;
        s.floats.push({ x: W/2, y: H - 100, pts: 10 * s.day, life: 35, maxLife: 35, color: COLORS.acidGreen });
      }
    });
    s.opponents = s.opponents.filter(o => o.depthT < 1.05);
    if (s.invincible <= 0) {
      const playerPos = roadXY(s.playerX, 0.92, s.camX);
      s.opponents.forEach(o => {
        if (o.depthT > 0.78 && o.depthT < 0.98) {
          const oPos = roadXY(o.laneT, o.depthT, s.camX);
          const dx = Math.abs(oPos.x - playerPos.x);
          if (dx < 30) {
            s.crashed = true;
            s.crashTimer = 80;
            s.lives--;
            s.particles.push(...makeParticles(playerPos.x, playerPos.y, COLORS.magenta, 24, 5));
            s.particles.push(...makeParticles(oPos.x, oPos.y, o.color, 16, 4));
            if (s.lives <= 0) s.phase = 'gameover';
          }
        }
      });
    }
    if (s.carsPassed >= s.carsTarget) s.phase = 'dayclear';
    s.particles = s.particles
      .map(p => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, life: p.life-1, vx: p.vx*0.9, vy: p.vy*0.9 }))
      .filter(p => p.life > 0);
    s.floats = s.floats
      .map(f => ({ ...f, y: f.y - 0.8, life: f.life - 1 }))
      .filter(f => f.life > 0);
  }, []);

  const updateRunner = useCallback((s) => {
    s.tick++;
    s.distance += s.speed;
    s.bgX      += s.speed;
    s.speed     = Math.min(12, s.speed + 0.0008);
    const { runner } = s;
    const groundY = H - 80 - (runner.ducking ? 18 : 32);
    const up   = keysRef.current['ArrowUp']   || keysRef.current['w'] || keysRef.current[' '];
    const down = keysRef.current['ArrowDown'] || keysRef.current['s'];
    runner.ducking = !!(down && runner.onGround);
    if (up && runner.onGround) {
      runner.vy = -10.5;
      runner.onGround = false;
    }
    if (up && !runner.onGround && runner.vy > 0 && !runner.doubleJumped) {
      runner.vy = -8;
      runner.doubleJumped = true;
    }
    runner.vy += 0.45;
    runner.y  += runner.vy;
    if (runner.y >= groundY) {
      runner.y = groundY;
      runner.vy = 0;
      runner.onGround = true;
      runner.doubleJumped = false;
    }
    if (runner.invincible > 0) runner.invincible--;
    s.obsTimer--;
    if (s.obsTimer <= 0) {
      const obsType = OBSTACLES[rnd(OBSTACLES.length)];
      const obsGround = H - 80 - obsType.h;
      const floatY = Math.random() < 0.25 ? obsGround - 30 : obsGround;
      s.obstacles.push({ ...obsType, x: W + 20, y: floatY, origY: floatY });
      s.obsTimer = Math.max(35, 90 - Math.floor(s.distance / 1000) * 5);
    }
    s.colTimer--;
    if (s.colTimer <= 0) {
      const col = COLLECTIBLES[rnd(COLLECTIBLES.length)];
      s.collectibles.push({ ...col, x: W + 20, y: H - 80 - 50 - rnd(60) });
      s.colTimer = 150 + rnd(100);
    }
    s.obstacles = s.obstacles.map(o => ({ ...o, x: o.x - s.speed })).filter(o => o.x + o.w > -10);
    s.collectibles = s.collectibles.map(c => ({ ...c, x: c.x - s.speed })).filter(c => c.x + 28 > -10);
    if (runner.invincible <= 0) {
      const rh = runner.ducking ? 18 : 32;
      for (const o of s.obstacles) {
        if (runner.x + 4 < o.x + o.w && runner.x + 18 > o.x && runner.y < o.y + o.h && runner.y + rh > o.y) {
          s.lives--;
          runner.invincible = 90;
          s.particles.push(...makeParticles(runner.x + 11, runner.y + rh/2, COLORS.magenta, 20, 5));
          if (s.lives <= 0) s.phase = 'gameover';
          break;
        }
      }
    }
    const rh = runner.ducking ? 18 : 32;
    s.collectibles = s.collectibles.filter(c => {
      if (runner.x + 4 < c.x + 28 && runner.x + 18 > c.x && runner.y < c.y + 28 && runner.y + rh > c.y) {
        const pts = c.pts * s.day;
        s.score += pts;
        s.floats.push({ x: c.x + 14, y: c.y, pts, life: 40, maxLife: 40, color: c.color });
        s.particles.push(...makeParticles(c.x + 14, c.y + 14, c.color, 14, 4));
        return false;
      }
      return true;
    });
    s.score += Math.floor(s.speed * 0.1);
    const runDistance = 3000 + s.day * 500;
    if (s.distance >= runDistance) s.phase = 'stageclear';
    s.particles = s.particles
      .map(p => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, life: p.life-1, vx: p.vx*0.9, vy: p.vy*0.9 }))
      .filter(p => p.life > 0);
    s.floats = s.floats
      .map(f => ({ ...f, y: f.y - 0.9, life: f.life - 1 }))
      .filter(f => f.life > 0);
  }, []);

  const drawEnduro = useCallback((ctx, s) => {
    const { phase: ph } = getPhase(s.phaseTimer, DAY_PHASES);
    drawSky(ctx, ph, s.tick);
    drawRoad(ctx, ph, s.camX, s.tick);
    const sorted = [...s.opponents].sort((a, b) => a.depthT - b.depthT);
    sorted.forEach(o => drawOpponentCar(ctx, { ...o, camX: s.camX }, ph));
    if (s.crashed) {
      ctx.save();
      ctx.fillStyle = `rgba(255,0,122,${0.3 * (s.crashTimer / 80)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else {
      drawPlayerCar(ctx, s.playerX * W * 0.35, s.tick);
    }
    drawParticles(ctx, s.particles);
    drawFloats(ctx, s.floats);
    ctx.save();
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = COLORS.acidGreen;
    ctx.shadowColor = COLORS.acidGreen;
    ctx.shadowBlur  = 8;
    ctx.fillText(`SCORE  ${String(s.score).padStart(6,'0')}`, 10, 20);
    ctx.fillText(`DAY    ${s.day}`, 10, 36);
    ctx.fillStyle   = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.fillText(`PASS   ${s.carsPassed}/${s.carsTarget}`, 10, 52);
    ctx.fillStyle   = COLORS.magenta;
    ctx.shadowColor = COLORS.magenta;
    ctx.textAlign   = 'right';
    ctx.fillText('▲'.repeat(Math.max(0, s.lives)), W - 10, 20);
    ctx.fillStyle   = `${ph.line}bb`;
    ctx.shadowColor = ph.line;
    ctx.shadowBlur  = 10;
    ctx.textAlign   = 'center';
    ctx.font        = '10px "Orbitron", monospace';
    ctx.fillText(ph.name, W/2, 20);
    const pct = s.carsPassed / s.carsTarget;
    ctx.fillStyle = 'rgba(79,20,135,0.4)';
    ctx.fillRect(10, H - 18, W - 20, 6);
    ctx.fillStyle   = COLORS.acidGreen;
    ctx.shadowColor = COLORS.acidGreen;
    ctx.shadowBlur  = 8;
    ctx.fillRect(10, H - 18, (W - 20) * pct, 6);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COLORS.ultraviolet;
    ctx.shadowColor = COLORS.ultraviolet;
    ctx.shadowBlur  = 14;
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(0.75, 0.75, W-1.5, H-1.5);
    ctx.restore();
  }, []);

  const drawRunnerScene = useCallback((ctx, s) => {
    drawRunnerBg(ctx, s.bgX, s.tick);
    s.collectibles.forEach(c => drawCollectible(ctx, c, s.tick));
    s.obstacles.forEach(o => drawRunnerObstacle(ctx, o));
    drawRunner(ctx, s.runner, s.tick);
    drawParticles(ctx, s.particles);
    drawFloats(ctx, s.floats);
    ctx.save();
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle   = COLORS.acidGreen;
    ctx.shadowColor = COLORS.acidGreen;
    ctx.shadowBlur  = 8;
    ctx.fillText(`SCORE  ${String(s.score).padStart(6,'0')}`, 10, 20);
    ctx.fillText(`DIST   ${String(Math.floor(s.distance)).padStart(5,'0')}m`, 10, 36);
    ctx.fillStyle   = COLORS.magenta;
    ctx.shadowColor = COLORS.magenta;
    ctx.textAlign   = 'right';
    ctx.fillText('▲'.repeat(Math.max(0, s.lives)), W - 10, 20);
    ctx.fillStyle   = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.textAlign   = 'center';
    ctx.font        = '10px "Orbitron", monospace';
    ctx.fillText('RUNNER STAGE', W/2, 20);
    const runDistance = 3000 + s.day * 500;
    const pct = Math.min(1, s.distance / runDistance);
    ctx.fillStyle = 'rgba(79,20,135,0.4)';
    ctx.fillRect(10, H-18, W-20, 6);
    ctx.fillStyle   = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur  = 8;
    ctx.fillRect(10, H-18, (W-20)*pct, 6);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur  = 14;
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(0.75, 0.75, W-1.5, H-1.5);
    ctx.restore();
  }, []);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const frame = () => {
      const s = stateRef.current;
      if (!s) return;
      rafRef.current = requestAnimationFrame(frame);
      if (s.mode === 'enduro') {
        if (s.phase === 'playing') updateEnduro(s);
        if (s.score > highRef.current) { highRef.current = s.score; setUiHigh(s.score); }
        setUiScore(s.score);
        setUiDay(s.day);
        drawEnduro(ctx, s);
        if (s.phase === 'dayclear') {
          ctx.save();
          ctx.fillStyle = 'rgba(11,9,20,0.75)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle   = COLORS.acidGreen;
          ctx.shadowColor = COLORS.acidGreen;
          ctx.shadowBlur  = 24;
          ctx.font        = 'bold 20px "Orbitron", monospace';
          ctx.textAlign   = 'center';
          ctx.fillText(`DAY ${s.day} COMPLETE!`, W/2, H/2 - 18);
          ctx.fillStyle   = COLORS.cyan;
          ctx.shadowColor = COLORS.cyan;
          ctx.font        = '12px "JetBrains Mono", monospace';
          ctx.fillText('RUNNER BONUS STAGE →', W/2, H/2 + 14);
          ctx.restore();
          if (!s._transitioning) {
            s._transitioning = true;
            setTimeout(() => triggerTransition('runner', s.day, s.score, s.lives), 2000);
          }
        }
        if (s.phase === 'gameover') {
          cancelAnimationFrame(rafRef.current);
          setUiScore(s.score);
          setPhase('gameover');
          onGameOver?.(s.score);
        }
      } else if (s.mode === 'runner') {
        if (s.phase === 'playing') updateRunner(s);
        if (s.score > highRef.current) { highRef.current = s.score; setUiHigh(s.score); }
        setUiScore(s.score);
        drawRunnerScene(ctx, s);
        if (s.phase === 'stageclear') {
          ctx.save();
          ctx.fillStyle = 'rgba(11,9,20,0.75)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle   = COLORS.cyan;
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur  = 24;
          ctx.font        = 'bold 18px "Orbitron", monospace';
          ctx.textAlign   = 'center';
          ctx.fillText('RUNNER STAGE CLEAR!', W/2, H/2 - 18);
          ctx.fillStyle   = COLORS.acidGreen;
          ctx.shadowColor = COLORS.acidGreen;
          ctx.font        = '12px "JetBrains Mono", monospace';
          ctx.fillText(`← DAY ${s.day + 1} INCOMING`, W/2, H/2 + 14);
          ctx.restore();
          if (!s._transitioning) {
            s._transitioning = true;
            setTimeout(() => triggerTransition('enduro', s.day + 1, s.score, s.lives), 2000);
          }
        }
        if (s.phase === 'gameover') {
          cancelAnimationFrame(rafRef.current);
          setUiScore(s.score);
          setPhase('gameover');
          onGameOver?.(s.score);
        }
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [updateEnduro, updateRunner, drawEnduro, drawRunnerScene, triggerTransition, onGameOver]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stateRef.current = initEnduro(1, 0, LIVES_START);
    setUiScore(0);
    setUiDay(1);
    setUiMode('ENDURO');
    setSubmitted(false);
    setFormError('');
    setPhase('enduro');
    setTimeout(() => startLoop(), 0);
  }, [initEnduro, startLoop]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const down = e => {
      keysRef.current[e.key] = true;
      if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    };
    const up = e => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const touchRef = useRef(null);
  const handleTouchStart = e => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = e => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    const s = stateRef.current;
    if (!s) return;
    if (s.mode === 'enduro') {
      if (adx > 20) {
        const key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
        keysRef.current[key] = true;
        setTimeout(() => { keysRef.current[key] = false; }, 300);
      }
    } else {
      if (ady > 20 && dy < 0) {
        keysRef.current['ArrowUp'] = true;
        setTimeout(() => { keysRef.current['ArrowUp'] = false; }, 100);
      } else if (ady > 20 && dy > 0) {
        keysRef.current['ArrowDown'] = true;
        setTimeout(() => { keysRef.current['ArrowDown'] = false; }, 200);
      }
    }
    touchRef.current = null;
  };

  const handleLeadSubmit = async e => {
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
        body: JSON.stringify({ ...leadForm, score: uiScore, game: 'hub3duro' }),
      });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error || 'Submission failed.');
      } else setSubmitted(true);
    } catch { setFormError('Network error. Try again.'); }
    finally  { setSubmitting(false); }
  };

  const qualifies = uiScore >= QUALIFY_SCORE;

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: W,
      margin: '0 auto', borderRadius: 12, overflow: 'hidden',
      border: `1.5px solid ${COLORS.ultraviolet}`,
      boxShadow: `0 0 40px rgba(79,20,135,0.55), 0 0 80px rgba(79,20,135,0.2)`,
      background: COLORS.bg, fontFamily: '"JetBrains Mono", monospace',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: `1px solid rgba(79,20,135,0.4)`,
        background: 'rgba(11,9,20,0.7)',
      }}>
        <div>
          <GlowText color={COLORS.acidGreen} size={14} style={{ letterSpacing: 4, textAlign: 'left' }}>
            HUB3DURO
          </GlowText>
          <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44`, fontFamily: '"Orbitron",monospace' }}>
            {uiMode} MODE · DAY {uiDay}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>SCORE</p>
            <GlowText color={COLORS.acidGreen} size={16}>{String(uiScore).padStart(6,'0')}</GlowText>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>BEST</p>
            <GlowText color={COLORS.cyan} size={16}>{String(uiHigh).padStart(6,'0')}</GlowText>
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

        {phase === 'idle' && (
          <Overlay>
            <GlowText color={COLORS.acidGreen} size={24}>HUB3DURO</GlowText>
            <GlowText color={COLORS.cyan} size={11} style={{ marginTop: 4 }}>
              ENDURANCE RACE + RUNNER BONUS
            </GlowText>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 360 }}>
              {[
                { k: '← →  /  A D',  d: 'Steer (Enduro)' },
                { k: '↑  /  W  /  SPACE', d: 'Jump (Runner)' },
                { k: '↓  /  S',       d: 'Duck (Runner)' },
                { k: 'ULTRAPASSE',    d: '10 pts × day' },
                { k: 'CRYPTO PICKUP', d: 'Runner: BTC/ETH/PEPE' },
                { k: 'DAY CYCLE',     d: 'Dawn→Day→Dusk→Night→Snow→Blizzard' },
              ].map(({ k, d }) => (
                <div key={k} style={{
                  background: 'rgba(79,20,135,0.12)',
                  border: '1px solid rgba(79,20,135,0.35)',
                  borderRadius: 6, padding: '7px 10px',
                }}>
                  <p style={{ margin:0, fontSize:9, color: COLORS.acidGreen, fontFamily:'"Orbitron",monospace', letterSpacing:1 }}>{k}</p>
                  <p style={{ margin:'3px 0 0', fontSize:10, color:`${COLORS.white}77` }}>{d}</p>
                </div>
              ))}
            </div>
            <NeonButton onClick={startGame}>START ENGINE</NeonButton>
          </Overlay>
        )}

        {phase === 'gameover' && (
          <Overlay>
            <GlowText color={COLORS.magenta} size={26}>RACE OVER</GlowText>
            <GlowText color={`${COLORS.white}55`} size={11} style={{ marginTop:4 }}>
              THE ROAD BROKE YOU
            </GlowText>
            <GlowText color={COLORS.acidGreen} size={22} style={{ marginTop:8 }}>
              {String(uiScore).padStart(6,'0')} PTS
            </GlowText>
            {uiHigh > 0 && (
              <GlowText color={COLORS.cyan} size={11} style={{ marginTop:2 }}>
                BEST: {String(uiHigh).padStart(6,'0')}
              </GlowText>
            )}
            {qualifies && !submitted && (
              <>
                <div style={{
                  margin:'12px 0 4px', padding:'8px 16px',
                  background:'rgba(204,255,0,0.06)',
                  border:`1px solid ${COLORS.acidGreen}44`,
                  borderRadius: 8,
                }}>
                  <GlowText color={COLORS.acidGreen} size={10}>
                    🏆 SCORE QUALIFICADO — LEADERBOARD
                  </GlowText>
                </div>
                <form
                  onSubmit={handleLeadSubmit}
                  style={{ display:'flex', flexDirection:'column', gap:7, width:'100%', maxWidth:270 }}
                >
                  <NeonInput placeholder="NICKNAME / DRIVER ID" value={leadForm.nickname}
                    onChange={v => setLeadForm(f => ({ ...f, nickname: v }))} />
                  <NeonInput placeholder="EMAIL" type="email" value={leadForm.email}
                    onChange={v => setLeadForm(f => ({ ...f, email: v }))} />
                  <NeonInput placeholder="PHONE (+55...)" value={leadForm.phone}
                    onChange={v => setLeadForm(f => ({ ...f, phone: v }))} />
                  {formError && (
                    <span style={{ color: COLORS.magenta, fontSize:11, textAlign:'center' }}>
                      {formError}
                    </span>
                  )}
                  <NeonButton type="submit" disabled={submitting}>
                    {submitting ? 'TRANSMITTING...' : 'SUBMIT SCORE'}
                  </NeonButton>
                </form>
                <button onClick={startGame} style={{
                  marginTop:6, background:'none', border:'none',
                  color:`${COLORS.white}44`, fontSize:11, cursor:'pointer',
                  letterSpacing:1, fontFamily:'"JetBrains Mono",monospace',
                }}>skip → play again</button>
              </>
            )}
            {qualifies && submitted && (
              <>
                <GlowText color={COLORS.acidGreen} size={13} style={{ marginTop:10 }}>
                  ✓ Score gravado no ledger!
                </GlowText>
                <NeonButton onClick={startGame}>RESTART</NeonButton>
              </>
            )}
            {!qualifies && (
              <>
                <GlowText color={`${COLORS.white}44`} size={10} style={{ marginTop:8 }}>
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
          { icon: '◀ ▶', label: 'STEER' },
          { icon: '▲',   label: 'JUMP' },
          { icon: '▼',   label: 'DUCK' },
          { icon: '◑',   label: 'ENDURO / RUNNER' },
        ].map(({ icon, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, color: COLORS.acidGreen, textShadow: `0 0 8px ${COLORS.acidGreen}` }}>{icon}</p>
            <p style={{ margin: '2px 0 0', fontSize: 8, color: `${COLORS.white}44`, fontFamily: '"Orbitron",monospace', letterSpacing: 1 }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

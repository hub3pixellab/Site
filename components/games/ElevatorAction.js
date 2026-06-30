// /components/games/ElevatorAction.js
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
  grid:        'rgba(79,20,135,0.13)',
};

const W            = 560;
const H            = 580;
const CELL         = 28;
const COLS         = W / CELL;
const FLOOR_H      = CELL * 3;
const NUM_FLOORS   = 8;
const WORLD_H      = NUM_FLOORS * FLOOR_H;

const PLAYER_W     = 20;
const PLAYER_H     = 26;
const PLAYER_SPEED = 3;
const JUMP_FORCE   = -8.5;
const GRAVITY      = 0.38;
const BULLET_SPEED = 7;
const FIRE_CD      = 320;
const ENEMY_SPEED  = 1.1;
const QUALIFY_SCORE = 500;
const LIVES_START  = 3;

const SHAFT_COLS = [4, 10, 16];
const SHAFT_W    = 2;

const DOOR_DEFS = [
  { floor: 1, col: 2,  token: { symbol: '₿', color: '#F7931A', pts: 300, label: 'BTC'  } },
  { floor: 2, col: 14, token: { symbol: 'Ξ', color: COLORS.cyan, pts: 200, label: 'ETH'  } },
  { floor: 3, col: 7,  token: { symbol: '◎', color: '#9945FF', pts: 250, label: 'SOL'  } },
  { floor: 4, col: 17, token: { symbol: '✦', color: COLORS.magenta, pts: 500, label: 'PEPE' } },
  { floor: 5, col: 2,  token: { symbol: '●', color: '#F0B90B', pts: 150, label: 'BNB'  } },
  { floor: 6, col: 12, token: { symbol: 'Ξ', color: COLORS.cyan, pts: 200, label: 'ETH'  } },
  { floor: 7, col: 6,  token: { symbol: '₿', color: '#F7931A', pts: 300, label: 'BTC'  } },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function floorY(floor) { return floor * FLOOR_H; }
function floorAt(worldY) { return Math.floor(worldY / FLOOR_H); }

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

function makeParticles(x, y, color, count = 12, spd = 4) {
  return Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const s = 0.5 + Math.random() * spd;
    return { x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, r: 1.5+Math.random()*3.5, life: 25+Math.random()*20, maxLife: 45, color };
  });
}

function makeEnemy(floor, col) {
  const y = floorY(floor) + FLOOR_H - CELL - PLAYER_H;
  return {
    id: Math.random(),
    x: col * CELL, y,
    vx: ENEMY_SPEED * (Math.random() < 0.5 ? 1 : -1),
    floor, w: PLAYER_W, h: PLAYER_H,
    alive: true,
    fireTimer: 80 + Math.floor(Math.random() * 120),
    alertTimer: 0,
  };
}

function rectsCollide(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function buildWorld() {
  const doors = DOOR_DEFS.map(d => ({
    ...d,
    x: d.col * CELL,
    y: floorY(d.floor) + FLOOR_H - CELL * 2 - 4,
    w: CELL * 2,
    h: CELL * 2,
    open: false,
    collected: false,
    collecting: false,
  }));

  const elevators = SHAFT_COLS.map((col, idx) => ({
    idx, col,
    x: col * CELL,
    y: floorY(NUM_FLOORS - 1) + FLOOR_H - CELL,
    w: SHAFT_W * CELL,
    h: CELL,
    targetFloor: NUM_FLOORS - 1,
    moving: false,
    speed: 1.8,
  }));

  const enemies = [];
  for (let f = 1; f < NUM_FLOORS; f++) {
    const count = 1 + (f % 2 === 0 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const col = 1 + Math.floor(Math.random() * (COLS - 3));
      enemies.push(makeEnemy(f, col));
    }
  }
  return { doors, elevators, enemies };
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawBackground(ctx) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  for (let sy = 0; sy < H; sy += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, sy, W, 1);
  }
  const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
  grd.addColorStop(0, 'rgba(79,20,135,0.18)');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

function drawFloors(ctx, camY) {
  for (let f = 0; f < NUM_FLOORS; f++) {
    const fy = floorY(f) + FLOOR_H - CELL - camY;
    ctx.save();
    ctx.strokeStyle = COLORS.ultraviolet;
    ctx.shadowColor = COLORS.ultraviolet;
    ctx.shadowBlur  = 6;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, fy + CELL);
    ctx.lineTo(W, fy + CELL);
    ctx.stroke();
    ctx.fillStyle = `rgba(79,20,135,0.5)`;
    ctx.shadowBlur = 0;
    ctx.font = '9px "Orbitron", monospace';
    ctx.fillText(`F${NUM_FLOORS - f}`, 4, fy - 2);
    ctx.strokeStyle = 'rgba(79,20,135,0.25)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, floorY(f) - camY);
    ctx.lineTo(W, floorY(f) - camY);
    ctx.stroke();
    ctx.restore();

    SHAFT_COLS.forEach(sc => {
      ctx.save();
      ctx.fillStyle = 'rgba(0,240,255,0.04)';
      ctx.fillRect(sc * CELL, floorY(f) - camY, SHAFT_W * CELL, FLOOR_H);
      ctx.strokeStyle = 'rgba(0,240,255,0.15)';
      ctx.lineWidth   = 1;
      ctx.strokeRect(sc * CELL, floorY(f) - camY, SHAFT_W * CELL, FLOOR_H);
      ctx.restore();
    });
  }
}

function drawDoor(ctx, door, camY) {
  const sx = door.x;
  const sy = door.y - camY;
  if (sy > H + 40 || sy < -80) return;
  ctx.save();
  const color = door.collected ? 'rgba(255,255,255,0.15)' : (door.token?.color || COLORS.cyan);
  ctx.shadowColor = color;
  ctx.shadowBlur  = door.open ? 20 : 8;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.fillStyle   = door.open ? `${color}08` : `${color}18`;
  roundRect(ctx, sx + 2, sy, door.w - 4, door.h, 3);
  ctx.fill(); ctx.stroke();
  if (!door.collected && door.token) {
    ctx.fillStyle   = door.open ? door.token.color : `${door.token.color}88`;
    ctx.shadowColor = door.token.color;
    ctx.shadowBlur  = door.open ? 16 : 6;
    ctx.font        = `bold ${door.open ? 16 : 11}px "JetBrains Mono", monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(door.token.symbol, sx + door.w/2, sy + door.h/2);
  }
  if (door.collected) {
    ctx.fillStyle   = 'rgba(255,255,255,0.15)';
    ctx.font        = '10px monospace';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText('✓', sx + door.w/2, sy + door.h/2);
  }
  ctx.restore();
}

function drawElevator(ctx, elev, camY) {
  const sy = elev.y - camY;
  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur  = elev.moving ? 16 : 8;
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth   = 1.8;
  ctx.fillStyle   = 'rgba(0,240,255,0.1)';
  roundRect(ctx, elev.x + 1, sy, elev.w - 2, elev.h, 3);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle   = COLORS.cyan;
  ctx.shadowBlur  = 6;
  ctx.font        = '10px monospace';
  ctx.textAlign   = 'center';
  ctx.fillText(elev.moving ? '⬆' : '■', elev.x + elev.w/2, sy + elev.h/2 + 4);
  ctx.restore();
}

function drawPlayer(ctx, p, tick) {
  if (p.dead) return;
  if (p.invincible > 0 && Math.floor(tick / 5) % 2 === 0) return;
  const sx = p.x;
  const sy = p.y;
  ctx.save();
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur  = 14;
  ctx.fillStyle = COLORS.acidGreen;
  roundRect(ctx, sx + 3, sy + 8, PLAYER_W - 6, PLAYER_H - 8, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx + PLAYER_W/2, sy + 7, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.bg;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(sx + PLAYER_W/2 + (p.facingRight ? 2 : -2), sy + 6, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.acidGreen;
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur = 6;
  const gunX = p.facingRight ? sx + PLAYER_W - 2 : sx - 4;
  ctx.fillRect(gunX, sy + 14, 6, 3);
  ctx.restore();
}

function drawEnemy(ctx, e) {
  if (!e.alive) return;
  const sx = e.x;
  const sy = e.y;
  const alert = e.alertTimer > 0;
  ctx.save();
  ctx.shadowColor = alert ? COLORS.magenta : COLORS.ultraviolet;
  ctx.shadowBlur  = alert ? 18 : 10;
  ctx.fillStyle = alert ? COLORS.magenta : '#8B44CC';
  roundRect(ctx, sx + 3, sy + 8, e.w - 6, e.h - 8, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx + e.w/2, sy + 7, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = alert ? COLORS.acidGreen : COLORS.cyan;
  ctx.shadowBlur = 6;
  ctx.fillRect(sx + e.w/2 - (e.vx > 0 ? 1 : 5), sy + 4, 3, 3);
  if (alert) {
    ctx.fillStyle   = COLORS.acidGreen;
    ctx.shadowColor = COLORS.acidGreen;
    ctx.shadowBlur  = 12;
    ctx.font        = 'bold 11px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('!', sx + e.w/2, sy - 4);
  }
  ctx.restore();
}

function drawBullet(ctx, b, isEnemy) {
  const color = isEnemy ? COLORS.magenta : COLORS.acidGreen;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur  = 10;
  ctx.fillStyle   = color;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
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
    ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
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
    ctx.font        = `bold 13px "Orbitron", monospace`;
    ctx.textAlign   = 'center';
    ctx.fillText(`+${f.pts}`, f.x, f.y);
    ctx.restore();
  });
}

function drawHUD(ctx, score, lives, tokens, totalTokens) {
  ctx.save();
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle   = COLORS.acidGreen;
  ctx.shadowColor = COLORS.acidGreen;
  ctx.shadowBlur  = 8;
  ctx.fillText(`SCORE  ${String(score).padStart(6,'0')}`, 10, 20);
  ctx.fillStyle   = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.fillText(`INTEL  ${tokens}/${totalTokens}`, 10, 36);
  ctx.fillStyle   = COLORS.magenta;
  ctx.shadowColor = COLORS.magenta;
  ctx.textAlign   = 'right';
  ctx.fillText('▲'.repeat(Math.max(0, lives)), W - 10, 20);
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
      background: 'rgba(11,9,20,0.9)',
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
export default function ElevatorAction({ onGameOver }) {
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

  const initState = useCallback(() => {
    const { doors, elevators, enemies } = buildWorld();
    return {
      tick: 0, score: 0, lives: LIVES_START, phase: 'playing', camY: 0,
      player: {
        x: W / 2 - PLAYER_W / 2,
        y: floorY(NUM_FLOORS - 1) + FLOOR_H - CELL - PLAYER_H,
        vx: 0, vy: 0,
        onGround: true,
        facingRight: true,
        invincible: 90,
        dead: false,
        onElevator: false,
        elevatorIdx: -1,
      },
      doors, elevators, enemies,
      bullets: [], enemyBullets: [],
      particles: [], floats: [],
      tokensCollected: 0,
      totalTokens: doors.length,
    };
  }, []);

  const killPlayer = useCallback((s) => {
    s.lives--;
    s.particles.push(...makeParticles(s.player.x + PLAYER_W/2, s.player.y + PLAYER_H/2, COLORS.magenta, 24, 5));
    if (s.lives <= 0) {
      s.phase = 'gameover';
      setUiScore(s.score);
      if (s.score > highRef.current) { highRef.current = s.score; setUiHigh(s.score); }
      setPhase('gameover');
      onGameOver?.(s.score);
    } else {
      s.player.x = W / 2 - PLAYER_W / 2;
      s.player.y = floorY(NUM_FLOORS - 1) + FLOOR_H - CELL - PLAYER_H;
      s.player.vx = 0; s.player.vy = 0;
      s.player.onGround = true;
      s.player.dead = false;
      s.player.invincible = 120;
      s.player.onElevator = false;
    }
  }, [onGameOver]);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    const frame = (now) => {
      const s = stateRef.current;
      if (!s || s.phase !== 'playing') return;
      rafRef.current = requestAnimationFrame(frame);
      s.tick++;
      const { player: p } = s;

      const left  = keysRef.current['ArrowLeft']  || keysRef.current['a'];
      const right = keysRef.current['ArrowRight'] || keysRef.current['d'];
      const up    = keysRef.current['ArrowUp']    || keysRef.current['w'];
      const down  = keysRef.current['ArrowDown']  || keysRef.current['s'];

      if (!p.dead) {
        if (left)  { p.vx = -PLAYER_SPEED; p.facingRight = false; }
        else if (right) { p.vx = PLAYER_SPEED; p.facingRight = true; }
        else p.vx = 0;

        if (up && p.onGround && !p.onElevator) {
          p.vy = JUMP_FORCE;
          p.onGround = false;
        }

        if ((keysRef.current[' '] || keysRef.current['z']) && now - lastFire.current > FIRE_CD) {
          lastFire.current = now;
          s.bullets.push({
            x:  p.x + (p.facingRight ? PLAYER_W : 0),
            y:  p.y + 15,
            vx: (p.facingRight ? 1 : -1) * BULLET_SPEED,
            vy: 0, life: 40,
          });
        }

        // Elevator interaction
        s.elevators.forEach((el, idx) => {
          const onShaft = p.x + PLAYER_W > el.x && p.x < el.x + el.w;
          const nearElevator = Math.abs((p.y + PLAYER_H) - (el.y + el.h)) < 16 && onShaft;
          if (nearElevator && !p.onElevator && up) {
            p.onElevator  = true;
            p.elevatorIdx = idx;
          }
          if (p.onElevator && p.elevatorIdx === idx) {
            p.x = el.x + (el.w - PLAYER_W) / 2;
            p.y = el.y - PLAYER_H;
            p.vx = 0; p.vy = 0; p.onGround = true;
            if (up && !el.moving) {
              el.targetFloor = Math.max(0, el.targetFloor - 1);
              el.moving = true;
            }
            if (down && !el.moving) {
              el.targetFloor = Math.min(NUM_FLOORS - 1, el.targetFloor + 1);
              el.moving = true;
            }
            if (left || right) {
              p.onElevator = false;
              p.elevatorIdx = -1;
            }
          }
        });
      }

      // Physics
      if (!p.onElevator) {
        p.vy += GRAVITY;
        p.x  += p.vx;
        p.y  += p.vy;
        p.x = Math.max(0, Math.min(W - PLAYER_W, p.x));
        p.onGround = false;
        for (let f = 0; f < NUM_FLOORS; f++) {
          const platformY = floorY(f) + FLOOR_H - CELL;
          if (p.vy >= 0 &&
              p.y + PLAYER_H >= platformY &&
              p.y + PLAYER_H <= platformY + 8 &&
              p.y + PLAYER_H < platformY + 16) {
            p.y = platformY - PLAYER_H;
            p.vy = 0;
            p.onGround = true;
            break;
          }
        }
        if (p.y + PLAYER_H > WORLD_H) {
          p.y = WORLD_H - PLAYER_H;
          p.vy = 0;
          p.onGround = true;
        }
        if (p.y < 0) { p.y = 0; p.vy = 0; }
      }
      if (p.invincible > 0) p.invincible--;

      // Elevators
      s.elevators.forEach(el => {
        const targetY = floorY(el.targetFloor) + FLOOR_H - CELL - el.h;
        if (el.moving) {
          const dy = targetY - el.y;
          if (Math.abs(dy) < el.speed + 1) {
            el.y = targetY;
            el.moving = false;
          } else {
            el.y += Math.sign(dy) * el.speed;
          }
        }
      });

      // Enemies
      s.enemies.forEach(e => {
        if (!e.alive) return;
        const playerFloor = floorAt(p.y + PLAYER_H);
        const sameFloor   = playerFloor === e.floor;
        if (sameFloor) e.alertTimer = Math.max(e.alertTimer, 60);
        if (e.alertTimer > 0) e.alertTimer--;
        e.x += e.vx;
        const platformY = floorY(e.floor) + FLOOR_H - CELL;
        const hitWall = e.x < 0 || e.x + e.w > W;
        const hitShaft = SHAFT_COLS.some(sc => e.x + e.w > sc * CELL && e.x < sc * CELL + SHAFT_W * CELL);
        if (hitWall || hitShaft) e.vx *= -1;
        e.y = platformY - e.h;
        if (sameFloor && e.alertTimer > 0) {
          e.fireTimer--;
          if (e.fireTimer <= 0) {
            e.fireTimer = 70;
            const dir = p.x > e.x ? 1 : -1;
            s.enemyBullets.push({
              x: e.x + (dir > 0 ? e.w : 0), y: e.y + 14,
              vx: dir * 4.5, vy: 0, life: 50,
            });
          }
        }
      });

      // Bullets
      s.bullets = s.bullets
        .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy, life: b.life - 1 }))
        .filter(b => b.life > 0 && b.x >= 0 && b.x <= W);
      s.enemyBullets = s.enemyBullets
        .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy, life: b.life - 1 }))
        .filter(b => b.life > 0 && b.x >= 0 && b.x <= W);

      // Bullets vs enemies
      s.bullets.forEach(b => {
        if (b.dead) return;
        s.enemies.forEach(e => {
          if (!e.alive || b.dead) return;
          if (rectsCollide(b.x - 3, b.y - 3, 6, 6, e.x, e.y, e.w, e.h)) {
            b.dead = true;
            e.alive = false;
            const pts = 100;
            s.score += pts;
            s.floats.push({ x: e.x + e.w/2, y: e.y - s.camY, pts, life: 40, maxLife: 40, color: COLORS.magenta });
            s.particles.push(...makeParticles(e.x + e.w/2, e.y + e.h/2, COLORS.magenta, 16, 4));
          }
        });
      });
      s.bullets = s.bullets.filter(b => !b.dead);

      // Enemy bullets vs player
      if (!p.dead && p.invincible <= 0) {
        for (const b of s.enemyBullets) {
          if (rectsCollide(b.x-3, b.y-3, 6, 6, p.x, p.y, PLAYER_W, PLAYER_H)) {
            b.dead = true;
            killPlayer(s);
            break;
          }
        }
        s.enemyBullets = s.enemyBullets.filter(b => !b.dead);
      }

      // Enemy contact
      if (!p.dead && p.invincible <= 0) {
        for (const e of s.enemies) {
          if (!e.alive) continue;
          if (rectsCollide(p.x+2, p.y+2, PLAYER_W-4, PLAYER_H-4, e.x, e.y, e.w, e.h)) {
            killPlayer(s);
            break;
          }
        }
      }

      // Doors
      s.doors.forEach(door => {
        if (door.collected) return;
        if (rectsCollide(p.x, p.y, PLAYER_W, PLAYER_H, door.x, door.y, door.w, door.h)) {
          door.open = true;
          if (!door.collecting) {
            door.collecting = true;
            setTimeout(() => {
              const st = stateRef.current;
              if (!st) return;
              const d = st.doors.find(dd => dd.floor === door.floor && dd.col === door.col);
              if (d && !d.collected) {
                d.collected = true;
                const pts = d.token.pts;
                st.score += pts;
                st.tokensCollected++;
                st.floats.push({ x: d.x + d.w/2, y: d.y - st.camY, pts, life: 50, maxLife: 50, color: d.token.color });
                st.particles.push(...makeParticles(d.x + d.w/2, d.y + d.h/2, d.token.color, 20, 5));
              }
            }, 400);
          }
        } else {
          door.open = false;
        }
      });

      // Camera
      const targetCamY = p.y - H / 2 + PLAYER_H;
      s.camY += (targetCamY - s.camY) * 0.1;
      s.camY  = Math.max(0, Math.min(WORLD_H - H, s.camY));
      const camOff = s.camY;

      if (s.score > highRef.current) { highRef.current = s.score; setUiHigh(s.score); }
      setUiScore(s.score);

      // Win condition
      if (s.tokensCollected >= s.totalTokens && s.doors.every(d => d.collected)) {
        // bonus + respawn doors
        s.score += 1000;
        s.tokensCollected = 0;
        s.doors = buildWorld().doors;
        s.enemies = [...s.enemies, ...buildWorld().enemies];
      }

      // Particles/floats
      s.particles = s.particles
        .map(pp => ({ ...pp, x: pp.x+pp.vx, y: pp.y+pp.vy, life: pp.life-1, vx: pp.vx*0.9, vy: pp.vy*0.9 }))
        .filter(pp => pp.life > 0);
      s.floats = s.floats
        .map(f => ({ ...f, y: f.y - 0.9, life: f.life - 1 }))
        .filter(f => f.life > 0);

      // Respawn enemies if all dead
      const aliveCount = s.enemies.filter(e => e.alive).length;
      if (aliveCount === 0) {
        for (let f = 1; f < NUM_FLOORS; f++) {
          const col = 1 + Math.floor(Math.random() * (COLS - 3));
          s.enemies.push(makeEnemy(f, col));
        }
      }

      // DRAW
      drawBackground(ctx);
      drawFloors(ctx, camOff);
      s.doors.forEach(d => drawDoor(ctx, d, camOff));
      s.elevators.forEach(el => drawElevator(ctx, el, camOff));
      s.enemyBullets.forEach(b => drawBullet(ctx, { ...b, y: b.y - camOff }, true));
      s.enemies.forEach(e => drawEnemy(ctx, { ...e, y: e.y - camOff }));
      drawPlayer(ctx, { ...p, y: p.y - camOff }, s.tick);
      s.bullets.forEach(b => drawBullet(ctx, { ...b, y: b.y - camOff }, false));
      drawParticles(ctx, s.particles);
      drawFloats(ctx, s.floats);

      // Border
      ctx.save();
      ctx.strokeStyle = COLORS.ultraviolet;
      ctx.shadowColor = COLORS.ultraviolet;
      ctx.shadowBlur  = 14;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);
      ctx.restore();

      drawHUD(ctx, s.score, s.lives, s.tokensCollected, s.totalTokens);
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [killPlayer]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stateRef.current = initState();
    setUiScore(0);
    setSubmitted(false);
    setFormError('');
    setPhase('playing');
    setTimeout(() => startLoop(), 0);
  }, [initState, startLoop]);

  useEffect(() => { return () => cancelAnimationFrame(rafRef.current); }, []);

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

  // Touch swipe controls
  const touchRef = useRef(null);
  const handleTouchStart = e => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  };
  const handleTouchEnd = e => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.time;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx < 12 && ady < 12 && dt < 220) {
      keysRef.current[' '] = true;
      setTimeout(() => { keysRef.current[' '] = false; }, 80);
    } else if (ady > adx && dy < -30) {
      keysRef.current['ArrowUp'] = true;
      setTimeout(() => { keysRef.current['ArrowUp'] = false; }, 200);
    } else if (ady > adx && dy > 30) {
      keysRef.current['ArrowDown'] = true;
      setTimeout(() => { keysRef.current['ArrowDown'] = false; }, 200);
    } else if (adx > ady) {
      const key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      keysRef.current[key] = true;
      setTimeout(() => { keysRef.current[key] = false; }, 250);
    }
    touchRef.current = null;
  };

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
        body: JSON.stringify({ ...leadForm, score: uiScore, game: 'elevator-action' }),
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: `1px solid rgba(79,20,135,0.4)`,
        background: 'rgba(11,9,20,0.7)',
      }}>
        <GlowText color={COLORS.acidGreen} size={14} style={{ letterSpacing: 4, textAlign: 'left' }}>
          ELEVATOR ACTION
        </GlowText>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44` }}>SCORE</p>
            <GlowText color={COLORS.acidGreen} size={16}>{String(uiScore).padStart(6,'0')}</GlowText>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44` }}>BEST</p>
            <GlowText color={COLORS.cyan} size={16}>{String(uiHigh).padStart(6,'0')}</GlowText>
          </div>
        </div>
      </div>

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
            <GlowText color={COLORS.acidGreen} size={24}>ELEVATOR ACTION</GlowText>
            <GlowText color={COLORS.cyan} size={11} style={{ marginTop: 4 }}>
              HUB3 INTEL RETRIEVAL
            </GlowText>
            <div style={{
              marginTop: 14, display: 'grid',
              gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 360,
            }}>
              {[
                { k: '← →  /  A D',  d: 'Mover' },
                { k: '↑  /  W',       d: 'Pular / Entrar elevador' },
                { k: '↓  /  S',       d: 'Descer andares' },
                { k: 'SPACE  /  Z',   d: 'Atirar' },
                { k: 'PORTAS',        d: 'Encoste = coletar token' },
                { k: 'SWIPE / TAP',   d: 'Mobile controls' },
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
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {DOOR_DEFS.slice(0,4).map((d, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: `${d.token.color}0f`,
                  border: `1px solid ${d.token.color}44`,
                  borderRadius: 6, padding: '4px 10px',
                }}>
                  <span style={{ fontSize:16, color: d.token.color, textShadow:`0 0 8px ${d.token.color}` }}>{d.token.symbol}</span>
                  <div>
                    <p style={{ margin:0, fontSize:9, color: d.token.color, fontFamily:'"Orbitron",monospace' }}>{d.token.label}</p>
                    <p style={{ margin:0, fontSize:9, color:`${COLORS.white}66` }}>{d.token.pts} pts</p>
                  </div>
                </div>
              ))}
            </div>
            <NeonButton onClick={startGame}>DEPLOY AGENT</NeonButton>
          </Overlay>
        )}

        {phase === 'gameover' && (
          <Overlay>
            <GlowText color={COLORS.magenta} size={26}>AGENT DOWN</GlowText>
            <GlowText color={`${COLORS.white}55`} size={11} style={{ marginTop:4 }}>
              MISSION COMPROMISED
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
                  <NeonInput placeholder="NICKNAME / AGENT ID" value={leadForm.nickname}
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
                  ✓ Intel transmitida ao ledger!
                </GlowText>
                <NeonButton onClick={startGame}>NEW MISSION</NeonButton>
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
          { icon: '◀ ▶', label: 'MOVE' },
          { icon: '▲',   label: 'JUMP/UP' },
          { icon: '▼',   label: 'DOWN' },
          { icon: '●',   label: 'TAP = FIRE' },
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

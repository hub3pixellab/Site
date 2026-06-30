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
  grid:        'rgba(34,224,245,0.14)',
};

const CELL = 24, COLS = 23, ROWS = 21;
const W = COLS * CELL, H = ROWS * CELL;
const PAC_SPEED = 5, GHOST_SPEED = 6;
const FRIGHTENED_DURATION = 300;
const PELLET_PTS = 10, POWER_PTS = 50, GHOST_PTS = 200;

const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,1,1,1,1,2,1,1,1,2,1,1,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,2,1,2,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,0,0,1,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,1,4,4,4,1,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,0,0,4,4,4,0,0,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,4,4,4,4,4,4,4,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,2,0,2,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,2,1,2,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function buildMaze() { return MAZE_TEMPLATE.map((row) => [...row]); }
function countPellets(maze) { let n = 0; maze.forEach((row) => row.forEach((c) => { if (c === 2 || c === 3) n++; })); return n; }

const GHOST_DEFS = [
  { id: 0, name: 'BLINKY', color: '#FF007A', scatter: [0, COLS - 1] },
  { id: 1, name: 'PINKY',  color: '#FF99CC', scatter: [0, 0] },
  { id: 2, name: 'INKY',   color: '#22E0F5', scatter: [ROWS - 1, COLS - 1] },
  { id: 3, name: 'CLYDE',  color: '#FF9416', scatter: [ROWS - 1, 0] },
];

const DIRS = { UP: {dx:0,dy:-1}, DOWN: {dx:0,dy:1}, LEFT: {dx:-1,dy:0}, RIGHT: {dx:1,dy:0} };
const DIR_KEYS = Object.keys(DIRS);
const OPPOSITE = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT' };

function isWall(maze, col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true;
  return maze[row][col] === 1;
}
function isGhostHouse(maze, col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
  return maze[row][col] === 4;
}
function wrapCol(col) { if (col < 0) return COLS - 1; if (col >= COLS) return 0; return col; }
function dist(ax, ay, bx, by) { return Math.abs(ax - bx) + Math.abs(ay - by); }

function ghostTarget(ghost, pac, maze, blinky) {
  if (ghost.frightened > 0) return null;
  const { col: pc, row: pr, dir: pd } = pac;
  switch (ghost.id) {
    case 0: return { col: pc, row: pr };
    case 1: { const d = DIRS[pd] || DIRS.RIGHT; return { col: pc + d.dx * 4, row: pr + d.dy * 4 }; }
    case 2: { const d = DIRS[pd] || DIRS.RIGHT; const a = { col: pc + d.dx * 2, row: pr + d.dy * 2 }; return { col: a.col * 2 - blinky.col, row: a.row * 2 - blinky.row }; }
    case 3: return dist(ghost.col, ghost.row, pc, pr) > 8 ? { col: pc, row: pr } : { col: GHOST_DEFS[3].scatter[1], row: GHOST_DEFS[3].scatter[0] };
    default: return { col: pc, row: pr };
  }
}

function bestDir(ghost, target, maze, fromHouse = false) {
  const opp = OPPOSITE[ghost.dir];
  let best = null, bestDist = Infinity;
  DIR_KEYS.forEach((dirName) => {
    if (dirName === opp && !fromHouse) return;
    const d = DIRS[dirName];
    const nc = ghost.col + d.dx, nr = ghost.row + d.dy;
    const wc = wrapCol(nc);
    if (isWall(maze, wc, nr)) return;
    if (!fromHouse && isGhostHouse(maze, wc, nr)) return;
    const td = target ? dist(wc, nr, target.col, target.row) : Math.random();
    if (td < bestDist) { bestDist = td; best = dirName; }
  });
  return best || ghost.dir;
}

function randomFrightenedDir(ghost, maze) {
  const opp = OPPOSITE[ghost.dir];
  const options = DIR_KEYS.filter((d) => {
    if (d === opp) return false;
    const { dx, dy } = DIRS[d];
    const nc = wrapCol(ghost.col + dx), nr = ghost.row + dy;
    return !isWall(maze, nc, nr) && !isGhostHouse(maze, nc, nr);
  });
  if (options.length === 0) return opp;
  return options[Math.floor(Math.random() * options.length)];
}

function makeGhosts() {
  return GHOST_DEFS.map((def, i) => ({
    ...def, col: 11, row: 9, px: 11 * CELL, py: 9 * CELL,
    dir: 'LEFT', frightened: 0, eaten: false,
    inHouse: true, releaseTimer: i * 80, moveTimer: 0,
  }));
}

function makeParticles(x, y, color, count = 10) {
  return Array.from({ length: count }, () => ({
    x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
    r: 2 + Math.random() * 4, life: 25 + Math.random() * 20, maxLife: 45, color,
  }));
}

function drawMaze(ctx, maze, tick) {
  maze.forEach((row, ry) => row.forEach((cell, cx) => {
    const px = cx * CELL, py = ry * CELL;
    if (cell === 1) {
      ctx.save();
      ctx.fillStyle = COLORS.ultraviolet;
      ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 6;
      ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      ctx.strokeStyle = 'rgba(34,224,245,0.5)'; ctx.lineWidth = 1;
      ctx.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);
      ctx.restore();
    } else if (cell === 2) {
      ctx.save();
      ctx.fillStyle = COLORS.acidGreen; ctx.shadowColor = COLORS.acidGreen; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(px + CELL/2, py + CELL/2, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    } else if (cell === 3) {
      const pulse = 0.7 + 0.3 * Math.sin(tick * 0.08);
      ctx.save();
      ctx.fillStyle = COLORS.magenta; ctx.shadowColor = COLORS.magenta;
      ctx.shadowBlur = 14 * pulse; ctx.globalAlpha = 0.7 + 0.3 * pulse;
      ctx.beginPath(); ctx.arc(px + CELL/2, py + CELL/2, 5.5 * pulse, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }));
}

function drawPac(ctx, pac) {
  const { px, py, dir, mouthOpen } = pac;
  const cx = px + CELL/2, cy = py + CELL/2, r = CELL * 0.44;
  const mouth = mouthOpen * 0.28 * Math.PI;
  const angles = { RIGHT: 0, LEFT: Math.PI, UP: -Math.PI/2, DOWN: Math.PI/2 };
  const baseAngle = angles[dir] ?? 0;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(baseAngle);
  ctx.shadowColor = COLORS.acidGreen; ctx.shadowBlur = 18;
  ctx.fillStyle = COLORS.acidGreen;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, mouth, Math.PI*2 - mouth); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = COLORS.bg;
  ctx.beginPath(); ctx.arc(r * 0.28, -r * 0.42, r * 0.14, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawGhost(ctx, ghost, tick) {
  const cx = ghost.px + CELL/2, cy = ghost.py + CELL/2, r = CELL * 0.42;
  const isFrightened = ghost.frightened > 0;
  const isFlashing = isFrightened && ghost.frightened < 80 && Math.floor(tick/12) % 2 === 0;
  const color = ghost.eaten ? 'transparent' : isFrightened ? (isFlashing ? COLORS.white : '#1a0a3a') : ghost.color;
  ctx.save(); ctx.translate(cx, cy);
  if (!ghost.eaten) {
    ctx.shadowColor = isFrightened ? '#1a0a3a' : ghost.color; ctx.shadowBlur = 14;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -r*0.1, r, Math.PI, 0);
    const segs = 4, segW = (r*2)/segs;
    for (let i = 0; i < segs; i++) {
      const x1 = r - i*segW, x2 = r - (i+1)*segW;
      const waveY = r*0.5*(i%2===0 ? 1 : 0.3);
      ctx.quadraticCurveTo(x1 - segW/2, r*0.55 + waveY, x2, r*0.35);
    }
    ctx.closePath(); ctx.fill();
    if (!isFrightened) {
      ctx.fillStyle = COLORS.white;
      ctx.beginPath();
      ctx.ellipse(-r*0.3, -r*0.2, r*0.2, r*0.26, 0, 0, Math.PI*2);
      ctx.ellipse(r*0.3, -r*0.2, r*0.2, r*0.26, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = COLORS.ultraviolet;
      const ex = { LEFT: -r*0.08, RIGHT: r*0.08, UP: 0, DOWN: 0 };
      const ey = { UP: -r*0.1, DOWN: r*0.1, LEFT: 0, RIGHT: 0 };
      const ox = ex[ghost.dir] || 0, oy = ey[ghost.dir] || 0;
      ctx.beginPath();
      ctx.arc(-r*0.3 + ox, -r*0.2 + oy, r*0.1, 0, Math.PI*2);
      ctx.arc(r*0.3 + ox, -r*0.2 + oy, r*0.1, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.fillStyle = isFlashing ? COLORS.magenta : COLORS.acidGreen;
      ctx.fillRect(-r*0.35, -r*0.15, r*0.15, r*0.1);
      ctx.fillRect(r*0.2, -r*0.15, r*0.15, r*0.1);
    }
  } else {
    ctx.fillStyle = ghost.color; ctx.shadowColor = ghost.color; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-r*0.3, 0, r*0.2, r*0.26, 0, 0, Math.PI*2);
    ctx.ellipse(r*0.3, 0, r*0.2, r*0.26, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(ctx, particles) {
  particles.forEach((p) => {
    const a = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = a; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });
}

function drawHUD(ctx, score, lives, level, frightened) {
  ctx.save();
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = COLORS.acidGreen; ctx.shadowColor = COLORS.acidGreen; ctx.shadowBlur = 8;
  ctx.fillText(`SCORE  ${String(score).padStart(6,'0')}`, 8, 16);
  ctx.fillStyle = COLORS.cyan; ctx.shadowColor = COLORS.cyan;
  ctx.fillText(`LVL ${level}`, 8, 30);
  ctx.fillStyle = COLORS.magenta; ctx.shadowColor = COLORS.magenta; ctx.textAlign = 'right';
  ctx.fillText(`${'♥ '.repeat(lives).trim()}`, W - 8, 16);
  if (frightened > 0) {
    ctx.fillStyle = '#1a0a3a'; ctx.shadowColor = COLORS.magenta; ctx.shadowBlur = 16;
    ctx.textAlign = 'center'; ctx.font = 'bold 11px "Orbitron", monospace';
    ctx.fillText('⚡ POWER MODE', W/2, 16);
  }
  ctx.restore();
}

function drawFloatingScore(ctx, fs) {
  const a = fs.life / fs.maxLife;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = COLORS.acidGreen; ctx.shadowColor = COLORS.acidGreen; ctx.shadowBlur = 10;
  ctx.font = 'bold 13px "Orbitron", monospace'; ctx.textAlign = 'center';
  ctx.fillText(`+${fs.pts}`, fs.x, fs.y);
  ctx.restore();
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
    <button onClick={onClick} disabled={disabled} type={type} data-testid={testId} style={{
      marginTop: 12, padding: '10px 28px', background: 'transparent',
      border: `1.5px solid ${color}`, borderRadius: 6, color,
      fontSize: 13, fontFamily: '"Orbitron", monospace', letterSpacing: 3,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      boxShadow: `0 0 12px ${color}33`, transition: 'all 0.18s',
    }}>{children}</button>
  );
}

function NeonInput({ placeholder, value, onChange, type = 'text', testId, required }) {
  return (
    <input type={type} placeholder={placeholder} value={value} required={required}
      data-testid={testId} onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.cyan}55`,
        borderRadius: 5, padding: '8px 12px', color: COLORS.white,
        fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: 1, outline: 'none', width: '100%', boxSizing: 'border-box',
      }}
    />
  );
}

export default function Pac3Lab({ onGameOver }) {
  const { isRegistered, registration, registerLead } = useRegistration();
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);

  const [phase, setPhase] = useState('idle');
  const [uiScore, setUiScore] = useState(0);
  const [uiHigh, setUiHigh] = useState(0);
  const highRef = useRef(0);

  const [leadForm, setLeadForm] = useState({ nickname: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const initState = useCallback((level = 1) => {
    const maze = buildMaze();
    return {
      maze, tick: 0, score: 0, lives: 3, level,
      pelletsLeft: countPellets(maze), phase: 'playing',
      pac: {
        col: 11, row: 16, px: 11*CELL, py: 16*CELL,
        dir: 'LEFT', nextDir: 'LEFT', moveTimer: 0,
        mouthOpen: 0.5, mouthDir: 1,
      },
      ghosts: makeGhosts(), particles: [], floatingScores: [],
      ghostCombo: 0, frightenedTimer: 0,
    };
  }, []);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const frame = () => {
      const s = stateRef.current;
      if (!s || s.phase !== 'playing') return;
      s.tick++;
      const { pac, ghosts, maze } = s;
      const ghostSpeed = Math.max(4, GHOST_SPEED - Math.floor(s.level / 2));
      const pacSpeed = Math.max(3, PAC_SPEED - Math.floor(s.level / 3));

      pac.moveTimer++;
      if (pac.moveTimer >= pacSpeed) {
        pac.moveTimer = 0;
        const tryDir = (dirName) => {
          const d = DIRS[dirName];
          const nc = wrapCol(pac.col + d.dx); const nr = pac.row + d.dy;
          return !isWall(maze, nc, nr);
        };
        if (pac.nextDir !== pac.dir && tryDir(pac.nextDir)) pac.dir = pac.nextDir;
        if (tryDir(pac.dir)) {
          const d = DIRS[pac.dir];
          pac.col = wrapCol(pac.col + d.dx); pac.row = pac.row + d.dy;
          pac.px = pac.col * CELL; pac.py = pac.row * CELL;
        }
        pac.mouthOpen += 0.18 * pac.mouthDir;
        if (pac.mouthOpen >= 1) { pac.mouthOpen = 1; pac.mouthDir = -1; }
        if (pac.mouthOpen <= 0) { pac.mouthOpen = 0; pac.mouthDir = 1; }

        const cell = maze[pac.row]?.[pac.col];
        if (cell === 2) {
          maze[pac.row][pac.col] = 0;
          s.score += PELLET_PTS; s.pelletsLeft--;
          s.particles.push(...makeParticles(pac.px + CELL/2, pac.py + CELL/2, COLORS.acidGreen, 5));
        } else if (cell === 3) {
          maze[pac.row][pac.col] = 0;
          s.score += POWER_PTS; s.pelletsLeft--;
          s.frightenedTimer = FRIGHTENED_DURATION; s.ghostCombo = 0;
          ghosts.forEach((g) => { if (!g.eaten) g.frightened = FRIGHTENED_DURATION; });
          s.particles.push(...makeParticles(pac.px + CELL/2, pac.py + CELL/2, COLORS.magenta, 18));
        }
      }

      if (s.frightenedTimer > 0) {
        s.frightenedTimer--;
        ghosts.forEach((g) => { if (g.frightened > 0) g.frightened--; });
      }

      const blinky = ghosts[0];
      ghosts.forEach((ghost) => {
        if (ghost.inHouse) {
          ghost.releaseTimer--;
          if (ghost.releaseTimer <= 0) {
            ghost.inHouse = false; ghost.col = 11; ghost.row = 8;
            ghost.px = 11*CELL; ghost.py = 8*CELL; ghost.dir = 'LEFT';
          }
          return;
        }
        if (ghost.eaten) {
          const target = { col: 11, row: 9 };
          ghost.moveTimer++;
          if (ghost.moveTimer >= 2) {
            ghost.moveTimer = 0;
            const nd = bestDir(ghost, target, maze, true);
            const d = DIRS[nd];
            ghost.col = wrapCol(ghost.col + d.dx); ghost.row = ghost.row + d.dy;
            ghost.px = ghost.col * CELL; ghost.py = ghost.row * CELL; ghost.dir = nd;
            if (ghost.col === target.col && ghost.row === target.row) { ghost.eaten = false; ghost.frightened = 0; }
          }
          return;
        }
        ghost.moveTimer++;
        const spd = ghost.frightened > 0 ? ghostSpeed + 3 : ghostSpeed;
        if (ghost.moveTimer < spd) return;
        ghost.moveTimer = 0;
        let nd;
        if (ghost.frightened > 0) nd = randomFrightenedDir(ghost, maze);
        else { const target = ghostTarget(ghost, pac, maze, blinky); nd = bestDir(ghost, target, maze); }
        const d = DIRS[nd];
        ghost.col = wrapCol(ghost.col + d.dx); ghost.row = ghost.row + d.dy;
        ghost.px = ghost.col * CELL; ghost.py = ghost.row * CELL; ghost.dir = nd;
      });

      ghosts.forEach((ghost) => {
        if (ghost.inHouse || ghost.eaten) return;
        if (ghost.col === pac.col && ghost.row === pac.row) {
          if (ghost.frightened > 0) {
            ghost.eaten = true; ghost.frightened = 0;
            s.ghostCombo++;
            const pts = GHOST_PTS * s.ghostCombo;
            s.score += pts;
            s.floatingScores.push({ x: ghost.px + CELL/2, y: ghost.py, pts, life: 50, maxLife: 50 });
            s.particles.push(...makeParticles(ghost.px + CELL/2, ghost.py + CELL/2, ghost.color, 20));
          } else {
            s.lives--;
            s.particles.push(...makeParticles(pac.px + CELL/2, pac.py + CELL/2, COLORS.magenta, 30));
            if (s.lives <= 0) {
              s.phase = 'gameover'; setUiScore(s.score);
              if (s.score > highRef.current) { highRef.current = s.score; setUiHigh(s.score); }
              setPhase('gameover');
              onGameOver?.(s.score);
            } else {
              pac.col = 11; pac.row = 16; pac.px = 11*CELL; pac.py = 16*CELL;
              pac.dir = 'LEFT'; pac.nextDir = 'LEFT';
              s.ghosts = makeGhosts(); s.frightenedTimer = 0;
            }
          }
        }
      });

      if (s.pelletsLeft <= 0) {
        s.phase = 'levelup';
        setTimeout(() => {
          const next = initState(s.level + 1);
          next.score = s.score; next.lives = s.lives;
          stateRef.current = next; stateRef.current.phase = 'playing';
        }, 1200);
      }

      if (s.score > highRef.current) { highRef.current = s.score; setUiHigh(s.score); }
      setUiScore(s.score);

      s.particles = s.particles
        .map((p) => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, life: p.life-1, vx: p.vx*0.9, vy: p.vy*0.9 }))
        .filter((p) => p.life > 0);
      s.floatingScores = s.floatingScores
        .map((f) => ({ ...f, y: f.y - 0.8, life: f.life - 1 }))
        .filter((f) => f.life > 0);

      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.save();
      for (let sy = 0; sy < H; sy += 3) { ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(0, sy, W, 1); }
      ctx.restore();
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.6);
      grd.addColorStop(0, 'rgba(34,224,245,0.15)'); grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      drawMaze(ctx, maze, s.tick);
      drawParticles(ctx, s.particles);
      s.floatingScores.forEach((f) => drawFloatingScore(ctx, f));
      ghosts.forEach((g) => drawGhost(ctx, g, s.tick));
      drawPac(ctx, pac);
      drawHUD(ctx, s.score, s.lives, s.level, s.frightenedTimer);

      if (s.phase === 'levelup') {
        ctx.save();
        ctx.fillStyle = 'rgba(204,255,0,0.15)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = COLORS.acidGreen; ctx.shadowColor = COLORS.acidGreen; ctx.shadowBlur = 20;
        ctx.font = 'bold 22px "Orbitron", monospace'; ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${s.level} CLEAR!`, W/2, H/2);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [initState, onGameOver]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const st = initState(1);
    stateRef.current = st;
    setUiScore(0); setSubmitted(false); setFormError('');
    setPhase('playing');
    setTimeout(() => startLoop(), 0);
  }, [initState, startLoop]);

  useEffect(() => {
    if (phase === 'playing') startLoop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, startLoop]);

  useEffect(() => {
    const map = {
      ArrowUp:'UP', w:'UP', W:'UP',
      ArrowDown:'DOWN', s:'DOWN', S:'DOWN',
      ArrowLeft:'LEFT', a:'LEFT', A:'LEFT',
      ArrowRight:'RIGHT', d:'RIGHT', D:'RIGHT',
    };
    const onKey = (e) => {
      if (!map[e.key]) return;
      e.preventDefault();
      const st = stateRef.current;
      if (st?.pac) st.pac.nextDir = map[e.key];
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const st = stateRef.current;
    if (!st?.pac) return;
    let next;
    if (Math.abs(dx) > Math.abs(dy)) next = dx > 0 ? 'RIGHT' : 'LEFT';
    else next = dy > 0 ? 'DOWN' : 'UP';
    st.pac.nextDir = next;
    touchStart.current = null;
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!leadForm.nickname.trim()) { setFormError('Nickname obrigatório.'); return; }
    if (!leadForm.email.trim())    { setFormError('Email obrigatório.'); return; }
    if (!leadForm.phone.trim())    { setFormError('Telefone obrigatório.'); return; }
    setSubmitting(true);
    try {
      await registerLead({ ...leadForm, score: uiScore, game: 'pac3lab' });
      setSubmitted(true);
    } catch (err) { setFormError(err?.message || 'Falha ao enviar.'); }
    finally { setSubmitting(false); }
  };

  const logExistingScore = async () => {
    if (!registration) return;
    setSubmitting(true);
    try {
      await registerLead({
        nickname: registration.nickname, email: registration.email,
        phone: registration.phone, score: uiScore, game: 'pac3lab',
      });
      setSubmitted(true);
    } catch (err) { setFormError(err?.message || 'Falha'); }
    finally { setSubmitting(false); }
  };

  return (
    <div data-testid="pac3lab-root" style={{
      position: 'relative', width: '100%', maxWidth: W, margin: '0 auto',
      borderRadius: 12, overflow: 'hidden',
      border: `1.5px solid ${COLORS.cyan}`,
      boxShadow: `0 0 40px rgba(34,224,245,0.45), 0 0 80px rgba(34,224,245,0.18)`,
      background: COLORS.bg, fontFamily: '"JetBrains Mono", monospace', userSelect: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: `1px solid rgba(34,224,245,0.3)`,
        background: 'rgba(6,18,31,0.7)',
      }}>
        <GlowText color={COLORS.acidGreen} size={15} style={{ letterSpacing: 4, textAlign: 'left' }}>PAC3LAB</GlowText>
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>SCORE</p>
            <GlowText color={COLORS.acidGreen} size={15}>{String(uiScore).padStart(6,'0')}</GlowText>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: 2, color: `${COLORS.white}44` }}>BEST</p>
            <GlowText color={COLORS.cyan} size={15}>{String(uiHigh).padStart(6,'0')}</GlowText>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', lineHeight: 0 }}>
        <canvas ref={canvasRef} width={W} height={H}
          style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none' }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />

        {phase === 'idle' && (
          <Overlay>
            <GlowText color={COLORS.acidGreen} size={28}>PAC3LAB</GlowText>
            <GlowText color={COLORS.magenta} size={12} style={{ marginTop: 4 }}>WEB3 MAZE RUNNER</GlowText>
            <div style={{ marginTop: 12, display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              {GHOST_DEFS.map((g) => (
                <div key={g.name} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: `${g.color}0f`, border: `1px solid ${g.color}44`,
                  borderRadius: 6, padding: '4px 10px',
                }}>
                  <span style={{ fontSize: 14 }}>👻</span>
                  <span style={{ fontSize: 10, color: g.color, fontFamily: '"Orbitron", monospace' }}>{g.name}</span>
                </div>
              ))}
            </div>
            <GlowText color={`${COLORS.white}66`} size={10} style={{ marginTop: 10 }}>
              ↑↓←→ / WASD · SWIPE MOBILE · POWER PELLET = GHOSTS FLEE
            </GlowText>
            <NeonButton onClick={startGame} color={COLORS.acidGreen} testId="pac-start">INSERT COIN</NeonButton>
          </Overlay>
        )}

        {phase === 'gameover' && (
          <Overlay>
            <GlowText color={COLORS.magenta} size={28}>GAME OVER</GlowText>
            <GlowText color={`${COLORS.white}77`} size={11} style={{ marginTop: 4 }}>
              YOU WERE CONSUMED BY THE NETWORK
            </GlowText>
            <GlowText color={COLORS.acidGreen} size={22} style={{ marginTop: 8 }}>
              {String(uiScore).padStart(6,'0')} PTS
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
                      Cadastre-se grátis e tenha acesso livre a todos os jogos.
                    </div>
                  </div>
                  <form onSubmit={handleLeadSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', maxWidth: 260, marginTop: 8 }}>
                    <NeonInput placeholder="NICKNAME *" value={leadForm.nickname}
                      onChange={(v) => setLeadForm((f) => ({ ...f, nickname: v }))}
                      testId="pac-nickname" required />
                    <NeonInput placeholder="EMAIL *" type="email" value={leadForm.email}
                      onChange={(v) => setLeadForm((f) => ({ ...f, email: v }))}
                      testId="pac-email" required />
                    <NeonInput placeholder="WHATSAPP (+55...) *" value={leadForm.phone}
                      onChange={(v) => setLeadForm((f) => ({ ...f, phone: v }))}
                      testId="pac-phone" required />
                    {formError && <span style={{ color: COLORS.magenta, fontSize: 11, textAlign: 'center' }}>{formError}</span>}
                    <NeonButton type="submit" disabled={submitting} color={COLORS.acidGreen} testId="pac-submit">
                      {submitting ? 'ENVIANDO...' : 'CADASTRAR'}
                    </NeonButton>
                  </form>
                </>
              ) : (
                <>
                  <GlowText color={COLORS.acidGreen} size={12} style={{ marginTop: 10 }}>
                    Olá, {registration?.nickname?.toUpperCase()}
                  </GlowText>
                  <NeonButton onClick={logExistingScore} color={COLORS.cyan} disabled={submitting} testId="pac-log">
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
                <GlowText color={COLORS.acidGreen} size={13} style={{ marginTop: 10 }}>✓ Score salvo no ledger!</GlowText>
                <NeonButton onClick={startGame} color={COLORS.acidGreen}>PLAY AGAIN</NeonButton>
              </>
            )}
          </Overlay>
        )}
      </div>

      <div style={{
        borderTop: `1px solid rgba(34,224,245,0.2)`,
        padding: '10px 0 14px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4,
      }}>
        <DpadBtn label="▲" onClick={() => { const st = stateRef.current; if (st?.pac) st.pac.nextDir = 'UP'; }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <DpadBtn label="◀" onClick={() => { const st = stateRef.current; if (st?.pac) st.pac.nextDir = 'LEFT'; }} />
          <div style={{ width: 44, height: 44 }} />
          <DpadBtn label="▶" onClick={() => { const st = stateRef.current; if (st?.pac) st.pac.nextDir = 'RIGHT'; }} />
        </div>
        <DpadBtn label="▼" onClick={() => { const st = stateRef.current; if (st?.pac) st.pac.nextDir = 'DOWN'; }} />
      </div>
    </div>
  );
}

function DpadBtn({ label, onClick }) {
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
        borderRadius: 8, color: pressed ? COLORS.acidGreen : `${COLORS.white}88`,
        fontSize: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.08s',
        boxShadow: pressed ? '0 0 12px rgba(34,224,245,0.5)' : 'none',
        userSelect: 'none', WebkitTapHighlightColor: 'transparent',
      }}
    >{label}</button>
  );
}

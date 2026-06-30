// /components/games/Hub3tris.js
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
  grid:        'rgba(79,20,135,0.14)',
};

const COLS        = 10;
const ROWS        = 20;
const CELL        = 28;
const W           = COLS * CELL;   // 280
const H           = ROWS * CELL;   // 560
const PREVIEW_SZ  = 4;

const QUALIFY_SCORE = 500;

// Speed: ms per drop tick
const LEVEL_SPEED = (lvl) => Math.max(80, 600 - (lvl - 1) * 50);

// ─── Tetrominoes ──────────────────────────────────────────────────────────────
const PIECES = {
  I: {
    color: COLORS.cyan,
    shadow: 'rgba(0,240,255,0.7)',
    label: 'I',
    shapes: [
      [[1,1,1,1]],
      [[1],[1],[1],[1]],
    ],
  },
  O: {
    color: COLORS.acidGreen,
    shadow: 'rgba(204,255,0,0.7)',
    label: 'O',
    shapes: [
      [[1,1],[1,1]],
    ],
  },
  T: {
    color: '#9945FF',
    shadow: 'rgba(153,69,255,0.7)',
    label: 'T',
    shapes: [
      [[0,1,0],[1,1,1]],
      [[1,0],[1,1],[1,0]],
      [[1,1,1],[0,1,0]],
      [[0,1],[1,1],[0,1]],
    ],
  },
  S: {
    color: COLORS.magenta,
    shadow: 'rgba(255,0,122,0.7)',
    label: 'S',
    shapes: [
      [[0,1,1],[1,1,0]],
      [[1,0],[1,1],[0,1]],
    ],
  },
  Z: {
    color: '#F7931A',
    shadow: 'rgba(247,147,26,0.7)',
    label: 'Z',
    shapes: [
      [[1,1,0],[0,1,1]],
      [[0,1],[1,1],[1,0]],
    ],
  },
  J: {
    color: COLORS.ultraviolet,
    shadow: 'rgba(79,20,135,0.9)',
    label: 'J',
    shapes: [
      [[1,0,0],[1,1,1]],
      [[1,1],[1,0],[1,0]],
      [[1,1,1],[0,0,1]],
      [[0,1],[0,1],[1,1]],
    ],
  },
  L: {
    color: '#FF99CC',
    shadow: 'rgba(255,153,204,0.7)',
    label: 'L',
    shapes: [
      [[0,0,1],[1,1,1]],
      [[1,0],[1,0],[1,1]],
      [[1,1,1],[1,0,0]],
      [[1,1],[0,1],[0,1]],
    ],
  },
};

const PIECE_KEYS = Object.keys(PIECES);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  return { key, rot: 0, col: 3, row: 0 };
}

function getShape(piece) {
  const def = PIECES[piece.key];
  return def.shapes[piece.rot % def.shapes.length];
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function collides(board, piece, dc = 0, dr = 0, rot = null) {
  const shape = rot !== null
    ? PIECES[piece.key].shapes[rot % PIECES[piece.key].shapes.length]
    : getShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = piece.row + r + dr;
      const nc = piece.col + c + dc;
      if (nr >= ROWS || nc < 0 || nc >= COLS) return true;
      if (nr >= 0 && board[nr][nc]) return true;
    }
  }
  return false;
}

function lockPiece(board, piece) {
  const shape = getShape(piece);
  const color = PIECES[piece.key].color;
  const next  = board.map(r => [...r]);
  shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      const nr = piece.row + r;
      const nc = piece.col + c;
      if (nr >= 0 && nr < ROWS) next[nr][nc] = color;
    });
  });
  return next;
}

function clearLines(board) {
  const kept = board.filter(row => row.some(c => !c));
  const cleared = ROWS - kept.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...empty, ...kept], cleared };
}

function ghostRow(board, piece) {
  let dr = 0;
  while (!collides(board, piece, 0, dr + 1)) dr++;
  return dr;
}

function wallKick(board, piece, newRot) {
  const kicks = [0, 1, -1, 2, -2];
  for (const dc of kicks) {
    if (!collides(board, piece, dc, 0, newRot)) return dc;
  }
  return null;
}

function scoreForLines(lines, level) {
  const base = [0, 100, 300, 500, 800];
  return (base[lines] || 0) * level;
}

function makeParticles(x, y, color, count = 12) {
  return Array.from({ length: count }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6,
    r:  2 + Math.random() * 4,
    life: 30 + Math.random() * 20,
    maxLife: 50,
    color,
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

function drawCell(ctx, x, y, color, alpha = 1, ghost = false) {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (ghost) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 8;
    roundRect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, 4);
    ctx.stroke();
  } else {
    ctx.shadowColor = color;
    ctx.shadowBlur  = 12;
    // Fill
    ctx.fillStyle = color;
    roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 4);
    ctx.fill();
    // Inner shine
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(255,255,255,0.18)';
    roundRect(ctx, x + 3, y + 3, CELL - 6, (CELL - 6) * 0.42, 3);
    ctx.fill();
    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 0.5;
    roundRect(ctx, x + 1.5, y + 1.5, CELL - 3, CELL - 3, 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoard(ctx, board) {
  board.forEach((row, r) => {
    row.forEach((color, c) => {
      if (color) drawCell(ctx, c * CELL, r * CELL, color);
    });
  });
}

function drawPieceOnBoard(ctx, piece, ghost = false, ghostDr = 0) {
  const shape = getShape(piece);
  const color = PIECES[piece.key].color;
  const rowOffset = ghost ? ghostDr : 0;
  shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      const pr = piece.row + r + rowOffset;
      const pc = piece.col + c;
      if (pr < 0) return;
      drawCell(ctx, pc * CELL, pr * CELL, color, ghost ? 0.3 : 1, ghost);
    });
  });
}

function drawGrid(ctx) {
  ctx.save();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth   = 0.5;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, H);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(W, r * CELL);
    ctx.stroke();
  }
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

function drawLineClear(ctx, flashRows, tick) {
  flashRows.forEach(r => {
    const alpha = 0.5 + 0.5 * Math.sin(tick * 0.5);
    ctx.save();
    ctx.fillStyle   = COLORS.acidGreen;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = COLORS.acidGreen;
    ctx.shadowBlur  = 24;
    ctx.fillRect(0, r * CELL, W, CELL);
    ctx.restore();
  });
}

function drawPreview(ctx, piece, sz) {
  const shape = getShape(piece);
  const color = PIECES[piece.key].color;
  const csz   = sz;
  const offX  = Math.floor((PREVIEW_SZ - shape[0].length) / 2) * csz;
  const offY  = Math.floor((PREVIEW_SZ - shape.length) / 2) * csz;
  ctx.clearRect(0, 0, PREVIEW_SZ * csz, PREVIEW_SZ * csz);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, PREVIEW_SZ * csz, PREVIEW_SZ * csz);
  shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      drawCell(ctx, offX + c * csz, offY + r * csz, color);
    });
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function GlowText({ children, color, size = 16, style = {} }) {
  return (
    <p style={{
      margin: 0, color, fontSize: size,
      fontFamily: '"Orbitron", "JetBrains Mono", monospace',
      letterSpacing: 2,
      textShadow: `0 0 10px ${color}, 0 0 24px ${color}55`,
      textAlign: 'center', lineHeight: 1.4,
      ...style,
    }}>
      {children}
    </p>
  );
}

function Overlay({ children, blur = true }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(11,9,20,0.92)',
      backdropFilter: blur ? 'blur(4px)' : 'none',
      padding: 20, gap: 8,
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
        marginTop: 10, padding: '9px 28px',
        background: hover ? `${color}18` : 'transparent',
        border: `1.5px solid ${color}`, borderRadius: 6,
        color, fontSize: 12,
        fontFamily: '"Orbitron", monospace',
        letterSpacing: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: hover ? `0 0 18px ${color}55` : `0 0 8px ${color}33`,
        transition: 'all 0.18s',
        ...style,
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
        borderRadius: 5, padding: '8px 12px',
        color: COLORS.white, fontSize: 11,
        fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: 1, outline: 'none',
        width: '100%', boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = COLORS.acidGreen; }}
      onBlur={e  => { e.target.style.borderColor = COLORS.ultraviolet; }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Hub3tris({ onGameOver }) {
  const canvasRef  = useRef(null);
  const previewRef = useRef(null);
  const stateRef   = useRef(null);
  const rafRef     = useRef(null);
  const lastDrop   = useRef(0);
  const keysRef    = useRef({});
  const keyRepeat  = useRef({});

  const [phase, setPhase]       = useState('idle');
  const [uiScore, setUiScore]   = useState(0);
  const [uiLevel, setUiLevel]   = useState(1);
  const [uiLines, setUiLines]   = useState(0);
  const [uiHigh,  setUiHigh]    = useState(0);
  const highRef                 = useRef(0);
  const [paused, setPaused]     = useState(false);
  const pausedRef               = useRef(false);

  const [leadForm, setLeadForm]     = useState({ nickname: '', email: '', phone: '' });
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  // ── Init ───────────────────────────────────────────────────────────────────
  const initState = useCallback(() => ({
    board:        emptyBoard(),
    current:      randomPiece(),
    next:         randomPiece(),
    held:         null,
    holdUsed:     false,
    score:        0,
    lines:        0,
    level:        1,
    tick:         0,
    particles:    [],
    flashRows:    [],
    flashTimer:   0,
    phase:        'playing',
    lockDelay:    0,
    combo:        0,
  }), []);

  // ── Hold piece ─────────────────────────────────────────────────────────────
  const holdPiece = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.holdUsed) return;
    const cur = s.current;
    if (s.held) {
      s.current = { ...s.held, col: 3, row: 0, rot: 0 };
      s.held    = { key: cur.key, rot: 0, col: 3, row: 0 };
    } else {
      s.held    = { key: cur.key, rot: 0, col: 3, row: 0 };
      s.current = s.next;
      s.next    = randomPiece();
    }
    s.holdUsed = true;
  }, []);

  // ── Lock & spawn ──────────────────────────────────────────────────────────
  const lockAndSpawn = useCallback((s) => {
    // Lock
    s.board = lockPiece(s.board, s.current);

    // Flash filled rows
    const filledRows = [];
    s.board.forEach((row, r) => {
      if (row.every(c => c)) filledRows.push(r);
    });

    if (filledRows.length) {
      // Particles on each cleared row
      filledRows.forEach(r => {
        for (let c = 0; c < COLS; c++) {
          s.particles.push(...makeParticles(c * CELL + CELL/2, r * CELL + CELL/2, s.board[r][c], 4));
        }
      });
      s.flashRows  = filledRows;
      s.flashTimer = 18;

      setTimeout(() => {
        const st = stateRef.current;
        if (!st) return;
        const { board, cleared } = clearLines(st.board);
        st.board     = board;
        st.flashRows = [];

        const pts = scoreForLines(cleared, st.level);
        st.score += pts;
        st.combo  = cleared > 0 ? st.combo + 1 : 0;
        if (st.combo > 1) st.score += 50 * st.combo * st.level;
        st.lines += cleared;
        st.level  = Math.floor(st.lines / 10) + 1;

        if (st.score > highRef.current) {
          highRef.current = st.score;
          setUiHigh(st.score);
        }
        setUiScore(st.score);
        setUiLines(st.lines);
        setUiLevel(st.level);
      }, 180);
    }

    // Spawn next
    s.current  = s.next;
    s.next     = randomPiece();
    s.holdUsed = false;
    s.lockDelay = 0;

    // Draw preview
    const pCanvas = previewRef.current;
    if (pCanvas) {
      const pCtx = pCanvas.getContext('2d');
      drawPreview(pCtx, s.next, CELL);
    }

    // Game over check
    if (collides(s.board, s.current)) {
      s.phase = 'gameover';
      setUiScore(s.score);
      setPhase('gameover');
      onGameOver?.(s.score);
    }
  }, [onGameOver]);

  // ── Move helpers ──────────────────────────────────────────────────────────
  const tryMove = useCallback((dc, dr) => {
    const s = stateRef.current;
    if (!s || s.phase !== 'playing') return false;
    if (!collides(s.board, s.current, dc, dr)) {
      s.current.col += dc;
      s.current.row += dr;
      if (dr > 0) s.lockDelay = 0;
      return true;
    }
    return false;
  }, []);

  const tryRotate = useCallback((dir = 1) => {
    const s = stateRef.current;
    if (!s || s.phase !== 'playing') return;
    const def    = PIECES[s.current.key];
    const newRot = ((s.current.rot + dir) % def.shapes.length + def.shapes.length) % def.shapes.length;
    const kick   = wallKick(s.board, s.current, newRot);
    if (kick !== null) {
      s.current.rot  = newRot;
      s.current.col += kick;
    }
  }, []);

  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== 'playing') return;
    let dr = 0;
    while (!collides(s.board, s.current, 0, dr + 1)) dr++;
    s.current.row += dr;
    s.score += dr * 2;
    lockAndSpawn(s);
  }, [lockAndSpawn]);

  // ── Game loop ──────────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    lastDrop.current = performance.now();

    const frame = (now) => {
      const s = stateRef.current;
      if (!s) return;
      if (s.phase === 'gameover') return;

      rafRef.current = requestAnimationFrame(frame);

      if (pausedRef.current) {
        // Draw paused screen
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.fillStyle   = COLORS.acidGreen;
        ctx.shadowColor = COLORS.acidGreen;
        ctx.shadowBlur  = 20;
        ctx.font        = 'bold 20px "Orbitron", monospace';
        ctx.textAlign   = 'center';
        ctx.fillText('PAUSED', W / 2, H / 2);
        ctx.restore();
        return;
      }

      s.tick++;

      // ── Key repeat for held keys ───────────────────────────────────
      const now2 = performance.now();
      ['ArrowLeft','ArrowRight','ArrowDown','a','d','s'].forEach(k => {
        if (keysRef.current[k]) {
          const kr = keyRepeat.current[k];
          if (kr && now2 - kr.last > (kr.first ? 100 : 200)) {
            kr.last  = now2;
            kr.first = true;
            if (k === 'ArrowLeft'  || k === 'a') tryMove(-1, 0);
            if (k === 'ArrowRight' || k === 'd') tryMove(1, 0);
            if (k === 'ArrowDown'  || k === 's') {
              if (tryMove(0, 1)) s.score += 1;
            }
          }
        }
      });

      // ── Auto drop ────────────────────────────────────────────────
      const speed = LEVEL_SPEED(s.level);
      if (now - lastDrop.current >= speed) {
        lastDrop.current = now;
        if (!collides(s.board, s.current, 0, 1)) {
          s.current.row++;
          s.lockDelay = 0;
        } else {
          s.lockDelay++;
          if (s.lockDelay >= 30) lockAndSpawn(s);
        }
      }

      // ── Particles ─────────────────────────────────────────────────
      s.particles = s.particles
        .map(p => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, life: p.life-1, vx: p.vx*0.88, vy: p.vy*0.88 }))
        .filter(p => p.life > 0);
      if (s.flashTimer > 0) s.flashTimer--;

      // ── Draw ──────────────────────────────────────────────────────
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);

      // Scanlines
      for (let sy = 0; sy < H; sy += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.07)';
        ctx.fillRect(0, sy, W, 1);
      }

      // Radial glow
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
      grd.addColorStop(0, 'rgba(79,20,135,0.18)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      drawGrid(ctx);
      drawBoard(ctx, s.board);

      // Ghost
      const gdr = ghostRow(s.board, s.current);
      if (gdr > 0) drawPieceOnBoard(ctx, s.current, true, gdr);

      // Current piece
      drawPieceOnBoard(ctx, s.current);

      // Flash
      if (s.flashRows.length && s.flashTimer > 0) {
        drawLineClear(ctx, s.flashRows, s.tick);
      }

      drawParticles(ctx, s.particles);

      // Border
      ctx.save();
      ctx.strokeStyle = COLORS.ultraviolet;
      ctx.shadowColor = COLORS.ultraviolet;
      ctx.shadowBlur  = 14;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);
      ctx.restore();
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [tryMove, lockAndSpawn]);

  // ── Start ──────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const st = initState();
    stateRef.current = st;
    setUiScore(0); setUiLevel(1); setUiLines(0);
    setSubmitted(false); setFormError('');
    setPaused(false); pausedRef.current = false;

    // Draw initial preview
    setTimeout(() => {
      const pCanvas = previewRef.current;
      if (pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        drawPreview(pCtx, st.next, CELL);
      }
    }, 0);

    setPhase('playing');
    setTimeout(() => startLoop(), 0);
  }, [initState, startLoop]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      const k = e.key;
      if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(k)) e.preventDefault();

      if (k === 'p' || k === 'P' || k === 'Escape') {
        if (phase !== 'playing') return;
        pausedRef.current = !pausedRef.current;
        setPaused(p => !p);
        return;
      }

      if (pausedRef.current) return;
      keysRef.current[k] = true;

      if (!keyRepeat.current[k]) {
        keyRepeat.current[k] = { last: performance.now(), first: false };
      }

      if (k === 'ArrowLeft'  || k === 'a') tryMove(-1, 0);
      if (k === 'ArrowRight' || k === 'd') tryMove(1,  0);
      if (k === 'ArrowDown'  || k === 's') {
        const s = stateRef.current;
        if (tryMove(0, 1) && s) s.score += 1;
      }
      if (k === 'ArrowUp' || k === 'w')  tryRotate(1);
      if (k === 'z' || k === 'Z')        tryRotate(-1);
      if (k === ' ')                      hardDrop();
      if (k === 'c' || k === 'C')        holdPiece();
    };

    const onUp = (e) => {
      keysRef.current[e.key]  = false;
      keyRepeat.current[e.key] = null;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, [phase, tryMove, tryRotate, hardDrop, holdPiece]);

  // ── Touch swipe ────────────────────────────────────────────────────────────
  const touchRef = useRef(null);
  const handleTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  };
  const handleTouchEnd = (e) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.time;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);

    if (absDx < 10 && absDy < 10 && dt < 200) {
      tryRotate(1); // tap = rotate
    } else if (absDy > absDx && dy < -40) {
      hardDrop();   // swipe up = hard drop
    } else if (absDy > absDx && dy > 30) {
      const s = stateRef.current;
      if (tryMove(0, 1) && s) s.score += 1;
    } else if (absDx > absDy) {
      tryMove(dx > 0 ? 1 : -1, 0);
    }
    touchRef.current = null;
  };

  // ── Lead submit ────────────────────────────────────────────────────────────
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
        body: JSON.stringify({ ...leadForm, score: uiScore, game: 'hub3tris' }),
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

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      alignItems: 'flex-start',
      width: '100%',
      maxWidth: 520,
      margin: '0 auto',
      fontFamily: '"JetBrains Mono", monospace',
      userSelect: 'none',
    }}>

      {/* ── Side panel LEFT (hold) ─────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 10, minWidth: 80,
      }}>
        <SidePanel title="HOLD" color={COLORS.cyan}>
          <HoldCanvas held={stateRef.current?.held} phase={phase} />
        </SidePanel>
        <SidePanel title="LEVEL" color={COLORS.acidGreen}>
          <GlowText color={COLORS.acidGreen} size={20}>{uiLevel}</GlowText>
        </SidePanel>
        <SidePanel title="LINES" color={COLORS.magenta}>
          <GlowText color={COLORS.magenta} size={16}>{String(uiLines).padStart(4,'0')}</GlowText>
        </SidePanel>
      </div>

      {/* ── Main canvas ───────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
        border: `1.5px solid ${COLORS.ultraviolet}`,
        boxShadow: `0 0 40px rgba(79,20,135,0.5), 0 0 80px rgba(79,20,135,0.2)`,
        flexShrink: 0,
      }}>
        <canvas
          ref={canvasRef}
          width={W} height={H}
          style={{ display: 'block', touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* IDLE */}
        {phase === 'idle' && (
          <Overlay>
            <GlowText color={COLORS.acidGreen} size={24}>HUB3TRIS</GlowText>
            <GlowText color={COLORS.cyan} size={10} style={{ marginTop: 4 }}>
              WEB3 BLOCK BUILDER
            </GlowText>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
              {[
                ['← →  /  A D', 'Mover'],
                ['↑  /  W  /  TAP', 'Rotacionar'],
                ['↓  /  S', 'Descer'],
                ['SPACE  /  ↑ SWIPE', 'Hard Drop'],
                ['C', 'Hold'],
                ['P / ESC', 'Pausar'],
              ].map(([k, d]) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  padding: '4px 0', gap: 12,
                }}>
                  <span style={{ fontSize: 9, color: COLORS.acidGreen, fontFamily: '"Orbitron", monospace', letterSpacing: 1 }}>{k}</span>
                  <span style={{ fontSize: 10, color: `${COLORS.white}77` }}>{d}</span>
                </div>
              ))}
            </div>
            <NeonButton onClick={startGame}>INSERT COIN</NeonButton>
          </Overlay>
        )}

        {/* PAUSED */}
        {phase === 'playing' && paused && (
          <Overlay>
            <GlowText color={COLORS.acidGreen} size={22}>PAUSED</GlowText>
            <GlowText color={`${COLORS.white}55`} size={10} style={{ marginTop: 8 }}>
              P / ESC para continuar
            </GlowText>
            <NeonButton onClick={() => {
              pausedRef.current = false;
              setPaused(false);
            }}>
              RESUME
            </NeonButton>
          </Overlay>
        )}

        {/* GAME OVER */}
        {phase === 'gameover' && (
          <Overlay>
            <GlowText color={COLORS.magenta} size={22}>GAME OVER</GlowText>
            <GlowText color={`${COLORS.white}66`} size={10} style={{ marginTop: 2 }}>
              THE CHAIN HAS COLLAPSED
            </GlowText>
            <GlowText color={COLORS.acidGreen} size={20} style={{ marginTop: 8 }}>
              {String(uiScore).padStart(6,'0')}
            </GlowText>
            {uiHigh > 0 && (
              <GlowText color={COLORS.cyan} size={10} style={{ marginTop: 2 }}>
                BEST {String(uiHigh).padStart(6,'0')}
              </GlowText>
            )}

            {qualifies && !submitted && (
              <>
                <div style={{
                  margin: '10px 0 4px',
                  padding: '6px 12px',
                  background: 'rgba(204,255,0,0.06)',
                  border: `1px solid ${COLORS.acidGreen}44`,
                  borderRadius: 7,
                }}>
                  <GlowText color={COLORS.acidGreen} size={9}>
                    🏆 LEADERBOARD QUALIFICADO
                  </GlowText>
                </div>
                <form
                  onSubmit={handleLeadSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}
                >
                  <NeonInput placeholder="NICKNAME" value={leadForm.nickname}
                    onChange={v => setLeadForm(f => ({ ...f, nickname: v }))} />
                  <NeonInput placeholder="EMAIL" type="email" value={leadForm.email}
                    onChange={v => setLeadForm(f => ({ ...f, email: v }))} />
                  <NeonInput placeholder="PHONE (+55...)" value={leadForm.phone}
                    onChange={v => setLeadForm(f => ({ ...f, phone: v }))} />
                  {formError && (
                    <span style={{ color: COLORS.magenta, fontSize: 10, textAlign: 'center' }}>
                      {formError}
                    </span>
                  )}
                  <NeonButton type="submit" disabled={submitting} color={COLORS.acidGreen}>
                    {submitting ? 'SAVING...' : 'SUBMIT SCORE'}
                  </NeonButton>
                </form>
                <button onClick={startGame} style={{
                  marginTop: 4, background: 'none', border: 'none',
                  color: `${COLORS.white}44`, fontSize: 10, cursor: 'pointer',
                  letterSpacing: 1, fontFamily: '"JetBrains Mono", monospace',
                }}>
                  skip → play again
                </button>
              </>
            )}

            {qualifies && submitted && (
              <>
                <GlowText color={COLORS.acidGreen} size={11} style={{ marginTop: 8 }}>
                  ✓ Score gravado no ledger!
                </GlowText>
                <NeonButton onClick={startGame}>PLAY AGAIN</NeonButton>
              </>
            )}

            {!qualifies && (
              <>
                <GlowText color={`${COLORS.white}44`} size={9} style={{ marginTop: 6 }}>
                  {QUALIFY_SCORE}+ pts para o leaderboard
                </GlowText>
                <NeonButton onClick={startGame}>TRY AGAIN</NeonButton>
              </>
            )}
          </Overlay>
        )}
      </div>

      {/* ── Side panel RIGHT (next + score) ───────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 10, minWidth: 80,
      }}>
        <SidePanel title="NEXT" color={COLORS.acidGreen}>
          <canvas
            ref={previewRef}
            width={PREVIEW_SZ * CELL}
            height={PREVIEW_SZ * CELL}
            style={{ display: 'block', width: PREVIEW_SZ * CELL, height: PREVIEW_SZ * CELL }}
          />
        </SidePanel>
        <SidePanel title="SCORE" color={COLORS.acidGreen}>
          <GlowText color={COLORS.acidGreen} size={13}>
            {String(uiScore).padStart(6,'0')}
          </GlowText>
        </SidePanel>
        <SidePanel title="BEST" color={COLORS.cyan}>
          <GlowText color={COLORS.cyan} size={13}>
            {String(uiHigh).padStart(6,'0')}
          </GlowText>
        </SidePanel>

        {/* Piece legend */}
        <SidePanel title="BLOCKS" color={COLORS.ultraviolet} padding={6}>
          {PIECE_KEYS.map(k => (
            <div key={k} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '2px 0',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: 2,
                background: PIECES[k].color,
                boxShadow: `0 0 6px ${PIECES[k].color}`,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 9, color: PIECES[k].color,
                fontFamily: '"Orbitron", monospace', letterSpacing: 1,
              }}>{k}</span>
            </div>
          ))}
        </SidePanel>
      </div>
    </div>
  );
}

// ─── SidePanel ────────────────────────────────────────────────────────────────
function SidePanel({ title, color, children, padding = 10 }) {
  return (
    <div style={{
      background: 'rgba(11,9,20,0.85)',
      border: `1px solid ${color}44`,
      borderRadius: 8,
      padding,
      boxShadow: `0 0 10px ${color}22`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 6,
    }}>
      <p style={{
        margin: 0, fontSize: 8,
        color: `${color}cc`,
        fontFamily: '"Orbitron", monospace',
        letterSpacing: 2, textAlign: 'center',
        textShadow: `0 0 6px ${color}`,
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── HoldCanvas ───────────────────────────────────────────────────────────────
function HoldCanvas({ held, phase }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, PREVIEW_SZ * CELL, PREVIEW_SZ * CELL);
    if (held) drawPreview(ctx, held, CELL);
  }, [held, phase]);

  return (
    <canvas
      ref={ref}
      width={PREVIEW_SZ * CELL}
      height={PREVIEW_SZ * CELL}
      style={{ display: 'block', width: PREVIEW_SZ * CELL, height: PREVIEW_SZ * CELL }}
    />
  );
}

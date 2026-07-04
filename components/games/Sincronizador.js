// /components/games/Sincronizador.js
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  bg:          '#0b0914',
  ultraviolet: '#4F1487',
  primary:     '#667eea',
  secondary:   '#764ba2',
  acidGreen:   '#CCFF00',
  cyan:        '#00F0FF',
  magenta:     '#FF007A',
  white:       '#f5f5ff',
};

const GRID_SIZE = 6;
const CELL = 60;         // px per cell
const W = GRID_SIZE * CELL;
const H = GRID_SIZE * CELL;
const MOVES_PER_GAME = 25;
const QUALIFY_SCORE = 300;
const MATCH_MIN = 3;

// 6 node types (network infrastructure metaphor)
const NODES = [
  { id: 0, symbol: '\u{1F50C}', name: 'ROUTER',   color: '#00F0FF' }, // 🔌
  { id: 1, symbol: '\u{1F310}', name: 'GATEWAY',  color: '#667eea' }, // 🌐
  { id: 2, symbol: '\u26A1',    name: 'POWER',    color: '#CCFF00' }, // ⚡
  { id: 3, symbol: '\u{1F50B}', name: 'BATTERY',  color: '#44FFAA' }, // 🔋
  { id: 4, symbol: '\u{1F4BE}', name: 'STORAGE',  color: '#FF99CC' }, // 💾
  { id: 5, symbol: '\u{1F4E1}', name: 'ANTENNA',  color: '#FF6B35' }, // 📡
];

const BASE_POINTS = { 3: 30, 4: 60, 5: 120, 6: 250 };

// ─── Utils ────────────────────────────────────────────────────────────────────
function rndNode() {
  return { type: NODES[Math.floor(Math.random() * NODES.length)].id, key: Math.random() };
}

function makeBoard() {
  // Generate a board that has no initial matches
  let board;
  do {
    board = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => rndNode())
    );
  } while (findMatches(board).length > 0);
  return board;
}

function findMatches(board) {
  const matched = new Set();
  // Rows
  for (let r = 0; r < GRID_SIZE; r++) {
    let run = 1;
    for (let c = 1; c < GRID_SIZE; c++) {
      if (board[r][c].type === board[r][c-1].type) run++;
      else {
        if (run >= MATCH_MIN) for (let k = 0; k < run; k++) matched.add(`${r},${c-1-k}`);
        run = 1;
      }
    }
    if (run >= MATCH_MIN) for (let k = 0; k < run; k++) matched.add(`${r},${GRID_SIZE-1-k}`);
  }
  // Cols
  for (let c = 0; c < GRID_SIZE; c++) {
    let run = 1;
    for (let r = 1; r < GRID_SIZE; r++) {
      if (board[r][c].type === board[r-1][c].type) run++;
      else {
        if (run >= MATCH_MIN) for (let k = 0; k < run; k++) matched.add(`${r-1-k},${c}`);
        run = 1;
      }
    }
    if (run >= MATCH_MIN) for (let k = 0; k < run; k++) matched.add(`${GRID_SIZE-1-k},${c}`);
  }
  return Array.from(matched).map(s => s.split(',').map(Number));
}

function areAdjacent(a, b) {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return (dr + dc) === 1;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function GlowText({ children, color, size = 16, style = {} }) {
  return (
    <p style={{
      margin:0, color, fontSize:size,
      fontFamily:'"Orbitron","JetBrains Mono",monospace',
      letterSpacing:2, textShadow:`0 0 10px ${color},0 0 24px ${color}55`,
      textAlign:'center', lineHeight:1.4, ...style,
    }}>{children}</p>
  );
}
function Overlay({ children }) {
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'rgba(11,9,20,0.92)', backdropFilter:'blur(4px)',
      padding:20, gap:8,
    }}>{children}</div>
  );
}
function NeonBtn({ children, onClick, color = COLORS.primary, disabled, type = 'button', style = {}, ...rest }) {
  const [h, setH] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled} {...rest}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        marginTop:12, padding:'10px 32px',
        background: h ? `${color}22` : 'transparent',
        border:`1.5px solid ${color}`, borderRadius:6, color, fontSize:13,
        fontFamily:'"Orbitron",monospace', letterSpacing:3,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        boxShadow: h ? `0 0 20px ${color}66` : `0 0 8px ${color}33`,
        transition:'all 0.18s', ...style,
      }}>{children}</button>
  );
}
function NeonInput({ placeholder, value, onChange, type = 'text' }) {
  return (
    <input type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background:'rgba(255,255,255,0.04)', border:`1px solid ${COLORS.secondary}`,
        borderRadius:5, padding:'8px 14px', color:COLORS.white, fontSize:12,
        fontFamily:'"JetBrains Mono",monospace', letterSpacing:1, outline:'none',
        width:'100%', boxSizing:'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = COLORS.primary; }}
      onBlur={e => { e.target.style.borderColor = COLORS.secondary; }}
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Sincronizador({ onGameOver }) {
  const [phase, setPhase] = useState('idle');       // idle | playing | animating | gameover
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(null);   // [r, c]
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(MOVES_PER_GAME);
  const [level, setLevel] = useState(1);
  const [bandwidth, setBandwidth] = useState(50);
  const [combo, setCombo] = useState(0);
  const [matched, setMatched] = useState([]);       // cells currently being cleared (for animation)
  const [floats, setFloats] = useState([]);         // { x, y, pts, color, id, born }
  const [highScore, setHighScore] = useState(0);
  const [unlockedNow, setUnlockedNow] = useState(false);

  // Lead form
  const [lead, setLead] = useState({ nickname:'', email:'', phone:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErr, setFormErr] = useState('');

  // Load high score from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = parseInt(localStorage.getItem('hub3.sincronizador.high') || '0', 10);
    if (!isNaN(h)) setHighScore(h);
  }, []);

  const start = useCallback(() => {
    setBoard(makeBoard());
    setSelected(null);
    setScore(0);
    setMovesLeft(MOVES_PER_GAME);
    setLevel(1);
    setBandwidth(50);
    setCombo(0);
    setMatched([]);
    setFloats([]);
    setSubmitted(false);
    setFormErr('');
    setUnlockedNow(false);
    setPhase('playing');
  }, []);

  // Cascade matches — recursive
  const resolveMatches = useCallback((brd, comboMult = 1) => {
    setPhase('animating');
    setBoard(brd);

    setTimeout(() => {
      const matches = findMatches(brd);
      if (matches.length === 0) {
        setCombo(0);
        setPhase(prev => (movesLeft <= 0 ? 'gameover' : 'playing'));
        return;
      }

      // Group matches by contiguous runs to score group sizes properly
      const matchedSet = new Set(matches.map(([r, c]) => `${r},${c}`));

      // Compute score: assume each 3-match is worth base points; extra tiles bonus
      // We'll approximate by grouping row/col runs
      let gained = 0;
      const groups = [];

      // horizontal groups
      for (let r = 0; r < GRID_SIZE; r++) {
        let run = 1;
        for (let c = 1; c < GRID_SIZE; c++) {
          if (brd[r][c].type === brd[r][c-1].type && matchedSet.has(`${r},${c}`) && matchedSet.has(`${r},${c-1}`)) run++;
          else {
            if (run >= MATCH_MIN) groups.push({ len: run, r, c: c-1, dir: 'h' });
            run = 1;
          }
        }
        if (run >= MATCH_MIN) groups.push({ len: run, r, c: GRID_SIZE - 1, dir: 'h' });
      }
      // vertical groups
      for (let c = 0; c < GRID_SIZE; c++) {
        let run = 1;
        for (let r = 1; r < GRID_SIZE; r++) {
          if (brd[r][c].type === brd[r-1][c].type && matchedSet.has(`${r},${c}`) && matchedSet.has(`${r-1},${c}`)) run++;
          else {
            if (run >= MATCH_MIN) groups.push({ len: run, r: r-1, c, dir: 'v' });
            run = 1;
          }
        }
        if (run >= MATCH_MIN) groups.push({ len: run, r: GRID_SIZE - 1, c, dir: 'v' });
      }

      const newFloats = [];
      groups.forEach(g => {
        const pts = (BASE_POINTS[g.len] || BASE_POINTS[6]) * comboMult * level;
        gained += pts;
        // Float appears roughly in the center of the group
        let fx, fy;
        if (g.dir === 'h') {
          fx = (g.c - g.len / 2 + 0.5) * CELL + CELL/2;
          fy = g.r * CELL + CELL/2;
        } else {
          fx = g.c * CELL + CELL/2;
          fy = (g.r - g.len / 2 + 0.5) * CELL + CELL/2;
        }
        const nodeColor = NODES[brd[g.dir === 'h' ? g.r : g.r][g.dir === 'h' ? g.c : g.c].type].color;
        newFloats.push({ id: Math.random(), x: fx, y: fy, pts, color: nodeColor, born: Date.now() });
      });

      // Bandwidth boost per group
      const bwGain = Math.min(30, groups.length * 4);

      setScore(s => s + gained);
      setBandwidth(bw => Math.min(100, bw + bwGain));
      setCombo(c => c + 1);
      setFloats(f => [...f, ...newFloats]);
      setMatched(matches);

      // Clear matches after animation
      setTimeout(() => {
        // Remove matched cells, drop, and refill
        const newBoard = brd.map(row => row.slice());
        matches.forEach(([r, c]) => { newBoard[r][c] = null; });

        // Drop
        for (let c = 0; c < GRID_SIZE; c++) {
          const col = [];
          for (let r = 0; r < GRID_SIZE; r++) {
            if (newBoard[r][c]) col.push(newBoard[r][c]);
          }
          while (col.length < GRID_SIZE) col.unshift(rndNode());
          for (let r = 0; r < GRID_SIZE; r++) newBoard[r][c] = col[r];
        }

        setMatched([]);
        // Continue cascading
        resolveMatches(newBoard, comboMult + 1);
      }, 320);
    }, 100);
  }, [level, movesLeft]);

  // Handle cell click
  const onCell = useCallback((r, c) => {
    if (phase !== 'playing') return;
    if (!selected) { setSelected([r, c]); return; }
    if (selected[0] === r && selected[1] === c) { setSelected(null); return; }
    if (!areAdjacent(selected, [r, c])) { setSelected([r, c]); return; }

    // Swap
    const b2 = board.map(row => row.slice());
    [b2[selected[0]][selected[1]], b2[r][c]] = [b2[r][c], b2[selected[0]][selected[1]]];

    // Test if swap creates a match
    const matches = findMatches(b2);
    if (matches.length === 0) {
      // Invalid — revert visually with a small shake, keep selection reset
      setSelected(null);
      setBandwidth(bw => Math.max(0, bw - 6));
      return;
    }

    // Valid move
    setSelected(null);
    setMovesLeft(m => m - 1);
    resolveMatches(b2, 1);
  }, [board, phase, selected, resolveMatches]);

  // Level up based on bandwidth
  useEffect(() => {
    if (bandwidth >= 100 && phase === 'playing') {
      setLevel(l => l + 1);
      setBandwidth(20);
    }
  }, [bandwidth, phase]);

  // Game over when moves run out (after animations settle)
  useEffect(() => {
    if (movesLeft <= 0 && phase === 'playing') {
      setPhase('gameover');
      // Persist high score & unlock whitepaper
      if (typeof window !== 'undefined') {
        const prev = parseInt(localStorage.getItem('hub3.sincronizador.high') || '0', 10);
        if (score > prev) {
          localStorage.setItem('hub3.sincronizador.high', String(score));
          setHighScore(score);
        }
        const wasUnlocked = localStorage.getItem('hub3.whitepaper.unlocked') === '1';
        localStorage.setItem('hub3.whitepaper.unlocked', '1');
        setUnlockedNow(!wasUnlocked);
        // Dispatch custom event so other components can react (e.g. Nav badge)
        window.dispatchEvent(new CustomEvent('hub3:whitepaper-unlocked'));
      }
      onGameOver?.(score);
    }
  }, [movesLeft, phase, score, onGameOver]);

  // Remove old floats
  useEffect(() => {
    if (floats.length === 0) return;
    const t = setTimeout(() => {
      const now = Date.now();
      setFloats(f => f.filter(x => now - x.born < 900));
    }, 400);
    return () => clearTimeout(t);
  }, [floats]);

  const submitLead = async e => {
    e.preventDefault(); setFormErr('');
    if (!lead.nickname.trim()) return setFormErr('Nickname required.');
    if (!lead.email.trim()) return setFormErr('Email required.');
    if (!lead.phone.trim()) return setFormErr('Phone required.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/arcade/lead', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ...lead, score, game: 'sincronizador' }),
      });
      if (!res.ok) { const d = await res.json(); setFormErr(d.error || 'Failed.'); }
      else setSubmitted(true);
    } catch { setFormErr('Network error.'); }
    finally { setSubmitting(false); }
  };

  const qualified = score >= QUALIFY_SCORE;

  return (
    <div style={{
      position:'relative', width:'100%', maxWidth: W + 40, margin:'0 auto',
      borderRadius:12, overflow:'hidden',
      border:`1.5px solid ${COLORS.secondary}`,
      boxShadow:`0 0 40px rgba(118,75,162,0.5),0 0 80px rgba(102,126,234,0.2)`,
      background: COLORS.bg, fontFamily:'"JetBrains Mono",monospace', userSelect:'none',
    }} data-testid="sincronizador-container">

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px', borderBottom:`1px solid rgba(118,75,162,0.35)`,
        background:'rgba(11,9,20,0.7)',
      }}>
        <div>
          <GlowText color={COLORS.primary} size={14} style={{letterSpacing:4, textAlign:'left'}}>
            SINCRONIZADOR
          </GlowText>
          <p style={{margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44`, fontFamily:'"Orbitron",monospace'}}>
            NETWORK MATCH-3 · LV {level}
          </p>
        </div>
        <div style={{display:'flex', gap:14}}>
          <div style={{textAlign:'center'}}>
            <p style={{margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44`}}>SCORE</p>
            <GlowText color={COLORS.primary} size={16}>{String(score).padStart(5,'0')}</GlowText>
          </div>
          <div style={{textAlign:'center'}}>
            <p style={{margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44`}}>MOVES</p>
            <GlowText color={COLORS.cyan} size={16}>{movesLeft}</GlowText>
          </div>
          <div style={{textAlign:'center'}}>
            <p style={{margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44`}}>BEST</p>
            <GlowText color={COLORS.acidGreen} size={16}>{String(highScore).padStart(5,'0')}</GlowText>
          </div>
        </div>
      </div>

      {/* Bandwidth bar */}
      <div style={{
        padding:'8px 16px', borderBottom:`1px solid rgba(118,75,162,0.25)`,
        background:'rgba(11,9,20,0.5)',
      }}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
          <span style={{fontSize:9, color:`${COLORS.white}77`, letterSpacing:2, fontFamily:'"Orbitron",monospace'}}>BANDWIDTH</span>
          <span style={{fontSize:9, color:COLORS.cyan, letterSpacing:2, fontFamily:'"Orbitron",monospace'}}>
            {Math.floor(bandwidth)}% · COMBO {combo > 0 ? `\u00D7${combo}` : '\u2014'}
          </span>
        </div>
        <div style={{
          height:6, background:'rgba(79,20,135,0.4)', borderRadius:3, overflow:'hidden', position:'relative',
        }}>
          <div style={{
            width: `${bandwidth}%`, height:'100%',
            background:`linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.cyan})`,
            boxShadow:`0 0 12px ${COLORS.primary}88`,
            transition:'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Board */}
      <div style={{
        position:'relative', width:'100%',
        aspectRatio: `${W} / ${H}`,
        background:`linear-gradient(135deg, ${COLORS.bg} 0%, #100a20 100%)`,
        overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', inset:0,
          display:'grid', gridTemplateColumns:`repeat(${GRID_SIZE}, 1fr)`,
          padding:6, gap:2,
        }}>
          {board.flatMap((row, r) =>
            row.map((cell, c) => {
              const isSel = selected && selected[0] === r && selected[1] === c;
              const isMatched = matched.some(([mr, mc]) => mr === r && mc === c);
              const node = NODES[cell.type];
              return (
                <button
                  key={`${r}-${c}-${cell.key}`}
                  onClick={() => onCell(r, c)}
                  disabled={phase !== 'playing'}
                  data-testid={`sinc-cell-${r}-${c}`}
                  style={{
                    aspectRatio:'1',
                    background: isMatched
                      ? `${node.color}66`
                      : isSel
                        ? `${node.color}30`
                        : `rgba(79,20,135,0.14)`,
                    border: isSel
                      ? `2px solid ${node.color}`
                      : `1px solid ${node.color}22`,
                    borderRadius:8,
                    fontSize: 'clamp(18px, 5.5vw, 30px)',
                    cursor: phase === 'playing' ? 'pointer' : 'default',
                    transition:'all 0.18s',
                    boxShadow: isSel ? `0 0 14px ${node.color}88` : (isMatched ? `0 0 20px ${node.color}99` : 'none'),
                    padding:0,
                    transform: isMatched ? 'scale(1.14)' : 'scale(1)',
                    color: node.color,
                    textShadow: `0 0 8px ${node.color}`,
                    fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                  }}
                >
                  {node.symbol}
                </button>
              );
            })
          )}
        </div>

        {/* Floating scores */}
        {floats.map(f => {
          const age = (Date.now() - f.born) / 900;
          return (
            <div key={f.id} style={{
              position:'absolute',
              left: `${(f.x / W) * 100}%`,
              top: `${(f.y / H) * 100}%`,
              transform:`translate(-50%, ${-age * 60}px)`,
              color: f.color,
              textShadow:`0 0 8px ${f.color}`,
              fontFamily:'"Orbitron",monospace',
              fontSize:14, fontWeight:'bold',
              opacity: 1 - age, pointerEvents:'none',
              transition:'transform 0.9s linear, opacity 0.9s linear',
            }}>+{f.pts}</div>
          );
        })}

        {/* IDLE overlay */}
        {phase === 'idle' && (
          <Overlay>
            <GlowText color={COLORS.primary} size={26}>SINCRONIZADOR</GlowText>
            <GlowText color={COLORS.cyan} size={11} style={{marginTop:4}}>NETWORK MATCH-3 · 25 MOVES</GlowText>
            <div style={{marginTop:10, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6, maxWidth:340}}>
              {NODES.map(n => (
                <div key={n.id} style={{
                  background:'rgba(79,20,135,0.12)', border:'1px solid rgba(118,75,162,0.3)',
                  borderRadius:6, padding:'6px 8px', display:'flex', alignItems:'center', gap:6,
                }}>
                  <span style={{fontSize:16, color:n.color, textShadow:`0 0 6px ${n.color}`}}>{n.symbol}</span>
                  <span style={{fontSize:9, color:`${COLORS.white}88`, letterSpacing:1, fontFamily:'"Orbitron",monospace'}}>{n.name}</span>
                </div>
              ))}
            </div>
            <p style={{fontSize:10, color:`${COLORS.white}66`, textAlign:'center', maxWidth:340, margin:'8px 4px 0', lineHeight:1.5}}>
              Clique em 2 nós adjacentes para sincronizar. Combine 3+ do mesmo tipo pra pontuar. Cascatas multiplicam o combo.
            </p>
            <div style={{marginTop:6, padding:'6px 14px', border:`1px solid ${COLORS.acidGreen}55`, borderRadius:6, background:'rgba(204,255,0,0.06)'}}>
              <GlowText color={COLORS.acidGreen} size={10}>
                RECOMPENSA: {QUALIFY_SCORE}+ PTS DESBLOQUEIA O WHITEPAPER
              </GlowText>
            </div>
            <NeonBtn onClick={start} data-testid="sinc-start" color={COLORS.primary}>SINCRONIZAR</NeonBtn>
          </Overlay>
        )}

        {/* GAME OVER overlay */}
        {phase === 'gameover' && (
          <Overlay>
            <GlowText color={COLORS.magenta} size={26}>NETWORK DOWN</GlowText>
            <GlowText color={`${COLORS.white}55`} size={11} style={{marginTop:4}}>
              LV {level} · {MOVES_PER_GAME} moves executados
            </GlowText>
            <GlowText color={COLORS.primary} size={22} style={{marginTop:6}}>
              {String(score).padStart(5,'0')} PTS
            </GlowText>

            {unlockedNow && qualified && (
              <div style={{margin:'8px 0', padding:'8px 16px', background:`${COLORS.acidGreen}12`, border:`1px solid ${COLORS.acidGreen}66`, borderRadius:8}}>
                <GlowText color={COLORS.acidGreen} size={11}>
                  {'\u{1F513} WHITEPAPER DESBLOQUEADO'}
                </GlowText>
                <p style={{margin:'4px 0 0', fontSize:10, color:`${COLORS.white}88`, textAlign:'center'}}>
                  Acesse a página de whitepaper para ler / baixar.
                </p>
              </div>
            )}

            {qualified && !submitted && (
              <>
                <div style={{padding:'6px 14px', background:'rgba(102,126,234,0.08)', border:`1px solid ${COLORS.primary}55`, borderRadius:8}}>
                  <GlowText color={COLORS.primary} size={10}>LEADERBOARD QUALIFICADO</GlowText>
                </div>
                <form onSubmit={submitLead} style={{display:'flex', flexDirection:'column', gap:7, width:'100%', maxWidth:280, marginTop:6}}>
                  <NeonInput placeholder="NICKNAME / SYNC OP" value={lead.nickname} onChange={v => setLead(f => ({...f, nickname: v}))}/>
                  <NeonInput placeholder="EMAIL" type="email" value={lead.email} onChange={v => setLead(f => ({...f, email: v}))}/>
                  <NeonInput placeholder="PHONE (+55...)" value={lead.phone} onChange={v => setLead(f => ({...f, phone: v}))}/>
                  {formErr && <span style={{color:COLORS.magenta, fontSize:11, textAlign:'center'}}>{formErr}</span>}
                  <NeonBtn type="submit" disabled={submitting} color={COLORS.primary} data-testid="sinc-submit">
                    {submitting ? 'TRANSMITINDO...' : 'SUBMIT SCORE'}
                  </NeonBtn>
                </form>
                <button onClick={start} style={{marginTop:4, background:'none', border:'none', color:`${COLORS.white}44`, fontSize:11, cursor:'pointer', letterSpacing:1, fontFamily:'"JetBrains Mono",monospace'}}>
                  skip → play again
                </button>
              </>
            )}
            {qualified && submitted && (
              <>
                <GlowText color={COLORS.acidGreen} size={13} style={{marginTop:8}}>Score registrado!</GlowText>
                <NeonBtn onClick={start} color={COLORS.primary}>SYNC AGAIN</NeonBtn>
              </>
            )}
            {!qualified && (
              <>
                <GlowText color={`${COLORS.white}44`} size={10} style={{marginTop:6}}>
                  {QUALIFY_SCORE}+ pts para o leaderboard
                </GlowText>
                <NeonBtn onClick={start} color={COLORS.primary} data-testid="sinc-retry">TRY AGAIN</NeonBtn>
              </>
            )}
          </Overlay>
        )}
      </div>

      {/* Footer info */}
      <div style={{
        borderTop:`1px solid rgba(118,75,162,0.25)`,
        padding:'8px 16px', display:'flex', justifyContent:'space-between',
        alignItems:'center', background:'rgba(11,9,20,0.5)',
      }}>
        <p style={{margin:0, fontSize:9, color:`${COLORS.white}44`, fontFamily:'"Orbitron",monospace', letterSpacing:1}}>
          TAP · SWAP · SYNC
        </p>
        <p style={{margin:0, fontSize:9, color:`${COLORS.primary}88`, fontFamily:'"Orbitron",monospace', letterSpacing:1}}>
          HUB3 NETWORK
        </p>
      </div>
    </div>
  );
}

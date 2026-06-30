'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Zap, Plug, HardDrive, Cpu, Wifi, RotateCcw, Trophy, ChevronRight, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useArcadeData } from '@/hooks/useArcadeData';

/**
 * PixelMatch — match-3 estilo Candy Crush com 25 níveis progressivos.
 * - Level 1: 240 pts em 18 movimentos → libera os menus do site
 * - Level 25: máximo (alvo cresce ~80/nível, moves crescem ~1.5/nível)
 * - Logo HUB3 é uma das 7 peças
 * - Captação de leads + leaderboard top 10 ao final de cada nível
 */

const SIZE = 6;
const COLORS = 7; // 6 ícones tech + 1 logo HUB3
const UNLOCK_LEVEL = 1;
const TOTAL_LEVELS = 25;

// progressão suave: alvo base 240, +80 por nível; movimentos base 18, +1.5/nível
function levelConfig(level) {
  const target = 240 + (level - 1) * 80;          // 240, 320, 400, ... 2160
  const moves  = Math.round(18 + (level - 1) * 1.5); // 18, 20, 21, ... 54
  return { level, target, moves };
}

const TYPES = [
  { id: 0, name: 'Energia',     Icon: Zap,         color: '#FF9416', bg: 'rgba(255,148,22,0.18)' },
  { id: 1, name: 'Plugue',      Icon: Plug,        color: '#22E0F5', bg: 'rgba(34,224,245,0.18)' },
  { id: 2, name: 'Memória',     Icon: HardDrive,   color: '#FFB347', bg: 'rgba(255,179,71,0.18)' },
  { id: 3, name: 'Processador', Icon: Cpu,         color: '#7AEEFF', bg: 'rgba(122,238,255,0.18)' },
  { id: 4, name: 'Sinal',       Icon: Wifi,        color: '#FF007A', bg: 'rgba(255,0,122,0.18)' },
  { id: 5, name: 'Bateria',     Icon: null,        color: '#CCFF00', bg: 'rgba(204,255,0,0.18)', battery: true },
  { id: 6, name: 'HUB3',        Icon: null,        color: '#22E0F5', bg: 'rgba(34,224,245,0.22)', logo: true },
];

function rand() { return Math.floor(Math.random() * COLORS); }

function freshBoard() {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let v;
      do { v = rand(); } while (
        (c >= 2 && b[r][c - 1] === v && b[r][c - 2] === v) ||
        (r >= 2 && b[r - 1][c] === v && b[r - 2][c] === v)
      );
      b[r][c] = v;
    }
  }
  return b;
}

function findMatches(b) {
  const m = new Set();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 2; c++) {
      const v = b[r][c]; if (v === -1) continue;
      if (b[r][c + 1] === v && b[r][c + 2] === v) {
        m.add(`${r},${c}`); m.add(`${r},${c + 1}`); m.add(`${r},${c + 2}`);
        let k = c + 3; while (k < SIZE && b[r][k] === v) { m.add(`${r},${k}`); k++; }
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 2; r++) {
      const v = b[r][c]; if (v === -1) continue;
      if (b[r + 1][c] === v && b[r + 2][c] === v) {
        m.add(`${r},${c}`); m.add(`${r + 1},${c}`); m.add(`${r + 2},${c}`);
        let k = r + 3; while (k < SIZE && b[k][c] === v) { m.add(`${k},${c}`); k++; }
      }
    }
  }
  return m;
}

function applyGravity(b) {
  const next = b.map((row) => row.slice());
  for (let c = 0; c < SIZE; c++) {
    let writeRow = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== -1) {
        const v = next[r][c]; next[r][c] = -1; next[writeRow][c] = v; writeRow--;
      }
    }
    for (let r = writeRow; r >= 0; r--) next[r][c] = rand();
  }
  return next;
}

export default function PixelMatch({ onUnlock }) {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState(() => freshBoard());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(levelConfig(1).moves);
  const [selected, setSelected] = useState(null);
  const [removing, setRemoving] = useState(new Set());
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);
  const [phase, setPhase] = useState('playing'); // playing | won | lost
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const unlockFiredRef = useRef(false);
  const busyRef = useRef(false);

  const cfg = levelConfig(level);

  const { submitLead, loading: submitting, leaderboard, leaderboardLoading } = useArcadeData();
  const [leadForm, setLeadForm] = useState({ nickname: '', email: '', phone: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState('');

  // libera menus ao fim do nível 1
  useEffect(() => {
    if (level >= UNLOCK_LEVEL && score >= levelConfig(UNLOCK_LEVEL).target && !unlockFiredRef.current) {
      unlockFiredRef.current = true;
      onUnlock && onUnlock();
    }
  }, [level, score, onUnlock]);

  // detecta win/lost por nível
  useEffect(() => {
    if (phase !== 'playing') return;
    if (score >= cfg.target) {
      setPhase('won');
    } else if (moves <= 0) {
      setPhase('lost');
    }
  }, [score, moves, cfg.target, phase]);

  const resolveCascades = useCallback(async (initialBoard) => {
    let current = initialBoard;
    let chain = 0;
    while (true) {
      const matches = findMatches(current);
      if (matches.size === 0) break;
      chain++;
      setCombo(chain);
      setRemoving(matches);
      setBoard(current);
      await new Promise((res) => setTimeout(res, 300));
      const cleared = current.map((row) => row.slice());
      matches.forEach((pos) => {
        const [r, c] = pos.split(',').map(Number);
        cleared[r][c] = -1;
      });
      setScore((s) => s + matches.size * 15 * chain);
      setRemoving(new Set());
      current = applyGravity(cleared);
      setBoard(current);
      await new Promise((res) => setTimeout(res, 240));
    }
    setCombo(0);
  }, []);

  const trySwap = useCallback(async (r1, c1, r2, c2) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const next = board.map((row) => row.slice());
    [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
    const matches = findMatches(next);
    if (matches.size === 0) {
      setBoard(next);
      await new Promise((res) => setTimeout(res, 140));
      setBoard(board);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      busyRef.current = false;
      return;
    }
    setBoard(next);
    setMoves((m) => m - 1);
    await resolveCascades(next);
    busyRef.current = false;
  }, [board, resolveCascades]);

  const onCellClick = (r, c) => {
    if (busyRef.current || phase !== 'playing') return;
    if (!selected) { setSelected({ r, c }); return; }
    if (selected.r === r && selected.c === c) { setSelected(null); return; }
    const adj = Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1;
    if (!adj) { setSelected({ r, c }); return; }
    trySwap(selected.r, selected.c, r, c);
    setSelected(null);
  };

  const restartLevel = () => {
    setBoard(freshBoard());
    setScore(0);
    setMoves(cfg.moves);
    setSelected(null);
    setRemoving(new Set());
    setCombo(0);
    setPhase('playing');
    busyRef.current = false;
  };

  const nextLevel = () => {
    if (level >= TOTAL_LEVELS) return;
    const nl = level + 1;
    setLevel(nl);
    setBoard(freshBoard());
    // mantém score como acumulado
    setMoves(levelConfig(nl).moves);
    setSelected(null);
    setRemoving(new Set());
    setCombo(0);
    setPhase('playing');
    busyRef.current = false;
  };

  const resetAll = () => {
    setLevel(1);
    setBoard(freshBoard());
    setScore(0);
    setMoves(levelConfig(1).moves);
    setSelected(null);
    setRemoving(new Set());
    setCombo(0);
    setPhase('playing');
    setLeadSubmitted(false);
    setLeadError('');
    unlockFiredRef.current = false;
    busyRef.current = false;
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadError('');
    if (!leadForm.nickname.trim()) { setLeadError('Nickname é obrigatório.'); return; }
    if (!leadForm.email.trim())    { setLeadError('Email é obrigatório.'); return; }
    if (!leadForm.phone.trim())    { setLeadError('Telefone é obrigatório.'); return; }
    try {
      await submitLead({ ...leadForm, score });
      setLeadSubmitted(true);
    } catch (err) {
      setLeadError(err?.message || 'Falha ao enviar. Tente novamente.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="pixelmatch-root">
      {/* HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
        <Stat label="LEVEL" value={`${level}/${TOTAL_LEVELS}`} accent="#FFB347" />
        <Stat label="ENERGIA" value={score} target={cfg.target} accent="#22E0F5" />
        <Stat label="MOVES" value={moves} accent="#FF9416" />
        <Stat label="COMBO" value={`x${combo}`} accent="#CCFF00" />
      </div>

      <motion.div
        animate={shake ? { x: [-6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="relative glass rounded-2xl p-2.5 md:p-4 overflow-hidden"
        style={{ boxShadow: '0 0 24px rgba(34,224,245,0.18) inset' }}
      >
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute inset-0 starfield opacity-40 pointer-events-none" />

        <div
          className="relative grid gap-1 md:gap-2"
          style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
          data-testid="pixelmatch-board"
        >
          {board.map((row, r) =>
            row.map((v, c) => {
              const key = `${r},${c}`;
              const T = TYPES[v] || TYPES[0];
              const isSelected = selected && selected.r === r && selected.c === c;
              const isRemoving = removing.has(key);
              return (
                <button
                  key={key}
                  onClick={() => onCellClick(r, c)}
                  className="relative aspect-square rounded-lg flex items-center justify-center transition-all duration-150 focus:outline-none"
                  style={{
                    background: T.bg,
                    border: `1.5px solid ${isSelected ? T.color : 'rgba(34,224,245,0.15)'}`,
                    boxShadow: isSelected ? `0 0 14px ${T.color}` : 'none',
                  }}
                  data-testid={`cell-${r}-${c}`}
                  aria-label={T.name}
                >
                  <AnimatePresence mode="popLayout">
                    {!isRemoving && (
                      <motion.span
                        key={`piece-${v}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                        className="flex items-center justify-center"
                      >
                        {T.logo ? (
                          <div className="relative w-7 h-7 md:w-9 md:h-9 rounded-md overflow-hidden"
                               style={{ boxShadow: `0 0 10px ${T.color}aa` }}>
                            <Image src="/logo-hub3.jpg" alt="HUB3" fill className="object-cover" sizes="40px" />
                          </div>
                        ) : T.battery ? (
                          <BatteryGlyph color={T.color} />
                        ) : (
                          <T.Icon
                            className="w-5 h-5 md:w-7 md:h-7"
                            style={{ color: T.color, filter: `drop-shadow(0 0 6px ${T.color}aa)` }}
                            strokeWidth={2.2}
                          />
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="font-mono text-[10px] md:text-[11px] text-foreground/55 tracking-widest">
          NÍVEL {level}: ATINJA <span className="text-cyanElectric">{cfg.target}</span> EM ATÉ <span className="text-hubOrange">{cfg.moves}</span> MOVES
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeaderboard(true)}
            data-testid="open-leaderboard-btn"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-hubOrange/40 text-hubOrange font-mono text-xs hover:bg-hubOrange/10"
          >
            <Trophy className="w-3.5 h-3.5" /> Records
          </button>
          <button
            onClick={restartLevel}
            data-testid="pixelmatch-restart"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-cyanElectric/40 text-cyanElectric font-mono text-xs hover:bg-cyanElectric/10"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
          </button>
        </div>
      </div>

      {/* WIN / LOST modal */}
      <AnimatePresence>
        {phase !== 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bgDark/80 backdrop-blur-sm"
            data-testid="level-result-modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass rounded-2xl p-5 md:p-7 max-w-md w-full border"
              style={{ borderColor: phase === 'won' ? '#22E0F5' : '#FF9416' }}
            >
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10px] tracking-widest"
                     style={{
                       background: phase === 'won' ? 'rgba(34,224,245,0.12)' : 'rgba(255,148,22,0.12)',
                       color: phase === 'won' ? '#22E0F5' : '#FF9416',
                     }}>
                  {phase === 'won' ? <><Trophy className="w-3 h-3" /> NÍVEL {level} COMPLETO</> : 'MOVES ESGOTADOS'}
                </div>
                <h3 className="font-display text-2xl md:text-3xl mt-3 gradient-text">
                  {phase === 'won'
                    ? (level >= TOTAL_LEVELS ? 'CAMPEÃO HUB3!' : `Level ${level} → ${level + 1}`)
                    : 'Tente novamente'}
                </h3>
                <div className="mt-2 font-mono text-xs text-foreground/70">
                  Score atual: <span className="text-cyanElectric font-bold">{score}</span>
                </div>
                {level === UNLOCK_LEVEL && phase === 'won' && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-acidGreen font-mono text-[10px] tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> MENUS DO HUB3 LIBERADOS
                  </div>
                )}
              </div>

              {/* Lead capture form */}
              {!leadSubmitted ? (
                <form onSubmit={handleLeadSubmit} className="space-y-2" data-testid="lead-form">
                  <div className="font-mono text-[10px] tracking-widest text-foreground/60 mb-2 text-center">
                    REGISTRE SEU SCORE NO LEADERBOARD
                  </div>
                  <NeonInput
                    placeholder="NICKNAME"
                    value={leadForm.nickname}
                    onChange={(v) => setLeadForm((f) => ({ ...f, nickname: v }))}
                    testId="lead-nickname"
                  />
                  <NeonInput
                    placeholder="EMAIL"
                    type="email"
                    value={leadForm.email}
                    onChange={(v) => setLeadForm((f) => ({ ...f, email: v }))}
                    testId="lead-email"
                  />
                  <NeonInput
                    placeholder="WHATSAPP (+55...)"
                    value={leadForm.phone}
                    onChange={(v) => setLeadForm((f) => ({ ...f, phone: v }))}
                    testId="lead-phone"
                  />
                  {leadError && <div className="text-magentaSunset text-[11px] font-mono text-center">{leadError}</div>}
                  <button
                    type="submit"
                    disabled={submitting}
                    data-testid="lead-submit"
                    className="w-full inline-flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-md bg-cyanElectric text-bgDark font-mono text-xs tracking-widest hover:shadow-neon-cyan disabled:opacity-50"
                  >
                    {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> ENVIANDO</> : <><Send className="w-3.5 h-3.5" /> SUBMETER SCORE</>}
                  </button>
                </form>
              ) : (
                <div className="text-center py-3" data-testid="lead-success">
                  <CheckCircle2 className="w-8 h-8 text-cyanElectric mx-auto" />
                  <div className="mt-2 font-mono text-xs text-cyanElectric tracking-widest">SCORE REGISTRADO</div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {phase === 'won' && level < TOTAL_LEVELS && (
                  <button
                    onClick={nextLevel}
                    data-testid="next-level-btn"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-hubOrange text-bgDark font-mono text-xs hover:shadow-neon-orange"
                  >
                    Próximo nível <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {phase === 'lost' && (
                  <button
                    onClick={restartLevel}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-cyanElectric text-bgDark font-mono text-xs hover:shadow-neon-cyan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Refazer nível
                  </button>
                )}
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-hubOrange/40 text-hubOrange font-mono text-xs hover:bg-hubOrange/10"
                >
                  <Trophy className="w-3.5 h-3.5" /> Ver records
                </button>
                <button
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground/70 font-mono text-xs hover:text-cyanElectric"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Recomeçar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bgDark/85 backdrop-blur-sm"
            onClick={() => setShowLeaderboard(false)}
            data-testid="leaderboard-modal"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-5 md:p-7 max-w-md w-full border border-hubOrange/40 shadow-neon-orange"
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-hubOrange" />
                <h3 className="font-display text-lg text-hubOrange">LIVRO DE RECORDS · TOP 10</h3>
              </div>
              {leaderboardLoading ? (
                <div className="text-center text-foreground/50 font-mono text-xs py-6">Carregando...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center text-foreground/50 font-mono text-xs py-6">
                  Nenhum record ainda. Seja o primeiro!
                </div>
              ) : (
                <ol className="space-y-1.5">
                  {leaderboard.map((entry, idx) => (
                    <li
                      key={entry._id || idx}
                      className="flex items-center justify-between glass rounded-md px-3 py-2 font-mono text-xs"
                      data-testid={`leaderboard-row-${idx}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-6 text-hubOrange font-bold">{idx + 1}.</span>
                        <span className="text-foreground/90">{entry.nickname}</span>
                      </span>
                      <span className="text-cyanElectric font-bold">{entry.score}</span>
                    </li>
                  ))}
                </ol>
              )}
              <button
                onClick={() => setShowLeaderboard(false)}
                className="mt-5 w-full px-4 py-2 rounded-md border border-cyanElectric/40 text-cyanElectric font-mono text-xs hover:bg-cyanElectric/10"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, target, accent = '#22E0F5' }) {
  return (
    <div className="glass rounded-lg px-3 py-2 flex flex-col items-start" style={{ borderColor: `${accent}55` }}>
      <span className="font-mono text-[9px] tracking-[0.25em] text-foreground/55">{label}</span>
      <span className="font-display text-base md:text-xl" style={{ color: accent, textShadow: `0 0 8px ${accent}55` }}>
        {value}{target ? <span className="text-foreground/40 text-[10px] ml-1">/{target}</span> : null}
      </span>
    </div>
  );
}

function BatteryGlyph({ color }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7" style={{ filter: `drop-shadow(0 0 6px ${color}aa)` }}>
      <rect x="2" y="7" width="17" height="10" rx="2" fill="none" stroke={color} strokeWidth="2" />
      <rect x="20" y="10" width="2" height="4" fill={color} />
      <rect x="4" y="9" width="13" height="6" fill={color} />
    </svg>
  );
}

function NeonInput({ placeholder, value, onChange, type = 'text', testId }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid={testId}
      className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-cyanElectric/30 text-foreground placeholder:text-foreground/40 font-mono text-xs focus:outline-none focus:border-cyanElectric focus:shadow-neon-cyan transition-all"
    />
  );
}

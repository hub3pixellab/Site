'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plug, HardDrive, Cpu, Wifi, BatteryFull, RotateCcw, Trophy } from 'lucide-react';

/**
 * PixelMatch — match-3 estilo Candy Crush com tema tech HUB3.
 * 6x6, troca por clique em peças adjacentes, cascata de matches,
 * pontuação e movimentos limitados. Ao bater o threshold de pontos
 * dispara onComplete() para liberar o Hub.
 */

const SIZE = 6;
const COLORS = 6;
const START_MOVES = 20;
const WIN_SCORE = 240;

const TYPES = [
  { id: 0, name: 'Energia',   Icon: Zap,         color: '#FF9416', bg: 'rgba(255,148,22,0.18)',  border: '#FF9416' },
  { id: 1, name: 'Plugue',    Icon: Plug,        color: '#22E0F5', bg: 'rgba(34,224,245,0.18)',  border: '#22E0F5' },
  { id: 2, name: 'Memória',   Icon: HardDrive,   color: '#FFB347', bg: 'rgba(255,179,71,0.18)',  border: '#FFB347' },
  { id: 3, name: 'Processador', Icon: Cpu,       color: '#7AEEFF', bg: 'rgba(122,238,255,0.18)', border: '#7AEEFF' },
  { id: 4, name: 'Sinal',     Icon: Wifi,        color: '#FF007A', bg: 'rgba(255,0,122,0.18)',   border: '#FF007A' },
  { id: 5, name: 'Bateria',   Icon: BatteryFull, color: '#CCFF00', bg: 'rgba(204,255,0,0.18)',   border: '#CCFF00' },
];

function rand() {
  return Math.floor(Math.random() * COLORS);
}

function freshBoard() {
  // gera tabuleiro sem matches iniciais
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let v;
      do {
        v = rand();
      } while (
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
  // linhas
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 2; c++) {
      const v = b[r][c];
      if (v === -1) continue;
      if (b[r][c + 1] === v && b[r][c + 2] === v) {
        m.add(`${r},${c}`); m.add(`${r},${c + 1}`); m.add(`${r},${c + 2}`);
        let k = c + 3;
        while (k < SIZE && b[r][k] === v) { m.add(`${r},${k}`); k++; }
      }
    }
  }
  // colunas
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 2; r++) {
      const v = b[r][c];
      if (v === -1) continue;
      if (b[r + 1][c] === v && b[r + 2][c] === v) {
        m.add(`${r},${c}`); m.add(`${r + 1},${c}`); m.add(`${r + 2},${c}`);
        let k = r + 3;
        while (k < SIZE && b[k][c] === v) { m.add(`${k},${c}`); k++; }
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
        const v = next[r][c];
        next[r][c] = -1;
        next[writeRow][c] = v;
        writeRow--;
      }
    }
    for (let r = writeRow; r >= 0; r--) next[r][c] = rand();
  }
  return next;
}

export default function PixelMatch({ onComplete, targetScore = WIN_SCORE }) {
  const [board, setBoard] = useState(() => freshBoard());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(START_MOVES);
  const [selected, setSelected] = useState(null);
  const [removing, setRemoving] = useState(new Set());
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);
  const completedRef = useRef(false);
  const busyRef = useRef(false);

  // dispara onComplete uma única vez
  useEffect(() => {
    if (score >= targetScore && !completedRef.current) {
      completedRef.current = true;
      onComplete && onComplete();
    }
  }, [score, targetScore, onComplete]);

  const resolveCascades = useCallback(async (initialBoard) => {
    let current = initialBoard;
    let chain = 0;

    while (true) {
      const matches = findMatches(current);
      if (matches.size === 0) break;
      chain++;
      setCombo(chain);

      // anima remoção
      setRemoving(matches);
      setBoard(current);
      await new Promise((res) => setTimeout(res, 320));

      // remove peças
      const cleared = current.map((row) => row.slice());
      matches.forEach((pos) => {
        const [r, c] = pos.split(',').map(Number);
        cleared[r][c] = -1;
      });

      const points = matches.size * 15 * chain;
      setScore((s) => s + points);
      setRemoving(new Set());

      // gravidade + refill
      current = applyGravity(cleared);
      setBoard(current);
      await new Promise((res) => setTimeout(res, 260));
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
      // invalid swap — shake
      setBoard(next);
      await new Promise((res) => setTimeout(res, 160));
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
    if (busyRef.current || moves <= 0 || completedRef.current) return;
    if (!selected) {
      setSelected({ r, c });
      return;
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }
    const adj = Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1;
    if (!adj) {
      setSelected({ r, c });
      return;
    }
    trySwap(selected.r, selected.c, r, c);
    setSelected(null);
  };

  const restart = () => {
    setBoard(freshBoard());
    setScore(0);
    setMoves(START_MOVES);
    setSelected(null);
    setRemoving(new Set());
    setCombo(0);
    completedRef.current = false;
    busyRef.current = false;
  };

  const won = score >= targetScore;
  const gameOver = moves <= 0 && !won;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* HUD */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="ENERGIA" value={score} target={targetScore} accent="#22E0F5" />
        <Stat label="MOVES" value={moves} accent="#FF9416" />
        <Stat label="COMBO" value={`x${combo}`} accent="#FFB347" />
      </div>

      <motion.div
        animate={shake ? { x: [-6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="relative glass rounded-2xl p-3 md:p-4 overflow-hidden"
        style={{ boxShadow: '0 0 24px rgba(34,224,245,0.18) inset' }}
      >
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute inset-0 starfield opacity-40 pointer-events-none" />

        <div
          className="relative grid gap-1.5 md:gap-2"
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
                        <T.Icon
                          className="w-5 h-5 md:w-7 md:h-7"
                          style={{
                            color: T.color,
                            filter: `drop-shadow(0 0 6px ${T.color}aa)`,
                          }}
                          strokeWidth={2.2}
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isSelected && (
                    <span
                      className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
                      style={{ boxShadow: `inset 0 0 12px ${T.color}` }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Controls + status */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="font-mono text-[11px] text-foreground/50 tracking-widest">
          {won
            ? <span className="text-cyanElectric">SISTEMA SINCRONIZADO — ACESSO LIBERADO</span>
            : gameOver
              ? <span className="text-hubOrange">MOVES ESGOTADOS — REINICIE</span>
              : <>COMBINE 3+ PEÇAS · ATINJA <span className="text-cyanElectric">{targetScore}</span> DE ENERGIA</>}
        </div>
        <button
          onClick={restart}
          data-testid="pixelmatch-restart"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-cyanElectric/40 text-cyanElectric font-mono text-xs hover:bg-cyanElectric/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
        </button>
      </div>

      {/* Win badge */}
      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 glass-orange rounded-xl p-4 flex items-center gap-3"
          >
            <Trophy className="w-5 h-5 text-hubOrange" />
            <div className="font-mono text-xs text-hubGold tracking-wider">
              HIGHSCORE: {score} · DIVISÕES HUB3 LIBERADAS
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, target, accent = '#22E0F5' }) {
  return (
    <div
      className="glass rounded-lg px-3 py-2 flex flex-col items-start"
      style={{ borderColor: `${accent}55` }}
    >
      <span className="font-mono text-[9px] tracking-[0.25em] text-foreground/50">{label}</span>
      <span className="font-display text-lg md:text-xl" style={{ color: accent, textShadow: `0 0 8px ${accent}55` }}>
        {value}{target ? <span className="text-foreground/40 text-xs ml-1">/{target}</span> : null}
      </span>
    </div>
  );
}

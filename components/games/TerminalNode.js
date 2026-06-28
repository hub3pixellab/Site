'use client';
import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { CircleDot, Network } from 'lucide-react';

const SOCKET_RADIUS = 70;

export default function TerminalNode({ onComplete }) {
  const [docked, setDocked] = useState([false, false, false]);
  const socketRef = useRef(null);
  const allDocked = docked.every(Boolean);

  // Triggers onComplete once when all 3 docked
  const completedRef = useRef(false);
  if (allDocked && !completedRef.current) {
    completedRef.current = true;
    // dispatch após frame para não quebrar render
    setTimeout(() => onComplete && onComplete(), 50);
  }

  const handleDock = useCallback((idx, point) => {
    if (!socketRef.current) return false;
    const rect = socketRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = point.x - cx;
    const dy = point.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < SOCKET_RADIUS) {
      setDocked((prev) => {
        const copy = [...prev];
        copy[idx] = true;
        return copy;
      });
      return true;
    }
    return false;
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto h-[420px] md:h-[460px] glass rounded-xl overflow-hidden">
      {/* grid bg */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-radial-acid opacity-50" />

      {/* central socket */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={socketRef}
          className={`relative w-[140px] h-[140px] rounded-full border-2 ${
            allDocked
              ? 'border-acidGreen shadow-neon-green'
              : 'border-acidGreen/50 shadow-neon-violet'
          } bg-bgDark/60 flex items-center justify-center transition-all duration-500`}
        >
          <Network className={`h-10 w-10 ${allDocked ? 'text-acidGreen' : 'text-acidGreen/60'}`} />
          <div className="absolute -inset-2 rounded-full border border-acidGreen/20 animate-pulse-glow" />
          {/* dock counter */}
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-xs text-acidGreen tracking-widest">
            {docked.filter(Boolean).length}/3
          </div>
        </div>
      </div>

      {/* draggable nodes */}
      {[
        { color: 'acidGreen',     shadow: 'shadow-neon-green',   x0: '8%',  y0: '15%' },
        { color: 'cyanElectric',  shadow: 'shadow-neon-cyan',    x0: '78%', y0: '20%' },
        { color: 'magentaSunset', shadow: 'shadow-neon-magenta', x0: '40%', y0: '78%' },
      ].map((cfg, i) => (
        <DraggableNode
          key={i}
          idx={i}
          color={cfg.color}
          shadow={cfg.shadow}
          x0={cfg.x0}
          y0={cfg.y0}
          docked={docked[i]}
          onDock={handleDock}
        />
      ))}
    </div>
  );
}

function DraggableNode({ idx, color, shadow, x0, y0, docked, onDock }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ref = useRef(null);

  return (
    <motion.div
      ref={ref}
      drag={!docked}
      dragMomentum={false}
      style={{ left: x0, top: y0, x, y }}
      className={`absolute select-none ${docked ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
      whileDrag={{ scale: 1.1 }}
      onDragEnd={(_, info) => {
        const docked = onDock(idx, { x: info.point.x, y: info.point.y });
        if (!docked) {
          // volta suave para origem (animação do framer cuida disso ao usar dragSnapToOrigin? não existe nativo, usamos animate)
          x.set(0); y.set(0);
        }
      }}
      animate={docked ? { opacity: 0, scale: 0.4 } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className={`relative w-14 h-14 rounded-full bg-bgDark border-2 border-${color} ${shadow} flex items-center justify-center animate-pulse-glow`}>
        <CircleDot className={`h-6 w-6 text-${color}`} />
      </div>
    </motion.div>
  );
}

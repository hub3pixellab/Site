'use client';
// PLACEHOLDER — substitua todo este arquivo pelo código de Hub3steroids.js fornecido.
// Já tem fetch direto para /api/arcade/lead e roda standalone.
import { Rocket } from 'lucide-react';

export default function Hub3steroids() {
  return (
    <div className="glass rounded-2xl p-10 text-center border border-hubOrange/25 min-h-[400px] flex flex-col items-center justify-center">
      <Rocket className="w-12 h-12 text-hubOrange mb-3" />
      <h3 className="font-display text-2xl text-hubOrange">HUB3STEROIDS</h3>
      <p className="text-foreground/65 text-sm mt-3 font-mono">CABINE EM PREPARAÇÃO</p>
      <p className="text-foreground/45 text-[11px] mt-1 font-mono">
        Cole o código de Hub3steroids.js em /components/games/Hub3steroids.js
      </p>
    </div>
  );
}

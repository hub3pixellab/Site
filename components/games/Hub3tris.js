'use client';
// PLACEHOLDER — substitua todo este arquivo pelo código de Hub3tris.js fornecido.
// Já tem fetch direto para /api/arcade/lead e roda standalone.
import { Square } from 'lucide-react';

export default function Hub3tris() {
  return (
    <div className="glass rounded-2xl p-10 text-center border border-cyanElectric/20 min-h-[400px] flex flex-col items-center justify-center">
      <Square className="w-12 h-12 text-cyanElectric mb-3" />
      <h3 className="font-display text-2xl text-cyanElectric">HUB3TRIS</h3>
      <p className="text-foreground/65 text-sm mt-3 font-mono">CABINE EM PREPARAÇÃO</p>
      <p className="text-foreground/45 text-[11px] mt-1 font-mono">
        Cole o código de Hub3tris.js em /components/games/Hub3tris.js
      </p>
    </div>
  );
}

'use client';
// Placeholder — código completo do Hub3duro veio truncado.
// Reenvie a parte que faltava (do Header em diante) para popularmos a cabine.
import { Car } from 'lucide-react';

export default function Hub3duro() {
  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 480,
      margin: '0 auto', borderRadius: 12, overflow: 'hidden',
      border: '1.5px solid #4F1487',
      boxShadow: '0 0 40px rgba(79,20,135,0.55)',
      background: '#0b0914', padding: 60,
      textAlign: 'center', fontFamily: '"JetBrains Mono", monospace',
    }}>
      <Car style={{ color: '#FF6B35', width: 48, height: 48, margin: '0 auto 12px' }} />
      <h3 style={{ color: '#FF6B35', fontFamily: '"Orbitron", monospace', letterSpacing: 3, fontSize: 22, margin: 0 }}>
        HUB3DURO
      </h3>
      <p style={{ color: 'rgba(232,244,255,0.55)', fontSize: 12, marginTop: 10, letterSpacing: 1 }}>
        CABINE EM PREPARAÇÃO
      </p>
      <p style={{ color: 'rgba(232,244,255,0.35)', fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
        Race & Run · Em breve
      </p>
    </div>
  );
}

// /components/games/Hub3Runner.js
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
};

const W = 560;
const H = 420;
const GROUND_Y = 350;
const QUALIFY_SCORE = 800;
const LIVES_START = 3;

const STAGE_DIST = [3000,5000,7500,10500,14000,18000,22500,27500,33000,40000];

const THEMES = [
  {name:'NEON CITY',   sky:['#0b0914','#1a0530'], g:'#0d0a20', acc:'#CCFF00', fog:0    },
  {name:'CYBER DOCKS', sky:['#050a14','#0a1530'], g:'#080d1a', acc:'#00F0FF', fog:0.1  },
  {name:'VIOLET ZONE', sky:['#140820','#2a0a3a'], g:'#0f0818', acc:'#9945FF', fog:0    },
  {name:'NEON RAIN',   sky:['#060c14','#0a1828'], g:'#060c18', acc:'#FF007A', fog:0.18 },
  {name:'GLITCH',      sky:['#080514','#180828'], g:'#0a0614', acc:'#FF99CC', fog:0    },
  {name:'ZERO DARK',   sky:['#030208','#080514'], g:'#050310', acc:'#00F0FF', fog:0.35 },
  {name:'TOXIC',       sky:['#0a1408','#141f0a'], g:'#090f08', acc:'#44FF00', fog:0.12 },
  {name:'MATRIX',      sky:['#020a04','#040d06'], g:'#030804', acc:'#00FF44', fog:0    },
  {name:'LAVA',        sky:['#1a0804','#2a0e06'], g:'#140604', acc:'#FF4400', fog:0.08 },
  {name:'VOID',        sky:['#010103','#040408'], g:'#020206', acc:'#8844FF', fog:0.5  },
];

const OBS_TYPES = {
  wall:  {w:26, h:36, color:'#FF007A', minStage:1},
  spike: {w:24, h:30, color:'#9945FF', minStage:1},
  beam:  {w:56, h:18, color:'#F7931A', minStage:1},
  low:   {w:52, h:16, color:'#00F0FF', minStage:4, floating: 52},
  tall:  {w:22, h:52, color:'#FF99CC', minStage:7},
  step:  {w:30, h:24, color:'#FF007A', minStage:9, floating: 60},
};

const TOKENS = [
  {id:'btc',  symbol:'\u20BF', color:'#F7931A', pts:200},
  {id:'eth',  symbol:'\u039E', color:'#00F0FF', pts:150},
  {id:'sol',  symbol:'\u25CE', color:'#9945FF', pts:180},
  {id:'pepe', symbol:'\u2726', color:'#FF007A', pts:350},
  {id:'boost',symbol:'\u26A1', color:'#CCFF00', pts:100},
];

const POWERUPS = [
  {type:'shield', sym:'\u{1F6E1}', color:'#00F0FF', dur:300, label:'SHIELD'},
  {type:'magnet', sym:'\u{1F9F2}', color:'#CCFF00', dur:220, label:'MAGNET'},
  {type:'slow',   sym:'\u23F1',    color:'#9945FF', dur:180, label:'SLOWMO'},
  {type:'double', sym:'\u00D72',   color:'#FF007A', dur:260, label:'2X PTS'},
];

// ─── Utils ────────────────────────────────────────────────────────────────────
function rnd(n)      { return Math.floor(Math.random()*n); }
function rndR(a,b)   { return a + Math.random()*(b-a); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

function getTheme(stage) { return THEMES[Math.min(stage-1, THEMES.length-1)]; }

function collides(ax,ay,aw,ah,bx,by,bw,bh) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

function makeParticles(x, y, color, n=12, sp=4) {
  return Array.from({length:n}, () => {
    const a=Math.random()*Math.PI*2, s=rndR(0.5, sp);
    return {x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, r:rndR(1.5,4), life:rndR(20,45), maxLife:45, color};
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

// ─── Background layers ───────────────────────────────────────────────────────
function drawBg(ctx, s) {
  const th = getTheme(s.stage);

  // Sky
  const sky = ctx.createLinearGradient(0,0,0,GROUND_Y);
  sky.addColorStop(0, th.sky[0]); sky.addColorStop(1, th.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,GROUND_Y);

  // Scanlines
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let sy=0; sy<H; sy+=3) ctx.fillRect(0, sy, W, 1);
  ctx.restore();

  // Stars (pulsing)
  ctx.save();
  for (let i=0; i<30; i++) {
    const sx = (i*139 + s.bgFar*0.015) % W;
    const sy = (i*97) % (GROUND_Y*0.85);
    ctx.globalAlpha = 0.15 + 0.65*Math.abs(Math.sin(s.tick*0.008+i));
    ctx.fillStyle = th.acc;
    ctx.fillRect(sx, sy, i%7===0?2:1, i%7===0?2:1);
  }
  ctx.restore();

  // Far buildings layer
  const fbs = [
    {x:0,w:55,h:130},{x:60,w:40,h:90},{x:105,w:70,h:160},
    {x:180,w:50,h:110},{x:235,w:80,h:180},{x:320,w:45,h:100},
    {x:370,w:90,h:150},{x:465,w:55,h:130},{x:525,w:45,h:115},
  ];
  ctx.save();
  const farLoop = W + 200;
  fbs.forEach(b => {
    const bx = ((b.x - (s.bgFar % farLoop) + farLoop*2) % farLoop);
    ctx.fillStyle = '#0d0a1c';
    ctx.fillRect(bx, GROUND_Y - b.h, b.w, b.h);
    for (let wy = GROUND_Y-b.h+8; wy < GROUND_Y-8; wy += 18) {
      for (let wx = bx+5; wx < bx+b.w-5; wx += 12) {
        if ((wx+wy+s.tick)%23 < 2) continue;
        ctx.fillStyle = th.acc;
        ctx.shadowColor = th.acc; ctx.shadowBlur = 3;
        ctx.globalAlpha = 0.12 + Math.sin(s.tick*0.015 + wx + wy)*0.06;
        ctx.fillRect(wx, wy, 6, 8);
      }
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  });
  ctx.restore();

  // Mid buildings layer (neon outlines)
  const mbs = [
    {x:0,w:45,h:80},{x:50,w:35,h:55},{x:90,w:60,h:95},
    {x:155,w:40,h:65},{x:200,w:70,h:105},{x:275,w:50,h:75},
    {x:330,w:80,h:100},{x:415,w:45,h:70},{x:465,w:55,h:88},{x:525,w:40,h:72},
  ];
  ctx.save();
  const midLoop = W + 150;
  mbs.forEach(b => {
    const bx = ((b.x - (s.bgMid % midLoop) + midLoop*2) % midLoop);
    ctx.fillStyle = '#130e26';
    ctx.fillRect(bx, GROUND_Y - b.h, b.w, b.h);
    ctx.strokeStyle = th.acc; ctx.shadowColor = th.acc; ctx.shadowBlur = 5;
    ctx.lineWidth = 1; ctx.globalAlpha = 0.18;
    ctx.strokeRect(bx+2, GROUND_Y - b.h + 2, b.w-4, b.h-4);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  });
  ctx.restore();

  // Ground
  ctx.fillStyle = th.g;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // Ground neon line
  ctx.save();
  ctx.strokeStyle = th.acc; ctx.shadowColor = th.acc; ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();

  // Perspective grid
  ctx.strokeStyle = `${th.acc}47`;
  ctx.lineWidth = 0.5; ctx.shadowBlur = 0;
  for (let gx = ((-(s.bgNear) % 64) + 64) % 64; gx < W + 40; gx += 64) {
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y);
    ctx.lineTo(gx - 32, H);
    ctx.stroke();
  }
  ctx.restore();

  // Fog
  if (th.fog > 0) {
    const fg = ctx.createLinearGradient(0, GROUND_Y-60, 0, GROUND_Y);
    fg.addColorStop(0, 'transparent');
    fg.addColorStop(1, `rgba(15,10,40,${th.fog})`);
    ctx.fillStyle = fg;
    ctx.fillRect(0, GROUND_Y-60, W, 60);
  }

  // Stage name watermark
  ctx.save();
  ctx.fillStyle = `${th.acc}14`;
  ctx.font = 'bold 58px "Orbitron",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(th.name, W/2, GROUND_Y/2);
  ctx.restore();

  // Radial center glow
  ctx.save();
  const rg = ctx.createRadialGradient(W/2, GROUND_Y/2, 0, W/2, GROUND_Y/2, W/2);
  rg.addColorStop(0, 'rgba(79,20,135,0.15)');
  rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, GROUND_Y);
  ctx.restore();
}

// ─── Runner (character) ──────────────────────────────────────────────────────
function drawRunner(ctx, r, tick, acc, pw) {
  // Trail
  ctx.save();
  r.trail.forEach((p, i) => {
    const a = (i / r.trail.length) * 0.3;
    ctx.globalAlpha = a;
    ctx.fillStyle = acc;
    ctx.fillRect(p.x + 4, p.y + 10, 14, r.ducking ? 12 : 22);
  });
  ctx.restore();

  if (r.invincible > 0 && Math.floor(tick/5)%2 === 0) return;

  const { x, y, ducking } = r;
  const rw = 22;
  const rh = ducking ? 16 : 36;
  const cx = x + rw/2;
  const cy = y + rh/2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = acc;
  ctx.shadowBlur = ducking ? 12 : 16;

  if (ducking) {
    ctx.fillStyle = acc;
    roundRect(ctx, -rw/2, -rh/2, rw, rh, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 0;
    ctx.fillRect(-rw*0.3, -rh*0.35, rw*0.6, rh*0.5);
    ctx.fillStyle = 'rgba(0,240,255,0.35)';
    ctx.fillRect(-rw*0.25, -rh*0.3, rw*0.5, rh*0.12);
  } else {
    const lp = Math.sin(tick*0.28) * 7;
    // Legs
    ctx.fillStyle = `${acc}cc`;
    ctx.fillRect(-rw*0.35, rh*0.12, rw*0.28, rh*0.45 + lp*0.4);
    ctx.fillRect( rw*0.07, rh*0.12, rw*0.28, rh*0.45 - lp*0.4);
    // Body
    ctx.fillStyle = acc;
    roundRect(ctx, -rw/2, -rh*0.35, rw, rh*0.6, 4); ctx.fill();
    // Head
    ctx.beginPath(); ctx.arc(0, -rh*0.35 - 9, 9, 0, Math.PI*2); ctx.fill();
    // Visor
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 0;
    ctx.fillRect(2, -rh*0.35 - 14, 8, 5);
    ctx.fillStyle = 'rgba(0,240,255,0.4)';
    ctx.fillRect(3, -rh*0.35 - 13, 6, 2);
    // Arm
    ctx.fillStyle = acc; ctx.shadowColor = acc; ctx.shadowBlur = 8;
    ctx.fillRect(rw*0.45, -rh*0.25, rw*0.35, rh*0.15);
  }

  // Powerup overlays
  if (pw === 'shield') {
    ctx.strokeStyle = COLORS.cyan; ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 18;
    ctx.lineWidth = 1.8; ctx.globalAlpha = 0.7 + 0.3*Math.sin(tick*0.15);
    ctx.beginPath(); ctx.arc(0, 0, rw*1.1, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (pw === 'double') {
    ctx.fillStyle = COLORS.magenta; ctx.shadowColor = COLORS.magenta; ctx.shadowBlur = 14;
    ctx.font = 'bold 10px "Orbitron",monospace'; ctx.textAlign = 'center';
    ctx.fillText('\u00D72', 0, -rh*0.35 - 24);
  } else if (pw === 'slow') {
    ctx.fillStyle = COLORS.ultraviolet; ctx.shadowColor = COLORS.ultraviolet; ctx.shadowBlur = 12;
    ctx.font = '10px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText('\u23F1', 0, -rh*0.35 - 24);
  } else if (pw === 'magnet') {
    for (let i=0; i<6; i++) {
      const a = (tick*0.05 + i * Math.PI/3);
      const px = Math.cos(a) * (rw*1.4);
      const py = Math.sin(a) * (rh*0.5);
      ctx.fillStyle = COLORS.acidGreen; ctx.shadowColor = COLORS.acidGreen; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Obstacle ────────────────────────────────────────────────────────────────
function drawObstacle(ctx, o, tick) {
  const meta = OBS_TYPES[o.type];
  const { x, y, w, h } = o;

  ctx.save();
  ctx.shadowColor = meta.color; ctx.shadowBlur = 12;

  if (o.type === 'spike') {
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.moveTo(x + w/2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.white; ctx.lineWidth = 1; ctx.shadowBlur = 6;
    ctx.stroke();
  } else if (o.type === 'low') {
    ctx.fillStyle = meta.color;
    roundRect(ctx, x, y, w, h, 4); ctx.fill();
    // Inner pulsing bar
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 0;
    const pw = (w-4) * (0.7 + 0.3 * Math.sin(tick*0.1));
    ctx.fillRect(x + 2, y + h*0.3, pw, h*0.18);
    // Warning arrow underneath
    ctx.fillStyle = meta.color; ctx.shadowColor = meta.color; ctx.shadowBlur = 6;
    ctx.font = 'bold 9px "JetBrains Mono",monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DUCK', x + w/2, y + h + 12);
  } else if (o.type === 'tall') {
    ctx.fillStyle = meta.color;
    roundRect(ctx, x, y, w, h, 4); ctx.fill();
    // Decorative horizontal lines every 12px
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
    for (let ly = y + 12; ly < y + h; ly += 12) {
      ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke();
    }
  } else if (o.type === 'step') {
    ctx.fillStyle = meta.color;
    roundRect(ctx, x, y, w, h, 4); ctx.fill();
    ctx.strokeStyle = COLORS.white; ctx.lineWidth = 1; ctx.shadowBlur = 6;
    ctx.strokeRect(x+2, y+2, w-4, h-4);
    ctx.strokeStyle = meta.color; ctx.shadowColor = meta.color; ctx.shadowBlur = 10;
    ctx.strokeRect(x-1, y-1, w+2, h+2);
  } else {
    // wall, beam (default rounded rect)
    ctx.fillStyle = meta.color;
    roundRect(ctx, x, y, w, h, 4); ctx.fill();
  }

  // Common scanline
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.shadowBlur = 0;
  ctx.fillRect(x+2, y + h*0.2, w-4, h*0.12);
  ctx.restore();
}

// ─── Token ───────────────────────────────────────────────────────────────────
function drawToken(ctx, t, tick) {
  const scale = 0.85 + 0.15 * Math.sin(tick*0.08 + t.x);
  ctx.save();
  ctx.translate(t.x + 14, t.y + 14);
  ctx.scale(scale, scale);
  // Outer ring
  ctx.strokeStyle = t.color; ctx.shadowColor = t.color; ctx.shadowBlur = 14;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI*2); ctx.stroke();
  // Inner fill
  ctx.fillStyle = t.color; ctx.globalAlpha = 0.22; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // Symbol
  ctx.fillStyle = t.color; ctx.shadowColor = t.color; ctx.shadowBlur = 8;
  ctx.font = 'bold 13px "JetBrains Mono",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(t.symbol, 0, 1);
  ctx.restore();
}

// ─── Powerup (rotating star) ─────────────────────────────────────────────────
function drawPowerup(ctx, pw, tick) {
  const cx = pw.x + 14;
  const cy = pw.y + 14;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tick * 0.04);
  const outer = 14, inner = 7;
  ctx.beginPath();
  for (let i=0; i<5; i++) {
    const a1 = (Math.PI*2*i/5) - Math.PI/2;
    const a2 = a1 + Math.PI/5;
    const x1 = Math.cos(a1)*outer, y1 = Math.sin(a1)*outer;
    const x2 = Math.cos(a2)*inner, y2 = Math.sin(a2)*inner;
    if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.strokeStyle = pw.color; ctx.lineWidth = 1.5; ctx.shadowColor = pw.color; ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.fillStyle = pw.color; ctx.globalAlpha = 0.12; ctx.shadowBlur = 0;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Emoji label above center (no rotation)
  ctx.save();
  ctx.fillStyle = pw.color; ctx.shadowColor = pw.color; ctx.shadowBlur = 8;
  ctx.font = 'bold 11px "JetBrains Mono",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(pw.sym, cx, cy);
  ctx.restore();
}

function drawParticles(ctx, parts) {
  parts.forEach(p => {
    const a = p.life / p.maxLife;
    ctx.save(); ctx.globalAlpha = a;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r*a, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });
}

function drawFloats(ctx, floats) {
  floats.forEach(f => {
    const a = f.life / f.maxLife;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = f.color; ctx.shadowColor = f.color; ctx.shadowBlur = 10;
    ctx.font = 'bold 13px "Orbitron",monospace'; ctx.textAlign = 'center';
    ctx.fillText(`+${f.pts}`, f.x, f.y);
    ctx.restore();
  });
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function drawHUD(ctx, s, theme) {
  ctx.save();
  ctx.font = '11px "JetBrains Mono",monospace';
  ctx.fillStyle = COLORS.acidGreen; ctx.shadowColor = COLORS.acidGreen; ctx.shadowBlur = 8;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${String(s.score).padStart(6,'0')}`, 10, 20);
  ctx.fillStyle = COLORS.cyan; ctx.shadowColor = COLORS.cyan;
  ctx.fillText(`DIST   ${String(Math.floor(s.distance)).padStart(5,'0')}m`, 10, 36);

  // Right: lives + stage name
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.magenta; ctx.shadowColor = COLORS.magenta;
  ctx.fillText('\u25B2'.repeat(Math.max(0, s.lives)), W - 10, 20);
  ctx.fillStyle = theme.acc; ctx.shadowColor = theme.acc;
  ctx.font = '10px "Orbitron",monospace';
  ctx.fillText(theme.name, W - 10, 36);

  // Active powerup (center-top)
  if (s.activePowerup) {
    const p = POWERUPS.find(x => x.type === s.activePowerup.type);
    const pct = s.activePowerup.timer / s.activePowerup.maxTimer;
    ctx.textAlign = 'center';
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
    ctx.font = 'bold 10px "Orbitron",monospace';
    ctx.fillText(p.label, W/2, 20);
    ctx.fillStyle = 'rgba(79,20,135,0.4)'; ctx.shadowBlur = 0;
    ctx.fillRect(W/2 - 50, 26, 100, 4);
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 6;
    ctx.fillRect(W/2 - 50, 26, 100 * pct, 4);
  }

  // Stage progress bar
  const stageIdx = s.stage - 1;
  const prev = stageIdx === 0 ? 0 : STAGE_DIST[stageIdx-1];
  const cur = STAGE_DIST[Math.min(stageIdx, STAGE_DIST.length-1)];
  const pct = clamp((s.distance - prev) / (cur - prev), 0, 1);
  ctx.textAlign = 'right';
  ctx.fillStyle = `${theme.acc}88`; ctx.shadowBlur = 0; ctx.font = '8px monospace';
  ctx.fillText(`${Math.floor(pct*100)}%`, W-12, H - 26);
  ctx.fillStyle = 'rgba(79,20,135,0.4)';
  ctx.fillRect(10, H - 22, W - 20, 7);
  ctx.fillStyle = theme.acc; ctx.shadowColor = theme.acc; ctx.shadowBlur = 8;
  ctx.fillRect(10, H - 22, (W - 20) * pct, 7);

  // Combo counter
  if (s.comboMult > 1) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px "Orbitron",monospace';
    const p2 = 0.5 + 0.5*Math.sin(s.tick*0.1);
    const cLerp = p2 > 0.5 ? theme.acc : COLORS.white;
    ctx.fillStyle = cLerp; ctx.shadowColor = theme.acc; ctx.shadowBlur = 12;
    ctx.fillText(`\u00D7${s.comboMult.toFixed(1)}`, W - 14, H/2);
    ctx.font = '9px "JetBrains Mono",monospace'; ctx.shadowBlur = 0;
    ctx.fillStyle = `${COLORS.white}66`;
    ctx.fillText(`COMBO`, W - 14, H/2 + 12);
  }

  ctx.restore();

  // Border
  ctx.save();
  ctx.strokeStyle = theme.acc; ctx.shadowColor = theme.acc; ctx.shadowBlur = 14;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);
  ctx.restore();
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
function GlowText({children, color, size=16, style={}}) {
  return (
    <p style={{
      margin:0, color, fontSize:size,
      fontFamily:'"Orbitron","JetBrains Mono",monospace',
      letterSpacing:2, textShadow:`0 0 10px ${color},0 0 24px ${color}55`,
      textAlign:'center', lineHeight:1.4, ...style,
    }}>{children}</p>
  );
}
function Overlay({children}) {
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'rgba(11,9,20,0.9)', backdropFilter:'blur(4px)',
      padding:20, gap:8,
    }}>{children}</div>
  );
}
function NeonBtn({children, onClick, color=COLORS.acidGreen, disabled, type='button', style={}, testId}) {
  const [h, setH] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      data-testid={testId}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        marginTop:12, padding:'10px 32px',
        background: h ? `${color}18` : 'transparent',
        border:`1.5px solid ${color}`, borderRadius:6, color, fontSize:13,
        fontFamily:'"Orbitron",monospace', letterSpacing:3,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        boxShadow: h ? `0 0 18px ${color}55` : `0 0 8px ${color}33`,
        transition:'all 0.18s', ...style,
      }}>{children}</button>
  );
}
function NeonInput({placeholder, value, onChange, type='text'}) {
  return (
    <input type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background:'rgba(255,255,255,0.04)',
        border:`1px solid ${COLORS.ultraviolet}`,
        borderRadius:5, padding:'8px 14px', color:COLORS.white, fontSize:12,
        fontFamily:'"JetBrains Mono",monospace', letterSpacing:1, outline:'none',
        width:'100%', boxSizing:'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = COLORS.acidGreen; }}
      onBlur={e => { e.target.style.borderColor = COLORS.ultraviolet; }}
    />
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function Hub3Runner({ onGameOver }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const rafRef    = useRef(null);
  const keysRef   = useRef({});
  const touchRef  = useRef(null);
  const highRef   = useRef(0);
  const dpadRef   = useRef({ jump:false, duck:false });

  const [phase, setPhase]     = useState('idle');
  const [uiScore, setUiScore] = useState(0);
  const [uiHigh, setUiHigh]   = useState(0);
  const [uiStage, setUiStage] = useState(1);

  const [leadForm, setLeadForm]     = useState({ nickname:'', email:'', phone:'' });
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const initState = useCallback(() => ({
    tick:0, score:0, lives:LIVES_START, stage:1, distance:0, speed:4,
    bgFar:0, bgMid:0, bgNear:0,
    runner: {
      x:70, y:GROUND_Y - 36, vy:0, onGround:true, ducking:false,
      invincible:0, doubleJumped:false, trail:[],
    },
    obstacles:[], tokens:[], powerups:[], particles:[], floats:[],
    obsTimer:90, tokenTimer:150, pwTimer:400,
    activePowerup:null, shieldHits:0,
    combo:0, comboMult:1,
    stageClear:false, stageClearTimer:0, stageJustCleared:0,
    phase:'playing',
    highRef: highRef.current,
  }), []);

  const doJump = useCallback((s) => {
    if (!s || s.phase !== 'playing') return;
    const r = s.runner;
    if (r.onGround) {
      r.vy = -11.5; r.onGround = false; r.doubleJumped = false;
    } else if (!r.doubleJumped) {
      r.vy = -9.0; r.doubleJumped = true;
    }
  }, []);

  const doDuck = useCallback((s, on) => {
    if (!s || s.phase !== 'playing') return;
    s.runner.ducking = !!on;
  }, []);

  const spawnObstacle = useCallback((s) => {
    const available = Object.entries(OBS_TYPES).filter(([_,v]) => v.minStage <= s.stage);
    if (!available.length) return;
    const [type, meta] = available[rnd(available.length)];
    const y = meta.floating != null ? (GROUND_Y - meta.floating) : (GROUND_Y - meta.h);
    s.obstacles.push({ type, x: W + 20, y, w: meta.w, h: meta.h });

    // Combo spawn (>=stage 3, 25% chance)
    if (s.stage >= 3 && Math.random() < 0.25) {
      const gap = 80 + Math.random() * 40;
      const t2 = available[rnd(available.length)];
      const type2 = t2[0], m2 = t2[1];
      const y2 = m2.floating != null ? (GROUND_Y - m2.floating) : (GROUND_Y - m2.h);
      s.obstacles.push({ type: type2, x: W + 20 + gap, y: y2, w: m2.w, h: m2.h });
    }
  }, []);

  const spawnToken = useCallback((s) => {
    const t = TOKENS[rnd(TOKENS.length)];
    const y = GROUND_Y - 30 - Math.random() * 50;
    s.tokens.push({ ...t, x: W + 20, y, collected: false });
  }, []);

  const spawnPowerup = useCallback((s) => {
    const p = POWERUPS[rnd(POWERUPS.length)];
    const y = GROUND_Y - 20 - Math.random() * 50;
    s.powerups.push({ ...p, x: W + 20, y, collected: false });
  }, []);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let uiSyncCounter = 0;

    const frame = () => {
      const s = stateRef.current;
      if (!s || s.phase === 'gameover') return;
      rafRef.current = requestAnimationFrame(frame);
      s.tick++;

      // Effective speed with slowmo
      const effSpeed = s.activePowerup?.type === 'slow' ? s.speed * 0.4 : s.speed;

      // Distance & bg scroll
      s.distance += effSpeed * 0.5;
      s.bgFar  += effSpeed * 0.15;
      s.bgMid  += effSpeed * 0.35;
      s.bgNear += effSpeed * 1.0;
      s.speed = Math.min(14, s.speed + 0.0008);

      // Input (keyboard + dpad + queued jump)
      const kJump = keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current[' '] || dpadRef.current.jump;
      const kDouble = keysRef.current['z'];
      const kDuck = keysRef.current['ArrowDown'] || keysRef.current['s'] || dpadRef.current.duck;

      if (kJump && !s._prevJump) doJump(s);
      s._prevJump = kJump;
      if (kDouble && !s._prevZ) {
        if (!s.runner.onGround && !s.runner.doubleJumped) { s.runner.vy = -9; s.runner.doubleJumped = true; }
      }
      s._prevZ = kDouble;
      doDuck(s, kDuck && s.runner.onGround);

      // Physics
      const r = s.runner;
      r.vy += 0.48;
      r.y += r.vy;
      const rh = r.ducking ? 16 : 36;
      const groundY = GROUND_Y - rh;
      if (r.y >= groundY) {
        r.y = groundY; r.vy = 0; r.onGround = true; r.doubleJumped = false;
      } else {
        r.onGround = false;
      }
      if (r.invincible > 0) r.invincible--;

      // Trail
      if (s.tick % 3 === 0) {
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();
      }

      // Move & spawn obstacles/tokens/powerups
      s.obstacles.forEach(o => { o.x -= effSpeed; });
      s.tokens.forEach(t => { t.x -= effSpeed; });
      s.powerups.forEach(p => { p.x -= effSpeed; });

      s.obsTimer--;
      if (s.obsTimer <= 0) {
        spawnObstacle(s);
        const base = Math.max(32, 90 - Math.floor(s.distance / 1000));
        s.obsTimer = base + rnd(20);
      }
      s.tokenTimer--;
      if (s.tokenTimer <= 0) {
        spawnToken(s);
        s.tokenTimer = 150 + rnd(100);
      }
      s.pwTimer--;
      if (s.pwTimer <= 0) {
        spawnPowerup(s);
        s.pwTimer = 400 + rnd(300);
      }

      // Powerup timer
      if (s.activePowerup) {
        s.activePowerup.timer--;
        if (s.activePowerup.timer <= 0) {
          if (s.activePowerup.type === 'shield') s.shieldHits = 0;
          s.activePowerup = null;
        }
      }

      // Magnet: attract nearby tokens
      if (s.activePowerup?.type === 'magnet') {
        const cx = r.x + 11, cy = r.y + rh/2;
        s.tokens.forEach(t => {
          const dx = t.x + 14 - cx;
          const dy = t.y + 14 - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            t.x -= dx * 0.08;
            t.y -= dy * 0.08;
          }
        });
      }

      // Collisions — obstacles
      const hbX = r.ducking ? r.x + 2 : r.x + 3;
      const hbW = r.ducking ? 18 : 16;
      const hbH = rh;
      if (r.invincible <= 0) {
        for (const o of s.obstacles) {
          if (collides(hbX, r.y, hbW, hbH, o.x, o.y, o.w, o.h)) {
            if (s.activePowerup?.type === 'shield') {
              s.activePowerup = null; s.shieldHits = 0;
              s.particles.push(...makeParticles(o.x + o.w/2, o.y + o.h/2, COLORS.cyan, 16, 4));
            } else {
              s.lives--; r.invincible = 90; s.combo = 0; s.comboMult = 1;
              s.particles.push(...makeParticles(r.x + 11, r.y + rh/2, COLORS.magenta, 24, 6));
              s._flash = 1;
              if (s.lives <= 0) { s.phase = 'gameover'; }
            }
            break;
          }
        }
      }

      // Collisions — tokens
      s.tokens.forEach(t => {
        if (t.collected) return;
        if (collides(hbX - 4, r.y - 4, hbW + 8, hbH + 8, t.x, t.y, 28, 28)) {
          t.collected = true;
          s.combo++;
          if (s.combo >= 15) s.comboMult = 3.0;
          else if (s.combo >= 10) s.comboMult = 2.0;
          else if (s.combo >= 5) s.comboMult = 1.5;
          let pts = t.pts * s.stage;
          if (s.activePowerup?.type === 'double') pts *= 2;
          pts = Math.floor(pts * s.comboMult);
          s.score += pts;
          s.floats.push({ x: t.x + 14, y: t.y, pts, life:40, maxLife:40, color: t.color });
          s.particles.push(...makeParticles(t.x + 14, t.y + 14, t.color, 12, 4));
        }
      });
      s.tokens = s.tokens.filter(t => !t.collected && t.x + 28 > -10);

      // Collisions — powerups
      s.powerups.forEach(p => {
        if (p.collected) return;
        if (collides(hbX - 4, r.y - 4, hbW + 8, hbH + 8, p.x, p.y, 28, 28)) {
          p.collected = true;
          s.activePowerup = { type: p.type, timer: p.dur, maxTimer: p.dur };
          if (p.type === 'shield') s.shieldHits = 1;
          s.particles.push(...makeParticles(p.x + 14, p.y + 14, p.color, 18, 5));
        }
      });
      s.powerups = s.powerups.filter(p => !p.collected && p.x + 28 > -10);

      // Remove offscreen obstacles
      s.obstacles = s.obstacles.filter(o => o.x + o.w > -10);

      // Particles & floats update
      s.particles = s.particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vx: p.vx*0.9, vy: p.vy*0.9, life: p.life - 1 }))
        .filter(p => p.life > 0);
      s.floats = s.floats
        .map(f => ({ ...f, y: f.y - 0.9, life: f.life - 1 }))
        .filter(f => f.life > 0);

      // Stage progression
      const target = STAGE_DIST[Math.min(s.stage - 1, STAGE_DIST.length - 1)];
      if (s.distance >= target && s.stage <= STAGE_DIST.length) {
        const bonus = 1000 * s.stage;
        s.score += bonus;
        s.stageJustCleared = s.stage;
        s.stageClear = true;
        s.stageClearTimer = 150; // ~2.5s at 60fps
        s.particles.push(...makeParticles(W/2, GROUND_Y/2, getTheme(s.stage).acc, 40, 5));
        s._flashWhite = 3;
        s.stage++;
        s.floats.push({ x: W/2, y: GROUND_Y/2, pts: bonus, life:60, maxLife:60, color: getTheme(s.stage - 1).acc });
      }

      if (s.stageClear) {
        s.stageClearTimer--;
        if (s.stageClearTimer <= 0) s.stageClear = false;
      }

      // Score per frame
      s.score += Math.floor(s.speed * 0.1);

      // Best score
      if (s.score > highRef.current) highRef.current = s.score;

      // Throttled UI sync
      uiSyncCounter++;
      if (uiSyncCounter >= 10) {
        uiSyncCounter = 0;
        setUiScore(s.score);
        setUiStage(s.stage);
        setUiHigh(highRef.current);
      }

      // DRAW
      ctx.clearRect(0, 0, W, H);
      drawBg(ctx, s);

      // Slowmo overlay
      if (s.activePowerup?.type === 'slow') {
        ctx.save(); ctx.fillStyle = 'rgba(153,69,255,0.08)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      }

      drawParticles(ctx, s.particles);
      s.powerups.forEach(p => drawPowerup(ctx, p, s.tick));
      s.tokens.forEach(t => drawToken(ctx, t, s.tick));
      s.obstacles.forEach(o => drawObstacle(ctx, o, s.tick));

      const theme = getTheme(s.stage);
      drawRunner(ctx, s.runner, s.tick, theme.acc, s.activePowerup?.type || null);
      drawFloats(ctx, s.floats);
      drawHUD(ctx, s, theme);

      // Damage flash
      if (s._flash) {
        ctx.save(); ctx.fillStyle = 'rgba(255,0,122,0.35)'; ctx.fillRect(0, 0, W, H); ctx.restore();
        s._flash = 0;
      }
      // Stage clear flash
      if (s._flashWhite > 0) {
        ctx.save(); ctx.fillStyle = `rgba(255,255,255,${0.5*s._flashWhite/3})`;
        ctx.fillRect(0, 0, W, H); ctx.restore();
        s._flashWhite--;
      }

      // Stage clear overlay text
      if (s.stageClear) {
        ctx.save();
        ctx.fillStyle = 'rgba(11,9,20,0.5)';
        ctx.fillRect(0, H/2 - 40, W, 80);
        ctx.fillStyle = getTheme(s.stage-1).acc;
        ctx.shadowColor = getTheme(s.stage-1).acc;
        ctx.shadowBlur = 24;
        ctx.font = 'bold 22px "Orbitron",monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${s.stageJustCleared} CLEAR!`, W/2, H/2);
        ctx.font = '12px "JetBrains Mono",monospace';
        ctx.fillText(`+${1000*s.stageJustCleared} BONUS`, W/2, H/2 + 22);
        ctx.restore();
      }

      // Game over
      if (s.phase === 'gameover') {
        cancelAnimationFrame(rafRef.current);
        s.particles.push(...makeParticles(W/2, H/2, COLORS.magenta, 30, 6));
        setUiScore(s.score); setUiStage(s.stage); setUiHigh(highRef.current);
        setPhase('gameover');
        onGameOver?.(s.score);
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [doJump, doDuck, spawnObstacle, spawnToken, spawnPowerup, onGameOver]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stateRef.current = initState();
    setUiScore(0); setUiStage(1);
    setSubmitted(false); setFormError('');
    setPhase('playing');
    setTimeout(() => loop(), 0);
  }, [initState, loop]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Keyboard
  useEffect(() => {
    const dn = e => {
      keysRef.current[e.key] = true;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    const up = e => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Touch
  const onTS = e => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const onTE = e => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    if (dy < -30 && Math.abs(dy) > Math.abs(dx)) {
      doJump(stateRef.current);
    } else if (dy > 30 && Math.abs(dy) > Math.abs(dx)) {
      doDuck(stateRef.current, true);
      setTimeout(() => doDuck(stateRef.current, false), 400);
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 250) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const relX = (e.changedTouches[0].clientX - rect.left) / rect.width;
      if (relX > 0.5) {
        doJump(stateRef.current);
      } else {
        doDuck(stateRef.current, true);
        setTimeout(() => doDuck(stateRef.current, false), 400);
      }
    }
    touchRef.current = null;
  };

  const handleLeadSubmit = async e => {
    e.preventDefault(); setFormError('');
    if (!leadForm.nickname.trim() || leadForm.nickname.trim().length < 2) return setFormError('Nickname is required.');
    if (!leadForm.email.trim()) return setFormError('Email is required.');
    if (!leadForm.phone.trim() || leadForm.phone.replace(/\D/g,'').length < 8) return setFormError('Phone is required.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/arcade/lead', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ...leadForm, score: uiScore, game: 'hub3runner',
          stage: uiStage, distance: Math.floor(stateRef.current?.distance || 0), platform: 'web',
        }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Failed.'); }
      else setSubmitted(true);
    } catch { setFormError('Network error.'); }
    finally { setSubmitting(false); }
  };

  const qualified = uiScore >= QUALIFY_SCORE;
  const theme = getTheme(uiStage);

  // D-pad handlers (hold for duck; tap for jump)
  const dpad = (which, on) => {
    if (which === 'jump') {
      dpadRef.current.jump = on;
      if (on) setTimeout(() => { dpadRef.current.jump = false; }, 100);
    } else if (which === 'duck') {
      dpadRef.current.duck = on;
    }
  };

  return (
    <div style={{
      position:'relative', width:'100%', maxWidth: W, margin:'0 auto',
      borderRadius:12, overflow:'hidden',
      border:`1.5px solid ${COLORS.ultraviolet}`,
      boxShadow:`0 0 40px rgba(79,20,135,0.55),0 0 80px rgba(79,20,135,0.2)`,
      background: COLORS.bg, fontFamily:'"JetBrains Mono",monospace', userSelect:'none',
    }} data-testid="hub3runner-container">

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px', borderBottom:`1px solid rgba(79,20,135,0.4)`,
        background:'rgba(11,9,20,0.7)',
      }}>
        <div>
          <GlowText color={COLORS.acidGreen} size={14} style={{letterSpacing:4, textAlign:'left'}}>HUB3RUNNER</GlowText>
          <p style={{margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44`, fontFamily:'"Orbitron",monospace'}}>
            WEB3 ENDLESS RUNNER
          </p>
        </div>
        <div style={{display:'flex', gap:20}}>
          <div style={{textAlign:'center'}}>
            <p style={{margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44`}}>SCORE</p>
            <GlowText color={COLORS.acidGreen} size={16}>{String(uiScore).padStart(6,'0')}</GlowText>
          </div>
          <div style={{textAlign:'center'}}>
            <p style={{margin:0, fontSize:9, letterSpacing:2, color:`${COLORS.white}44`}}>BEST</p>
            <GlowText color={COLORS.cyan} size={16}>{String(uiHigh).padStart(6,'0')}</GlowText>
          </div>
        </div>
      </div>

      {/* Canvas + Overlays */}
      <div style={{position:'relative', lineHeight:0}}>
        <canvas ref={canvasRef} width={W} height={H}
          style={{display:'block', width:'100%', height:'auto', touchAction:'none'}}
          onTouchStart={onTS} onTouchEnd={onTE}
        />

        {phase === 'idle' && (
          <Overlay>
            <GlowText color={COLORS.acidGreen} size={24}>HUB3RUNNER</GlowText>
            <GlowText color={COLORS.cyan} size={11} style={{marginTop:4}}>WEB3 ENDLESS RUNNER · 10 STAGES</GlowText>
            <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, maxWidth:400}}>
              {[
                {k:'TAP DIR / \u2191', d:'Pular'},
                {k:'TAP 2x',           d:'Pulo duplo'},
                {k:'TAP ESQ / \u2193', d:'Agachar'},
                {k:'SWIPE \u2191',     d:'Pular'},
                {k:'10 STAGES',        d:'Longa jornada'},
                {k:'COMBO \u00D73',    d:'Multiplica pts'},
              ].map(({k,d}) => (
                <div key={k} style={{background:'rgba(79,20,135,0.12)', border:'1px solid rgba(79,20,135,0.35)', borderRadius:6, padding:'6px 8px'}}>
                  <p style={{margin:0, fontSize:9, color:COLORS.acidGreen, fontFamily:'"Orbitron",monospace', letterSpacing:1}}>{k}</p>
                  <p style={{margin:'2px 0 0', fontSize:9, color:`${COLORS.white}77`}}>{d}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:10, display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap'}}>
              {TOKENS.map(t => (
                <div key={t.id} style={{display:'flex', alignItems:'center', gap:4, fontSize:11}}>
                  <span style={{color:t.color, textShadow:`0 0 6px ${t.color}`, fontSize:14}}>{t.symbol}</span>
                  <span style={{color:`${COLORS.white}88`, fontFamily:'"JetBrains Mono",monospace'}}>{t.pts}</span>
                </div>
              ))}
            </div>
            {uiHigh > 0 && <GlowText color={COLORS.cyan} size={11} style={{marginTop:6}}>BEST: {String(uiHigh).padStart(6,'0')}</GlowText>}
            <NeonBtn onClick={startGame} testId="hub3runner-start">START RUNNING</NeonBtn>
          </Overlay>
        )}

        {phase === 'gameover' && (
          <Overlay>
            <GlowText color={COLORS.magenta} size={26}>LIQUIDATED</GlowText>
            <GlowText color={`${COLORS.white}55`} size={11} style={{marginTop:4}}>
              STAGE {uiStage} · {Math.floor(stateRef.current?.distance || 0)}m
            </GlowText>
            <GlowText color={theme.acc} size={22} style={{marginTop:8}}>{String(uiScore).padStart(6,'0')} PTS</GlowText>
            {uiScore >= uiHigh && uiHigh > 0 && (
              <GlowText color={COLORS.acidGreen} size={12} style={{marginTop:2, animation:'pulse 1s infinite'}}>
                \u2605 NEW BEST!
              </GlowText>
            )}
            {qualified && !submitted && (
              <>
                <div style={{margin:'10px 0 4px', padding:'6px 14px', background:'rgba(204,255,0,0.06)', border:`1px solid ${COLORS.acidGreen}44`, borderRadius:8}}>
                  <GlowText color={COLORS.acidGreen} size={10}>LEADERBOARD QUALIFICADO</GlowText>
                </div>
                <form onSubmit={handleLeadSubmit} style={{display:'flex', flexDirection:'column', gap:7, width:'100%', maxWidth:280}}>
                  <NeonInput placeholder="NICKNAME / RUNNER TAG" value={leadForm.nickname} onChange={v => setLeadForm(f => ({...f, nickname:v}))}/>
                  <NeonInput placeholder="EMAIL" type="email" value={leadForm.email} onChange={v => setLeadForm(f => ({...f, email:v}))}/>
                  <NeonInput placeholder="PHONE (+55...)" value={leadForm.phone} onChange={v => setLeadForm(f => ({...f, phone:v}))}/>
                  {formError && <span style={{color:COLORS.magenta, fontSize:11, textAlign:'center'}}>{formError}</span>}
                  <NeonBtn type="submit" disabled={submitting} color={COLORS.acidGreen} testId="hub3runner-submit">
                    {submitting ? 'TRANSMITTING...' : 'SUBMIT SCORE'}
                  </NeonBtn>
                </form>
                <button onClick={startGame} style={{marginTop:4, background:'none', border:'none', color:`${COLORS.white}44`, fontSize:11, cursor:'pointer', letterSpacing:1, fontFamily:'"JetBrains Mono",monospace'}}>
                  skip → play again
                </button>
              </>
            )}
            {qualified && submitted && (
              <>
                <GlowText color={COLORS.acidGreen} size={13} style={{marginTop:8}}>Score registrado no ledger!</GlowText>
                <NeonBtn onClick={startGame}>RUN AGAIN</NeonBtn>
              </>
            )}
            {!qualified && (
              <>
                <GlowText color={`${COLORS.white}44`} size={10} style={{marginTop:6}}>{QUALIFY_SCORE}+ pts para entrar no leaderboard</GlowText>
                <NeonBtn onClick={startGame} testId="hub3runner-retry">TRY AGAIN</NeonBtn>
              </>
            )}
          </Overlay>
        )}
      </div>

      {/* D-pad */}
      <div style={{
        borderTop:`1px solid rgba(79,20,135,0.3)`,
        padding:'10px 16px',
        display:'flex', justifyContent:'center', gap:14,
        background:'rgba(11,9,20,0.6)',
      }}>
        {[
          { icon:'\u25C0', label:'\u2014', which:null },
          { icon:'\u25B2', label:'JUMP', which:'jump' },
          { icon:'\u25BC', label:'DUCK', which:'duck' },
          { icon:'\u25B6', label:'\u2014', which:null },
        ].map(({ icon, label, which }, i) => (
          <button key={i}
            onPointerDown={() => which && dpad(which, true)}
            onPointerUp={() => which && dpad(which, false)}
            onPointerLeave={() => which && dpad(which, false)}
            style={{
              width:44, height:44, borderRadius:8,
              border:`1px solid ${COLORS.ultraviolet}`,
              background:'rgba(79,20,135,0.1)',
              color: which ? COLORS.acidGreen : `${COLORS.white}33`,
              fontFamily:'"Orbitron",monospace', fontSize:14,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              cursor: which ? 'pointer' : 'default', padding:0,
              touchAction:'manipulation', userSelect:'none',
            }}>
            <span style={{textShadow: which ? `0 0 8px ${COLORS.acidGreen}` : 'none', lineHeight:1}}>{icon}</span>
            <span style={{fontSize:7, marginTop:2, opacity:0.6}}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

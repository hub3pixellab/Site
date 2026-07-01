// /components/games/Hub3duro.js
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const COLORS = {
  bg:          '#0b0914',
  ultraviolet: '#4F1487',
  acidGreen:   '#CCFF00',
  cyan:        '#00F0FF',
  magenta:     '#FF007A',
  white:       '#f5f5ff',
};

const W = 480;
const H = 560;
const QUALIFY_SCORE = 500;
const LIVES_START   = 3;

const CARS_PER_DAY = [10, 18, 28, 40, 54, 70, 88, 108, 130, 155, 182, 210];

const DAY_PHASES = [
  { name:'DAWN',      dur:1000, sky:['#1a0a2e','#4F1487'], road:'#2a1a4a', line:'#CCFF00', fog:0    },
  { name:'MORNING',   dur:1400, sky:['#0d0520','#1a0a35'], road:'#1e0e38', line:'#CCFF00', fog:0    },
  { name:'DAY',       dur:2200, sky:['#0b0914','#1a0530'], road:'#1a0a2e', line:'#CCFF00', fog:0    },
  { name:'AFTERNOON', dur:1600, sky:['#120820','#2a0535'], road:'#180930', line:'#CCFF00', fog:0    },
  { name:'DUSK',      dur:1000, sky:['#2d0a1a','#FF007A'], road:'#1a0520', line:'#FF007A', fog:0    },
  { name:'TWILIGHT',  dur:800,  sky:['#150820','#2a0a3a'], road:'#120820', line:'#9945FF', fog:0.18 },
  { name:'NIGHT',     dur:1800, sky:['#050308','#0b0914'], road:'#0a0520', line:'#00F0FF', fog:0.38 },
  { name:'MIDNIGHT',  dur:1400, sky:['#030205','#070510'], road:'#060318', line:'#4F1487', fog:0.55 },
  { name:'SNOW',      dur:1200, sky:['#0a0820','#1a1535'], road:'#1a1840', line:'#f5f5ff', fog:0.22 },
  { name:'BLIZZARD',  dur:900,  sky:['#0a0820','#0f1030'], road:'#12103a', line:'#4F1487', fog:0.68 },
];

const CAR_COLORS = [
  '#FF007A','#00F0FF','#9945FF','#F7931A',
  '#CCFF00','#FF99CC','#44FFAA','#FF6644',
];

function rnd(n)         { return Math.floor(Math.random() * n); }
function rndR(a, b)     { return a + Math.random() * (b - a); }
function lerp(a, b, t)  { return a + (b - a) * t; }

function makeParts(x, y, color, n=12, sp=4) {
  return Array.from({length:n}, () => {
    const a = Math.random()*Math.PI*2, s = rndR(0.5,sp);
    return {x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:rndR(1.5,4),life:rndR(20,45),maxLife:45,color};
  });
}

function rRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function shade(hex, amt) {
  const n=parseInt(hex.replace('#',''),16);
  const r=Math.max(0,Math.min(255,(n>>16)+amt));
  const g=Math.max(0,Math.min(255,((n>>8)&0xff)+amt));
  const b=Math.max(0,Math.min(255,(n&0xff)+amt));
  return `rgb(${r},${g},${b})`;
}

function getPhase(timer) {
  const total = DAY_PHASES.reduce((a,p)=>a+p.dur,0);
  let t = timer % total;
  for (const ph of DAY_PHASES) { if (t<ph.dur) return ph; t-=ph.dur; }
  return DAY_PHASES[DAY_PHASES.length-1];
}

function roadXY(laneT, depthT, camX) {
  const horizon = H*0.52;
  const y    = lerp(horizon, H-20, depthT);
  const halfW = lerp(W*0.35, W*0.5, depthT);
  const cx   = W/2 + camX*(1-depthT)*60;
  return { x: cx+laneT*halfW, y, scale: lerp(0.12,1,depthT) };
}

function drawSky(ctx, ph, tick) {
  const g = ctx.createLinearGradient(0,0,0,H*0.52);
  g.addColorStop(0,ph.sky[0]); g.addColorStop(1,ph.sky[1]);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H*0.52);

  if (!['DAY','MORNING','AFTERNOON','SNOW'].includes(ph.name)) {
    ctx.save();
    for (let i=0;i<55;i++) {
      const sx=(i*137+tick*0.01)%W, sy=(i*97)%(H*0.45);
      ctx.globalAlpha=(0.25+0.65*Math.abs(Math.sin(tick*0.008+i)))*(1-ph.fog);
      ctx.fillStyle='#f5f5ff';
      ctx.fillRect(sx,sy,i%5===0?2:1.5,i%5===0?2:1.5);
    }
    ctx.restore();
  }

  if (ph.name==='SNOW'||ph.name==='BLIZZARD') {
    ctx.save();
    const cnt=ph.name==='BLIZZARD'?90:40;
    for (let i=0;i<cnt;i++) {
      const sx=((i*173+tick*(ph.name==='BLIZZARD'?4:2))%W);
      const sy=((i*83+tick*(0.9+i*0.02))%H);
      ctx.globalAlpha=0.3+0.45*Math.sin(i+tick*0.02);
      ctx.fillStyle='#ffffff';
      ctx.beginPath(); ctx.arc(sx,sy,rndR(0.5,2.2),0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  if (['DAY','DAWN','MORNING','AFTERNOON','DUSK'].includes(ph.name)) {
    const c=ph.name==='DUSK'?'#FF6B35':ph.name==='DAWN'?'#CC88FF':COLORS.acidGreen;
    ctx.save();
    ctx.shadowColor=c; ctx.shadowBlur=32; ctx.fillStyle=c; ctx.globalAlpha=0.85;
    ctx.beginPath(); ctx.arc(W*0.72,H*0.16,20,0,Math.PI*2); ctx.fill();
    if (ph.name==='DAY'||ph.name==='MORNING') {
      ctx.globalAlpha=0.12; ctx.shadowBlur=0; ctx.fillStyle=COLORS.acidGreen;
      ctx.beginPath(); ctx.arc(W*0.72,H*0.16,40,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  if (['NIGHT','MIDNIGHT','TWILIGHT'].includes(ph.name)) {
    ctx.save();
    ctx.shadowColor='#aaaacc'; ctx.shadowBlur=18;
    ctx.fillStyle='#ccccee'; ctx.globalAlpha=0.75;
    ctx.beginPath(); ctx.arc(W*0.72,H*0.13,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=ph.sky[0]; ctx.shadowBlur=0;
    ctx.beginPath(); ctx.arc(W*0.72+7,H*0.13,10,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle=shade(ph.sky[1],-10); ctx.globalAlpha=0.4;
  ctx.beginPath(); ctx.moveTo(0,H*0.52);
  const pts=[0,0.08,0.15,0.22,0.32,0.42,0.52,0.62,0.72,0.82,0.92,1];
  const hs =[0.52,0.44,0.48,0.40,0.46,0.42,0.45,0.41,0.47,0.43,0.50,0.52];
  pts.forEach((px,i)=>ctx.lineTo(px*W,hs[i]*H));
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawRoad(ctx, ph, camX, tick) {
  const horizon=H*0.52;
  const g=ctx.createLinearGradient(0,horizon,0,H);
  g.addColorStop(0,ph.road); g.addColorStop(1,shade(ph.road,-20));
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(W*0.15,horizon); ctx.lineTo(W*0.85,horizon);
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();

  if (ph.fog>0) {
    const fg=ctx.createLinearGradient(0,horizon,0,horizon+H*0.32);
    fg.addColorStop(0,`rgba(15,10,40,${ph.fog})`); fg.addColorStop(1,'transparent');
    ctx.fillStyle=fg; ctx.fillRect(0,horizon,W,H*0.38);
  }

  ctx.save();
  ctx.strokeStyle=ph.line; ctx.shadowColor=ph.line; ctx.shadowBlur=8; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(W*0.15,horizon); ctx.lineTo(0,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W*0.85,horizon); ctx.lineTo(W,H); ctx.stroke();
  ctx.restore();

  const lanes=[-0.6,-0.3,0,0.3,0.6];
  ctx.save();
  lanes.forEach(lane=>{
    for (let i=0;i<14;i++) {
      const t1=i/14, t2=(i+0.48)/14;
      const p1=roadXY(lane,t1,camX), p2=roadXY(lane,t2,camX);
      const scroll=((tick*2.8)%(H/14))*t1;
      ctx.strokeStyle=lane===0?ph.line:`${ph.line}55`;
      ctx.shadowColor=ph.line; ctx.shadowBlur=4;
      ctx.lineWidth=lerp(0.4,2.2,t1);
      ctx.globalAlpha=lane===0?0.9:0.35;
      ctx.beginPath();
      ctx.moveTo(p1.x,p1.y-scroll);
      ctx.lineTo(p2.x,Math.min(p2.y-scroll,H));
      ctx.stroke();
    }
  });
  ctx.globalAlpha=1; ctx.restore();

  ctx.save();
  ctx.fillStyle=shade(ph.road,-28);
  ctx.fillRect(0,horizon,W*0.14,H-horizon);
  ctx.fillRect(W*0.86,horizon,W*0.14,H-horizon);
  ctx.strokeStyle=`${ph.line}55`; ctx.lineWidth=1.5;
  for (let i=0;i<10;i++) {
    const t=i/10, scroll=((tick*2.2)%(H/10))*t;
    const lp=roadXY(-1,t,camX), rp=roadXY(1,t,camX);
    ctx.lineWidth=lerp(0.3,1.5,t);
    ctx.beginPath(); ctx.moveTo(lp.x-10,lp.y-scroll); ctx.lineTo(lp.x-2,lp.y-scroll); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rp.x+2,rp.y-scroll);  ctx.lineTo(rp.x+10,rp.y-scroll); ctx.stroke();
  }
  ctx.restore();
}

function drawOpp(ctx, car, ph, tick) {
  const {x,y,scale}=roadXY(car.laneT,car.depthT,car.camX||0);
  const cw=38*scale, ch=22*scale;
  ctx.save(); ctx.translate(x,y);
  if (['NIGHT','MIDNIGHT','TWILIGHT','BLIZZARD'].includes(ph.name)) {
    const lg=ctx.createRadialGradient(0,-ch,0,0,ch*3,cw*3.5);
    lg.addColorStop(0,'rgba(255,255,200,0.26)'); lg.addColorStop(1,'transparent');
    ctx.fillStyle=lg; ctx.fillRect(-cw*3,-ch,cw*6,ch*5);
  }
  ctx.shadowColor=car.color; ctx.shadowBlur=10*scale; ctx.fillStyle=car.color;
  rRect(ctx,-cw/2,-ch/2,cw,ch,3*scale); ctx.fill();
  ctx.fillStyle='rgba(0,240,255,0.28)'; ctx.shadowBlur=0;
  rRect(ctx,-cw*0.28,-ch*0.38,cw*0.56,ch*0.42,2*scale); ctx.fill();
  ctx.fillStyle=shade(car.color,-42);
  rRect(ctx,-cw*0.22,-ch*0.7,cw*0.44,ch*0.38,2*scale); ctx.fill();
  ctx.fillStyle='#111';
  [-1,1].forEach(s2=>[-1,1].forEach(f=>{
    ctx.beginPath(); ctx.ellipse(s2*cw*0.42,f*ch*0.46,cw*0.09,ch*0.13,0,0,Math.PI*2); ctx.fill();
  }));
  ctx.fillStyle='#FF2200'; ctx.shadowColor='#FF2200'; ctx.shadowBlur=8*scale;
  ctx.fillRect(-cw*0.45,ch*0.28,cw*0.18,ch*0.15);
  ctx.fillRect(cw*0.27,ch*0.28,cw*0.18,ch*0.15);
  ctx.restore();
}

function drawPlayer(ctx, playerX, crashed, invincible, tick) {
  if (crashed) return;
  if (invincible>0&&Math.floor(tick/5)%2===0) return;
  const cx=W/2+playerX, cy=H-62, cw=44, ch=26;
  ctx.save(); ctx.translate(cx,cy);
  ctx.shadowColor=COLORS.acidGreen; ctx.shadowBlur=30;
  ctx.fillStyle='rgba(204,255,0,0.1)';
  ctx.fillRect(-cw*0.65,ch*0.28,cw*1.3,ch*0.5);
  ctx.strokeStyle='rgba(204,255,0,0.18)'; ctx.lineWidth=1; ctx.shadowBlur=0;
  [-20,-12,-4,4,12,20].forEach(lx=>{
    ctx.beginPath();
    ctx.moveTo(lx,ch*0.55); ctx.lineTo(lx,ch*0.55+14+Math.sin(tick*0.28+lx)*4); ctx.stroke();
  });
  ctx.shadowColor=COLORS.acidGreen; ctx.shadowBlur=18; ctx.fillStyle=COLORS.acidGreen;
  rRect(ctx,-cw/2,-ch/2,cw,ch,4); ctx.fill();
  ctx.fillStyle=shade(COLORS.acidGreen,-60); ctx.shadowBlur=0;
  rRect(ctx,-cw*0.26,-ch*0.75,cw*0.52,ch*0.42,3); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.65)';
  rRect(ctx,-cw*0.22,-ch*0.72,cw*0.44,ch*0.38,3); ctx.fill();
  ctx.fillStyle='rgba(0,240,255,0.38)';
  ctx.fillRect(-cw*0.18,-ch*0.68,cw*0.36,ch*0.1);
  ctx.fillStyle='#1a1a1a';
  [-1,1].forEach(s2=>[-1,1].forEach(f=>{
    ctx.beginPath();
    ctx.ellipse(s2*cw*0.44,f*ch*0.5,cw*0.1,ch*0.14,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=COLORS.acidGreen; ctx.lineWidth=1;
    ctx.shadowColor=COLORS.acidGreen; ctx.shadowBlur=4; ctx.stroke();
  }));
  ctx.fillStyle='#ffffcc'; ctx.shadowColor='#ffffcc'; ctx.shadowBlur=16;
  ctx.fillRect(-cw*0.46,-ch*0.44,cw*0.16,ch*0.18);
  ctx.fillRect(cw*0.30,-ch*0.44,cw*0.16,ch*0.18);
  ctx.restore();
}

function drawParts(ctx, parts) {
  parts.forEach(p=>{
    const a=p.life/p.maxLife; ctx.save(); ctx.globalAlpha=a;
    ctx.shadowColor=p.color; ctx.shadowBlur=8; ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r*a,0,Math.PI*2); ctx.fill(); ctx.restore();
  });
}

function drawFloats(ctx, floats) {
  floats.forEach(f=>{
    const a=f.life/f.maxLife; ctx.save(); ctx.globalAlpha=a;
    ctx.fillStyle=f.color||COLORS.acidGreen;
    ctx.shadowColor=f.color||COLORS.acidGreen; ctx.shadowBlur=10;
    ctx.font='bold 13px "Orbitron",monospace'; ctx.textAlign='center';
    ctx.fillText(`+${f.pts}`,f.x,f.y); ctx.restore();
  });
}

function drawHUD(ctx, s, ph) {
  ctx.save();
  ctx.font='11px "JetBrains Mono",monospace';
  ctx.fillStyle=COLORS.acidGreen; ctx.shadowColor=COLORS.acidGreen; ctx.shadowBlur=8;
  ctx.fillText(`SCORE  ${String(s.score).padStart(6,'0')}`,10,20);
  ctx.fillText(`DAY    ${s.day}`,10,36);
  ctx.fillStyle=COLORS.cyan; ctx.shadowColor=COLORS.cyan;
  ctx.fillText(`PASS   ${s.carsPassed}/${s.carsTarget}`,10,52);
  ctx.fillStyle=COLORS.magenta; ctx.shadowColor=COLORS.magenta;
  ctx.textAlign='right';
  ctx.fillText('▲'.repeat(Math.max(0,s.lives)),W-10,20);
  ctx.fillText(`BEST ${String(s.high||0).padStart(6,'0')}`,W-10,36);
  ctx.textAlign='center';
  ctx.fillStyle=`${ph.line}cc`; ctx.shadowColor=ph.line; ctx.shadowBlur=12;
  ctx.font='10px "Orbitron",monospace';
  ctx.fillText(ph.name,W/2,20);
  const pct=Math.min(1,s.carsPassed/s.carsTarget);
  ctx.fillStyle='rgba(79,20,135,0.4)'; ctx.fillRect(10,H-22,W-20,7);
  ctx.fillStyle=COLORS.acidGreen; ctx.shadowColor=COLORS.acidGreen; ctx.shadowBlur=8;
  ctx.fillRect(10,H-22,(W-20)*pct,7);
  ctx.fillStyle=`${COLORS.acidGreen}88`; ctx.font='8px monospace';
  ctx.textAlign='right'; ctx.fillText(`${Math.floor(pct*100)}%`,W-12,H-26);
  const spd=Math.min(1,(s.playerSpeed-1.5)/9);
  ctx.fillStyle='rgba(79,20,135,0.3)'; ctx.fillRect(W-22,44,8,78);
  ctx.fillStyle=COLORS.magenta; ctx.shadowColor=COLORS.magenta;
  ctx.fillRect(W-22,44+(78*(1-spd)),8,78*spd);
  ctx.fillStyle=`${COLORS.magenta}88`; ctx.font='7px monospace';
  ctx.textAlign='center'; ctx.fillText('SPD',W-18,132);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle=COLORS.ultraviolet; ctx.shadowColor=COLORS.ultraviolet;
  ctx.shadowBlur=14; ctx.lineWidth=1.5;
  ctx.strokeRect(0.75,0.75,W-1.5,H-1.5); ctx.restore();
}

function GlowText({children,color,size=16,style={}}) {
  return (
    <p style={{
      margin:0,color,fontSize:size,
      fontFamily:'"Orbitron","JetBrains Mono",monospace',
      letterSpacing:2,textShadow:`0 0 10px ${color},0 0 24px ${color}55`,
      textAlign:'center',lineHeight:1.4,...style,
    }}>{children}</p>
  );
}
function Overlay({children}) {
  return (
    <div style={{
      position:'absolute',inset:0,zIndex:10,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',background:'rgba(11,9,20,0.92)',
      backdropFilter:'blur(4px)',padding:24,gap:8,
    }}>{children}</div>
  );
}
function NeonBtn({children,onClick,color=COLORS.acidGreen,disabled,type='button',style={},...rest}) {
  const [h,setH]=useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled} {...rest}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        marginTop:12,padding:'10px 32px',
        background:h?`${color}18`:'transparent',
        border:`1.5px solid ${color}`,borderRadius:6,color,fontSize:13,
        fontFamily:'"Orbitron",monospace',letterSpacing:3,
        cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,
        boxShadow:h?`0 0 18px ${color}55`:`0 0 8px ${color}33`,
        transition:'all 0.18s',...style,
      }}>{children}</button>
  );
}
function NeonInput({placeholder,value,onChange,type='text'}) {
  return (
    <input type={type} placeholder={placeholder} value={value}
      onChange={e=>onChange(e.target.value)}
      style={{
        background:'rgba(255,255,255,0.04)',border:`1px solid ${COLORS.ultraviolet}`,
        borderRadius:5,padding:'8px 14px',color:COLORS.white,fontSize:12,
        fontFamily:'"JetBrains Mono",monospace',letterSpacing:1,outline:'none',
        width:'100%',boxSizing:'border-box',
      }}
      onFocus={e=>{e.target.style.borderColor=COLORS.acidGreen;}}
      onBlur={e=>{e.target.style.borderColor=COLORS.ultraviolet;}}
    />
  );
}

export default function Hub3duro({onGameOver}) {
  const canvasRef=useRef(null);
  const stateRef =useRef(null);
  const rafRef   =useRef(null);
  const keysRef  =useRef({});
  const highRef  =useRef(0);

  const [phase,   setPhase]  =useState('idle');
  const [uiScore, setUiScore]=useState(0);
  const [uiHigh,  setUiHigh] =useState(0);
  const [uiDay,   setUiDay]  =useState(1);
  const [lead,    setLead]   =useState({nickname:'',email:'',phone:''});
  const [submitted,  setSubmitted] =useState(false);
  const [submitting, setSubmitting]=useState(false);
  const [formErr,    setFormErr]   =useState('');

  const init=useCallback((day=1,score=0,lives=LIVES_START)=>{
    const target=CARS_PER_DAY[Math.min(day-1,CARS_PER_DAY.length-1)];
    return {
      tick:0,score,lives,day,carsPassed:0,carsTarget:target,
      playerX:0,playerSpeed:Math.min(10,2.5+day*0.55),
      camX:0,phaseTimer:0,opponents:[],spawnTimer:80,
      particles:[],floats:[],invincible:90,
      crashed:false,crashTimer:0,phase:'playing',
      _next:false,high:highRef.current,
    };
  },[]);

  const loop=useCallback(()=>{
    const canvas=canvasRef.current;
    const ctx=canvas.getContext('2d');
    const frame=()=>{
      const s=stateRef.current;
      if (!s) return;
      rafRef.current=requestAnimationFrame(frame);
      s.tick++; s.phaseTimer++;
      const ph=getPhase(s.phaseTimer);

      const L=keysRef.current['ArrowLeft'] ||keysRef.current['a'];
      const R=keysRef.current['ArrowRight']||keysRef.current['d'];
      const U=keysRef.current['ArrowUp']   ||keysRef.current['w'];
      const D=keysRef.current['ArrowDown'] ||keysRef.current['s'];

      if (!s.crashed&&s.phase==='playing') {
        if (L) s.playerX=Math.max(-0.88,s.playerX-0.044);
        if (R) s.playerX=Math.min( 0.88,s.playerX+0.044);
        s.playerX+=(0-s.playerX)*0.007;
        s.camX+=(s.playerX-s.camX)*0.07;
        if (U) s.playerSpeed=Math.min(10,s.playerSpeed+0.05);
        if (D) s.playerSpeed=Math.max(1.5,s.playerSpeed-0.07);
        s.playerSpeed+=(2.5+s.day*0.5-s.playerSpeed)*0.002;
      }

      if (s.crashed) {
        s.crashTimer--;
        if (s.crashTimer<=0) {
          s.crashed=false; s.invincible=110;
          s.playerX=0; s.camX=0;
          s.playerSpeed=Math.max(1.5,s.playerSpeed-1.2);
        }
      } else if (s.invincible>0) s.invincible--;

      s.spawnTimer--;
      if (s.spawnTimer<=0&&s.phase==='playing') {
        const lanes=[-0.65,-0.32,-0.02,0.32,0.65];
        const multi=Math.random()<0.22?2:1;
        for (let i=0;i<multi;i++) {
          s.opponents.push({
            laneT:lanes[rnd(lanes.length)],
            depthT:0.04+Math.random()*0.1,
            speed:0.005+Math.random()*0.004+s.day*0.0007,
            color:CAR_COLORS[rnd(CAR_COLORS.length)],
            passed:false,
          });
        }
        s.spawnTimer=Math.max(16,85-s.day*5);
      }

      s.opponents.forEach(o=>{
        o.depthT+=o.speed*(s.playerSpeed/2.8);
        if (o.depthT>0.86&&!o.passed) {
          o.passed=true; s.carsPassed++;
          const pts=10*s.day; s.score+=pts;
          s.floats.push({x:W/2,y:H-105,pts,life:35,maxLife:35,color:COLORS.acidGreen});
        }
      });
      s.opponents=s.opponents.filter(o=>o.depthT<1.05);

      if (!s.crashed&&s.invincible<=0&&s.phase==='playing') {
        const pp=roadXY(s.playerX,0.92,s.camX);
        for (const o of s.opponents) {
          if (o.depthT>0.79&&o.depthT<0.97) {
            const op=roadXY(o.laneT,o.depthT,s.camX);
            if (Math.abs(op.x-pp.x)<26) {
              s.crashed=true; s.crashTimer=95; s.lives--;
              s.particles.push(...makeParts(pp.x,pp.y,COLORS.magenta,30,6));
              s.particles.push(...makeParts(op.x,op.y,o.color,18,4));
              if (s.lives<=0) s.phase='gameover';
              break;
            }
          }
        }
      }

      if (s.carsPassed>=s.carsTarget&&s.phase==='playing') s.phase='dayclear';

      if (s.score>highRef.current){highRef.current=s.score;setUiHigh(s.score);}
      setUiScore(s.score); setUiDay(s.day);

      s.particles=s.particles
        .map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,life:p.life-1,vx:p.vx*0.9,vy:p.vy*0.9}))
        .filter(p=>p.life>0);
      s.floats=s.floats.map(f=>({...f,y:f.y-0.9,life:f.life-1})).filter(f=>f.life>0);

      drawSky(ctx,ph,s.tick);
      drawRoad(ctx,ph,s.camX,s.tick);
      const sorted=[...s.opponents].sort((a,b)=>a.depthT-b.depthT);
      sorted.forEach(o=>drawOpp(ctx,{...o,camX:s.camX},ph,s.tick));
      if (s.crashed) {
        ctx.save();
        ctx.fillStyle=`rgba(255,0,122,${0.38*(s.crashTimer/95)})`;
        ctx.fillRect(0,0,W,H); ctx.restore();
      } else drawPlayer(ctx,s.playerX*W*0.36,s.crashed,s.invincible,s.tick);
      drawParts(ctx,s.particles);
      drawFloats(ctx,s.floats);
      drawHUD(ctx,s,ph);

      if (s.phase==='dayclear'&&!s._next) {
        s._next=true;
        ctx.save();
        ctx.fillStyle='rgba(11,9,20,0.78)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle=COLORS.acidGreen; ctx.shadowColor=COLORS.acidGreen;
        ctx.shadowBlur=24; ctx.font='bold 22px "Orbitron",monospace'; ctx.textAlign='center';
        ctx.fillText(`DAY ${s.day} COMPLETE!`,W/2,H/2-20);
        ctx.fillStyle=COLORS.cyan; ctx.shadowColor=COLORS.cyan;
        ctx.font='12px "JetBrains Mono",monospace';
        ctx.fillText(`${s.carsPassed} CARS  •  +${s.day*500} BONUS`,W/2,H/2+12);
        ctx.fillStyle=`${COLORS.white}55`; ctx.font='10px "JetBrains Mono",monospace';
        ctx.fillText(`BEST: ${String(highRef.current).padStart(6,'0')}`,W/2,H/2+32);
        ctx.restore();
        setTimeout(()=>{
          const bonus=s.day*500;
          stateRef.current=init(s.day+1,s.score+bonus,s.lives);
        },3000);
      }

      if (s.phase==='gameover') {
        cancelAnimationFrame(rafRef.current);
        setPhase('gameover'); onGameOver?.(s.score);
      }
    };
    rafRef.current=requestAnimationFrame(frame);
  },[init,onGameOver]);

  const start=useCallback(()=>{
    cancelAnimationFrame(rafRef.current);
    stateRef.current=init(1,0,LIVES_START);
    setUiScore(0); setUiDay(1);
    setSubmitted(false); setFormErr('');
    setPhase('playing');
    setTimeout(()=>loop(),0);
  },[init,loop]);

  useEffect(()=>()=>cancelAnimationFrame(rafRef.current),[]);

  useEffect(()=>{
    const dn=e=>{
      keysRef.current[e.key]=true;
      if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
    };
    const up=e=>{keysRef.current[e.key]=false;};
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up);};
  },[]);

  const touchRef=useRef(null);
  const onTS=e=>{touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
  const onTE=e=>{
    if (!touchRef.current) return;
    const dx=e.changedTouches[0].clientX-touchRef.current.x;
    const dy=e.changedTouches[0].clientY-touchRef.current.y;
    if (Math.abs(dx)>Math.abs(dy)){
      const k=dx>0?'ArrowRight':'ArrowLeft';
      keysRef.current[k]=true; setTimeout(()=>{keysRef.current[k]=false;},300);
    } else {
      const k=dy<0?'ArrowUp':'ArrowDown';
      keysRef.current[k]=true; setTimeout(()=>{keysRef.current[k]=false;},200);
    }
    touchRef.current=null;
  };

  const submitLead=async e=>{
    e.preventDefault(); setFormErr('');
    if (!lead.nickname.trim()) return setFormErr('Nickname required.');
    if (!lead.email.trim())    return setFormErr('Email required.');
    if (!lead.phone.trim())    return setFormErr('Phone required.');
    setSubmitting(true);
    try {
      const res=await fetch('/api/arcade/lead',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...lead,score:uiScore,game:'hub3duro'}),
      });
      if (!res.ok){const d=await res.json();setFormErr(d.error||'Failed.');}
      else setSubmitted(true);
    } catch {setFormErr('Network error.');}
    finally {setSubmitting(false);}
  };

  const q=uiScore>=QUALIFY_SCORE;

  return (
    <div style={{
      position:'relative',width:'100%',maxWidth:W,margin:'0 auto',
      borderRadius:12,overflow:'hidden',
      border:`1.5px solid ${COLORS.ultraviolet}`,
      boxShadow:`0 0 40px rgba(79,20,135,0.55),0 0 80px rgba(79,20,135,0.2)`,
      background:COLORS.bg,fontFamily:'"JetBrains Mono",monospace',userSelect:'none',
    }} data-testid="hub3duro-container">
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'10px 16px',borderBottom:`1px solid rgba(79,20,135,0.4)`,
        background:'rgba(11,9,20,0.7)',
      }}>
        <div>
          <GlowText color={COLORS.acidGreen} size={14} style={{letterSpacing:4,textAlign:'left'}}>HUB3DURO</GlowText>
          <p style={{margin:0,fontSize:9,letterSpacing:2,color:`${COLORS.white}44`,fontFamily:'"Orbitron",monospace'}}>
            ENDURO RACING · DAY {uiDay} · 12 DAYS
          </p>
        </div>
        <div style={{display:'flex',gap:20}}>
          {[{l:'SCORE',v:uiScore,c:COLORS.acidGreen},{l:'BEST',v:uiHigh,c:COLORS.cyan}].map(({l,v,c})=>(
            <div key={l} style={{textAlign:'center'}}>
              <p style={{margin:0,fontSize:9,letterSpacing:2,color:`${COLORS.white}44`}}>{l}</p>
              <GlowText color={c} size={16}>{String(v).padStart(6,'0')}</GlowText>
            </div>
          ))}
        </div>
      </div>

      <div style={{position:'relative',lineHeight:0}}>
        <canvas ref={canvasRef} width={W} height={H}
          style={{display:'block',width:'100%',height:'auto',touchAction:'none'}}
          onTouchStart={onTS} onTouchEnd={onTE}
        />

        {phase==='idle'&&(
          <Overlay>
            <GlowText color={COLORS.acidGreen} size={26}>HUB3DURO</GlowText>
            <GlowText color={COLORS.cyan} size={11} style={{marginTop:4}}>ENDURO RACING · 12 DAYS · 10 FASES DE LUZ</GlowText>
            <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,maxWidth:340}}>
              {[
                {k:'← →  /  A D',d:'Mudar de faixa'},
                {k:'↑  /  W',    d:'Acelerar'},
                {k:'↓  /  S',    d:'Frear'},
                {k:'DAWN→BLIZZARD',d:'10 fases climáticas'},
                {k:'5 FAIXAS',   d:'Tráfego intenso'},
                {k:'+BÔNUS/DIA', d:'Score por dia completo'},
              ].map(({k,d})=>(
                <div key={k} style={{background:'rgba(79,20,135,0.12)',border:'1px solid rgba(79,20,135,0.35)',borderRadius:6,padding:'7px 10px'}}>
                  <p style={{margin:0,fontSize:9,color:COLORS.acidGreen,fontFamily:'"Orbitron",monospace',letterSpacing:1}}>{k}</p>
                  <p style={{margin:'3px 0 0',fontSize:10,color:`${COLORS.white}77`}}>{d}</p>
                </div>
              ))}
            </div>
            <NeonBtn onClick={start} data-testid="hub3duro-start">START ENGINE</NeonBtn>
          </Overlay>
        )}

        {phase==='gameover'&&(
          <Overlay>
            <GlowText color={COLORS.magenta} size={26}>RACE OVER</GlowText>
            <GlowText color={`${COLORS.white}55`} size={11} style={{marginTop:4}}>DAY {uiDay} · ENGINE BLOWN</GlowText>
            <GlowText color={COLORS.acidGreen} size={22} style={{marginTop:8}}>{String(uiScore).padStart(6,'0')} PTS</GlowText>
            {uiHigh>0&&<GlowText color={COLORS.cyan} size={11} style={{marginTop:2}}>BEST: {String(uiHigh).padStart(6,'0')}</GlowText>}
            {q&&!submitted&&(
              <>
                <div style={{margin:'12px 0 4px',padding:'8px 16px',background:'rgba(204,255,0,0.06)',border:`1px solid ${COLORS.acidGreen}44`,borderRadius:8}}>
                  <GlowText color={COLORS.acidGreen} size={10}>LEADERBOARD QUALIFICADO</GlowText>
                </div>
                <form onSubmit={submitLead} style={{display:'flex',flexDirection:'column',gap:7,width:'100%',maxWidth:270}}>
                  <NeonInput placeholder="NICKNAME / DRIVER TAG" value={lead.nickname} onChange={v=>setLead(f=>({...f,nickname:v}))}/>
                  <NeonInput placeholder="EMAIL" type="email" value={lead.email} onChange={v=>setLead(f=>({...f,email:v}))}/>
                  <NeonInput placeholder="PHONE (+55...)" value={lead.phone} onChange={v=>setLead(f=>({...f,phone:v}))}/>
                  {formErr&&<span style={{color:COLORS.magenta,fontSize:11,textAlign:'center'}}>{formErr}</span>}
                  <NeonBtn type="submit" disabled={submitting} color={COLORS.acidGreen}>{submitting?'SAVING...':'SUBMIT SCORE'}</NeonBtn>
                </form>
                <button onClick={start} style={{marginTop:6,background:'none',border:'none',color:`${COLORS.white}44`,fontSize:11,cursor:'pointer',letterSpacing:1,fontFamily:'"JetBrains Mono",monospace'}}>
                  skip → play again
                </button>
              </>
            )}
            {q&&submitted&&<><GlowText color={COLORS.acidGreen} size={13} style={{marginTop:10}}>Score registrado!</GlowText><NeonBtn onClick={start}>RACE AGAIN</NeonBtn></>}
            {!q&&<><GlowText color={`${COLORS.white}44`} size={10} style={{marginTop:8}}>{QUALIFY_SCORE}+ pts para o leaderboard</GlowText><NeonBtn onClick={start}>TRY AGAIN</NeonBtn></>}
          </Overlay>
        )}
      </div>

      <div style={{borderTop:`1px solid rgba(79,20,135,0.3)`,padding:'8px 16px',display:'flex',justifyContent:'center',gap:28,background:'rgba(11,9,20,0.6)'}}>
        {[{icon:'◀',label:'LEFT'},{icon:'▲',label:'ACCEL'},{icon:'▼',label:'BRAKE'},{icon:'▶',label:'RIGHT'}].map(({icon,label})=>(
          <div key={label} style={{textAlign:'center'}}>
            <p style={{margin:0,fontSize:16,color:COLORS.acidGreen,textShadow:`0 0 8px ${COLORS.acidGreen}`}}>{icon}</p>
            <p style={{margin:'2px 0 0',fontSize:8,color:`${COLORS.white}44`,fontFamily:'"Orbitron",monospace',letterSpacing:1}}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

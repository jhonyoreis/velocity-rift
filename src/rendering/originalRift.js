import {platformSurface,laserState,riftSectorAt,RIFT_FINISH_X} from "../levels/originalRift.js";
import {speedometer} from "../game/speedometer.js";
const visible=(o,s)=>o.dimension===undefined||o.dimension===-1||o.dimension===s.dimension;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function portal(ctx,x,y,color,t,size=1){
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 ctx.strokeStyle=color;ctx.lineWidth=6;ctx.shadowColor=color;ctx.shadowBlur=20;
 ctx.beginPath();ctx.ellipse(0,0,31+Math.sin(t*3)*2,64,0,0,Math.PI*2);ctx.stroke();
 ctx.shadowBlur=0;ctx.fillStyle="#090b26";ctx.globalAlpha=.85;
 ctx.beginPath();ctx.ellipse(0,0,27,59,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=color;ctx.globalAlpha=.5;ctx.lineWidth=1;
 for(let i=0;i<4;i++){
  ctx.beginPath();ctx.ellipse(0,0,12+i*4,33+i*6,t*.7+i,0,Math.PI*2);ctx.stroke();
 }ctx.restore();
}
function panel(ctx,x,y,w,h){ctx.fillStyle="rgba(6,12,31,.82)";ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();}
export function drawOriginalRift(ctx,s,layout,{W=960,H=540,drawFlux=null}={}){
 if(!s.active)return;
 const t=s.time,cx=s.cameraX,cy=s.cameraY,echo=s.dimension===1;
 const gradient=ctx.createLinearGradient(0,0,0,H);
 gradient.addColorStop(0,echo?"#210b38":"#060c24");
 gradient.addColorStop(.6,echo?"#372254":"#1c294c");gradient.addColorStop(1,"#080d22");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 // Fixed-cost parallax fields follow the camera along the entire long world.
 for(let i=0;i<65;i++){
  const x=((i*173-cx*.16)%(W+120)+W+120)%(W+120)-60,y=(i*113)%H;
  ctx.fillStyle=i%3?"#c8b4ff":"#a7ffef";ctx.globalAlpha=.2+.35*(1+Math.sin(t*.5+i))*.5;
  ctx.fillRect(x,y,i%7===0?3:1.5,i%7===0?3:1.5);
 }ctx.globalAlpha=1;
 const halo=ctx.createRadialGradient(W*.64,H*.4,12,W*.64,H*.4,260);
 halo.addColorStop(0,echo?"#86489d38":"#496ab238");halo.addColorStop(1,"#00000000");
 ctx.fillStyle=halo;ctx.fillRect(0,0,W,H);
 for(let i=0;i<14;i++){
  const x=((i*241-cx*.3)%(W+360)+W+360)%(W+360)-180,y=150+(i*151)%360-cy*.2;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.16+i)*.2+(i%2?.13:-.15));
  ctx.globalAlpha=.38;ctx.fillStyle=i%2?"#39305a":"#203449";
  const h=45+(i%4)*40,w=70+(i%3)*35;
  ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(w/2,0);ctx.lineTo(w*.2,h);ctx.lineTo(-w*.3,h*.7);ctx.closePath();ctx.fill();
  ctx.strokeStyle=echo?"#ca7be86b":"#7be9ef55";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-w*.4,1);ctx.lineTo(0,h*.2);ctx.lineTo(w*.3,0);ctx.stroke();ctx.restore();
 }
 ctx.save();ctx.translate(-cx,-cy);
 // Ribbons of fractured architecture hanging over the playable route.
 for(let i=Math.floor(cx/460)-1;i<Math.ceil((cx+W)/460)+1;i++){
  const x=i*460+60,y=80+(i*53)%120;
  ctx.strokeStyle="#846fa52a";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x,y+90);ctx.lineTo(x,y);ctx.lineTo(x+120,y-35);ctx.lineTo(x+180,y+40);ctx.stroke();
 }
 for(const p of layout.platforms){
  if(p.x2<cx-100||p.x1>cx+W+100)continue;
  const active=visible(p,s),offset=p.motion?Math.sin(t*1.6+p.id)*p.motion:0;
  const y1=p.y1+offset,y2=p.y2+offset,sign=p.orientation==="ceiling"?-1:1;
  ctx.save();ctx.globalAlpha=active?1:.14;
  const color=p.orientation==="ceiling"?"#e7a8ff":p.dimension===1?"#e78dff":"#78f8ec";
  ctx.fillStyle=echo?"#2a1d49":"#17243d";
  ctx.beginPath();ctx.moveTo(p.x1,y1);ctx.lineTo(p.x2,y2);
  ctx.lineTo(p.x2-40,y2+sign*75);ctx.lineTo(p.x1+42,y1+sign*115);ctx.closePath();ctx.fill();
  ctx.strokeStyle=active?color:"#c3acd4";ctx.lineWidth=10;
  if(!active)ctx.setLineDash([10,12]);
  ctx.beginPath();ctx.moveTo(p.x1,y1);ctx.lineTo(p.x2,y2);ctx.stroke();
  ctx.setLineDash([]);ctx.lineWidth=3;ctx.strokeStyle="#e9ffff88";ctx.stroke();
  if(active)for(let x=Math.max(p.x1+30,Math.floor(cx/130)*130);x<p.x2-30&&x<cx+W+60;x+=130){
   const y=platformSurface(p,x,t);ctx.strokeStyle=color+"55";
   ctx.beginPath();ctx.moveTo(x,y+sign*13);ctx.lineTo(x+18,y+sign*28);ctx.lineTo(x-3,y+sign*45);ctx.stroke();
  }
  ctx.restore();
 }
 if(cx<700){
  portal(ctx,83,409,"#9edcff",t,.75);
  ctx.save();ctx.translate(490,440);
  ctx.fillStyle="#22173e";ctx.fillRect(-55,-248,110,248);
  ctx.strokeStyle="#a78bea";ctx.lineWidth=7;ctx.strokeRect(-55,-248,110,248);
  // The nine cores orbit the altar and illuminate the animated opening.
  ctx.fillStyle="#09192d";ctx.fillRect(-42,-230,84,222);
  const open=s.gateTime;
  ctx.fillStyle="#685181";ctx.fillRect(-42,-230,42*(1-open),222);ctx.fillRect(42*open,-230,42*(1-open),222);
  ctx.fillStyle="#192b47";ctx.fillRect(-82,-25,164,25);
  for(let i=0;i<9;i++){
   const a=i*Math.PI*2/9-t*.22;
   ctx.fillStyle=i<s.cores?"#9affde":"#554569";
   ctx.beginPath();ctx.arc(Math.cos(a)*62,Math.sin(a)*52-115,6,0,Math.PI*2);ctx.fill();
  }
  ctx.textAlign="center";ctx.fillStyle="#f2ddff";ctx.font="bold 17px system-ui";
  ctx.fillText("ALTAR "+s.cores+"/9",0,-270);
  if(!s.gateOpened){ctx.font="13px system-ui";ctx.fillText("FALTAM "+(9-s.cores)+" NÚCLEOS",0,-247);}
  ctx.restore();
 }
 for(const cp of layout.checkpoints){
  if(cp.x<cx-60||cp.x>cx+W+60)continue;
  ctx.save();ctx.translate(cp.x,cp.y+cp.gravity*18);ctx.scale(1,cp.gravity);
  const on=cp.x<=s.checkpoint.x;
  ctx.strokeStyle=on?"#a4ffe9":"#788fa9";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-58);ctx.lineTo(29,-48);ctx.lineTo(0,-35);ctx.stroke();
  ctx.fillStyle=on?"#91ffe244":"#94b6d522";ctx.beginPath();ctx.arc(0,-28,37,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 for(const p of layout.portals){
  if(p.x<cx-70||p.x>cx+W+70)continue;
  portal(ctx,p.x,p.y,p.color,t);
  ctx.textAlign="center";ctx.font="bold 12px system-ui";ctx.fillStyle=p.color;
  ctx.fillText(p.label,p.x,p.y+(p.target.gravity<0?-85:91));ctx.textAlign="left";
 }
 for(const a of layout.anchors){
  if(a.x<cx-100||a.x>cx+W+100)continue;
  ctx.save();ctx.translate(a.x,a.y);ctx.strokeStyle=a.dimension?"#e78dff":"#78f8ec";ctx.lineWidth=3;
  ctx.setLineDash([8,7]);ctx.beginPath();ctx.ellipse(0,0,50,78,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.rotate(t*.7);ctx.strokeRect(-15,-15,30,30);ctx.restore();
 }
 for(const item of layout.items){
  if(s.collected.has(item.id)||!visible(item,s)||item.x<cx-40||item.x>cx+W+40)continue;
  const y=item.y+(item.motion?Math.sin(t*1.6+item.platform)*item.motion:0);
  ctx.save();ctx.translate(item.x,y);
  if(item.type==="boost"){
   ctx.fillStyle="#8bffe8";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle="#c8fff5";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,18+Math.sin(t*4)*2,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle="#153b4c";ctx.beginPath();ctx.moveTo(3,-8);ctx.lineTo(-5,1);ctx.lineTo(0,1);ctx.lineTo(-2,8);ctx.lineTo(6,-2);ctx.lineTo(1,-2);ctx.closePath();ctx.fill();
  }else{
   ctx.rotate(.15*Math.sin(t*3+item.id));ctx.fillStyle="#ff956a";
   ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(7,-3);ctx.lineTo(0,12);ctx.lineTo(-7,-3);ctx.closePath();ctx.fill();
   ctx.strokeStyle="#ffe7b9";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,11);ctx.lineTo(-6,-3);ctx.stroke();
  }ctx.restore();
 }
 layout.barricades.forEach((b,i)=>{
  if(s.broken.has(i)||b.x<cx-60||b.x>cx+W+60)return;
  ctx.fillStyle=b.type==="membrane"?"#985ee5aa":"#ac507a";ctx.fillRect(b.x,b.y,b.w,b.h);
  if(b.type==="membrane"){
   ctx.strokeStyle="#c2a0ff";ctx.lineWidth=2;
   for(let y=b.y+10;y<b.y+b.h;y+=20){ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y+8);ctx.stroke();}
  }
  ctx.strokeStyle="#ffd4df";ctx.lineWidth=2;ctx.strokeRect(b.x,b.y,b.w,b.h);
  ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+b.w*.6,b.y+b.h*.4);ctx.lineTo(b.x+5,b.y+b.h*.65);ctx.lineTo(b.x+b.w,b.y+b.h);ctx.stroke();
 });
 layout.enemies.forEach((e,i)=>{
  if(s.defeated.has(i)||!visible(e,s)||e.x<cx-100||e.x>cx+W+100)return;
  const x=e.x+Math.sin(t*1.9+i)*e.range;
  const y=e.y+(e.type==="wraith"?Math.sin(t*2.7+i)*32:e.type==="crusher"?-e.gravity*Math.max(0,Math.sin(t*2+i))*48:0);
  ctx.save();ctx.translate(x,y);ctx.scale(1,e.gravity);
  const color=e.type==="wraith"?"#c08aff":e.type==="sentinel"?"#ffd095":e.type==="crusher"?"#ff617e":"#ffadcf";
  ctx.fillStyle=color;
  if(e.type==="sentinel"){
   ctx.beginPath();ctx.moveTo(-20,20);ctx.lineTo(-16,-17);ctx.lineTo(16,-17);ctx.lineTo(20,20);ctx.closePath();ctx.fill();
   ctx.strokeStyle=color;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s.x<x?-28:28,0);ctx.stroke();
   const timer=s.shotTimers.get(i)??2;ctx.globalAlpha=timer<.6?1:.3;
   ctx.fillStyle="#fff4de";ctx.beginPath();ctx.arc(0,-6,7,0,Math.PI*2);ctx.fill();
  }else if(e.type==="crusher"){
   ctx.fillRect(-24,-24,48,48);ctx.fillStyle="#270f35";ctx.fillRect(-15,-10,30,10);
   ctx.fillStyle="#fff4c9";ctx.fillRect(-10,-8,5,4);ctx.fillRect(5,-8,5,4);
  }else{
   ctx.rotate(e.type==="shard"?t*2:Math.sin(t)*.2);
   ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(22,0);ctx.lineTo(0,24);ctx.lineTo(-22,0);ctx.closePath();ctx.fill();
   if(e.type==="wraith"){ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(0,0,32,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
   ctx.fillStyle="#220e31";ctx.fillRect(-8,-4,16,8);
  }ctx.restore();
 });
 for(const h of layout.hazards){
  if(h.x<cx-40||h.x>cx+W+40)continue;
  if(h.type==="spikes"){
   ctx.fillStyle="#ff6d8e";
   for(let x=h.x;x<h.x+h.w;x+=14){
    ctx.beginPath();ctx.moveTo(x,h.y+(h.gravity===-1?0:h.h));
    ctx.lineTo(x+7,h.y+(h.gravity===-1?h.h:0));ctx.lineTo(x+14,h.y+(h.gravity===-1?0:h.h));ctx.fill();
   }
  }else{
   const state=laserState(h,t);ctx.fillStyle="#51405c";ctx.fillRect(h.x-12,h.y-10,44,10);
   if(state!=="off"){
    ctx.globalAlpha=state==="warning"?.35:1;ctx.fillStyle=state==="warning"?"#ffd58e":"#ff679b";
    ctx.fillRect(h.x+(state==="warning"?8:0),h.y,state==="warning"?4:h.w,h.h);ctx.globalAlpha=1;
   }
  }
 }
 for(const shot of s.shots){
  if(!visible(shot,s))continue;
  ctx.fillStyle="#ffadbd";ctx.beginPath();ctx.arc(shot.x,shot.y,6,0,Math.PI*2);ctx.fill();
 }
 if(s.apparitionTime>0){
  ctx.save();ctx.globalAlpha=Math.min(1,s.apparitionTime)*.8;
  ctx.translate(s.x+370,200+Math.sin(t)*12);ctx.fillStyle="#200d35";ctx.strokeStyle="#d282ff";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,-120);ctx.lineTo(28,-75);ctx.lineTo(100,-120);ctx.lineTo(64,40);
  ctx.lineTo(27,5);ctx.lineTo(0,65);ctx.lineTo(-27,5);ctx.lineTo(-64,40);ctx.lineTo(-100,-120);ctx.lineTo(-28,-75);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle="#edabff";ctx.fillRect(-14,-70,28,8);ctx.beginPath();ctx.arc(0,-20,12,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 if(cx>RIFT_FINISH_X-1400){
  portal(ctx,RIFT_FINISH_X+200,383,"#f5b0ff",t,1.65);
  ctx.fillStyle="#29213e";ctx.fillRect(RIFT_FINISH_X+105,226,15,254);ctx.fillRect(RIFT_FINISH_X+280,226,15,254);
  ctx.font="bold 15px system-ui";ctx.fillStyle="#eedaff";ctx.textAlign="center";
  ctx.fillText("O CONFRONTO ESTÁ ALÉM DA FENDA",RIFT_FINISH_X+195,204);ctx.textAlign="left";
 }
 for(const p of s.particles){ctx.globalAlpha=p.life*2;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;
 ctx.save();ctx.translate(s.x,s.y);ctx.scale(1,s.gravity);
 if(drawFlux)drawFlux({x:0,y:0,vx:s.vx,vy:s.vy,facing:s.facing,onGround:s.grounded,ground:null,
  sliding:s.sliding,boosting:s.boosting,invulnerable:s.invincible,animationPhase:t*(Math.abs(s.vx)>30?18:2)},
  {boost:s.boosting?1:0,turn:0,landing:0,takeoff:0,hit:0,run:Math.abs(s.vx)>30?1:0},t);
 else{
  ctx.fillStyle="#dff9ff";ctx.beginPath();ctx.arc(0,-3,17,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#6feef1";ctx.fillRect(s.facing>0?2:-14,-9,12,9);
  ctx.fillStyle="#ffb66b";ctx.fillRect(-22,0,11,6);
 }
 if(s.dash>0){ctx.strokeStyle="#9cfff5";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-25*s.facing,0);ctx.lineTo(-65*s.facing,0);ctx.stroke();}
 ctx.restore();ctx.restore();
 // Match the existing sparse HUD; lower edges remain free for mobile controls.
 panel(ctx,14,12,185,47);ctx.font="bold 20px system-ui";ctx.fillStyle="#effffa";ctx.fillText("◆ "+s.crystals,27,42);
 panel(ctx,W-157,12,140,47);ctx.fillStyle="#effffa";ctx.textAlign="right";ctx.fillText(s.time.toFixed(1)+" s",W-31,42);ctx.textAlign="left";
 ctx.fillStyle="rgba(8,30,46,.8)";ctx.fillRect(291,26,370,16);ctx.fillStyle="#78f5d9";
 ctx.fillRect(295,30,362*clamp(s.boost/(s.capacity||100),0,1),8);
 ctx.fillStyle="#d4ffef";ctx.font="bold 11px system-ui";ctx.fillText("BOOST",298,20);
 const gauge=speedometer(s.vx);ctx.fillStyle="rgba(7,23,38,.8)";ctx.fillRect(291,50,370,26);
 ctx.fillStyle=gauge.color;ctx.fillRect(295,54,362*gauge.fraction,8);ctx.fillStyle="#e0edff";
 ctx.font="bold 10px system-ui";ctx.fillText("VELOCIDADE",298,72);ctx.textAlign="right";ctx.fillText(gauge.value+" u/s",655,72);ctx.textAlign="left";
 ctx.fillStyle=echo?"#eaaaff":"#a7fff0";ctx.font="bold 11px system-ui";
 ctx.fillText((echo?"ECO":"ORIGEM")+(s.gravity<0?" · GRAVIDADE ↑":" · GRAVIDADE ↓"),28,75);
 ctx.fillStyle="rgba(167,227,255,.18)";ctx.fillRect(20,84,W-40,3);ctx.fillStyle=echo?"#dda4ff":"#8bf5e3";
 ctx.fillRect(20,84,(W-40)*clamp(s.distance/RIFT_FINISH_X,0,1),3);
 if(s.messageTime>0){
  panel(ctx,207,100,546,37);ctx.textAlign="center";ctx.fillStyle="#f0dbff";ctx.font="bold 14px system-ui";
  ctx.fillText(s.message,W/2,124,520);ctx.textAlign="left";
 }else{
  ctx.fillStyle="#c0badb";ctx.font="11px system-ui";ctx.textAlign="center";
  ctx.fillText(riftSectorAt(s.x).name,W/2,110);ctx.textAlign="left";
 }
 if(s.phaseFlash>0){ctx.fillStyle=echo?"#dc87ff":"#9affee";ctx.globalAlpha=s.phaseFlash*.15;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
}

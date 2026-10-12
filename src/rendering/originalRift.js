import {drawPocketReality} from "./pocketReality.js";
import {drawBoostTrail} from "./boostTrail.js";
import {sampleDefeat} from "../game/defeat.js";
import {drawSovereignProjectile,drawSovereignEnergy} from "./sovereignEnergy.js";
import {drawMemoryCore,drawBoostEnergy,drawBreakWall} from "./collectibles.js";
import {drawRubroAura} from "./rubro.js";
import {sampleVictorySequence} from "../game/victorySequence.js";
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
export function drawOriginalRift(ctx,s,layout,{W=960,H=540,drawFlux=null,drawSovereign=null,drawAlicia=null,ghost=null}={}){
 if(!s.active)return;
 if(s.pocket){drawPocketReality(ctx,s.pocket,{W,H,drawFlux,defeat:s.defeat,crystals:s.crystals});return;}
 const t=s.time+(s.victory?.elapsed||0)+(s.defeat?.elapsed||0),cx=s.cameraX,cy=s.cameraY,echo=s.dimension===1;
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
 // Distant cathedral: broken arches, displaced city fragments and a split eclipse.
 ctx.save();ctx.translate(W*.7-cx*.025%210,145-cy*.12);
 ctx.strokeStyle=echo?"#b263d344":"#746cba55";ctx.lineWidth=3;
 for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,100+i*18,105+i*12,t*.02+i*.12,0,Math.PI*2);ctx.stroke();}
 ctx.fillStyle="#08091e";ctx.beginPath();ctx.arc(-12,-8,89,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#ffa0c750";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-25,-105);ctx.lineTo(7,-35);ctx.lineTo(-12,3);ctx.lineTo(22,104);ctx.stroke();ctx.restore();
 for(let i=0;i<9;i++){
  const x=((i*230-cx*.42)%(W+260)+W+260)%(W+260)-120,h=130+(i%4)*60,y=330-cy*.22;
  ctx.fillStyle="#0b142b";ctx.fillRect(x,y-h,48,h+90);
  ctx.strokeStyle=echo?"#ba77db33":"#70cfda33";ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h);ctx.quadraticCurveTo(x+92,y-h-125,x+190,y-h+35);ctx.stroke();
  for(let j=0;j<4;j++){ctx.fillStyle=j%2?"#8570a133":"#64bdb933";ctx.fillRect(x+12,y-h+20+j*31,5,12);}
 }
 const mist=ctx.createLinearGradient(0,H*.55,0,H);mist.addColorStop(0,"#ae73c900");mist.addColorStop(1,echo?"#6b32722b":"#42728b2b");ctx.fillStyle=mist;ctx.fillRect(0,0,W,H);
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
   drawMemoryCore(ctx,Math.cos(a)*62,Math.sin(a)*52-115,t,.43,!s.coreSlots[i]);
  }
  ctx.textAlign="center";ctx.fillStyle="#f2ddff";ctx.font="bold 17px system-ui";
  drawMemoryCore(ctx,-26,-115,t,.5);ctx.fillText(s.cores+"/9",12,-110);

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
  ctx.textAlign="center";ctx.fillStyle=a.dimension?"#e78dff":"#78f8ec";ctx.font="bold 11px system-ui";ctx.fillText("↓ TROCAR REALIDADE",a.x,a.y-93);ctx.textAlign="left";
 }
 for(const rune of layout.runes){
  if(rune.x<cx-80||rune.x>cx+W+80)continue;
  const lit=s.runes.has(rune.id);ctx.save();ctx.translate(rune.x,rune.y);ctx.strokeStyle=lit?"#ffe5a3":visible(rune,s)?"#ebacd8":"#877d9066";ctx.fillStyle=lit?"#ffe5a344":"#15172a";ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(Math.PI/4);ctx.strokeRect(-9,-9,18,18);ctx.restore();
  ctx.textAlign="center";ctx.font="bold 10px system-ui";ctx.fillStyle=lit?"#ffe5a3":"#dbc8ee";ctx.fillText(rune.label+(lit?" ✓":" · DASH"),rune.x,rune.y+rune.gravity*-43);ctx.textAlign="left";
 }
 for(const gate of layout.gates){
  if(gate.x<cx-50||gate.x>cx+W+50)continue;
  const open=gate.requires.every(id=>s.runes.has(id));ctx.fillStyle=open?"#8effd122":"#d57aff66";ctx.fillRect(gate.x-8,80,16,620);
  ctx.strokeStyle=open?"#8effd1":"#e49aff";ctx.lineWidth=2;ctx.strokeRect(gate.x-14,80,28,620);
  gate.requires.forEach((id,i)=>{ctx.fillStyle=s.runes.has(id)?"#ffe8a7":"#635072";ctx.beginPath();ctx.arc(gate.x,210+i*50,10,0,Math.PI*2);ctx.fill();});
 }
 for(const trial of layout.trials){
  if(trial.x<cx-70||trial.x>cx+W+70)continue;
  ctx.strokeStyle=s.failedTrials.has(trial.id)?"#5e5069":s.secrets.has(trial.id)?"#8affd6":"#ffce82";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(trial.x,trial.y+30);ctx.lineTo(trial.x,trial.y-24);ctx.lineTo(trial.x+19,trial.y);ctx.lineTo(trial.x-19,trial.y);ctx.closePath();ctx.stroke();
  ctx.fillStyle="#ffdd9a";ctx.textAlign="center";ctx.font="bold 10px system-ui";ctx.fillText((s.failedTrials.has(trial.id)?"DESAFIO PERDIDO · ":s.secrets.has(trial.id)?"CONCLUÍDO · ":visible(layout.cores[trial.core],s)?"ENCOSTE · ":layout.cores[trial.core].dimension?"MUDE PARA ECO · ":"MUDE PARA ORIGEM · ")+trial.limit+"s",trial.x,trial.y-40);ctx.textAlign="left";
 }
 for(const core of layout.cores){
  if(layout.trials.some(trial=>trial.core===core.id)||s.runCores.has(core.id)||!visible(core,s)||core.x<cx-40||core.x>cx+W+40)continue;
  drawMemoryCore(ctx,core.x,core.y,t);
 }
 for(const item of layout.items){
  if(s.collected.has(item.id)||!visible(item,s)||item.x<cx-40||item.x>cx+W+40)continue;
  const y=item.y+(item.motion?Math.sin(t*1.6+item.platform)*item.motion:0);
  ctx.save();ctx.translate(item.x,y);
  if(item.type==="boost"){
   drawBoostEnergy(ctx,0,0,t);
  }else{
   ctx.rotate(.15*Math.sin(t*3+item.id));ctx.fillStyle="#ff956a";
   ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(7,-3);ctx.lineTo(0,12);ctx.lineTo(-7,-3);ctx.closePath();ctx.fill();
   ctx.strokeStyle="#ffe7b9";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,11);ctx.lineTo(-6,-3);ctx.stroke();
  }ctx.restore();
 }
 layout.barricades.forEach((b,i)=>{
  if(s.broken.has(i)||b.x<cx-60||b.x>cx+W+60)return;
  drawBreakWall(ctx,b);
 });
 layout.enemies.forEach((e,i)=>{
  if(s.defeated.has(i)||!visible(e,s)||e.x<cx-100||e.x>cx+W+100)return;
  const x=e.x+Math.sin(t*1.9+i)*e.range;
  const y=e.y+(e.type==="wraith"?Math.sin(t*2.7+i)*32:e.type==="crusher"?-e.gravity*Math.max(0,Math.sin(t*2+i))*48:0);
  ctx.save();ctx.translate(x,y);ctx.scale(1,e.gravity);
  const color=e.type==="rift-laser"?"#ff687e":e.type==="rift-triple"?"#ffd082":e.type==="wraith"?"#c08aff":e.type==="sentinel"?"#ffd095":e.type==="crusher"?"#ff617e":"#ffadcf";
  ctx.fillStyle=color;
  if(e.type==="sentinel"||e.type==="rift-laser"||e.type==="rift-triple"){
   ctx.beginPath();ctx.moveTo(-20,20);ctx.lineTo(-16,-17);ctx.lineTo(16,-17);ctx.lineTo(20,20);ctx.closePath();ctx.fill();
   ctx.strokeStyle=color;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s.x<x?-28:28,0);ctx.stroke();
   if(e.type==="rift-triple")for(const dy of [-10,10]){ctx.beginPath();ctx.moveTo(0,dy);ctx.lineTo(s.x<x?-26:26,dy);ctx.stroke();}
   ctx.strokeStyle="#ebcbff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,-24);ctx.lineTo(0,-31);ctx.lineTo(11,-24);ctx.stroke();
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
  if(shot.sovereign)drawSovereignProjectile(ctx,shot,t);else{ctx.fillStyle="#ffadbd";ctx.beginPath();ctx.arc(shot.x,shot.y,6,0,Math.PI*2);ctx.fill();}
 }
 if(s.apparitionTime>0){
  ctx.save();ctx.globalAlpha=Math.min(1,s.apparitionTime)*.8;
  ctx.translate(s.x+370,200+Math.sin(t)*12);ctx.fillStyle="#200d35";ctx.strokeStyle="#d282ff";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,-120);ctx.lineTo(28,-75);ctx.lineTo(100,-120);ctx.lineTo(64,40);
  ctx.lineTo(27,5);ctx.lineTo(0,65);ctx.lineTo(-27,5);ctx.lineTo(-64,40);ctx.lineTo(-100,-120);ctx.lineTo(-28,-75);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle="#edabff";ctx.fillRect(-14,-70,28,8);ctx.beginPath();ctx.arc(0,-20,12,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 const victory=s.victory?sampleVictorySequence(s.victory):null;
 if(victory&&drawSovereign&&victory.bossOpacity>0){
  const v=s.victory,age=v.elapsed;
  ctx.save();ctx.globalAlpha=victory.bossOpacity;ctx.translate(v.bossX,v.bossY);ctx.rotate(Math.sin(age*28)*.06);ctx.translate(-v.bossX,-v.bossY);
  drawSovereign(v.bossX,v.bossY+42,t+age,.42);ctx.restore();
  for(let i=0;i<28;i++){const angle=i*2.4,r=age*110;ctx.save();ctx.globalAlpha=victory.bossOpacity;ctx.translate(v.bossX+Math.cos(angle)*r,v.bossY+Math.sin(angle)*r);ctx.rotate(angle+age);ctx.fillStyle=i%2?"#d597ff":"#ffdfa1";ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(7,7);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.restore();}
 }
 const boss=s.boss;
 if(boss.mode==="chase"){
  const wall=ctx.createLinearGradient(boss.barrierX-90,0,boss.barrierX+15,0);wall.addColorStop(0,"#150d26");wall.addColorStop(1,"#ed659dcc");ctx.fillStyle=wall;ctx.fillRect(boss.barrierX-960,-170,970,1050);
  ctx.strokeStyle="#ffbfd4";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(boss.barrierX,0);for(let y=0;y<790;y+=30)ctx.lineTo(boss.barrierX+Math.sin(y*.3+t*8)*12,y);ctx.stroke();
 }
 if(boss.mode!=="dormant"&&boss.mode!=="defeated"&&boss.x>cx-200&&boss.x<cx+W+200){
  const bossScale=["invincible","scarlet"].includes(boss.mode)?.65:.42;
  if(drawSovereign)drawSovereign(boss.x,boss.y+99*bossScale,t,bossScale);
  if(["invincible","scarlet"].includes(boss.mode))drawSovereignEnergy(ctx,boss.x,boss.y,t);
  ctx.strokeStyle=boss.vulnerable?"#ffe5a2":"#b06eea";ctx.fillStyle=boss.vulnerable?"#ffe7a5":"#2a153f";ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(boss.x,boss.y,18+Math.sin(t*6)*2,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.textAlign="center";ctx.fillStyle=boss.vulnerable?"#fff0b7":"#dba9ff";ctx.font="bold 11px system-ui";
  ctx.fillText(boss.mode==="invincible"?"INVULNERÁVEL":boss.vulnerable?boss.mode==="scarlet"?"IMPACTO RUBRO":"DASH NO NÚCLEO":"PREPARE O DESVIO",boss.x,boss.y-145);ctx.textAlign="left";
 }
 if(boss.mode==="invincible"&&boss.waveRadius>0){
  ctx.save();ctx.strokeStyle="#d597ff";ctx.lineWidth=18;ctx.globalAlpha=.35;
  for(const offset of [0,-45,-90]){ctx.beginPath();ctx.arc(boss.x,boss.y,Math.max(1,boss.waveRadius+offset),0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=.12;ctx.lineWidth=50;ctx.beginPath();ctx.arc(boss.x,boss.y,boss.waveRadius,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 for(const m of boss.minions){if(m.dead)continue;ctx.fillStyle=m.type==="wraith"?"#aa7ad4":"#e899aa";ctx.beginPath();ctx.moveTo(m.x,m.y-23);ctx.lineTo(m.x+22,m.y);ctx.lineTo(m.x,m.y+23);ctx.lineTo(m.x-22,m.y);ctx.fill();}
 if(boss.resonance){const r=boss.resonance;ctx.save();ctx.translate(r.x,r.y);ctx.strokeStyle="#ff5c83";ctx.fillStyle="#ffd4b7";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,24+Math.sin(t*5)*4,0,Math.PI*2);ctx.stroke();if(!r.warning)ctx.fillRect(-6,-6,12,12);ctx.restore();ctx.textAlign="center";ctx.font="bold 11px system-ui";ctx.fillStyle="#ffbccb";ctx.fillText("RESSONÂNCIA RUBRA",r.x,r.y-45);ctx.textAlign="left";}
 for(const beam of s.beams){
  if(!visible(beam,s))continue;ctx.strokeStyle=beam.warning?"#eac5ff":beam.sovereign?"#b46eff":"#ff4e78";ctx.lineWidth=beam.warning?2:13;ctx.setLineDash(beam.warning?[12,8]:[]);ctx.beginPath();ctx.moveTo(beam.x1,beam.y1);ctx.lineTo(beam.x2,beam.y2);ctx.stroke();ctx.setLineDash([]);
  if(!beam.warning){ctx.strokeStyle="#ffe3ed";ctx.lineWidth=3;ctx.stroke();}
 }
 if(s.x>43200&&drawAlicia){
  drawAlicia(46650,victory?570+80*(1-victory.barrierOpacity):570,.95,t,victory?0:Math.sin(t)*8);ctx.save();ctx.globalAlpha=victory?victory.barrierOpacity:1;ctx.strokeStyle="#d68dff";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(46650,515,55,90,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 for(const p of s.particles){ctx.globalAlpha=p.life*2;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;
 if(!s.victory&&ghost&&drawFlux&&(ghost.dimension===undefined||ghost.dimension===s.dimension)&&Math.abs(ghost.x-s.x)<900){ctx.save();ctx.globalAlpha=.25;ctx.translate(ghost.x,ghost.y);ctx.scale(1,ghost.gravity||1);drawFlux({...ghost,x:0,y:0,vx:400,vy:0,onGround:true,sliding:false,boosting:false,invulnerable:0,animationPhase:t*15},{boost:0,turn:0,landing:0,takeoff:0,hit:0,run:1},t);ctx.restore();}
 drawBoostTrail(ctx,s.boostTrail,s.rubro||s.scarlet>0);
 for(const g of s.ghosts){
  ctx.save();ctx.globalAlpha=(g.life/.25)**2*(g.boosting?.34:.20);
  ctx.translate(g.x,g.y);ctx.scale(g.facing,s.gravity);
  ctx.fillStyle=g.rubro?"#ff456d":g.boosting?"#70fff8":"#b8edf1";
  ctx.beginPath();ctx.ellipse(0,g.sliding?0:-3,g.sliding?24:17,g.sliding?8:18,-.12,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=g.rubro?"#ff9ab0":"#b5ffff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,-7);ctx.lineTo(-34,-6);ctx.stroke();ctx.restore();
 }
 const defeatPose=s.defeat?sampleDefeat(s.defeat):null;
 ctx.save();ctx.translate(defeatPose?defeatPose.x:s.x,defeatPose?defeatPose.y:s.y);ctx.scale(1,s.gravity);
 if(drawFlux)drawFlux({x:0,y:0,vx:s.vx,vy:s.vy,facing:s.facing,onGround:s.grounded,ground:s.ground,
  sliding:s.sliding,boosting:s.boosting,invulnerable:defeatPose?0:s.invincible,animationPhase:s.animationPhase,rubro:defeatPose?s.defeat.rubro:s.rubro||s.scarlet>0,defeat:defeatPose},
  s.fx,t);
 else{
  ctx.fillStyle="#dff9ff";ctx.beginPath();ctx.arc(0,-3,17,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#6feef1";ctx.fillRect(s.facing>0?2:-14,-9,12,9);
  ctx.fillStyle="#ffb66b";ctx.fillRect(-22,0,11,6);
 }
 if(s.dash>0){ctx.strokeStyle=s.rubro||s.scarlet>0?"#ff456d":"#9cfff5";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-25*s.facing,0);ctx.lineTo(-65*s.facing,0);ctx.stroke();}
 ctx.restore();
 if(!s.defeat)drawRubroAura(ctx,s.x,s.y,t+(s.transformClock||0),{active:s.rubro||s.scarlet>0,transformTime:s.transformTime});
 ctx.restore();
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
 if(boss.mode!=="dormant"&&boss.mode!=="defeated"){
  panel(ctx,300,H-104,360,42);ctx.fillStyle="#392445";ctx.fillRect(314,H-77,332,6);ctx.fillStyle=boss.mode==="scarlet"?"#ff577b":"#c78cf4";ctx.fillRect(314,H-77,332*(boss.mode==="invincible"?1:Math.max(0,boss.hp)/boss.maxHp),6);ctx.textAlign="center";ctx.fillStyle="#f5d6ff";ctx.font="bold 11px system-ui";ctx.fillText("SOBERANO · "+(boss.mode==="chase"?"PERSEGUIÇÃO":boss.mode==="scarlet"?"ÚLTIMA FORMA":boss.mode==="invincible"?"SEGUNDA FORMA":"TRONO DA RUPTURA")+" · "+(boss.mode==="invincible"?"INVULNERÁVEL":Math.max(0,boss.hp)+"/"+boss.maxHp),480,H-87);ctx.textAlign="left";
 }
 if(s.scarlet>0){ctx.fillStyle="#ffb8ca";ctx.font="bold 11px system-ui";ctx.fillText("RUBRO · "+s.scarlet.toFixed(1)+"s",28,102);}
 if(s.trials.size){ctx.textAlign="right";ctx.fillStyle="#ffdb9c";ctx.font="bold 12px system-ui";for(const [id,run] of s.trials){const trial=layout.trials.find(t=>t.id===id);ctx.fillText("DESAFIO "+Math.max(0,trial.limit-run.elapsed).toFixed(1)+"s",W-28,103);}ctx.textAlign="left";}
 if(s.gravityWarning>0){ctx.fillStyle="#ffedb9";ctx.font="bold 32px system-ui";ctx.textAlign="center";ctx.fillText(s.gravity===1?"↑ INVERSÃO ↑":"↓ INVERSÃO ↓",W/2,225);ctx.textAlign="left";}
 if(s.phaseFlash>0){ctx.fillStyle=echo?"#dc87ff":"#9affee";ctx.globalAlpha=s.phaseFlash*.15;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
}

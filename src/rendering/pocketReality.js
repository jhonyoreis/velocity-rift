import {drawDashCharge} from "./combatReadability.js";
import {dashIndicatorState} from "../game/combatReadability.js";
import {drawRubroAura} from "./rubro.js";
import {sampleDefeat} from "../game/defeat.js";
import {drawMemoryCore} from "./collectibles.js";
const THEMES=[{sky:"#070f26",mist:"#258caa",edge:"#88ffe2",stone:"#142e45",light:"#69eee1",name:"SANTUÁRIO SUBMERSO"},
 {sky:"#13091f",mist:"#9e459e",edge:"#f7a6e8",stone:"#34203f",light:"#cd83ff",name:"ARQUIVO DO PARADOXO"},
 {sky:"#0b1025",mist:"#4975b6",edge:"#ffe0a0",stone:"#232b48",light:"#ffcc8a",name:"FRAGMENTOS DA ÚLTIMA LUZ"}];
function polygon(ctx,points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function glow(ctx,x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,"#00000000");ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function background(ctx,W,H,cx,t,theme,exile){
 const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,theme.sky);g.addColorStop(.55,exile?"#191b3b":"#151d3c");g.addColorStop(1,"#040919");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 glow(ctx,W*.65,H*.35,330,exile?"#bcbcff42":theme.mist+"45");glow(ctx,W*.12,H*.7,210,theme.mist+"25");
 // Broken cathedral silhouettes at two depths, with independent parallax.
 for(let layer=0;layer<2;layer++)for(let i=0;i<10;i++){
  const x=((i*219-cx*(.12+layer*.11))%(W+280)+W+280)%(W+280)-140,y=150+(i*67)%190;
  ctx.globalAlpha=layer?.55:.35;polygon(ctx,[[x,H],[x,y],[x+22,y-55],[x+48,y-15],[x+62,H]],layer?"#10182d":"#3d466a");
  ctx.strokeStyle=theme.light+"44";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+22,y-47);ctx.lineTo(x+22,y+35);ctx.lineTo(x+35,y+51);ctx.stroke();
 }ctx.globalAlpha=1;
 const px=W*.64-cx*.035,py=225;
 glow(ctx,px,py,170,exile?"#cc9fff38":theme.light+"18");
 ctx.save();ctx.translate(px,py);ctx.rotate(-.15);ctx.strokeStyle=exile?"#eeecff":"#b5c9ff55";
 for(let i=0;i<4;i++){ctx.globalAlpha=(exile?.25:.12)+i*.04;ctx.lineWidth=i?2:9;ctx.beginPath();ctx.ellipse(0,0,95+i*13,133+i*15,t*.035,0,Math.PI*2);ctx.stroke();}
 ctx.globalAlpha=1;ctx.fillStyle="#050917";ctx.beginPath();ctx.ellipse(0,0,83,120,t*.035,0,Math.PI*2);ctx.fill();
 ctx.rotate(t*.09);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ctx.save();ctx.translate(Math.cos(a)*140,Math.sin(a)*172);ctx.rotate(a);polygon(ctx,[[-6,-17],[9,0],[-3,22],[-11,2]],i%2?theme.stone:"#5b587d",theme.light+"88");ctx.restore();}ctx.restore();
 for(let i=0;i<65;i++){const x=((i*149-cx*.28+t*(i%2?3:-2))%W+W)%W,y=(i*79+t*(i%3+1)*3)%H;ctx.globalAlpha=.18+.3*(1+Math.sin(t+i))*.5;ctx.fillStyle=i%3?theme.light:"#ffffff";ctx.fillRect(x,y,i%7?1.5:3,i%7?1.5:3);}ctx.globalAlpha=1;
 // Thin drifting fog ribbons keep the void alive without hiding hazards.
 for(let i=0;i<3;i++){ctx.strokeStyle=theme.light+"0d";ctx.lineWidth=18+i*8;ctx.beginPath();ctx.moveTo(-50,390+i*60);ctx.bezierCurveTo(W*.3,330+i*65+Math.sin(t*.5+i)*20,W*.7,510-i*30,W+50,390+i*45);ctx.stroke();}
}
function platform(ctx,f,t,i,theme){
 const w=f.x2-f.x1,mid=(f.x1+f.x2)/2;
 glow(ctx,mid,f.y+12,Math.min(120,w*.6),theme.light+"18");
 polygon(ctx,[[f.x1,f.y+6],[f.x2,f.y+6],[f.x2-19,f.y+36],[mid+29,f.y+66],[mid+7,f.y+104],[mid-29,f.y+66],[f.x1+17,f.y+38]],theme.stone,"#869abb44");
 polygon(ctx,[[f.x1+18,f.y+18],[mid,f.y+33],[mid+7,f.y+104],[mid-29,f.y+66]],"#08132299");
 polygon(ctx,[[mid,f.y+33],[f.x2-19,f.y+17],[mid+29,f.y+66],[mid+7,f.y+104]],"#657a9827");
 ctx.fillStyle=theme.edge;ctx.shadowColor=theme.edge;ctx.shadowBlur=9;ctx.fillRect(f.x1,f.y,w,4);ctx.shadowBlur=0;
 ctx.fillStyle="#e8ffffaa";ctx.fillRect(f.x1+9,f.y+6,w-18,1);ctx.strokeStyle=theme.light+"66";ctx.lineWidth=1;
 for(let j=0;j<3;j++){const x=mid-25+j*25;ctx.beginPath();ctx.moveTo(x-4,f.y+17);ctx.lineTo(x+2,f.y+24);ctx.lineTo(x-3,f.y+32);ctx.stroke();}
 ctx.save();ctx.translate(mid+Math.sin(t+i)*4,f.y+122);ctx.rotate(t*.2+i);polygon(ctx,[[0,-7],[4,0],[0,8],[-4,0]],theme.light+"77");ctx.restore();
}
function laser(ctx,b,t,theme){
 const y1=b.y1??90,y2=b.y2??430;
 if(b.warning){ctx.strokeStyle="#ffdd9799";ctx.lineWidth=1.5;ctx.setLineDash([5,9]);ctx.lineDashOffset=-t*35;ctx.beginPath();ctx.moveTo(b.x,y1);ctx.lineTo(b.x,y2);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
  ctx.strokeStyle="#ffe3ae";ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,y1,8+b.warning*15,-t*6,Math.PI*1.6-t*6);ctx.stroke();
 }else{glow(ctx,b.x,y2,45,"#fdb0ff88");const g=ctx.createLinearGradient(b.x-22,0,b.x+22,0);g.addColorStop(0,"#b258ff00");g.addColorStop(.5,"#d17fff99");g.addColorStop(1,"#b258ff00");ctx.fillStyle=g;ctx.fillRect(b.x-22,y1,44,y2-y1);
  ctx.strokeStyle="#d492ff";ctx.lineWidth=10+Math.sin(t*65)*2;ctx.beginPath();ctx.moveTo(b.x,y1);ctx.lineTo(b.x,y2);ctx.stroke();ctx.strokeStyle="#fff5ff";ctx.lineWidth=3;ctx.stroke();
  for(let i=0;i<4;i++){const a=t*20+i*Math.PI/2;ctx.fillStyle=theme.edge;ctx.fillRect(b.x+Math.cos(a)*19,y2-5+Math.sin(a)*8,3,3);}
 }
 polygon(ctx,[[b.x-9,y1-9],[b.x,y1-20],[b.x+9,y1-9],[b.x,y1+1]],"#201b3c",b.warning?"#ffd798":"#f2ceff");
}
export function drawPocketReality(ctx,p,{W=960,H=540,drawFlux,defeat=null,crystals=0}){
 const cx=Math.max(0,Math.min(p.width-W,p.x-340)),t=p.elapsed,exile=p.kind==="exile";
 const theme=exile?{sky:"#070915",mist:"#989bde",edge:"#ff9fcf",stone:"#343553",light:"#b7c9ff"}:THEMES[p.index];
 ctx.save();background(ctx,W,H,cx,t,theme,exile);ctx.translate(-cx,0);
 p.platforms.forEach((f,i)=>platform(ctx,f,t,i,theme));
 for(const e of p.enemies){glow(ctx,e.x,e.y,35,e.warning?"#ff946766":"#be71ff33");ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.sin(t*3+e.phase)*.12);
  polygon(ctx,[[-26,-9],[-12,-4],[-7,10],[-23,4]],theme.stone,theme.light);polygon(ctx,[[26,-9],[12,-4],[7,10],[23,4]],theme.stone,theme.light);
  polygon(ctx,[[0,-17],[14,0],[0,17],[-14,0]],"#271932",e.warning?"#ffc58a":"#bf8cf4");ctx.fillStyle=e.warning?"#ffce99":"#f5ddff";ctx.fillRect(-6,-2,12,4);ctx.restore();
  if(e.warning){ctx.strokeStyle="#ffc79588";ctx.lineWidth=1;ctx.beginPath();ctx.arc(e.x,e.y,24,0,Math.PI*2*e.warning);ctx.stroke();}
 }
 for(const shot of p.shots){ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(Math.atan2(shot.vy,shot.vx));ctx.shadowColor="#e397ff";ctx.shadowBlur=10;polygon(ctx,[[9,0],[-5,-4],[-9,0],[-5,4]],"#fff0fc","#ca70ed");ctx.restore();}
 for(const beam of p.lasers)laser(ctx,beam,t,theme);
 if(!exile){const f=p.platforms.at(-1),x=f.x1+100,y=f.y-62;glow(ctx,x,y,75,"#ffda8c30");ctx.strokeStyle="#ffe1a5";ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,28,42,t*.5,0,Math.PI*2);ctx.stroke();drawMemoryCore(ctx,x,y,t,.9);}
 const pose=defeat?sampleDefeat(defeat):null;
 drawFlux?.({...p,...(pose?{x:pose.x,y:pose.y,defeat:pose}:{}),onGround:p.grounded,invulnerable:pose?0:p.invincible,animationPhase:t*12,rubro:p.rubro,sliding:false},{boost:p.boosting?1:0,run:1,turn:0,landing:0,takeoff:0,hit:0},t);
 if(!defeat)drawRubroAura(ctx,p.x,p.y,t,{active:p.rubro});ctx.restore();
 ctx.save();ctx.fillStyle="#080e21dd";ctx.beginPath();ctx.roundRect(W/2-250,13,500,57,12);ctx.fill();ctx.strokeStyle=theme.light+"55";ctx.lineWidth=1;ctx.stroke();ctx.textAlign="center";
 ctx.fillStyle=theme.edge;ctx.font="bold 15px system-ui";ctx.fillText(exile?"REALIDADE ESTILHAÇADA":p.trial.name.toUpperCase(),W/2,35);
 ctx.font="11px system-ui";ctx.fillStyle="#d4dff6";ctx.fillText((exile?"SOBREVIVA": "UMA TENTATIVA · EVITE TODO DANO")+" · "+Math.max(0,p.limit-t).toFixed(1)+"s",W/2,54);
 ctx.fillStyle=theme.edge;ctx.fillRect(W/2-225,65,450*Math.max(0,1-t/p.limit),2);
 drawDashCharge(ctx,dashIndicatorState({available:p.dashReady,active:p.dash>0,blocked:!!defeat}),188,37);
 ctx.textAlign="left";ctx.fillStyle="#080e21dd";ctx.beginPath();ctx.roundRect(12,13,135,46,10);ctx.fill();ctx.fillStyle="#eff5ff";ctx.font="bold 19px system-ui";ctx.fillText("◆ "+crystals,25,42);ctx.restore();
}

import {drawRubroAura} from "./rubro.js";
import {sampleDefeat} from "../game/defeat.js";
import {drawMemoryCore} from "./collectibles.js";
export function drawPocketReality(ctx,p,{W=960,H=540,drawFlux,defeat=null,crystals=0}){
 const cx=Math.max(0,Math.min(p.width-W,p.x-340)),t=p.elapsed;
 ctx.save();ctx.fillStyle=p.kind==="exile"?"#e6d3aa":"#170d35";ctx.fillRect(0,0,W,H);
 // Negative palette and fractured geometry make exile distinct from Origin/Echo.
 for(let i=0;i<18;i++){ctx.strokeStyle=p.kind==="exile"?"#382452":"#b581ff44";ctx.lineWidth=2;const x=(i*173-cx*.4)%(W+100);ctx.beginPath();ctx.moveTo(x,70);ctx.lineTo(x+40,210);ctx.lineTo(x-20,320);ctx.lineTo(x+35,H);ctx.stroke();}
 ctx.translate(-cx,0);
 for(const floor of p.platforms){ctx.fillStyle=p.kind==="exile"?"#312340":"#3c2457";ctx.fillRect(floor.x1,floor.y,floor.x2-floor.x1,100);ctx.fillStyle=p.kind==="exile"?"#dd3686":"#b7ffdf";ctx.fillRect(floor.x1,floor.y,floor.x2-floor.x1,7);}
 for(const beam of p.lasers){ctx.strokeStyle=p.kind==="exile"?beam.warning?"#603b85":"#82237c":beam.warning?"#dcc2ff":"#c16cff";ctx.lineWidth=beam.warning?2:12;ctx.setLineDash(beam.warning?[10,10]:[]);ctx.beginPath();ctx.moveTo(beam.x,85);ctx.lineTo(beam.x,445);ctx.stroke();ctx.setLineDash([]);}
 if(p.kind==="trial"){drawMemoryCore(ctx,1870,330,t,.9);ctx.font="bold 13px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffdb99";ctx.fillText("EFICIÊNCIA DE BOOST",1870,292);}
 const pose=defeat?sampleDefeat(defeat):null;
 drawFlux?.({...p,...(pose?{x:pose.x,y:pose.y,defeat:pose}:{}),onGround:p.grounded,invulnerable:pose?0:p.invincible,animationPhase:t*12,rubro:p.rubro,sliding:false},{boost:p.boosting?1:0,run:1,turn:0,landing:0,takeoff:0,hit:0},t);
 if(!defeat)drawRubroAura(ctx,p.x,p.y,t,{active:p.rubro});
 ctx.restore();ctx.fillStyle="rgba(8,12,30,.9)";ctx.fillRect(170,12,W-340,65);ctx.textAlign="center";ctx.fillStyle="#f4e7ff";ctx.font="bold 18px system-ui";ctx.fillText(p.kind==="exile"?"REALIDADE ESTILHAÇADA · SOBREVIVA":p.trial.name.toUpperCase(),W/2,38);ctx.font="bold 14px system-ui";ctx.fillText(Math.max(0,p.limit-p.elapsed).toFixed(1)+"s"+(p.kind==="trial"?" · SEM TOCAR NOS LASERS":""),W/2,61);ctx.textAlign="left";ctx.fillStyle="rgba(8,12,30,.9)";ctx.fillRect(12,12,135,50);ctx.fillStyle="#f4e7ff";ctx.font="bold 19px system-ui";ctx.fillText("◆ "+crystals,25,43);
}

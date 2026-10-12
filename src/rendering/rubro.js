import {drawMemoryCore} from "./collectibles.js";
import {RUBRO} from "../game/rubro.js";
export function drawRubroAura(ctx,x,y,t,state){
 if(!state.active&&!state.transformTime)return;
 ctx.save();ctx.strokeStyle="#ff456d";ctx.fillStyle="#ff466e22";ctx.lineWidth=3;
 ctx.beginPath();ctx.arc(x,y,29+Math.sin(t*15)*3,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(state.transformTime>0){const p=1-state.transformTime/RUBRO.transformSeconds;
  for(let i=0;i<9;i++){const angle=i*Math.PI*2/9+t*8,r=65-35*p;drawMemoryCore(ctx,x+Math.cos(angle)*r,y+Math.sin(angle)*r,t+i,.42);}
 }ctx.restore();
}

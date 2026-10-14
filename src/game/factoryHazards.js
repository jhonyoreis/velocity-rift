import {FACTORY} from '../levels/forestTwo.js';
import {circleRect,clamp} from './geometry.js';

export function forestZone(x){return x>=FACTORY.exit?8:x>=FACTORY.arenaLeft?7:x>=FACTORY.reactor?6:x>=FACTORY.canopy?5:x>=FACTORY.greenhouse?4:x>=FACTORY.assembly?3:x>=FACTORY.entrance?2:x>=FACTORY.yard?1:0;}
export function createFactoryState(x=0){return {furthestX:x,power:clamp((x-6200)/23500,0,1),shutdown:0,defeated:false};}
export function advanceFactory(state,x,defeated,dt){
 state.furthestX=Math.max(state.furthestX,x);state.defeated=defeated;
 const target=defeated?0:clamp((state.furthestX-6200)/23500,0,1);
 state.power+=(target-state.power)*(1-Math.exp(-dt*(defeated?.7:2)));
 if(defeated)state.shutdown+=dt;
}
export function conveyorCarry(floor,grounded,dt,disabled=false){return grounded&&!disabled&&floor?.kind==='factory-belt'?floor.belt*dt:0;}
export function createCargoLoads(world){return world.cargoLoads.map(c=>({...c,state:'idle',time:0,extension:0,impact:false}));}
export function advanceCargoLoad(c,player,dt,{warning=()=>{},impact=()=>{},crush=()=>{}}={},disabled=false){
 if(disabled){c.state='idle';c.time=0;c.extension=Math.max(0,c.extension-dt);return;}
 const previous=c.extension;
 if(c.state==='idle'){
  if(Math.abs(player.x-c.x)>c.trigger)return;
  c.state='warning';c.time=0;warning(c);
 }
 c.time+=dt;
 if(c.state==='warning'&&c.time>=c.delay){c.state='falling';c.time=0;}
 else if(c.state==='falling'){
  c.extension=Math.min(1,c.time/.28);
  if(c.extension===1){c.state='closed';c.time=0;impact(c);}
 }else if(c.state==='closed'&&c.time>=.7){c.state='rising';c.time=0;}
 else if(c.state==='rising'){
  c.extension=Math.max(0,1-c.time/.85);
  if(c.extension===0){c.state='cooldown';c.time=0;}
 }else if(c.state==='cooldown'&&c.time>=1.6){c.state='idle';c.time=0;}
 if(c.state==='falling'||c.state==='closed'){
  const oldTop=c.floor-240+166*previous,newTop=c.floor-240+166*c.extension;
  // Swept occupied volume catches the descending load even at high speed.
  if(circleRect(player.x,player.y,18,{x:c.x-c.w/2,y:Math.min(oldTop,newTop),w:c.w,h:c.h+Math.abs(newTop-oldTop)}))crush(c);
 }
}
export function ventState(v,time,disabled=false){
 const t=((time+v.phase)%v.period+v.period)%v.period;
 return {warning:!disabled&&t>=1.25&&t<2.15,active:!disabled&&t>=2.15&&t<3,progress:clamp((t-1.25)/.9,0,1)};
}
export function ventTouches(v,player,time,disabled=false){return ventState(v,time,disabled).active&&circleRect(player.x,player.y,18,{x:v.x-v.w/2,y:v.y-v.h,w:v.w,h:v.h});}

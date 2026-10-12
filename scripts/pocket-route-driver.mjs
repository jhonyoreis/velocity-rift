import {updatePocketReality} from "../src/game/pocketReality.js";
// Test pilot predicts warning cycles and executes only real player inputs.
export function createPocketRouteDriver(){
 let queue=[],lastTime=Infinity;
 return function inputs(p,dt=1/120){
  if(p.elapsed<lastTime)queue=[];lastTime=p.elapsed;
  if(p.kind==="exile"){const beam=p.lasers.find(b=>Math.abs(p.x-b.x)<150);const dir=beam?(p.x>=beam.x?1:-1):(p.x<480?1:-1);return new Set([p.x<65?"arrowright":p.x>895?"arrowleft":dir>0?"arrowright":"arrowleft"]);}
  if(queue.length)return new Set(queue.shift());
  const floorIndex=p.platforms.findIndex(f=>p.grounded&&p.x+18>=f.x1&&p.x-18<=f.x2&&Math.abs(p.y+18-f.y)<10);
  if(floorIndex<0)return new Set(["arrowright"]);
  const next=p.platforms[floorIndex+1];
  if(!next)return new Set(["arrowright"]);
  for(let wait=0;wait<=2.5;wait+=.1){
   const sim=structuredClone(p),plan=[];let jumped=false,jumpTime=0,landed=false,valid=true;
   for(let frame=0;frame<420;frame++){
    const keys=new Set(),time=frame*dt,target=(next.x1+next.x2)/2;
    if(time<wait){if(Math.abs(sim.vx)>30)keys.add(sim.vx>0?"arrowleft":"arrowright");}
    else{
     const delta=target-sim.x,speed=Math.min(440,Math.sqrt(2*660*Math.abs(delta)));
     if(delta>0)keys.add(sim.vx>speed?"arrowleft":"arrowright");else keys.add(sim.vx<-speed?"arrowright":"arrowleft");
     if(!jumped&&sim.x>p.platforms[floorIndex].x2-35){keys.add(" ");jumped=true;jumpTime=time;}
     else if(jumped&&time-jumpTime<.45)keys.add(" ");
    }
    plan.push([...keys]);const result=updatePocketReality(sim,dt,keys);
    if(result.done){if(result.won){queue=plan;return new Set(queue.shift());}valid=false;break;}
    if(jumped&&sim.grounded&&sim.x>next.x1-10){landed=true;if(Math.abs(sim.vx)<100&&Math.abs(sim.x-target)<50)break;}
   }
   if(valid&&landed){queue=plan;return new Set(queue.shift());}
  }
  // No safe launch in the prediction window: hold position and read the next cycle.
  return new Set(Math.abs(p.vx)>30?[p.vx>0?"arrowleft":"arrowright"]:[]);
 };
}

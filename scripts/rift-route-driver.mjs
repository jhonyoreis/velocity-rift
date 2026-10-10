// Deterministic input-only traversal. No teleport, invulnerability or state edits.
import {createOriginalRiftLayout,platformSurface} from "../src/levels/originalRift.js";
export function createRiftRouteDriver(){
 const world=createOriginalRiftLayout();let jumpAge=99,dashed=false,longJump=false;
 return function inputs(s,dt=1/120){
  const keys=new Set(["arrowright"]);
  const platforms=world.platforms.filter(p=>(p.dimension===-1||p.dimension===s.dimension)&&
   p.orientation===(s.gravity===1?"floor":"ceiling"));
  const p=platforms.find(p=>s.x>=p.x1-18&&s.x<=p.x2+18&&
   Math.abs(platformSurface(p,s.x,s.time)-(s.y+s.gravity*18))<60);
  const slope=p?(p.y2-p.y1)/(p.x2-p.x1):0;
  if(world.barricades.some(b=>b.x>s.x-40&&b.x<s.x+250)||
    world.enemies.some(e=>e.x>s.x-40&&e.x<s.x+160))keys.add("shift");
  if(((s.x>20700&&s.x<22500)||(s.x>33200&&s.x<35400))&&s.vx>580){
   keys.delete("arrowright");keys.add("arrowleft");keys.delete("shift");
  }
  if(s.grounded&&slope*s.gravity>0&&s.x>1100)keys.add("arrowdown");
  const gap=p&&p.x2-s.x<145&&!platforms.some(n=>n!==p&&n.x1<=p.x2+22&&n.x2>p.x2);
  const next=platforms.filter(n=>p&&n.x1>p.x2).sort((a,b)=>a.x1-b.x1)[0];
  const hazard=world.hazards.some(h=>h.x>s.x&&h.x-s.x<140);
  if(s.grounded&&(gap||hazard)){
   keys.delete("arrowdown");keys.add(" ");jumpAge=0;dashed=false;longJump=p&&next&&next.x1-p.x2>360;
  }else if(jumpAge<.2)keys.add(" ");
  else if(!s.grounded&&jumpAge>.27&&!dashed&&(s.x<20700||longJump)){
   keys.delete("arrowleft");keys.add("arrowright");keys.add(" ");dashed=true;
  }
  jumpAge+=dt;return keys;
 };
}

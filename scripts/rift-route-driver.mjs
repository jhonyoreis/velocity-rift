// Deterministic player inputs only: solve seals, read boss openings, never edit state.
import {createPocketRouteDriver} from "./pocket-route-driver.mjs";
import {createOriginalRiftLayout,platformSurface} from "../src/levels/originalRift.js";
const activeFor=(thing,dimension)=>thing.dimension===undefined||thing.dimension===-1||thing.dimension===dimension;
export function createRiftRouteDriver({collectExtras=false}={}){
 const pocketInputs=createPocketRouteDriver();
 const world=createOriginalRiftLayout();let jumpAge=99,dashed=false,interactAge=99,fastJump=false,extra=null,extraStep=0,extraExit=null,extraJump=false;
 return function inputs(s,dt=1/120){
  jumpAge+=dt;interactAge+=dt;
  if(s.pocket)return pocketInputs(s.pocket,dt);
  let target=48000,speed=440,needJump=false,needDash=false;
  const rune=world.runes.find(r=>!s.runes.includes(r.id));
  if(rune&&s.x>rune.x-600&&s.x<rune.x+600&&s.gravity===rune.gravity&&activeFor(rune,s.dimension)){
   target=rune.x;speed=250;needJump=Math.abs(s.x-target)<125;needDash=!s.grounded&&Math.abs(s.x-target)<125;
  }
  const anchor=world.anchors.find(a=>Math.abs(s.x-a.x)<500&&s.dimension!==a.dimension&&a.x>s.checkpoint.x-100);
  if(anchor){target=anchor.x;speed=240;}
  const boss=s.boss;
  if(boss.mode==="chase"||boss.mode==="arena"||boss.mode==="scarlet"){
   if(boss.mode==="scarlet"&&s.scarlet<=0){target=boss.resonance?.x??(s.x<45000?43650:45050);speed=450;}
   else if(boss.x>0){target=boss.x;speed=boss.mode==="chase"?560:boss.vulnerable?(440):(440);
    if(boss.mode==="chase"&&boss.cycleDamaged)target=s.x+1000;
    needJump=boss.vulnerable&&Math.abs(s.x-target)<(boss.mode==="scarlet"?(280):140);
    needDash=needJump&&!s.grounded&&jumpAge>.09;
   }
  }
  if(["dormant","chase"].includes(boss.mode)&&world.barricades.some(b=>b.x>s.x-40&&b.x<s.x+550)&&Math.abs(target-s.x)>300)speed=900;
  extraJump=false;
  if(collectExtras&&boss.mode==="dormant"&&s.gravity===1){
   if(extra&&s.secrets.includes(extra.id)){extraExit=world.cores[extra.core];extra=null;extraStep=0;}
   if(extraExit&&(!s.grounded||s.y<extraExit.y+130)){target=extraExit.x+200;speed=300;needJump=needDash=false;}
   else{
    extraExit=null;
    extra ||= world.trials.find(t=>!s.secrets.includes(t.id)&&s.dimension===world.cores[t.core].dimension&&s.x>t.x-550&&s.x<t.x+850&&(t.core!==2||s.runes.includes(5)));
    if(extra){
     const base=world.cores[extra.core].x-490,heights=[390,430,450],top=heights[extra.core]-extraStep*90;
     if(s.grounded&&s.y<=top-8&&extraStep<2)extraStep++;
     target=extraStep===2?world.cores[extra.core].x:base+75+extraStep*215;speed=380;
     needJump=s.grounded&&s.y>heights[extra.core]-extraStep*90-25&&Math.abs(s.x-target)<240;
     needDash=false;extraJump=true;
    }
   }
  }
  // Read the telegraph and leave the ray corridor before its lethal pulse.
  const ray=s.beams.find(b=>b.drainsAll&&b.life>0&&Math.abs(s.x-b.x1)<(380));
  const dangerMinion=["arena","scarlet"].includes(boss.mode)&&boss.minions.find(m=>!m.dead&&Math.abs(m.x-s.x)<200&&Math.abs(m.y-s.y)<90);
  if(dangerMinion&&!(boss.vulnerable&&(boss.mode!=="scarlet"||s.scarlet>0))){target=dangerMinion.x;needJump=s.grounded;needDash=!s.grounded&&s.dashReady;}
  if(ray&&["arena","scarlet"].includes(boss.mode)){target=ray.x1+(s.x>=ray.x1?1:-1)*(85);speed=220;needJump=boss.vulnerable&&ray.life<.3&&s.scarlet>0;needDash=false;}
  if(!needDash&&s.grounded&&["arena","scarlet"].includes(boss.mode)&&s.shots.some(p=>!p.orb&&Math.abs(p.x-s.x)<(100)&&Math.abs(p.y-s.y)<65&&(s.x-p.x)*p.vx>0))needJump=true;
  const delta=target-s.x,dir=delta>=0?1:-1,keys=new Set();
  if(Math.abs(delta)>20){
   if(s.vx*dir>speed)keys.add(dir>0?"arrowleft":"arrowright");
   else keys.add(dir>0?"arrowright":"arrowleft");
  }else if(Math.abs(s.vx)>30)keys.add(s.vx>0?"arrowleft":"arrowright");
  const platforms=world.platforms.filter(p=>(p.dimension===-1||p.dimension===s.dimension)&&p.orientation===(s.gravity===1?"floor":"ceiling"));
  const p=platforms.find(p=>s.x>=p.x1-18&&s.x<=p.x2+18&&Math.abs(platformSurface(p,s.x,s.time)-(s.y+s.gravity*18))<60);
  const slope=p?(p.y2-p.y1)/(p.x2-p.x1):0;
  if(["dormant","chase"].includes(boss.mode)&&Math.abs(delta)>300&&world.barricades.some(b=>b.x>s.x-40&&b.x<s.x+550))keys.add("shift");
  if(boss.mode==="dormant"&&s.grounded&&slope*s.gravity>0&&s.x>1100&&Math.abs(delta)>600)keys.add("arrowdown");
  if(extra&&!s.trials.some(t=>t.id===extra.id)&&Math.hypot(s.x-extra.x,s.y-extra.y)<120&&interactAge>.25){keys.add("arrowdown");interactAge=0;}
  if(anchor&&Math.abs(s.x-anchor.x)<80&&interactAge>.2){keys.add("arrowdown");interactAge=0;}
  const gap=p&&p.x2-s.x<65&&!platforms.some(n=>n!==p&&n.x1<=p.x2+22&&n.x2>p.x2&&Math.abs(platformSurface(n,p.x2,s.time)-platformSurface(p,p.x2,s.time))<30);
  const rise=p&&p.x2-s.x<130&&platforms.some(n=>n!==p&&Math.abs(n.x1-p.x2)<30&&(platformSurface(p,p.x2,s.time)-platformSurface(n,n.x1,s.time))*s.gravity>15);
  const hazard=world.hazards.some(h=>h.x>s.x&&h.x-s.x<120);
  const enemy=world.enemies.some(e=>(e.dimension===-1||e.dimension===s.dimension)&&["rift-laser","rift-triple"].includes(e.type)&&e.x>s.x-40&&e.x<s.x+145);
  if(anchor&&Math.abs(s.x-anchor.x)<170)needJump=needDash=false;
  const wall=world.barricades.some(b=>b.x>s.x-40&&b.x<s.x+180);
  needDash ||= (enemy||wall)&&!anchor;
  needJump ||= wall&&!anchor&&s.grounded;
  needJump ||= !extra&&!extraExit&&boss.mode==="dormant"&&(gap||rise||hazard||((enemy||wall)&&!anchor));
  if(s.grounded&&needJump&&jumpAge>.35){keys.delete("arrowdown");keys.add(" ");jumpAge=0;dashed=false;fastJump=!extra&&(dangerMinion||enemy||wall||needDash||(rune&&Math.abs(s.x-rune.x)<125));}
  else if(jumpAge<(extraJump?.34:fastJump?.025:boss.mode==="dormant"?.3:.2))keys.add(" ");
  else if(!extra&&!extraExit&&!s.grounded&&s.dashReady&&!dashed&&((needDash&&jumpAge>(fastJump?.06:.24))||(boss.mode==="dormant"&&jumpAge>(fastJump?.06:.36)))){
   // Horizontal Dash continues in the approach direction rather than braking.
   keys.delete(dir>0?"arrowleft":"arrowright");keys.add(dir>0?"arrowright":"arrowleft");keys.add(" ");dashed=true;
  }
  return keys;
 };
}

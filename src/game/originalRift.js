import {createOriginalRiftLayout,platformSurface,laserState,RIFT_WORLD_WIDTH,RIFT_FINISH_X,riftSectorAt} from "../levels/originalRift.js";
import {drawOriginalRift} from "../rendering/originalRift.js";
export const RIFT_CORE_REQUIREMENT=9;
export {RIFT_WORLD_WIDTH,RIFT_FINISH_X};
export const RIFT_RADIUS=18;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function countRiftKeys(campaign,fullTest=false){
 if(fullTest)return RIFT_CORE_REQUIREMENT;
 return [1,2,3].reduce((n,stage)=>{
  const ids=campaign?.extras?.cores?.["stage"+stage];
  return n+(Array.isArray(ids)?new Set(ids.filter(id=>Number.isInteger(id)&&id>=0&&id<3)).size:0);
 },0);
}
export function riftGateOpen(keys){return keys>=RIFT_CORE_REQUIREMENT;}
export function createOriginalRift({onExit=()=>{},onDeath=()=>{},onFinish=()=>{},drawFlux=null,
 isDebug=()=>false,boostCapacity=()=>100,onSound=()=>{}}={}){
 const layout=createOriginalRiftLayout();
 let s;
 const announce=(message,duration=2.5)=>{s.message=message;s.messageTime=duration;};
 function start(coreCount=0,bypass=false){
  s={active:true,cores:clamp(coreCount,0,9),bypass,gateOpened:riftGateOpen(coreCount)||bypass,
   x:180,y:422,vx:0,vy:0,facing:1,gravity:1,dimension:0,grounded:false,
   jumpHeld:false,jumpBuffer:0,coyote:0,dashReady:true,dash:0,boosting:false,sliding:false,
   crystals:0,capacity:boostCapacity(),boost:boostCapacity()*.95,time:0,cameraX:0,cameraY:0,portalCooldown:0,
   invincible:0,checkpointIndex:-1,checkpoint:{x:180,y:422,gravity:1,dimension:0},
   message:"ALTAR DOS NOVE NÚCLEOS · "+clamp(coreCount,0,9)+"/9",messageTime:4,
   defeated:new Set(),broken:new Set(),collected:new Set(),seen:new Set(),
   finished:false,dead:false,finishedTime:0,apparitionTime:0,phaseFlash:0,gateTime:0,
   deaths:0,shots:[],shotTimers:new Map(),particles:[],visitedSectors:new Set(),
   distance:0,topSpeed:0,lastDamageLost:0};
  return info();
 }
 start();
 const activeInDimension=o=>o.dimension===undefined||o.dimension===-1||o.dimension===s.dimension;
 function surfacesAt(x,orientation,time=s.time){
  return layout.platforms.filter(p=>activeInDimension(p)&&p.orientation===orientation&&
   x+RIFT_RADIUS>p.x1&&x-RIFT_RADIUS<p.x2).map(p=>({p,y:platformSurface(p,x,time)}));
 }
 function burst(x,y,color,count=10){
  for(let i=0;i<count&&s.particles.length<90;i++)s.particles.push({x,y,
   vx:Math.cos(i*2.4)*130,vy:Math.sin(i*2.4)*110,life:.5,color});
 }
 function teleport(portal){
  const target=portal.target;
  burst(s.x,s.y,portal.color,16);
  Object.assign(s,target,{vx:clamp(Math.abs(s.vx),330,1080),vy:0,grounded:false,
   dash:0,dashReady:true,portalCooldown:1,phaseFlash:.65,facing:1});
  s.seen.add("portal:"+portal.id);onSound("portal-enter");
  burst(s.x,s.y,portal.color,16);
  announce(target.gravity<0?"GRAVIDADE INVERTIDA · PULE PARA LONGE DO TETO":"FENDA CONECTADA · IMPULSO PRESERVADO",3);
  // Snap the camera at teleportation instead of slowly crossing empty void.
  s.cameraX=clamp(s.x-365,0,RIFT_WORLD_WIDTH-960);
  s.cameraY=clamp(s.y-285,0,280);
 }
 function die(fell){
  if(s.dead||isDebug())return;
  s.lastDamageLost=s.crystals;s.crystals=0;s.dead=true;s.deaths++;
  s.vx=0;s.vy=0;s.boosting=false;s.dash=0;onSound("hit");onDeath(fell,s.lastDamageLost);
 }
 function damage(){
  if(s.invincible>0||isDebug()||s.dead)return;
  if(s.crystals===0){die(false);return;}
  s.crystals=Math.max(0,s.crystals-Math.min(s.crystals,Math.max(8,Math.ceil(s.crystals*.35))));
  s.invincible=1.25;s.vy=-260*s.gravity;s.grounded=false;s.dash=0;
  burst(s.x,s.y,"#ffa68b");onSound("hit");
 }
 function respawn(){
  if(!s.active)return;
  Object.assign(s,s.checkpoint,{vx:0,vy:0,grounded:false,dead:false,dash:0,
   dashReady:true,boost:0,invincible:1.8,portalCooldown:.5,jumpHeld:false,jumpBuffer:0,
   boosting:false,sliding:false,phaseFlash:.4});
  s.shots=[];s.shotTimers.clear();
  // The checkpoint reconstitutes the upcoming challenges and resource items.
  for(const i of s.collected)if(layout.items[i].x>=s.checkpoint.x)s.collected.delete(i);
  for(const i of s.defeated)if(layout.enemies[i].x>=s.checkpoint.x)s.defeated.delete(i);
  for(const i of s.broken)if(layout.barricades[i].x>=s.checkpoint.x)s.broken.delete(i);
  s.cameraX=clamp(s.x-365,0,RIFT_WORLD_WIDTH-960);s.cameraY=clamp(s.y-285,0,280);
  announce("CHECKPOINT · REALIDADE RESTAURADA");
 }
 function update(dt,keys){
  if(!s.active||s.dead)return;
  // Semi-fixed substeps prevent tunnelling during fast slides and air dashes.
  let remaining=Math.min(Math.max(dt,0),.1);
  while(remaining>0){const step=Math.min(remaining,1/120);tick(step,keys);remaining-=step;if(s.dead||!s.active)break;}
 }
 function tick(dt,keys){
  if(s.finished){s.finishedTime+=dt;return;}
  s.time+=dt;s.capacity=boostCapacity();if(isDebug())s.boost=s.capacity;
  for(const key of ["messageTime","portalCooldown","invincible","apparitionTime","phaseFlash"])
   s[key]=Math.max(0,s[key]-dt);
  s.gateTime=Math.min(1,s.gateTime+(s.gateOpened?dt*.6:0));
  for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
  s.particles=s.particles.filter(p=>p.life>0);
  const left=keys.has("arrowleft")||keys.has("a"),right=keys.has("arrowright")||keys.has("d");
  const jump=keys.has(" ")||keys.has("arrowup")||keys.has("w")||keys.has("k");
  const slide=keys.has("arrowdown")||keys.has("s");
  const pressed=jump&&!s.jumpHeld;s.jumpHeld=jump;
  s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);s.coyote=s.grounded?.1:Math.max(0,s.coyote-dt);
  if(left!==right)s.facing=left?-1:1;
  s.sliding=slide&&s.grounded;
  s.boosting=(keys.has("shift")||keys.has("j"))&&s.boost>0&&Math.abs(s.vx)>50;
  const under=s.grounded?surfacesAt(s.x,s.gravity===1?"floor":"ceiling")
   .find(p=>Math.abs(s.y+s.gravity*RIFT_RADIUS-p.y)<40):null;
  const accel=s.grounded?(s.sliding?260:1450):800;
  if(!s.dash){
   const priorSpeed=Math.abs(s.vx);
   if(left!==right)s.vx+=(left?-1:1)*accel*dt;
   else if(s.grounded)s.vx*=Math.exp(-(s.sliding?.65:7)*dt);
   if(s.boosting){s.vx+=s.facing*950*dt;s.boost=Math.max(0,s.boost-25*dt);}
   if(s.sliding&&under){
    const slope=(under.p.y2-under.p.y1)/(under.p.x2-under.p.x1);
    s.vx+=s.gravity*slope*2100*dt;
    if(slope*s.vx*s.gravity>0)s.vx*=Math.exp(.85*dt);
   }
   // Fast momentum decays smoothly when leaving a ramp or releasing Boost.
   const cap=s.sliding?1180:s.boosting?850:630;
   if(Math.abs(s.vx)>cap)s.vx=Math.sign(s.vx)*Math.min(Math.abs(s.vx),Math.max(cap,priorSpeed-120*dt));
   s.vx=clamp(s.vx,-1180,1180);
  }
  if(pressed){
   if(s.grounded||s.coyote>0){s.jumpBuffer=.12;}
   else if(s.dashReady){s.dash=.21;s.dashReady=false;s.vy=0;s.vx=s.facing*1080;onSound("air-dash");}
   else s.jumpBuffer=.12;
  }
  if(s.jumpBuffer>0&&(s.grounded||s.coyote>0)){
   s.vy=-690*s.gravity;s.grounded=false;s.coyote=0;s.jumpBuffer=0;onSound("jump");
  }
  const wasGrounded=s.grounded,prevX=s.x,prevY=s.y;
  s.dash=Math.max(0,s.dash-dt);
  if(s.dash<=0){
   s.vy=clamp(s.vy+2100*s.gravity*dt,-1300,1300);
   if(!jump&&s.vy*s.gravity<0)s.vy+=750*s.gravity*dt;
  }
  s.x=clamp(s.x+s.vx*dt,RIFT_RADIUS,RIFT_WORLD_WIDTH-RIFT_RADIUS);
  if(s.x<105&&s.vx<0){s.active=false;onExit();return;}
  if(!s.gateOpened&&s.x>425){s.x=425;s.vx=Math.min(0,s.vx);}
  s.y+=s.vy*dt;s.grounded=false;
  const orientation=s.gravity===1?"floor":"ceiling";
  const edge=s.y+s.gravity*RIFT_RADIUS;
  const candidates=surfacesAt(s.x,orientation).filter(({p,y})=>{
   const previousSurface=platformSurface(p,prevX,s.time-dt);
   const oldEdge=prevY+s.gravity*RIFT_RADIUS;
   const followsSlope=wasGrounded&&prevX+RIFT_RADIUS>=p.x1&&prevX-RIFT_RADIUS<=p.x2&&
    Math.abs(oldEdge-previousSurface)<15&&s.vy*s.gravity>=0;
   return followsSlope||(s.gravity===1?oldEdge<=y+9&&edge>=y-3&&s.vy>=0:
    oldEdge>=y-9&&edge<=y+3&&s.vy<=0);
  }).sort((a,b)=>Math.abs(edge-a.y)-Math.abs(edge-b.y));
  if(candidates.length){s.y=candidates[0].y-s.gravity*RIFT_RADIUS;s.vy=0;s.grounded=true;s.dashReady=true;}
  if(s.y>790||s.y<-165){if(isDebug())respawn();else die(true);return;}
  for(const portal of layout.portals)if(s.portalCooldown===0&&Math.abs(s.x-portal.x)<43&&Math.abs(s.y-portal.y)<86){teleport(portal);break;}
  for(const anchor of layout.anchors)if(Math.abs(s.x-anchor.x)<55&&Math.abs(s.y-anchor.y)<125&&s.dimension!==anchor.dimension){
   s.dimension=anchor.dimension;s.phaseFlash=.65;s.seen.add("anchor:"+anchor.x);
   onSound("portal-enter");announce(s.dimension?"DIMENSÃO ECO · SIGA AS PLATAFORMAS VIOLETAS":"DIMENSÃO ORIGEM · SIGA AS PLATAFORMAS CIANAS",3);
  }
  for(let i=0;i<layout.checkpoints.length;i++){
   const cp=layout.checkpoints[i];
   if(i>s.checkpointIndex&&s.gravity===cp.gravity&&s.dimension===cp.dimension&&
      Math.abs(s.x-cp.x)<70&&Math.abs(s.y-cp.y)<95){
    s.checkpointIndex=i;s.checkpoint={...cp};s.seen.add("checkpoint:"+i);
    announce("CHECKPOINT DIMENSIONAL");onSound("checkpoint");
   }
  }
  for(const x of layout.apparitions)if(s.x>x&&!s.seen.has("sovereign:"+x)){
   s.seen.add("sovereign:"+x);s.apparitionTime=4.6;
   announce(x>33000?"ALICIA ESTÁ ALÉM DESTA FENDA":"O SOBERANO OBSERVA A TRAVESSIA",3.5);
  }
  const sector=riftSectorAt(s.x);s.visitedSectors.add(sector.name);
  if(s.sector!==sector.name){s.sector=sector.name;if(s.messageTime<.5)announce(sector.name,3);}
  if(s.x>35000&&!s.seen.has("dash-trial")){
   s.seen.add("dash-trial");announce("MEMBRANA DO VAZIO · PULE E APERTE PULO NO AR PARA DASH",4);
  }
  const offensive=s.dash>0||(s.boosting&&Math.abs(s.vx)>470);
  layout.barricades.forEach((b,i)=>{
   if(s.broken.has(i)||s.x+RIFT_RADIUS<b.x||s.x-RIFT_RADIUS>b.x+b.w||s.y+RIFT_RADIUS<b.y||s.y-RIFT_RADIUS>b.y+b.h)return;
   if(b.type==="membrane"?s.dash>0:offensive){s.broken.add(i);burst(b.x,b.y+50,"#ffb7df",14);onSound("gate");}
   else{s.x=s.vx>0?b.x-RIFT_RADIUS:b.x+b.w+RIFT_RADIUS;s.vx=0;}
  });
  layout.enemies.forEach((e,i)=>{
   if(s.defeated.has(i)||!activeInDimension(e)||Math.abs(e.x-s.x)>1000)return;
   const point=enemyPosition(e,i,s.time);
   if(e.type==="sentinel"&&Math.abs(e.x-s.x)<680){
    let timer=s.shotTimers.get(i)??1.6;timer-=dt;
    if(timer<=0){
     const dir=s.x<point.x?-1:1;
     s.shots.push({x:point.x,y:point.y,vx:dir*335,vy:0,life:2.5,dimension:s.dimension});
     timer=2.1;
    }s.shotTimers.set(i,timer);
   }
   if(Math.hypot(s.x-point.x,s.y-point.y)<RIFT_RADIUS+(e.type==="crusher"?27:22)){
    if(offensive){s.defeated.add(i);s.crystals+=2;burst(point.x,point.y,"#ffbd8a",12);onSound("gate");}
    else damage();
   }
  });
  for(const shot of s.shots){
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   if(shot.dimension===s.dimension&&Math.hypot(s.x-shot.x,s.y-shot.y)<RIFT_RADIUS+7){damage();shot.life=0;}
  }
  s.shots=s.shots.filter(p=>p.life>0);
  if(s.dead)return;
  for(const h of layout.hazards){
   if(Math.abs(h.x-s.x)>1000)continue;
   const active=h.type==="spikes"||laserState(h,s.time)==="active";
   if(active&&s.x+RIFT_RADIUS>h.x&&s.x-RIFT_RADIUS<h.x+h.w&&s.y+RIFT_RADIUS>h.y&&s.y-RIFT_RADIUS<h.y+h.h)damage();
  }
  if(s.dead)return;
  for(const item of layout.items){
   if(s.collected.has(item.id)||!activeInDimension(item)||Math.abs(s.x-item.x)>36)continue;
   const y=item.y+(item.motion?Math.sin(s.time*1.6+item.platform)*item.motion:0);
   if(Math.abs(s.y-y)<52){
    s.collected.add(item.id);
    if(item.type==="boost"){s.boost=Math.min(boostCapacity(),s.boost+45);onSound("orb");}
    else s.crystals++;
   }
  }
  s.distance=Math.max(s.distance,s.x);s.topSpeed=Math.max(s.topSpeed,Math.abs(s.vx));
  if(s.x>=RIFT_FINISH_X&&!s.dead){s.finished=true;s.boosting=false;s.vx=0;s.vy=0;announce("LIMIAR ALCANÇADO",4);onSound("finish");onFinish(info());}
  const targetX=clamp(s.x-960*(s.facing>0?.38:.62),0,RIFT_WORLD_WIDTH-960);
  s.cameraX+=(targetX-s.cameraX)*Math.min(1,9*dt);
  s.cameraY+=(clamp(s.y-297,0,280)-s.cameraY)*Math.min(1,7*dt);
 }
 function info(){return {...s,defeated:s.defeated.size,broken:s.broken.size,collected:s.collected.size,
  seen:[...s.seen],visitedSectors:[...s.visitedSectors],progress:Math.round(clamp(s.distance/RIFT_FINISH_X,0,1)*100),
  sector:riftSectorAt(s.x).name};}
 return {start,stop(){s.active=false;},respawn,update,info,
  draw(ctx,W=960,H=540){drawOriginalRift(ctx,s,layout,{W,H,drawFlux});},
  get active(){return s.active;},get musicSection(){return s.finished?5:s.apparitionTime>0?4:riftSectorAt(s.x).music;}};
}
export function enemyPosition(e,i,time){
 const x=e.x+Math.sin(time*1.9+i)*e.range;
 const y=e.y+(e.type==="wraith"?Math.sin(time*2.7+i)*32:e.type==="crusher"?-e.gravity*Math.max(0,Math.sin(time*2+i))*48:0);
 return {x,y};
}

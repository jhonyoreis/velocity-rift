import {dashIndicatorState} from "./combatReadability.js";
import {createPocketReality,updatePocketReality} from "./pocketReality.js";
import {createDefeat,sampleDefeat} from "./defeat.js";
import {RUBRO,createRubroState,updateRubro,resetRubro,rubroCanBreak} from "./rubro.js";
import {calculateCrystalDamage} from "./crystals.js";
import {createVictorySequence,sampleVictorySequence} from "./victorySequence.js";
import {FLUX_MOTION as M} from "./fluxMotion.js";
import {createOriginalRiftLayout,platformSurface,laserState,RIFT_WORLD_WIDTH,RIFT_FINISH_X,riftSectorAt} from "../levels/originalRift.js";
import {createSovereign,advanceSovereign,hitSovereign,enemyCanBeDestroyed,shotFan,distanceToBeam,CHASE,SOVEREIGN_ARENA,steerRiftOrb} from "../bosses/sovereign.js";
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
 isDebug=()=>false,boostCapacity=()=>100,boostPower=()=>1,boostDrain=()=>1,onSound=()=>{},onStory=null,onCore=()=>{},onSecret=()=>{},onFrame=()=>{},drawSovereign=null,drawAlicia=null,ghostAt=()=>null,rubroState=createRubroState(),coreSlots=()=>null}={}){
 const layout=createOriginalRiftLayout();
 let s;
 const announce=(message,duration=2.5)=>{s.message=message;s.messageTime=duration;};
 function start(coreCount=0,bypass=false){
  s={active:true,cores:clamp(coreCount,0,9),bypass,gateOpened:riftGateOpen(coreCount)||bypass,
   coreSlots:coreSlots()||Array.from({length:9},(_,i)=>i<coreCount),failedTrials:new Set(),victory:null,pocket:null,pocketCooldown:0,
   x:180,y:422,vx:0,vy:0,facing:1,gravity:1,dimension:0,grounded:false,
   jumpHeld:false,jumpBuffer:0,coyote:0,dashReady:true,dash:0,boosting:false,sliding:false,
   crystals:0,capacity:boostCapacity(),boost:boostCapacity()*.95,time:0,cameraX:0,cameraY:0,portalCooldown:0,
   invincible:0,checkpointIndex:-1,checkpoint:{x:180,y:422,gravity:1,dimension:0},
   message:"",messageTime:0,
   defeated:new Set(),broken:new Set(),collected:new Set(),seen:new Set(),
   finished:false,dead:false,finishedTime:0,apparitionTime:0,phaseFlash:0,gateTime:0,
   deaths:0,shots:[],beams:[],shotTimers:new Map(),particles:[],visitedSectors:new Set(),
   distance:0,topSpeed:0,lastDamageLost:0,damageCount:0,scarlet:0,boss:createSovereign(),
   runes:new Set(),runCores:new Set(),secrets:new Set(),trials:new Map(),interactHeld:false,
   story:null,storyNext:null,chaseDone:false,arenaStarted:false,awakened:false,gravityWarning:0,animationPhase:0,ghosts:[],ghostTimer:0,ground:null,boostTrail:[],boostSpark:0,trialContacts:new Set(),defeat:null,fx:{run:0,boost:0,turn:0,landing:0,takeoff:0,hit:0},previousFacing:1};
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
   dash:0,dashReady:true,portalCooldown:1,phaseFlash:.65,facing:1,invincible:Math.max(s.invincible,.35)});
  s.seen.add("portal:"+portal.id);onSound("portal-enter");
  burst(s.x,s.y,portal.color,16);
  announce(target.gravity<0?"GRAVIDADE INVERTIDA · PULE PARA LONGE DO TETO":"FENDA CONECTADA · IMPULSO PRESERVADO",3);
  // Snap the camera at teleportation instead of slowly crossing empty void.
  s.cameraX=clamp(s.x-365,0,RIFT_WORLD_WIDTH-960);
  s.cameraY=clamp(s.y-285,0,280);
 }
 function enterPocket(kind,trial=null){
  const returnPose={x:s.x,y:s.y,vx:0,vy:0,facing:s.facing,gravity:s.gravity,dimension:s.dimension,grounded:s.grounded};
  s.pocket=createPocketReality(kind,{trial,returnPose,rubro:s.rubro||s.scarlet>0});
  s.boosting=false;s.dash=0;s.shots=[];s.beams=[];s.boostTrail=[];s.ghosts=[];
  if(trial)s.trials.set(trial.id,{elapsed:0});onSound("portal-enter");
 }
 function updatePocket(dt,keys){
  const p=s.pocket;s.invincible=Math.max(0,s.invincible-dt);p.rubro=rubroState.active||s.scarlet>0;s.time+=dt;const result=updatePocketReality(p,dt,keys);
  if(p.trial)s.trials.set(p.trial.id,{elapsed:p.elapsed});
  if(result.hit){damage();if(s.dead)return;}
  if(!result.done)return;
  Object.assign(s,p.returnPose,{invincible:Math.max(s.invincible,1),pocketCooldown:1.2,phaseFlash:.65});s.pocket=null;
  if(p.trial){s.trials.delete(p.trial.id);if(result.won){s.secrets.add(p.trial.id);s.runCores.add(p.trial.core);onCore(p.trial.core);onSecret(p.trial.id,p.elapsed);onSound("secret-win");announce("DESAFIO CONCLUÍDO · CONSUMO DE BOOST −8%",4);}else{s.failedTrials.add(p.trial.id);onSound("portal-enter");announce("DESAFIO PERDIDO · INDISPONÍVEL NESTA TENTATIVA",4);}}
  else{onSound("portal-enter");announce("DE VOLTA À REALIDADE · O SOBERANO AGUARDA",3);}
 }
 function die(fell){
  if(s.dead||isDebug())return;
  s.defeat=createDefeat({x:s.pocket?s.pocket.x:s.x,y:s.pocket?s.pocket.y:clamp(s.y,s.cameraY+70,s.cameraY+475),facing:s.facing,rubro:rubroState.active||s.scarlet>0,fall:fell,lost:s.crystals});
  s.lastDamageLost=s.crystals;s.crystals=0;s.dead=true;s.deaths++;s.damageCount++;
  resetRubro(rubroState);s.vx=0;s.vy=0;s.boosting=false;s.dash=0;onSound("hit");
 }
 function damage(all=false,absolute=false){
  if(s.invincible>0||isDebug()||s.dead)return;
  if(s.crystals===0){die(false);return;}
  s.damageCount++;s.crystals=all&&(absolute||!rubroState.active)?0:calculateCrystalDamage(s.crystals,{rubro:rubroState.active,baseFraction:.35,baseMinimum:8}).remaining;
  if(s.crystals===0)resetRubro(rubroState);
  // Same hit reaction as the other campaign stages. Only the vertical
  // direction changes under inverted gravity; enemies and arena stay intact.
  s.fx.hit=1;s.invincible=1.1;
  s.vx=-s.facing*250;
  s.vy=-450*s.gravity;
  s.grounded=false;s.dash=0;
  burst(s.x,s.y,"#ffa68b");onSound("hit");
 }
 function respawn(){
  if(!s.active)return;
  resetRubro(rubroState);s.pocket=null;
  Object.assign(s,s.checkpoint,{vx:0,vy:0,grounded:false,dead:false,defeat:null,dash:0,
   dashReady:true,boost:0,invincible:1.8,portalCooldown:.5,jumpHeld:false,jumpBuffer:0,
   boosting:false,sliding:false,phaseFlash:.4});
  s.shots=[];s.beams=[];s.boostTrail=[];s.trialContacts.clear();s.shotTimers.clear();s.trials.clear();
  if(s.checkpoint.x>=43000){s.boss=createSovereign();s.boss.mode=s.awakened?"scarlet":"arena";s.boss.hp=s.boss.maxHp=s.awakened?6:5;s.boss.resonanceClock=4.5;s.scarlet=s.awakened?7.5:0;}
  else if(!s.chaseDone&&s.checkpoint.x>=20000){s.boss=createSovereign();s.boss.mode="chase";s.boss.barrierX=s.x-500;}
  else s.boss=createSovereign();
  // The checkpoint reconstitutes the upcoming challenges and resource items.
  for(const i of s.collected)if(layout.items[i].x>=s.checkpoint.x)s.collected.delete(i);
  for(const i of s.defeated)if(layout.enemies[i].x>=s.checkpoint.x)s.defeated.delete(i);
  for(const i of s.broken)if(layout.barricades[i].x>=s.checkpoint.x)s.broken.delete(i);
  s.cameraX=clamp(s.x-365,0,RIFT_WORLD_WIDTH-960);s.cameraY=clamp(s.y-285,0,280);
  announce("CHECKPOINT · REALIDADE RESTAURADA");
 }
 function update(dt,keys){
  if(!s.active||s.story)return;
  if(s.dead){if(s.defeat&&!s.defeat.notified){s.defeat.elapsed+=Math.min(.1,Math.max(0,dt));if(sampleDefeat(s.defeat).done){s.defeat.notified=true;onDeath(s.defeat.fall,s.defeat.lost);}}return;}
  // Semi-fixed substeps prevent tunnelling during fast slides and air dashes.
  let remaining=Math.min(Math.max(dt,0),.1);
  while(remaining>0){const step=Math.min(remaining,1/120);tick(step,keys);remaining-=step;if(s.dead||!s.active||s.story)break;}
 }
 function tick(dt,keys){
  if(s.finished){s.finishedTime+=dt;return;}
  if(s.victory){
   s.victory.elapsed+=dt;const pose=sampleVictorySequence(s.victory);
   s.x=pose.x;s.y=pose.y;s.vx=pose.moving?pose.facing*420:0;s.vy=0;s.facing=pose.facing;s.gravity=1;s.grounded=s.y>=632;
   s.animationPhase+=Math.abs(s.vx)*dt*.049;s.fx.run=Number(pose.moving);s.boosting=false;s.sliding=false;s.dash=0;
   s.cameraX+=(clamp(s.x-365,0,RIFT_WORLD_WIDTH-960)-s.cameraX)*Math.min(1,5*dt);s.cameraY+=(clamp(s.y-297,0,280)-s.cameraY)*Math.min(1,5*dt);
   if(pose.done){s.finished=true;onFinish(info());}return;
  }
  updateRubro(rubroState,dt,s.crystals);
  if(rubroState.transformTime>0){s.transformClock=(s.transformClock||0)+dt;s.transformTime=rubroState.transformTime;return;}
  s.rubro=rubroState.active;s.transformTime=0;
  if(s.pocket){updatePocket(dt,keys);return;}
  s.time+=dt;s.capacity=boostCapacity();if(isDebug())s.boost=s.capacity;
  for(const key of ["messageTime","portalCooldown","invincible","apparitionTime","phaseFlash","scarlet","gravityWarning","pocketCooldown"])
   s[key]=Math.max(0,s[key]-dt);
  s.gateTime=Math.min(1,s.gateTime+(s.gateOpened?dt*.6:0));
  for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
  s.particles=s.particles.filter(p=>p.life>0);
  const left=keys.has("arrowleft")||keys.has("a"),right=keys.has("arrowright")||keys.has("d");
  const jump=keys.has(" ")||keys.has("arrowup")||keys.has("w")||keys.has("k");
  const slide=keys.has("arrowdown")||keys.has("s");
  const interact=(slide||keys.has("x"))&&!s.interactHeld;s.interactHeld=slide||keys.has("x");
  const pressed=jump&&!s.jumpHeld;s.jumpHeld=jump;
  s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);s.coyote=s.grounded?.11:Math.max(0,s.coyote-dt);
  if(left!==right)s.facing=left?-1:1;
  s.sliding=slide&&s.grounded;
  s.boosting=(keys.has("shift")||keys.has("j"))&&!s.dash&&s.boost>0&&Math.abs(s.vx)>50;
  const under=s.grounded?surfacesAt(s.x,s.gravity===1?"floor":"ceiling")
   .find(p=>Math.abs(s.y+s.gravity*RIFT_RADIUS-p.y)<40):null;
  const accel=s.grounded?(s.sliding?M.slideAcceleration:M.groundAcceleration):M.airAcceleration;
  if(!s.dash){
   const priorSpeed=Math.abs(s.vx);
   if(left!==right)s.vx+=(left?-1:1)*accel*dt;
   else if(s.grounded){const friction=(s.sliding?M.slideFriction:M.groundFriction)*dt;s.vx=Math.sign(s.vx)*Math.max(0,Math.abs(s.vx)-friction);}
   if(s.boosting){s.vx+=s.facing*M.boostAcceleration*dt*boostPower()*(s.rubro?RUBRO.boost:1);s.boost=Math.max(0,s.boost-M.boostDrain*boostDrain()*dt);}
   const slope=under?(under.p.y2-under.p.y1)/(under.p.x2-under.p.x1)*s.gravity:0;
   const downhill=s.sliding&&s.grounded&&slope*s.vx>0.001;
   if(downhill){const rate=.62+Math.min(Math.abs(slope),.35)*2.4;s.vx=Math.sign(s.vx)*Math.min(M.slideCap*(s.rubro?RUBRO.speed:1),Math.abs(s.vx)*Math.exp(rate*dt));}
   const cap=s.boosting?M.boostSpeed*boostPower()*(s.rubro?RUBRO.boost:1):M.normalSpeed*(s.rubro?RUBRO.speed:1);
   if(!downhill&&Math.abs(s.vx)>cap){const braking=s.sliding?880:1800;s.vx=Math.sign(s.vx)*Math.min(Math.abs(s.vx),Math.max(cap,priorSpeed-braking*dt));}
  }
  if(pressed){
   if(s.grounded||s.coyote>0){s.jumpBuffer=.12;}
   else if(s.dashReady){s.dashFacing=s.facing;s.dash=M.dashSeconds;s.dashReady=false;s.vy=0;s.vx=s.facing*M.dashSpeed*(s.rubro?RUBRO.dash:1);onSound("air-dash");}
   else s.jumpBuffer=.12;
  }
  if(s.jumpBuffer>0&&(s.grounded||s.coyote>0)){
   s.fx.takeoff=1;s.vy=-(M.jumpSpeed+Math.min(90,Math.abs(s.vx)*.09))*(s.rubro?RUBRO.jump:1)*s.gravity;s.grounded=false;s.coyote=0;s.jumpBuffer=0;onSound("jump");
  }
  const wasGrounded=s.grounded,prevX=s.x,prevY=s.y;
  s.ground=null;
  if(s.dash>0){s.facing=s.dashFacing;s.vx=s.dashFacing*M.dashSpeed*(s.rubro?RUBRO.dash:1);s.vy=0;}
  const wasDashing=s.dash>0;
  s.dash=Math.max(0,s.dash-dt);
  if(wasDashing&&!s.dash)s.vx=s.dashFacing*M.dashExitSpeed;
  if(s.dash<=0){
   if(!jump&&s.vy*s.gravity<-160)s.vy+=M.jumpCut*s.gravity*dt;
   s.vy=clamp(s.vy+M.gravity*s.gravity*dt,-M.terminalSpeed,M.terminalSpeed);
  }
  s.x=clamp(s.x+s.vx*dt,RIFT_RADIUS,RIFT_WORLD_WIDTH-RIFT_RADIUS);
  if(s.boss.mode==="arena"||s.boss.mode==="scarlet"||s.boss.mode==="invincible")s.x=clamp(s.x,SOVEREIGN_ARENA.left+35,SOVEREIGN_ARENA.right-35);
  if(!s.chaseDone&&s.x>CHASE.end){s.x=CHASE.end;s.vx=Math.min(0,s.vx);}
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
  if(candidates.length){s.ground={...candidates[0].p,y1:candidates[0].p.y1*s.gravity,y2:candidates[0].p.y2*s.gravity};s.y=candidates[0].y-s.gravity*RIFT_RADIUS;s.vy=0;s.grounded=true;s.dashReady=true;}
  if(s.y>790||s.y<-165){if(isDebug())respawn();else die(true);return;}
  for(const portal of layout.portals)if(s.portalCooldown===0&&Math.abs(s.x-portal.x)<43&&Math.abs(s.y-portal.y)<86){
   const required=portal.id==="b"?0:portal.id==="e"?4:null;
   if(required!==null&&!s.runes.has(required)){s.x=portal.x-45;s.vx=Math.min(0,s.vx);if(s.messageTime<.5)announce("A FENDA EXIGE O SELO DO TETO · VOLTE E ATIVE COM DASH",4);}
   else teleport(portal);break;
  }
  for(const anchor of layout.anchors)if(interact&&Math.abs(s.x-anchor.x)<55&&Math.abs(s.y-anchor.y)<125 ){
   s.dimension=1-s.dimension;s.phaseFlash=.65;s.seen.add("anchor:"+anchor.x);
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
  for(const rune of layout.runes)if(!s.runes.has(rune.id)&&activeInDimension(rune)&&s.gravity===rune.gravity&&s.dash>0&&Math.hypot(s.x-rune.x,s.y-rune.y)<57){
   s.runes.add(rune.id);s.invincible=Math.max(s.invincible,.3);burst(rune.x,rune.y,"#ffdfa1",18);onSound("secret-win");announce("SELO ATIVADO · "+rune.label);
  }
  for(const gate of layout.gates)if(!gate.requires.every(id=>s.runes.has(id))&&s.x+18>gate.x&&prevX<gate.x+18){
   s.x=gate.x-18;s.vx=Math.min(0,s.vx);
   if(s.messageTime<.4)announce(gate.label+" · ATIVE OS DOIS SÍMBOLOS COM DASH",4);
  }
  for(const trial of layout.trials){
   const near=activeInDimension(layout.cores[trial.core])&&Math.hypot(s.x-trial.x,s.y-trial.y)<55;
   if(!near)s.trialContacts.delete(trial.id);
   if(s.secrets.has(trial.id)||s.failedTrials.has(trial.id)||s.pocketCooldown>0)continue;
   if(near&&!s.trialContacts.has(trial.id)){s.trialContacts.add(trial.id);enterPocket("trial",trial);return;}
  }
  if(!s.chaseDone&&s.x>=CHASE.start&&s.boss.mode==="dormant"){
   s.boss.mode="chase";s.boss.barrierX=s.x-500;story("sovereignChase",()=>announce("5 ACERTOS COM DASH · A BARREIRA CONSOME TODOS OS CRISTAIS",5));return;
  }
  if(!s.arenaStarted&&s.x>=SOVEREIGN_ARENA.left){
   resetRubro(rubroState);s.rubro=false;
   s.arenaStarted=true;s.checkpoint={x:43250,y:632,gravity:1,dimension:0};s.checkpointIndex=10;
   s.boss=createSovereign();s.boss.mode="arena";s.boost=s.capacity;
   story("arenaIntro",()=>announce("DESVIE DO ATAQUE · DASH NO NÚCLEO QUANDO ELE ABRIR",5));return;
  }
  bossTick(dt);if(s.story||s.finished||s.dead||s.victory)return;
  const empowered=rubroCanBreak(rubroState,s.boosting,s.dash>0);
  const offensive=empowered||s.dash>0||(s.boosting&&Math.abs(s.vx)>470);
  layout.barricades.forEach((b,i)=>{
   if(s.broken.has(i)||s.x+RIFT_RADIUS<b.x||s.x-RIFT_RADIUS>b.x+b.w||s.y+RIFT_RADIUS<b.y||s.y-RIFT_RADIUS>b.y+b.h)return;
   if(empowered||(b.type==="membrane"?s.dash>0:offensive)){s.broken.add(i);burst(b.x,b.y+50,"#ffb7df",14);onSound("gate");}
   else{s.x=s.vx>0?b.x-RIFT_RADIUS:b.x+b.w+RIFT_RADIUS;s.vx=0;}
  });
  layout.enemies.forEach((e,i)=>{
   if(s.defeated.has(i)||!activeInDimension(e)||Math.abs(e.x-s.x)>1000)return;
   const point=enemyPosition(e,i,s.time);
   if((e.type==="rift-triple"||e.type==="rift-laser")&&Math.abs(e.x-s.x)<700){
    let timer=s.shotTimers.get(i)??1.5;timer-=dt;
    if(timer<=0){
     if(e.type==="rift-triple")s.shots.push(...shotFan(point.x,point.y,s,3,360).map(p=>({...p,dimension:s.dimension})));
     else{const dx=s.x-point.x,dy=s.y-point.y,len=Math.hypot(dx,dy)||1;s.beams.push({x1:point.x,y1:point.y,x2:point.x+dx/len*850,y2:point.y+dy/len*850,warning:.85,life:1.45,dimension:s.dimension,unblockable:true});}
     timer=e.type==="rift-laser"?3.6:2.7;
    }s.shotTimers.set(i,timer);
   }
   if(Math.hypot(s.x-point.x,s.y-point.y)<RIFT_RADIUS+(e.type==="crusher"?27:22)){
    if(empowered||enemyCanBeDestroyed(e,s)){s.defeated.add(i);s.crystals+=2;burst(point.x,point.y,"#ffbd8a",12);onSound("gate");}
    else damage();
   }
  });
  for(const shot of s.shots){
   if(shot.orb)steerRiftOrb(shot,s,dt);
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   if(activeInDimension(shot)&&Math.hypot(s.x-shot.x,s.y-shot.y)<RIFT_RADIUS+(shot.orb?17:7)){if(shot.orb){enterPocket("exile");return;}if(empowered)burst(shot.x,shot.y,"#ff6486",5);else damage();shot.life=0;}
  }
  s.shots=s.shots.filter(p=>p.life>0);
  for(const beam of s.beams){beam.life-=dt;beam.warning=Math.max(0,beam.warning-dt);if(!beam.warning&&activeInDimension(beam)&&distanceToBeam(s.x,s.y,beam)<24){if(beam.drainsAll)damage(true,true);else if(empowered)beam.life=0;else damage();}}
  s.beams=s.beams.filter(b=>b.life>0);
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
  for(const dot of s.boostTrail)dot.life-=dt;
  s.boostTrail=s.boostTrail.filter(dot=>dot.life>0).slice(-24);
  if(s.boosting)s.boostTrail.push({x:s.x,y:s.y,life:.24,rubro:s.rubro||s.scarlet>0});
  s.boostSpark-=dt;
  if(s.boosting&&s.boostSpark<=0){burst(s.x-s.facing*15,s.y+5,s.rubro||s.scarlet>0?"#ff456d":"#79ffff",2);s.boostSpark=.065;}
  for(const ghost of s.ghosts)ghost.life-=dt;
  s.ghosts=s.ghosts.filter(g=>g.life>0).slice(-10);
  s.ghostTimer-=dt;
  if((Math.abs(s.vx)>415||s.boosting)&&s.ghostTimer<=0){
   s.ghosts.push({x:s.x,y:s.y,facing:s.facing,sliding:s.sliding,boosting:s.boosting,rubro:s.rubro||s.scarlet>0,life:.25});
   s.ghostTimer=s.boosting?.045:.075;
  }
  s.animationPhase+=Math.abs(s.vx)*dt*.049;
  const ease=1-Math.exp(-15*dt);
  s.fx.run+=((s.grounded&&Math.abs(s.vx)>60?clamp(Math.abs(s.vx)/480,0,1):0)-s.fx.run)*ease;
  s.fx.boost+=(Number(s.boosting)-s.fx.boost)*(1-Math.exp(-12*dt));
  for(const [key,rate] of [["landing",2.7],["takeoff",4.1],["turn",5],["hit",2.6]])s.fx[key]=Math.max(0,s.fx[key]-dt*rate);
  if(!wasGrounded&&s.grounded)s.fx.landing=1;
  if(s.previousFacing!==s.facing&&Math.abs(s.vx)>115)s.fx.turn=1;
  s.previousFacing=s.facing;
  s.distance=Math.max(s.distance,s.x);s.topSpeed=Math.max(s.topSpeed,Math.abs(s.vx));
  onFrame(s);
  const targetX=clamp(s.x-960*(s.facing>0?.38:.62),0,RIFT_WORLD_WIDTH-960);
  s.cameraX+=(targetX-s.cameraX)*Math.min(1,9*dt);
  s.cameraY+=(clamp(s.y-297,0,280)-s.cameraY)*Math.min(1,7*dt);
 }
 function story(key,next){s.story=key;s.storyNext=next;s.vx=0;s.vy=0;if(onStory)onStory(key);else resumeStory();}
 function resumeStory(){const next=s.storyNext;s.story=null;s.storyNext=null;next?.();}
 function bossTick(dt){
  const b=s.boss;
  if(b.mode==="invincible"){
   b.clock+=dt;b.waveRadius=Math.max(0,(b.clock-.5)*550);s.invincible=1;
   if(b.clock>4.5){s.awakened=true;story("awakening",()=>{
    s.boss=createSovereign();s.boss.mode="scarlet";s.boss.hp=s.boss.maxHp=6;
    s.scarlet=9;s.invincible=2;s.boost=s.capacity;announce("FLUX RUBRO · ATAQUE E RECOLHA A PRÓXIMA RESSONÂNCIA",5);
   });}return;
  }
  advanceSovereign(b,s,dt,{
   surfaceAt(x){const p=layout.platforms.find(p=>p.orientation==="floor"&&x>=p.x1&&x<=p.x2);return p?platformSurface(p,x,s.time):510;},
   warnAttack(kind){onSound("sovereign-"+kind);},
   warnGravity(){onSound("sovereign-gravity");s.gravityWarning=1;announce("O SOBERANO VAI INVERTER A GRAVIDADE · PREPARE O SALTO",2);},
   flipGravity(g){s.gravity=g;s.vy=0;s.grounded=false;s.dashReady=true;s.phaseFlash=.7;onSound("portal-enter");},
   barrierHit(){damage(true);announce("BARREIRA DA RUPTURA · TODOS OS CRISTAIS PERDIDOS",3);},
   awaken(){s.boost=s.capacity;burst(s.x,s.y,"#ff466e",20);onSound("boss-crack");announce("RESSONÂNCIA · FLUX RUBRO POR 7,5s",3);}
  });
  s.shots.push(...b.shots.splice(0));s.beams.push(...b.beams.splice(0));
  for(const m of b.minions){if(m.dead)continue;m.timer-=dt;
   if(m.timer<=0&&m.type==="rift-triple"){s.shots.push(...shotFan(m.x,m.y,s));m.timer=2.5;}
   if(Math.hypot(s.x-m.x,s.y-m.y)<42){if(rubroCanBreak(rubroState,s.boosting,s.dash>0)||enemyCanBeDestroyed(m,s)){m.dead=true;burst(m.x,m.y,"#ff9dda");s.crystals+=3;}else damage();}}
  b.minions=b.minions.filter(m=>!m.dead).slice(-3);
  if(b.mode==="dormant"||b.defeated)return;
  if(Math.hypot(s.x-b.x,s.y-b.y)<65){
   if(hitSovereign(b,s)){onSound("boss-hit");burst(b.x,b.y,"#fff0ac",25);s.invincible=.8;s.vx=-s.facing*210;
    announce("SOBERANO · "+b.hp+"/"+b.maxHp+" · NÚCLEO ATINGIDO");
    if(b.hp<=0){
     if(b.mode==="chase"){s.chaseDone=true;b.mode="dormant";s.shots=[];s.beams=[];announce("A BARREIRA CAIU · ALICIA ESTÁ NA CATEDRAL",5);onSound("boss-collapse");}
     else if(b.mode==="arena"){b.mode="invincible";b.clock=0;b.vulnerable=false;announce("SEGUNDA FORMA · O NÚCLEO NÃO RESPONDE",4);onSound("boss-enter");}
     else{b.defeated=true;b.mode="defeated";s.victory=createVictorySequence(s);s.scarlet=0;s.vx=s.vy=0;s.shots=[];s.beams=[];b.minions=[];b.resonance=null;s.boostTrail=[];s.ghosts=[];s.particles=[];s.invincible=0;s.phaseFlash=0;s.gravityWarning=0;s.messageTime=0;Object.assign(s.fx,{boost:0,hit:0,landing:0,takeoff:0,turn:0});onSound("boss-collapse");}
    }
   }else if(b.mode!=="invincible")damage();
  }
 }
 function info(){return {...s,failedTrials:[...s.failedTrials],rubro:rubroState.active,transformTime:rubroState.transformTime,defeated:s.defeated.size,broken:s.broken.size,collected:s.collected.size,
  runes:[...s.runes],runCores:[...s.runCores],secrets:[...s.secrets],trials:[...s.trials].map(([id,t])=>({id,...t})),boss:{...s.boss},seen:[...s.seen],visitedSectors:[...s.visitedSectors],progress:s.finished?100:Math.round(clamp(s.distance/RIFT_FINISH_X,0,1)*100),
  sector:riftSectorAt(s.x).name};}
 return {start,resumeStory,stop(){s.active=false;},respawn,update,info,
  draw(ctx,W=960,H=540){drawOriginalRift(ctx,s,layout,{W,H,drawFlux,drawSovereign,drawAlicia,ghost:ghostAt(s.time)});},
  get dashStatus(){const p=s.pocket||s;return dashIndicatorState({available:p.dashReady,active:p.dash>0,blocked:!!(s.dead||s.story||s.victory||s.finished||rubroState.transformTime)});},get active(){return s.active;},get crystals(){return s.crystals;},get ending(){return Boolean(s.victory);},get rubroLocked(){return Boolean(s.pocket)||s.arenaStarted&&!s.finished;},get musicSection(){return s.finished||s.victory?8:s.boss.mode==="scarlet"?7:s.boss.mode==="arena"||s.boss.mode==="invincible"?6:s.boss.mode==="chase"?4:riftSectorAt(s.x).music;}};
}
export function enemyPosition(e,i,time){
 const x=e.x+Math.sin(time*1.9+i)*e.range;
 const y=e.y+(e.type==="wraith"?Math.sin(time*2.7+i)*32:e.type==="crusher"?-e.gravity*Math.max(0,Math.sin(time*2+i))*48:0);
 return {x,y};
}

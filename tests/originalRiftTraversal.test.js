import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalRift} from "../src/game/originalRift.js";
import {createOriginalRiftLayout,RIFT_WORLD_WIDTH,RIFT_SECTORS,platformSurface,laserState} from "../src/levels/originalRift.js";
import {createRiftRouteDriver} from "../scripts/rift-route-driver.mjs";
import {createSovereign,hitSovereign,canDamageSovereign,enemyCanBeDestroyed,shotFan,distanceToBeam,advanceSovereign} from "../src/bosses/sovereign.js";
import {FINAL_SCORE,finalScoreStep} from "../src/audio/finalScore.js";
import {computeCampaignCompletion} from "../src/game/completion.js";
function traverse(rift,{until=()=>false,extras=false,inputs=createRiftRouteDriver({collectExtras:extras}),max=120*320}={}){
 for(let i=0;i<max;i++){
  const s=rift.info();if(s.dead||s.finished||until(s))return s;
  rift.update(1/120,inputs(s));
 }return rift.info();
}
test("final chapter authors nine sectors, six seals, three ascents and safe checkpoints",()=>{
 const map=createOriginalRiftLayout();assert.equal(RIFT_WORLD_WIDTH,48000);
 assert.equal(RIFT_SECTORS.length,9);assert.equal(map.runes.length,6);assert.equal(map.gates.length,3);
 assert.equal(map.cores.length,3);assert.equal(map.trials.length,3);
 assert.equal(new Set(map.enemies.map(e=>e.type)).size,4);
 assert.equal(map.runes.find(r=>r.id===1).dimension,-1,"first ECO seal must be activatable from the visible projection before the first gate");
 for(const cp of map.checkpoints){
  assert.ok(map.platforms.some(p=>(p.dimension===-1||p.dimension===cp.dimension)&&
   p.orientation===(cp.gravity>0?"floor":"ceiling")&&cp.x>=p.x1&&cp.x<=p.x2&&
   Math.abs(platformSurface(p,cp.x,0)-(cp.y+cp.gravity*18))<2),"checkpoint on solid ground");
  assert.ok(map.items.some(i=>i.type==="boost"&&Math.abs(i.x-cp.x)<70),"recovery orb");
 }
 for(const item of map.items.filter(i=>i.motion))assert.ok(map.platforms[item.platform].motion>0);
});
test("input-only normal run solves all seals and wins pursuit, first form and scarlet form once",()=>{
 let endings=0;const r=createOriginalRift({onFinish:()=>endings++});r.start(9);
 const s=traverse(r);assert.equal(s.dead,false,'Unexpected defeat: '+JSON.stringify({x:s.x,y:s.y,time:s.time,crystals:s.crystals,boss:s.boss.mode,damage:s.damageCount,checkpoint:s.checkpointIndex}));assert.equal(s.finished,true);assert.equal(endings,1);
 assert.equal(s.runes.length,6);assert.equal(s.visitedSectors.length,9);
 assert.equal(s.chaseDone,true);assert.equal(s.awakened,true);assert.equal(s.boss.phaseHits,6);
 assert.equal(s.scarlet,0);assert.ok(s.time>100);assert.ok(s.topSpeed>1000);
 assert.ok(s.crystals>=0&&s.boost>=0&&s.boost<=s.capacity);
 r.update(1,new Set(["arrowright"]));assert.equal(endings,1);
});
test("all three optional memories and timed routes are reachable through player inputs",()=>{
 const cores=[],routes=[];const r=createOriginalRift({onCore:id=>cores.push(id),onSecret:(id,t)=>routes.push([id,t])});r.start(9);
 const s=traverse(r,{extras:true});assert.equal(s.dead,false,'Extras route defeat: '+JSON.stringify({x:s.x,y:s.y,time:s.time,crystals:s.crystals,boss:s.boss.mode,damage:s.damageCount}));assert.equal(s.finished,true);
 assert.deepEqual(s.runCores,[0,1,2]);assert.deepEqual(cores,[0,1,2]);
 assert.deepEqual(s.secrets,["origin","paradox","lastlight"]);
 assert.ok(routes.every(([id,t])=>t>0&&t<=25));assert.equal(routes.length,3);
});
test("hold right and Boost cannot claim a seal or finish the level",()=>{
 const r=createOriginalRift({isDebug:()=>true});r.start(9);
 const s=traverse(r,{inputs:()=>new Set(["arrowright","shift"]),max:120*35});
 assert.equal(s.finished,false);assert.equal(s.runes.length,0);assert.equal(s.boss.mode,"dormant");
});
test("story suspends the actual physics clock and resumes the encounter",()=>{
 const scenes=[];const r=createOriginalRift({onStory:key=>scenes.push(key)});r.start(9);
 let s=traverse(r,{until:s=>s.story});assert.equal(s.story,"sovereignChase");
 r.update(1,new Set(["arrowright"]));assert.equal(r.info().time,s.time);
 r.resumeStory();assert.equal(r.info().story,null);
 s=traverse(r,{until:s=>s.story});assert.equal(s.story,"arenaIntro");r.resumeStory();
 s=traverse(r,{until:s=>s.story});assert.equal(s.story,"awakening");assert.equal(s.dead,false);
 r.resumeStory();assert.equal(r.info().boss.mode,"scarlet");assert.equal(r.info().scarlet,9);
 assert.deepEqual(scenes,["sovereignChase","arenaIntro","awakening"]);
});
test("pursuit barrier empties every crystal; another unprotected hit kills",()=>{
 const r=createOriginalRift();r.start(9);traverse(r,{until:s=>s.boss.mode==="chase"});
 let s=traverse(r,{inputs:()=>new Set(),until:s=>s.crystals===0});
 assert.equal(s.crystals,0);assert.equal(s.dead,false);assert.ok(s.invincible>0);
 s=traverse(r,{inputs:()=>new Set()});assert.equal(s.dead,true);
 const time=s.time;r.respawn();s=r.info();assert.equal(s.dead,false);assert.equal(s.crystals,0);
 assert.equal(s.time,time);assert.equal(s.boss.mode,"chase");assert.equal(s.boss.hp,5);
});
test("arena death preserves memories, story milestone and elapsed time, resetting the scarlet boss",()=>{
 const r=createOriginalRift();r.start(9);
 const driver=createRiftRouteDriver({collectExtras:true});let s=traverse(r,{inputs:driver,until:s=>s.boss.mode==="scarlet"});
 assert.equal(s.awakened,true);
 s=traverse(r,{inputs:()=>new Set()});assert.equal(s.dead,true);
 const time=s.time;r.respawn();s=r.info();assert.equal(s.time,time);assert.equal(s.dead,false);
 assert.equal(s.x,43250);assert.equal(s.gravity,1);assert.equal(s.boss.mode,"scarlet");assert.equal(s.boss.hp,6);
 assert.equal(s.scarlet,7.5);assert.equal(s.runCores.length,3);assert.equal(s.runes.length,6);
});
test("laser and triple enemies only die to Dash; shots remain unblockable",()=>{
 for(const type of ["rift-laser","rift-triple"]){
  assert.equal(enemyCanBeDestroyed({type},{dash:0,boosting:true,vx:1350}),false);
  assert.equal(enemyCanBeDestroyed({type},{dash:.1,boosting:false,vx:400}),true);
 }
 const fan=shotFan(0,0,{x:100,y:0});assert.equal(fan.length,3);
 assert.ok(fan.every(s=>s.unblockable));assert.ok(fan[0].vy<0&&fan[1].vy===0&&fan[2].vy>0);
 assert.equal(distanceToBeam(30,10,{x1:0,y1:0,x2:100,y2:0}),10);
});
test("boss damage respects exposure and consumes scarlet power on each hit",()=>{
 const b=createSovereign(),s={dash:.1,boosting:true,scarlet:7.5};b.mode="arena";
 assert.equal(hitSovereign(b,s),false);b.vulnerable=true;assert.equal(hitSovereign(b,s),true);
 assert.equal(b.hp,4);assert.equal(hitSovereign(b,s),false);
 b.mode="invincible";b.vulnerable=true;b.hitCooldown=0;assert.equal(canDamageSovereign(b,s),false);
 b.mode="scarlet";assert.equal(hitSovereign(b,s),true);assert.equal(s.scarlet,0);
 b.hitCooldown=0;b.vulnerable=true;assert.equal(hitSovereign(b,s),false);
});
test("warning comes before locked attacks and gravity inversion, with bounded minions",()=>{
 const b=createSovereign(),s={x:43700,y:632,gravity:1,scarlet:0,crystals:0};b.mode="arena";let warning=0,flip=0;
 const hooks={warnGravity(){warning++;},flipGravity(g){s.gravity=g;flip++;},barrierHit(){},awaken(){},surfaceAt:()=>650};
 for(let i=0;i<120*12;i++)advanceSovereign(b,s,1/120,hooks);
 assert.ok(warning>=1&&flip>=1);assert.ok(b.shots.length>=3);assert.ok(b.minions.length<=3);
 assert.ok(b.beams.every(p=>p.unblockable&&p.warning>0));
});
test("score varies in tempo, harmony and arrangement over a 32-bar form",()=>{
 assert.equal(FINAL_SCORE.length,9);assert.ok(new Set(FINAL_SCORE.map(x=>x.bpm)).size>=7);
 const start=Array.from({length:16},(_,i)=>finalScoreStep(6,i));
 const returnPhrase=Array.from({length:16},(_,i)=>finalScoreStep(6,64+i));
 assert.notDeepEqual(start,returnPhrase);assert.ok(start.every(s=>s.notes.length<=8));
 assert.ok(FINAL_SCORE[8].bpm<FINAL_SCORE[7].bpm);
});
test("completion reaches 100 only with six clears, twelve unique memories and routes",()=>{
 const old={stage1Completed:true,canyonFirstCompleted:true,stage2Completed:true,stage3Completed:true,extras:{cores:{stage1:[0,1,2],stage2:[0,1,2],stage3:[0,1,2]},secrets:{stage1:[1,2,3],stage2:[1,2,3],stage3:[1,2,3]}}};
 assert.equal(computeCampaignCompletion(old,{completed:true},{completed:true}).percent,78);old.stage4Completed=true;
 old.extras.cores.stage4=[0,1,2];old.extras.secrets.stage4=[1,2,3];assert.equal(computeCampaignCompletion(old,{completed:true},{completed:true}).percent,100);
});

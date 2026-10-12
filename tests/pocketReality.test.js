import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalRift} from "../src/game/originalRift.js";
import {createPocketReality,updatePocketReality} from "../src/game/pocketReality.js";
import {createSovereign,advanceSovereign} from "../src/bosses/sovereign.js";
import {createRiftRouteDriver} from "../scripts/rift-route-driver.mjs";
import {createRubroState,activateRubro} from "../src/game/rubro.js";
import {secretUpgradeStats} from "../src/game/secretUpgrades.js";
const tick=(r,n=1,keys=[])=>{for(let i=0;i<n;i++)r.update(1/120,new Set(keys));return r.info();};
function trialGame(){let first=true;const awards=[];const r=createOriginalRift({onCore:id=>awards.push(id),onFrame:s=>{if(first){first=false;Object.assign(s,{x:12790,y:178,dimension:1,gravity:1,vx:0,vy:0,crystals:40,chaseDone:true});}}});r.start(9);tick(r);tick(r);return {r,awards};}
test("trial reward cannot be collected from normal reality; failure returns alive with crystals intact",()=>{
 const {r,awards}=trialGame();assert.equal(r.info().pocket.kind,"trial");assert.deepEqual(awards,[]);const home={...r.info().pocket.returnPose};r.info().pocket.y=600;let s=tick(r);assert.equal(s.pocket,null);assert.equal(s.dead,false);assert.equal(s.crystals,40);assert.equal(s.x,home.x);assert.deepEqual(awards,[]);tick(r,160);assert.equal(r.info().pocket,null,"standing at returned beacon must not auto-restart");
});
test("all exclusive trial maps are completable with movement and jumps, not state edits",()=>{
 for(let core=0;core<3;core++){const p=createPocketReality("trial",{trial:{core,limit:25},returnPose:{}}),d=createRiftRouteDriver();let result={};for(let i=0;i<3000&&!result.done;i++)result=updatePocketReality(p,1/120,d({pocket:p}));assert.equal(result.won,true);assert.ok(p.elapsed>5&&p.elapsed<25);}
});
test("exile lasts five seconds, telegraphs lasers and permits input-only survival",()=>{
 const p=createPocketReality("exile",{returnPose:{}}),d=createRiftRouteDriver();let result={},hits=0;for(let i=0;i<620&&!result.done;i++){result=updatePocketReality(p,1/120,d({pocket:p}));hits+=Number(!!result.hit);}assert.equal(result.done,true);assert.ok(p.elapsed>=5&&p.elapsed<5.02);assert.equal(hits,0);assert.ok(p.serial>=6);
});
test("Orb collision transports even empowered Flux and returning preserves frozen boss state",()=>{
 let first=true;const form=createRubroState();const r=createOriginalRift({rubroState:form,onFrame:s=>{if(first){first=false;s.crystals=100;form.active=true;s.shots.push({x:s.x,y:s.y,vx:0,vy:0,life:1,orb:true});}}});r.start(9);tick(r);let s=tick(r);assert.equal(s.pocket.kind,"exile");const x=s.x,clock=s.boss.clock;const d=createRiftRouteDriver();for(let i=0;i<610&&r.info().pocket;i++)r.update(1/120,d(r.info()));s=r.info();assert.equal(s.pocket,null);assert.equal(s.x,x);assert.equal(s.boss.clock,clock);assert.equal(s.crystals,100);
});
test("each final-form hit increases volley count while preserving vulnerability timing",()=>{
 const counts=[];for(let wounds=0;wounds<6;wounds++){const b=createSovereign();b.mode="scarlet";b.maxHp=6;b.hp=6-wounds;const hooks={surfaceAt:()=>650,warnGravity(){},flipGravity(){},barrierHit(){},awaken(){}};for(let i=0;i<3600;i++)advanceSovereign(b,{x:44500,y:632,gravity:1},1/120,hooks);counts.push(b.shots.filter(p=>!p.orb).length);assert.ok(b.shots.some(p=>p.orb));}for(let i=1;i<counts.length;i++)assert.ok(counts[i]>counts[i-1],JSON.stringify(counts));
});
test("phase-four transformation publishes remaining animation time while freezing movement",()=>{
 const form=createRubroState();let first=true;const r=createOriginalRift({rubroState:form,onFrame:s=>{if(first){first=false;s.crystals=20;}}});r.start(9);tick(r);activateRubro(form,true,20);const before=r.info();const during=tick(r,30,["arrowright"]);assert.ok(during.transformTime>0);assert.ok(during.transformClock>.2);assert.equal(during.x,before.x);assert.equal(during.time,before.time);tick(r,90);assert.equal(r.info().rubro,true);
});
test("efficiency rewards are permanent, bounded and deduplicated",()=>{
 const stats=secretUpgradeStats({stage4:["origin","origin","paradox","lastlight","bogus"]});assert.equal(stats.efficiencyLevels,3);assert.equal(stats.consumptionMultiplier,.92**3);assert.equal(stats.collected,3);
});

test("failure locks the route for this attempt, including checkpoint respawns",()=>{
 let move={x:12790,y:178,dimension:1,gravity:1,vx:0,vy:0,crystals:40,chaseDone:true};
 const r=createOriginalRift({onFrame:s=>{if(move){Object.assign(s,move);move=null;}}});r.start(9);tick(r);tick(r);
 r.info().pocket.y=600;tick(r);assert.deepEqual(r.info().failedTrials,["origin"]);
 move={x:12300,y:372};tick(r,160);move={x:12790,y:178};tick(r,3);assert.equal(r.info().pocket,null);
 r.respawn();assert.deepEqual(r.info().failedTrials,["origin"]);r.start(9);assert.deepEqual(r.info().failedTrials,[]);
});
test("new trial routes have real gaps, paired lasers and live sentinels",()=>{
 const routes=[];for(let core=0;core<3;core++){const p=createPocketReality("trial",{trial:{core,limit:25},returnPose:{}});routes.push(p.platforms);for(let i=1;i<p.platforms.length;i++)assert.ok(p.platforms[i].x1-p.platforms[i-1].x2>=150);assert.ok(p.enemies.length>=2);updatePocketReality(p,1/120,new Set());assert.equal(p.lasers.length,2);
 p.x=p.enemies[0].x-100;p.y=p.enemies[0].y+100;for(let i=0;i<170;i++)updatePocketReality(p,1/120,new Set());assert.ok(p.shots.length>0);
 }assert.notDeepEqual(routes[0],routes[1]);assert.notDeepEqual(routes[1],routes[2]);
});
test("Sovereign resonance grants Rubro without awarding crystals",()=>{
 const b=createSovereign();b.mode="scarlet";b.resonance={x:44500,y:608,warning:0};const s={x:44500,y:608,gravity:1,crystals:17};advanceSovereign(b,s,1/120,{surfaceAt:()=>650,warnGravity(){},flipGravity(){},barrierHit(){},awaken(){}});assert.equal(s.scarlet,7.5);assert.equal(s.crystals,17);
});
test("successful Sovereign damage does not generate crystals",()=>{
 let first=true;const r=createOriginalRift({onFrame:s=>{if(first){first=false;Object.assign(s,{x:44500,y:560,vx:0,vy:0,crystals:40,invincible:2,gravity:1,dimension:0,chaseDone:true,arenaStarted:true,dash:.2,dashFacing:1});Object.assign(s.boss,{mode:"arena",clock:3.8,cycle:0,x:44500,y:560,hp:5,maxHp:5,vulnerable:true,hitCooldown:0,volleyFired:true,beamFired:true});}}});r.start(9);tick(r);const s=tick(r);assert.equal(s.boss.hp,4);assert.equal(s.crystals,40);
});
test("homing orb is faster and turns toward Flux within a bounded angle",async()=>{
 const {steerRiftOrb}=await import("../src/bosses/sovereign.js");const orb={x:0,y:0,vx:460,vy:0};steerRiftOrb(orb,{x:0,y:100},.1);assert.ok(orb.vy>0);assert.ok(Math.abs(Math.hypot(orb.vx,orb.vy)-460)<.001);assert.ok(Math.atan2(orb.vy,orb.vx)<=.311);steerRiftOrb(orb,{x:0,y:-100},.1);assert.ok(Math.abs(orb.vy)<1);
});

import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalRift} from "../src/game/originalRift.js";
import {createRubroState} from "../src/game/rubro.js";
import {createSovereign,advanceSovereign,CHASE} from "../src/bosses/sovereign.js";
import {createDefeat,sampleDefeat,DEFEAT_SECONDS} from "../src/game/defeat.js";
import {drawRubroAura} from "../src/rendering/rubro.js";
import {drawBoostTrail} from "../src/rendering/boostTrail.js";
const tick=(r,keys=[],n=1)=>{for(let i=0;i<n;i++)r.update(1/120,new Set(keys));return r.info();};
test("entering the final arena disables post-game Rubro without consuming crystals",()=>{
 const form=createRubroState();let first=true;const r=createOriginalRift({rubroState:form,onFrame:s=>{if(first){first=false;s.x=43250;s.y=632;s.gravity=1;s.dimension=0;s.chaseDone=true;s.crystals=40;form.active=true;}}});r.start(9);tick(r);const s=tick(r);
 assert.equal(form.active,false);assert.equal(s.rubro,false);assert.equal(r.rubroLocked,true);assert.equal(s.arenaStarted,true);assert.equal(s.crystals,40);
});
test("Sovereign ray drains every crystal even during post-game Rubro Boost, then restores base form",()=>{
 const form=createRubroState();let first=true;const r=createOriginalRift({rubroState:form,onFrame:s=>{if(first){first=false;s.crystals=100;s.vx=300;form.active=true;s.beams.push({x1:s.x,y1:0,x2:s.x,y2:700,warning:0,life:2,drainsAll:true,sovereign:true});}else if(s.crystals===0)s.vx=0;}});r.start(9);tick(r);let s=tick(r,["arrowright","shift"]);
 assert.equal(s.crystals,0);assert.equal(form.active,false);assert.equal(s.dead,false);assert.ok(s.invincible>0);
 tick(r,[],160);s=r.info();s.shots.push({x:s.x,y:s.y,vx:0,vy:0,life:1});s=tick(r);assert.equal(s.dead,true);
});
test("Sovereign volleys carry their own visual identity and rays identify total drain",()=>{
 const b=createSovereign();b.mode="scarlet";const s={x:44500,y:632,gravity:1};
 const hooks={surfaceAt:()=>650,warnGravity(){},flipGravity(){},barrierHit(){},awaken(){}};
 advanceSovereign(b,s,1,hooks);advanceSovereign(b,s,1,hooks);
 assert.equal(b.shots.length,5);assert.ok(b.shots.every(p=>p.sovereign));assert.ok(b.beams.length===2&&b.beams.every(p=>p.drainsAll&&p.sovereign));
});
test("pursuit wall runs materially faster than before, leaving ordinary movement room",()=>{
 assert.ok(CHASE.barrierSpeed>245*1.5&&CHASE.barrierSpeed<480);
 const b=createSovereign();b.mode="chase";b.barrierX=0;advanceSovereign(b,{x:21000,y:500,gravity:1},1,{surfaceAt:()=>580,barrierHit(){},warnGravity(){},flipGravity(){},awaken(){}});
 assert.equal(b.barrierX,CHASE.barrierSpeed);
});
test("touching a stage-4 beacon starts a trial without Slide and holding contact cannot reset its clock",()=>{
 for(const [id,x,y,dimension] of [["origin",12790,178,1],["paradox",33590,218,0],["lastlight",41540,238,0]]){
  let first=true;const sounds=[];const r=createOriginalRift({onSound:k=>sounds.push(k),onFrame:s=>{if(first){first=false;Object.assign(s,{x,y,dimension,gravity:1,vx:0,vy:0,grounded:true,chaseDone:true});}}});r.start(9);tick(r);let s=tick(r);
  assert.equal(s.trials[0]?.id,id);assert.equal(sounds.filter(k=>k==="portal-enter").length,1);s=tick(r,[],20);assert.ok(s.trials[0].elapsed>.15);assert.equal(sounds.filter(k=>k==="portal-enter").length,1);
 }
});
test("defeat animates before its callback, freezes race time, and notifies only once",()=>{
 let calls=0;const r=createOriginalRift({onDeath:()=>calls++});r.start(9);tick(r,[],5);let s=r.info();s.shots.push({x:s.x,y:s.y,vx:0,vy:0,life:2});s=tick(r);assert.equal(s.dead,true);assert.equal(calls,0);
 const time=s.time;tick(r,[],60);assert.equal(calls,0);tick(r,[],70);assert.equal(calls,1);tick(r,[],130);assert.equal(calls,1);assert.equal(r.info().time,time);
 const d=createDefeat({x:10,y:20,rubro:true});d.elapsed=DEFEAT_SECONDS;assert.equal(sampleDefeat(d).done,true);assert.ok(sampleDefeat(d).rotation>1);
});
test("shared Rubro aura contains six animated energy strokes and its Boost trail is red",()=>{
 const moves=[],colors=[];const ctx={save(){},restore(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(...p){moves.push(p)},lineTo(){},set fillStyle(c){colors.push(c)}};
 drawRubroAura(ctx,0,0,1,{active:true,transformTime:0});assert.equal(moves.length,6);
 drawBoostTrail(ctx,[{x:0,y:0,life:.24,rubro:true}]);assert.ok(colors.includes("#ff456d"));drawBoostTrail(ctx,[{x:0,y:0,life:.24,rubro:false}]);assert.ok(colors.includes("#59f4e6"));
});

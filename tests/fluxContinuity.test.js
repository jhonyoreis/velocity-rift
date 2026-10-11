import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalRift} from "../src/game/originalRift.js";
import {FLUX_MOTION as M} from "../src/game/fluxMotion.js";
import {fluxAppearance} from "../src/game/fluxAppearance.js";
const step=(rift,keys=[],frames=1)=>{for(let i=0;i<frames;i++)rift.update(1/120,new Set(keys));return rift.info();};
test("final-stage Flux follows campaign acceleration, speed, Boost cost and upgrades",()=>{
 for(const power of [1,1.15]){
  const r=createOriginalRift({boostPower:()=>power,boostCapacity:()=>170});r.start(9);step(r,[],5);
  let s=step(r,["arrowright"]);assert.ok(Math.abs(s.vx-M.groundAcceleration/120)<1e-8);
  s=step(r,["arrowright"],48);assert.equal(s.vx,M.normalSpeed);
  const before=s.boost;s=step(r,["arrowright","shift"],1);
  assert.ok(Math.abs(before-s.boost-M.boostDrain/120)<1e-8);
  s=step(r,["arrowright","shift"],20);assert.equal(s.vx,M.boostSpeed*power);assert.equal(s.capacity,170);
 }
});
test("final-stage Dash keeps its direction, duration and speed while braking input is held",()=>{
 const r=createOriginalRift();r.start(9);step(r,[],5);step(r,["arrowright"],10);
 step(r,["arrowright"," "],1);step(r,["arrowright"],1);
 let s=step(r,["arrowright"," "],1);assert.equal(s.vx,M.dashSpeed);
 const startX=s.x;s=step(r,["arrowleft"],20);assert.equal(s.vx,M.dashSpeed);assert.equal(s.facing,1);assert.ok(s.x>startX);
 s=step(r,["arrowleft"],10);assert.equal(s.dash,0);assert.ok(s.vx>0&&s.vx<=M.dashExitSpeed);
});
test("enemy shots damage Flux during both Boost and Dash in the final stage",()=>{
 for(const mode of ["boost","dash"]){
  const r=createOriginalRift();r.start(9);step(r,[],5);step(r,["arrowright"],10);
  let s;
  if(mode==="boost")s=step(r,["arrowright","shift"]);
  else{step(r,["arrowright"," "]);step(r,["arrowright"]);s=step(r,["arrowright"," "]);}
  assert.equal(mode==="boost"?s.boosting:s.dash>0,true);
  s.shots.push({x:s.x+s.vx/120,y:s.y,vx:0,vy:0,life:2,dimension:s.dimension});
  s=step(r,mode==="boost"?["arrowright","shift"]:[]);
  assert.equal(s.dead,true);assert.equal(s.damageCount,1);
 }
});
test("permanent upgrades keep Flux's golden Dash lens and stronger core appearance",()=>{
 assert.equal(fluxAppearance().lens,"#73fff0");
 assert.deepEqual(fluxAppearance({dash:true,upgraded:true,goldScarf:true}),{lens:"#ffde95",core:"#aaffdf",scarf:"#f8d787"});
});
test("final-stage animation advances with distance and preserves takeoff/landing transitions",()=>{
 const r=createOriginalRift();r.start(9);step(r,[],5);let s=step(r,["arrowright"],10);
 assert.ok(s.animationPhase>0&&s.fx.run>0);s=step(r,["arrowright"," "]);assert.ok(s.fx.takeoff>0);
 for(let i=0;i<120&&!s.grounded;i++)s=step(r,[]);
 assert.equal(s.grounded,true);assert.ok(s.fx.landing>0);
});

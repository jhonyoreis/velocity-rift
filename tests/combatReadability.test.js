import test from "node:test";
import assert from "node:assert/strict";
import {architectCameraX,containArenaPlayer,dashIndicatorState,offscreenTarget} from "../src/game/combatReadability.js";
import {createSovereign,advanceSovereign} from "../src/bosses/sovereign.js";
test("Architect camera reaches the entire arena and keeps Flux visible even at Dash speed",()=>{
 let camera=22000;
 for(let x=22018;x<23542;x+=9.5){
  const target=architectCameraX(x,22750,22000,23560);
  camera=containArenaPlayer(camera+(target-camera)*.055,x,22000,23560);
  assert.ok(camera>=22000&&camera<=22600);
  assert.ok(x-camera>=18&&x-camera<=942);
 }
 assert.ok(camera>22450,"right section must become visible");
 assert.equal(architectCameraX(100,200,0,500),0,"narrow arenas remain bounded");
});
test("combat markers disappear for visible targets and point to offscreen targets above touch controls",()=>{
 const camera={x:1000,y:280};
 assert.equal(offscreenTarget({x:1400,y:450},camera.x,camera.y),null);
 for(const [target,side] of [[{x:900,y:500},"left"],[{x:2100,y:500},"right"],[{x:1500,y:150},"top"],[{x:1500,y:1000},"bottom"]]){
  const m=offscreenTarget(target,camera.x,camera.y);assert.equal(m.side,side);
  assert.ok(m.x>=32&&m.x<=928&&m.y>=160&&m.y<=390);
  const dx=target.x-camera.x-m.x,dy=target.y-camera.y-m.y;
  assert.ok(dx*Math.cos(m.angle)+dy*Math.sin(m.angle)>0);
 }
});
test("Dash feedback distinguishes charged, consumed, active and unavailable states",()=>{
 assert.equal(dashIndicatorState({}),"ready");
 assert.equal(dashIndicatorState({available:false}),"spent");
 assert.equal(dashIndicatorState({available:false,active:true}),"active");
 assert.equal(dashIndicatorState({unlocked:false}),"hidden");
 assert.equal(dashIndicatorState({blocked:true,active:true}),"hidden");
});
test("Sovereign attack cues precede lasers and the homing Orb without repeating every frame",()=>{
 const b=createSovereign();b.mode="scarlet";const s={x:44400,y:608,gravity:1,crystals:40},events=[];
 const hooks={surfaceAt:()=>650,warnGravity(){events.push(["gravity",b.clock]);},flipGravity(g){s.gravity=g;},barrierHit(){},awaken(){},warnAttack(kind){events.push([kind,b.clock]);}};
 for(let i=0;i<1020;i++)advanceSovereign(b,s,1/120,hooks);
 const orb=events.filter(e=>e[0]==="orb");assert.equal(orb.length,1);assert.ok(orb[0][1]>=7.3&&orb[0][1]<8);
 assert.ok(events.some(e=>e[0]==="volley"&&e[1]<1));assert.ok(events.some(e=>e[0]==="laser"&&e[1]<2));assert.ok(events.some(e=>e[0]==="gravity"));
});

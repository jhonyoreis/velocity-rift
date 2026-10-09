import test from "node:test";
import assert from "node:assert/strict";
import {architectPhase,spawnArchitectRifts,architectRiftState,
 ARCHITECT_RIFT_WARNING,architectBarrageDuration} from "../src/bosses/architectPatterns.js";
test("boss scales after each hit",()=>{
 const phases=[4,3,2,1].map(architectPhase);
 assert.deepEqual(phases.map(p=>p.projectiles),[2,3,4,5]);
 assert.deepEqual(phases.map(p=>p.rifts),[0,0,1,2]);
 assert.ok(phases.every((p,i)=>i===0||p.speed>phases[i-1].speed));
 assert.ok(phases.every(p=>architectBarrageDuration(p)>0));
});
test("ground fissures telegraph and expire",()=>{
 assert.equal(architectRiftState(0),"warning");
 assert.equal(architectRiftState(ARCHITECT_RIFT_WARNING-.01),"warning");
 assert.equal(architectRiftState(ARCHITECT_RIFT_WARNING+.01),"active");
 assert.equal(architectRiftState(3),"expired");
});
test("fissures are placed inside arena only at low HP",()=>{
 for(const hp of [4,3,2,1]){
  const items=spawnArchitectRifts({phase:architectPhase(hp),
    playerX:22450,facing:1,arenaLeft:22000,arenaRight:23560});
  assert.equal(items.length,architectPhase(hp).rifts);
  assert.ok(items.every(r=>r.x>=22155&&r.x<=23395));
 }
});

import test from "node:test";
import assert from "node:assert/strict";
import {sampleStageArrival,STAGE_ARRIVAL_SECONDS,STAGE_ARRIVAL_DISTANCE}
  from "../src/game/stageArrival.js";
import {readFileSync} from "node:fs";

test("arrival runs for exactly four seconds and ends at the original spawn",()=>{
 assert.equal(STAGE_ARRIVAL_SECONDS,4);
 assert.ok(STAGE_ARRIVAL_DISTANCE>=1400);
 assert.deepEqual(sampleStageArrival(0).progress,0);
 assert.equal(sampleStageArrival(3.99).finished,false);
 assert.equal(sampleStageArrival(4).finished,true);
 assert.equal(sampleStageArrival(4).progress,1);
 assert.equal(sampleStageArrival(4).speed,0);
 assert.equal(sampleStageArrival(6).progress,1);
});

test("boost runs at full cruising speed before smoothly braking",()=>{
 const speeds=[0,.25,1.5,3.3,3.5,3.65,3.85,4].map(t=>sampleStageArrival(t).speed);
 assert.ok(speeds[0]>300&&speeds[0]<600);
 assert.ok(speeds.slice(0,5).every(v=>v===speeds[0]));
 assert.ok(speeds[5]<speeds[4]);
 assert.ok(speeds[6]<speeds[5]);
 assert.equal(speeds[7],0);
 let previous=-1;
 for(let t=0;t<=4;t+=.025){
   const p=sampleStageArrival(t).progress;
   assert.ok(p>=previous&&p>=0&&p<=1);
   previous=p;
 }
});

test("arrival stays cosmetic without advancing timer, boost meter or pickups",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 const start=main.indexOf("function updateStageArrival(dt){");
 const end=main.indexOf("function drawStageArrivalRunway(){",start);
 assert.ok(start>=0&&end>start);
 const body=main.slice(start,end);
 assert.ok(body.includes("sampleStageArrival(stageArrival.elapsed"));
 assert.ok(body.includes("player.boosting=true"));
 assert.ok(body.includes("updateFluxFx(dt)"));
 assert.ok(!body.includes("gameTime +="));
 assert.ok(!body.includes("player.boost="));
 assert.ok(!body.includes("collectItems("));
 assert.ok(main.includes("if(stageArrival.active){updateStageArrival(dt);return;}"));
 assert.ok(main.includes("player.x=spawn.x"));
 assert.ok(main.includes("gameTime=0"));
});

test("arrival title no longer uses a gray filled rounded panel",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 const start=main.indexOf("function drawStageArrivalOverlay(){");
 const end=main.indexOf("function resetGame() {",start);
 assert.ok(start>=0&&end>start);
 const block=main.slice(start,end);
 assert.ok(!block.includes("roundRect("));
 assert.ok(!block.includes("fillRect("));
 assert.ok(block.includes('ctx.fillText('));
});

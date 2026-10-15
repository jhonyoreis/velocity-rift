import test from "node:test";
import assert from "node:assert/strict";
import {clearForeignStageTransitions} from "../src/game/riftEntryReset.js";

test("entering Fenda Original cancels unfinished arrival, exit and altar animations",()=>{
 const stageExit={active:true,elapsed:1.59,duration:1.6},
  stageArrival={active:true,elapsed:3.5,duration:4},
  dashAltar={active:true,elapsed:2.5,usedThisRun:false};
 clearForeignStageTransitions({stageExit,stageArrival,dashAltar});
 for(const state of [stageExit,stageArrival,dashAltar]){
  assert.equal(state.active,false);
  assert.equal(state.elapsed,0);
 }
 assert.equal(stageExit.duration,1.6);
 assert.equal(dashAltar.usedThisRun,false);
});

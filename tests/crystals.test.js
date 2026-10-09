import test from "node:test";
import assert from "node:assert/strict";
import {calculateCrystalDamage} from "../src/game/crystals.js";
test("fall removes everything and ends the run",()=>{
 for(const n of [0,1,10,100])
   assert.deepEqual(calculateCrystalDamage(n,{fall:true}),{remaining:0,lost:n,dead:true});
});
test("regular hit costs at least eight or thirty-five percent",()=>{
 assert.deepEqual(calculateCrystalDamage(100),{remaining:65,lost:35,dead:false});
 assert.deepEqual(calculateCrystalDamage(20),{remaining:12,lost:8,dead:false});
 assert.deepEqual(calculateCrystalDamage(5),{remaining:0,lost:5,dead:false});
 assert.deepEqual(calculateCrystalDamage(0),{remaining:0,lost:0,dead:true});
});

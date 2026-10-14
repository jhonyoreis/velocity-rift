import test from "node:test";
import assert from "node:assert/strict";
import {calculateCrystalDamage} from "../src/game/crystals.js";
test("fall removes everything and ends the run",()=>{
 for(const n of [0,1,10,100])
   assert.deepEqual(calculateCrystalDamage(n,{fall:true}),{remaining:0,lost:n,dead:true});
});
test("regular hit costs at least twelve or fifty percent",()=>{
 assert.deepEqual(calculateCrystalDamage(100),{remaining:50,lost:50,dead:false});
 assert.deepEqual(calculateCrystalDamage(20),{remaining:8,lost:12,dead:false});
 assert.deepEqual(calculateCrystalDamage(5),{remaining:0,lost:5,dead:false});
 assert.deepEqual(calculateCrystalDamage(0),{remaining:0,lost:0,dead:true});
});

test("crushing kills through any crystal reserve and Rubro resistance",()=>{
 for(const rubro of [true,false])for(const n of [0,1,20,1000])assert.deepEqual(calculateCrystalDamage(n,{crush:true,rubro}),{remaining:0,lost:n,dead:true});
});

test("Rubro protection still applies, but hits cost more crystals",()=>{
 assert.deepEqual(calculateCrystalDamage(100,{rubro:true}),{remaining:80,lost:20,dead:false});
 assert.deepEqual(calculateCrystalDamage(10,{rubro:true}),{remaining:6,lost:4,dead:false});
});

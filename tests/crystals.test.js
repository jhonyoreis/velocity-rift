import test from "node:test";
import assert from "node:assert/strict";
import {calculateCrystalDamage} from "../src/game/crystals.js";
test("fall removes everything and ends the run",()=>{
 for(const n of [0,1,10,100])
   assert.deepEqual(calculateCrystalDamage(n,{fall:true}),{remaining:0,lost:n,dead:true});
});
test("regular hit costs at least eight or forty-five percent",()=>{
 assert.deepEqual(calculateCrystalDamage(100),{remaining:55,lost:45,dead:false});
 assert.deepEqual(calculateCrystalDamage(20),{remaining:11,lost:9,dead:false});
 assert.deepEqual(calculateCrystalDamage(5),{remaining:0,lost:5,dead:false});
 assert.deepEqual(calculateCrystalDamage(0),{remaining:0,lost:0,dead:true});
});

test("crushing kills through any crystal reserve and Rubro resistance",()=>{
 for(const rubro of [true,false])for(const n of [0,1,20,1000])assert.deepEqual(calculateCrystalDamage(n,{crush:true,rubro}),{remaining:0,lost:n,dead:true});
});

test("Rubro retains its established protection during crystal rebalance",()=>{
 assert.deepEqual(calculateCrystalDamage(100,{rubro:true}),{remaining:90,lost:10,dead:false});
 assert.deepEqual(calculateCrystalDamage(10,{rubro:true}),{remaining:8,lost:2,dead:false});
});

test("scripted final chapter retains the original damage balance",()=>{
 assert.deepEqual(calculateCrystalDamage(100,{baseFraction:.35,baseMinimum:8}),{remaining:65,lost:35,dead:false});
 assert.deepEqual(calculateCrystalDamage(20,{baseFraction:.35,baseMinimum:8}),{remaining:12,lost:8,dead:false});
});

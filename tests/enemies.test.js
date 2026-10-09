import test from "node:test";
import assert from "node:assert/strict";
import {createEnemy,isCityEnemyType} from "../src/game/enemies.js";

test("common enemies have a safe default type on collision",()=>{
  const foe=createEnemy(150,400,35);
  assert.equal(foe.type,"walker");
  assert.equal(foe.alive,true);
  assert.equal(foe.baseX,150);
  assert.equal(foe.yBase,400);
  assert.equal(foe.patrol,35);
  assert.equal(isCityEnemyType(foe.type),false);
});

test("type classification handles missing or legacy types without crashing",()=>{
  for(const type of [undefined,null,0,false,{},[],"walker","drone","sentry"]){
    assert.equal(isCityEnemyType(type),false);
  }
  for(const type of ["city-drone","city-turret","city-hunter"]){
    assert.equal(isCityEnemyType(type),true);
  }
});

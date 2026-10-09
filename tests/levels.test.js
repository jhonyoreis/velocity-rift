import test from "node:test";
import assert from "node:assert/strict";
import {createStageOneWorld} from "../src/levels/forest.js";
import {createStageTwoWorld} from "../src/levels/canyon.js";
import {createStageThreeWorld} from "../src/levels/city.js";
import {installSecretRoutes} from "../src/levels/secretChallenges.js";
import {SECRET_DEFS} from "../src/data/secretRoutes.js";
import {ACHIEVEMENTS} from "../src/data/achievements.js";
import {yOnTrack} from "../src/game/geometry.js";
import {createEnemy as enemy} from "../src/game/enemies.js";

const track=(x1,y1,x2,y2,kind)=>({x1,y1,x2,y2,kind});
const rect=(x,y,w,h,kind)=>({x,y,w,h,kind,active:true});
const orb=(x,y)=>({x,y,r:15,active:true});
const common={track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS:18,WORLD_H:820};

test("original stage sizes, checkpoints and obstacles are preserved",()=>{
  const stages=[
    createStageOneWorld({...common,worldW:22700}),
    createStageTwoWorld({...common,guardian:{arenaLeft:32710}}),
    createStageThreeWorld(common)
  ];
  assert.deepEqual(stages.map(s=>s.worldW),[22700,34000,23560]);
  assert.deepEqual(stages.map(s=>s.checkpoints.length),[5,9,8]);
  assert.ok(stages[0].enemies.every(e=>e.type==="walker"),"stage one foes need a type");
  assert.ok(stages.every(stage=>stage.enemies.every(e=>typeof e.type==="string"&&e.type.length>0)), "all stage foes need valid types");
  assert.equal(stages[2].enemies.length,21);
  assert.equal(stages[2].tracks.filter(t=>t.kind==="city-roof").length,19);
  assert.deepEqual(stages[2].pits.slice(0,3).map(([a,b])=>b-a),[430,480,490]);
  assert.deepEqual(stages[2].pits.slice(3).map(([a,b])=>b-a),[215,215,215,215,215,215]);
  stages.forEach((stage,index)=>{
    assert.equal(stage.memoryCores.length,3);
    installSecretRoutes(stage,index+1,{track,PLAYER_RADIUS:18});
    assert.equal(stage.secretTrials.length,3);
    assert.ok(stage.secretTrials.every(t=>t.platforms.length>=8));
  });
});
test("all challenge IDs and achievement IDs are unique",()=>{
  const secrets=[1,2,3].flatMap(stage=>SECRET_DEFS[stage].map(t=>t.id));
  assert.equal(secrets.length,9);
  assert.equal(new Set(secrets).size,9);
  assert.equal(ACHIEVEMENTS.length,20);
  assert.equal(new Set(ACHIEVEMENTS.map(t=>t.id)).size,20);
});

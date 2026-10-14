import test from 'node:test';
import assert from 'node:assert/strict';
import {forestDroneShot,FOREST_DRONE_RANGE,FOREST_DRONE_COOLDOWN,FOREST_DRONE_WARNING} from '../src/game/forestTwoCombat.js';
import {createForestTwoWorld} from '../src/levels/forestTwo.js';
import {createEnemy} from '../src/game/enemies.js';
import {yOnTrack} from '../src/game/geometry.js';

test('weathered drones fire a readable aimed projectile',()=>{
 const shot=forestDroneShot(100,200,{x:400,y:200});
 assert.equal(shot.vy,0);
 assert.ok(shot.vx>300);
 assert.ok(shot.forestShot&&shot.r>0&&shot.life>2);
 const diagonal=forestDroneShot(100,100,{x:-100,y:300});
 assert.ok(diagonal.vx<0&&diagonal.vy>0);
 assert.ok(FOREST_DRONE_WARNING>=.5&&FOREST_DRONE_COOLDOWN>1.5);
 assert.ok(FOREST_DRONE_RANGE>=500);
});

test('Floresta Neon 2 contains weathered drones eligible for their new attacks',()=>{
 const world=createForestTwoWorld({
  track:(x1,y1,x2,y2,kind)=>({x1,y1,x2,y2,kind}),
  rect:(x,y,w,h,kind)=>({x,y,w,h,kind}),enemy:createEnemy,
  orb:(x,y)=>({x,y,active:true}),yOnTrack,PLAYER_RADIUS:18,WORLD_H:820
 });
 assert.ok(world.enemies.filter(e=>e.type==='drone'&&e.weathered).length>=10);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createForestTwoWorld,pressState} from '../src/levels/forestTwo.js';
import {createHelix,advanceHelix} from '../src/bosses/helix.js';
import {createEnemy as enemy} from '../src/game/enemies.js';
import {yOnTrack} from '../src/game/geometry.js';
import {forestTwoScore} from '../src/audio/forestTwoScore.js';
const world=createForestTwoWorld({track:(x1,y1,x2,y2,kind)=>({x1,y1,x2,y2,kind}),rect:(x,y,w,h,kind)=>({x,y,w,h,kind,active:true}),orb:(x,y)=>({x,y,active:true}),enemy,yOnTrack,PLAYER_RADIUS:18,WORLD_H:820});
test('Neon Forest 2 has continuous safe ground, no cores/trials, and worn original enemies',()=>{
 for(let x=0;x<=world.worldW;x+=5)assert.ok(world.tracks.some(t=>t.kind!=='factory-catwalk'&&x>=t.x1&&x<=t.x2),`floor ${x}`);
 assert.equal(world.memoryCores.length,0);assert.equal(world.secretTrials.length,0);assert.equal(world.pits.length,0);
 assert.ok(world.enemies.every(e=>e.type==='walker'&&e.weathered));assert.ok(world.checkpoints.some(c=>c.boss));
 for(const t of world.tracks.filter(t=>t.kind==='factory-catwalk')){const lower=world.tracks.find(b=>b.kind!=='factory-catwalk'&&t.x1>=b.x1&&t.x1<=b.x2);assert.ok(yOnTrack(lower,t.x1)-t.y1<=160);}
});
test('presses warn before contact and reopen for a normal-speed crossing',()=>{
 const p={phase:0,period:3.8};assert.equal(pressState(p,1.9).warning,true);assert.equal(pressState(p,1.9).active,false);assert.equal(pressState(p,2.5).active,true);assert.equal(pressState(p,3.5).extension,0);
});
test('Helix locks arena, exposes a reactor reachable without Dash, and stops hazards after defeat',()=>{
 const b=createHelix(),p={x:11300,y:412,vy:0,vx:0,boosting:false};const hooks={damage(){},sound(){},notice(){},burst(){},dashing:()=>false};advanceHelix(b,p,.01,hooks);assert.ok(b.active);p.x=13000;advanceHelix(b,p,.01,hooks);assert.ok(p.x<12200);
 b.time=2.7;advanceHelix(b,p,.01,hooks);assert.equal(b.exposed,true);assert.equal(b.y,365);
 for(let i=0;i<4;i++){b.time=2.7;b.hitCooldown=0;p.x=b.x;p.y=330;p.vy=120;advanceHelix(b,p,.01,hooks);}
 assert.equal(b.hp,0);assert.ok(b.defeated);assert.equal(b.waves.length,0);p.x=13000;advanceHelix(b,p,1,hooks);assert.equal(p.x,13000);
});
test('new score varies through eight bars and develops an industrial layer',()=>{
 const a=Array.from({length:128},(_,i)=>forestTwoScore(i));assert.ok(new Set(a.map(s=>JSON.stringify(s.notes))).size>24);assert.ok(forestTwoScore(3,1).metal);assert.equal(forestTwoScore(3,0).metal,false);assert.equal(forestTwoScore(0,1,true).bpm,132);
});

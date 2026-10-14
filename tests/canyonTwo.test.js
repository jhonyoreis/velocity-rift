import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanyonTwoWorld,SANCTUARY} from '../src/levels/canyonTwo.js';
import {createCaveHazards,advanceFallingCrystal,refractorState,beamTouches,reflectedGuardianLine} from '../src/game/canyonHazards.js';
import {createEnemy as enemy} from '../src/game/enemies.js';
import {yOnTrack} from '../src/game/geometry.js';
import {canyonTwoScore} from '../src/audio/canyonTwoScore.js';
const world=createCanyonTwoWorld({track:(x1,y1,x2,y2,kind)=>({x1,y1,x2,y2,kind}),rect:(x,y,w,h,kind)=>({x,y,w,h,kind,active:true}),orb:(x,y)=>({x,y,active:true}),enemy,yOnTrack,PLAYER_RADIUS:18,WORLD_H:820});
test('cave lower route is continuous and every upper route has a reachable entry',()=>{
 for(let x=0;x<=world.worldW;x+=5)assert.ok(world.tracks.some(t=>t.kind==='cave-floor'&&x>=t.x1&&x<=t.x2),`floor ${x}`);
 assert.deepEqual(world.memoryCores,[]);assert.deepEqual(world.secretTrials,[]);
 for(const t of world.tracks.filter(t=>t.kind==='platform')){const g=world.tracks.find(g=>g.kind==='cave-floor'&&t.x1>=g.x1&&t.x1<=g.x2);assert.ok(yOnTrack(g,t.x1)-t.y1<=150);}
 const cp=world.checkpoints.find(c=>c.boss);assert.ok(cp.x<SANCTUARY.arenaLeft);assert.ok(world.rings.some(r=>r.x>cp.x&&r.x<SANCTUARY.arenaLeft));assert.ok(world.boostOrbs.some(r=>r.x>cp.x&&r.x<SANCTUARY.arenaLeft));
 for(const list of [world.fallingCrystals,world.refractors,world.spikes,world.enemies,world.tunnels])assert.ok(list.every(h=>h.x<SANCTUARY.arenaLeft||h.x>SANCTUARY.arenaRight),'isolated boss arena');
});
test('falling crystal warns once, kills only on actual falling contact, and leaves harmless debris',()=>{
 const c=createCaveHazards(world)[0],p={x:c.x,y:c.floor-18};let warnings=0,impacts=0,hits=0;
 const hooks={warning(){warnings++;},impact(){impacts++;},crush(){hits++;}};
 for(let i=0;i<100;i++)advanceFallingCrystal(c,p,.01,hooks);
 assert.equal(c.state,'warning');assert.equal(hits,0);assert.equal(warnings,1);
 for(let i=0;i<150;i++)advanceFallingCrystal(c,p,.01,hooks);
 assert.equal(c.state,'spent');assert.ok(hits>0);assert.equal(impacts,1);const previous=hits;
 for(let i=0;i<300;i++)advanceFallingCrystal(c,p,.01,hooks);
 assert.equal(hits,previous);assert.equal(warnings,1);assert.equal(createCaveHazards(world)[0].state,'idle');
});
test('normal-speed movement escapes a triggered shard and nearby players are safe',()=>{
 const c=createCaveHazards(world)[0],p={x:c.x-175,y:c.floor-18};let hits=0;
 for(let i=0;i<260;i++){p.x+=240*.01;advanceFallingCrystal(c,p,.01,{crush(){hits++;}});}
 assert.equal(c.state,'spent');assert.equal(hits,0);
});
test('refractors show the identical complete path during warning and fire',()=>{
 const r={x:100,floor:420,phase:0},warn=refractorState(r,3),fire=refractorState(r,4);
 assert.ok(warn.warning&&!warn.active);assert.ok(fire.active&&!fire.warning);assert.deepEqual(warn.points,fire.points);
 assert.ok(beamTouches({x:100,y:265},fire.points));assert.equal(beamTouches({x:100,y:402},fire.points),false);
 assert.equal(refractorState(r,1).active,false);
 const reflected=reflectedGuardianLine({x1:600,y1:315,x2:200,y2:398},0,960,410);assert.equal(reflected.x1,200);assert.equal(reflected.y1,398);assert.ok(reflected.x2>0&&reflected.x2<960);
});
test('Luz Sob a Pedra has eight varied bars, quiet opening and richer ruins',()=>{
 const bars=Array.from({length:8},(_,i)=>canyonTwoScore(i*16,2));assert.ok(new Set(bars.map(b=>b.notes[0].midi)).size>=5);
 assert.equal(canyonTwoScore(4,0).snare,false);assert.equal(canyonTwoScore(4,1).snare,true);
 assert.ok(canyonTwoScore(2,2).notes.length>canyonTwoScore(2,0).notes.length);
 for(let i=0;i<128;i++)for(const n of canyonTwoScore(i,2).notes){assert.ok(Number.isFinite(n.delay));assert.ok(n.duration>0&&n.gain>0&&n.gain<.1);}
});

test('upper landing routes leave room to descend before slide passages',()=>{
 for(const tunnel of world.tunnels)for(const ledge of world.tracks.filter(t=>t.kind==='platform')){
  assert.ok(ledge.x2<tunnel.x-150||ledge.x1>tunnel.x+tunnel.w+50,`ledge ${ledge.x1} conflicts with tunnel ${tunnel.x}`);
 }
});

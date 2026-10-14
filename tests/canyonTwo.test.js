import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanyonTwoWorld,SANCTUARY} from '../src/levels/canyonTwo.js';
import {createCaveHazards,advanceFallingCrystal,refractorState,beamTouches,reflectedGuardianLine,advanceCaveBridge,resetCaveBridge} from '../src/game/canyonHazards.js';
import {createEnemy as enemy} from '../src/game/enemies.js';
import {yOnTrack} from '../src/game/geometry.js';
import {canyonTwoScore} from '../src/audio/canyonTwoScore.js';
const world=createCanyonTwoWorld({track:(x1,y1,x2,y2,kind)=>({x1,y1,x2,y2,kind}),rect:(x,y,w,h,kind)=>({x,y,w,h,kind,active:true}),orb:(x,y)=>({x,y,active:true}),enemy,yOnTrack,PLAYER_RADIUS:18,WORLD_H:820});
test('expanded cave has real waterfall gaps, readable upper entries and an isolated boss',()=>{
 assert.ok(world.worldW>=36000);assert.ok(world.pits.length>=15);
 for(let x=0;x<=world.worldW;x+=5){const gap=world.pits.some(([a,b])=>x>a&&x<b);assert.equal(world.tracks.some(t=>t.kind==='cave-floor'&&x>=t.x1&&x<=t.x2),!gap,`floor ${x}`);}
 assert.equal(world.waterfalls.length,world.pits.length);
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

test('cracked bridges warn, collapse and recover; retry restores solid footing',()=>{
 const p={kind:'cave-crumble'};advanceCaveBridge(p,true,.1);assert.ok(p.crumbleTime>.8&&!p.broken);
 advanceCaveBridge(p,false,.86);assert.ok(p.broken);advanceCaveBridge(p,false,3.5);assert.equal(p.broken,false);
 advanceCaveBridge(p,true,1);assert.ok(p.broken);resetCaveBridge(p);assert.equal(p.broken,false);assert.equal(p.crumbleTime,0);
});
test('mandatory stepping stones remain within normal jump reach and checkpoints never spawn over water',()=>{
 for(const [a,b] of world.pits.filter(([a,b])=>b-a>500)){
  const route=world.tracks.filter(t=>t.x1>=a&&t.x1<b).sort((x,y)=>x.x1-y.x1);assert.ok(route.length>=4);
  for(let i=1;i<route.length;i++)assert.ok(route[i].x1-route[i-1].x2+(route[i].swing||0)+(route[i-1].swing||0)<=290);
 }
 for(const c of world.checkpoints)for(const dx of [-25,0,25])assert.ok(world.tracks.some(t=>t.kind==='cave-floor'&&c.x+dx>=t.x1&&c.x+dx<=t.x2),`unsafe checkpoint ${c.x}`);
});
test('waterfall and fractured aqueduct sections develop the score instead of looping the opening',()=>{
 assert.notDeepEqual(canyonTwoScore(16,0).notes,canyonTwoScore(16,3).notes);
 assert.notDeepEqual(canyonTwoScore(2,2).notes,canyonTwoScore(2,7).notes);
 assert.notDeepEqual(canyonTwoScore(0,3).notes,canyonTwoScore(128,3).notes);
});

test('Canyon 2 thins crystal rewards without removing tutorial arcs or boss approach',()=>{
 assert.ok(world.rings.length<300,'Canyon 2 should no longer flood the route with crystals');
 assert.ok(world.rings.length>160,'Canyon 2 must still reward exploration');
 const firstArc=world.rings.filter(r=>r.x>=1495&&r.x<=1835);
 assert.ok(firstArc.length>=7,'the first waterfall keeps its crystal guide');
 assert.ok(world.rings.some(r=>r.x>34530&&r.x<34800),'boss approach retains a reward');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createCargoLoads,advanceCargoLoad,ventState,ventTouches,conveyorCarry,createFactoryState,advanceFactory} from '../src/game/factoryHazards.js';
import {forestTwoScore} from '../src/audio/forestTwoScore.js';
const load=()=>createCargoLoads({cargoLoads:[{x:500,floor:450,w:88,h:74,trigger:290,delay:1.05}]})[0];
test('cargo warns only near Flux, crushes actual contact, retracts, and resets on retry',()=>{
 const c=load();let warnings=0,hits=0,impacts=0;const hooks={warning(){warnings++;},impact(){impacts++;},crush(){hits++;}};
 advanceCargoLoad(c,{x:0,y:432},2,hooks);assert.equal(c.state,'idle');
 for(let i=0;i<100;i++)advanceCargoLoad(c,{x:500,y:432},.01,hooks);
 assert.equal(warnings,1);assert.equal(hits,0);assert.equal(c.state,'warning');
 for(let i=0;i<40;i++)advanceCargoLoad(c,{x:500,y:432},.01,hooks);
 assert.ok(hits>0);assert.equal(impacts,1);
 const count=hits;for(let i=0;i<250;i++)advanceCargoLoad(c,{x:100,y:432},.01,hooks);
 assert.equal(hits,count);assert.equal(c.extension,0);assert.equal(load().state,'idle');
});
test('standing outside a cargo and above a fully lowered load stays safe',()=>{
 for(const p of [{x:600,y:432},{x:500,y:250}]){const c=load();c.state='closed';c.extension=1;let hit=false;advanceCargoLoad(c,p,.01,{crush(){hit=true;}});assert.equal(hit,false);}
});
test('spores and steam warn before their bounded jumpable discharge',()=>{
 const v={x:100,y:450,w:66,h:84,period:4.4,phase:0};
 assert.equal(ventState(v,1.5).warning,true);assert.equal(ventTouches(v,{x:100,y:432},1.5),false);
 assert.equal(ventTouches(v,{x:100,y:432},2.5),true);assert.equal(ventTouches(v,{x:100,y:320},2.5),false);
 assert.equal(ventTouches(v,{x:100,y:432},2.5,true),false);
});
test('conveyors carry in opposite directions only when grounded and powered',()=>{
 const f={kind:'factory-belt',belt:-160};assert.equal(conveyorCarry(f,true,.5),-80);assert.equal(conveyorCarry({...f,belt:150},true,.5),75);assert.equal(conveyorCarry(f,false,.5),0);assert.equal(conveyorCarry(f,true,.5,true),0);
});
test('factory remembers its awakening while backtracking, then shuts down after Helix',()=>{
 const s=createFactoryState();advanceFactory(s,28000,false,10);assert.ok(s.power>.8);const power=s.power;
 advanceFactory(s,2000,false,1);assert.ok(s.power>=power);
 advanceFactory(s,32000,true,10);assert.ok(s.power<.01);assert.equal(s.defeated,true);assert.equal(s.shutdown,10);
 const c=load();c.state='falling';c.extension=.5;let hit=false;advanceCargoLoad(c,{x:500,y:432},1,{crush(){hit=true;}},true);assert.equal(c.extension,0);assert.equal(hit,false);
});
test('sixteen-bar score develops distinct garden and reactor arrangements, then rests',()=>{
 assert.notDeepEqual(forestTwoScore(0,0),forestTwoScore(0,4));assert.notDeepEqual(forestTwoScore(0,4),forestTwoScore(0,6));
 assert.notDeepEqual(forestTwoScore(128,0),forestTwoScore(0,0));
 for(let z=0;z<9;z++)for(let i=0;i<256;i++){const s=forestTwoScore(i,z);for(const n of s.notes){assert.ok(Number.isFinite(n.midi)&&n.midi>0&&n.midi<128);assert.ok(n.gain>0&&n.gain<.1);assert.ok(n.duration>0);}}
 for(let i=0;i<16;i++){const s=forestTwoScore(i,8,false,true);assert.equal(s.kick||s.snare||s.hat||s.metal,false);}
});

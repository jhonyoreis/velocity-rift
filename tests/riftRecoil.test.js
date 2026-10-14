import test from 'node:test';
import assert from 'node:assert/strict';
import {createOriginalRift} from '../src/game/originalRift.js';
import {FLUX_HIT_RECOIL} from '../src/game/fluxMotion.js';

function takeNormalRiftHit({facing,gravity}){
 let actor;
 const rift=createOriginalRift({onFrame:s=>{actor=s;}});
 rift.start(9);
 rift.update(1/120,new Set());
 assert.ok(actor,'the actor must exist before the damage scenario');
 Object.assign(actor,{x:800,y:300,vx:0,vy:0,grounded:false,
  facing,gravity,crystals:100,invincible:0,dimension:0,dash:0,
  shots:[{x:800,y:300,vx:0,vy:0,life:2,dimension:0}]});
 rift.update(1/120,new Set());
 return rift.info();
}

test('Fenda Original knocks Flux backwards and up exactly like other stages',()=>{
 const s=takeNormalRiftHit({facing:1,gravity:1});
 assert.equal(s.vx,-FLUX_HIT_RECOIL.horizontal);
 assert.equal(s.vy,-FLUX_HIT_RECOIL.vertical);
 assert.equal(s.invincible,FLUX_HIT_RECOIL.invulnerability);
 assert.equal(s.grounded,false);
 assert.equal(s.dash,0);
 assert.equal(s.crystals,65,'Fenda Original retains its prior damage balance');
 assert.equal(s.damageCount,1);
 assert.equal(s.dead,false);
});

test('damage reacts against facing and remains coherent during reversed gravity',()=>{
 const s=takeNormalRiftHit({facing:-1,gravity:-1});
 assert.equal(s.vx,FLUX_HIT_RECOIL.horizontal);
 assert.equal(s.vy,FLUX_HIT_RECOIL.vertical);
 assert.ok(s.fx.hit>0);
 assert.equal(s.damageCount,1);
});

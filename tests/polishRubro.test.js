import test from "node:test";
import assert from "node:assert/strict";
import {createRubroState,activateRubro,updateRubro,RUBRO} from "../src/game/rubro.js";
import {calculateCrystalDamage} from "../src/game/crystals.js";
import {createOriginalRift} from "../src/game/originalRift.js";
import {createRiftRouteDriver} from "../scripts/rift-route-driver.mjs";
import {createVictorySequence,sampleVictorySequence,ALICIA_RESCUE_X} from "../src/game/victorySequence.js";
import {tunnelProfile,tunnelFloorAt,polishWorldObstacles} from "../src/game/tunnelProfile.js";
test("Rubro requires campaign completion and twenty crystals, transforms once and lasts without a timer",()=>{
 const s=createRubroState();assert.equal(activateRubro(s,false,100),false);assert.equal(activateRubro(s,true,19),false);
 assert.equal(activateRubro(s,true,20),true);assert.equal(activateRubro(s,true,20),false);assert.equal(s.active,false);
 updateRubro(s,RUBRO.transformSeconds,20);assert.equal(s.active,true);updateRubro(s,10000,1);assert.equal(s.active,true);
 updateRubro(s,1,0);assert.deepEqual(s,createRubroState());
});
test("Rubro reduces crystal damage without making pits survivable",()=>{
 assert.equal(calculateCrystalDamage(100,{rubro:true}).lost,10);assert.equal(calculateCrystalDamage(20,{rubro:true}).lost,2);
 assert.deepEqual(calculateCrystalDamage(1,{rubro:true}),{remaining:0,lost:1,dead:false});
 assert.equal(calculateCrystalDamage(100,{rubro:true,fall:true}).dead,true);
});
test("a sloped slide tunnel keeps constant clearance and its crystals outside the roof",()=>{
 const w={tracks:[{x1:0,x2:100,y1:435,y2:435,kind:"canyon"},{x1:100,x2:300,y1:435,y2:345,kind:"rise"}],
 tunnels:[{x:40,w:200,ground:435}],rings:[{x:150,y:400}],walls:[{x:20,y:355,h:80,kind:"break-gate"}]};
 polishWorldObstacles(w);const p=tunnelProfile(w.tunnels[0],w.tracks);assert.deepEqual(p.map(p=>p.x),[40,100,240]);
 assert.ok(p.at(-1).y<p[0].y);assert.equal(w.rings[0].y,tunnelFloorAt(w.tunnels[0],w.tracks,150)-14);
 assert.equal(w.walls[0].h,190);assert.equal(w.walls[0].y+w.walls[0].h,435);
});
test("Sovereign destruction, barrier dissolution and Flux reunion happen before the final callback",()=>{
 let endings=0;const r=createOriginalRift({onFinish:()=>endings++});r.start(9);const d=createRiftRouteDriver();
 for(let i=0;i<120*320&&!r.info().victory;i++)r.update(1/120,d(r.info()));
 const before=r.info();assert.ok(before.victory);assert.equal(before.finished,false);assert.equal(endings,0);assert.equal(before.invincible,0);assert.equal(before.messageTime,0);assert.equal(before.boss.resonance,null);
 const v=createVictorySequence(before);assert.equal(sampleVictorySequence(v).bossOpacity,1);
 v.elapsed=3.2;assert.equal(sampleVictorySequence(v).bossOpacity,0);assert.equal(sampleVictorySequence(v).barrierOpacity,0);
 for(let i=0;i<120*25&&!r.info().finished;i++)r.update(1/120,new Set(["arrowleft","shift"," "]));
 const after=r.info();assert.equal(after.finished,true);assert.equal(after.x,ALICIA_RESCUE_X);assert.equal(after.y,632);
 assert.equal(after.time,before.time,"scripted rescue must not inflate the race time");assert.equal(endings,1);
 r.update(.1,new Set());assert.equal(endings,1);
});
test("final-stage Rubro boosts speed and destroys otherwise unblockable enemy shots",()=>{
 const form=createRubroState();let inject=true;
 const r=createOriginalRift({rubroState:form,onFrame:s=>{if(inject){s.crystals=20;inject=false;}}});r.start(9);
 for(let i=0;i<5;i++)r.update(1/120,new Set());activateRubro(form,true,r.info().crystals);
 for(let i=0;i<120;i++)r.update(1/120,new Set());assert.equal(r.info().rubro,true);
 for(let i=0;i<72;i++)r.update(1/120,new Set(["arrowright"]));assert.equal(r.info().vx,480*RUBRO.speed);
 r.update(1/120,new Set(["arrowright","shift"]));let s=r.info();const held=s.crystals;
 s.shots.push({x:s.x+s.vx/120,y:s.y,vx:0,vy:0,life:2,unblockable:true});
 r.update(1/120,new Set(["arrowright","shift"]));s=r.info();assert.equal(s.damageCount,0);assert.equal(s.crystals,held);assert.equal(s.shots.length,0);
});

test("Rubro also reduces the pursuit barrier impact while base Flux still loses all crystals",()=>{
 for(const empowered of [false,true]){
  const form=createRubroState();let inject=true;
  const r=createOriginalRift({rubroState:form,onFrame:s=>{if(inject){s.crystals=100;s.boss.mode="chase";s.boss.barrierX=s.x-10;form.active=empowered;inject=false;}}});r.start(9);
  r.update(1/120,new Set());r.update(1/120,new Set());
  assert.equal(r.info().crystals,empowered?90:0);assert.equal(r.info().damageCount,1);assert.equal(r.info().rubro,empowered);
 }
});

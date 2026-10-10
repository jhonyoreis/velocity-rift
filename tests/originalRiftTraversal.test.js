import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalRift,RIFT_FINISH_X} from "../src/game/originalRift.js";
import {createOriginalRiftLayout,RIFT_WORLD_WIDTH,RIFT_SECTORS,platformSurface,laserState} from "../src/levels/originalRift.js";
import {createRiftRouteDriver} from "../scripts/rift-route-driver.mjs";
function traverse(rift,until=()=>false,max=120*150){
 const inputs=createRiftRouteDriver();
 for(let i=0;i<max;i++){
  const s=rift.info();if(s.dead||s.finished||until(s))return s;
  rift.update(1/120,inputs(s));
 }return rift.info();
}
test("the official traversal is longer than all three chapters and uses bounded resources",()=>{
 const map=createOriginalRiftLayout();assert.ok(RIFT_WORLD_WIDTH>34000);
 assert.equal(RIFT_SECTORS.length,9);assert.equal(map.checkpoints.length,9);
 assert.equal(new Set(map.enemies.map(e=>e.type)).size,4);
 assert.ok(map.portals.length>=5&&map.anchors.length>=5);
 for(const cp of map.checkpoints){
  assert.ok(map.platforms.some(p=>(p.dimension===-1||p.dimension===cp.dimension)&&
   p.orientation===(cp.gravity>0?"floor":"ceiling")&&cp.x>=p.x1&&cp.x<=p.x2&&
   Math.abs(platformSurface(p,cp.x,0)-(cp.y+cp.gravity*18))<2),"checkpoint on solid ground");
  assert.ok(map.items.some(i=>i.type==="boost"&&Math.abs(i.x-cp.x)<70),"recovery orb after checkpoint");
 }
});
test("input-only run crosses every sector, five portals, both gravities, dimensions and final dash membrane",()=>{
 let endings=0;const rift=createOriginalRift({onFinish:()=>endings++});rift.start(9);
 const s=traverse(rift);
 assert.equal(s.dead,false);assert.equal(s.finished,true);assert.equal(endings,1);
 assert.equal(s.checkpointIndex,8);assert.equal(s.visitedSectors.length,9);
 assert.equal(s.seen.filter(x=>x.startsWith("portal:")).length,5);
 assert.equal(s.seen.filter(x=>x.startsWith("anchor:")).length,5);
 assert.equal(s.broken,12);assert.ok(s.defeated>20);
 assert.ok(s.topSpeed>1000&&s.topSpeed<=1180);assert.ok(s.x>=RIFT_FINISH_X);
 assert.ok(s.crystals>0&&s.boost>=0&&s.boost<=100);
 rift.update(1,new Set(["arrowright"]));assert.equal(endings,1,"finish callback runs once");
});
test("fatal pit uses death callback and checkpoint retains dimension, gravity and elapsed time",()=>{
 let deaths=0;const rift=createOriginalRift({onDeath:fell=>{assert.equal(fell,true);deaths++;}});rift.start(9);
 const at=traverse(rift,s=>s.checkpointIndex===6);
 assert.equal(at.checkpoint.gravity,-1);
 // Walk off the ceiling without jumping. Continue past the end into the void.
 for(let i=0;i<1800&&!rift.info().dead;i++)rift.update(1/120,new Set(["arrowleft"]));
 assert.equal(rift.info().dead,true);assert.equal(deaths,1);
 const time=rift.info().time;rift.respawn();const s=rift.info();
 assert.equal(s.gravity,-1);assert.equal(s.dimension,0);assert.equal(s.x,s.checkpoint.x);
 assert.equal(s.dead,false);assert.equal(s.crystals,0);assert.equal(s.time,time);
 for(let i=0;i<50;i++)rift.update(1/120,new Set(["arrowright"]));
 assert.ok(rift.info().boost>0,"checkpoint orb restores boost");
});
test("energy only refills at boost orbs, not crystals or broken obstacles",()=>{
 const rift=createOriginalRift();rift.start(9);
 const inputs=createRiftRouteDriver();let checked=0;
 for(let i=0;i<900;i++){
  const a=rift.info();rift.update(1/120,inputs(a));const b=rift.info();
  if(b.boost>a.boost){
   assert.ok(b.collected>a.collected,"each energy increase requires collection");checked++;
  }
 }
 assert.ok(checked>2);
});
test("lasers have warnings and rests while moving platforms stay inside reachable amplitudes",()=>{
 const layout=createOriginalRiftLayout();
 for(const h of layout.hazards.filter(x=>x.type==="laser")){
  assert.equal(laserState(h,h.period-h.offset+.1),"warning");
  assert.equal(laserState(h,h.period-h.offset+1),"active");
  assert.equal(laserState(h,h.period-h.offset+2),"off");
 }
 for(const p of layout.platforms.filter(x=>x.motion))
  for(let t=0;t<10;t+=.3)assert.ok(Math.abs(platformSurface(p,p.x1,t)-p.y1)<=24);
});
test("TESTE 100% opens access and boosts capacity while normal fatal damage remains enabled",()=>{
 let deaths=0;const rift=createOriginalRift({boostCapacity:()=>150,onDeath:()=>deaths++});rift.start(0,true);
 assert.equal(rift.info().cores,0);assert.equal(rift.info().capacity,150);
 traverse(rift,s=>s.checkpointIndex===2);
 for(let i=0;i<1500&&!rift.info().dead;i++)rift.update(1/120,new Set(["arrowleft"]));
 assert.equal(rift.info().dead,true);assert.equal(deaths,1);
});

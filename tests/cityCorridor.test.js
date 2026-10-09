import test from "node:test";
import assert from "node:assert/strict";
import {createRiftCorridor,RIFT_CORRIDOR_START,RIFT_BOSS_ARENA_LEFT,RIFT_WORLD_WIDTH} from "../src/levels/riftCorridor.js";
import {createStageThreeWorld} from "../src/levels/city.js";
import {cityParallaxRange} from "../src/rendering/scenery.js";
const track=(x1,y1,x2,y2,kind)=>({x1,y1,x2,y2,kind});
const rect=(x,y,w,h,kind)=>({x,y,w,h,kind});
const enemy=(x,y,patrol)=>({x,y,baseX:x,yBase:y,patrol,phase:0,alive:true});
const orb=(x,y)=>({x,y,r:15,active:true});
const PLAYER_RADIUS=18;
const getWorld=()=>createStageThreeWorld({track,rect,enemy,orb,PLAYER_RADIUS,WORLD_H:820});

test("skyline parallax remains visible from the city entrance to the arena",()=>{
  const VIEW_W=960;
  for(const cameraX of [0,900,4000,8600,12800,15000,17500,21000,22000]){
    for(const [step,shift] of [[222,.17],[170,.33],[140,.57]]){
      const {first,last}=cityParallaxRange(cameraX,VIEW_W,step,shift);
      const buildings=Array.from({length:last-first+1},(_,k)=>first+k).map(i=>{
        const screenX=i*step-cameraX*shift;
        return {left:screenX,right:screenX+step*.72};
      });
      assert.ok(buildings.some(b=>b.left<VIEW_W&&b.right>0),
        "No skyline layer visible at cameraX "+cameraX+" shift "+shift);
    }
  }
});

test("rift corridor has six dash-gated gaps, moving elevators, vanishing platforms and no enemies",()=>{
  const area=createRiftCorridor({track,PLAYER_RADIUS});
  assert.equal(area.start,RIFT_CORRIDOR_START);
  assert.equal(area.end,RIFT_BOSS_ARENA_LEFT);
  assert.equal(area.enemies.length,0);
  assert.equal(area.pits.length,6);
  assert.ok(area.pits.every(([a,b])=>b-a===215));
  assert.ok(area.tracks.filter(t=>t.kind==="rift-elevator").length>=4);
  assert.ok(area.tracks.filter(t=>t.kind==="rift-phase").length>=3);
  assert.ok(area.spikes.length>=3);
  assert.equal(area.checkpoints.length,2);
  const w=getWorld();
  assert.equal(w.worldW,RIFT_WORLD_WIDTH);
  assert.equal(w.pits.length,9);
  assert.ok(w.enemies.every(e=>e.x<area.start));
  assert.deepEqual(w.checkpoints.slice(-2).map(c=>c.x),[17770,21820]);
  assert.equal(w.goal.x,RIFT_WORLD_WIDTH-345);
});

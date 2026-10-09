import test from "node:test";
import assert from "node:assert/strict";
import {riftPlatformPhase,riftElevatorY} from "../src/game/riftPlatforms.js";
import {createRiftCorridor} from "../src/levels/riftCorridor.js";
const track=(x1,y1,x2,y2,kind)=>({x1,y1,x2,y2,kind});
const area=createRiftCorridor({track,PLAYER_RADIUS:18});
test("vanishing platforms warn, disappear and reappear in cycles",()=>{
 const floor=area.tracks.find(t=>t.kind==="rift-phase");
 assert.equal(riftPlatformPhase(floor,0).solid,true);
 assert.equal(riftPlatformPhase(floor,floor.solidFor-floor.phase-.15).warning,true);
 assert.equal(riftPlatformPhase(floor,floor.solidFor-floor.phase+.05).solid,false);
 assert.equal(riftPlatformPhase(floor,floor.period-floor.phase-.1).solid,false);
 assert.equal(riftPlatformPhase(floor,floor.period).solid,true);
});
test("vertical elevators carry predictable positions and preserve initial height",()=>{
 const lifts=area.tracks.filter(t=>t.kind==="rift-elevator");
 assert.equal(lifts.length,5);
 for(const lift of lifts){
   assert.ok(Math.abs(riftElevatorY(lift,0)-lift.initialY)<1e-9);
   assert.notEqual(riftElevatorY(lift,.9),riftElevatorY(lift,0));
   for(const seconds of [0,.6,1,2.3,8])
     assert.ok(Math.abs(riftElevatorY(lift,seconds)-lift.originY)<=lift.swingY+1e-9);
 }
});

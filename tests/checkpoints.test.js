import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkpointReached,checkpointRespawnTarget} from "../src/game/checkpoints.js";

test("crossing an activated checkpoint respawns at the latest checkpoint",()=>{
 const points=[{x:950,y:400,active:true},{x:2500,y:404,active:true},
               {x:5300,y:404,active:false}];
 const spawn={x:90,y:402};
 assert.deepEqual(checkpointRespawnTarget(points,1,spawn),
   {x:2500,y:404,fromCheckpoint:true});
 assert.deepEqual(checkpointRespawnTarget(points,0,spawn),
   {x:950,y:400,fromCheckpoint:true});
});
test("without an activated checkpoint the restart returns to the stage start",()=>{
 const points=[{x:950,y:400,active:false}];
 const spawn={x:90,y:402};
 for(const index of [-1,0,25])
   assert.deepEqual(checkpointRespawnTarget(points,index,spawn),
     {x:90,y:402,fromCheckpoint:false});
});
test("checkpoint activates when Flux passes near the flag, including short jumps",()=>{
 const point={x:950,y:400};
 assert.equal(checkpointReached(point,{x:955,y:368,onGround:false}),true);
 assert.equal(checkpointReached(point,{x:960,y:326,onGround:false}),true);
 assert.equal(checkpointReached(point,{x:954,y:280,onGround:false}),false);
 assert.equal(checkpointReached(point,{x:940,y:400,onGround:true}),false);
});
test("death retry uses checkpoint respawn instead of resetting the whole level",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 const begin=main.indexOf("function restartAfterDeath(){");
 const end=main.indexOf("function showMainMenu()",begin);
 assert.ok(begin>0&&end>begin);
 const body=main.slice(begin,end);
 assert.ok(body.includes("checkpointRespawnTarget(checkpoints,checkpointIndex,spawn)"));
 assert.ok(body.includes("player.x=target.x;player.y=target.y"));
 assert.ok(body.includes("gameStarted=true"));
 assert.ok(body.includes("startGame(activeStage,true,false)"));
 assert.ok(!body.includes("resetGame()")||body.includes("Do NOT call resetGame()"));
 assert.ok(main.includes('addEventListener("click",restartAfterDeath)'));
});

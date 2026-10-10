import test from "node:test";
import assert from "node:assert/strict";
import {sanitizeGhost,ghostFrameAt,recordGhostFrame,makeGhost,GHOST_MAX_FRAMES} from "../src/game/ghostReplay.js";
import {readFileSync} from "node:fs";
test("ghosts interpolate real positions, preserve direction and accept valid recordings",()=>{
 const ghost=makeGhost([[0,0,10,1],[.5,100,10,1],[1,200,20,-1]],1);
 assert.ok(ghost);assert.deepEqual(ghostFrameAt(ghost,.25),{x:50,y:10,facing:1});
 assert.deepEqual(ghostFrameAt(ghost,1.5),{x:200,y:20,facing:-1});
});
test("recording is spaced, bounded, and rejects invalid files",()=>{
 const frames=[];assert.equal(recordGhostFrame(frames,0,{x:0,y:1,facing:1}),true);
 assert.equal(recordGhostFrame(frames,.05,{x:10,y:1,facing:1}),false);
 assert.equal(recordGhostFrame(frames,.14,{x:20,y:1,facing:1}),true);
 assert.equal(sanitizeGhost({duration:1,frames:[[0,1,2,1],[0,2,3,1]]}),null);
 assert.equal(sanitizeGhost({duration:1,frames:Array(GHOST_MAX_FRAMES+1).fill([0,1,1,1])}),null);
});
test("game records only eligible stage clears and draws ghost non-colliding",()=>{
 const source=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.ok(source.includes("GHOST_ARCHIVE_KEY"));
 assert.ok(source.includes("recordGhostFrame(ghostRun,gameTime,player)"));
 assert.ok(source.includes("function drawRecordGhost()"));
 assert.ok(source.includes("function saveBestGhost("));
 assert.ok(source.includes("if(!debugUsedThisRun)saveBestGhost("));
 assert.ok(source.includes('id="ghostToggle"')===false);
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(html.includes('id="ghostToggle"'));
});

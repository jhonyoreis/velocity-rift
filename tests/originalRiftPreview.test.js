import test from "node:test";
import assert from "node:assert/strict";
import {countRiftKeys,RIFT_CORE_REQUIREMENT,RIFT_PREVIEW_WIDTH,riftGateOpen,
 portalDestination,previewPlatforms,createOriginalRiftPreview} from "../src/game/originalRiftPreview.js";
const save=stages=>({extras:{cores:Object.fromEntries([1,2,3].map((id,i)=>
 ["stage"+id,stages[i]]))}});
test("altar requires nine distinct cores from this campaign and never trusts duplicates",()=>{
 assert.equal(RIFT_CORE_REQUIREMENT,9);
 assert.equal(countRiftKeys(save([[],[],[]])),0);
 assert.equal(countRiftKeys(save([[0,1,2],[0,1],[0,1,2]])),8);
 assert.equal(countRiftKeys(save([[0,0,99,1,2],[0,1,2],[0,1,2]])),9);
 assert.equal(countRiftKeys(null),0);
 assert.equal(countRiftKeys(null,true),9);
 assert.equal(riftGateOpen(8),false);
 assert.equal(riftGateOpen(9),true);
});
test("fourth chapter keeps gravity, dimensions and momentum separate from campaign stages",()=>{
 assert.equal(RIFT_PREVIEW_WIDTH,10000);
 const platforms=previewPlatforms();
 assert.ok(platforms.length>=16);
 assert.ok(platforms.some(x=>x.orientation==="ceiling"));
 assert.ok(platforms.some(x=>x.dimension===1));
 assert.deepEqual(portalDestination("a"),{x:2825,y:201,gravity:-1,dimension:0});
 assert.equal(portalDestination("b").gravity,1);
 assert.equal(portalDestination("c").dimension,1);
 assert.equal(portalDestination("unknown"),null);
});
test("stage 4 entrance is blocked without nine cores; debug preview is session-only",()=>{
 const demo=createOriginalRiftPreview();
 demo.start(8,false);
 assert.equal(demo.info().gateOpened,false);
 for(let i=0;i<300;i++)demo.update(1/120,new Set(["arrowright"]));
 assert.ok(demo.info().x<=427,"gate must not allow passage");
 demo.start(9,false);
 assert.equal(demo.info().gateOpened,true);
 for(let i=0;i<300;i++)demo.update(1/120,new Set(["arrowright"]));
 assert.ok(demo.info().x>427,"nine-core run can pass");
 demo.start(0,true);
 assert.equal(demo.info().gateOpened,true);
 assert.equal(demo.info().cores,0,"debug does not counterfeit earned cores");
});
test("a temporary preview ends without claiming a campaign clear",()=>{
 let exits=0;
 const demo=createOriginalRiftPreview({onExit:()=>exits++});
 demo.start(0,false);
 demo.update(1/60,new Set(["arrowleft"]));
 // Move through the return portal on the left, without touching saved data.
 for(let i=0;i<180;i++)demo.update(1/120,new Set(["arrowleft"]));
 assert.equal(exits,1);
 assert.equal(demo.active,false);
 demo.start(9,false);
 assert.equal(demo.info().finished,false);
 demo.stop();
 assert.equal(demo.active,false);
});

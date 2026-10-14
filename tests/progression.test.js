import test from "node:test";
import assert from "node:assert/strict";
import {gradeForTime} from "../src/game/scoring.js";
import {computeCampaignCompletion} from "../src/game/completion.js";
import {yOnTrack,circleRect,distance,approach,clamp,lerp} from "../src/game/geometry.js";

test("S/A boundaries stay consistent with original gameplay",()=>{
 assert.equal(gradeForTime(74.99,1),"S");
 assert.equal(gradeForTime(75,1),"A");
 assert.equal(gradeForTime(104.99,2),"S");
 assert.equal(gradeForTime(105,2),"A");
 assert.equal(gradeForTime(109.99,3),"S");
 assert.equal(gradeForTime(110,3),"A");
});
test("six-destination completion counts the final chapter and its collectibles",()=>{
 const c={stage1Completed:true,canyonFirstCompleted:true,stage2Completed:true,stage3Completed:true,extras:{
   cores:{stage1:[0,1,2],stage2:[0,1,2],stage3:[0,1,2]},
   secrets:{stage1:["a","b","c"],stage2:["d","e","f"],stage3:["g","h","i"]}}};
 assert.deepEqual(computeCampaignCompletion(c,{completed:true},{completed:true}),{stages:5,cores:9,secrets:9,percent:78});
 c.stage3Completed=false;
 assert.equal(computeCampaignCompletion(c,{completed:true},{completed:true}).percent,72);
});
test("shared pure geometry calculations",()=>{
 assert.equal(clamp(12,0,10),10);
 assert.equal(lerp(10,20,.5),15);
 assert.equal(approach(2,10,3),5);
 assert.equal(distance(0,0,3,4),5);
 assert.equal(yOnTrack({x1:0,y1:10,x2:100,y2:20},50),15);
 assert.equal(circleRect(5,5,2,{x:0,y:0,w:10,h:10}),true);
});

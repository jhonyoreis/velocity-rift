import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_ROUTE,routeState,migrateCampaignRoute,nextRouteNode,resumeRouteNode,routeId} from '../src/game/campaignRoute.js';
import {computeCampaignCompletion} from '../src/game/completion.js';
import {partApproachHeight,PART_APPROACH_SECONDS} from '../src/rendering/partApproach.js';
import {sampleStageArrival} from '../src/game/stageArrival.js';
test('a fresh official campaign opens exactly one new destination after each clear',()=>{
 const c={routeVersion:1},f={},p={};
 const done=[()=>c.stage1Completed=true,()=>f.completed=true,()=>c.canyonFirstCompleted=true,()=>{p.completed=true;c.stage2Completed=true;},()=>c.stage3Completed=true,()=>c.stage4Completed=true];
 for(let i=0;i<6;i++){
  const route=routeState(c,f,p);
  assert.equal(route.filter(n=>n.unlocked).length,i+1);
  assert.equal(route.filter(n=>n.completed).length,i);
  assert.equal(nextRouteNode(c,f,p).id,CAMPAIGN_ROUTE[i].id);
  done[i]();
 }
 assert.ok(routeState(c,f,p).every(n=>n.completed&&n.unlocked));
});
test('migration preserves old destinations without fabricating new part clears',()=>{
 const c=migrateCampaignRoute({started:true,stage1Completed:true,stage2Completed:true,stage3Completed:true,lastStage:4},{},{});
 const route=routeState(c);
 assert.equal(route.find(n=>n.id==='city').unlocked,true);
 assert.equal(route.find(n=>n.id==='final').unlocked,true);
 assert.equal(route.find(n=>n.id==='forest2').completed,false);
 assert.equal(route.find(n=>n.id==='canyon2').completed,false);
 assert.equal(c.canyonFirstCompleted,true);
 assert.deepEqual(migrateCampaignRoute(c),c);
});
test('experimental pending runs resume in the exact second part across migration',()=>{
 for(const [f,p,id] of [[{pending:true},{},'forest2'],[{}, {pending:true},'canyon2']]){
  const c=migrateCampaignRoute({started:true,lastStage:1},f,p);
  assert.equal(resumeRouteNode(c,f,p).id,id);
  assert.equal(routeState(c,f,p).find(n=>n.id===id).unlocked,true);
 }
});
test('an official fresh save never imports legacy shortcuts or unlocks from debug',()=>{
 const c=migrateCampaignRoute({routeVersion:1,started:false,stage1Completed:false,lastNode:'canyon2',legacyUnlocked:['invalid']});
 assert.equal(c.lastNode,'forest1');assert.deepEqual(c.legacyUnlocked,[]);
 const before=JSON.stringify(c);assert.ok(routeState(c,{}, {},true).every(n=>n.unlocked));assert.equal(JSON.stringify(c),before);
 assert.equal(routeState(c).filter(n=>n.unlocked).length,1);
 assert.equal(routeId(2,2),'canyon2');assert.equal(routeId(4,2),undefined);
});
test('six clears and every collectible reach 100%; second parts contribute to completion',()=>{
 const c={stage1Completed:true,canyonFirstCompleted:true,stage2Completed:true,stage3Completed:true,stage4Completed:true,extras:{cores:{},secrets:{}}};
 for(let i=1;i<=4;i++){c.extras.cores['stage'+i]=[0,1,2];c.extras.secrets['stage'+i]=['a','b','c'];}
 assert.equal(computeCampaignCompletion(c).percent,87);
 assert.deepEqual(computeCampaignCompletion(c,{completed:true},{completed:true}),{stages:6,cores:12,secrets:12,percent:100});
});
test('part approaches smoothly land at the original spawn height and stop',()=>{
 for(const stage of [1,2]){
  assert.equal(Math.abs(partApproachHeight(stage,1)),0);
  let previous=-1;
  for(let t=0;t<PART_APPROACH_SECONDS;t+=.01){
   const sample=sampleStageArrival(t,{duration:PART_APPROACH_SECONDS});
   assert.ok(sample.progress>=previous);previous=sample.progress;
   assert.ok(Number.isFinite(partApproachHeight(stage,sample.progress)));
  }
  const end=sampleStageArrival(PART_APPROACH_SECONDS,{duration:PART_APPROACH_SECONDS});
  assert.equal(end.finished,true);assert.equal(end.progress,1);assert.equal(end.speed,0);
 }
 assert.ok(partApproachHeight(2,0)<-100);
});

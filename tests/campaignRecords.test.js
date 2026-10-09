import test from "node:test";
import assert from "node:assert/strict";
import {emptyCampaignRecords,loadCampaignRecords,recordCampaignClear} from "../src/game/campaignRecords.js";

const archive={stage1:{bestTime:9.79,bestGrade:"S",clears:7},stage2:{bestTime:104,bestGrade:"A",clears:2}};
test("a new campaign has no stage records even with an old archive",()=>{
 const fresh=emptyCampaignRecords();
 const current=loadCampaignRecords(fresh,{stage1:false,stage2:false,stage3:false},archive);
 assert.equal(current.stage1.bestTime,0);
 assert.equal(current.stage1.bestGrade,"");
 assert.equal(current.stage1.clears,0);
 assert.equal(current.stage2.bestTime,0);
});
test("completed legacy campaigns retain stage times on migration",()=>{
 const migrated=loadCampaignRecords(undefined,{stage1:true,stage2:false,stage3:false},archive);
 assert.equal(migrated.stage1.bestTime,9.79);
 assert.equal(migrated.stage1.clears,7);
 assert.equal(migrated.stage2.bestTime,0);
});
test("records track only current campaign attempts",()=>{
 const records=emptyCampaignRecords();
 assert.equal(recordCampaignClear(records,1,115,"B"),true);
 assert.equal(recordCampaignClear(records,1,120,"A"),false);
 assert.equal(records.stage1.bestTime,115);
 assert.equal(records.stage1.bestGrade,"A");
 assert.equal(records.stage1.clears,2);
 const restarted=emptyCampaignRecords();
 assert.equal(restarted.stage1.bestTime,0);
 assert.equal(records.stage1.bestTime,115);
});
test("invalid saved record data is safely ignored",()=>{
 const records=loadCampaignRecords({stage1:{bestTime:-123,bestGrade:"X",clears:-2}}, {},archive);
 assert.deepEqual(records.stage1,{bestTime:0,bestGrade:"",clears:0});
});

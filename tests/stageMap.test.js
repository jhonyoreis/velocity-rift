import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
const start=html.indexOf('<section id="stageMenu"'),end=html.indexOf('<section id="achievementsMenu"',start);
const map=html.slice(start,end);

test("map contains four clearly labeled selectable regions with one detail panel",()=>{
 assert.ok(map.includes('class="menu-screen rift-map-screen rift-map-clean"'));
 for(const [id,label] of [["One","Floresta Neon"],["Two","Cânion Prisma"],
   ["Three","Cidade das Fendas"],["Four","Fenda Original"]]){
   assert.ok(map.includes('id="mapNodeStage'+id+'"'),id);
   assert.ok(map.includes(label),label);
   assert.ok(map.includes('id="stage'+id+'Card"'));
 }
 assert.ok(map.includes('id="mapCampaignSummary"'));
 assert.ok(map.includes('id="backToMainButton"'));
 assert.equal(map.includes("stageAchievementsButton"),false);
 assert.equal(map.includes("mapAchievementsSummary"),false);
 assert.equal(map.includes("mapPathToCity"),false);
});
test("each stage shows only current-campaign time, cores and secrets",()=>{
 for(const name of ["One","Two","Three"]){
   assert.ok(map.includes('id="mapStage'+name+'Best"'));
   assert.ok(map.includes('id="mapStage'+name+'Cores"'));
   assert.ok(map.includes('id="mapStage'+name+'Secrets"'));
   assert.ok(!map.includes('id="mapStage'+name+'Grade"'));
 }
 assert.ok(main.includes('const record=campaign.records["stage"+stage]'));
 assert.ok(main.includes('campaign.extras.cores["stage"+stage].length+"/3"'));
 assert.ok(main.includes('campaign.extras.secrets["stage"+stage].length+"/3"'));
 assert.ok(!main.includes('document.querySelector("#mapStage"+suffix+"Grade")'));
});
test("new campaign resets its own records but retains historical archive",()=>{
 assert.ok(main.includes('records:emptyCampaignRecords()'));
 assert.ok(main.includes('records:loadCampaignRecords(saved.records'));
 assert.ok(main.includes('recordCampaignClear(campaign.records,activeStage,time,grade)'));
 const start=main.indexOf("function resetCampaign(){");
 const end=main.indexOf("function recordCampaignCore",start);
 assert.ok(start>0&&end>start);
 const reset=main.slice(start,end);
 assert.ok(!reset.includes('localStorage.removeItem(PROGRESS_KEY)'));
 assert.ok(!reset.includes("storeProgress()"));
});
test("new design hides background HUD, retains accessible navigation and works on mobile",()=>{
 assert.ok(css.includes('.game-panel.menu-active:has(.rift-map-clean:not([hidden])) canvas'));
 assert.ok(css.includes('.rift-map-clean .rift-map-regions'));
 assert.ok(css.includes('.rift-map-clean .rift-map-back:focus-visible'));
 assert.ok(css.includes('@media (max-width:700px)'));
 for(const id of ["mapNodeStageOne","mapNodeStageTwo","mapNodeStageThree","mapNodeStageFour"])
   assert.ok(map.includes('id="'+id+'"'));
 assert.ok(main.includes('node.setAttribute("aria-pressed",String(id===stage))'));
});

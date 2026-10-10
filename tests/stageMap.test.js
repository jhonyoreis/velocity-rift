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
 assert.ok(map.includes('id="mapPathToCanyon"'));
 assert.ok(map.includes('id="mapPathToCity"'));
 assert.ok(map.includes('id="mapPathToFinal"'));
});
test("each stage shows only current-campaign time, cores and secrets",()=>{
 for(const name of ["One","Two","Three"]){
   assert.ok(map.includes('id="mapStage'+name+'Best"'));
   assert.ok(map.includes('id="mapStage'+name+'Cores"'));
   assert.ok(map.includes('id="mapStage'+name+'Secrets"'));
   assert.ok(!map.includes('id="mapStage'+name+'Grade"'));
 }
 assert.ok(main.includes('const record=campaign.records["stage"+stage]'));
 assert.ok(main.includes('fullTestMode?3:campaign.extras.cores["stage"+stage].length'));
 assert.ok(main.includes('fullTestMode?3:campaign.extras.secrets["stage"+stage].length'));
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

test("map selector is an SVG atlas with four separately positioned clickable nodes",()=>{
 assert.ok(map.includes('class="rift-map-world rift-map-cartography"'));
 assert.ok(map.includes('class="rift-map-art"'));
 assert.ok(map.includes('viewBox="0 0 540 320"'));
 assert.ok(map.includes('class="rift-map-regions"'));
 const left=map.indexOf('class="rift-map-world rift-map-cartography"');
 const right=map.indexOf('class="rift-map-info"');
 assert.ok(left<right);
 for(const [name,id] of [["forest","One"],["canyon","Two"],["city","Three"],["final","Four"]]){
   assert.match(css,new RegExp('\\.rift-map-clean \\.rift-map-cartography \\.rift-map-node-'+name+'\\{'));
   assert.ok(map.includes('id="mapNodeStage'+id+'" type="button"')||
     map.includes('id="mapNodeStage'+id+'" type="button"')||
     new RegExp('id="mapNodeStage'+id+'"\\s+type="button"').test(map));
 }
 assert.ok(map.includes('aria-label="Mapa interativo das quatro regiões"'));
});

test("paths brighten as campaign advances; final preview uses stage-3 completion and altar keys",()=>{
 assert.ok(main.includes('[["mapPathToCanyon",unlocked],["mapPathToCity",cityUnlocked]]'));
 assert.ok(main.includes('path.classList.toggle("rift-map-path-open",open)'));
 assert.ok(main.includes('path.classList.toggle("rift-map-path-locked",!open)'));
 assert.ok(main.includes('const previewAvailable=campaign.stage3Completed||testUnlocked()'));
 assert.ok(main.includes('previewButton.disabled=!previewAvailable'));
 assert.ok(main.includes('countRiftKeys(campaign,fullTestMode)'));
 assert.ok(map.includes('id="mapStageFourCores"'));
 assert.ok(map.includes('id="stageFourButton"'));
 assert.ok(map.includes('id="stageFourButton"'));
 assert.ok(css.includes('.rift-map-clean .rift-map-cartography .rift-map-path.rift-map-path-open'));
});

test("selecting a region changes active map node and detail card, even if locked",()=>{
 const source=main.slice(main.indexOf("function selectMapStage(stage){"),
   main.indexOf("function refreshMapView(){"));
 assert.ok(source.startsWith("function selectMapStage"));
 const registry=new Map();
 for(const suffix of ["One","Two","Three","Four"]){
   const values=new Set();
   registry.set("#mapNodeStage"+suffix,{
     classList:{toggle(name,enabled){if(enabled)values.add(name);else values.delete(name);},
       contains(name){return values.has(name);}},
     setAttribute(name,value){this[name]=value}
   });
   registry.set("#stage"+suffix+"Card",{hidden:false});
 }
 const doc={querySelector(selector){
   const element=registry.get(selector);
   if(!element)throw new Error("unknown selector "+selector);
   return element;
 }};
 const control=new Function("document",
   "let selectedMapStage=1;"+source+
   "return {selectMapStage,getSelection:()=>selectedMapStage}")(doc);
 for(const stage of [3,4,2,1]){
   control.selectMapStage(stage);
   assert.equal(control.getSelection(),stage);
   for(let i=1;i<=4;i++){
     const suffix=["","One","Two","Three","Four"][i];
     assert.equal(registry.get("#mapNodeStage"+suffix).classList.contains("is-selected"),i===stage);
     assert.equal(registry.get("#mapNodeStage"+suffix)["aria-pressed"],String(i===stage));
     assert.equal(registry.get("#stage"+suffix+"Card").hidden,i!==stage);
   }
 }
});

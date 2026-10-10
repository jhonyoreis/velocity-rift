import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const canyon=readFileSync(new URL("../src/levels/canyon.js",import.meta.url),"utf8");
const corridor=readFileSync(new URL("../src/levels/riftCorridor.js",import.meta.url),"utf8");
test("canyon and city intro cinematics actually show Alicia and portal pursuit",()=>{
 for(const art of ["forestSighting","forestChase","forestEscape","forestDive",
   "canyonClue","canyonDive"])
   assert.ok(main.includes('case "'+art+'"'),art);
 const slice=main.slice(main.indexOf('  intro2:{chapter:'),main.indexOf('  intro3:{chapter:'));
 assert.equal((slice.match(/duration:/g)||[]).length,6);
 assert.ok(slice.includes("Soberano"));
 assert.ok(slice.includes("Alicia"));
});
test("city dash power sits on an altar and acquisition stops the game for animation",()=>{
 assert.ok(main.includes("const dashAltar={active:false,elapsed:0,duration:2.6}"));
 assert.ok(main.includes("function drawDashAltarOverlay()"));
 assert.ok(main.includes("function updateDashAltar(dt)"));
 assert.ok(main.includes("if(dashAltar.active){updateDashAltar(dt);return;}"));
 assert.ok(main.includes('if(!debugUsedThisRun){campaign.aerialDash=true;saveCampaign();grantAchievement("dash");}'));
});
test("all three levels animate Flux crossing the portal before showing results",()=>{
 assert.ok(main.includes("function beginStageExit()"));
 assert.ok(main.includes("function updateStageExit(dt)"));
 assert.ok(main.includes("function drawStageExitFX()"));
 assert.ok(main.includes("if(stageExit.active)updateStageExit(dt);"));
 assert.ok(main.includes("showResults(stageExit.time,stageExit.crystals,stageExit.cores)"));
 assert.ok(main.includes("if(exitReached && !gameCleared){\n    beginStageExit();"));
});
test("dedicated checkpoints are flagged at both boss entrances and respawn logic remains",()=>{
 assert.ok(canyon.includes("boss:x===32570"));
 assert.ok(corridor.includes("boss:true"));
 assert.ok(main.includes('announce("CHECKPOINT DO CHEFE"'));
 assert.ok(main.includes("function restartAfterDeath()"));
});
test("boss music and Flux skin react to damage and permanently unlocked powers",()=>{
 assert.ok(main.includes("GUARDIAN_STEP_SECONDS/guardianPhase(guardian.hp).tempo"));
 assert.ok(main.includes("boostCapacity()>100?"));
 assert.ok(main.includes("actor===player&&dashUnlocked()"));
});

import test from "node:test";
import assert from "node:assert/strict";
import {SECRET_DEFS} from "../src/data/secretRoutes.js";
import {secretUpgradeStats,secretUpgradeReward,BOOST_UPGRADES} from "../src/game/secretUpgrades.js";
import {readFileSync} from "node:fs";
const base={stage1:[],stage2:[],stage3:[]};

test("all nine routes award a bounded permanent boost upgrade",()=>{
 const ids=[1,2,3].flatMap(stage=>SECRET_DEFS[stage].map(r=>r.id));
 assert.equal(ids.length,9);
 for(const id of ids)assert.ok(secretUpgradeReward(id)?.title);
 const all={stage1:SECRET_DEFS[1].map(r=>r.id),
   stage2:SECRET_DEFS[2].map(r=>r.id),stage3:SECRET_DEFS[3].map(r=>r.id)};
 const stats=secretUpgradeStats(all);
 assert.deepEqual(stats,{capacity:150,capacityLevels:5,powerLevels:4,powerMultiplier:1.12,collected:9});
});
test("legacy records, invalid ids and duplicates never grant extra powers",()=>{
 assert.deepEqual(secretUpgradeStats(null),secretUpgradeStats(base));
 const inputs={stage1:["canopy","canopy","unknown",3],
   stage2:["prism","prism"],stage3:[]};
 assert.deepEqual(secretUpgradeStats(inputs),{
   capacity:110,capacityLevels:1,powerLevels:1,powerMultiplier:1.03,collected:2});
 assert.equal(secretUpgradeReward("unknown"),null);
});
test("boost level changes are applied in game, not only on the HUD",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.ok(main.includes("boostUpgrades=secretUpgradeStats(progress.secrets)"));
 assert.ok(main.includes("function boostCapacity(){return boostUpgrades.capacity;}"));
 assert.ok(main.includes("BOOST_MAX_SPEED*boostUpgrades.powerMultiplier"));
 assert.ok(main.includes("BOOST_ACCELERATION*boostUpgrades.powerMultiplier"));
 assert.ok(main.includes("player.boost/boostCapacity()"));
 assert.ok(main.includes("boostUpgrades=secretUpgradeStats(progress.secrets);"));
 assert.ok(main.includes("secretUpgradeReward(trial.id)"));
 assert.ok(main.includes("recordCampaignSecret(activeStage,trial.id)"));
});
test("permanent abilities derive from historical secrets, not resettable campaign extras",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.ok(!main.includes("boostUpgrades=secretUpgradeStats(campaign.extras"));
 const start=main.indexOf("function resetCampaign(){"),end=main.indexOf("function recordCampaignCore(",start);
 assert.ok(start>0&&end>start);
 assert.ok(!main.slice(start,end).includes("progress.secrets"));
 assert.ok(main.includes("if(!debugUsedThisRun){"));
});
test("secret rewards appear in the achievements archive and in Pause",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(main.includes("secretUpgradeReward(def.id)"));
 assert.ok(html.includes('id="pauseBoostUpgrades"'));
 assert.ok(main.includes('document.querySelector("#pauseBoostUpgrades").textContent'));
});

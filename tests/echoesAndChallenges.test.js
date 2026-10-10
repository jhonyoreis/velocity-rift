import test from "node:test";
import assert from "node:assert/strict";
import {ALICIA_ECHOES,sanitizeEchoArchive} from "../src/data/aliciaEchoes.js";
import {BONUS_CHALLENGES,earnedBonusChallenges,sanitizeBonusChallenges} from "../src/game/bonusChallenges.js";
import {readFileSync} from "node:fs";
test("9 optional Alicia holograms cover all 3 playable regions",()=>{
 assert.equal(ALICIA_ECHOES.length,9);
 assert.equal(new Set(ALICIA_ECHOES.map(e=>e.id)).size,9);
 assert.deepEqual([1,2,3].map(s=>ALICIA_ECHOES.filter(e=>e.stage===s).length),[3,3,3]);
 assert.deepEqual(sanitizeEchoArchive(["forest-voice","forest-voice","unknown"]),["forest-voice"]);
});
test("optional challenges grant cosmetic records, no powers",()=>{
 assert.equal(BONUS_CHALLENGES.length,6);
 assert.deepEqual(earnedBonusChallenges(2,{damage:0,cores:3}),["no-hit-2","all-cores-2"]);
 assert.deepEqual(earnedBonusChallenges(2,{damage:3,cores:0}),[]);
 assert.deepEqual(sanitizeBonusChallenges(["no-hit-1","no-hit-1","unknown"]),["no-hit-1"]);
 assert.deepEqual(sanitizeBonusChallenges(null),[]);
});
test("echoes and bonus challenges are saved independently from campaign",()=>{
 const source=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 for(const s of ["ALICIA_ECHOES","function collectStoryEchoes()",
  "function drawStoryEchoes()","ECHO_ARCHIVE_KEY","BONUS_CHALLENGE_KEY",
  "earnedBonusChallenges(stage,run)","function refreshStoryArchive()",
  "function refreshBonusChallengesView()"])
  assert.ok(source.includes(s),s);
 for(const id of ["storyArchiveList","storyArchiveCount","bonusChallengeList","bonusChallengeCount"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(source.includes("if(debugUsedThisRun)return;"));
});

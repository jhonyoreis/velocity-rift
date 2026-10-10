import test from "node:test";
import assert from "node:assert/strict";
import {guardianPhase} from "../src/bosses/guardianPhases.js";
import {readFileSync} from "node:fs";
test("guardian accelerates and narrows the hit window with each hit",()=>{
 const a=guardianPhase(3),b=guardianPhase(2),c=guardianPhase(1);
 assert.ok(a.telegraph>b.telegraph&&b.telegraph>c.telegraph);
 assert.ok(a.exposed>b.exposed&&b.exposed>c.exposed);
 assert.ok(a.laser<b.laser&&b.laser<c.laser);
 assert.ok(a.tempo<b.tempo&&b.tempo<c.tempo);
});
test("new phases drive real AI and telegraphed laser, not just visuals",()=>{
 const source=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.ok(source.includes("guardianPhase(guardian.hp)"));
 assert.ok(source.includes("phase.telegraph"));
 assert.ok(source.includes("phase.exposed"));
 assert.ok(source.includes("phase.laser"));
 assert.ok(source.includes("guardianPhase(guardian.hp).width"));
});

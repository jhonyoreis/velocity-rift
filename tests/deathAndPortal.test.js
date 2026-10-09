import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const city=readFileSync(new URL("../src/levels/city.js",import.meta.url),"utf8");
test("game over screen has restart and menu actions",()=>{
 for(const id of ["deathMenu","deathRestartButton","deathMainButton","deathReason"]){
   assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(main.includes("showScreen(deathMenu)"));
 assert.ok(main.includes("while (accumulator >= FIXED_DT && gameStarted && !paused && !gameCleared)"));
});
test("city portal is drawn outside boss rendering and near the right edge",()=>{
 assert.ok(main.includes("drawArchitectGroundRifts();\n  drawCityExit();"));
 assert.ok(main.includes("function drawCityExit()"));
 assert.ok(city.includes("goal:{x:RIFT_WORLD_WIDTH-345"));
});

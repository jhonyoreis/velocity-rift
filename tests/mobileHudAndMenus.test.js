import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
const hud=main.slice(main.indexOf("function drawMinimalHud("),
  main.indexOf("function roundRect(",main.indexOf("function drawMinimalHud(")));
const pause=html.slice(html.indexOf('<section id="pauseMenu"'),
  html.indexOf('<button id="pauseButton"'));
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);

test("minimal HUD shows crystals, time and boost, not stage or percentage",()=>{
 assert.ok(hud.includes("player.rings"));
 assert.ok(hud.includes("gameTime.toFixed(1)"));
 assert.ok(hud.includes("BOOST"));
 assert.ok(hud.includes("VELOCIDADE"));
 assert.ok(!hud.includes("NÚCLEOS "+'"'+"+player.cores"));
 assert.ok(!hud.includes("Rotas secretas "+'"'+"+"));
 assert.ok(!hud.includes("CIDADE DAS FENDAS"));
 assert.ok(!hud.includes("goal.x"));
 assert.ok(!hud.includes("debugMode"));
});
test("extra pickups use disappearing notifications instead of permanent counters",()=>{
 assert.ok(main.includes('showCollectibleToast("✦ NÚCLEOS  "+player.cores+"/3",2.2)'));
 assert.ok(main.includes('showCollectibleToast("◇ ROTAS  "+'));
 assert.ok(main.includes("collectibleToast.timer=Math.max(0,collectibleToast.timer-dt)"));
 assert.ok(main.includes("collectibleToast.timer=0"));
 assert.ok(hud.includes("if(collectibleToast.timer>0)"));
});
test("HUD is never painted behind pause, results or the regular menus",()=>{
 assert.ok(main.includes("else if(gameStarted&&!paused&&!gameCleared)drawHud()"));
 assert.ok(css.includes("html.mobile-game .game-panel.menu-active canvas{visibility:hidden;}"));
});
test("debug control belongs to pause options, not the gameplay overlay",()=>{
 assert.equal(ids.filter(id=>id==="debugToggle").length,1);
 assert.ok(pause.includes('id="debugToggle"'));
 assert.ok(pause.includes('id="pauseDebugDetails"'));
 assert.ok(pause.includes('id="pauseAudioDetails"'));
 assert.ok(pause.includes('id="pauseControlsDetails"'));
 assert.ok(main.includes('if(debugToggle)debugToggle.hidden=false;'));
 assert.ok(css.includes(".game-panel .vr-pause-clean .debug-toggle"));
});
test("pause contains all stats and a clear, accessible action hierarchy",()=>{
 const required=["pauseStatTime","pauseStatCrystals","pauseStatCores","pauseStatSecrets",
    "pauseStatProgress","resumeButton","restartPauseButton","menuButton",
    "musicToggle","soundToggle","pause-volume-master","pause-volume-music",
    "pause-volume-effects","trackNowPlaying"];
 for(const id of required)assert.ok(pause.includes('id="'+id+'"'),id);
 assert.equal(ids.length,new Set(ids).size);
 assert.ok(pause.indexOf('id="resumeButton"')<pause.indexOf('id="restartPauseButton"'));
 for(const id of required.slice(0,5))
    assert.ok(main.includes('document.querySelector("#'+id+'").textContent='),id);
});
test("mobile fixes apply to cutscenes, results, audio settings and long press",()=>{
 for(const selector of [".vr-film-bottom",".vr-film-dialogue",
    "#resultMenu .result-stats",".v3-settings #settingsBackButton"])
   assert.ok(css.includes(selector),selector);
 assert.ok(css.includes("grid-template-columns:repeat(5,minmax(0,1fr))"));
 assert.ok(css.includes("-webkit-user-select:none"));
 assert.ok(css.includes("-webkit-touch-callout:none"));
 assert.ok(css.includes("html.mobile-game .game-panel.menu-active canvas"));
});

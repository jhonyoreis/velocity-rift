import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
const illustration=readFileSync(new URL("../public/menu-hero.svg",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const version=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8")).version;
const start=html.indexOf('<section id="mainMenu"'),end=html.indexOf('<section id="galleryMenu"',start);
const home=html.slice(start,end);

test("home uses uncluttered title-left, illustration-right composition",()=>{
 assert.ok(home.includes('class="v4-home-copy"'));
 assert.ok(home.includes('class="v4-home-art"'));
 assert.ok(home.indexOf('class="v4-home-copy"')<home.indexOf('class="v4-home-art"'));
 assert.ok(home.includes('src="./menu-hero.svg"'));
 assert.ok(home.includes('Corra. Salte. Rasgue a fenda.'));
 assert.ok(home.includes('class="v4-home-version">v'+version));
 assert.ok(!home.includes("SALVAMENTO AUTOMÁTICO"));
 assert.ok(!home.includes("ALICIA ALÉM DAS FENDAS"));
});

test("new game is first and continue is disabled until campaign save exists",()=>{
 assert.ok(home.indexOf('id="newGameButton"')<home.indexOf('id="startButton"'));
 assert.match(home,/<button id="startButton"[^>]*disabled/);
 assert.ok(main.includes('const canContinue=campaign.started===true'));
 assert.ok(main.includes('continueButton.disabled=!canContinue'));
 assert.ok(main.includes('continueButton.setAttribute("aria-disabled",String(!canContinue))'));
 assert.ok(main.includes('if(!campaign.started)return;'));
 assert.match(css,/\.v4-home-continue:disabled\s*\{/);
});

test("secondary navigation and campaign save anchors are preserved",()=>{
 for(const id of ["selectStagesButton","settingsButton","achievementsButton",
   "galleryButton","campaignProgressTrack","campaignProgressFill","menuProgress",
   "campaignCompletionBreakdown","continueDescription"])
   assert.ok(home.includes('id="'+id+'"'),"missing "+id);
 assert.match(home,/class="v4-home-data" hidden/);
});

test("home illustration is shipped locally, with no external dependencies",()=>{
 assert.match(illustration,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 assert.ok(illustration.includes("Flux atravessa uma cidade"));
 assert.ok(illustration.includes('id="portal"'));
 assert.ok(!/https?:\/\/[^\s"]+\.(png|jpe?g|webp)/i.test(illustration));
});

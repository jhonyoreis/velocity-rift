import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");

function ancestorNamesAt(marker){
 const target=html.indexOf(marker);
 assert.ok(target>=0,"missing HTML marker "+marker);
 const tags=html.slice(0,target)
   .replace(/<!--[\s\S]*?-->/g,"")
   .match(/<\/?(?:main|section|div)\b[^>]*>/g)||[];
 const stack=[];
 for(const token of tags){
   const name=token.match(/^<\/?(main|section|div)/)[1];
   if(/^<\//.test(token)){
     assert.equal(stack.at(-1)?.tag,name,"malformed markup before "+marker);
     stack.pop();
   }else{
     stack.push({tag:name,attrs:token});
   }
 }
 return stack.map(x=>x.attrs);
}

test("in-game touch controls and Pause are outside the hidden menu overlay",()=>{
 for(const marker of ['<button id="pauseButton"','<div class="touch-controls"']){
   const ancestors=ancestorNamesAt(marker);
   assert.ok(ancestors.some(v=>v.includes('class="game-panel"')),marker);
   assert.ok(!ancestors.some(v=>v.includes('id="overlay"')),marker);
   assert.ok(!ancestors.some(v=>v.includes('class="menu-screen')),marker);
 }
 const sceneParents=ancestorNamesAt('<section id="cinematicMenu"');
 assert.ok(sceneParents.some(v=>v.includes('id="overlay"')));
});

test("runtime also repairs an old markup where controls are inside the overlay",()=>{
 assert.ok(main.includes('function placeGameplayControls(){'));
 assert.ok(main.includes('if(element&&overlay.contains(element))panel.appendChild(element)'));
 assert.ok(main.includes('placeGameplayControls();'));
 assert.ok(css.includes(".game-panel.gameplay-active > .touch-controls"));
 assert.ok(css.includes(".game-panel.gameplay-active > .v31-in-game-pause"));
 assert.ok(main.includes("const playing=gameStarted&&!paused&&!gameCleared&&!cinematic.active"));
});

test("story dialog does not show an extra title or speaker and remains compact",()=>{
 assert.ok(css.includes(".game-panel.cinematic-active .vr-film-dialogue #cinematicSpeaker"));
 assert.ok(css.includes(".game-panel.cinematic-active .vr-film-dialogue #cinematicTitle"));
 assert.ok(css.includes("max-height:min(21vh,118px)"));
 assert.ok(css.includes("width:min(48vw,560px)"));
 assert.ok(html.includes('id="cinematicText"'));
});

test("visible Android build label distinguishes the newly installed APK",()=>{
 assert.ok(html.includes('class="vr-build-id">APK R9'));
 assert.ok(css.includes("html.mobile-game .v4-home .vr-build-id"));
});

test("increased music and effects gain reaches the shared dynamics-limited output",()=>{
 assert.ok(main.includes('4.0*effectiveAudioGain("music")'));
 assert.ok(main.includes('volume*3.0*effectiveAudioGain("effects")'));
 assert.ok(main.includes("createDynamicsCompressor"));
 assert.ok(main.includes("musicBus.connect(gameAudioOutput()||audioContext.destination)"));
 assert.ok(main.includes("envelope.connect(gameAudioOutput()||audioContext.destination)"));
});

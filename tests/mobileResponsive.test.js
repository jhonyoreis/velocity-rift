import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {shouldUseMobilePresentation,isNativeAndroid} from "../src/game/mobilePresentation.js";

test("APK Android always uses mobile UI even with desktop-like CSS width",()=>{
 const android={isNativePlatform:()=>true,getPlatform:()=>"android"};
 assert.equal(isNativeAndroid(android),true);
 assert.equal(shouldUseMobilePresentation({nativeAndroid:true}),true);
 assert.equal(isNativeAndroid({isNativePlatform:()=>false,getPlatform:()=>"android"}),false);
 assert.equal(isNativeAndroid({isNativePlatform:()=>true,getPlatform:()=>"ios"}),false);
 assert.equal(isNativeAndroid(undefined),false);
});
test("touch landscape browser gets mobile layout without affecting desktop or portrait",()=>{
 assert.equal(shouldUseMobilePresentation({pointerCoarse:true,landscape:true}),true);
 assert.equal(shouldUseMobilePresentation({pointerCoarse:false,landscape:true}),false);
 assert.equal(shouldUseMobilePresentation({pointerCoarse:true,landscape:false}),false);
});

test("all Android menus and touch targets are covered by mobile styles",()=>{
 const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const selectors=[".v4-home",".rift-map-clean",".vr-collection",".vr-gallery",
   ".v3-settings",".v3-confirm",".v31-pause",".vr-death","#resultMenu",
   ".vr-cinematic-ui",".touch-controls"];
 for(const selector of selectors)
   assert.ok(css.includes("html.mobile-game "+(selector.startsWith(".v4")||selector.startsWith(".rift")||selector.startsWith(".v31")||selector.startsWith(".vr-")?selector:".game-panel .overlay "+selector))||
      css.includes("html.mobile-game .game-panel .overlay "+selector)||
      css.includes("html.mobile-game .game-panel "+selector),selector);
 assert.ok(css.includes("object-fit:contain"));
 assert.ok(css.includes("env(safe-area-inset"));
 assert.ok(css.includes("max-height:370px"));
 assert.ok(css.includes("grid-template-columns:repeat(2,minmax(47px,70px))"));
 assert.ok(html.includes('viewport-fit=cover'));
 assert.ok(html.includes('vr-film-hint vr-mobile-help'));
});
test("cinematic hints and HUD switch to mobile presentation; computer remains unchanged",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.ok(main.includes("window.Capacitor"));
 assert.ok(main.includes('classList.toggle("mobile-game"'));
 assert.ok(main.includes('classList.toggle("native-android"'));
 assert.ok(main.includes("function drawMobileHud()"));
 assert.ok(main.includes("drawMinimalHud(document.documentElement.classList.contains(\"mobile-game\"))"));
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(html.includes('vr-film-hint vr-desktop-help'));
 assert.ok(html.includes("Toque em Avançar"));
});

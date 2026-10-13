import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
const server=spawn("npm",["run","dev","--","--host","127.0.0.1","--port","4176","--strictPort"],{stdio:"ignore"});
const base="http://127.0.0.1:4176/?rift-qa",folder="test-artifacts/visual";
let browser;
try{
 await mkdir(folder,{recursive:true});
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,150));}
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[],prefix=mobile?"android-readability":"desktop-readability";
  page.on("pageerror",e=>errors.push(e.message));
  // Explicit physics inputs control the test; suppress automatic drawing between captures.
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;const fill=CanvasRenderingContext2D.prototype.fillText;window.__hudLabels=[];CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__hudLabels.push(text);return fill.call(this,text,...args);};});
  await page.goto(base,{waitUntil:"networkidle"});
  const jump=page.locator('[data-key=" "]');
  await page.evaluate(()=>window.__riftQA.setupScenario({stage:3,x:180,crystals:100}));
  assert.equal(await jump.getAttribute("data-dash-state"),"ready");
  await page.screenshot({path:`${folder}/${prefix}-dash-ready.png`});
  await page.evaluate(()=>{window.__riftQA.stepGame([" "],20);window.__riftQA.stepGame([],1);window.__riftQA.stepGame([" "],1);});
  assert.equal(await jump.getAttribute("data-dash-state"),"active");
  await page.evaluate(()=>window.__riftQA.stepGame([],33));
  assert.equal(await jump.getAttribute("data-dash-state"),"spent");
  await page.screenshot({path:`${folder}/${prefix}-dash-spent.png`});
  await page.evaluate(()=>window.__riftQA.stepGame([],180));
  assert.equal(await jump.getAttribute("data-dash-state"),"ready","landing restores the charge");
  await page.evaluate(()=>window.__riftQA.setupScenario({stage:3,x:21810,crystals:500}));
  const far=await page.evaluate(()=>{const api=window.__riftQA;for(let i=0;i<1500;i++){const s=api.stepGame(["arrowright"]);if(s.x>23400||s.defeat)return s;}return api.gameInfo();});
  assert.equal(far.defeat,null);assert.ok(far.x>23400);assert.ok(far.cameraX>22450);assert.ok(far.x-far.cameraX<942);
  await page.screenshot({path:`${folder}/${prefix}-architect-right.png`});
  const home=await page.evaluate(()=>{const api=window.__riftQA;for(let i=0;i<1100;i++){const s=api.stepGame(["arrowleft"]);if(s.x<22100||s.defeat)return s;}return api.gameInfo();});
  assert.equal(home.defeat,null);assert.ok(home.x<22100);assert.ok(home.x-home.cameraX>=18);
  await page.screenshot({path:`${folder}/${prefix}-architect-left.png`});
  for(const [side,positions] of [["right",{bossX:45500,energyX:45900}],["left",{bossX:43300,energyX:43800}],["visible",{bossX:44550,energyX:44800}]]){
   const labels=await page.evaluate(p=>{window.__hudLabels=[];window.__riftQA.combatReadabilityScenario(p);return window.__hudLabels;},positions);
   for(const label of ["SOBERANO","RUBRO"])assert.equal(labels.includes(label),side!=="visible",`${label}: ${side}`);
   await page.screenshot({path:`${folder}/${prefix}-sovereign-${side}.png`});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log("Combat readability visual QA OK: Architect full arena, Dash charged/active/spent/landing, both offscreen markers and visible-target suppression on desktop + Android landscape");
}finally{await browser?.close();server.kill("SIGTERM");}

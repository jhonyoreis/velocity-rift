// Inspect the real runtime with input-only traversal at deterministic substeps.
// QA helpers are development-only and are eliminated from the production bundle.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
const base="http://127.0.0.1:4174",folder="test-artifacts/visual";
const server=spawn("npm",["run","dev","--","--host","127.0.0.1","--port","4174","--strictPort"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;
try{
 await mkdir(folder,{recursive:true});
 for(let i=0;i<80;i++){
  try{if((await fetch(base)).ok)break;}catch{}
  if(server.exitCode!==null)throw Error("Vite dev failed");await sleep(150);
 }
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,
   userAgent:"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"}:
   {viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[],prefix=mobile?"android-rift":"desktop-rift";
  page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.setItem("velocity-rift-campaign-v3",JSON.stringify({started:true,stage1Completed:true,
    stage2Completed:true,stage3Completed:true,lastStage:3,aerialDash:true,
    extras:{cores:{stage1:[0,1,2],stage2:[0,1,2],stage3:[0,1,2]},secrets:{stage1:[],stage2:[],stage3:[]}},scenesSeen:[]}));
  });
  await page.goto(base+"/?rift-qa",{waitUntil:"networkidle"});
  const before=await page.evaluate(()=>localStorage.getItem("velocity-rift-campaign-v3"));
  await page.locator("#selectStagesButton").click();await page.locator("#mapNodeStageFour").click();
  await page.locator("#stageFourButton").click();
  await page.evaluate(async()=>{
   window.__riftQA.freeze();
   const {createRiftRouteDriver}=await import("/scripts/rift-route-driver.mjs");
   window.riftInputs=createRiftRouteDriver();
  });
  for(const [name,target] of [["entrance",180],["ceiling",7200],["echo",12000],["momentum",17300],["islands",22000],["cathedral",27000],["threshold",35000],["finish",36010]]){
   const state=await page.evaluate(target=>{
    const api=window.__riftQA;
    for(let i=0;i<18000;i++){
     const s=api.info();if(s.x>=target||s.dead||s.finished)break;
     api.step([...window.riftInputs(s)]);
    }return api.info();
   },target);
   assert.equal(state.dead,false,prefix+" died before "+name);
   if(name==="ceiling"||name==="cathedral")assert.equal(state.gravity,-1);
   if(name==="echo")assert.equal(state.dimension,1);
   await page.screenshot({path:folder+"/"+prefix+"-"+name+".png"});
  }
  await page.locator("#riftTraversalMenu").waitFor({state:"visible"});
  assert.match(await page.locator("#riftTraversalTitle").innerText(),/LIMIAR ALCANÇADO/);
  assert.equal(await page.evaluate(()=>localStorage.getItem("velocity-rift-campaign-v3")),before,"traversal doesn't claim campaign victory");
  await page.locator("#riftTraversalRestart").click();
  await page.evaluate(()=>window.__riftQA.release());
  await page.locator("#pauseButton").click();await page.locator("#pauseMenu").waitFor({state:"visible"});
  assert.match(await page.locator("#pauseStageLabel").innerText(),/Fenda Original/);
  await page.screenshot({path:folder+"/"+prefix+"-pause.png"});
  await page.locator("#restartPauseButton").click();
  await page.evaluate(async()=>{
   window.__riftQA.freeze();
   const {createRiftRouteDriver}=await import("/scripts/rift-route-driver.mjs");
   const driver=createRiftRouteDriver(),api=window.__riftQA;
   for(let i=0;i<4000&&api.info().checkpointIndex<2;i++)api.step([...driver(api.info())]);
   for(let i=0;i<1500&&!api.info().dead;i++)api.step(["arrowleft"]);
  });
  await page.locator("#deathMenu").waitFor({state:"visible"});
  await page.screenshot({path:folder+"/"+prefix+"-death.png"});
  await page.locator("#deathRestartButton").click();
  const checkpoint=await page.evaluate(()=>window.__riftQA.info());
  assert.equal(checkpoint.dead,false);assert.equal(checkpoint.gravity,-1);
  assert.equal(checkpoint.checkpointIndex,2);assert.equal(checkpoint.x,checkpoint.checkpoint.x);
  assert.deepEqual(errors,[],prefix+" browser exceptions");await context.close();
 }
 console.log("Rift visual QA OK: complete traversal, death/respawn and menus on desktop + Android landscape");
}catch(e){console.error(e);process.exitCode=1;}
finally{if(browser)await browser.close();server.kill("SIGTERM");}

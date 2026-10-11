// Full player-input campaign finale, save migration and UI on desktop + mobile.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
const base="http://127.0.0.1:4174",folder="test-artifacts/visual";
const server=spawn("npm",["run","dev","--","--host","127.0.0.1","--port","4174","--strictPort"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;
async function advanceScene(page,prefix){
 for(let i=0;i<9&&await page.locator("#cinematicMenu").isVisible();i++){
  const title=await page.locator("#cinematicTitle").innerText();
  const canvasDepth=await page.evaluate(()=>{
   for(let i=0;i<120;i++)window.__riftQA.step([],true);
   return window.__canvasSaveDepth;
  });
  assert.equal(canvasDepth,0,"cinematic Canvas save/restore must remain balanced: "+title);
  if(/promessa desperta|Alicia está livre|Uma flor para Alicia|Uma Flor, Enfim/.test(title))
   await page.screenshot({path:folder+"/"+prefix+"-scene-"+title.normalize("NFD").replace(/[^a-zA-Z]/g,"")+".png"});
  await page.locator("#cinematicNextButton").click();
 }
}
try{
 await mkdir(folder,{recursive:true});
 for(let i=0;i<80;i++){try{if((await fetch(base)).ok)break;}catch{}if(server.exitCode!==null)throw Error("Vite dev failed");await sleep(150);}
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,
   userAgent:"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"}:{viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[],prefix=mobile?"android-finale":"desktop-finale";
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(m.text().includes("música desativada após erro"))errors.push(m.text());});
  await page.addInitScript(()=>{
   const proto=CanvasRenderingContext2D.prototype,save=proto.save,restore=proto.restore;
   window.__canvasSaveDepth=0;
   proto.save=function(){if(this.canvas.id==="game")window.__canvasSaveDepth++;return save.call(this);};
   proto.restore=function(){if(this.canvas.id==="game")window.__canvasSaveDepth--;return restore.call(this);};
   // Existing 3.8 save: no stage4, preserve its prior collectibles.
   localStorage.setItem("velocity-rift-campaign-v3",JSON.stringify({started:true,stage1Completed:true,stage2Completed:true,stage3Completed:true,lastStage:3,aerialDash:true,
    extras:{cores:{stage1:[0,1,2],stage2:[0,1,2],stage3:[0,1,2]},secrets:{stage1:["canopy","lumen","horizon"],stage2:["echo","prism","zenith"],stage3:["antenna","underpass","skyline"]}},scenesSeen:[]}));
  });
  await page.goto(base+"/?rift-qa",{waitUntil:"networkidle"});
  assert.equal(await page.locator("#menuProgress").innerText(),"75%");
  assert.match(await page.locator("#continueDescription").innerText(),/Fenda Original/);
  await page.evaluate(()=>window.__riftQA.freeze());
  await page.locator("#selectStagesButton").click();await page.locator("#mapNodeStageFour").click();await page.locator("#stageFourButton").click();
  await advanceScene(page,prefix);
  await page.evaluate(async()=>{const {createRiftRouteDriver}=await import("/scripts/rift-route-driver.mjs");window.riftInputs=createRiftRouteDriver({collectExtras:true});window.riftPoses=new Set();});
  const snapshots=new Set();let ended=false,checkedRoutes=false;
  for(let batch=0;batch<120;batch++){
   const state=await page.evaluate(()=>{
    const api=window.__riftQA;
    for(let i=0;i<240;i++){
     const s=api.info();if(s.dead||s.finished||s.story)break;
     if(s.boss.vulnerable&&Math.hypot(s.x-s.boss.x,s.y-s.boss.y)<180&&!window.riftPoses.has(s.boss.mode)){window.riftPoses.add(s.boss.mode);return {...s,pose:s.boss.mode+"-exposed"};}
     api.step([...window.riftInputs(s)],false);
    }return api.info();
   });
   assert.equal(state.dead,false,prefix+" player-input route died at "+state.x);
   if(!checkedRoutes&&state.secrets.length&&!state.story&&!state.finished){
    await page.locator("#pauseButton").click();
    await page.locator("#pauseMenu").waitFor({state:"visible"});
    assert.equal(await page.locator("#pauseStatSecrets").textContent(),state.secrets.length+"/3");
    await page.locator("#resumeButton").click();checkedRoutes=true;
   }
   const tag=state.pose||(state.boss.mode!=="dormant"?state.boss.mode:state.sector);
   if(!snapshots.has(tag)){snapshots.add(tag);await page.screenshot({path:folder+"/"+prefix+"-"+tag.normalize("NFD").replace(/[^a-zA-Z]/g,"")+".png"});}
   if(state.story){await advanceScene(page,prefix);continue;}
   if(state.finished){await advanceScene(page,prefix);ended=true;break;}
  }
  assert.equal(ended,true,prefix+" never finished");
  await page.locator("#resultMenu").waitFor({state:"visible"});
  assert.match(await page.locator("#resultHeading").innerText(),/Fenda Original/);
  assert.equal(await page.locator("#resultSecrets").innerText(),"3/3");
  const saved=await page.evaluate(()=>({campaign:JSON.parse(localStorage.getItem("velocity-rift-campaign-v3")),ghost:JSON.parse(localStorage.getItem("velocity-rift-ghost-records-v1"))}));
  assert.equal(saved.campaign.stage4Completed,true);assert.equal(saved.campaign.extras.cores.stage4.length,3);assert.equal(saved.campaign.extras.secrets.stage4.length,3);
  assert.ok(saved.campaign.scenesSeen.includes("ending"));assert.ok(saved.ghost.stage4.frames.length>100);
  await page.screenshot({path:folder+"/"+prefix+"-results.png"});
  await page.locator("#resultsMainButton").click();assert.equal(await page.locator("#menuProgress").innerText(),"100%");
  await page.locator("#galleryButton").click();assert.equal(await page.locator("#galleryEnding").isEnabled(),true);
  await page.screenshot({path:folder+"/"+prefix+"-gallery.png"});await page.locator("#galleryBackButton").click();
  await page.locator("#startButton").click();await page.evaluate(()=>window.__riftQA.release());await page.locator("#pauseButton").click();
  await page.locator("#pauseMenu").waitFor({state:"visible"});assert.match(await page.locator("#pauseStageLabel").innerText(),/Fenda Original/);
  await page.screenshot({path:folder+"/"+prefix+"-pause.png"});
  // An actual fall must show the death UI and restore inverted gravity.
  await page.locator("#restartPauseButton").click();
  await page.evaluate(async()=>{
   const {createRiftRouteDriver}=await import("/scripts/rift-route-driver.mjs");window.__riftQA.freeze();
   const api=window.__riftQA,d=createRiftRouteDriver();
   for(let i=0;i<5000&&api.info().checkpointIndex<2;i++)api.step([...d(api.info())],false);
   for(let i=0;i<2000&&!api.info().dead;i++)api.step(["arrowleft"],false);
  });
  await page.locator("#deathMenu").waitFor({state:"visible"});await page.screenshot({path:folder+"/"+prefix+"-death.png"});
  await page.locator("#deathRestartButton").click();
  const cp=await page.evaluate(()=>window.__riftQA.info());assert.equal(cp.dead,false);assert.equal(cp.gravity,-1);assert.equal(cp.x,cp.checkpoint.x);
  if(!mobile){
   await page.locator("#pauseButton").click();await page.locator("#pauseDebugDetails > summary").click();
   const archiveBefore=await page.evaluate(()=>["velocity-rift-campaign-v3","velocity-rift-progress-v1","velocity-rift-ghost-records-v1","velocity-rift-bonus-challenges-v1"].map(k=>localStorage.getItem(k)));
   await page.locator("#fullTestToggle").click();
   await page.locator("#resumeButton").click();await page.locator("#pauseButton").click();
   assert.match(await page.locator("#pauseBoostUpgrades").innerText(),/FORÇA \+15%/);
   await page.locator("#restartPauseButton").click();
   await page.evaluate(async()=>{window.__riftQA.freeze();const {createRiftRouteDriver}=await import("/scripts/rift-route-driver.mjs");window.riftInputs=createRiftRouteDriver({collectExtras:true});});
   let testFinished=false;
   for(let batch=0;batch<120;batch++){
    const s=await page.evaluate(()=>{const api=window.__riftQA;for(let i=0;i<240;i++){const s=api.info();if(s.dead||s.finished||s.story)break;api.step([...window.riftInputs(s)],false);}return api.info();});
    assert.equal(s.dead,false,"TESTE 100% route died at "+s.x);
    if(s.story){await advanceScene(page,prefix+"-test100");continue;}
    if(s.finished){await advanceScene(page,prefix+"-test100");testFinished=true;break;}
   }
   assert.equal(testFinished,true);await page.locator("#resultMenu").waitFor({state:"visible"});
   const archiveAfter=await page.evaluate(()=>["velocity-rift-campaign-v3","velocity-rift-progress-v1","velocity-rift-ghost-records-v1","velocity-rift-bonus-challenges-v1"].map(k=>localStorage.getItem(k)));
   assert.deepEqual(archiveAfter,archiveBefore,"test modes cannot save any campaign, collections, records or ghosts");
  }
  if(!mobile){await page.locator("#resultsMainButton").click();await page.locator("#startButton").click();}
  for(const [key,id] of [["n","musicToggle"],["m","soundToggle"]]){
   const before=await page.locator("#"+id).innerText();
   await page.keyboard.press(key);assert.notEqual(await page.locator("#"+id).innerText(),before,key+" shortcut in stage four");
   await page.keyboard.press(key);assert.equal(await page.locator("#"+id).innerText(),before);
  }
  await page.keyboard.press("F3");assert.equal(await page.locator("#debugToggle").getAttribute("aria-pressed"),"true");
  await page.keyboard.press("F3");assert.equal(await page.locator("#debugToggle").getAttribute("aria-pressed"),"false");
  assert.equal(checkedRoutes,true,"pause routes regression was exercised");
  assert.equal(await page.evaluate(()=>window.__canvasSaveDepth),0,"Canvas stack remains balanced after finale");
  assert.deepEqual(errors,[],prefix+" browser exceptions");await context.close();
 }
 console.log("Finale visual QA OK: input-only all cores/routes, 3 boss encounters, ending, save migration, 100%, ghost, gallery and pause on desktop + Android landscape");
}catch(e){console.error(e);process.exitCode=1;}
finally{if(browser)await browser.close();server.kill("SIGTERM");}

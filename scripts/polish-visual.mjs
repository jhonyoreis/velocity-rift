import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
const server=spawn("npm",["run","dev","--","--host","127.0.0.1","--port","4175","--strictPort"],{stdio:"ignore"});
const base="http://127.0.0.1:4175/?rift-qa",folder="test-artifacts/visual";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;
try{
 await mkdir(folder,{recursive:true});
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await sleep(150);}
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,userAgent:"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"}:{viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base,{waitUntil:"networkidle"});const prefix=mobile?"android-polish":"desktop-polish";
  for(const stage of [1,2,3]){
   await page.evaluate(stage=>window.__riftQA.setupScenario({stage,crystals:20}),stage);
   assert.equal(await page.locator("#rubroButton").isVisible(),false);
   assert.equal(await page.evaluate(()=>window.__riftQA.transformRubro()),false,"locked before campaign completion");
   await page.evaluate(stage=>window.__riftQA.setupScenario({stage,crystals:19,completed:true}),stage);
   assert.equal(await page.locator("#rubroButton").isVisible(),false);
   await page.evaluate(stage=>window.__riftQA.setupScenario({stage,crystals:20,completed:true}),stage);
   assert.equal(await page.locator("#rubroButton").isVisible(),true);
   assert.equal(await page.locator("#rubroButton").textContent(),"");
   if(mobile){const r=await page.locator("#rubroButton").boundingBox();for(const key of ["arrowleft","arrowright"," ","shift","arrowdown"]){const b=await page.locator(`[data-key="${key}"]`).boundingBox();assert.ok(r.y+r.height<=b.y||r.x+r.width<=b.x||r.x>=b.x+b.width,"transformation button overlaps movement control");}}
   if(mobile)await page.locator("#rubroButton").tap();else await page.keyboard.press("f");
   let s=await page.evaluate(()=>window.__riftQA.stepGame([],20));assert.ok(s.rubro.transformTime>0);assert.equal(s.crystals,20);assert.equal(s.time,0);
   await page.screenshot({path:`${folder}/${prefix}-stage${stage}-transform.png`});
   s=await page.evaluate(()=>window.__riftQA.stepGame([],100));assert.equal(s.rubro.active,true);assert.equal(s.crystals,20);
   s=await page.evaluate(()=>window.__riftQA.stepGame(["arrowright"],72));assert.ok(s.vx>=670,`Rubro walk speed in stage ${stage}: ${s.vx}`);
   s=await page.evaluate(()=>window.__riftQA.stepGame(["arrowright","shift"],20));assert.ok(s.vx>590);assert.equal(s.boosting,true);
   const held=s.crystals;const damage=s.damage;
   s=await page.evaluate(()=>{window.__riftQA.addShot();return window.__riftQA.stepGame(["arrowright","shift"]);});
   assert.equal(s.damage,damage);assert.ok(s.crystals>=held,"Rubro boost must destroy unblockable shots");
   s=await page.evaluate(()=>window.__riftQA.stepGame(["arrowright"," "],1));assert.ok(s.vy<-770,"Rubro jump is stronger");
   await page.evaluate(()=>window.__riftQA.stepGame(["arrowright"],1));
   s=await page.evaluate(()=>window.__riftQA.stepGame(["arrowright"," "],1));assert.ok(s.dash.active);assert.equal(s.vx,1140*1.3);
   const dashDamage=s.damage;s=await page.evaluate(()=>{window.__riftQA.addShot();return window.__riftQA.stepGame(["arrowright"]);});assert.equal(s.damage,dashDamage);
   await page.screenshot({path:`${folder}/${prefix}-stage${stage}-rubro.png`});
   s=await page.evaluate(()=>{for(let i=0;i<100&&window.__riftQA.gameInfo().crystals>0;i++)window.__riftQA.takeHit();return window.__riftQA.gameInfo();});
   assert.equal(s.crystals,0);assert.equal(s.rubro.active,false,"Rubro ends at zero crystals");
   assert.equal(await page.locator("#rubroButton").isVisible(),false);
   await page.evaluate(stage=>window.__riftQA.setupScenario({stage,x:180,crystals:100,vx:600,completed:true}),stage);
   s=await page.evaluate(()=>{window.__riftQA.addShot();return window.__riftQA.stepGame(["arrowright","shift"]);});assert.ok(s.crystals<100,"base Flux still takes shot damage during Boost");
  }
  for(const stage of [1,2,3]){
   await page.evaluate(stage=>{window.__riftQA.setupScenario({stage,crystals:0});window.__riftQA.takeHit();},stage);
   assert.equal(await page.locator("#deathMenu").isVisible(),false,"defeat must animate before the death menu");
   let death=await page.evaluate(()=>window.__riftQA.stepGame([],45));assert.ok(death.defeat.elapsed>0);assert.equal(death.time,0);
   await page.screenshot({path:`${folder}/${prefix}-stage${stage}-defeat.png`});
   await page.evaluate(()=>window.__riftQA.stepGame([],90));await page.locator("#deathMenu").waitFor({state:"visible"});
  }
  // Standing is blocked, Slide crosses the complete roof and ramp using normal physics.
  await page.evaluate(()=>window.__riftQA.setupScenario({stage:2,x:3420,crystals:100,completed:true,vx:300}));
  let s=await page.evaluate(()=>window.__riftQA.stepGame(["arrowright"],120));assert.ok(s.x<3500,"roof blocks standing Flux");
  await page.evaluate(()=>window.__riftQA.setupScenario({stage:2,x:3420,crystals:100,completed:true,vx:400}));
  await page.evaluate(()=>window.__riftQA.stepGame(["arrowright","arrowdown"],65));
  await page.screenshot({path:`${folder}/${prefix}-canyon-slide-ramp.png`});
  s=await page.evaluate(()=>window.__riftQA.stepGame(["arrowright","arrowdown"],60));assert.ok(s.x>3740,`Slide cannot cross canyon ramp: ${s.x}`);assert.equal(s.damage,0);
  // Collect the Architect arena crystal through normal movement, survive one hit,
  // then die and use the actual checkpoint button to collect it again.
  await page.evaluate(()=>window.__riftQA.setupScenario({stage:3,x:21810,crystals:0,completed:true}));
  await page.screenshot({path:`${folder}/${prefix}-architect-crystal-available.png`});
  s=await page.evaluate(()=>{const api=window.__riftQA;for(let i=0;i<720;i++){const s=api.stepGame(["arrowright"]);if(s.crystals===1)return s;}return api.gameInfo();});
  assert.equal(s.crystals,1,JSON.stringify(s));assert.ok(s.x>22000);assert.equal(s.defeat,null);
  await page.screenshot({path:`${folder}/${prefix}-architect-crystal.png`});
  s=await page.evaluate(()=>window.__riftQA.stepGame([],15));assert.equal(s.crystals,1,"one pickup only");
  s=await page.evaluate(()=>window.__riftQA.takeHit());assert.equal(s.crystals,0);assert.equal(s.defeat,null,"one crystal protects from the first hit");
  await page.evaluate(()=>{window.__riftQA.takeHit();window.__riftQA.stepGame([],150);});
  await page.locator("#deathMenu").waitFor({state:"visible"});await page.locator("#deathRestartButton").click();
  s=await page.evaluate(()=>{const api=window.__riftQA;for(let i=0;i<720;i++){const s=api.stepGame(["arrowright"]);if(s.crystals===1)return s;}return api.gameInfo();});
  assert.equal(s.crystals,1,"checkpoint restores the arena crystal");assert.equal(s.defeat,null);
  const altar=await page.evaluate(()=>window.__riftQA.altarScenario([[0,2],[1],[]]));
  assert.equal(altar.cores,3);assert.deepEqual(altar.coreSlots,[true,false,true,false,true,false,false,false,false]);assert.equal(altar.gateOpened,false);
  await page.screenshot({path:`${folder}/${prefix}-altar-missing.png`});
  await page.evaluate(()=>window.__riftQA.altarScenario([[0,1,2],[0,1,2],[0,1,2]]));await page.screenshot({path:`${folder}/${prefix}-altar-complete.png`});
  const fourth=await page.evaluate(async()=>{
   const {createRiftRouteDriver}=await import("/scripts/rift-route-driver.mjs");const d=createRiftRouteDriver(),api=window.__riftQA;
   for(let i=0;i<120*100;i++){const s=api.info();if(s.crystals>=20||s.dead||s.story)break;api.step([...d(s)],false);}return api.info();
  });
  assert.ok(fourth.crystals>=20,"collect twenty real crystals in stage 4");assert.equal(fourth.dead,false);
  assert.equal(await page.locator("#rubroButton").isVisible(),true);await page.locator("#rubroButton").click();
  await page.evaluate(()=>{for(let i=0;i<25;i++)window.__riftQA.step([],true);});
  assert.ok(await page.evaluate(()=>window.__riftQA.info().transformTime>0));
  await page.screenshot({path:`${folder}/${prefix}-stage4-transform.png`});
  await page.evaluate(()=>{for(let i=0;i<100;i++)window.__riftQA.step([],false);});
  const rubroFourth=await page.evaluate(()=>window.__riftQA.info());assert.equal(rubroFourth.rubro,true);
  await page.evaluate(()=>window.__riftQA.step([],true));await page.screenshot({path:`${folder}/${prefix}-stage4-rubro.png`});
  const exileHome=await page.evaluate(()=>{const api=window.__riftQA,s=api.info();s.shots.push({x:s.x,y:s.y,vx:0,vy:0,life:1,orb:true});api.step([],true);return {x:api.info().x,crystals:api.info().crystals};});
  assert.equal(await page.evaluate(()=>window.__riftQA.info().pocket?.kind),"exile");
  await page.screenshot({path:`${folder}/${prefix}-orb-reality.png`});
  const returned=await page.evaluate(async()=>{const {createRiftRouteDriver}=await import("/scripts/rift-route-driver.mjs"),d=createRiftRouteDriver(),api=window.__riftQA;for(let i=0;i<610&&api.info().pocket;i++)api.step([...d(api.info())],false);api.step([],true);return api.info();});
  assert.equal(returned.pocket,null);assert.equal(returned.dead,false);assert.ok(Math.abs(returned.x-exileHome.x)<10);assert.equal(returned.crystals,exileHome.crystals);
  await page.evaluate(()=>{window.__riftQA.setupScenario({stage:1,crystals:20,completed:true});window.__riftQA.saveQAProgress();});
  await page.reload({waitUntil:"networkidle"});assert.equal(await page.evaluate(()=>window.__riftQA.rubroInfo().unlocked),true,"Rubro unlock persists after reloading");
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log("Polish visual QA OK: Rubro unlock/20 crystals/animation/speed/jump/Boost/Dash/projectiles/zero/reload, slide tunnel and altar on desktop + Android landscape");
}finally{await browser?.close();server.kill("SIGTERM");}

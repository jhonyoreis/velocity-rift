// Browser-level rendering smoke checks; keep screenshots for human review.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";

const base="http://127.0.0.1:4173";
const folder="test-artifacts/visual";
const errors=[];
let browser;
const server=spawn("npm",["run","preview","--","--host","127.0.0.1","--port","4173","--strictPort"],{stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitReady(){
 for(let attempt=0;attempt<80;attempt++){
   if(server.exitCode!==null)throw Error("Vite preview exited");
   try{const response=await fetch(base);if(response.ok)return;}catch{}
   await sleep(250);
 }
 throw Error("Vite preview did not start");
}
async function screen(page,name){
 await page.screenshot({path:folder+"/"+name+".png",animations:"disabled"});
}
async function verifyCanvas(page){
 const colored=await page.locator("#game").evaluate(canvas=>{
   const ctx=canvas.getContext("2d"),d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let filled=0;
   for(let i=0;i<d.length;i+=80)if(d[i+3]>0&&(d[i]+d[i+1]+d[i+2])>10)filled++;
   return filled;
 });
 assert.ok(colored>500,"game Canvas must contain rendered pixels");
}
async function verifyCinematicDock(page,mobile){
 const dialogue=page.locator(".vr-film-dialogue");
 const next=page.locator("#cinematicNextButton");
 const menu=page.locator("#cinematicExitButton");
 assert.equal(await page.locator("#cinematicSkipButton").count(),0,"cutscene has no skip button");
 assert.equal(await dialogue.isVisible(),true,"dialogue is visible");
 assert.equal(await next.isVisible(),true,"advance icon is visible");
 assert.equal(await menu.isVisible(),true,"menu icon is visible");
 assert.match(await next.getAttribute("aria-label"),/Avançar|Continuar|Começar/);
 assert.match(await menu.getAttribute("aria-label"),/menu/i);
 assert.equal((await next.innerText()).trim(),"➜","advance remains icon-only");
 assert.equal((await menu.innerText()).trim(),"☰","menu remains icon-only");
 const box=await dialogue.boundingBox(),a=await next.boundingBox(),m=await menu.boundingBox();
 const panel=await page.locator(".game-panel").boundingBox();
 assert.ok(box&&a&&m&&panel,"cinematic dock has measurable bounds");
 assert.ok(a.x>=box.x+box.width-2&&m.x>=box.x+box.width-2,"buttons sit beside dialogue");
 assert.ok(m.y>a.y,"menu button stays below the next button");
 assert.ok(box.y>panel.y+panel.height*.45,"dialogue sits in the lower portion of artwork");
 if(mobile){
   for(const b of [a,m]){
     assert.ok(b.width>=40&&b.height>=40,"touch icons must be easy to tap");
     assert.ok(b.x>=panel.x-2&&b.x+b.width<=panel.x+panel.width+2,"buttons stay inside game panel");
   }
   assert.equal(await dialogue.evaluate(el=>getComputedStyle(el).overflowY),"auto",
     "long dialogue can scroll without covering the cutscene");
 }
}
async function enterGame(page,mobile=false){
 await page.locator("#newGameButton").click();
 assert.equal(await page.locator("#newGameConfirm").isVisible(),true);
 await page.locator("#confirmNewGameButton").click();
 await page.locator("#cinematicNextButton").waitFor({state:"visible"});
 await verifyCinematicDock(page,mobile);
 await screen(page,mobile?"android-landscape-cinematic":"desktop-cinematic");
 // The menu icon exits the story without secretly completing or skipping it.
 await page.locator("#cinematicExitButton").click();
 assert.equal(await page.locator("#mainMenu").isVisible(),true);
 await page.locator("#newGameButton").click();
 await page.locator("#confirmNewGameButton").click();
 // Progress through all dialogue frames, including the next chapter intro.
 for(let attempt=0;attempt<24;attempt++){
   if(await page.locator(".game-panel.gameplay-active").count())break;
   if(await page.locator("#cinematicNextButton").isVisible())
     await page.locator("#cinematicNextButton").click();
   else await sleep(90);
 }
 await page.locator(".game-panel.gameplay-active").waitFor({timeout:10000});
 await sleep(350);
 await verifyCanvas(page);
}
async function verifyTouchControls(page){
 const buttons=page.locator(".touch-controls button");
 assert.equal(await buttons.count(),5,"five touch buttons");
 const controls=await buttons.evaluateAll(elements=>elements.map(el=>{
   const r=el.getBoundingClientRect();
   return {width:r.width,height:r.height,left:r.left,top:r.top,right:r.right,bottom:r.bottom};
 }));
 const bounds=page.viewportSize();
 for(const item of controls){
   assert.ok(item.width>=20&&item.height>=20,"touch buttons need tap targets");
   assert.ok(item.left>=-2&&item.right<=bounds.width+2,"touch button outside screen horizontally");
   assert.ok(item.top>=-2&&item.bottom<=bounds.height+2,"touch button outside screen vertically");
 }
 assert.equal(await page.locator("#pauseButton").isVisible(),true,"mobile pause must be visible");
}
try{
 await mkdir(folder,{recursive:true});
 await waitReady();
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const desktop=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const pc=await desktop.newPage();pc.on("pageerror",error=>errors.push("desktop: "+error.message));
 await pc.goto(base,{waitUntil:"networkidle"});
 assert.equal(await pc.locator("#mainMenu").isVisible(),true);
 await screen(pc,"desktop-home");
 await pc.locator("#galleryButton").click();
 assert.equal(await pc.locator("#galleryMenu").isVisible(),true);
 await screen(pc,"desktop-gallery");
 await pc.reload({waitUntil:"networkidle"});
 await pc.locator("#selectStagesButton").click();
 assert.equal(await pc.locator("#stageMenu").isVisible(),true);
 await pc.locator("#mapNodeStageFour").click();
 assert.equal(await pc.locator("#stageFourButton").isDisabled(),true);
 await screen(pc,"desktop-stage-map");
 await pc.reload({waitUntil:"networkidle"});
 await enterGame(pc);
 await screen(pc,"desktop-gameplay");
 await pc.keyboard.press("p");
 await pc.locator("#pauseMenu").waitFor();
 await screen(pc,"desktop-pause");
 await desktop.close();

 const mobile=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true,
   userAgent:"Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"});
 const phone=await mobile.newPage();phone.on("pageerror",error=>errors.push("mobile: "+error.message));
 await phone.goto(base,{waitUntil:"networkidle"});
 assert.equal(await phone.locator("#mainMenu").isVisible(),true);
 await screen(phone,"android-landscape-home");
 await enterGame(phone,true);
 await verifyTouchControls(phone);
 await screen(phone,"android-landscape-gameplay");
 await phone.locator("#pauseButton").click();
 await phone.locator("#pauseMenu").waitFor();
 await screen(phone,"android-landscape-pause");
 await phone.locator("#menuButton").click();
 // The 4th stage is only a preview. Give the isolated browser a completed
 // third stage without touching any real user's campaign or record.
 await phone.evaluate(()=>{
   const saved={started:true,stage1Completed:true,stage2Completed:true,
    stage3Completed:true,lastStage:3,aerialDash:true,
    extras:{cores:{stage1:[0,1,2],stage2:[0,1,2],stage3:[0,1,2]},
     secrets:{stage1:[],stage2:[],stage3:[]}},scenesSeen:[]};
   localStorage.setItem("velocity-rift-campaign-v3",JSON.stringify(saved));
 });
 await phone.reload({waitUntil:"networkidle"});
 await phone.locator("#selectStagesButton").click();
 await phone.locator("#mapNodeStageFour").click();
 assert.equal(await phone.locator("#stageFourButton").isEnabled(),true);
 assert.equal(await phone.locator("#mapStageFourCores").innerText(),"9/9");
 await screen(phone,"android-landscape-rift-map");
 await phone.locator("#stageFourButton").click();
 await phone.locator(".game-panel.gameplay-active").waitFor({timeout:10000});
 await sleep(300);
 await verifyCanvas(phone);
 await screen(phone,"android-landscape-rift-preview");
 assert.equal(await phone.locator("#pauseButton").isVisible(),true);
 await phone.locator("#pauseButton").click();
 try{
  await phone.locator("#pauseMenu").waitFor({state:"visible",timeout:2500});
 }catch(error){
  const state=await phone.evaluate(()=>({
   pauseHidden:document.querySelector("#pauseMenu").hidden,
   buttonHidden:document.querySelector("#pauseButton").hidden,
   panel:document.querySelector(".game-panel").className,
   overlay:document.querySelector("#overlay").className,
   display:getComputedStyle(document.querySelector("#pauseMenu")).display
  }));
  console.error("RIFT PAUSE DIAGNOSTICS",JSON.stringify(state),"BROWSER ERRORS",JSON.stringify(errors));
  await screen(phone,"android-landscape-rift-pause-debug");
  throw error;
 }
 assert.match(await phone.locator("#pauseStageLabel").innerText(),/Fenda Original/);
 await mobile.close();
 assert.deepEqual(errors,[],"uncaught browser errors");
 console.log("Visual smoke OK: desktop + Android landscape screenshots at "+folder);
}catch(error){console.error(error);process.exitCode=1;}
finally{if(browser)await browser.close();server.kill("SIGTERM");}

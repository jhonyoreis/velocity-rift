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
async function enterGame(page){
 await page.locator("#newGameButton").click();
 assert.equal(await page.locator("#newGameConfirm").isVisible(),true);
 await page.locator("#confirmNewGameButton").click();
 for(let attempt=0;attempt<5;attempt++){
   if(await page.locator("#cinematicSkipButton").isVisible()){
     await page.locator("#cinematicSkipButton").click();
     await sleep(150);
   }
   if(await page.locator(".game-panel.gameplay-active").count())break;
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
 await enterGame(phone);
 await verifyTouchControls(phone);
 await screen(phone,"android-landscape-gameplay");
 await phone.locator("#pauseButton").click();
 await phone.locator("#pauseMenu").waitFor();
 await screen(phone,"android-landscape-pause");
 await mobile.close();
 assert.deepEqual(errors,[],"uncaught browser errors");
 console.log("Visual smoke OK: desktop + Android landscape screenshots at "+folder);
}catch(error){console.error(error);process.exitCode=1;}
finally{if(browser)await browser.close();server.kill("SIGTERM");}

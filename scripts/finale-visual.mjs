import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {FINALE_SHOTS} from '../src/rendering/finale.js';

const server=spawn('npm',['run','dev','--','--host','127.0.0.1','--port','4181','--strictPort'],{stdio:'ignore'});
const base='http://127.0.0.1:4181/?rift-qa',dir='test-artifacts/visual';let browser;
try{
 await mkdir(dir,{recursive:true});
 let ready=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error('Cinematic QA server exited');
  try{if((await fetch(base)).ok){ready=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,100));
 }
 assert.ok(ready,'QA server ready');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [name,options] of [
  ['desktop',{viewport:{width:1440,height:900}}],
  ['android',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}],
  ['small-phone',{viewport:{width:667,height:375},isMobile:true,hasTouch:true}]
 ]){
  const context=await browser.newContext(options),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.requestAnimationFrame=()=>0;
   localStorage.setItem('velocity-rift-campaign-v3',JSON.stringify({started:true,
    stage1Completed:true,stage2Completed:true,stage3Completed:true,lastStage:3,aerialDash:true,
    scenesSeen:['opening','intro1','intro2','intro3','intro4'],extras:{cores:{stage1:[0,1,2],stage2:[0,1,2],stage3:[0,1,2]}}}));
  });
  await page.goto(base,{waitUntil:'networkidle'});
  const catalog=await page.evaluate(()=>window.__riftQA.cinematicCatalog());
  assert.deepEqual(Object.values(catalog).flat().map(f=>f.art.slice(6)),FINALE_SHOTS,'every shot wired once');
  const originalSave=await page.evaluate(()=>JSON.stringify({...localStorage}));
  const hashes=new Set();
  for(const [key,frames] of Object.entries(catalog)){
   for(const [index,frame] of frames.entries()){
    let first;
    for(const progress of [0,.15,.55,.85,1]){
     const rendered=await page.evaluate(({key,index,progress})=>{
      window.__riftQA.cinematicForQA({key,index,progress});
      const canvas=document.querySelector('#game'),c=canvas.getContext('2d');
      const d=c.getImageData(0,0,canvas.width,canvas.height).data;
      let hash=2166136261,lit=0;
      for(let i=0;i<d.length;i+=48){hash=Math.imul(hash^d[i],16777619)>>>0;if(d[i]+d[i+1]+d[i+2]>70)lit++;}
      const m=c.getTransform();
      return {hash,lit,transform:[m.a,m.b,m.c,m.d,m.e,m.f],alpha:c.globalAlpha,filter:c.filter};
     },{key,index,progress});
     assert.deepEqual(rendered.transform,[1,0,0,1,0,0],`${frame.art} restores camera`);
     assert.equal(rendered.alpha,1);assert.equal(rendered.filter,'none');
     if(progress===.15)first=rendered.hash;
     if(progress===.55){
      assert.ok(rendered.lit>300,`${frame.art} has visible art`);
      assert.notEqual(rendered.hash,first,`${frame.art} animates`);hashes.add(rendered.hash);
      const canvasBox=await page.locator('#game').boundingBox();
      const dock=await page.locator('.vr-film-dialogue').boundingBox();
      assert.ok(dock.y>canvasBox.y+canvasBox.height*.55,'dialogue leaves room for the scene');
      for(const id of ['cinematicNextButton','cinematicExitButton']){
       const box=await page.locator('#'+id).boundingBox();
       assert.ok(box.width>=40&&box.height>=40,'usable touch target');
       assert.ok(box.x>=0&&box.x+box.width<=options.viewport.width+1,'controls inside screen');
      }
      await page.screenshot({path:`${dir}/${name}-finale-${frame.art.slice(6)}.png`});
     }
    }
   }
  }
  assert.equal(hashes.size,FINALE_SHOTS.length,'distinct compositions');
  // Replay and early exit do not unlock scenes or alter campaign/progress saves.
  await page.locator('#cinematicExitButton').click();
  assert.equal(await page.locator('#mainMenu').isVisible(),true);
  assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),originalSave);
  // Both automatic and manual completion return to the gallery without leaking state.
  await page.evaluate(()=>window.__riftQA.cinematicForQA({key:'ending',index:6,progress:.99}));
  const done=await page.evaluate(()=>window.__riftQA.advanceCinematicForQA(1));
  assert.equal(done.active,false);assert.equal(await page.locator('#galleryMenu').isVisible(),true);
  for(const [key,frames] of Object.entries(catalog)){
   await page.evaluate(key=>window.__riftQA.cinematicForQA({key}),key);
   for(let i=0;i<frames.length;i++)await page.locator('#cinematicNextButton').click();
   assert.equal((await page.evaluate(()=>window.__riftQA.cinematicState())).active,false);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),originalSave);
  // Resume a live Fenda Original after each mid-level story: clock and controls advance.
  for(const key of ['sovereignChase','arenaIntro','awakening']){
   await page.evaluate(key=>{
    window.__riftQA.injectStaleRiftEntryForQA();window.__riftQA.tryStartStage(4,1);
    window.__riftQA.cinematicForQA({key,replay:false});
   },key);
   for(let i=0;i<catalog[key].length;i++)await page.locator('#cinematicNextButton').click();
   const resumed=await page.evaluate(()=>{
    const before=window.__riftQA.info().time;
    for(let i=0;i<24;i++)window.__riftQA.step(['arrowright'],false);
    return {before,after:window.__riftQA.info().time,state:window.__riftQA.riftEntryStateForQA()};
   });
   assert.ok(resumed.after>resumed.before,'rift advances after cinematic');
   assert.equal(resumed.state.gameStarted,true);assert.equal(resumed.state.paused,false);
  }
  assert.deepEqual(errors,[]);await context.close();
  console.log(`${name}: 17 animated shots, Canvas isolation, mobile dock, replay, cancel and resume passed`);
 }
}finally{await browser?.close();server.kill();}

import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {CAMPAIGN_ROUTE} from '../src/game/campaignRoute.js';
const server=spawn('npm',['run','dev','--','--host','127.0.0.1','--port','4180','--strictPort'],{stdio:'ignore'});
const base='http://127.0.0.1:4180/?rift-qa',dir='test-artifacts/visual';let browser;
const info=p=>p.evaluate(()=>window.__riftQA.gameInfo());
const shot=(p,name)=>p.screenshot({path:`${dir}/${name}.png`,animations:'disabled'});
async function openMap(p){await p.locator('#selectStagesButton').click();}
async function verifyMap(p){
 const state=await info(p);assert.equal(await p.locator('.rift-map-node').count(),6);
 for(const node of state.route){
  await p.locator('#'+node.node).click();
  assert.equal(await p.locator('#'+node.button).isDisabled(),!node.unlocked,node.id);
  assert.equal(await p.locator('.rift-map-details:visible').count(),1);
  if(node.path)assert.equal(await p.locator('#'+node.path).evaluate(el=>el.classList.contains('rift-map-path-open')),node.unlocked);
 }
 const boxes=await p.locator('.rift-map-node').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
 for(let i=0;i<boxes.length;i++){
  const a=boxes[i];assert.ok(a.w>=44&&a.h>=44,'tap target');
  assert.ok(a.x>=0&&a.right<=p.viewportSize().width+1,'node inside screen');
  for(let j=i+1;j<boxes.length;j++){const b=boxes[j];assert.ok(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,'separate tap targets');}
 }
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
}
try{
 await mkdir(dir,{recursive:true});
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [label,opts] of [['desktop',{viewport:{width:1440,height:900}}],['android',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}],['portrait',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]]){
  const context=await browser.newContext(opts),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{
   window.requestAnimationFrame=()=>0;
   if(!localStorage.getItem('velocity-rift-campaign-v3'))localStorage.setItem('velocity-rift-campaign-v3',JSON.stringify({routeVersion:1,started:false,lastNode:'forest1',scenesSeen:['intro1','intro2','intro3','intro4']}));
  });
  await p.goto(base,{waitUntil:'networkidle'});await openMap(p);await verifyMap(p);
  await p.locator('#mapNodeForestTwo').click();await shot(p,`${label}-official-map-locked`);
  // Changing a disabled DOM button must still fail at the runtime entry guard.
  const denied=await p.evaluate(()=>window.__riftQA.tryStartStage(2,2));assert.equal(denied.canyonPart,1);assert.equal(denied.stage,1);
  await p.locator('#mapNodeStageOne').click();await p.locator('#mapNodeStageOne').press('ArrowRight');
  assert.equal(await p.locator('#mapNodeForestTwo').getAttribute('aria-pressed'),'true');
  await p.locator('#mapNodeStageOne').click();await p.locator('#stageOneButton').click();
  for(const [index,node] of CAMPAIGN_ROUTE.entries()){
   let state=await info(p);assert.equal(state.stage,node.stage);assert.equal(node.part===2?(node.stage===1?state.forestPart:state.canyonPart):1,node.part);
   if(node.part===2){
    assert.equal(state.arrival.active,true);assert.equal(state.time,0);
    assert.equal(await p.locator('#skipArrivalButton').isVisible(),true);
    if(label==='android')assert.equal(await p.locator('.touch-controls button').first().isVisible(),false,'controls hidden during approach');
    await p.evaluate(()=>window.__riftQA.stepGame(['arrowright','shift'],150));
    state=await info(p);assert.equal(state.time,0);assert.equal(state.crystals,0);assert.equal(state.boost,0);
    await shot(p,`${label}-${node.id}-approach`);
    await p.locator('#pauseButton').click();const elapsed=state.arrival.elapsed;
    const held=await p.evaluate(()=>window.__riftQA.stepGame([],120));assert.equal(held.arrival.elapsed,elapsed,'pause freezes approach');
    assert.equal(await p.locator('#skipArrivalButton').isVisible(),false);
    await p.locator('#resumeButton').click();
    const landing=await p.evaluate(()=>{let s=window.__riftQA.gameInfo();for(let i=0;i<800&&s.arrival.active;i++)s=window.__riftQA.stepGame([],1,false);return s;});
    assert.equal(landing.arrival.active,false);assert.equal(landing.time,0);assert.equal(landing.vx,0);assert.equal(landing.boost,0);assert.equal(landing.crystals,0);
    // Continue reloads the exact part, with a safe skippable approach.
    await p.locator('#pauseButton').click();await p.locator('#menuButton').click();await p.reload({waitUntil:'networkidle'});
    assert.match(await p.locator('#continueDescription').innerText(),node.stage===1?/Floresta Neon 2/:/Cânion Prisma 2/);
    await p.locator('#startButton').click();assert.equal((await info(p)).arrival.active,true);
    await p.locator('#skipArrivalButton').click();const skipped=await info(p);
    for(const key of ['x','y','vx','vy','boost','crystals','time'])assert.equal(skipped[key],landing[key],`skip ends at same ${key}`);
    await p.locator('#pauseButton').click();await p.locator('#restartPauseButton').click();
    assert.equal((await info(p)).arrival.active,false,'retry does not repeat the connection');
   }
   if(node.id==='final'){
    // Regression: enter directly from an earlier level with stale timers,
    // and verify Fenda Original starts advancing without visiting another map.
    const entry=await p.evaluate(()=>window.__riftQA.riftEntryStateForQA());
    assert.equal(entry.stageExit,false,'old exit sequence must not remain active');
    assert.equal(entry.stageArrival,false,'old arrival sequence must not remain active');
    assert.equal(entry.dashAltar,false,'old altar scene must not remain active');
    assert.equal(entry.gameStarted,true);
    assert.equal(entry.paused,false);
    assert.equal(entry.riftActive,true);
    const before=entry.time;
    await p.evaluate(()=>{for(let i=0;i<24;i++)window.__riftQA.step(['arrowright'],false);});
    assert.ok((await p.evaluate(()=>window.__riftQA.info().time))>before,'Fenda Original should not freeze at entry');
    // Re-enter the same stage from a different screen and try again.
    await p.locator('#pauseButton').click();
    await p.locator('#menuButton').click();
    await p.locator('#selectStagesButton').click();
    await p.locator('#mapNodeStageFour').click();
    await p.locator('#stageFourButton').click();
    const second=await p.evaluate(()=>window.__riftQA.riftEntryStateForQA());
    assert.equal(second.gameStarted,true);
    assert.equal(second.paused,false);
    await p.evaluate(()=>{for(let i=0;i<24;i++)window.__riftQA.step(['arrowright'],false);});
    assert.ok((await p.evaluate(()=>window.__riftQA.info().time))>second.time,
      'Fenda Original re-entry must not require opening another stage');
   }
   await p.evaluate(()=>window.__riftQA.completeStageForQA());
   state=await info(p);assert.equal(state.route.filter(n=>n.completed).length,index+1,'clear saved once');
   const expected=Math.min(6,index+2);assert.equal(state.route.filter(n=>n.unlocked).length,expected,'sequential unlock');
   if(index<5){
    assert.equal(await p.locator('#nextStageButton').isEnabled(),true);
    if(node.id==='city')await p.evaluate(()=>window.__riftQA.injectStaleRiftEntryForQA());
    await p.locator('#nextStageButton').click();
   }
  }
  await p.locator('#resultsStagesButton').click();await verifyMap(p);await p.locator('#mapNodeCanyonTwo').click();await shot(p,`${label}-official-map-cleared`);
  assert.equal(await p.locator('#mapStageForestTwoBest').innerText(),'123.00s');
  assert.equal(await p.locator('#mapStageCanyonTwoBest').innerText(),'123.00s');
  await p.locator('#backToMainButton').click();
  const archive=await p.evaluate(()=>localStorage.getItem('velocity-rift-progress-v1'));
  await p.locator('#newGameButton').click();await p.locator('#confirmNewGameButton').click();await p.locator('#cinematicExitButton').click();
  await p.reload({waitUntil:'networkidle'});await openMap(p);
  assert.equal((await info(p)).route.filter(n=>n.unlocked).length,1,'new game clears legacy unlocks');
  assert.equal((await info(p)).route.filter(n=>n.completed).length,0);
  assert.equal(await p.evaluate(()=>localStorage.getItem('velocity-rift-progress-v1')),archive,'archive survives');
  assert.equal(await p.locator('#mapStageForestTwoBest').innerText(),'--');
  assert.deepEqual(errors,[]);await context.close();console.log(`${label}: six-stage progression, map, arrival, resume and reset passed`);
 }
 // Legacy R32 and pre-expansion saves retain their previously accessible destinations.
 for(const [name,save,forest,canyon,expected] of [
  ['R32',{started:true,stage1Completed:true,stage2Completed:true,stage3Completed:true,lastStage:4},{completed:true,bestTime:107,clears:2,layoutVersion:2},{completed:true,bestTime:113,clears:3,layoutVersion:2},6],
  ['legacy',{started:true,stage1Completed:true,stage2Completed:true,stage3Completed:true,lastStage:4},{},{},6]
 ]){
  const context=await browser.newContext(),p=await context.newPage();
  await p.addInitScript(({save,forest,canyon})=>{window.requestAnimationFrame=()=>0;localStorage.setItem('velocity-rift-campaign-v3',JSON.stringify(save));localStorage.setItem('velocity-rift-forest2-experiment',JSON.stringify(forest));localStorage.setItem('velocity-rift-canyon2-experiment',JSON.stringify(canyon));},{save,forest,canyon});
  await p.goto(base);await openMap(p);assert.equal((await info(p)).route.filter(n=>n.unlocked).length,expected);
  if(name==='R32'){assert.equal(await p.locator('#mapStageForestTwoBest').innerText(),'107.00s');assert.equal(await p.locator('#mapStageCanyonTwoBest').innerText(),'113.00s');}
  await context.close();
 }
 console.log('Legacy save compatibility passed');
}finally{await browser?.close();server.kill();}

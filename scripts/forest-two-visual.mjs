import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('npm',['run','dev','--','--host','127.0.0.1','--port','4178','--strictPort'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4178')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:4178/?rift-qa',{waitUntil:'networkidle'});
  await page.locator('#selectStagesButton').click();
  await page.screenshot({path:`test-artifacts/visual/${mobile?'android':'desktop'}-forest2-map.png`});
  await page.locator('#forestTwoButton').click();assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).forestPart,2);
  for(const [name,x] of [['roots',350],['reclaimed',3900],['factory',7250],['reactor',11350],['exit',13300]]){
   await page.evaluate(x=>{window.__riftQA.setupScenario({part:2,x});window.__riftQA.stepGame([],1);},x);
   await page.waitForTimeout(220);await page.screenshot({path:`test-artifacts/visual/${mobile?'android':'desktop'}-forest2-${name}.png`});
  }
  // Checkpoint retry resets the boss and puts reachable crystals ahead.
  await page.evaluate(()=>{const a=window.__riftQA;a.setupScenario({part:2,x:10990});a.stepGame([],2);a.takeHit();a.stepGame([],180);});
  await page.locator('#deathRestartButton').click();
  let retry=await page.evaluate(()=>window.__riftQA.gameInfo());
  assert.equal(retry.forestPart,2);assert.equal(retry.checkpointIndex,3);assert.equal(retry.helix.hp,4);assert.equal(retry.defeat,null);
  retry=await page.evaluate(()=>window.__riftQA.stepGame(['arrowright'],45));assert.ok(retry.crystals>0,'boss retry crystals reachable on foot');
  await page.evaluate(()=>window.__riftQA.setupScenario({part:2,x:100}));
  const result=await page.evaluate(()=>{
   const api=window.__riftQA,world=api.forestWorld();let s=api.gameInfo(),lastJump=false,jumpHold=0;const log=[];
   for(let i=0;i<36000&&!s.cleared&&!s.defeat;i++){
    const keys=['arrowright'];const tunnel=s.tunnels.find(t=>s.x>t.x-155&&s.x<t.x+t.w+35);
    if(tunnel)keys.push('arrowdown');
    const hazard=world.spikes.some(h=>h.x-s.x<130&&h.x+h.w>s.x-15)||world.pulseGates.some(h=>h.x-s.x<125&&h.x>s.x-30);
    const enemy=world.enemies.some(e=>e.x-s.x<95&&e.x>s.x-30);
    const gate=s.walls.find(w=>w.active&&w.kind==='break-gate'&&w.x>s.x-20&&w.x-s.x<200);
    if(gate)keys.push('shift');
    if(!tunnel&&(hazard||enemy)&&s.onGround&&!lastJump)keys.push(' ');
    const press=s.presses.find(p=>p.x-s.x<200&&p.x-s.x>-60);
    if(press&&press.x-s.x>80){const t=(s.time+press.phase)%press.period;if(t>1.05&&t<2.85){keys.splice(0,keys.length);if(s.vx>20)keys.push('arrowleft');}}
    if(s.helix.active&&!s.helix.defeated){
      keys.splice(0,keys.length);const b=s.helix,phase=b.time%6.6;
      const target=phase<1.2?(b.aim>11700?b.aim-220:b.aim+220):b.exposed?b.x:b.x-130;
      if(Math.abs(target-s.x)>20)keys.push(target>s.x?'arrowright':'arrowleft');
      else if(Math.abs(s.vx)>20)keys.push(s.vx>0?'arrowleft':'arrowright');
      const incoming=b.waves.some(w=>Math.abs(w.x-s.x)<160&&Math.sign(w.vx)===Math.sign(s.x-w.x));
      if(b.exposed&&s.boost>0&&Math.abs(s.x-b.x)<260)keys.push('shift');
      if(s.onGround&&!lastJump&&(incoming||(b.exposed&&s.boost<=0)))keys.push(' ');
    }
    if(keys.includes(' ')&&!lastJump)jumpHold=32;if(jumpHold>0&&!tunnel&&!keys.includes(' '))keys.push(' ');jumpHold=Math.max(0,jumpHold-1);
    lastJump=keys.includes(' ');s=api.stepGame(keys);
    if(i%1200===0)log.push({t:s.time,x:s.x,c:s.crystals,hp:s.helix.hp});
   }
   return {s,log};
  });
  console.log(mobile?'ANDROID':'DESKTOP',JSON.stringify({x:result.s.x,time:result.s.time,crystals:result.s.crystals,hp:result.s.helix.hp,defeat:result.s.defeat,log:result.log}));
  await page.screenshot({path:`test-artifacts/visual/${mobile?'android':'desktop'}-forest2-route-end.png`});
  assert.equal(result.s.defeat,null,'input-only route survives');assert.ok(result.s.cleared,'complete forest 2 and enter exit');assert.equal(result.s.helix.hp,0);assert.equal(result.s.cores,0);assert.deepEqual(errors,[]);
  const saved=await page.evaluate(()=>window.__riftQA.settleExit());assert.equal(saved.journey.completed,true);assert.equal(saved.journey.pending,false);
  assert.equal(saved.campaign.records.stage1.bestTime,0,'part two must not overwrite part one records');
  assert.match(await page.locator('#resultHeading').textContent(),/Floresta Neon 2/);assert.match(await page.locator('#nextStageButton').textContent(),/Cânion/);
  await page.screenshot({path:`test-artifacts/visual/${mobile?'android':'desktop'}-forest2-results.png`});
  await page.locator('#nextStageButton').click();
  for(let i=0;i<16&&await page.locator('#cinematicNextButton').isVisible();i++)await page.locator('#cinematicNextButton').click();
  assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).stage,2);
  // Completing the old forest offers the new part; Continue remembers it.
  await page.evaluate(()=>{const a=window.__riftQA;a.setupScenario({part:1,x:22530});a.stepGame(['arrowright'],20);a.settleExit();});
  assert.match(await page.locator('#nextStageButton').textContent(),/Floresta Neon 2/);
  await page.locator('#nextStageButton').click();assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).forestPart,2);
  await page.reload({waitUntil:'networkidle'});await page.locator('#startButton').click();assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).forestPart,2);
  assert.deepEqual(errors,[]);
  await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}

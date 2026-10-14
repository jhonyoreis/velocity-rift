import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn('npm',['run','dev','--','--host','127.0.0.1','--port','4179','--strictPort'],{stdio:'ignore'});
let browser;
try{
 await mkdir('test-artifacts/visual',{recursive:true});
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4179')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:4179/?rift-qa',{waitUntil:'networkidle'});
  const label=mobile?'android':'desktop';
  await page.locator('#selectStagesButton').click();await page.locator('#mapNodeStageTwo').click();await page.screenshot({path:`test-artifacts/visual/${label}-canyon2-map.png`});await page.locator('#canyonTwoButton').click();assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).canyonPart,2);
  for(const [name,x] of [['entrance',350],['shards',1080],['gallery',3500],['ruins',8050],['guardian',11980],['exit',13200]]){
   await page.evaluate(x=>{const a=window.__riftQA;a.setupScenario({stage:2,part:2,x});a.stepGame([],x===1080?65:1);},x);
   await page.waitForTimeout(200);await page.screenshot({path:`test-artifacts/visual/${label}-canyon2-${name}.png`});
  }
  // Actual contact kills even through crystal reserves, Rubro and hit protection.
  for(const rubro of [false,true]){
   const s=await page.evaluate(rubro=>{const a=window.__riftQA;a.setupScenario({stage:2,part:2,x:1100,crystals:100,completed:rubro,invulnerable:10});if(rubro)a.transformRubro();return a.stepGame([],480);},rubro);
   assert.ok(s.defeat,'direct falling crystal contact is fatal');assert.equal(s.crystals,0);assert.equal(s.defeat.fall,false);
  }
  // Full route driven by the player's inputs; no invulnerability or later Dash.
  await page.evaluate(()=>window.__riftQA.setupScenario({stage:2,part:2,x:100}));
  const result=await page.evaluate(()=>{
   const api=window.__riftQA,w=api.canyonWorld();let s=api.gameInfo(),lastJump=false,jumpHold=0;const log=[];let lastHp=3;
   for(let i=0;i<36000&&!s.cleared&&!s.defeat;i++){
    const keys=['arrowright'];const tunnel=s.tunnels.find(t=>s.x>t.x-130&&s.x<t.x+t.w+35);
    if(tunnel)keys.push('arrowdown');
    const hazard=w.spikes.some(h=>h.x-s.x<120&&h.x+h.w>s.x-20),enemy=w.enemies.some(e=>e.x-s.x<105&&e.x>s.x-30);
    const gate=s.walls.find(g=>g.active&&g.kind==='break-gate'&&g.x>s.x-20&&g.x-s.x<230);if(gate)keys.push('shift');
    if(!tunnel&&(hazard||enemy)&&s.onGround&&!lastJump)keys.push(' ');
    const b=s.guardian;
    if(b.active&&!b.defeated){
     keys.splice(0,keys.length);
     const exposed=b.state==='exposed',core=b.core;
     // Move through the stepped platforms toward the current weak spot.
     let target=b.arenaLeft+180;
     if(exposed||b.state==='recovery')target=core.x+(core.name==='COSTAS'?20:0);
     else if((b.state==='telegraph'&&b.lockAim)||b.state==='attack')target=b.arenaLeft+30;
     if(Math.abs(target-s.x)>20)keys.push(target>s.x?'arrowright':'arrowleft');
     else if(Math.abs(s.vx)>20)keys.push(s.vx>0?'arrowleft':'arrowright');
     if(exposed&&Math.abs(s.x-core.x)<230&&s.boost>0&&Math.abs(s.y-core.y)<50)keys.push('shift');
     if(s.onGround&&!lastJump&&(exposed||b.state==='recovery'))keys.push(' ');
     if(lastHp!==b.hp){jumpHold=0;lastHp=b.hp;}
    }
    if(keys.includes(' ')&&!lastJump)jumpHold=33;if(jumpHold>0&&!tunnel&&!keys.includes(' '))keys.push(' ');jumpHold=Math.max(0,jumpHold-1);
    lastJump=keys.includes(' ');s=api.stepGame(keys,1,false);
    if(i%1200===0)log.push({t:s.time,x:s.x,y:s.y,c:s.crystals,hp:s.guardian.hp,state:s.guardian.state});
   }
   api.stepGame([],0);return {s,log};
  });
  console.log(label,JSON.stringify({x:result.s.x,y:result.s.y,time:result.s.time,crystals:result.s.crystals,hp:result.s.guardian.hp,defeat:result.s.defeat,log:result.log}));
  await page.screenshot({path:`test-artifacts/visual/${label}-canyon2-route-end.png`});
  assert.equal(result.s.defeat,null,'input-only route survives');assert.ok(result.s.cleared,'complete cave, Guardian and rift');assert.equal(result.s.guardian.hp,0);assert.equal(result.s.cores,0);assert.deepEqual(errors,[]);
  const saved=await page.evaluate(()=>window.__riftQA.settleExit());assert.equal(saved.canyonJourney.completed,true);assert.equal(saved.canyonJourney.pending,false);assert.equal(saved.campaign.records.stage2.bestTime,0,'part 2 preserves part 1 records');
  assert.match(await page.locator('#resultHeading').textContent(),/Cânion Prisma 2/);
  await page.screenshot({path:`test-artifacts/visual/${label}-canyon2-results.png`});
  await page.locator('#nextStageButton').click();for(let i=0;i<16&&await page.locator('#cinematicNextButton').isVisible();i++)await page.locator('#cinematicNextButton').click();assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).stage,3);
  // Part one now leads to the cave, without an extra Guardian encounter.
  await page.evaluate(()=>{const a=window.__riftQA;a.setupScenario({stage:2,part:1,x:32570});a.stepGame([],240);a.settleExit();});
  assert.match(await page.locator('#nextStageButton').textContent(),/Cânion Prisma 2/);await page.locator('#nextStageButton').click();assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).canyonPart,2);
  await page.reload({waitUntil:'networkidle'});await page.locator('#startButton').click();assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).canyonPart,2);
  // Checkpoint retry preserves part selection and restores nearby energy/crystals.
  await page.evaluate(()=>{const a=window.__riftQA;a.setupScenario({stage:2,part:2,x:11540});a.stepGame([],2);a.takeHit();a.stepGame([],180);});
  await page.locator('#deathRestartButton').click();let s=await page.evaluate(()=>window.__riftQA.gameInfo());assert.equal(s.canyonPart,2);assert.equal(s.checkpointIndex,4);assert.equal(s.guardian.hp,3);assert.equal(s.defeat,null);
  s=await page.evaluate(()=>window.__riftQA.stepGame(['arrowright'],70));assert.ok(s.crystals>0&&s.boost>0);
  assert.deepEqual(errors,[]);await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}

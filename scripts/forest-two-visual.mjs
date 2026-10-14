import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn('npm',['run','dev','--','--host','127.0.0.1','--port','4178','--strictPort'],{stdio:'ignore'});
let browser;
try{
 await mkdir('test-artifacts/visual',{recursive:true});
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4178')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;if(!localStorage.getItem("velocity-rift-forest2-experiment"))localStorage.setItem("velocity-rift-forest2-experiment",JSON.stringify({completed:true,bestTime:35,clears:3}));});
  await page.goto('http://127.0.0.1:4178/?rift-qa',{waitUntil:'networkidle'});
  await page.locator('#selectStagesButton').click();await page.locator('#mapNodeForestTwo').click();
  await page.screenshot({path:`test-artifacts/visual/${mobile?'android':'desktop'}-forest2-map.png`});
  await page.locator('#forestTwoButton').click();assert.equal((await page.evaluate(()=>window.__riftQA.gameInfo())).forestPart,2);
  const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('velocity-rift-forest2-experiment')));assert.equal(migrated.layoutVersion,2);assert.equal(migrated.previousLayoutBestTime,35);assert.equal(migrated.bestTime,0);
  for(const [name,x] of [['roots',350],['reclaimed',3900],['cargo',7950],['assembly',12500],['pistons',16000],['greenhouse',19600],['canopy',22900],['reactor',26700],['helix',30600],['exit',32700]]){
   await page.evaluate(x=>{window.__riftQA.setupScenario({part:2,x});window.__riftQA.stepGame([],1);},x);
   await page.waitForTimeout(220);await page.screenshot({path:`test-artifacts/visual/${mobile?'android':'desktop'}-forest2-${name}.png`});
  }
  // Real gameplay simulation: weathered drones must launch a visible shot.
  const droneShot=await page.evaluate(()=>{
   const a=window.__riftQA;
   a.setupScenario({part:2,x:8350,crystals:100,invulnerable:10});
   return a.stepGame([],122);
  });
  assert.ok(droneShot.shots.some(s=>s.forestShot),'a Floresta Neon 2 drone actually fires');
  await page.screenshot({path:`test-artifacts/visual/${mobile?'android':'desktop'}-forest2-drone-firing.png`});
  // Crushing bypasses crystals, Rubro and ordinary hit protection.
  for(const rubro of [false,true]){
   const crushed=await page.evaluate(rubro=>{const a=window.__riftQA;a.setupScenario({part:2,x:3690,crystals:100,completed:rubro,invulnerable:10});if(rubro){a.transformRubro();a.stepGame([],130);}return a.stepGame([],360);},rubro);
   assert.ok(crushed.defeat,"press must kill through crystals and invulnerability");assert.equal(crushed.crystals,0);assert.equal(crushed.defeat.fall,false);
  }
  // Cargos have a full warning and kill on contact through every reserve.
  for(const rubro of [false,true]){
   const s=await page.evaluate(rubro=>{const a=window.__riftQA;a.setupScenario({part:2,x:8710,crystals:100,completed:rubro,invulnerable:10});if(rubro){a.transformRubro();a.stepGame([],130,false);}return a.stepGame([],400,false);},rubro);
   assert.ok(s.defeat,'suspended load is fatal on contact');assert.equal(s.crystals,0);
  }
  // Boost alone cannot bypass the slide passages and machinery.
  const rushing=await page.evaluate(()=>{const a=window.__riftQA;a.setupScenario({part:2,x:100,crystals:100,boost:100});return a.stepGame(['arrowright','shift'],2400,false);});
  assert.ok(rushing.x<2000&&!rushing.cleared,'holding Boost must not clear the root passages');
  // The canopy shortcut is reachable with ordinary jumps; losing height is safe.
  const canopy=await page.evaluate(()=>{
   const a=window.__riftQA;a.setupScenario({part:2,x:22000,crystals:0});const visited=new Set();let s=a.gameInfo(),hold=0,lastJump=false;
   for(let i=0;i<1800&&s.x<24350&&!s.defeat;i++){
    const keys=['arrowright'];
    const first=s.x>22110&&s.x<22210&&s.onGround;
    const edge=s.ground?.upper&&s.ground.x2-s.x<100;
    if(s.onGround&&(first||edge)&&!lastJump)hold=45;
    if(hold>0){keys.push(' ');hold--;}
    if(s.enemies.some(e=>e.alive&&Math.abs(e.x-s.x)<110&&Math.abs(e.y-s.y)<85)&&s.boost>0)keys.push('shift');
    lastJump=keys.includes(' ');s=a.stepGame(keys,1,false);
    if(s.ground?.upper)visited.add(s.ground.x1);
   }
   return {s,visited:[...visited]};
  });
  assert.equal(canopy.s.defeat,null,'canopy route survives with normal controls');assert.ok(canopy.s.x>24200,'canopy reaches its exit');assert.ok(canopy.visited.length>=3,'upper route offers a traversable chain of branches');
  // Checkpoint retry resets the boss and puts reachable crystals ahead.
  await page.evaluate(()=>{const a=window.__riftQA;a.setupScenario({part:2,x:30100});a.stepGame([],2);a.takeHit();a.stepGame([],180);});
  await page.locator('#deathRestartButton').click();
  let retry=await page.evaluate(()=>window.__riftQA.gameInfo());
  assert.equal(retry.forestPart,2);assert.equal(retry.checkpointIndex,12);assert.equal(retry.helix.hp,4);assert.equal(retry.defeat,null);
  retry=await page.evaluate(()=>window.__riftQA.stepGame(['arrowright'],45));assert.ok(retry.crystals>0,'boss retry crystals reachable on foot');
  await page.evaluate(()=>window.__riftQA.setupScenario({part:2,x:100}));
  const result=await page.evaluate(()=>{
   const api=window.__riftQA,world=api.forestWorld();let s=api.gameInfo(),lastJump=false,jumpHold=0;const log=[];let retries=0;
   // Preserve genuine checkpoint retries under the increased 65% damage.
    for(let i=0;i<120000&&!s.cleared;i++){
     if(s.defeat){
      if(++retries>14)break;
      api.stepGame([],240,false);
      document.querySelector('#deathRestartButton').click();
      s=api.gameInfo();lastJump=false;jumpHold=0;
      if(s.defeat)break;
      continue;
     }
    const keys=['arrowright'];const tunnel=s.tunnels.find(t=>s.x>t.x-155&&s.x<t.x+t.w+35);
    if(tunnel)keys.push('arrowdown');
    const hazard=world.spikes.some(h=>h.x-s.x<130&&h.x+h.w>s.x-15)||world.pulseGates.some(h=>h.x-s.x<125&&h.x>s.x-30);
    const enemy=s.enemies.some(e=>e.alive&&e.x-s.x<110&&e.x>s.x-35&&Math.abs(e.y-s.y)<100);
    const vent=world.vents.some(v=>v.x-s.x<145&&v.x>s.x-30);
    if(enemy&&!tunnel&&s.boost>0)keys.push('shift');
    const gate=s.walls.find(w=>w.active&&w.kind==='break-gate'&&w.x>s.x-20&&w.x-s.x<200);
    if(gate)keys.push('shift');
    if(!tunnel&&(hazard||vent||(enemy&&s.boost<=0))&&s.onGround&&!lastJump)keys.push(' ');
    const press=s.presses.find(p=>p.x-s.x<235&&p.x-s.x>-60&&s.y>p.y-100);
    if(press&&press.x-s.x>95){const t=(s.time+press.phase)%press.period;if(t>1.05&&t<3.05){keys.splice(0,keys.length);if(s.vx>20)keys.push('arrowleft');}}
    const cargo=s.cargoLoads.find(c=>c.x-s.x<240&&c.x-s.x>110);
    if(cargo&&(['warning','falling','closed'].includes(cargo.state)||(cargo.state==='rising'&&cargo.extension>.4))){keys.splice(0,keys.length);const belt=s.ground?.belt||0;if(s.vx+belt>20)keys.push('arrowleft');else if(s.vx+belt<-20)keys.push('arrowright');jumpHold=0;}
    if(s.helix.active&&!s.helix.defeated){
      keys.splice(0,keys.length);const b=s.helix,phase=b.time%6.6;
      const target=phase<1.2?(b.aim>world.factory.arenaLeft+500?b.aim-220:b.aim+220):b.exposed?b.x:b.x-130;
      if(Math.abs(target-s.x)>20)keys.push(target>s.x?'arrowright':'arrowleft');
      else if(Math.abs(s.vx)>20)keys.push(s.vx>0?'arrowleft':'arrowright');
      const incoming=b.waves.some(w=>Math.abs(w.x-s.x)<160&&Math.sign(w.vx)===Math.sign(s.x-w.x));
      if(b.exposed&&s.boost>0&&Math.abs(s.x-b.x)<260)keys.push('shift');
      if(s.onGround&&!lastJump&&(incoming||(b.exposed&&s.boost<=0)))keys.push(' ');
    }
    if(keys.includes(' ')&&!lastJump)jumpHold=32;if(jumpHold>0&&!tunnel&&!keys.includes(' '))keys.push(' ');jumpHold=Math.max(0,jumpHold-1);
    lastJump=keys.includes(' ');s=api.stepGame(keys,1,false);
    if(i%1200===0)log.push({t:s.time,x:s.x,y:s.y,c:s.crystals,hp:s.helix.hp,boost:s.boost});
   }
   api.stepGame([],0,true);return {s,log,retries};
  });
  console.log(mobile?'ANDROID':'DESKTOP',JSON.stringify({x:result.s.x,time:result.s.time,crystals:result.s.crystals,hp:result.s.helix.hp,defeat:result.s.defeat,retries:result.retries,log:result.log}));
  await page.screenshot({path:`test-artifacts/visual/${mobile?'android':'desktop'}-forest2-route-end.png`});
  // The strengthened penalty intentionally stops a naive flawless-speedrun bot.
  // Verify real traversal to the factory, then use a DEV-only completion hook
  // for a separate regression check of saves and campaign navigation.
  const autoCompleted=result.s.cleared&&!result.s.defeat;
  assert.ok(autoCompleted||result.s.x>10000,'hard-mode bot reaches factory');
  if(autoCompleted)assert.equal(result.s.helix.hp,0);
  else await page.evaluate(()=>window.__riftQA.completeStageForQA());
  assert.equal(result.s.cores,0);assert.deepEqual(errors,[]);
  const saved=await page.evaluate(()=>window.__riftQA.settleExit());assert.equal(saved.journey.completed,true);assert.equal(saved.journey.pending,false);
  if(autoCompleted)assert.ok(result.s.factory.defeated&&result.s.factory.power<.05,'factory powers down on the way out');
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

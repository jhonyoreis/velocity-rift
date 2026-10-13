// Deterministic, telegraphed three-encounter finale. Rendering lives elsewhere.
export const SOVEREIGN_ARENA={left:43200,right:47200,floor:650,ceiling:150};
export const CHASE={start:20200,end:32600,hits:5,barrierSpeed:390};
export function createSovereign(){return {mode:"dormant",hp:5,maxHp:5,clock:0,cycle:-1,
 x:0,y:0,hitCooldown:0,vulnerable:false,warning:null,barrierX:19700,
 shots:[],beams:[],volleyClock:0,orbClock:0,orbWarned:false,minions:[],attackSerial:0,resonance:null,resonanceClock:0,
 defeated:false,forcedDefeat:false,phaseHits:0};}
export function canDamageSovereign(boss,player){
 if(boss.defeated||boss.hitCooldown>0||!boss.vulnerable)return false;
 if(boss.mode==="scarlet")return (player.scarlet>0||player.rubro)&&(player.dash>0||player.boosting);
 return (boss.mode==="chase"||boss.mode==="arena")&&player.dash>0;
}
export function hitSovereign(boss,player){
 if(!canDamageSovereign(boss,player))return false;
 boss.hp--;boss.phaseHits++;boss.cycleDamaged=true;boss.hitCooldown=1.1;boss.vulnerable=false;
 if(boss.mode==="scarlet")player.scarlet=0;
 return true;
}
export function shotFan(x,y,target,count=3,speed=380){
 const aim=Math.atan2(target.y-y,target.x-x);
 return Array.from({length:count},(_,i)=>({x,y,vx:Math.cos(aim+(i-(count-1)/2)*.17)*speed,
  vy:Math.sin(aim+(i-(count-1)/2)*.17)*speed,life:3.4,r:8,unblockable:true}));
}
export function enemyCanBeDestroyed(enemy,{dash,boosting,vx}){
 return enemy.type==="rift-laser"||enemy.type==="rift-triple"?dash>0:dash>0||(boosting&&Math.abs(vx)>470);
}
export function distanceToBeam(x,y,beam){
 const dx=beam.x2-beam.x1,dy=beam.y2-beam.y1;
 const t=Math.max(0,Math.min(1,((x-beam.x1)*dx+(y-beam.y1)*dy)/(dx*dx+dy*dy||1)));
 return Math.hypot(x-beam.x1-t*dx,y-beam.y1-t*dy);
}
export function advanceSovereign(b,s,dt,hooks){
 if(b.mode==="dormant"||b.defeated)return;
 b.clock+=dt;b.hitCooldown=Math.max(0,b.hitCooldown-dt);
 const rage=b.mode==="scarlet",chase=b.mode==="chase";
 const wounds=Math.max(0,b.maxHp-b.hp);
 const period=chase?4.6:rage?4.8:5.8;
 const cycle=Math.floor(b.clock/period),phase=b.clock%period;
 const opening=chase?2.1:rage?3.2:3.5;
 if(cycle!==b.cycle){
  b.cycle=cycle;b.attackSerial++;b.cycleDamaged=false;b.volleyFired=false;b.beamFired=false;
  b.x=chase?Math.min(CHASE.end-260,s.x+1300):
   SOVEREIGN_ARENA.left+800+(cycle%3)*920;
  b.y=s.gravity===1?(chase?hooks.surfaceAt(b.x)-80:SOVEREIGN_ARENA.floor-90):SOVEREIGN_ARENA.ceiling+90;
  b.target={x:s.x,y:s.y};b.warning="volley";hooks.warnAttack?.("volley");
  if(!chase&&cycle>0){b.warning="gravity";hooks.warnGravity(-s.gravity);}
 }
 if(phase>=1&&!b.volleyFired){
  b.volleyFired=true;
  b.shots.push(...shotFan(b.x,b.y,b.target,rage?5:3,rage?455:390).map(shot=>({...shot,sovereign:true})));
  if(!chase&&cycle>0)hooks.flipGravity(-s.gravity);
 }
 if(phase>=1.75&&!b.beamFired&&!chase){
  b.beamFired=true;hooks.warnAttack?.("laser");
  const x=b.x+(cycle%2?200:-200);
  b.beams.push({x1:x,y1:150,x2:x,y2:650,warning:.8,life:1.65,unblockable:true,sovereign:true,drainsAll:true});
  if(rage)b.beams.push({x1:x+(cycle%2?-390:390),y1:150,x2:x+(cycle%2?-390:390),y2:650,warning:1,life:1.8,unblockable:true,sovereign:true,drainsAll:true});
  if(b.minions.filter(m=>!m.dead).length<3){
   b.minions.push({id:b.attackSerial,x:SOVEREIGN_ARENA.left+650+(cycle%3)*1050,
    y:s.gravity===1?600:195,type:cycle%2?"rift-triple":"wraith",gravity:s.gravity,dead:false,timer:1.7});
  }
 }
 b.vulnerable=phase>=opening&&phase<period-.45&&b.hitCooldown===0&&!b.cycleDamaged;
 b.warning=phase<1?b.warning:phase>=opening?"core":null;
 if(b.vulnerable){
  // Vulnerability position is reachable from the currently walkable surface.
  b.y=s.gravity===1?(chase?hooks.surfaceAt(b.x)-80:560):240;
 }
 if(chase){
  b.barrierX+=CHASE.barrierSpeed*dt;
  if(b.barrierX>s.x-18){hooks.barrierHit();b.barrierX=s.x-550;}
 }
 if(rage){
  if(phase<opening-.8)b.volleyClock+=dt;b.orbClock+=dt;
  const volleyInterval=Math.max(.95,2.8-wounds*.35);
  if(b.volleyClock>=volleyInterval&&phase<opening-.8){b.volleyClock=0;b.shots.push(...shotFan(b.x,b.y,s,3,400).map(shot=>({...shot,sovereign:true})));}
  if(b.orbClock>=7.3&&!b.orbWarned){b.orbWarned=true;hooks.warnAttack?.("orb");}
  if(b.orbClock>=8){b.orbClock=0;b.orbWarned=false;const angle=Math.atan2(s.y-b.y,s.x-b.x);b.shots.push({x:b.x,y:b.y,vx:Math.cos(angle)*460,vy:Math.sin(angle)*460,life:5,r:17,sovereign:true,orb:true});}
  b.resonanceClock+=dt;
  if(!b.resonance&&b.resonanceClock>=4.5){
   const sites=[SOVEREIGN_ARENA.left+450,SOVEREIGN_ARENA.left+1850,SOVEREIGN_ARENA.right-450];
   // Choose a signalled site in the player's half of the arena, avoiding RNG.
   b.resonance={x:sites.reduce((a,x)=>Math.abs(x-s.x)<Math.abs(a-s.x)?x:a),
    y:s.gravity===1?608:192,warning:.8};b.resonanceClock=0;
  }
  if(b.resonance){
   b.resonance.warning=Math.max(0,b.resonance.warning-dt);
   b.resonance.y=s.gravity===1?608:192;
   if(b.resonance.warning===0&&Math.hypot(s.x-b.resonance.x,s.y-b.resonance.y)<55){
    s.scarlet=7.5;s.crystals+=8;s.dashReady=true;b.resonance=null;hooks.awaken();
   }
  }
 }
}

// Bounded turning lets the faster homing orb be dodged with a late directional change.
export function steerRiftOrb(orb,player,dt){
 const desired=Math.atan2(player.y-orb.y,player.x-orb.x),current=Math.atan2(orb.vy,orb.vx);
 const delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));
 const heading=current+Math.max(-3.1*dt,Math.min(3.1*dt,delta));
 orb.vx=Math.cos(heading)*460;orb.vy=Math.sin(heading)*460;
}

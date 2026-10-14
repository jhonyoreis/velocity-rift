import {circleRect} from './geometry.js';
export function createCaveHazards(world){return world.fallingCrystals.map(c=>({...c,state:'idle',timer:0,y:c.ceiling,vy:0}));}
export function advanceFallingCrystal(c,player,dt,{warning=()=>{},impact=()=>{},crush=()=>{}}={}){
 if(c.state==='idle'&&Math.abs(player.x-c.x)<=c.trigger){c.state='warning';c.timer=0;warning(c);}
 if(c.state==='warning'){c.timer+=dt;if(c.timer>=c.delay){c.state='falling';c.timer=0;}}
 if(c.state==='falling'){
  const oldY=c.y;c.vy+=2600*dt;c.y=Math.min(c.floor-c.height,c.y+c.vy*dt);
  // Swept contact prevents a fast shard tunnelling through Flux between frames.
  if(circleRect(player.x,player.y,18,{x:c.x-c.width*.35,y:oldY,w:c.width*.7,h:c.y-oldY+c.height}))crush(c);
  if(c.y+c.height>=c.floor){c.state='spent';c.timer=0;impact(c);}
 }else if(c.state==='spent')c.timer=Math.min(3,c.timer+dt);
 return c;
}
export function refractorState(r,time){
 const period=2.9,t=((time+r.phase)%period+period)%period;
 const warning=t>=1.42&&t<2.13,active=t>=2.13&&t<2.75;
 // Beam bends at the prism; its complete, fixed path is shown before firing.
 const points=[{x:r.x-130,y:r.floor-245},{x:r.x,y:r.floor-155},{x:r.x+130,y:r.floor-12}];
 return {warning,active,charge:warning?(t-1.42)/.71:active?1:0,points};
}
export function beamTouches(player,points,radius=23){
 return points.slice(1).some((b,i)=>{const a=points[i],dx=b.x-a.x,dy=b.y-a.y;const u=Math.max(0,Math.min(1,((player.x-a.x)*dx+(player.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(player.x-a.x-dx*u,player.y-a.y-dy*u)<radius;});
}
// A second visible reflected ray joins the Guardian's locked aim in the cave.
export function reflectedGuardianLine(line,left,right,floor){
 const x=Math.max(left+16,Math.min(right-16,line.x2+(line.x2<line.x1?210:-210)));
 return {x1:line.x2,y1:line.y2,x2:x,y2:line.y2>floor-40?floor-145:floor-12};
}


// An impact sprays four short-lived, visible fragments along the ground.
// They use the shared projectile collision rules: unlike a direct crush,
// splinters cost crystals and respect Flux's brief hit invulnerability.
export function crystalImpactShards(c){
 return [-1,1].flatMap(direction=>[0,1].map((height)=>({
  x:c.x+direction*19,y:c.floor-20,
  vx:direction*(300+height*85),vy:-85-height*95,
  r:6.5,life:.72,caveShard:true
 })));
}

// Use the same geometry for the Guardian's warning and damaging beams.
// The first ricochet preserves the familiar angle; the final-heart pattern
// adds two separate bounces with distinct heights, not duplicated rays.
export function guardianLaserSegments(line,left,right,floor,ricochets=1){
 const segments=[line];
 for(let i=0;i<ricochets;i++){
  const last=segments[segments.length-1];
  if(i===0){segments.push(reflectedGuardianLine(last,left,right,floor));continue;}
  const direction=Math.sign(last.x2-last.x1)||1;
  const x2=Math.max(left+18,Math.min(right-18,last.x2-direction*(175+i*20)));
  const y2=i%2===1?floor-195:floor-60;
  segments.push({x1:last.x2,y1:last.y2,x2,y2});
 }
 return segments;
}

// Cracked aqueduct stones warn after first contact, then recover so retries and
// backtracking cannot leave the route permanently impossible.
export function advanceCaveBridge(floor,standing,dt){
 if(floor.kind!=='cave-crumble')return;
 if(floor.broken){floor.rebuild=Math.max(0,(floor.rebuild||0)-dt);if(floor.rebuild===0){floor.broken=false;floor.crumbleTime=0;}return;}
 if(standing&&!floor.crumbleTime)floor.crumbleTime=.95;
 if(floor.crumbleTime>0){floor.crumbleTime=Math.max(0,floor.crumbleTime-dt);if(floor.crumbleTime===0){floor.broken=true;floor.rebuild=3.4;}}
}
export function resetCaveBridge(floor){if(floor.kind==='cave-crumble'){floor.broken=false;floor.crumbleTime=0;floor.rebuild=0;}}

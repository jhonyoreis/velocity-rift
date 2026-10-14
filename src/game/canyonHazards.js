import {circleRect} from './geometry.js';
export function createCaveHazards(world){return world.fallingCrystals.map(c=>({...c,state:'idle',timer:0,y:c.ceiling,vy:0}));}
export function advanceFallingCrystal(c,player,dt,{warning=()=>{},impact=()=>{},crush=()=>{}}={}){
 if(c.state==='idle'&&Math.abs(player.x-c.x)<=c.trigger){c.state='warning';c.timer=0;warning(c);}
 if(c.state==='warning'){c.timer+=dt;if(c.timer>=c.delay){c.state='falling';c.timer=0;}}
 if(c.state==='falling'){
  const oldY=c.y;c.vy+=1700*dt;c.y=Math.min(c.floor-c.height,c.y+c.vy*dt);
  // Swept contact prevents a fast shard tunnelling through Flux between frames.
  if(circleRect(player.x,player.y,18,{x:c.x-c.width*.35,y:oldY,w:c.width*.7,h:c.y-oldY+c.height}))crush(c);
  if(c.y+c.height>=c.floor){c.state='spent';c.timer=0;impact(c);}
 }else if(c.state==='spent')c.timer=Math.min(3,c.timer+dt);
 return c;
}
export function refractorState(r,time){
 const t=((time+r.phase)%4.4+4.4)%4.4;
 const warning=t>=2.7&&t<3.8,active=t>=3.8&&t<4.3;
 // Beam bends at the prism; its complete, fixed path is shown before firing.
 const points=[{x:r.x-130,y:r.floor-245},{x:r.x,y:r.floor-155},{x:r.x+130,y:r.floor-12}];
 return {warning,active,charge:warning?(t-2.7)/1.1:active?1:0,points};
}
export function beamTouches(player,points,radius=23){
 return points.slice(1).some((b,i)=>{const a=points[i],dx=b.x-a.x,dy=b.y-a.y;const u=Math.max(0,Math.min(1,((player.x-a.x)*dx+(player.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(player.x-a.x-dx*u,player.y-a.y-dy*u)<radius;});
}
// A second visible reflected ray joins the Guardian's locked aim in the cave.
export function reflectedGuardianLine(line,left,right,floor){
 const x=Math.max(left+16,Math.min(right-16,line.x2+(line.x2<line.x1?210:-210)));
 return {x1:line.x2,y1:line.y2,x2:x,y2:line.y2>floor-40?floor-145:floor-12};
}

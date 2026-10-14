// Combat patterns exclusive to the second half of Prism Canyon.
// All aimed shots are built here so the spread remains testable without a DOM.
export function canyonEnemyVolley(type,x,y,target){
 if(type!=='sentry'&&type!=='drone')return [];
 const dx=target.x-x,dy=target.y-y,angle=Math.atan2(dy,dx);
 const sentry=type==='sentry',speed=sentry?350:330;
 const offsets=sentry?[-.14,.14]:[0];
 return offsets.map(offset=>({
  x,y,vx:Math.cos(angle+offset)*speed,vy:Math.sin(angle+offset)*speed,
  r:sentry?8.5:7.5,life:sentry?3.1:2.8,caveShot:true,droneShot:!sentry
 }));
}
export function canyonEnemyCooldown(type){
 return type==='sentry'?1.95:type==='drone'?2.30:Infinity;
}

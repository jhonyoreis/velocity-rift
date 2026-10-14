// Shots unique to the weathered drones in Floresta Neon 2.
// A single aimed, readable bolt is enough to complement the presses.
export const FOREST_DRONE_RANGE=570;
export const FOREST_DRONE_COOLDOWN=2.25;
export const FOREST_DRONE_WARNING=.60;
export function forestDroneShot(x,y,target){
 const dx=target.x-x,dy=target.y-y;
 const magnitude=Math.hypot(dx,dy)||1;
 const speed=345;
 return {x,y,vx:dx/magnitude*speed,vy:dy/magnitude*speed,
  life:3.0,r:8,forestShot:true};
}

// Four escalating boss phases; warnings precede ground fissure hazards.
export function architectPhase(hp){
 switch(hp){
   case 4:return {projectiles:2,volleys:2,gap:.47,speed:455,telegraph:.95,exposed:3.1,recovery:1.05,rifts:0};
   case 3:return {projectiles:3,volleys:2,gap:.42,speed:485,telegraph:.85,exposed:2.9,recovery:1,rifts:0};
   case 2:return {projectiles:4,volleys:3,gap:.40,speed:515,telegraph:.82,exposed:2.75,recovery:.95,rifts:1};
   default:return {projectiles:5,volleys:3,gap:.36,speed:550,telegraph:.80,exposed:2.5,recovery:.9,rifts:2};
 }
}
export const ARCHITECT_RIFT_WARNING=.72;
export const ARCHITECT_RIFT_ACTIVE=1.05;
export function architectBarrageDuration(phase){return .06+(phase.volleys-1)*phase.gap+.55;}
export function spawnArchitectRifts({phase,playerX,facing,arenaLeft,arenaRight}){
 const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
 if(!phase.rifts)return [];
 const first=clamp(playerX+(facing<0?-100:100),arenaLeft+155,arenaRight-270);
 const second=clamp(first+(first>arenaRight-540?-250:250),arenaLeft+160,arenaRight-165);
 return Array.from({length:phase.rifts},(_,i)=>({x:i?second:first,width:90,age:0}));
}
export function architectRiftState(age){
 if(age<ARCHITECT_RIFT_WARNING)return "warning";
 if(age<ARCHITECT_RIFT_WARNING+ARCHITECT_RIFT_ACTIVE)return "active";
 return "expired";
}

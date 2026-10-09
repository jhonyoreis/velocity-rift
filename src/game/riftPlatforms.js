// Shared deterministic state for the obstacle-only rift gauntlet.
export function riftPlatformPhase(floor,time){
  if(floor.kind!=="rift-phase")return {solid:true,warning:false};
  const period=floor.period||3.25,solidFor=floor.solidFor||2.40;
  const phase=((time+(floor.phase||0))%period+period)%period;
  return {solid:phase<solidFor,warning:phase>=solidFor-.45&&phase<solidFor};
}
export function riftElevatorY(floor,time){
  return floor.originY+Math.sin(time*floor.speedY+floor.phaseY)*floor.swingY;
}

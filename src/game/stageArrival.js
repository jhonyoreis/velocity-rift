// Cinematic-only run-in: a four-second burst that never grants distance,
// pickups or boost energy in the actual playable level.
// A constant-speed section ends with a short, smooth braking segment.
export const STAGE_ARRIVAL_SECONDS=4;
export const STAGE_ARRIVAL_DISTANCE=1500;
export const STAGE_ARRIVAL_BRAKE=.5;

export function sampleStageArrival(elapsed,{
 duration=STAGE_ARRIVAL_SECONDS,
 distance=STAGE_ARRIVAL_DISTANCE,
 brake=STAGE_ARRIVAL_BRAKE
}={}){
 if(!Number.isFinite(duration)||duration<=0||
    !Number.isFinite(distance)||distance<0||
    !Number.isFinite(brake)||brake<=0||brake>=duration)
    throw new RangeError("Invalid arrival animation parameters");
 const t=Math.max(0,Math.min(duration,Number(elapsed)||0));
 const cruise=duration-brake;
 const travelTime=cruise+brake/2;
 const travel=t<=cruise?t:cruise+(t-cruise)-(t-cruise)**2/(2*brake);
 const progress=Math.max(0,Math.min(1,travel/travelTime));
 const speed=t>=duration?0:distance/travelTime*
   (t<cruise?1:(duration-t)/brake);
 return {progress,speed,finished:t>=duration};
}

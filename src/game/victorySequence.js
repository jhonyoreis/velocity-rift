export const ALICIA_RESCUE_X=46580;
export function createVictorySequence(s){
 return {elapsed:0,startX:s.x,startY:s.y,bossX:s.boss.x,bossY:s.boss.y,duration:3.2+Math.abs(ALICIA_RESCUE_X-s.x)/420+1};
}
export function sampleVictorySequence(v){
 const walking=Math.max(0,v.elapsed-3.2),distance=Math.abs(ALICIA_RESCUE_X-v.startX),direction=Math.sign(ALICIA_RESCUE_X-v.startX)||1;
 return {x:v.startX+direction*Math.min(distance,walking*420),y:Math.min(632,v.startY+925*Math.min(v.elapsed,2)**2),
  moving:walking>0&&walking*420<distance,facing:direction,bossOpacity:Math.max(0,1-v.elapsed/2.2),barrierOpacity:Math.max(0,1-Math.max(0,v.elapsed-1.8)/1.4),done:v.elapsed>=v.duration};
}

// Lightweight time-ordered path replay. Never used for collision/physics.
export const GHOST_SAMPLE_SECONDS=.12;
export const GHOST_MAX_FRAMES=2400; // max ~4m48s at 0.12s/sample
export function sanitizeGhost(candidate){
 if(!candidate||typeof candidate!=="object")return null;
 const duration=Number(candidate.duration);
 if(!Number.isFinite(duration)||duration<=0||duration>10000)return null;
 if(!Array.isArray(candidate.frames)||candidate.frames.length<2||
   candidate.frames.length>GHOST_MAX_FRAMES)return null;
 let previous=-1;
 const frames=[];
 for(const point of candidate.frames){
   if(!Array.isArray(point)||point.length<4)return null;
   const [t,x,y,f]=point.map(Number);
   if(![t,x,y,f].every(Number.isFinite)||t<=previous||t<0||
     t>duration+.4||Math.abs(x)>100000||Math.abs(y)>2000)return null;
   frames.push([t,x,y,f>=0?1:-1]);previous=t;
 }
 return {duration,frames};
}
export function ghostFrameAt(ghost,t){
 if(!ghost||!Number.isFinite(t)||!ghost.frames.length)return null;
 const frames=ghost.frames;
 if(t<=frames[0][0])return {x:frames[0][1],y:frames[0][2],facing:frames[0][3]};
 if(t>=frames.at(-1)[0])return {x:frames.at(-1)[1],y:frames.at(-1)[2],facing:frames.at(-1)[3]};
 let lo=0,hi=frames.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(frames[mid][0]<=t)lo=mid;else hi=mid}
 const left=frames[lo],right=frames[hi],alpha=(t-left[0])/(right[0]-left[0]);
 return {x:left[1]+alpha*(right[1]-left[1]),
   y:left[2]+alpha*(right[2]-left[2]),facing:alpha<.5?left[3]:right[3]};
}
// Frames remain bounded in size, but recording does not stop on long attempts.
// When capacity is reached, keep every second sample and double the effective
// sampling interval. Time stamps are absolute, so interpolation stays correct.
export function makeGhost(frames,duration){
 return sanitizeGhost({duration,frames});
}
export function recordGhostFrame(frames,time,actor,force=false){
 if(!Array.isArray(frames)||!Number.isFinite(time)||time<0||
   !Number.isFinite(actor?.x)||!Number.isFinite(actor?.y))return false;
 const point=[Number(time.toFixed(3)),Math.round(actor.x),
   Math.round(actor.y),actor.facing>=0?1:-1];
 const previous=frames.at(-1);
 if(previous&&point[0]<previous[0])return false;
 // The final portal position must be exact, even when time did not advance.
 if(previous&&point[0]===previous[0]){
   if(force){frames[frames.length-1]=point;return true;}
   return false;
 }
 const interval=frames.length>=2
   ?Math.max(GHOST_SAMPLE_SECONDS,frames[1][0]-frames[0][0])
   :GHOST_SAMPLE_SECONDS;
 if(previous&&!force&&time-previous[0]<interval-1e-8)return false;
 if(frames.length>=GHOST_MAX_FRAMES){
   const reduced=frames.filter((_,index)=>index%2===0);
   frames.splice(0,frames.length,...reduced);
 }
 frames.push(point);
 return true;
}

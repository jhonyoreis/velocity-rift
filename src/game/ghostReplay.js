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
export function makeGhost(frames,duration){
 return sanitizeGhost({duration,frames:frames.slice(0,GHOST_MAX_FRAMES)});
}
export function recordGhostFrame(frames,time,actor){
 if(frames.length>=GHOST_MAX_FRAMES)return false;
 if(frames.length&&time-frames.at(-1)[0]<GHOST_SAMPLE_SECONDS)return false;
 if(!Number.isFinite(time)||!Number.isFinite(actor?.x)||!Number.isFinite(actor?.y))return false;
 frames.push([Number(time.toFixed(3)),Math.round(actor.x),
   Math.round(actor.y),actor.facing>=0?1:-1]);
 return true;
}

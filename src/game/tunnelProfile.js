import {yOnTrack} from "./geometry.js";
export function tunnelFloorAt(tunnel,tracks,x){
 const candidates=tracks.filter(p=>!p.secretId&&!/secret|moving|platform/.test(p.kind||"")&&x>=p.x1&&x<=p.x2);
 candidates.sort((a,b)=>Math.abs(yOnTrack(a,x)-tunnel.ground)-Math.abs(yOnTrack(b,x)-tunnel.ground));
 return candidates.length?yOnTrack(candidates[0],x):tunnel.ground;
}
export function tunnelProfile(tunnel,tracks){
 const xs=new Set([tunnel.x,tunnel.x+tunnel.w]);
 for(const p of tracks)for(const x of [p.x1,p.x2])if(x>tunnel.x&&x<tunnel.x+tunnel.w)xs.add(x);
 return [...xs].sort((a,b)=>a-b).map(x=>({x,y:tunnelFloorAt(tunnel,tracks,x)}));
}
export function polishWorldObstacles(world){
 for(const wall of world.walls)if(wall.kind==="break-gate"){const bottom=wall.y+wall.h;wall.h=Math.max(190,wall.h);wall.y=bottom-wall.h;}
 for(const tunnel of world.tunnels)for(const ring of world.rings){
  if(ring.x<tunnel.x||ring.x>tunnel.x+tunnel.w)continue;
  const floor=tunnelFloorAt(tunnel,world.tracks,ring.x);
  if(Math.abs(ring.y-floor)<60)ring.y=floor-14;
 }
}

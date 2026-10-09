import {SECRET_DEFS} from "../data/secretRoutes.js";
export function installSecretRoutes(world,stage,{track,PLAYER_RADIUS}){
  world.secretTrials=SECRET_DEFS[stage].map(def=>{
    const platforms=def.steps.map(([dx,rise,width,behavior],step)=>{
      const x=def.x+dx,y=def.y-rise;
      const kind="secret-"+behavior;
      const floor=track(x-width/2,y,x+width/2,y,kind);
      floor.secretId=def.id;floor.step=step;
      floor.behavior=behavior;
      floor.broken=false;floor.crumbleTime=0;
      if(behavior==="moving"){
        floor.originX=floor.x1;floor.originX2=floor.x2;
        floor.swing=step%2?33:26;
        floor.speed=step%2?1.3:1.05;
        floor.phase=stage+step*.7;
      }
      if(behavior==="phase")floor.phase=step*.9;
      if(behavior==="belt-right"||behavior==="belt-left")
        floor.belt=behavior==="belt-right"?225:-190;
      world.tracks.push(floor);
      return {x,y,step,behavior,width};
    });
    const sentinels=def.hazards.map(([type,at,dx,dy,range],i)=>({
      type,step:at,baseX:platforms[at].x+dx,
      baseY:platforms[at].y+dy,patrol:range,
      phase:i*.94+stage*.38,
      x:platforms[at].x+dx,y:platforms[at].y+dy
    }));
    const xs=platforms.map(p=>p.x);
    return {id:def.id,name:def.name,hint:def.hint,
      startX:platforms[0].x,startY:platforms[0].y-PLAYER_RADIUS,
      targetX:platforms[platforms.length-1].x,
      targetY:platforms[platforms.length-1].y-PLAYER_RADIUS,
      limit:def.limit,platforms,sentinels,
      leftBound:Math.min(...xs)-205,rightBound:Math.max(...xs)+205,
      cameraX:(Math.min(...xs)+Math.max(...xs))/2,
      shots:[],shotTimer:1.5,active:false,completed:false,elapsed:0,
      armed:true,failed:false};
  });
}

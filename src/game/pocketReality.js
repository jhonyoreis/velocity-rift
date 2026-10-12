import {FLUX_MOTION as M} from "./fluxMotion.js";
export const EXILE_SECONDS=5;
export function createPocketReality(kind,{trial=null,returnPose,rubro=false}={}){
 const index=trial?.core||0;
 const routes=[
  [[0,240,430],[395,590,390],[770,950,340],[1140,1360,425],[1540,1710,365],[1930,2150,415],[2330,2550,350]],
  [[0,240,430],[415,605,355],[795,1005,415],[1195,1380,345],[1580,1770,400],[1970,2160,335],[2360,2590,390]],
  [[0,240,430],[450,640,400],[845,1020,335],[1240,1450,400],[1660,1840,350],[2050,2240,425],[2460,2700,370]]
 ];
 const platforms=kind==="exile"?[{x1:0,x2:960,y:430}]:routes[index].map(([x1,x2,y])=>({x1,x2,y}));
 const enemies=kind==="trial"?platforms.slice(1,-1).filter((_,i)=>i%2===index%2).map((f,i)=>({x:(f.x1+f.x2)/2,y:f.y-145,baseX:(f.x1+f.x2)/2,baseY:f.y-145,phase:i*1.8,timer:1.3+i*.7,warning:0})):[];
 return {kind,trial,returnPose,rubro,x:80,y:412,vx:0,vy:0,facing:1,grounded:true,dashReady:true,dash:0,jumpHeld:false,elapsed:0,limit:kind==="exile"?EXILE_SECONDS:trial.limit,width:platforms.at(-1).x2+20,platforms,enemies,shots:[],lasers:[],serial:-1,invincible:.5,boost:100,index};
}
export function updatePocketReality(p,dt,keys){
 p.elapsed+=dt;p.invincible=Math.max(0,p.invincible-dt);
 const left=keys.has("arrowleft")||keys.has("a"),right=keys.has("arrowright")||keys.has("d"),jump=keys.has(" ")||keys.has("arrowup")||keys.has("w"),pressed=jump&&!p.jumpHeld;p.jumpHeld=jump;
 if(left!==right)p.facing=left?-1:1;
 if(pressed){if(p.grounded){p.vy=-M.jumpSpeed;p.grounded=false;}else if(p.dashReady){p.dash=M.dashSeconds;p.dashReady=false;p.vy=0;}}
 p.boosting=(keys.has("shift")||keys.has("j"))&&p.boost>0;
 if(p.dash>0){p.vx=p.facing*M.dashSpeed;p.vy=0;p.dash=Math.max(0,p.dash-dt);}else{
  if(left!==right)p.vx+=p.facing*(p.grounded?M.groundAcceleration:M.airAcceleration)*dt;
  else if(p.grounded)p.vx=Math.sign(p.vx)*Math.max(0,Math.abs(p.vx)-M.groundFriction*dt);
  if(p.boosting){p.vx+=p.facing*M.boostAcceleration*dt;p.boost=Math.max(0,p.boost-M.boostDrain*dt);}
  p.vx=Math.max(-(p.boosting?M.boostSpeed:M.normalSpeed),Math.min(p.boosting?M.boostSpeed:M.normalSpeed,p.vx));
  if(!jump&&p.vy<-160)p.vy+=M.jumpCut*dt;p.vy+=M.gravity*dt;
 }
 const oldY=p.y;p.x=Math.max(18,Math.min(p.width-18,p.x+p.vx*dt));p.y+=p.vy*dt;p.grounded=false;
 for(const floor of p.platforms)if(p.x+18>floor.x1&&p.x-18<floor.x2&&oldY+18<=floor.y+6&&p.y+18>=floor.y&&p.vy>=0){p.y=floor.y-18;p.vy=0;p.grounded=true;p.dashReady=true;break;}
 const serial=Math.floor(p.elapsed/(p.kind==="exile"?.7:1.05));
 if(serial!==p.serial){p.serial=serial;
  if(p.kind==="exile"){
   p.lasers.push({x:Math.max(70,Math.min(890,p.x)),warning:.65,life:.92,y1:90,y2:430});
   p.lasers.push({x:120+(serial*173)%720,warning:.75,life:1.02,y1:90,y2:430});
  }else{
   // Pairs sweep the upcoming gap; their warning remains visible before they fire.
   const f=p.platforms[1+serial%(p.platforms.length-1)];
   p.lasers.push({x:f.x1-65,warning:.8,life:1.12,y1:95,y2:520});
   p.lasers.push({x:f.x2+55,warning:.95,life:1.25,y1:95,y2:520});
  }
 }
 for(const e of p.enemies){e.x=e.baseX+Math.sin(p.elapsed*1.8+e.phase)*35;e.y=e.baseY+Math.sin(p.elapsed*2.3+e.phase)*16;
  if(Math.abs(p.x-e.x)<570){e.timer-=dt;e.warning=e.timer<.65?1-e.timer/.65:0;if(e.timer<=0){const a=Math.atan2(p.y-e.y,p.x-e.x);p.shots.push({x:e.x,y:e.y,vx:Math.cos(a)*245,vy:Math.sin(a)*245,life:2.6});e.timer=2.3;}}}
 for(const shot of p.shots){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;}p.shots=p.shots.filter(shot=>shot.life>0);
 for(const beam of p.lasers){beam.warning=Math.max(0,beam.warning-dt);beam.life-=dt;}p.lasers=p.lasers.filter(b=>b.life>0);
 const hit=p.invincible===0&&(p.lasers.some(b=>b.warning===0&&Math.abs(p.x-b.x)<25&&p.y>b.y1-18&&p.y<b.y2+18)||p.enemies.some(e=>Math.hypot(p.x-e.x,p.y-e.y)<36)||p.shots.some(shot=>Math.hypot(p.x-shot.x,p.y-shot.y)<24));
 if(p.kind==="trial"&&(hit||p.y>580||p.elapsed>=p.limit))return {done:true,won:false};
 if(p.kind==="trial"&&p.x>p.platforms.at(-1).x1+100&&p.grounded)return {done:true,won:true};
 if(p.kind==="exile"&&p.y>580){p.x=480;p.y=380;p.vy=0;p.invincible=.6;return {hit:true};}
 if(p.kind==="exile"&&p.elapsed>=EXILE_SECONDS)return {done:true,won:true};
 if(hit){p.invincible=1.1;return {hit:true};}return {};
}

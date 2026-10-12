import {FLUX_MOTION as M} from "./fluxMotion.js";
export const EXILE_SECONDS=5;
export function createPocketReality(kind,{trial=null,returnPose,rubro=false}={}){
 const index=trial?.core||0;
 const platforms=kind==="exile"?[{x1:0,x2:960,y:445}]:Array.from({length:7},(_,i)=>({x1:i*280,x2:i*280+225,y:445-(i%3)*45}));
 return {kind,trial,returnPose,rubro,x:80,y:427,vx:0,vy:0,facing:1,grounded:true,dashReady:true,dash:0,jumpHeld:false,elapsed:0,limit:kind==="exile"?EXILE_SECONDS:trial.limit,width:kind==="exile"?960:1930,platforms,lasers:[],serial:-1,invincible:.5,boost:100,index};
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
 const serial=Math.floor(p.elapsed/(p.kind==="exile"?.7:1.5));
 if(serial!==p.serial){p.serial=serial;const x=p.kind==="exile"?Math.max(70,Math.min(890,p.x)):520+serial%4*280;
  p.lasers.push({x,warning:.65,life:.92});if(p.kind==="exile")p.lasers.push({x:120+(serial*173)%720,warning:.75,life:1.02});}
 for(const beam of p.lasers){beam.warning=Math.max(0,beam.warning-dt);beam.life-=dt;}p.lasers=p.lasers.filter(b=>b.life>0);
 const hit=p.invincible===0&&p.lasers.some(b=>b.warning===0&&Math.abs(p.x-b.x)<25&&p.y>90&&p.y<445);
 if(p.kind==="trial"&&(hit||p.y>580||p.elapsed>=p.limit))return {done:true,won:false};
 if(p.kind==="trial"&&p.x>1835&&p.grounded)return {done:true,won:true};
 if(p.kind==="exile"&&p.y>580){p.x=480;p.y=390;p.vy=0;p.invincible=.6;return {hit:true};}
 if(p.kind==="exile"&&p.elapsed>=EXILE_SECONDS)return {done:true,won:true};
 if(hit){p.invincible=1.1;return {hit:true};}return {};
}

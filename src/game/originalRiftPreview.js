// Velocity Rift 3.8: self-contained playable preview of the Original Rift.
// Progress remains experimental: it never writes campaign saves or records.
export const RIFT_PREVIEW_WIDTH=10000;
export const RIFT_CORE_REQUIREMENT=9;
const RADIUS=18;
const GROUND=0,ECHO=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function countRiftKeys(campaign,fullTest=false){
 if(fullTest)return RIFT_CORE_REQUIREMENT;
 return [1,2,3].reduce((sum,stage)=>{
  const ids=campaign?.extras?.cores?.["stage"+stage];
  return sum+(Array.isArray(ids)?new Set(ids.filter(id=>Number.isInteger(id)&&id>=0&&id<=2)).size:0);
 },0);
}
export function previewPlatforms(){
 return [
  [0,660,440,440,-1],[660,1240,440,650,-1],
  [1200,1600,650,650,-1],
  [2750,3470,164,164,-1,"ceiling"],
  [3270,3580,555,555,-1],
  [4300,5000,465,465,-1],
  [4990,5540,460,500,ECHO],
  [5470,5960,495,460,ECHO],
  [5740,6510,430,632,-1],
  [6510,7300,632,495,-1],
  [7290,7920,495,635,-1],
  [7770,8240,555,555,-1],
  [8210,8850,510,510,-1],
  [8800,9660,460,460,-1],
  [3670,4060,390,390,-1],
  [3910,4340,450,450,-1],
  [1600,1990,582,582,-1],
  [2030,2420,545,545,-1]
 ].map(([x1,x2,y1,y2,dimension,orientation="floor"])=>({x1,x2,y1,y2,dimension,orientation}));
}
export function riftGateOpen(keys){return keys>=RIFT_CORE_REQUIREMENT;}
export function portalDestination(id){
 const map={a:{x:2825,y:201,gravity:-1,dimension:GROUND},
  b:{x:4480,y:430,gravity:1,dimension:GROUND},
  c:{x:7900,y:520,gravity:1,dimension:ECHO}};
 return map[id]||null;
}
export function createOriginalRiftPreview({onExit=()=>{}}={}){
 const platforms=previewPlatforms();
 const portals=[
  {id:"a",x:1450,y:603,rx:84,ry:115},
  {id:"b",x:3370,y:204,rx:78,ry:112},
  {id:"c",x:5910,y:430,rx:86,ry:112}
 ];
 const enemies=[
  {x:960,y:486,type:"shard",range:72,dimension:-1},
  {x:3750,y:345,type:"sentinel",range:90,dimension:-1},
  {x:5180,y:412,type:"wraith",range:80,dimension:ECHO},
  {x:6400,y:532,type:"shard",range:65,dimension:-1},
  {x:7110,y:485,type:"sentinel",range:130,dimension:-1},
  {x:8460,y:448,type:"wraith",range:100,dimension:-1},
  {x:9090,y:408,type:"sentinel",range:75,dimension:-1}
 ];
 const barricades=[{x:6240,y:420,w:44,h:245},{x:6930,y:450,w:44,h:225},
  {x:7440,y:430,w:44,h:215}];
 const checkpoints=[4300,5900,8100];
 let s={};
 function reset(coreCount=0,bypass=false){
  s={active:true,cores:clamp(coreCount,0,9),bypass,gateOpened:riftGateOpen(coreCount)||bypass,
   x:180,y:422,vx:0,vy:0,gravity:1,dimension:GROUND,
   grounded:false,jumpHeld:false,dashReady:true,dash:0,dashUsed:false,
   boosting:false,sliding:false,crystals:0,boost:95,health:3,
   time:0,cameraX:0,cameraY:0,portalCooldown:0,phaseCooldown:0,
   checkpointX:180,checkpointY:422,checkpointGravity:1,
   message:"ALTAR DOS NOVE NÚCLEOS",messageTime:3.5,
   defeated:new Set(),broken:new Set(),collected:new Set(),seen:new Set(),
   finished:false,finishedTime:0,apparitionTime:0};
  return s;
 }
 function stop(){s.active=false;}
 function announce(text,duration=2.2){s.message=text;s.messageTime=duration;}
 function teleport(p){
  const target=portalDestination(p.id);
  if(!target)return;
  s.x=target.x;s.y=target.y;
  s.vx=Math.max(330,Math.abs(s.vx))*(s.vx<0?-1:1);
  s.vy=0;s.grounded=false;s.gravity=target.gravity;
  s.dimension=target.dimension;
  s.portalCooldown=1.3;s.dashReady=true;
  announce(p.id==="a"?"GRAVIDADE INVERTIDA":p.id==="b"?"CHÃO RESTAURADO":"OUTRO LADO DA FENDA",3);
 }
 function damage(){
  if(s.invincible>0)return;
  s.crystals=Math.max(0,s.crystals-12);
  s.health--;
  s.invincible=1.2;s.vx=-180;s.vy=-320*s.gravity;
  if(s.health<=0||s.y>830||s.y<-220)respawn();
 }
 function respawn(){
  s.x=s.checkpointX;s.y=s.checkpointY;s.gravity=s.checkpointGravity;
  s.dimension=s.x>=5040?ECHO:GROUND;
  s.vx=0;s.vy=0;s.health=3;s.boost=95;s.invincible=2;
  s.dash=0;s.dashReady=true;s.grounded=false;
  announce("CHECKPOINT · FENDA RESTAURADA");
 }
 function surfaceAt(x,orientation){
  return platforms.filter(p=>(p.dimension===-1||p.dimension===s.dimension)&&p.orientation===orientation&&
   x+RADIUS>p.x1&&x-RADIUS<p.x2).map(p=>{
    const t=clamp((x-p.x1)/(p.x2-p.x1),0,1);
    return {...p,y:p.y1+(p.y2-p.y1)*t};
   });
 }
 reset();
 function update(dt,keys){
  if(!s.active)return;
  s.time+=dt;s.messageTime=Math.max(0,s.messageTime-dt);
  s.portalCooldown=Math.max(0,s.portalCooldown-dt);
  s.phaseCooldown=Math.max(0,s.phaseCooldown-dt);
  s.invincible=Math.max(0,(s.invincible||0)-dt);
  s.apparitionTime=Math.max(0,s.apparitionTime-dt);
  if(s.finished){s.finishedTime+=dt;return;}
  const left=keys.has("arrowleft")||keys.has("a"),right=keys.has("arrowright")||keys.has("d");
  const jump=keys.has(" ")||keys.has("arrowup")||keys.has("w")||keys.has("k");
  const slide=keys.has("arrowdown")||keys.has("s");
  const boosting=(keys.has("shift")||keys.has("j"))&&s.boost>0&&Math.abs(s.vx)>50;
  const press=jump&&!s.jumpHeld;s.jumpHeld=jump;
  if(s.x<105&&s.vx<0){s.active=false;onExit();return;}
  if(!s.gateOpened&&s.x>425){s.x=425;s.vx=Math.min(0,s.vx);}
  const accel=s.grounded?(slide?400:1450):800;
  if(left)s.vx-=accel*dt;
  if(right)s.vx+=accel*dt;
  if(!left&&!right&&s.grounded)s.vx*=Math.exp(-(slide?.75:7)*dt);
  s.boosting=boosting;s.sliding=slide&&s.grounded;
  if(boosting){
   s.vx+=Math.sign(s.vx)*950*dt;
   s.boost=Math.max(0,s.boost-25*dt);
  }
  if(press){
   if(s.grounded){s.vy=-690*s.gravity;s.grounded=false;s.dashReady=true;}
   else if(s.dashReady){s.dash=.21;s.dashReady=false;s.dashUsed=true;
    s.vy=0;s.vx=(right?1:left?-1:Math.sign(s.vx)||1)*1080;}
  }
  const under=s.grounded&&surfaceAt(s.x,s.gravity===1?"floor":"ceiling").find(p=>Math.abs(s.y+s.gravity*RADIUS-p.y)<35);
  if(slide&&under){
   const downhill=(under.y2-under.y1)*Math.sign(s.vx)*s.gravity>0;
   if(downhill)s.vx=Math.sign(s.vx||1)*Math.min(1030,Math.abs(s.vx)*Math.exp(1.5*dt));
  }
  s.vx=clamp(s.vx,-(s.sliding?1030:boosting?810:630),s.sliding?1030:boosting?810:630);
  s.dash=Math.max(0,s.dash-dt);
  if(!s.dash){
   s.vy=clamp(s.vy+2100*s.gravity*dt,-1300,1300);
   if(!jump&&s.vy*s.gravity<0)s.vy+=750*s.gravity*dt;
  }
  const prevY=s.y;s.x=clamp(s.x+s.vx*dt,RADIUS,RIFT_PREVIEW_WIDTH-RADIUS);
  s.y+=s.vy*dt;
  // Resolve a directional landing on floor or ceiling, keeping the same controls.
  const orientation=s.gravity===1?"floor":"ceiling";
  const surfaces=surfaceAt(s.x,orientation);
  s.grounded=false;
  const prevEdge=prevY+s.gravity*RADIUS,edge=s.y+s.gravity*RADIUS;
  const candidates=surfaces.filter(p=>s.gravity===1
    ?(prevEdge<=p.y+14&&edge>=p.y-10&&s.vy>=-100)
    :(prevEdge>=p.y-14&&edge<=p.y+10&&s.vy<=100));
  const landing=candidates.sort((a,b)=>Math.abs(edge-a.y)-Math.abs(edge-b.y))[0];
  if(landing){
   s.y=landing.y-s.gravity*RADIUS;s.vy=0;s.grounded=true;s.dashReady=true;
   // Following inclined geometry preserves the original slope momentum.
   const slope=(landing.y2-landing.y1)/(landing.x2-landing.x1);
   if(Math.abs(slope)>0.01)s.vx+=s.gravity*slope*220*dt;
  }
  if(s.y>790||s.y<-165){respawn();return;}
  // Three checkpoints and a single deliberate dimension switch.
  if(s.x>=5050&&s.x<5540&&!s.seen.has("phase")&&s.portalCooldown===0){
   s.seen.add("phase");s.dimension=ECHO;s.phaseCooldown=1.5;
   announce("DIMENSÃO ECO · PLATAFORMAS ALTERNATIVAS",3);
  }
  for(const x of checkpoints)if(s.x>x&&!s.seen.has("checkpoint"+x)){
   s.seen.add("checkpoint"+x);s.checkpointX=x+35;
   s.checkpointGravity=s.gravity;
   const surface=surfaceAt(s.checkpointX,s.gravity===1?"floor":"ceiling")[0];
   s.checkpointY=surface?surface.y-s.gravity*RADIUS:s.y;
   announce("CHECKPOINT DIMENSIONAL");s.boost=Math.min(100,s.boost+28);
  }
  if(s.x>7350&&!s.seen.has("sovereign")){
   s.seen.add("sovereign");s.apparitionTime=4.6;
   announce("O SOBERANO ESTÁ PRÓXIMO",3);
  }
  for(const p of portals){
   if(s.portalCooldown<=0&&Math.abs(s.x-p.x)<p.rx*.65&&Math.abs(s.y-p.y)<p.ry*.75){
    teleport(p);break;
   }
  }
  for(let i=0;i<barricades.length;i++){
   const b=barricades[i];
   if(s.broken.has(i)||s.x+RADIUS<b.x||s.x-RADIUS>b.x+b.w||
      s.y+RADIUS<b.y||s.y-RADIUS>b.y+b.h)continue;
   if((boosting&&Math.abs(s.vx)>470)||s.dash>0){s.broken.add(i);s.boost=Math.min(100,s.boost+10);}
   else{s.x=s.vx>0?b.x-RADIUS:b.x+b.w+RADIUS;s.vx=0;}
  }
  enemies.forEach((e,i)=>{
   if(s.defeated.has(i)||(e.dimension!==-1&&e.dimension!==s.dimension))return;
   const y=e.y+Math.sin(s.time*(e.type==="wraith"?2.7:1.8)+i)*18;
   const x=e.x+Math.sin(s.time*1.9+i)*e.range;
   if(Math.hypot(s.x-x,s.y-y)<RADIUS+23){
    if((boosting&&Math.abs(s.vx)>480)||s.dash>0){
      s.defeated.add(i);s.crystals+=2;s.boost=Math.min(100,s.boost+5);
    }else damage();
   }
  });
  for(let x=700;x<9650;x+=300){
   if(Math.abs(s.x-x)<24&&Math.abs(s.y-(x<1600?430:x<3500?195:
      x<5700?410:x<8200?455:420))<110&&!s.collected.has(x)){
    s.collected.add(x);s.crystals++;s.boost=Math.min(100,s.boost+3);
   }
  }
  if(s.x>9500){s.finished=true;announce("FIM DA PRÉVIA · VERSÃO 3.8",7);}
  const targetX=clamp(s.x-960*.38,0,RIFT_PREVIEW_WIDTH-960);
  const targetY=clamp(s.y-540*.55,0,820-540);
  s.cameraX+=(targetX-s.cameraX)*Math.min(1,7*dt);
  s.cameraY+=(targetY-s.cameraY)*Math.min(1,6*dt);
 }
 function draw(ctx,W=960,H=540){
  if(!s.active)return;
  const cx=s.cameraX,cy=s.cameraY,t=s.time;
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,s.dimension===ECHO?"#2a0c43":"#080e31");
  g.addColorStop(.6,s.dimension===ECHO?"#431f66":"#18244d");
  g.addColorStop(1,"#090e24");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(-cx,-cy);
  for(let i=0;i<65;i++){
   const x=i*173+Math.sin(i*71)*45;
   if(x<cx-150||x>cx+W+150)continue;
   const y=100+(i*113)%560;
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.18+i)*.16);
   ctx.fillStyle=i%2?"#393066":"#183d55";ctx.globalAlpha=.35;
   ctx.fillRect(-34,-17,60+(i%4)*24,28+(i%3)*25);ctx.restore();
  }
  for(const p of platforms){
   if(p.x2<cx-80||p.x1>cx+W+80)continue;
   ctx.save();
   const visible=p.dimension===-1||p.dimension===s.dimension;
   ctx.globalAlpha=visible?1:.12;
   ctx.strokeStyle=p.orientation==="ceiling"?"#e7a8ff":s.dimension===ECHO?"#ec8cf8":"#78f8ec";
   ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(p.x1,p.y1);ctx.lineTo(p.x2,p.y2);ctx.stroke();
   ctx.strokeStyle="#171f45";ctx.lineWidth=8;ctx.stroke();
   ctx.restore();
  }
  // The entrance gate is visible even before the nine cores are recovered.
  ctx.save();ctx.translate(490,335);ctx.globalAlpha=s.gateOpened?.32:1;
  ctx.fillStyle="#201744";ctx.fillRect(-29,-130,58,238);
  ctx.strokeStyle="#ae83ff";ctx.lineWidth=5;ctx.strokeRect(-29,-130,58,238);
  for(let i=0;i<9;i++){
   const a=i*Math.PI*2/9;
   ctx.fillStyle=i<s.cores?"#8affdf":"#524268";
   ctx.beginPath();ctx.arc(Math.cos(a)*42,Math.sin(a)*39-30,5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  if(!s.gateOpened){
    ctx.font="bold 17px system-ui";ctx.textAlign="center";ctx.fillStyle="#f1e0ff";
    ctx.fillText("ALTAR "+s.cores+"/9",490,179);
    ctx.font="13px system-ui";ctx.fillText("VOLTE PELO PORTAL À ESQUERDA",300,505);
  }
  for(const p of portals){
   if(Math.abs(p.x-cx)>W+130)continue;
   ctx.save();ctx.translate(p.x,p.y);
   ctx.strokeStyle=p.id==="a"?"#f4adff":"#82ffee";ctx.lineWidth=9;
   ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=28;
   ctx.beginPath();ctx.ellipse(0,0,37+Math.sin(t*4)*4,68,0,0,Math.PI*2);ctx.stroke();
   ctx.shadowBlur=0;ctx.globalAlpha=.32;ctx.fillStyle="#6f3daa";
   ctx.beginPath();ctx.ellipse(0,0,33,62,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  for(let i=0;i<barricades.length;i++){
   if(s.broken.has(i))continue;
   const b=barricades[i];ctx.fillStyle="#ec83b4";ctx.globalAlpha=.9;
   ctx.fillRect(b.x,b.y,b.w,b.h);ctx.globalAlpha=1;
   ctx.strokeStyle="#fff2ce";ctx.lineWidth=3;ctx.strokeRect(b.x,b.y,b.w,b.h);
  }
  enemies.forEach((e,i)=>{
   if(s.defeated.has(i)||(e.dimension!==-1&&e.dimension!==s.dimension))return;
   const x=e.x+Math.sin(t*1.9+i)*e.range,y=e.y+Math.sin(t*(e.type==="wraith"?2.7:1.8)+i)*18;
   ctx.save();ctx.translate(x,y);ctx.rotate(t*(e.type==="shard"?2:-.6));
   ctx.fillStyle=e.type==="wraith"?"#bd84ff":e.type==="shard"?"#ff9ebd":"#f4b46f";
   ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(22,0);ctx.lineTo(0,25);ctx.lineTo(-22,0);ctx.closePath();ctx.fill();
   ctx.fillStyle="#160e32";ctx.fillRect(-8,-4,16,8);ctx.restore();
  });
  if(s.apparitionTime>0){
   const alpha=clamp(s.apparitionTime/1.3,0,1)*.75;
   ctx.save();ctx.globalAlpha=alpha;ctx.translate(s.x+410,205+Math.sin(t)*12);
   ctx.fillStyle="#210d38";ctx.shadowColor="#d76fff";ctx.shadowBlur=44;
   ctx.beginPath();ctx.moveTo(0,-135);ctx.lineTo(65,-45);ctx.lineTo(32,42);
   ctx.lineTo(-32,42);ctx.lineTo(-65,-45);ctx.closePath();ctx.fill();
   ctx.fillStyle="#ed93ff";ctx.fillRect(-10,-72,20,10);ctx.restore();
  }
  // Flux's original colors are preserved; gravity affects orientation.
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.gravity===-1?Math.PI:0);
  if(!s.invincible||Math.floor(t*16)%2===0){
   ctx.fillStyle=s.boosting?"#b7fffa":"#dcf9ff";
   ctx.beginPath();ctx.arc(0,-3,17,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#78e9ee";ctx.fillRect(s.vx>=0?2:-14,-9,12,9);
   ctx.fillStyle="#ffae59";ctx.fillRect(-22,0,11,6);
   ctx.fillStyle="#24415a";ctx.fillRect(-11,11,22,7);
   if(s.boosting||s.dash>0){
    ctx.strokeStyle="#8afaff";ctx.lineWidth=4;ctx.beginPath();
    ctx.moveTo(-24*Math.sign(s.vx||1),-4);ctx.lineTo(-55*Math.sign(s.vx||1),-4);ctx.stroke();
   }
  }ctx.restore();ctx.restore();
  ctx.fillStyle="rgba(6,15,34,.85)";ctx.fillRect(16,12,415,69);
  ctx.font="bold 14px system-ui";ctx.fillStyle="#bafced";
  ctx.fillText("FENDA ORIGINAL · PRÉVIA 3.8",29,35);
  ctx.font="12px system-ui";ctx.fillStyle="#e2e4ff";
  ctx.fillText("NÚCLEOS "+s.cores+"/9  ·  VIDA "+s.health+
   "  ·  CRISTAIS "+s.crystals+"  ·  "+Math.round(Math.abs(s.vx))+" u/s",29,57);
  ctx.fillStyle="rgba(5,12,31,.7)";ctx.fillRect(29,68,170,6);
  ctx.fillStyle="#93ffee";ctx.fillRect(29,68,170*s.boost/100,6);
  if(s.messageTime>0){
   ctx.fillStyle="rgba(8,9,27,.84)";ctx.fillRect(270,96,430,41);
   ctx.textAlign="center";ctx.fillStyle="#f1d5ff";ctx.font="bold 16px system-ui";
   ctx.fillText(s.message,485,122,400);ctx.textAlign="left";
  }
  ctx.fillStyle="#e9c6ff";ctx.font="12px system-ui";
  if(s.x<580)ctx.fillText("PORTAL DE RETORNO  ◀",30,H-25);
  if(s.finished){
   ctx.fillStyle="rgba(7,9,27,.91)";ctx.fillRect(135,155,690,205);
   ctx.textAlign="center";ctx.fillStyle="#b8ffe9";ctx.font="bold 29px system-ui";
   ctx.fillText("PRÉVIA CONCLUÍDA",480,216);
   ctx.font="17px system-ui";ctx.fillStyle="#f4d9ff";
   ctx.fillText("A Fenda Original continuará na próxima atualização.",480,267);
   ctx.fillText("Use PAUSA → MENU PRINCIPAL para sair.",480,301);
   ctx.textAlign="left";
  }
 }
 function info(){return {...s,defeated:s.defeated.size,broken:s.broken.size,seen:[...s.seen]};}
 return {start:reset,stop,update,draw,info,get active(){return s.active;},get musicSection(){
  return s.apparitionTime>0?2:s.x>=6000?1:0;
 }};
}

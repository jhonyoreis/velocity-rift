import {drawMemoryCore} from "./collectibles.js";

// One composition per dialogue beat. Bounded, deterministic, render-only geometry:
// advancing, revisiting or cancelling a scene never changes campaign state.
export const FINALE_SHOTS=Object.freeze([
 "arrival","altar","descent","chase","prison","throne","form","defeat",
 "awaken","resolve","rescue","city","canyon","forest","home","flower","promise"
]);
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const mix=(a,b,p)=>a+(b-a)*p;
const TAU=Math.PI*2;

export function finaleBeat(art,progress){
 const p=clamp(Number.isFinite(progress)?progress:0),q=ease(p);
 return {p,q,cores:Math.min(9,Math.floor(p*12)+1),burst:ease((p-.68)/.22),
  // Tension comes from scale, without rapid flashes or full camera spins.
  tilt:art==="throne"?Math.sin(q*Math.PI)*.055:0,
  zoom:art==="arrival"?mix(.86,1,q):art==="defeat"?mix(1,1.12,q):
   art==="promise"?mix(1,.89,q):1,
  fade:(1-ease(p/.075))*.82+(art==="promise"?ease((p-.88)/.12):0)};
}

export function drawFinaleFrame(ctx,art,t,progress,a){
 const b=finaleBeat(art,progress),{p,q}=b;
 // t is shot-local: manual advance cannot skip a fall or core reveal.
 const clock=Number.isFinite(t)?t:0;
 const poly=(points,fill,stroke=null,width=2)=>{
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
 };
 const line=(points,color,width=2)=>{
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
 };
 const ellipse=(x,y,rx,ry,color)=>{
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();
 };
 const glow=(x,y,r,color)=>{
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color);g.addColorStop(1,"transparent");
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
 };
 const sky=(top="#04091d",bottom="#36244c")=>{
  const g=ctx.createLinearGradient(0,0,0,540);g.addColorStop(0,top);g.addColorStop(1,bottom);
  ctx.fillStyle=g;ctx.fillRect(-200,-200,1360,940);
 };
 const dust=(color="#c6b6ff",count=30,rise=false)=>{
  for(let i=0;i<count;i++){
   const x=(i*173+clock*(rise?8:3))%1060-50;
   const y=((i*79+(rise?-clock*27:clock*5))%540+540)%540;
   ellipse(x,y,i%5===0?2:1,i%5===0?2:1,color);
  }
 };
 const slab=(x,y,w=180,depth=65,color="#8875b8")=>{
  poly([[x,y],[x+w,y-7],[x+w-24,y+depth*.55],[x+w*.55,y+depth],
   [x+w*.23,y+depth*.7]],"#181c34",color,1);
  poly([[x,y],[x+15,y-10],[x+w-12,y-16],[x+w,y-7]],"#454364",color,2);
  line([[x+w*.3,y+4],[x+w*.47,y+20],[x+w*.42,y+depth*.7]],"#73658b",1);
 };
 const tree=(x,y,s=1)=>{
  line([[x,y],[x-6*s,y-80*s],[x+5*s,y-130*s]],"#286a72",10*s);
  for(let i=0;i<3;i++){
   ellipse(x+(i%2?18:-12)*s,y-(80+i*24)*s,43*s,18*s,"#185660");
   line([[x-38*s,y-(80+i*24)*s],[x+25*s,y-(84+i*24)*s]],"#65e6bb",2*s);
  }
 };
 const prism=(x,y,h=90,color="#ba9cfb")=>{
  poly([[x-18,y],[x-8,y-h*.8],[x+7,y-h],[x+24,y-8]],"#45397e",color,2);
  poly([[x+7,y-h],[x+3,y-9],[x+24,y-8]],"#7167a5");
  line([[x+7,y-h],[x+3,y-9]],"#cfedff",1);
 };
 const tower=(x,y,w,h)=>{
  poly([[x,y],[x,y-h],[x+w*.7,y-h-13],[x+w,y-h],[x+w,y]],"#142940","#496c83",1);
  for(let i=0;i<5;i++)for(let j=0;j<2;j++){
   ctx.fillStyle=(i+j)%3?"#7ed1d0":"#b49fd6";
   ctx.fillRect(x+8+j*w*.42,y-h+17+i*(h-24)/5,4,8);
  }
 };
 const worldShard=(kind,x,y,s=1)=>{
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  slab(-75,0,155,90,["#68e3bb","#cba3fa","#8fbbe5"][kind]);
  if(kind===0){tree(-15,-7,.65);tree(40,-9,.42);}
  if(kind===1){prism(-20,-9,95);prism(25,-10,62);}
  if(kind===2){tower(-45,-8,38,95);tower(2,-8,48,125);}
  ctx.restore();
 };
 const rift=(pan=0)=>{
  sky();glow(620,190,350,"#67468d55");
  ctx.save();ctx.globalAlpha=.6;dust();
  for(let i=0;i<8;i++)worldShard(i%3,i*151-90-pan*.22,
   160+(i%3)*71+Math.sin(clock*.35+i)*7,.32+(i%2)*.1);
  ctx.restore();
  line([[510-pan*.12,-10],[561,90],[524,153],[610,218],[565,305]],"#bc8af044",3);
 };
 const cathedral=()=>{
  rift();
  for(let i=0;i<5;i++){
   const x=i*245-60;
   line([[x,470],[x,180],[x+20,120],[x+94,69],[x+170,120],[x+190,180],[x+190,470]],"#655177",19);
   line([[x+4,470],[x+4,182],[x+25,124],[x+94,77],[x+165,124]],"#b393ba55",2);
  }
  glow(690,230,250,"#bd69ca22");
 };
 const prison=(x,y,s=1,opening=0,walk=false)=>{
  glow(x,y-65*s,100*s,"#c284ee44");
  a.cinemaAlicia(x,y,s,clock,(1-opening)*Math.sin(clock*1.4)*4,walk);
  ctx.save();ctx.globalAlpha=1-opening;
  for(let i=-2;i<=2;i++)line([[x+i*23*s,y-137*s],[x+i*31*s,y+12*s]],"#b79af2aa",2);
  ellipse(x,y+12*s,78*s,8*s,"#bfa4ec44");ctx.restore();
 };
 const flux=(x,y,s=1,{run=false,walk=false,air=false,rubro=false,face=1,angle=0}={})=>{
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  a.cinemaFlux(0,0,s,clock,run,{walk,airborne:air,vy:air?-150:0,rubro,facing:face});ctx.restore();
 };
 const rubble=(amount=0,offset=0)=>{
  for(let i=0;i<12;i++){
   const x=i*89-30-offset,y=365+(i%4)*17+amount*(70+i%3*60);
   ctx.save();ctx.translate(x,y);ctx.rotate(amount*(i%2?1:-1)*.7);
   poly([[-13,-4],[5,-12],[23,4],[8,18]],"#35304f","#84668c",1);ctx.restore();
  }
 };
 const ring=(x,y,r,color,width=2)=>{
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
 };
 const caption=(title,subtitle)=>{
  ctx.save();ctx.textAlign="center";ctx.fillStyle="#f8e8d2";
  ctx.font="600 18px system-ui";ctx.fillText(title,480,94);
  ctx.fillStyle="#d0c6cd";ctx.font="13px system-ui";ctx.fillText(subtitle,480,118);ctx.restore();
 };
 ctx.save();
 try{
  sky();ctx.save();
  try{
   ctx.translate(480,255);ctx.rotate(b.tilt);ctx.scale(b.zoom,b.zoom);ctx.translate(-480,-255);
   switch(art){
    case "arrival":{
     rift(q*110);
     worldShard(0,80-q*32,260,.95);worldShard(1,820+q*22,250,1.1);worldShard(2,490,175,.65);
     slab(570,312,300,150);a.cinemaPortal(730,210,clock,.28);prison(730,279,.34);
     slab(-50,425-q*45,440,180);a.cinemaFluxBack(267,414-q*45,.75,clock);
     line([[30,459],[164,391],[200,480]],"#171a2e",19);break;
    }
    case "altar":{
     rift();slab(70,385,770,150);
     ellipse(525,306,170,40,"#595078");ellipse(525,306,157,30,"#27243e");
     for(let i=0;i<9;i++){
      const angle=i*TAU/9-.7,x=525+Math.cos(angle)*133,y=302+Math.sin(angle)*27;
      line([[x,y],[525,301]],"#a78bc344",1);ring(x,y,9,"#c2a4ef",2);
      if(p>(i+1)/13)drawMemoryCore(ctx,x,y-8,clock+i,.32);
     }
     glow(525,275,130,"#be96e733");flux(264,354,1.12);
     for(let i=0;i<5;i++)slab(720+i*30,220-i*27,100,20);break;
    }
    case "descent":{
     rift();a.cinemaSovereign(610,360+q*28,clock,.76+q*.15);
     slab(90,384,410,120);flux(265,370,.7);
     for(let i=0;i<3;i++)line([[600,310],[420+i*36,373]],"#d39cf433",2);
     rubble(q*.4);break;
    }
    case "chase":{
     rift(q*480);
     ctx.save();ctx.globalAlpha=.7;a.cinemaSovereign(166-q*65,308,clock,.69);ctx.restore();
     // Destruction follows Flux; intact ledges remain ahead.
     for(let i=-1;i<9;i++){
      const x=i*149-(clock*115%149),fall=x<300?(300-x)*.8:0;
      slab(x,365+fall,132,70);
     }
     const leap=Math.sin(p*Math.PI);flux(480+q*75,350-leap*60,1.02,{run:true,air:true});
     line([[360,304-leap*50],[415,303-leap*50],[465,308-leap*50]],"#8ff5ee88",4);
     for(let i=0;i<5;i++)line([[110+i*27,60],[135+i*27,180],[100+i*30,350]],"#bb73df44",3);
     rubble(q,clock*80%89);break;
    }
    case "prison":{
     cathedral();slab(510,361,340,120);prison(689,327,1.25);
     slab(-45,400,425,110);flux(225+q*34,375,.8);
     ctx.fillStyle="#090d20";ctx.fillRect(30,-20,44,560);ctx.fillRect(897,-20,65,560);break;
    }
    case "throne":{
     cathedral();ctx.save();ctx.translate(960,45);ctx.rotate(Math.PI);
     for(let i=0;i<4;i++)slab(i*240,0,200,68);ctx.restore();
     slab(-10,386,980,130);prison(819,315,.49);a.cinemaSovereign(610,340,clock,.72);flux(248,365,.93);
     for(let i=0;i<7;i++){
      const x=340+i*47,y=340-q*180-(i%3)*12;
      poly([[x,y],[x+8,y-10],[x+15,y+4],[x+4,y+10]],"#8a739e");
     }break;
    }
    case "form":{
     cathedral();slab(-20,385,1000,120);const shock=ease((p-.35)/.45);
     a.cinemaSovereign(665,335,clock,.72+q*.15);
     for(let i=0;i<7;i++){
      const angle=i*TAU/7+clock*.3,r=140-q*70;
      poly([[665+Math.cos(angle)*r,245+Math.sin(angle)*r],[680+Math.cos(angle)*r,225+Math.sin(angle)*r],
       [691+Math.cos(angle)*r,251+Math.sin(angle)*r]],"#4c286c","#d39ef4");
     }
     ring(665,285,15+shock*680,`rgba(212,153,240,${.6*(1-shock)})`,10);
     flux(300-shock*105,355-shock*20,1.02,{angle:-shock*1.3,air:shock>0});rubble(shock*.6);break;
    }
    case "defeat":{
     sky("#040919","#292036");glow(710,206,210,"#c993dc22");
     ctx.save();ctx.globalAlpha=.22;a.cinemaSovereign(460,295,clock,.46);ctx.restore();
     slab(520,273,320,65);prison(692,247,.68);slab(100,387,500,130);flux(318,344,1.45,{angle:-1.32});
     line([[674,202],[592,225],[470,260],[343,307]],`rgba(255,215,174,${.16+q*.5})`,2);
     glow(343,307,24+q*30,"#ffd7ab44");break;
    }
    case "awaken":{
     sky("#100d25","#44223c");ctx.save();ctx.globalAlpha=.38*(1-b.burst);
     for(let i=0;i<3;i++)if(b.cores>i*3)worldShard(i,220+i*260,270,.85);
     ctx.restore();glow(480,257,145+b.burst*150,"#f7667b55");
     const radius=mix(137,41,b.burst);
     for(let i=0;i<b.cores;i++){
      const angle=i*TAU/9-Math.PI/2+clock*.28,x=480+Math.cos(angle)*radius,y=252+Math.sin(angle)*radius*.8;
      ctx.save();ctx.globalAlpha=1-b.burst*.7;
      line([[x,y],[mix(x,480,.55)+Math.sin(i+clock*5)*8,mix(y,252,.55)],[480,252]],"#ff94a6",2);
      drawMemoryCore(ctx,x,y,clock+i,.58);ctx.restore();
     }
     slab(355,364,250,95);flux(480,337-b.burst*18,1.18,
      {angle:-1.32*(1-ease(p/.42)),rubro:p>.72,air:p>.78});
     ring(480,257,45+b.burst*300,`rgba(255,143,166,${b.burst*(1-b.burst)*1.8})`,5);
     dust("#ffb1b9",22,true);break;
    }
    case "resolve":{
     cathedral();slab(-20,390,1000,130);
     // Reverse the old staging: Rubro dominates the foreground; the king retreats.
     a.cinemaSovereign(710+q*46,304,clock,.58-q*.045);prison(853,303,.42);
     glow(320,264,180,"#fa466d44");flux(320+q*25,357,1.48,{rubro:true});
     for(let i=0;i<5;i++){const x=270+i*29;line([[x,340],[x-9,303],[x+9,274],[x,239]],"#ff90a077",2);}
     dust("#ffa5b6",18,true);break;
    }
    case "rescue":{
     sky("#14223c","#9b6c8e");glow(700,130,320,"#ffe0b644");slab(60,369,850,150);
     for(let i=-3;i<=3;i++){
      const x=680+i*27+q*i*30,y=120+q*140;ctx.save();ctx.globalAlpha=1-q;
      poly([[x-9,y],[x,y-30],[x+12,y+5]],"#725784","#e2c8ef");ctx.restore();
     }
     if(p<.8){ctx.save();ctx.globalAlpha=1-q;a.cinemaPortal(690,210,clock,.55*(1-q)+.02);ctx.restore();}
     const meet=ease((p-.22)/.7);
     flux(280+meet*172,355,1.04,{run:meet>0&&meet<.98});
     prison(665-meet*135,350,1.02,ease(p/.45),meet>0&&meet<.98);dust("#ffe0be",25,true);break;
    }
    case "city":{
     sky("#122b48","#ce8a99");glow(730,130,190,"#ffe0ac66");ellipse(730,131,39,39,"#ffddbd");
     for(let layer=0;layer<3;layer++){
      ctx.save();ctx.globalAlpha=.4+layer*.23;
      for(let i=-1;i<10;i++)tower(i*128-q*(20+layer*35),345,83,100+(i*7+20)%5*34+layer*15);
      ctx.restore();
     }
     // Tiny pair on a high bridge gives scale; the backdrop never draws an extra Flux.
     line([[-30,333],[990,287]],"#20344c",15);line([[-30,325],[990,279]],"#abe8e4",3);
     const x=240+q*340,y=320-(x+30)*46/1020;
     flux(x,y,.52,{run:true});a.cinemaAlicia(x+53,y-2,.5,clock,0,true);
     caption("CIDADE DAS FENDAS","Dois rastros. Um caminho de volta.");break;
    }
    case "canyon":{
     sky("#29234d","#b58cb1");glow(650,130,250,"#f4d8d944");
     for(let i=0;i<7;i++){
      const x=i*170-q*35;poly([[x-80,540],[x,95+i%3*40],[x+130,540]],i%2?"#49426c":"#615077");
      const g=ctx.createLinearGradient(x,130,x+55,450);g.addColorStop(0,"#b5f2ef88");g.addColorStop(1,"#8da9dc11");
      ctx.fillStyle=g;ctx.fillRect(x+35,175+i%2*40,27,330);
      for(let j=0;j<4;j++)line([[x+38+j*6,200+(clock*52+j*43)%160],[x+38+j*6,235+(clock*52+j*43)%160]],"#d4ffff55",1);
     }
     slab(50,369,300,150);slab(560,320,400,190);prism(855,300,110);
     const x=270+q*360,y=353-q*47-Math.sin(p*Math.PI)*99;
     flux(x,y,.7,{run:true,air:true});a.cinemaAlicia(x+56,y-4,.65,clock);
     for(let i=0;i<4;i++){slab(340+i*63,360-i*11,51,24);drawMemoryCore(ctx,365+i*63,340-i*11,clock+i,.2);}
     caption("CÂNION PRISMA","A luz encontra passagem.");break;
    }
    case "forest":{
     sky("#052a34","#347a73");glow(670,170,320,"#c6efa344");
     poly([[-40,410],[200,310],[450,310],[680,220],[1020,265],[1020,540],[-40,540]],"#234e50");
     line([[-40,411],[215,351],[448,354],[699,280],[1020,316]],"#85b9a2",35);
     line([[-40,405],[215,345],[448,348],[699,274],[1020,310]],"#b1d8ac",2);
     for(let i=0;i<9;i++)tree(i*125-q*15,250+(i%3)*25,.9);
     const x=310+q*240,y=x<448?343:343-(x-448)*74/251;
     flux(x,y,.61,{run:true});a.cinemaAlicia(x+50,y-10,.57,clock,0,true);
     for(let i=0;i<5;i++)tree(i*260-70,625,1.65);
     dust("#cff6a4",26,true);caption("FLORESTA NEON","O último portal fica para trás.");break;
    }
    case "home":case "flower":case "promise":{
     // Return to the prologue's composition, raised above the mobile dialogue dock.
     ctx.save();ctx.translate(0,-65);a.cinemaLandscape(clock);
     if(art==="flower"){ctx.translate(440,335);ctx.scale(1+q*.15,1+q*.15);ctx.translate(-440,-335);}
     const hand=art==="promise"?1:art==="flower"?ease(p/.68):0;
     const fluxX=330+104*hand;
     flux(fluxX,408,1.25,{walk:art==="flower"&&hand>0&&hand<.95});a.cinemaAlicia(529,406,1.17,clock);
     if(art!=="home"){
      a.cinemaFlower(mix(393,500,hand),mix(322,333,hand),clock,1.15);
      line([[512,348],[501,370]],"#dfbda9",8);
      if(art==="flower"&&hand<1)line([[fluxX+22,376],[mix(390,497,hand),mix(354,367,hand)]],"#c2fef7",6);
     }
     ctx.restore();
     if(art==="home")caption("DE VOLTA AO COMEÇO","O mesmo vale. Uma promessa cumprida.");
     if(art==="promise")caption("UMA FLOR, ENFIM","Obrigado por jogar · Velocity Rift");break;
    }
    default:rift();
   }
  }finally{ctx.restore();}
  const vignette=ctx.createRadialGradient(480,240,180,480,260,580);
  vignette.addColorStop(0,"transparent");vignette.addColorStop(1,"#03081699");
  ctx.fillStyle=vignette;ctx.fillRect(0,0,960,540);
  ctx.fillStyle="#030817";ctx.fillRect(0,0,960,18);ctx.fillRect(0,520,960,20);
  if(b.fade>0){ctx.fillStyle=`rgba(3,8,23,${b.fade})`;ctx.fillRect(0,0,960,540);}
 }finally{ctx.restore();}
}

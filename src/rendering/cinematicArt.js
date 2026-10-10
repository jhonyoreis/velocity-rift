// Dedicated cinematic Canvas artwork. Rendering only; story/game state stays in main.js.
export function createCinematicArt(ctx,VIEW_W,VIEW_H,drawFluxBody){
// ---------------------- Canvas cinematic artwork ---------------------
// Original vector art for characters and final-boss foreshadowing.
function cinemaGradient(top,bottom){
  const grad=ctx.createLinearGradient(0,0,0,VIEW_H);
  grad.addColorStop(0,top);grad.addColorStop(1,bottom);
  ctx.fillStyle=grad;ctx.fillRect(0,0,VIEW_W,VIEW_H);
}
function cinemaRidge(y,height,color,offset=0){
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-60,VIEW_H);
  ctx.lineTo(-60,y+50);
  for(let i=0;i<8;i++){
    const x=i*155-90,peak=y-(i%3)*height+Math.sin(i*2.4+offset)*22;
    ctx.lineTo(x+75,peak);ctx.lineTo(x+165,y+65);
  }
  ctx.lineTo(VIEW_W+70,VIEW_H);ctx.closePath();ctx.fill();
}
function cinemaStars(clock,color="#cefff6",density=36){
  ctx.save();ctx.fillStyle=color;
  for(let i=0;i<density;i++){
    const x=(i*187+51)%VIEW_W,y=18+(i*97)%320;
    ctx.globalAlpha=.23+.5*(.5+.5*Math.sin(clock*(.8+i%3)+i));
    ctx.beginPath();ctx.arc(x,y,i%9===0?2.3:1.15,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
// Use the EXACT sprite renderer used by gameplay, including the helmet,
 // cyan crest/visor, dark body, orange scarf and little running feet.
function cinemaFlux(x,y,scale=1,clock=0,run=false){
  ctx.save();
  ctx.translate(x,y-15*scale*2.3);
  ctx.scale(scale*2.3,scale*2.3);
  const actor={x:0,y:0,facing:1,onGround:true,ground:null,
    sliding:false,boosting:run,invulnerable:0,
    vx:run?480:0,vy:0,animationPhase:clock*(run?16:2)};
  const fx={boost:run?.5:0,turn:0,landing:0,takeoff:0,hit:0,run:run?1:0};
  drawFluxBody(actor,fx,clock);
  ctx.restore();
}
// The same silhouette seen from the rear for the portal-arrival reveal.
function cinemaFluxBack(x,y,scale=1,clock=0){
  ctx.save();ctx.translate(x,y-15*scale*2.3);
  ctx.scale(scale*2.3,scale*2.3);
  const sway=Math.sin(clock*1.4)*.7;
  ctx.fillStyle="rgba(64,209,202,.20)";
  ctx.beginPath();ctx.ellipse(-9,3,25,18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffba5e";ctx.beginPath();
  ctx.moveTo(-11,-7+sway);ctx.lineTo(-27,-14);
  ctx.lineTo(-19,0);ctx.lineTo(-11,sway);ctx.closePath();ctx.fill();
  ctx.fillStyle="#ffbd65";ctx.beginPath();
  ctx.ellipse(-8,15+sway,10,5,-.18,0,Math.PI*2);
  ctx.ellipse(9,15+sway,11,5,.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#124955";ctx.beginPath();
  ctx.ellipse(-2,5+sway,13,14,-.16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f2fffd";ctx.beginPath();
  ctx.ellipse(0,-5+sway,17,15,-.13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#55d8dc";ctx.beginPath();
  ctx.moveTo(-12,-17+sway);ctx.lineTo(-16,-24+sway);
  ctx.lineTo(0,-19+sway);ctx.lineTo(7,-18+sway);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="#a1e6e1";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(-8,-4+sway);ctx.quadraticCurveTo(0,0+sway,9,-4+sway);ctx.stroke();
  ctx.restore();
}
function cinemaAlicia(x,y,scale=1,clock=0,lift=0){
  ctx.save();ctx.translate(x,y-lift);ctx.scale(scale,scale);
  const sway=Math.sin(clock*2)*3;
  ctx.fillStyle="#162742";ctx.beginPath();ctx.ellipse(0,0,29,6,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#283955";ctx.lineCap="round";ctx.lineWidth=9;
  ctx.beginPath();ctx.moveTo(-10,-21);ctx.lineTo(-9,0);
  ctx.moveTo(8,-21);ctx.lineTo(11,0);ctx.stroke();
  ctx.fillStyle="#ab80de";ctx.beginPath();
  ctx.moveTo(-16,-54);ctx.lineTo(16,-54);ctx.lineTo(26,-23);
  ctx.lineTo(-26,-23);ctx.closePath();ctx.fill();
  ctx.fillStyle="#dfbda9";ctx.beginPath();ctx.ellipse(0,-78,20,21,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#473052";ctx.beginPath();
  ctx.arc(0,-85,23,Math.PI,Math.PI*2);ctx.lineTo(22,-72);
  ctx.lineTo(14,-64);ctx.lineTo(10,-88);ctx.quadraticCurveTo(-17,-68,-21,-66);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="#392849";ctx.lineWidth=11;
  ctx.beginPath();ctx.moveTo(-19,-82);ctx.lineTo(-23,-48);
  ctx.moveTo(20,-82);ctx.lineTo(24,-51);ctx.stroke();
  ctx.fillStyle="#ffe0a2";ctx.beginPath();ctx.arc(14,-92,5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#ddb4ad";ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(-14,-51);
  ctx.lineTo(-26+sway,-45);
  ctx.moveTo(15,-51);ctx.lineTo(25+sway,-52);ctx.stroke();
  ctx.fillStyle="#282038";
  ctx.beginPath();ctx.arc(-7,-78,2.1,0,Math.PI*2);ctx.arc(7,-78,2.1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#6a3758";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.arc(0,-73,5,.08,Math.PI-.08);ctx.stroke();
  ctx.restore();
}
function cinemaFlower(x,y,clock,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ctx.rotate(Math.sin(clock*3)*.07);ctx.strokeStyle="#318d67";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-7,12,2,36);ctx.stroke();
  ctx.fillStyle="#56c89b";ctx.beginPath();
  ctx.ellipse(-6,17,9,4,-.5,0,Math.PI*2);ctx.fill();
  for(let p=0;p<5;p++){
    const a=p*Math.PI*2/5+clock*.05;
    ctx.fillStyle=p%2===0?"#ffb6ce":"#ffcfe1";ctx.beginPath();
    ctx.ellipse(Math.cos(a)*9,Math.sin(a)*9,10,7,a,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="#ffe6a5";ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function cinemaLandscape(clock,dark=0){
  cinemaGradient(dark?"#0d0927":"#20365e",dark?"#421c53":"#f6aa72");
  const sunX=720,sunY=137;
  ctx.save();ctx.fillStyle=dark?"#bd7be7":"#ffe9b6";
  ctx.shadowColor=dark?"#be58fc":"#ffd695";ctx.shadowBlur=65;
  ctx.beginPath();ctx.arc(sunX,sunY,dark?51:65,0,Math.PI*2);ctx.fill();
  ctx.restore();
  cinemaStars(clock,dark?"#acbaff":"#fafff6",dark?53:18);
  cinemaRidge(295,58,dark?"#292049":"#7e6a91",clock*.015);
  cinemaRidge(347,28,dark?"#17233f":"#546e88",clock*.03);
  ctx.fillStyle=dark?"#173b40":"#31846f";
  ctx.beginPath();ctx.moveTo(0,414);
  ctx.quadraticCurveTo(260,367,490,403);
  ctx.quadraticCurveTo(730,439,VIEW_W,376);
  ctx.lineTo(VIEW_W,VIEW_H);ctx.lineTo(0,VIEW_H);ctx.fill();
  ctx.fillStyle=dark?"#12313c":"#215b54";
  ctx.fillRect(0,470,VIEW_W,VIEW_H-470);
  for(let i=0;i<15;i++){
    const x=i*87+Math.sin(i)*19,y=413+Math.sin(i*2)*31;
    ctx.strokeStyle=dark?"#448c99":"#9ddda3";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x,y+10);ctx.lineTo(x,y-9);ctx.stroke();
    ctx.fillStyle=i%2?"#f8c7ec":"#fce7ae";
    ctx.beginPath();ctx.arc(x,y-10,3,0,Math.PI*2);ctx.fill();
  }
}
function cinemaPortal(x,y,clock,intensity=1){
  ctx.save();ctx.translate(x,y);
  const flicker=1+Math.sin(clock*4)*.07;
  ctx.scale(flicker*intensity,intensity);
  for(let i=5;i>=0;i--){
    ctx.globalAlpha=.12+(5-i)*.14;
    ctx.strokeStyle=i%2?"#df86fd":"#8c67ff";
    ctx.lineWidth=8+i*4;ctx.beginPath();
    ctx.ellipse(0,0,125+i*7,186+i*4,
      Math.sin(clock*.4)*.04,0,Math.PI*2);ctx.stroke();
  }
  const g=ctx.createLinearGradient(-115,-140,110,170);
  g.addColorStop(0,"#142154");g.addColorStop(.44,"#5d279d");
  g.addColorStop(.72,"#180c38");g.addColorStop(1,"#2d76ac");
  ctx.globalAlpha=.91;ctx.fillStyle=g;ctx.beginPath();
  ctx.ellipse(0,0,116,179,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#dfb2ff";ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(0,0,110,177,-clock*.04,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<17;i++){
    const angle=(i*2.4+clock*(i%2?-.8:.55)),r=35+i%6*14;
    ctx.fillStyle=i%2?"#a2f7f7":"#f5b6ff";ctx.globalAlpha=.5;
    ctx.beginPath();ctx.arc(Math.cos(angle)*r,Math.sin(angle)*r*1.4,2+i%3,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function cinemaSovereign(x,y,clock,scale=1){
  // A different visual language from the Prisma Guardian: vast winglike
  // void armor, shattered orbiting crown, asymmetric limbs and bright core.
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const float=Math.sin(clock*1.5)*5;
  ctx.translate(0,float);
  ctx.save();ctx.globalAlpha=.26;ctx.strokeStyle="#ae54ed";ctx.lineWidth=6;
  for(let i=0;i<3;i++){
    ctx.beginPath();ctx.ellipse(0,-114,85+i*24,25+i*5,
      Math.sin(clock*.17+i)*.15,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle="#110c2b";ctx.strokeStyle="#6b3c9b";ctx.lineWidth=3;
  for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(side*40,-130);
    ctx.lineTo(side*169,-253);
    ctx.lineTo(side*132,-120);
    ctx.lineTo(side*204,-174);
    ctx.lineTo(side*151,-43);
    ctx.lineTo(side*78,-22);ctx.closePath();
    ctx.fill();ctx.stroke();
  }
  ctx.fillStyle="#151126";
  ctx.beginPath();ctx.moveTo(-67,-169);ctx.lineTo(75,-161);
  ctx.lineTo(100,-81);ctx.lineTo(63,5);
  ctx.lineTo(19,91);ctx.lineTo(-8,117);
  ctx.lineTo(-38,54);ctx.lineTo(-104,-83);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#8e56c6";ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle="#251542";
  for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(side*65,-150);
    ctx.lineTo(side*107,-125);
    ctx.lineTo(side*117,-32);
    ctx.lineTo(side*145,24);
    ctx.lineTo(side*119,42);
    ctx.lineTo(side*82,-17);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#170b31";ctx.beginPath();
    ctx.moveTo(side*119,39);ctx.lineTo(side*150,45);
    ctx.lineTo(side*170,104);ctx.lineTo(side*140,76);
    ctx.lineTo(side*130,96);ctx.lineTo(side*110,51);ctx.closePath();ctx.fill();
    ctx.fillStyle="#251542";
  }
  ctx.fillStyle="#090e21";ctx.beginPath();ctx.ellipse(0,-197,47,64,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#9c57d8";ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle="#a854ef";ctx.shadowBlur=18;ctx.shadowColor="#c475ff";
  ctx.beginPath();ctx.ellipse(0,-199,24,5,0,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // Shattered crown is detached from the head to imply enormous scale.
  for(let i=-3;i<=3;i++){
    const xx=i*28,yy=-279-Math.cos(i*.7)*17+Math.sin(clock*1.2+i)*3;
    ctx.fillStyle="#1c1137";ctx.strokeStyle="#bd80f8";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(xx-11,yy+16);
    ctx.lineTo(xx-3,yy-26-Math.abs(i)*4);
    ctx.lineTo(xx+12,yy+13);ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor="#ed6cfe";ctx.shadowBlur=35;
  ctx.fillStyle="#f4d4ff";ctx.beginPath();ctx.arc(0,-99,24+Math.sin(clock*4)*2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#802de0";ctx.beginPath();ctx.arc(0,-99,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f8e9ff";ctx.beginPath();ctx.arc(0,-99,5,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.restore();
}
function cinemaCanyon(clock,showBoss=false){
  cinemaGradient("#070b2d","#59368b");
  cinemaStars(clock,"#c0aaff",48);
  cinemaRidge(365,98,"#24204e",clock*.03);
  ctx.fillStyle="#252057";
  ctx.fillRect(0,405,VIEW_W,135);
  for(let i=0;i<11;i++){
    const x=i*112-25,top=240+(i%4)*35;
    ctx.fillStyle=i%2?"#7653b3":"#4f4195";
    ctx.beginPath();ctx.moveTo(x,405);
    ctx.lineTo(x+26,top);ctx.lineTo(x+58,405);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#ad8ff7";ctx.lineWidth=3;ctx.stroke();
  }
  if(showBoss){
    cinemaPortal(705,263,clock,.7);
    ctx.save();ctx.globalAlpha=.85;
    cinemaSovereign(705,408,clock,.43);ctx.restore();
  }
}
function cinemaMetropolis(clock,action=false){
  cinemaGradient("#08102f","#4f3975");
  cinemaStars(clock,"#b0c9ff",46);
  ctx.fillStyle="#f4a3bc";ctx.beginPath();ctx.arc(728,120,51,0,Math.PI*2);ctx.fill();
  for(let layer=0;layer<3;layer++){
    const step=95+layer*38,move=action?clock*(70+layer*50):0;
    for(let i=-1;i<11;i++){
      const x=i*step-(move%step);
      const h=160+((i*7+layer*4)%5+5)%5*44;
      ctx.fillStyle=["#151e43","#1b2852","#20395e"][layer];
      ctx.fillRect(x,425-h,step*.75,h+120);
      if(layer===2){
        ctx.fillStyle="#8affec";
        for(let row=0;row<5;row++)for(let col=0;col<2;col++)
          if((row+col+i)%3!==0)
            ctx.fillRect(x+18+col*25,445-h+row*37,7,15);
      }
    }
  }
  ctx.fillStyle="#182b48";ctx.fillRect(0,413,960,127);
  ctx.fillStyle="#d5a8ff";ctx.fillRect(0,408,960,7);
  if(action){
    cinemaFlux(385+Math.sin(clock*4)*8,413,1.06,clock,true);
    ctx.strokeStyle="#c6eeff";ctx.lineWidth=3;
    for(let i=0;i<7;i++){
      const x=i*150-(clock*300%150);
      ctx.beginPath();ctx.moveTo(x,340+i%3*21);ctx.lineTo(x+68,340+i%3*21);ctx.stroke();
    }
  }else cinemaFluxBack(447,413,1.25,clock);
}

function cinemaForest(clock,running=false){
  cinemaGradient("#051e32","#12565d");
  cinemaStars(clock,"#a5ffea",27);
  for(let i=0;i<11;i++){
    const x=i*117-(running?clock*200%117:0),h=185+(i%4)*35;
    ctx.fillStyle=i%2?"#0c414b":"#0e5c56";
    ctx.fillRect(x,260-h,18,h+230);
    ctx.fillStyle=i%2?"#1d7d69":"#196b69";
    ctx.beginPath();ctx.ellipse(x+8,260-h,69,47,0,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="#1a3646";ctx.fillRect(0,410,VIEW_W,130);
  ctx.fillStyle="#78ffde";ctx.fillRect(0,406,VIEW_W,8);
  if(running){
    ctx.strokeStyle="#a4ffff";ctx.lineWidth=3;
    for(let i=0;i<15;i++){
      const x=(i*103-clock*600%1200+1200)%1200-100,y=140+i%6*40;
      ctx.globalAlpha=.22+i%4*.12;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+115,y);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
}
function cinemaNewWorld(clock){
  // A clear silhouette/reveal: Flux is facing away from the viewer
  // and looking at the unfamiliar mountains he must cross.
  cinemaGradient("#081930","#de8b9f");
  ctx.save();
  const glow=ctx.createLinearGradient(0,85,0,335);
  glow.addColorStop(0,"#f4a8ab");
  glow.addColorStop(1,"#ffe2a9");
  ctx.fillStyle=glow;
  ctx.beginPath();ctx.arc(670,167,81,0,Math.PI*2);ctx.fill();
  ctx.restore();
  cinemaStars(clock,"#f6e7ff",48);
  ctx.fillStyle="#473e74";
  ctx.beginPath();ctx.moveTo(0,373);
  for(let i=0;i<=8;i++){
    const x=i*130-40;
    ctx.lineTo(x,360);
    ctx.lineTo(x+75,134+(i%3)*37);
    ctx.lineTo(x+155,368);
  }
  ctx.lineTo(VIEW_W,VIEW_H);ctx.lineTo(0,VIEW_H);ctx.fill();
  ctx.fillStyle="#34375f";
  ctx.beginPath();ctx.moveTo(0,410);
  for(let i=0;i<=8;i++){
    const x=i*142-56;
    ctx.lineTo(x,405);
    ctx.lineTo(x+63,235+(i%4)*30);
    ctx.lineTo(x+155,405);
  }
  ctx.lineTo(VIEW_W,VIEW_H);ctx.lineTo(0,VIEW_H);ctx.fill();
  ctx.strokeStyle="#bfeaff";ctx.lineWidth=3;
  ctx.globalAlpha=.43;
  for(let i=0;i<6;i++){
    const x=i*154+20,top=280+(i%3)*23;
    ctx.beginPath();ctx.moveTo(x,top);
    ctx.lineTo(x+13,top-32);ctx.lineTo(x+32,top+8);ctx.stroke();
  }
  ctx.globalAlpha=1;
  ctx.fillStyle="#172f3b";
  ctx.beginPath();ctx.moveTo(0,456);
  ctx.quadraticCurveTo(420,405,VIEW_W,465);
  ctx.lineTo(VIEW_W,VIEW_H);ctx.lineTo(0,VIEW_H);ctx.fill();
  ctx.strokeStyle="#69e6d7";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(0,456);
  ctx.quadraticCurveTo(420,405,VIEW_W,465);ctx.stroke();
  // Entrance glow fades behind the newly arrived traveler.
  const intensity=Math.max(0,1-Math.min(1,clock/5));
  if(intensity>0){
    ctx.save();ctx.globalAlpha=intensity*.42;
    cinemaPortal(238,305,clock,.43);ctx.restore();
  }
  cinemaFluxBack(471,432,1.8,clock);
}
return {cinemaGradient,cinemaRidge,cinemaStars,cinemaFlux,cinemaFluxBack,cinemaAlicia,cinemaFlower,cinemaLandscape,cinemaPortal,cinemaSovereign,cinemaCanyon,cinemaMetropolis,cinemaForest,cinemaNewWorld};
}

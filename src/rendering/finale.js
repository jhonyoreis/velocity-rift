import {drawMemoryCore} from "./collectibles.js";
// Native Canvas compositions; all characters keep their established designs.
export function drawFinaleFrame(ctx,art,t,p,a){
 const {cinemaLandscape,cinemaPortal,cinemaFlux,cinemaAlicia,cinemaFlower,cinemaSovereign,cinemaCanyon,cinemaMetropolis,cinemaForest}=a;
 if(["home","flower","promise"].includes(art)){
  cinemaLandscape(t);cinemaFlux(330,408,1.25,t);cinemaAlicia(529,406,1.17,t);
  if(art==="flower"||art==="promise"){
   // The flower travels to Alicia's left hand and remains there after delivery.
   const x=art==="promise"?500:394+106*Math.min(1,p*1.5);
   cinemaFlower(x,333,t,1.15);
   ctx.strokeStyle="#dfbda9";ctx.lineWidth=8;ctx.lineCap="round";
   ctx.beginPath();ctx.moveTo(512,348);ctx.lineTo(501,370);ctx.stroke();
  }
 }else if(["city","canyon","forest"].includes(art)){
  if(art==="city")cinemaMetropolis(t,true);
  if(art==="canyon")cinemaCanyon(t);
  if(art==="forest")cinemaForest(t,true);
  const x=220+p*440;cinemaFlux(x,405,1,t,true);cinemaAlicia(x+85,404,.94,t);
  if(art!=="forest")cinemaPortal(810,270,t,.7);
 }else{
  const g=ctx.createLinearGradient(0,0,0,540);g.addColorStop(0,"#030817");g.addColorStop(1,"#452244");ctx.fillStyle=g;ctx.fillRect(0,0,960,540);
  for(let i=0;i<7;i++){
   const x=i*170-50;ctx.fillStyle="#111526";ctx.fillRect(x,70+i%3*35,55,370);
   ctx.strokeStyle="#88679566";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,300);ctx.lineTo(x,110);ctx.quadraticCurveTo(x+80,20,x+125,160);ctx.stroke();
  }
  cinemaPortal(695,260,t,art==="rescue"?.35:1.25);
  ctx.fillStyle="#15203b";ctx.fillRect(0,430,960,110);ctx.fillStyle="#a794c6";ctx.fillRect(0,426,960,4);
  if(art==="rescue"){
   cinemaFlux(365+p*60,415,1.2,t);cinemaAlicia(515-p*20,414,1.14,t);
   for(let i=0;i<32;i++){ctx.fillStyle=i%2?"#ffb9d0":"#bafff4";ctx.globalAlpha=1-p;ctx.fillRect(690+Math.sin(i*2)*p*310,210+Math.cos(i)*p*200,4,6);}ctx.globalAlpha=1;
  }else{
   cinemaSovereign(690,385,t,art==="form"?1.02:.72);cinemaAlicia(850,398,.72,t,18);
   if(art==="defeat"){
    ctx.save();ctx.translate(290,424);ctx.rotate(-1.2);cinemaFlux(0,0,1.2,t);ctx.restore();
   }else if(art==="awaken"){
    ctx.save();ctx.filter="hue-rotate(170deg) saturate(1.6)";cinemaFlux(285,415,1.3,t);ctx.restore();
    for(let i=0;i<9;i++){const angle=i*Math.PI*2/9+t*.6,x=285+Math.cos(angle)*90,y=355+Math.sin(angle)*90;
     ctx.strokeStyle="#ff6486";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(285+(x-285)*.45+Math.sin(t*9+i)*12,355+(y-355)*.45);ctx.lineTo(285,355);ctx.stroke();drawMemoryCore(ctx,x,y,t+i,.55);}
   }else cinemaFlux(270,415,1.2,t,art==="chase");
  }
 }
 // Small chapter captions remain above the dialogue dock on mobile.
 if(["city","canyon","forest","home","promise"].includes(art)){
  const labels={city:["VELOCITY RIFT","Uma jornada através do impossível"],canyon:["MUNDOS","Cidade das Fendas · Cânion Prisma"],forest:["MEMÓRIAS","Floresta Neon · Fenda Original"],home:["DE VOLTA AO COMEÇO","Flux e Alicia · Juntos outra vez"],promise:["FIM","Obrigado por jogar · Velocity Rift 4.0"]};
  ctx.textAlign="center";ctx.fillStyle="#f7e7ce";ctx.font="bold 24px system-ui";ctx.fillText(labels[art][0],480,85);
  ctx.font="15px system-ui";ctx.fillText(labels[art][1],480,114);ctx.textAlign="left";
 }
}

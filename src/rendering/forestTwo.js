import {FACTORY,pressState} from '../levels/forestTwo.js';
const TAU=Math.PI*2;
function line(c,x,y,a,b,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function gear(c,x,y,r,time,color){c.save();c.translate(x,y);c.rotate(time);c.strokeStyle=color;c.lineWidth=8;c.beginPath();c.arc(0,0,r*.76,0,TAU);c.stroke();for(let i=0;i<10;i++){c.rotate(TAU/10);c.fillStyle=color;c.fillRect(r*.65,-6,r*.4,12);}c.lineWidth=4;c.beginPath();c.arc(0,0,r*.2,0,TAU);c.stroke();c.restore();}
export function drawForestTwoBackdrop(c,{cameraX,cameraY,width,height,time}){
 c.save();
 const center=cameraX+width*.55;
 const interior=Math.min(1,Math.max(0,(center-5950)/450))*Math.min(1,Math.max(0,(13150-center)/400));
 const sky=c.createLinearGradient(0,cameraY,0,cameraY+height);sky.addColorStop(0,'#070f23');sky.addColorStop(.5,'#103336');sky.addColorStop(1,'#21574b');c.fillStyle=sky;c.fillRect(cameraX,cameraY,width,height);
 // Distant emerald moon and cathedral-like trunks, at three parallax depths.
 const moon=cameraX+700-cameraX*.045;
 const halo=c.createRadialGradient(moon,135,8,moon,135,165);halo.addColorStop(0,'#9ee6c944');halo.addColorStop(1,'#7fdcbe00');c.fillStyle=halo;c.fillRect(moon-170,-35,340,340);ellipse(c,moon,135,52,52,'#91cbb859');
 for(const [factor,spacing,color,w] of [[.13,260,'#123437',72],[.3,390,'#102d31',108],[.64,580,'#13292b',148]]){
  const first=Math.floor(cameraX*factor/spacing)-2;
  for(let i=first;i<first+8;i++){
   const x=cameraX+i*spacing-cameraX*factor;
   c.fillStyle=color;c.beginPath();c.moveTo(x-w,560);c.bezierCurveTo(x-w*.2,280,x-w*.55,110,x-w*.4,-100);c.lineTo(x+w*.6,-100);c.bezierCurveTo(x+w*.35,190,x+w*.18,310,x+w,560);c.fill();
   for(let j=0;j<4;j++)line(c,x+Math.sin(j+i)*w*.22,90+j*95,x+Math.sin(j+i+.4)*w*.22,158+j*95,'#40827325',3);
   c.strokeStyle=color;c.lineWidth=w*.25;c.beginPath();c.moveTo(x,175);c.bezierCurveTo(x+80,105,x+160,105,x+220,40);c.stroke();
   ellipse(c,x+60,15+(i%3)*30,220,70,'#0e302ee6');
   if(factor>.3){line(c,x-30,0,x-36,190+(i%3)*24,'#4ba58663',3);for(let j=0;j<6;j++)ellipse(c,x-36+(j%2?7:-7),45+j*22,8,3,'#5abf956e');}
  }
 }
 // Light shafts are broad and low contrast; silhouettes of hazards stay legible.
 c.globalAlpha=(1-interior)*.07;c.fillStyle='#b8ffe5';
 for(let i=0;i<5;i++){const x=cameraX+i*280-(cameraX*.2)%280;c.beginPath();c.moveTo(x,0);c.lineTo(x+65,0);c.lineTo(x+260,540);c.lineTo(x+120,540);c.fill();}c.globalAlpha=1;
 if(interior>0){
  c.globalAlpha=interior;
  const g=c.createLinearGradient(0,0,0,540);g.addColorStop(0,'#101d26');g.addColorStop(1,'#1e3339');c.fillStyle=g;c.fillRect(cameraX,cameraY,width,height);
  // Arched clerestory windows reveal the original forest outside.
  const first=Math.floor(cameraX/360)-1;
  for(let i=first;i<first+5;i++){
   const x=i*360;c.fillStyle='#091720';c.fillRect(x+12,35,260,192);c.fillStyle='#244c4c';c.fillRect(x+23,44,238,169);
   for(let k=0;k<4;k++){line(c,x+36+k*62,46,x+36+k*62,207,'#0b252c',10);line(c,x+25,100+k*32,x+260,100+k*32,'#0b252c',6);}
   c.fillStyle='#0c252c';c.beginPath();c.moveTo(x+50,210);c.lineTo(x+120,55);c.lineTo(x+178,210);c.fill();
   line(c,x,0,x,510,'#3c5053',19);line(c,x-10,5,x+330,5,'#46585a',22);line(c,x,38,x+100,100,'#425654',8);
   line(c,x+90,230,x+90,295,'#705748',12);line(c,x+90,292,x+290,292,'#705748',12);
   gear(c,x+238,300,44,time*.18*(i%2?-1:1),'#3c4c4c');
   c.fillStyle='#12242d';c.fillRect(x+17,330,76,84);c.strokeStyle='#516362';c.lineWidth=2;c.strokeRect(x+17,330,76,84);
   c.fillStyle='#70ddae';c.globalAlpha=interior*(.35+.25*Math.sin(time+i));c.fillRect(x+28,345,12,4);c.globalAlpha=interior;
   // Broken roof light, vines and rust stains.
   line(c,x+190,0,x+190,58,'#617374',2);c.fillStyle='#ffe1a2';c.fillRect(x+161,59,60,5);
   c.fillStyle='#e9bd6810';c.beginPath();c.moveTo(x+160,64);c.lineTo(x+220,64);c.lineTo(x+295,450);c.lineTo(x+70,450);c.fill();
   for(let j=0;j<4;j++)line(c,x+5+j*9,100,x+5+j*9,140+(j%3)*23,'#ac6c3937',3);
  }
  c.globalAlpha=1;
  if(center>10800&&center<12850){
   c.save();c.globalAlpha=interior;const rx=11760;
   const glow=c.createRadialGradient(rx,270,20,rx,270,265);glow.addColorStop(0,'#5ca78a35');glow.addColorStop(1,'#07151b00');c.fillStyle=glow;c.fillRect(rx-270,0,540,540);
   for(let i=0;i<3;i++){c.strokeStyle=['#304e4c','#3d5c56','#55736a'][i];c.lineWidth=9-i*2;c.beginPath();c.arc(rx,255,135+i*35,0,TAU);c.stroke();}
   for(let i=0;i<12;i++){const a=i*TAU/12;line(c,rx+Math.cos(a)*155,255+Math.sin(a)*155,rx+Math.cos(a)*192,255+Math.sin(a)*192,'#789a7566',6);}
   c.fillStyle='#bfd1ab';c.textAlign='center';c.font='bold 15px system-ui';c.fillText('HELIX / REATOR 07',rx,60);c.restore();
  }
 }
 // Outside facade visibly frames the moment of entry and departure.
 for(const x of [FACTORY.entrance,FACTORY.exit])if(x>cameraX-180&&x<cameraX+width+180){
  c.fillStyle='#1b3539';c.fillRect(x-90,-70,180,285);c.strokeStyle='#66877a';c.lineWidth=4;c.strokeRect(x-88,-65,176,278);
  c.fillStyle='#d9c99a';c.textAlign='center';c.font='bold 17px system-ui';c.fillText('H E L I X',x,130);c.font='10px system-ui';c.fillText('BIOENERGIA · 07',x,151);
  line(c,x-72,190,x+72,190,'#f8c16b',6);c.fillStyle='#131f25';for(let i=0;i<7;i++)c.fillRect(x-66+i*21,187,10,6);
 }
 // Dust/spores drift slowly, never masking the playable strip.
 for(let i=0;i<28;i++){const x=cameraX+((i*173-cameraX*.4+time*(7+i%3))%width+width)%width;const y=95+(i*61)%290+Math.sin(time*.6+i)*13;ellipse(c,x,y,i%4?1:2,i%4?1:2,interior>.5?'#ffd69c55':'#86ffc08c');}
 c.restore();
}
export function drawForestTwoGround(c,tracks,cameraX,width,time){
 for(const t of tracks){if(t.x2<cameraX-40||t.x1>cameraX+width+40)continue;const metal=t.kind.startsWith('factory');
  const depth=t.kind==='factory-catwalk'?22:170;c.fillStyle=metal?'#243439':'#163b33';c.beginPath();c.moveTo(t.x1,t.y1+4);c.lineTo(t.x2,t.y2+4);c.lineTo(t.x2,t.y2+depth);c.lineTo(t.x1,t.y1+depth);c.fill();
  if(metal){for(let x=Math.max(t.x1,Math.floor(cameraX/70)*70);x<t.x2&&x<cameraX+width+70;x+=70){const y=t.y1+(t.y2-t.y1)*(x-t.x1)/(t.x2-t.x1);line(c,x,y+12,x+40,y+depth-5,'#465352',2);line(c,x+40,y+12,x,y+depth-5,'#465352',2);c.fillStyle='#8b8c73';c.fillRect(x+5,y+8,4,4);}}
  else{for(let x=Math.max(t.x1,Math.floor(cameraX/90)*90);x<t.x2&&x<cameraX+width+90;x+=90){const y=t.y1+(t.y2-t.y1)*(x-t.x1)/(t.x2-t.x1);line(c,x,y+20,x+30,y+75,'#43705a',5);ellipse(c,x+45,y+14,18,6,'#56bc86');}}
 }
}
export function drawPresses(c,presses,time,cameraX,width){for(const p of presses){if(p.x<cameraX-100||p.x>cameraX+width+100)continue;const s=pressState(p,time);const bottom=p.y-150+145*s.extension;
 line(c,p.x,65,p.x,bottom-32,'#6c8182',20);line(c,p.x-26,75,p.x-26,bottom-32,'#263e45',5);line(c,p.x+26,75,p.x+26,bottom-32,'#263e45',5);
 c.fillStyle='#4d6162';c.fillRect(p.x-p.w/2,bottom-35,p.w,35);c.fillStyle=s.warning||s.active?'#ffbd65':'#69c7b0';c.fillRect(p.x-p.w/2,bottom-8,p.w,8);c.fillStyle='#26383c';for(let j=0;j<6;j++)c.fillRect(p.x-p.w/2+j*16,bottom-8,8,8);
 if(s.warning){c.fillStyle='#ffb75b22';c.fillRect(p.x-p.w/2,bottom,p.w,p.y-bottom);line(c,p.x-p.w/2,p.y-4,p.x+p.w/2,p.y-4,'#ffc273',4);}
}}
export function drawWornWalker(c,b,time){
 const y=b.y-b.h;c.fillStyle='#786b56';c.beginPath();c.roundRect(b.x-b.w/2,y,b.w,b.h,6);c.fill();
 c.fillStyle='#324e45';c.fillRect(b.x-18,y+2,14,7);c.fillRect(b.x+8,y+16,9,8);
 line(c,b.x-4,y+1,b.x+2,y+12,'#b6a58b',2);line(c,b.x+2,y+12,b.x-4,y+19,'#302d2b',2);
 c.fillStyle='#201e20';c.fillRect(b.x-12,y+10,24,7);c.fillStyle='#ffd38b';c.fillRect(b.x-10,y+12,6,3);c.fillStyle=Math.sin(time*6+b.baseX)>.2?'#ef945c':'#603c2e';c.fillRect(b.x+5,y+12,5,3);
 line(c,b.x-14,b.y,b.x-18,b.y+3,'#394b4d',4);line(c,b.x+14,b.y,b.x+18,b.y+3,'#394b4d',4);
}
export function drawHelix(c,b,time,goal){
 if(!b.active&&!b.defeated)return;c.save();
 if(!b.defeated){
  for(const x of [FACTORY.arenaLeft,FACTORY.arenaRight]){line(c,x,150,x,430,'#f7b16677',6);}
  if(b.warning){c.fillStyle='#ffb34a20';c.fillRect(b.aim-62,145,124,280);line(c,b.aim-60,425,b.aim+60,425,'#ffbf63',4);c.textAlign='center';c.fillStyle='#ffdd9e';c.font='bold 12px system-ui';c.fillText('↓ IMPACTO',b.aim,180);}
  if(b.strike){line(c,b.aim,85,b.aim,425,'#ffb44a66',62);line(c,b.aim,85,b.aim,425,'#fff1b8',12);}
  for(const w of b.waves){ellipse(c,w.x,w.y,24,12,'#ffb76b44');line(c,w.x-15,w.y+5,w.x,w.y-12,'#ffcf79',4);line(c,w.x,w.y-12,w.x+15,w.y+5,'#ffcf79',4);}
 }
 const fall=b.defeated?Math.min(65,b.collapse*45):0;c.translate(b.x,b.y+fall);
 const scale=b.defeated?Math.max(.6,1-b.collapse*.06):1;c.scale(scale,scale);
 // Huge suspended turbine with asymmetric broken armour and a breathing reactor.
 line(c,-60,-220,-60,-63,'#648075',12);line(c,65,-220,65,-63,'#4a655e',12);
 gear(c,0,-12,82,b.defeated?0:time*(b.exposed?.8:.23)*(b.tempo||1),'#556964');
 for(const side of [-1,1]){c.save();c.scale(side,1);c.fillStyle='#344a49';c.beginPath();c.moveTo(40,-70);c.lineTo(102,-52);c.lineTo(114,21);c.lineTo(82,49);c.lineTo(53,33);c.closePath();c.fill();line(c,70,-47,90,17,'#a38c61',5);c.restore();}
 c.fillStyle='#142d32';c.beginPath();c.arc(0,0,47,0,TAU);c.fill();
 const color=b.defeated?'#3d6359':b.exposed?'#acffe6':'#edb965';const glow=c.createRadialGradient(0,0,4,0,0,69);glow.addColorStop(0,color+'a0');glow.addColorStop(1,color+'00');c.fillStyle=glow;c.fillRect(-70,-70,140,140);
 ellipse(c,0,0,b.exposed?27:18,b.exposed?27:18,color);line(c,-29,-8,29,-8,b.exposed?'#d1ffee':'#73735a',b.exposed?2:10);line(c,-29,10,29,10,b.exposed?'#d1ffee':'#73735a',b.exposed?2:10);
 if(b.exposed&&!b.defeated){c.strokeStyle='#caffeb';c.lineWidth=2;c.beginPath();c.arc(0,0,39+Math.sin(time*8)*3,0,TAU);c.stroke();c.fillStyle='#b7ffe4';c.font='bold 11px system-ui';c.textAlign='center';c.fillText('REATOR EXPOSTO',0,-93);}
 c.restore();
 if(b.defeated){const x=goal.x+goal.w/2,y=goal.y+goal.h/2;c.save();c.translate(x,y);const glow=c.createRadialGradient(0,0,5,0,0,110);glow.addColorStop(0,'#a5a0ff80');glow.addColorStop(1,'#8866ff00');c.fillStyle=glow;c.fillRect(-110,-110,220,220);for(let i=0;i<4;i++){c.strokeStyle=i%2?'#c3acff':'#78ffe5';c.lineWidth=3;c.beginPath();c.ellipse(0,0,22+i*5+Math.sin(time*3+i)*3,43+i*4,Math.sin(time+i)*.13,0,TAU);c.stroke();}c.restore();}
}

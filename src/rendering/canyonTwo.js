import {refractorState} from '../game/canyonHazards.js';
const TAU=Math.PI*2;
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function poly(c,p,fill,stroke){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function crystal(c,x,y,w,h,color='#9a86ed',flip=false){
 c.save();c.translate(x,y);if(flip)c.scale(1,-1);
 poly(c,[[-w*.45,0],[-w*.5,-h*.65],[0,-h],[w*.5,-h*.68],[w*.4,0]],color,'#b3c8ef');
 poly(c,[[0,0],[0,-h],[w*.5,-h*.68],[w*.4,0]],'#445c98');
 poly(c,[[-w*.45,0],[-w*.5,-h*.65],[0,-h],[0,0]],color);
 c.strokeStyle='#d5fff3';c.globalAlpha*=.6;c.beginPath();c.moveTo(0,-h);c.lineTo(0,0);c.stroke();c.restore();
}
function aura(c,x,y,r,color){const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(30,35,80,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
export function drawCanyonTwoBackdrop(c,{cameraX,cameraY,width,height,time,defeated=false}){
 c.save();c.translate(cameraX,cameraY);
 const zone=cameraX>11000?3:cameraX>7000?2:cameraX>3000?1:0;
 const sky=c.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#080e24');sky.addColorStop(.5,'#202951');sky.addColorStop(1,'#123d4c');c.fillStyle=sky;c.fillRect(0,0,width,height);
 // Stone ribs in three independent depth planes.
 for(let layer=0;layer<3;layer++){
  const par=.12+layer*.13,spacing=330-layer*45,start=Math.floor(cameraX*par/spacing)-1;
  for(let i=start;i<start+Math.ceil(width/spacing)+3;i++){
   const x=i*spacing-cameraX*par,v=hash(i+layer*42),w=170+v*140;
   poly(c,[[x-80,0],[x+w,0],[x+w*.7,100+v*85],[x+w*.5,145+v*170],[x+w*.27,80+v*80],[x,190+v*90]],['#14243b','#19304a','#172d43'][layer]);
   if(layer<2){c.globalAlpha=.18+layer*.06;crystal(c,x+90,495-cameraY*.2,60+v*60,190+v*160,layer?'#798be2':'#66babb');c.globalAlpha=1;}
  }
 }
 // Thin underground falls and pools remain well behind the playable contour.
 for(let i=0;i<5;i++){
  const x=((i*337-cameraX*.22)%1500+1500)%1500-120,y=150+hash(i)*70;
  const g=c.createLinearGradient(x,y,x,520);g.addColorStop(0,'rgba(94,232,223,0)');g.addColorStop(.3,'rgba(94,232,223,.13)');g.addColorStop(1,'rgba(121,227,244,.02)');c.fillStyle=g;c.fillRect(x,y,12+i%3*3,360);
  c.strokeStyle='rgba(178,255,242,.13)';c.lineWidth=1;for(let j=0;j<4;j++){const yy=y+((j*83+time*28)%310);c.beginPath();c.moveTo(x+3,yy);c.lineTo(x+3,yy+28);c.stroke();}
 }
 if(zone>=1){
  const spacing=340,start=Math.floor(cameraX*.38/spacing)-1;
  for(let i=start;i<start+6;i++){
   const x=i*spacing-cameraX*.38;
   c.fillStyle='#1d3450';c.fillRect(x,140,35,350);c.fillRect(x+200,175,32,315);
   poly(c,[[x-10,152],[x+106,76],[x+245,172],[x+245,190],[x+106,112],[x-10,174]],'#2b4361');
   c.strokeStyle='rgba(125,200,216,.2)';c.lineWidth=2;c.strokeRect(x+10,176,10,260);
   for(let j=0;j<4;j++){c.fillStyle='rgba(127,206,225,.17)';c.fillRect(x+14,205+j*42,6,12);}
  }
 }
 if(zone===3){
  const x=12450-cameraX,y=236-cameraY;
  aura(c,x,y,310,defeated?'rgba(101,255,215,.22)':'rgba(156,124,255,.24)');
  c.save();c.translate(x,y);for(let k=0;k<3;k++){c.save();c.rotate((k%2?1:-1)*time*.025+k*.3);c.strokeStyle=k===0?'#466384':'#385473';c.lineWidth=k===0?5:2;c.beginPath();c.arc(0,0,155+k*31,0,TAU);c.stroke();for(let j=0;j<12;j++){const a=j*TAU/12;c.save();c.rotate(a);c.fillStyle='#739fb4';c.globalAlpha=.45;c.fillRect(154+k*31,-3,10,6);c.restore();}c.restore();}c.restore();
  for(const dx of [-260,-185,190,265]){c.globalAlpha=.72;crystal(c,x+dx,410-cameraY,dx%2?65:85,160+Math.abs(dx)*.3,defeated?'#7fd3c5':'#8471c2');c.globalAlpha=1;}
 }
 // Broad refracted light fans, subtle enough to preserve danger contrast.
 for(let i=0;i<3;i++){const x=120+i*340+Math.sin(time*.12+i)*30;c.globalAlpha=.035;poly(c,[[x,0],[x+45,0],[x+270,height],[x+90,height]],i%2?'#d5a4ff':'#80ffde');c.globalAlpha=1;}
 const waterY=508-cameraY*.15;
 c.fillStyle='rgba(47,137,153,.12)';c.fillRect(0,waterY,width,height-waterY);
 for(let i=0;i<20;i++){const x=((i*79-cameraX*.17)%width+width)%width,y=waterY+6+(i%6)*7;c.strokeStyle=`rgba(126,228,239,${.06+(i%3)*.02})`;c.beginPath();c.moveTo(x,y);c.lineTo(x+35+Math.sin(time+i)*14,y);c.stroke();}
 // Near ceiling frames the cave, with small gemstones that never mimic traps.
 const start=Math.floor(cameraX*.65/150)-1;
 for(let i=start;i<start+Math.ceil(width/150)+3;i++){const x=i*150-cameraX*.65,v=hash(i+90);poly(c,[[x-10,0],[x+155,0],[x+150,37+v*35],[x+112,58+v*33],[x+78,24],[x+39,65+v*45],[x,38]],'#0b182c');if(i%3===0){c.globalAlpha=.45;crystal(c,x+90,36,13,28,'#7999c5',true);c.globalAlpha=1;}}
 for(let i=0;i<30;i++){const x=((hash(i)*width-cameraX*.09+time*(2+i%3))%width+width)%width,y=100+hash(i+80)*(height-150)+Math.sin(time*.4+i)*8;c.fillStyle=i%4?'rgba(137,235,231,.3)':'rgba(204,174,249,.45)';c.fillRect(x,y,i%3===0?2:1,i%3===0?2:1);}
 c.restore();
}
export function drawCanyonTwoGround(c,tracks,cameraX,width,time){
 for(const t of tracks){if(t.x2<cameraX-100||t.x1>cameraX+width+100)continue;
  if(t.kind==='cave-floor'){
   poly(c,[[t.x1,t.y1],[t.x2,t.y2],[t.x2,830],[t.x1,830]],'#111f33');
   poly(c,[[t.x1,t.y1+15],[t.x2,t.y2+15],[t.x2,t.y2+43],[t.x1,t.y1+58]],'#20344b');
   for(let x=Math.ceil(Math.max(t.x1,cameraX-80)/110)*110;x<t.x2&&x<cameraX+width+80;x+=110){const y=t.y1+(x-t.x1)/(t.x2-t.x1)*(t.y2-t.y1);c.strokeStyle='rgba(116,167,193,.16)';c.beginPath();c.moveTo(x,y+42);c.lineTo(x+19,y+83);c.lineTo(x-10,y+120);c.stroke();if(hash(x)>.6){c.globalAlpha=.5;crystal(c,x,y+115,12,34,'#69aeac');c.globalAlpha=1;}}
  }else{
   poly(c,[[t.x1,t.y1+7],[t.x2,t.y2+7],[t.x2-16,t.y2+27],[t.x1+19,t.y1+32]],'#344563','#7395b5');
   for(let x=t.x1+27;x<t.x2-10;x+=55){c.fillStyle='#85c5cd';c.globalAlpha=.32;c.fillRect(x,t.y1+13,12,3);c.globalAlpha=1;}
   if(t.kind==='platform'){c.globalAlpha=.6;crystal(c,(t.x1+t.x2)/2,t.y1+26,32,63,'#659cae',true);c.globalAlpha=1;}
   if(t.kind==='moving'){aura(c,(t.x1+t.x2)/2,t.y1+35,50,'rgba(137,246,224,.17)');c.strokeStyle='#71c7c5';c.beginPath();c.ellipse((t.x1+t.x2)/2,t.y1+39+Math.sin(time*2)*3,23,5,0,0,TAU);c.stroke();}
  }
 }
}
export function drawCaveHazards(c,crystals,refractors,time,cameraX,width){
 for(const s of crystals){if(s.x<cameraX-100||s.x>cameraX+width+100)continue;
  if(s.state==='spent'){
   const fade=Math.max(0,1-s.timer/1.1);if(fade){aura(c,s.x,s.floor-12,95* (1+s.timer),`rgba(135,220,245,${fade*.25})`);for(let i=0;i<9;i++){const x=s.x+Math.cos(i*2.4)*s.timer*105,y=s.floor-10-Math.sin(i+1)*s.timer*85+s.timer*s.timer*80;c.globalAlpha=fade;poly(c,[[x,y],[x+4,y-8],[x+8,y+3]],'#beedff');}c.globalAlpha=1;}
   for(let i=0;i<4;i++)poly(c,[[s.x-27+i*15,s.floor],[s.x-18+i*15,s.floor-8-i%2*6],[s.x-9+i*15,s.floor]],'#334d64');continue;
  }
  const warning=s.state==='warning',fall=s.state==='falling';
  if(warning||fall){c.fillStyle=warning?'rgba(255,196,113,.2)':'rgba(255,159,112,.3)';c.fillRect(s.x-s.width/2-8,s.floor-6,s.width+16,7);c.strokeStyle='#ffd18d';c.lineWidth=2;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(s.x+i*15-4,s.floor-21);c.lineTo(s.x+i*15,s.floor-16);c.lineTo(s.x+i*15+4,s.floor-21);c.stroke();}
   if(warning){c.strokeStyle='rgba(255,210,139,.2)';c.setLineDash([3,8]);c.beginPath();c.moveTo(s.x,s.y+s.height);c.lineTo(s.x,s.floor-26);c.stroke();c.setLineDash([]);for(let i=0;i<4;i++){const y=s.ceiling+s.height+((s.timer*110+i*29)%100);c.fillStyle='#ffe0a2';c.fillRect(s.x+Math.sin(i*4)*12,y,2,3);}}
  }
  const x=s.x+(warning?Math.sin(s.timer*62)*3:0);aura(c,x,s.y+s.height*.6,70,warning?'rgba(255,190,100,.19)':'rgba(135,190,255,.08)');
  crystal(c,x,s.y,s.width,s.height,warning?'#e6ad88':'#a8b9e8',true);
  if(warning){c.strokeStyle='#fff0ba';c.lineWidth=2;c.beginPath();c.moveTo(x-7,s.y+20);c.lineTo(x+3,s.y+35);c.lineTo(x-5,s.y+54);c.stroke();}
 }
 for(const r of refractors){if(r.x<cameraX-240||r.x>cameraX+width+240)continue;const st=refractorState(r,time),p=st.points;
  // The pedestal and end catcher visibly anchor every beam segment.
  c.strokeStyle='#496a85';c.lineWidth=5;c.beginPath();c.moveTo(r.x,r.floor-130);c.lineTo(r.x,r.floor);c.stroke();
  c.save();c.translate(r.x,r.floor-155);c.rotate(st.warning||st.active?Math.PI/4:Math.PI/4+Math.sin(time*.6+r.phase)*.18);poly(c,[[-17,-17],[17,-17],[17,17],[-17,17]],st.active?'#d0fff3':'#597f9c','#9ee1df');c.restore();
  for(const end of [p[0],p[2]]){c.fillStyle='#3e6077';c.fillRect(end.x-10,end.y-7,20,14);}
  if(st.warning||st.active){aura(c,r.x,r.floor-155,65,`rgba(162,250,225,${.08+st.charge*.16})`);c.save();c.strokeStyle=st.active?'#8effe6':'#f4d599';c.lineWidth=st.active?8:2;if(!st.active)c.setLineDash([7,7]);c.beginPath();p.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.stroke();if(st.active){c.strokeStyle='#effff9';c.lineWidth=2;c.stroke();}c.restore();}
 }
}
export function drawCaveTunnel(c,t,profile){
 const a=profile[0],b=profile.at(-1),w=b.x-a.x;
 poly(c,[[a.x,a.y-145],[a.x+w*.25,a.y-169],[a.x+w*.62,b.y-151],[b.x,b.y-165],[b.x,b.y-26],[a.x,a.y-26]],'#233c50','#547082');
 poly(c,[[a.x+7,a.y-133],[a.x+w*.3,a.y-155],[a.x+w*.62,b.y-134],[b.x-9,b.y-149],[b.x-9,b.y-72],[a.x+7,a.y-85]],'#2c4d60');
 c.strokeStyle='#87b8c5';c.globalAlpha=.5;c.lineWidth=1;c.beginPath();c.moveTo(a.x+w*.3,a.y-155);c.lineTo(a.x+w*.4,a.y-112);c.lineTo(a.x+w*.64,a.y-90);c.stroke();c.globalAlpha=1;
 c.strokeStyle='#f4c77e';c.lineWidth=4;c.beginPath();profile.forEach((p,i)=>i?c.lineTo(p.x,p.y-26):c.moveTo(p.x,p.y-26));c.stroke();
 c.fillStyle='#ffe5af';c.font='bold 13px system-ui';c.fillText('↓ SLIDE',a.x+15,a.y-48);
}

// Scenic, non-playable approaches connect each region's two parts.
export const PART_APPROACH_SECONDS=5.6;
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const p=clamp(n);return p*p*(3-2*p);};
export function partApproachHeight(stage,progress){
 const p=clamp(progress);
 if(p===1)return 0;
 return stage===2?-116*(1-smooth(p)):-24*Math.sin(Math.PI*p)**2;
}
function line(c,x,y,a,b,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();}
function crystal(c,x,y,h,glow){
 c.fillStyle="#514b82";c.beginPath();c.moveTo(x-22,y);c.lineTo(x-8,y-h*.72);c.lineTo(x+7,y-h);c.lineTo(x+29,y);c.closePath();c.fill();
 c.fillStyle="#a48cba";c.beginPath();c.moveTo(x+7,y-h);c.lineTo(x+10,y);c.lineTo(x+29,y);c.fill();
 line(c,x+7,y-h,x+10,y,glow,3);
}
let approachCanvas;
export function drawPartApproach(c,scene){
 const {VIEW_W,VIEW_H,cameraX,cameraY,endX}=scene;
 approachCanvas??=document.createElement("canvas");
 if(approachCanvas.width!==VIEW_W||approachCanvas.height!==VIEW_H){approachCanvas.width=VIEW_W;approachCanvas.height=VIEW_H;}
 const layer=approachCanvas.getContext("2d");
 layer.setTransform(1,0,0,1,0,0);layer.clearRect(0,0,VIEW_W,VIEW_H);
 layer.save();layer.translate(-cameraX,-cameraY);drawApproachScene(layer,scene);layer.restore();
 // Fade scenery into the live level instead of exposing a vertical seam.
 layer.globalCompositeOperation="destination-in";
 const edge=layer.createLinearGradient(endX-380-cameraX,0,endX-cameraX,0);
 edge.addColorStop(0,"#fff");edge.addColorStop(1,"#fff0");layer.fillStyle=edge;layer.fillRect(0,0,VIEW_W,VIEW_H);
 layer.globalCompositeOperation="source-over";c.drawImage(approachCanvas,cameraX,cameraY);
}
function drawApproachScene(c,{stage,startX,endX,floorY,time,cameraX,cameraY,VIEW_W,VIEW_H}){
 const left=startX-450,right=endX+2,span=endX-startX;
 const floor=x=>floorY+partApproachHeight(stage,(x-startX)/span);
 c.save();
 // Only paint the approach extension: the playable world's first pixel stays intact.
 c.beginPath();c.rect(left,cameraY-100,right-left,VIEW_H+300);c.clip();
 const sky=c.createLinearGradient(0,0,0,540);
 sky.addColorStop(0,stage===1?"#08242e":"#373c69");
 sky.addColorStop(1,stage===1?"#235349":"#182b48");
 c.fillStyle=sky;c.fillRect(left,cameraY-100,right-left,VIEW_H+300);
 if(stage===1){
   // The familiar luminous canopy grows into immense trunks as Flux approaches Helix.
   for(let layer=0;layer<3;layer++){
     const spacing=layer===2?330:210;
     for(let x=left-200;x<right+400;x+=spacing){
       const p=clamp((x-startX)/span),w=14+p*55+layer*6;
       const tx=x+(cameraX-startX)*(1-layer*.3)*.15,y=floor(x),h=190+p*330;
       c.fillStyle=["#1d4548","#143b3d","#102c31"][layer];
       c.beginPath();c.moveTo(tx-w*2,y);c.bezierCurveTo(tx-w,y-80,tx-w*.4,y-h+80,tx-w*.7,y-h);
       c.lineTo(tx+w*.6,y-h);c.bezierCurveTo(tx+w*.35,y-h+80,tx+w,y-60,tx+w*2,y);c.fill();
       line(c,tx,y-h*.65,tx+80+p*60,y-h*.89,"#1b4544",w*.5);
       c.fillStyle=layer===2?"#174c41":"#25574c";
       c.beginPath();c.ellipse(tx+20,y-h,95+p*95,53,0,0,Math.PI*2);c.fill();
       if(layer===2){
         line(c,tx-w*.32,y-30,tx-w*.1,y-h*.9,"#7ad9b14d",2);
         for(let j=0;j<5;j++){
           const yy=y-h*.4-j*35;
           line(c,tx+w*.8,yy,tx+w*.8+15,yy-12,"#72dbb574",3);
         }
       }
     }
   }
   // Abandoned conduit and a distant factory silhouette foreshadow the destination.
   const fx=endX-340;
   c.fillStyle="#18323b";c.fillRect(fx,floorY-210,270,180);
   c.beginPath();c.moveTo(fx,floorY-210);c.lineTo(fx+60,floorY-255);c.lineTo(fx+60,floorY-210);c.lineTo(fx+130,floorY-255);c.lineTo(fx+130,floorY-210);c.lineTo(fx+270,floorY-210);c.fill();
   for(let i=0;i<5;i++){c.fillStyle=i===2?"#82dab56a":"#527e7e40";c.fillRect(fx+22+i*48,floorY-180,17,39);}
   line(c,startX+400,floorY-70,endX,floorY-70,"#335857",12);
   line(c,startX+400,floorY-74,endX,floorY-74,"#75b8a449",2);
 }else{
   // Open canyon, cascading water, then the shelter of a crystal-lined cave mouth.
   for(let i=0;i<10;i++){
     const x=left+i*220-(cameraX*.12)%220;
     c.fillStyle=i%2?"#383a5e":"#454363";
     c.beginPath();c.moveTo(x-130,520);c.lineTo(x-70,100+(i%3)*45);c.lineTo(x+40,50+(i%4)*50);c.lineTo(x+140,520);c.fill();
   }
   const wx=startX+490;
   const water=c.createLinearGradient(wx,0,wx+110,0);water.addColorStop(0,"#83cbf900");water.addColorStop(.45,"#9feaff91");water.addColorStop(1,"#74bcf21c");
   c.fillStyle=water;c.fillRect(wx,-20,110,650);
   for(let i=0;i<18;i++)line(c,wx+7+(i*29)%94,((i*83+time*210)%620)-40,wx+7+(i*29)%94,((i*83+time*210)%620)+35,"#dcfaff66",1.5);
   for(let i=0;i<12;i++){
     const x=startX-150+i*145;
     crystal(c,x,floor(x)+10,65+(i%4)*22,"#d2b7f79c");
   }
   const mouth=startX+870;
   c.fillStyle="#101d32";c.beginPath();c.moveTo(mouth-150,-100);c.lineTo(right+200,-100);c.lineTo(right+200,100);
   c.bezierCurveTo(mouth+250,90,mouth+120,70,mouth+80,145);c.lineTo(mouth-20,185);c.lineTo(mouth-100,80);c.fill();
   c.fillStyle="#202c45";c.beginPath();c.moveTo(mouth-150,0);c.lineTo(mouth-35,95);c.lineTo(mouth+30,220);c.lineTo(mouth+55,110);c.lineTo(mouth+200,90);c.lineTo(right,68);c.lineTo(right,-20);c.fill();
   for(let i=0;i<5;i++){
     c.save();c.translate(mouth+90+i*115,65);c.scale(.6,-.7);crystal(c,0,0,90+(i%2)*35,"#caacffab");c.restore();
   }
 }
 // The road follows exactly the same height function as the animated actor.
 const ground=c.createLinearGradient(0,floorY-120,0,600);ground.addColorStop(0,stage===1?"#194339":"#34405a");ground.addColorStop(1,"#0b192a");
 c.fillStyle=ground;c.beginPath();c.moveTo(left,650);
 for(let x=left;x<right;x+=12)c.lineTo(x,floor(x));
 c.lineTo(right,floor(right));c.lineTo(right,650);c.closePath();c.fill();
 c.strokeStyle=stage===1?"#83d7b5":"#ada4da";c.lineWidth=4;c.beginPath();
 for(let x=left;x<=right;x+=12){if(x===left)c.moveTo(x,floor(x));else c.lineTo(x,floor(x));}c.stroke();
 // Drifting pollen or refracted mist catches light without obscuring Flux.
 for(let i=0;i<32;i++){
   const x=left+((i*197+time*(stage===1?17:9))%(right-left)),y=80+(i*71)%320+Math.sin(time+i)*13;
   c.fillStyle=stage===1?"#b5ffce77":"#d3c7ff77";c.beginPath();c.arc(x,y,1.4+(i%3)*.5,0,Math.PI*2);c.fill();
 }
 c.restore();
}

// Shared visual identity for campaign collectibles, HUD and transformations.
export function drawMemoryCore(ctx,x,y,time=0,scale=1,missing=false){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(time*.6);
 ctx.fillStyle=missing?"#000000":"#a86ff6";ctx.strokeStyle=missing?"#000000":"#ffdf9a";ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(18,0);ctx.lineTo(0,18);ctx.lineTo(-18,0);ctx.closePath();ctx.fill();ctx.stroke();
 if(!missing){ctx.fillStyle="#fff3ce";ctx.fillRect(-3,-3,6,6);}ctx.restore();
}
export function drawBoostEnergy(ctx,x,y,time=0){
 ctx.save();ctx.translate(x,y);ctx.fillStyle="#8bffe8";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#c8fff5";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,18+Math.sin(time*4)*2,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle="#153b4c";ctx.beginPath();ctx.moveTo(3,-8);ctx.lineTo(-5,1);ctx.lineTo(0,1);ctx.lineTo(-2,8);ctx.lineTo(6,-2);ctx.lineTo(1,-2);ctx.closePath();ctx.fill();ctx.restore();
}
export function drawBreakWall(ctx,b){
 ctx.save();ctx.fillStyle=b.type==="membrane"?"#985ee5aa":"#ac507a";ctx.fillRect(b.x,b.y,b.w,b.h);
 if(b.type==="membrane"){ctx.strokeStyle="#c2a0ff";ctx.lineWidth=2;for(let y=b.y+10;y<b.y+b.h;y+=20){ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y+8);ctx.stroke();}}
 ctx.strokeStyle="#ffd4df";ctx.lineWidth=2;ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+b.w*.6,b.y+b.h*.4);ctx.lineTo(b.x+5,b.y+b.h*.65);ctx.lineTo(b.x+b.w,b.y+b.h);ctx.stroke();ctx.restore();
}

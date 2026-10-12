export function drawSovereignProjectile(ctx,shot,t){
 if(shot.orb){ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(t*3);ctx.shadowColor="#b46eff";ctx.shadowBlur=18;ctx.fillStyle="#19082f";ctx.strokeStyle="#d3a0ff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,17+Math.sin(t*8)*2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-8,-11);ctx.lineTo(3,-3);ctx.lineTo(-4,4);ctx.lineTo(9,12);ctx.stroke();ctx.restore();return;}
 ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(Math.atan2(shot.vy,shot.vx));
 ctx.strokeStyle="#b46eff";ctx.lineWidth=3;ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-31,0);ctx.stroke();ctx.globalAlpha=1;
 ctx.shadowColor="#b46eff";ctx.shadowBlur=8+4*Math.sin(t*12+shot.x*.02);ctx.fillStyle="#7c3de0";ctx.strokeStyle="#e9c5ff";ctx.lineWidth=1.5;
 ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-4,-7);ctx.lineTo(-10,0);ctx.lineTo(-4,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
 ctx.strokeStyle="#f3dcff";ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,0);ctx.stroke();ctx.restore();
}
export function drawSovereignEnergy(ctx,x,y,t){
 ctx.save();ctx.translate(x,y);ctx.strokeStyle="#b96cff";ctx.lineWidth=2.5;
 ctx.globalAlpha=.45+.4*(1+Math.sin(t*6))*.5;ctx.shadowColor="#bd79ff";ctx.shadowBlur=9+5*Math.sin(t*6);
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*14,-8);ctx.lineTo(side*28,-31);ctx.lineTo(side*20,-55);ctx.lineTo(side*34,-78);ctx.moveTo(side*14,14);ctx.lineTo(side*30,37);ctx.lineTo(side*21,56);ctx.lineTo(side*30,73);ctx.stroke();}
 ctx.shadowBlur=0;
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7+t*.35,r=46+Math.sin(t*5+i)*12;ctx.globalAlpha=.3+.3*(1+Math.sin(t*6+i))*.5;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r-30);ctx.lineTo(Math.cos(a+.16)*(r+24),Math.sin(a+.16)*(r+24)-30);ctx.lineTo(Math.cos(a)*(r+48),Math.sin(a)*(r+48)-30);ctx.stroke();}
 ctx.globalAlpha=.2+.15*Math.sin(t*5);ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,-28,83,115,0,0,Math.PI*2);ctx.stroke();ctx.restore();
}

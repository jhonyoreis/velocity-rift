// A new visual identity for the obstacle-only gauntlet before the Architect.
// Coordinates are computed relative to camera position for endless coverage.
export function renderRiftCorridorBackground(ctx,{cameraX,cameraY,VIEW_W,VIEW_H,time=0}){
  const gradient=ctx.createLinearGradient(cameraX,cameraY,cameraX,cameraY+VIEW_H);
  gradient.addColorStop(0,"#090c28");
  gradient.addColorStop(.52,"#2a1650");
  gradient.addColorStop(1,"#102d43");
  ctx.fillStyle=gradient;
  ctx.fillRect(cameraX,cameraY,VIEW_W,VIEW_H);

  // Broken pillars in three depths, all correctly culled with parallax.
  for(const [step,shift,color] of [[310,.16,"#15173b"],[220,.33,"#201b4c"],[170,.60,"#303068"]]){
    const first=Math.floor(cameraX*shift/step)-2;
    const last=Math.ceil((cameraX*shift+VIEW_W)/step)+2;
    ctx.fillStyle=color;
    for(let i=first;i<=last;i++){
      const x=i*step+cameraX*(1-shift),variation=((i%5)+5)%5;
      const top=165+variation*34;
      ctx.fillRect(x,top,step*.56,VIEW_H+cameraY-top+125);
      ctx.fillStyle=shift>.3?"rgba(123,255,239,.23)":"rgba(204,148,255,.16)";
      ctx.fillRect(x+step*.1,top+17,6,96+variation*10);
      ctx.fillStyle=color;
    }
  }
  // Cracks and rift fragments float behind the active platforms.
  const step=265,shift=.30,first=Math.floor(cameraX*shift/step)-2;
  const last=Math.ceil((cameraX*shift+VIEW_W)/step)+2;
  for(let i=first;i<=last;i++){
    const x=i*step+cameraX*(1-shift)+115;
    const y=118+(Math.abs(i)%3)*48+Math.sin(time*1.2+i)*7;
    ctx.strokeStyle="rgba(194,156,255,.50)";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(x,y-51);ctx.lineTo(x-15,y-8);
    ctx.lineTo(x+13,y+21);ctx.lineTo(x-4,y+56);ctx.stroke();
    ctx.fillStyle="rgba(128,251,237,.15)";
    ctx.beginPath();ctx.moveTo(x+38,y-29);ctx.lineTo(x+73,y-8);
    ctx.lineTo(x+46,y+27);ctx.closePath();ctx.fill();
  }
}

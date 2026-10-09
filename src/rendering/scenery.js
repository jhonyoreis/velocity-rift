export function cityParallaxRange(cameraX,VIEW_W,step,shift){
  return {
    first:Math.floor(cameraX*shift/step)-2,
    last:Math.ceil((cameraX*shift+VIEW_W)/step)+2
  };
}
export function renderCityBackground(ctx,{cameraX,VIEW_W,tracks}){
  // Parallax layers of staggered towers, rooftop facades and illuminated
  // windows. Both the low street and high rooftops remain navigable.
  for(const [step,shift,color] of [[222,.17,"#121e41"],
    [170,.33,"#19294d"],[140,.57,"#233860"]]){
    // World coordinate x=i*step+cameraX*(1-shift) corresponds to
    // screen x=i*step-cameraX*shift. Cull by that SAME parallax factor.
    const {first,last}=cityParallaxRange(cameraX,VIEW_W,step,shift);
    ctx.fillStyle=color;
    for(let i=first;i<=last;i++){
      const x=i*step+cameraX*(1-shift);
      const height=195+((i%5+5)%5)*43;
      ctx.fillRect(x,460-height,step*.72,height+160);
      if(shift>.3){
        ctx.fillStyle=shift>.5?"rgba(255,199,161,.32)":"rgba(113,248,255,.20)";
        for(let row=0;row<6;row++)for(let col=0;col<3;col++){
          if((row*3+col+i)%5===0)continue;
          ctx.fillRect(x+18+col*29,474-height+row*36,8,13);
        }
        ctx.fillStyle=color;
      }
    }
  }
  for(const floor of tracks){
    if(floor.kind!=="city-roof"||floor.x2<cameraX-30||floor.x1>cameraX+VIEW_W+30)continue;
    ctx.fillStyle="#172d4d";
    ctx.fillRect(floor.x1,floor.y1+6,floor.x2-floor.x1,570-floor.y1);
    ctx.fillStyle="rgba(111,254,229,.52)";
    for(let x=floor.x1+23;x<floor.x2-15;x+=47)
      for(let y=floor.y1+29;y<510;y+=52)
        if((Math.floor(x/47)+Math.floor(y/52))%4!==0)
          ctx.fillRect(x,y,15,20);
    ctx.strokeStyle="#d9b7fa";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(floor.x1,floor.y1);
    ctx.lineTo(floor.x2,floor.y2);ctx.stroke();
  }
  ctx.strokeStyle="rgba(131,245,241,.27)";
  for(let i=0;i<7;i++){
    const x=Math.floor(cameraX/420)*420+i*420-80;
    ctx.beginPath();ctx.moveTo(x,160);ctx.lineTo(x+210,160);ctx.stroke();
  }
}
export function renderForest(ctx,{cameraX,VIEW_W,groundY}){
  // Procedural shapes repeat without external assets and are culled off-screen.
  const first = Math.floor(cameraX / 235) - 2;
  const last = Math.ceil((cameraX + VIEW_W) / 235) + 2;
  for (let i = first; i <= last; i += 1) {
    const x = i * 235 + 115, ground = groundY(x);
    if (ground == null) continue;
    const height = 55 + ((i % 4 + 4) % 4) * 21;
    ctx.fillStyle = i % 2 ? "#123e42" : "#17555a";
    ctx.fillRect(x - 6, ground - height + 18, 12, height);
    ctx.fillStyle = i % 3 ? "#18766f" : "#22918b";
    ctx.beginPath();
    ctx.moveTo(x - 47, ground - height + 20);
    ctx.lineTo(x, ground - height - 30);
    ctx.lineTo(x + 47, ground - height + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5bf0df";
    ctx.fillRect(x - 3, ground - height + 4, 6, 6);
  }
}

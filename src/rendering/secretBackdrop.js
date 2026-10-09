export function getSecretBackdropPalette(id){
  const palettes={
    canopy:["rgba(5,54,41,.65)","rgba(117,246,137,.26)","◆"],
    lumen:["rgba(20,35,72,.70)","rgba(179,222,255,.30)","✧"],
    horizon:["rgba(54,27,42,.65)","rgba(255,191,115,.25)","➤"],
    echo:["rgba(21,15,72,.69)","rgba(153,124,255,.30)","◉"],
    prism:["rgba(44,15,69,.65)","rgba(249,118,232,.25)","◇"],
    zenith:["rgba(37,15,67,.74)","rgba(246,166,206,.28)","✦"],
    antenna:["rgba(10,29,61,.77)","rgba(137,250,248,.38)","⚡"],
    underpass:["rgba(23,18,58,.76)","rgba(213,154,255,.38)","◇"],
    skyline:["rgba(14,25,63,.76)","rgba(255,196,143,.38)","✦"]
  };
return palettes[id]??["rgba(18,28,49,.72)","rgba(142,245,220,.28)","◇"];
}
export function renderSecretBackdrop(ctx,trial,{cameraX,cameraY,VIEW_W,VIEW_H}){
  const [fill,line,symbol]=getSecretBackdropPalette(trial.id);
  ctx.save();
  ctx.fillStyle=fill;ctx.fillRect(cameraX,cameraY,VIEW_W,VIEW_H);
  ctx.strokeStyle=line;ctx.lineWidth=3;
  for(const x of [trial.leftBound+40,trial.rightBound-40]){
    ctx.beginPath();ctx.moveTo(x,trial.targetY-110);
    ctx.lineTo(x,trial.startY+95);ctx.stroke();
  }
  ctx.font="bold 32px system-ui";ctx.textAlign="center";ctx.fillStyle=line;
  for(const pad of trial.platforms)ctx.fillText(symbol,pad.x+75,pad.y-48);
  ctx.restore();
}

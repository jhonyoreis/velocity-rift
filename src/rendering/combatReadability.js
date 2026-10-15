import {offscreenTarget} from "../game/combatReadability.js";
export function drawDashCharge(ctx,state,x=245,y=37){
 if(state==="hidden")return;
 const ready=state==="ready",color=ready?"#ffe095":state==="active"?"#a6fff1":"#667a88";
 ctx.save();ctx.translate(x,y);ctx.fillStyle="#071725df";ctx.beginPath();ctx.roundRect(-26,-24,52,61,9);ctx.fill();
 ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha=ready?1:.65;
 ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.stroke();
 ctx.shadowColor=color;ctx.shadowBlur=ready?9:0;ctx.lineWidth=3;
 for(const offset of [-6,3]){ctx.beginPath();ctx.moveTo(offset-3,-6);ctx.lineTo(offset+4,0);ctx.lineTo(offset-3,6);ctx.stroke();}
 ctx.shadowBlur=0;ctx.fillStyle=color;ctx.font="bold 9px system-ui";ctx.textAlign="center";ctx.fillText("DASH",0,29);ctx.restore();
}
// Compact mobile-friendly offscreen markers: arrow plus distinct symbol,
// no text or long pill masking the action at the screen edges.
export function drawSovereignDirections(ctx,s,W=960,H=540){
 const boss=s.boss;
 if(s.story||s.victory||s.defeat||boss.defeated||
   !["chase","arena","scarlet","invincible"].includes(boss.mode))return;
 const targets=[{...boss,color:"#dda2ff",core:false}];
 if(boss.resonance&&boss.resonance.warning===0)
  targets.push({...boss.resonance,color:"#ff759a",core:true});
 const markers=targets
  .map(target=>({target,marker:offscreenTarget(target,s.cameraX,s.cameraY,W,H)}))
  .filter(item=>item.marker);
 // Leave enough space between the two icons when both targets are offscreen
 // in the same direction.
 if(markers.length===2&&markers[0].marker.side===markers[1].marker.side&&
   Math.abs(markers[0].marker.y-markers[1].marker.y)<56){
  markers[0].marker.y=Math.min(markers[0].marker.y,H-112);
  markers[1].marker.y=markers[0].marker.y+56;
 }
 for(const {target,marker:m} of markers){
  const inward=m.x>W/2?-1:1;
  const cx=m.x+inward*42,cy=m.y;
  ctx.save();
  // Small capsule around the crown or Rubro energy shard.
  ctx.fillStyle="#080d25eb";ctx.strokeStyle=target.color;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(cx-23,cy-19,46,38,10);ctx.fill();ctx.stroke();
  ctx.save();
  ctx.translate(m.x,m.y);
  ctx.rotate(Math.atan2(target.y-s.cameraY-m.y,target.x-s.cameraX-m.x));
  ctx.fillStyle=target.color;
  ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-7);ctx.lineTo(-6,7);
  ctx.closePath();ctx.fill();ctx.restore();
  ctx.save();ctx.translate(cx,cy);
  ctx.strokeStyle=target.color;ctx.fillStyle="#fff0ca";ctx.lineWidth=2;
  if(target.core){
   ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(3,-9);ctx.lineTo(-5,1);ctx.lineTo(0,1);
   ctx.lineTo(-3,9);ctx.lineTo(7,-3);ctx.lineTo(2,-3);
   ctx.closePath();ctx.fill();
  }else{
   ctx.beginPath();ctx.moveTo(-13,8);ctx.lineTo(-13,-6);
   ctx.lineTo(-7,-2);ctx.lineTo(0,-10);ctx.lineTo(7,-2);
   ctx.lineTo(13,-6);ctx.lineTo(13,8);ctx.closePath();ctx.stroke();
   ctx.beginPath();ctx.arc(0,3,2.5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  ctx.restore();
 }
}

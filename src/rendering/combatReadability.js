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
export function drawSovereignDirections(ctx,s,W=960,H=540){
 const b=s.boss;if(s.story||s.victory||s.defeat||b.defeated||!["chase","arena","scarlet","invincible"].includes(b.mode))return;
 const targets=[{...b,label:"SOBERANO",color:"#dda2ff",core:false}];
 if(b.resonance&&b.resonance.warning===0)targets.push({...b.resonance,label:"RUBRO",color:"#ff759a",core:true});
 const markers=targets.map(target=>({target,marker:offscreenTarget(target,s.cameraX,s.cameraY,W,H)})).filter(x=>x.marker);
 if(markers.length===2&&markers[0].marker.side===markers[1].marker.side&&Math.abs(markers[0].marker.y-markers[1].marker.y)<62){
  markers[0].marker.y=Math.min(markers[0].marker.y,H-215);markers[1].marker.y=markers[0].marker.y+65;
 }
 for(const {target,marker:m} of markers){
  const inward=m.x>W/2?-1:1,px=inward===1?m.x+15:m.x-119;
  ctx.save();ctx.fillStyle="#080d25eb";ctx.beginPath();ctx.roundRect(px,m.y-20,104,40,10);ctx.fill();
  ctx.strokeStyle=target.color;ctx.lineWidth=1;ctx.stroke();
  ctx.translate(m.x,m.y);ctx.rotate(Math.atan2(target.y-s.cameraY-m.y,target.x-s.cameraX-m.x));ctx.fillStyle=target.color;
  ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-7);ctx.lineTo(-5,7);ctx.closePath();ctx.fill();ctx.restore();
  ctx.save();ctx.fillStyle=target.color;ctx.textAlign="center";ctx.font="bold 10px system-ui";
  ctx.fillText(target.label,px+52,m.y+12);
  if(target.core){ctx.strokeStyle=target.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(px+52,m.y-7,8,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#fff0ca";ctx.beginPath();ctx.moveTo(px+54,m.y-14);ctx.lineTo(px+48,m.y-6);ctx.lineTo(px+52,m.y-6);ctx.lineTo(px+50,m.y);ctx.lineTo(px+57,m.y-9);ctx.lineTo(px+53,m.y-9);ctx.closePath();ctx.fill();}
  else {ctx.strokeStyle=target.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+40,m.y-5);ctx.lineTo(px+40,m.y-12);ctx.lineTo(px+47,m.y-7);ctx.lineTo(px+52,m.y-15);ctx.lineTo(px+57,m.y-7);ctx.lineTo(px+64,m.y-12);ctx.lineTo(px+64,m.y-5);ctx.closePath();ctx.stroke();}
  ctx.restore();
 }
}

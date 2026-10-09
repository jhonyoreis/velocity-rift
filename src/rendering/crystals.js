// Red-orange multifaceted gem; original procedural canvas art inspired by reference.
export function renderCrystal(ctx,{x,y,r=8},time=0){
 const s=r*1.5,bob=Math.sin(time*3.6+x*.08)*2;
 ctx.save();ctx.translate(x,y+bob);
 ctx.shadowColor="#ff7a24";ctx.shadowBlur=10;ctx.lineJoin="round";
 ctx.beginPath();ctx.moveTo(0,-s*1.16);ctx.lineTo(s*.72,-s*.52);
 ctx.lineTo(s*.72,s*.45);ctx.lineTo(0,s*1.18);
 ctx.lineTo(-s*.72,s*.52);ctx.lineTo(-s*.72,-s*.50);ctx.closePath();
 ctx.fillStyle="#b72116";ctx.fill();ctx.lineWidth=1.15;
 ctx.strokeStyle="#ffe478";ctx.stroke();ctx.shadowBlur=0;
 const facet=(pts,color)=>{
   ctx.beginPath();pts.forEach(([a,b],i)=>{
     if(i===0)ctx.moveTo(a*s,b*s);else ctx.lineTo(a*s,b*s);
   });ctx.closePath();ctx.fillStyle=color;ctx.fill();
 };
 facet([[0,-1.16],[.72,-.52],[.26,-.30],[0,-.61]],"#ffbc32");
 facet([[0,-1.16],[0,-.61],[-.3,-.27],[-.72,-.50]],"#ff6b1f");
 facet([[-.72,-.50],[-.3,-.27],[-.15,.45],[-.72,.52]],"#d52c15");
 facet([[0,-.61],[.26,-.30],[.33,.48],[-.15,.45],[-.3,-.27]],"#ff4318");
 facet([[.26,-.30],[.72,-.52],[.72,.45],[.33,.48]],"#fd7d16");
 facet([[-.72,.52],[-.15,.45],[0,1.18]],"#a91b18");
 facet([[-.15,.45],[.33,.48],[0,1.18]],"#f13b14");
 facet([[.33,.48],[.72,.45],[0,1.18]],"#ed5a0d");
 ctx.strokeStyle="#fff1a1";ctx.lineWidth=1.3;
 ctx.beginPath();ctx.moveTo(-s*.30,-s*.37);ctx.lineTo(-s*.30,s*.18);ctx.stroke();
 ctx.restore();
}

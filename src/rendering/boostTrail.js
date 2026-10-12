export const BOOST_COLORS={base:"#59f4e6",rubro:"#ff456d"};
export function drawBoostTrail(ctx,trail,rubro=false){
 ctx.save();
 for(const dot of trail){ctx.globalAlpha=Math.max(0,Math.min(.65,dot.life/.24));ctx.fillStyle=(dot.rubro??rubro)?BOOST_COLORS.rubro:BOOST_COLORS.base;ctx.beginPath();ctx.arc(dot.x,dot.y,16*Math.max(0,dot.life)/.24,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}

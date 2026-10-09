// Normal hits cost at least eight or 35% of held crystals. A pit ends the run.
export function calculateCrystalDamage(amount,{fall=false}={}){
 const current=Math.max(0,Math.floor(Number(amount)||0));
 if(fall)return {remaining:0,lost:current,dead:true};
 if(current===0)return {remaining:0,lost:0,dead:true};
 const lost=Math.min(current,Math.max(8,Math.ceil(current*.35)));
 return {remaining:current-lost,lost,dead:false};
}

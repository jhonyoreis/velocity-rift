import {RUBRO} from "./rubro.js";
// Normal hits cost at least twelve or 50% of held crystals. A pit ends the run.
export function calculateCrystalDamage(amount,{fall=false,rubro=false,crush=false}={}){
 const current=Math.max(0,Math.floor(Number(amount)||0));
 if(fall||crush)return {remaining:0,lost:current,dead:true};
 if(current===0)return {remaining:0,lost:0,dead:true};
 const lost=Math.min(current,Math.max(rubro?RUBRO.minDamage:12,Math.ceil(current*(rubro?RUBRO.damageFraction:.50))));
 return {remaining:current-lost,lost,dead:false};
}

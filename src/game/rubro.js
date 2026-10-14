export const RUBRO={threshold:20,transformSeconds:.9,speed:1.4,jump:1.22,boost:1.5,dash:1.3,damageFraction:.20,minDamage:4};
export const createRubroState=()=>({active:false,transformTime:0});
export function activateRubro(state,unlocked,crystals){
 if(!unlocked||crystals<RUBRO.threshold||state.active||state.transformTime>0)return false;
 state.transformTime=RUBRO.transformSeconds;return true;
}
export function updateRubro(state,dt,crystals){
 if(crystals<=0){resetRubro(state);return;}
 if(state.transformTime>0){state.transformTime=Math.max(0,state.transformTime-dt);if(state.transformTime<1e-8){state.transformTime=0;state.active=true;}}
}
export function resetRubro(state){state.active=false;state.transformTime=0;}
export function rubroCanBreak(state,boosting,dashing){return state.active&&(boosting||dashing);}

// All colors are based on absolute world units/second, so permanent boost
// upgrades, slopes and dashes remain comparable across runs.
export const SPEED_STOPS=Object.freeze([
 {upTo:70,color:"#88919b",name:"cinza"},
 {upTo:160,color:"#377bf5",name:"azul"},
 {upTo:260,color:"#26cfe0",name:"ciano"},
 {upTo:380,color:"#43ca80",name:"verde"},
 {upTo:490,color:"#ead34f",name:"amarelo"},
 {upTo:610,color:"#ff953e",name:"laranja"},
 {upTo:Infinity,color:"#fa4b54",name:"vermelho"}
]);
export const SPEEDOMETER_SCALE=1200;
export function speedometer(speed){
 const value=Number.isFinite(speed)?Math.max(0,Math.abs(speed)):0;
 const stop=SPEED_STOPS.find(s=>value<=s.upTo)||SPEED_STOPS.at(-1);
 return {value:Math.round(value),fraction:Math.min(1,value/SPEEDOMETER_SCALE),
   color:stop.color,colorName:stop.name};
}

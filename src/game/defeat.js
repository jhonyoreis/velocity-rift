export const DEFEAT_SECONDS=1.05;
export function createDefeat({x,y,facing=1,rubro=false,fall=false,lost=0}){return {elapsed:0,x,y,facing,rubro,fall,lost,notified:false};}
export function sampleDefeat(d){const p=Math.min(1,d.elapsed/DEFEAT_SECONDS);return {x:d.x-d.facing*28*Math.min(1,p*2),y:d.y-28*Math.sin(Math.PI*Math.min(1,p*1.6))+12*p,rotation:d.facing*p*1.4,alpha:Math.max(.12,1-Math.max(0,p-.6)*2),done:p>=1};}

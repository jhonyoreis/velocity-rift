// The canopy motif grows into a sixteen-bar industrial arrangement. The
// greenhouse answers it with glass harmonics; shutdown leaves the forest pad.
export function forestTwoScore(step,zone=0,boss=false,shutdown=false){
 const bpm=boss?132:114,unit=60/bpm/4,beat=step%16,bar=Math.floor(step/16)%16;
 const garden=zone===4||zone===5,reactor=zone>=6&&zone<8;
 const roots=garden?[43,43,38,41,46,43,38,36]:reactor?[38,36,41,38,43,41,36,38]:[38,38,43,41,38,45,43,36];
 const root=roots[bar%8],quiet=shutdown||zone===8;
 const motif=[0,null,7,10,null,7,3,null,5,7,null,12,10,null,3,7,0,3,null,7,12,null,10,7,5,null,3,0,null,7,3,null];
 const answer=[12,null,10,7,null,3,7,null,10,null,14,12,7,null,3,null,7,10,null,12,15,null,12,10,7,null,5,3,null,0,null,null];
 const notes=[];const add=(midi,duration,gain,voice)=>notes.push({midi,duration:duration*unit,gain,voice});
 if(beat%4===0&&!quiet)add(root+([0,0,7,3][beat/4]),2.8,.078,'bass');
 if(beat===0)for(const n of [0,3,7,10])add(root+24+n,14,quiet?.015:.012,'pad');
 const lead=(bar>=8||garden?answer:motif)[step%32];
 if(lead!==null&&bar%8!==7&&(!quiet||beat%4===0))add(root+36+lead,quiet?3:1.8,quiet?.032:.048,'glass');
 if(zone>0&&!quiet&&beat%4===3)add(root+48+[0,7,10,3][(beat-3)/4],.55,garden?.014:.018,'glass');
 if(garden&&!quiet&&beat===6)add(root+55,6,.017,'pad');
 if((boss||reactor)&&!quiet&&beat%2===0)add(root+12+(beat%4?7:0),.75,.03,'bass');
 return {bpm,unit,notes,kick:!quiet&&(beat%4===0||(zone>1&&beat===10)),snare:!quiet&&(beat===4||beat===12),hat:!quiet&&beat%2===1,metal:!quiet&&zone>0&&(beat===3||beat===11||(reactor&&beat===14))};
}

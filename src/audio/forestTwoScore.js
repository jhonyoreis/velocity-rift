// Related pentatonic colours to Neon Canopy; a new melody, longer harmonic
// cycle and industrial counter-rhythm develop as the factory comes into view.
export function forestTwoScore(step,zone=0,boss=false){
 const bpm=boss?132:114,unit=60/bpm/4,beat=step%16,bar=Math.floor(step/16)%8;
 const roots=[38,38,43,41,38,45,43,36],root=roots[bar];
 const motif=[0,null,7,10,null,7,3,null,5,7,null,12,10,null,3,7,0,3,null,7,12,null,10,7,5,null,3,0,null,7,3,null];
 const notes=[];const add=(midi,duration,gain,voice)=>notes.push({midi,duration:duration*unit,gain,voice});
 if(beat%4===0)add(root+([0,0,7,3][beat/4]),2.8,.085,'bass');
 if(beat===0)for(const n of [0,3,7,10])add(root+24+n,14,.012,'pad');
 const lead=motif[step%32];if(lead!==null&&bar!==7)add(root+36+lead,1.8,.052,'glass');
 if(zone>0&&beat%4===3)add(root+48+[0,7,10,3][(beat-3)/4],.55,.018,'glass');
 if(boss&&beat%2===0)add(root+12+(beat%4?7:0),.75,.035,'bass');
 return {bpm,unit,notes,kick:beat%4===0||(zone>0&&beat===10),snare:beat===4||beat===12,hat:beat%2===1,metal:zone>0&&(beat===3||beat===11)};
}

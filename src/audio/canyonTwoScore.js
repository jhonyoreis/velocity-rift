// Original eight-bar answer to Ecos do Prisma: hollow bells, a breathing pad,
// descending replies and a restrained pulse that blooms among the ruins.
export function canyonTwoScore(step,zone=0){
 const bpm=118,unit=60/bpm/4,beat=step%16,bar=Math.floor(step/16)%8;
 const root=[40,40,36,43,38,38,36,35][bar],notes=[];
 const add=(midi,len,gain,voice,delay=0)=>notes.push({midi,duration:len*unit,gain,voice,delay:delay*unit});
 if(beat===0)for(const n of [0,7,14])add(root+24+n,15,.016,'pad');
 if(beat===0||beat===8)add(root+(beat===8?7:0),5,.075,'bass');
 const melody=[12,null,null,7,null,14,null,null,10,null,7,null,3,null,null,7,12,null,15,null,null,14,10,null,7,null,null,3,null,2,null,null];
 const n=melody[step%32];if(n!==null){add(root+36+n,2.9,.047,'glass');add(root+36+n,2.4,.014,'glass',2);}
 if(zone>=2&&beat%4===2)add(root+24+[7,10,14,12][Math.floor(beat/4)],2,.022,'glass');
 return {bpm,unit,notes,kick:beat===0||beat===8||(zone>=1&&beat===10),snare:zone>=1&&(beat===4||beat===12),hat:zone>=2&&beat%2===1};
}

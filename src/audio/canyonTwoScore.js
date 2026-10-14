// Original eight-bar answer to Ecos do Prisma: hollow bells, a breathing pad,
// descending replies and a restrained pulse that blooms among the ruins.
export function canyonTwoScore(step,zone=0){
 const bpm=118,unit=60/bpm/4,beat=step%16,bar=Math.floor(step/16)%8;
 const waterfall=zone>=3&&zone<=6,fractures=zone>=7&&zone<9;
 const root=(fractures?[38,38,35,40,36,36,43,35]:waterfall?[40,43,38,36,40,47,43,38]:[40,40,36,43,38,38,36,35])[bar],notes=[];
 const add=(midi,len,gain,voice,delay=0)=>notes.push({midi,duration:len*unit,gain,voice,delay:delay*unit});
 if(beat===0)for(const n of [0,7,14])add(root+24+n,15,.016,'pad');
 if(beat===0||beat===8)add(root+(beat===8?7:0),5,.075,'bass');
 const melody=[12,null,null,7,null,14,null,null,10,null,7,null,3,null,null,7,12,null,15,null,null,14,10,null,7,null,null,3,null,2,null,null];
 const reply=[7,null,14,null,12,null,null,10,7,null,3,null,2,null,null,0,12,null,7,null,14,15,null,12,10,null,null,7,3,null,2,null];
 const n=waterfall&&Math.floor(step/128)%2?reply[step%32]:melody[step%32];if(n!==null){add(root+36+n,2.9,.047,'glass');add(root+36+n,2.4,.014,'glass',2);}
 if(zone>=2&&beat%4===2)add(root+24+[7,10,14,12][Math.floor(beat/4)],2,.022,'glass');
 if(waterfall&&beat===12)add(root+43,7,.014,'pad');
 if(fractures&&beat%4===2)add(root+12+(beat%8===2?7:0),1.4,.035,'bass');
 return {bpm,unit,notes,kick:beat===0||beat===8||(zone>=1&&beat===10),snare:zone>=1&&zone<9&&(beat===4||beat===12),hat:zone>=2&&zone<9&&beat%2===1};
}

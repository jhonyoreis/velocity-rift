// Nine movements, 32-bar form. Sparse passages leave room for attack signals.
export const FINAL_SCORE=[
 {name:"As Nove Memórias",bpm:82,root:38,density:0},
 {name:"O Céu Sob os Pés",bpm:104,root:38,density:1},
 {name:"Catedral do Paradoxo",bpm:92,root:41,density:0},
 {name:"Fragmentos em Queda",bpm:136,root:38,density:2},
 {name:"A Coroa e a Barreira",bpm:148,root:35,density:3},
 {name:"Antes do Último Limiar",bpm:76,root:38,density:0},
 {name:"Soberano da Ruptura",bpm:140,root:35,density:3},
 {name:"Nove Corações · Flux Rubro",bpm:156,root:38,density:3},
 {name:"Uma Flor, Enfim",bpm:88,root:50,density:0}
];
const harmony=[0,-5,3,-2,0,5,-5,7];
const themes=[
 [0,null,null,7,null,null,10,null,12,null,7,null,3,null,null,null],
 [0,7,null,12,10,null,7,null,3,5,null,7,2,null,0,null],
 [0,null,3,7,null,10,null,12,7,null,5,null,3,null,2,null],
 [0,7,12,null,10,7,null,3,0,5,null,7,10,null,12,7]
];
export function finalScoreStep(section,step){
 const p=FINAL_SCORE[section]||FINAL_SCORE[0],unit=60/p.bpm/4;
 const bar=Math.floor(step/16)%32,beat=step%16,root=p.root+harmony[Math.floor(bar/4)],notes=[];
 const add=(midi,duration,gain,voice)=>notes.push({midi,duration:duration*unit,gain,voice});
 // Long swells, suspended harmony and changing inversions instead of a looped arpeggio.
 if(beat===0){for(const n of [0,section===7||section===8?4:3,7,bar%4===3?14:10])add(root+24+n,15,.018,"pad");add(root,7,.045,"bass");}
 if(p.density>0&&beat%4===2)add(root+(beat>8?7:0),2,.055,"bass");
 const phrase=themes[(Math.floor(bar/4)+section)%themes.length];
 const n=phrase[beat];
 if(n!==null&&(p.density>0||beat%4===0)&&bar%8!==7)
  add(root+36+n+(bar%8>=4?12:0),p.density===0?5:2.4,.055,"glass");
 if(bar%8>=4&&beat%4===3)add(root+43+(bar%2?3:0),3.2,.024,"glass");
 return {unit,notes,kick:p.density>0&&[0,6,10].includes(beat),
  snare:p.density>1&&[4,12].includes(beat),hat:p.density>1&&beat%2===1,
  intensity:p.density,bar};
}

// Optional clear-time objectives, cosmetics only. No gameplay power upgrade.
export const BONUS_CHALLENGES=Object.freeze([1,2,3].flatMap(stage=>[
 {id:"no-hit-"+stage,stage,title:"Corrida Intocada",reward:"Traço de luz",
  description:"Conclua a fase sem receber dano."},
 {id:"all-cores-"+stage,stage,title:"Memória Completa",reward:"Brilho de Flux",
  description:"Recupere os três núcleos nesta tentativa."}
]));
export function earnedBonusChallenges(stage,run){
 const results=[];
 if(![1,2,3].includes(stage)||!run)return results;
 if(Number.isFinite(run.damage)&&run.damage===0)
   results.push("no-hit-"+stage);
 if(Number.isFinite(run.cores)&&run.cores>=3)
   results.push("all-cores-"+stage);
 return results;
}
export function sanitizeBonusChallenges(raw){
 const valid=new Set(BONUS_CHALLENGES.map(c=>c.id));
 return [...new Set((Array.isArray(raw)?raw:[]).filter(v=>
   typeof v==="string"&&valid.has(v)))];
}

// Progressive difficulty for the 3-hit Prism Guardian.
export function guardianPhase(hp){
 if(hp>=3)return {label:"CONTENÇÃO",telegraph:1.32,lock:.80,laser:.66,
   exposed:3.90,recovery:1.12,width:13,tempo:1};
 if(hp===2)return {label:"FRATURA",telegraph:1.08,lock:.62,laser:.78,
   exposed:3.05,recovery:.94,width:15,tempo:1.08};
 return {label:"RUPTURA",telegraph:.90,lock:.50,laser:.93,
   exposed:2.45,recovery:.76,width:18,tempo:1.18};
}

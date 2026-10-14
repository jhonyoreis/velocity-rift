// Five sequential Guardian cores. The last heart adds three ricochets.
// Telegraphs remain long enough to display every upcoming reflected segment.
export function guardianPhase(hp){
 if(hp>=5)return {label:"CONTENÇÃO",telegraph:1.32,lock:.82,laser:.66,
   exposed:3.90,recovery:1.12,width:13,tempo:1,ricochets:1};
 if(hp===4)return {label:"FISSURA",telegraph:1.22,lock:.74,laser:.72,
   exposed:3.60,recovery:1.04,width:14,tempo:1.04,ricochets:1};
 if(hp===3)return {label:"FRATURA",telegraph:1.13,lock:.68,laser:.77,
   exposed:3.30,recovery:.97,width:15,tempo:1.08,ricochets:1};
 if(hp===2)return {label:"FRAGMENTAÇÃO",telegraph:1.04,lock:.61,laser:.83,
   exposed:2.95,recovery:.89,width:16,tempo:1.13,ricochets:1};
 return {label:"RUPTURA TRIPLA",telegraph:1.02,lock:.53,laser:.91,
   exposed:2.85,recovery:.82,width:18,tempo:1.18,ricochets:3};
}

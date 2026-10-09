// Campaign-only results are isolated from the permanent achievement archive.
// Resetting a journey clears these records; legacy ongoing journeys migrate once.
const GRADES=["C","B","A","S"];
export function emptyCampaignRecords(){
 return {stage1:{bestTime:0,bestGrade:"",clears:0},
         stage2:{bestTime:0,bestGrade:"",clears:0},
         stage3:{bestTime:0,bestGrade:"",clears:0}};
}
export function loadCampaignRecords(saved,completed,archive){
 const records=emptyCampaignRecords();
 const hasRecords=!!saved&&typeof saved==="object"&&!Array.isArray(saved);
 for(const stage of [1,2,3]){
   const key="stage"+stage;
   const from=hasRecords?saved[key]:(completed?.[key]?archive?.[key]:null);
   if(!from||typeof from!=="object")continue;
   const seconds=Number(from.bestTime);
   records[key].bestTime=Number.isFinite(seconds)&&seconds>0&&seconds<100000?seconds:0;
   records[key].bestGrade=GRADES.includes(from.bestGrade)?from.bestGrade:"";
   const clears=Number(from.clears);
   records[key].clears=Number.isFinite(clears)&&clears>0?
     Math.min(1000000,Math.floor(clears)):(records[key].bestTime>0?1:0);
 }
 return records;
}
export function recordCampaignClear(records,stage,seconds,grade){
 const key="stage"+stage,entry=records[key];
 if(!entry)return false;
 const improved=!entry.bestTime||seconds<entry.bestTime;
 if(improved)entry.bestTime=seconds;
 if(GRADES.includes(grade)&&(!entry.bestGrade||
   GRADES.indexOf(grade)>GRADES.indexOf(entry.bestGrade)))entry.bestGrade=grade;
 entry.clears++;
 return improved;
}

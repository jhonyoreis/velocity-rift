export function computeCampaignCompletion(campaign){
 const stages=[1,2,3,4].reduce((n,i)=>n+Number(campaign?.["stage"+i+"Completed"]===true),0);
 const cores=[1,2,3,4].reduce((n,i)=>n+(campaign?.extras?.cores?.["stage"+i]?.length||0),0);
 const secrets=[1,2,3,4].reduce((n,i)=>n+(campaign?.extras?.secrets?.["stage"+i]?.length||0),0);
 return {stages,cores,secrets,percent:Math.round(100*(stages/4*.4+cores/12*.3+secrets/12*.3))};
}

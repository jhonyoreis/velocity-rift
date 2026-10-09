export function computeCampaignCompletion(campaign){
  const stages=Number(campaign.stage1Completed)+Number(campaign.stage2Completed)+
    Number(campaign.stage3Completed);
  const cores=[1,2,3].reduce((n,i)=>n+campaign.extras.cores["stage"+i].length,0);
  const secrets=[1,2,3].reduce((n,i)=>n+campaign.extras.secrets["stage"+i].length,0);
  return {stages,cores,secrets,percent:Math.round(100*(stages/4*.4+cores/12*.3+secrets/12*.3))};
}

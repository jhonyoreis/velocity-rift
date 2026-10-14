import {routeState} from "./campaignRoute.js";
export function computeCampaignCompletion(campaign,forest={},canyon={}){
 const stages=routeState(campaign,forest,canyon).filter(n=>n.completed).length;
 const cores=[1,2,3,4].reduce((n,i)=>n+(campaign?.extras?.cores?.["stage"+i]?.length||0),0);
 const secrets=[1,2,3,4].reduce((n,i)=>n+(campaign?.extras?.secrets?.["stage"+i]?.length||0),0);
 return {stages,cores,secrets,percent:Math.round(100*(stages/6*.4+cores/12*.3+secrets/12*.3))};
}

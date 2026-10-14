// One route is shared by the atlas, Continue, results and runtime entry guards.
// Stage numbers still identify the original regions and their collectible keys.
export const CAMPAIGN_ROUTE=[
 {id:"forest1",stage:1,part:1,suffix:"One",node:"mapNodeStageOne",card:"stageOneCard",button:"stageOneButton",name:"Floresta Neon 1",subtitle:"Primeiro Impulso",region:"forest",path:null},
 {id:"forest2",stage:1,part:2,suffix:"ForestTwo",node:"mapNodeForestTwo",card:"forestTwoCard",button:"forestTwoButton",name:"Floresta Neon 2",subtitle:"Fábrica Helix",region:"forest",path:"mapPathToForestTwo"},
 {id:"canyon1",stage:2,part:1,suffix:"Two",node:"mapNodeStageTwo",card:"stageTwoCard",button:"stageTwoButton",name:"Cânion Prisma 1",subtitle:"Entre Cristais",region:"canyon",path:"mapPathToCanyon"},
 {id:"canyon2",stage:2,part:2,suffix:"CanyonTwo",node:"mapNodeCanyonTwo",card:"canyonTwoCard",button:"canyonTwoButton",name:"Cânion Prisma 2",subtitle:"Santuário da Refração",region:"canyon",path:"mapPathToCanyonTwo"},
 {id:"city",stage:3,part:1,suffix:"Three",node:"mapNodeStageThree",card:"stageThreeCard",button:"stageThreeButton",name:"Cidade das Fendas",subtitle:"O Arquiteto do Vazio",region:"city",path:"mapPathToCity"},
 {id:"final",stage:4,part:1,suffix:"Four",node:"mapNodeStageFour",card:"stageFourCard",button:"stageFourButton",name:"Fenda Original",subtitle:"Uma Flor, Enfim",region:"final",path:"mapPathToFinal"}
];
export function routeId(stage,part=1){return CAMPAIGN_ROUTE.find(n=>n.stage===stage&&n.part===part)?.id;}
export function routeState(campaign={},forest={},canyon={},testMode=false){
 const completed=[campaign.stage1Completed===true,forest.completed===true,
   campaign.canyonFirstCompleted===true,canyon.completed===true,
   campaign.stage3Completed===true,campaign.stage4Completed===true];
 return CAMPAIGN_ROUTE.map((node,i)=>({...node,completed:completed[i],
   unlocked:testMode||i===0||completed[i]||completed[i-1]||campaign.legacyUnlocked?.includes(node.id)===true}));
}
export function nextRouteNode(campaign,forest,canyon){
 const route=routeState(campaign,forest,canyon);
 return route.find(n=>n.unlocked&&!n.completed)||route.at(-1);
}
export function resumeRouteNode(campaign,forest,canyon){
 return routeState(campaign,forest,canyon).find(n=>n.id===campaign.lastNode&&n.unlocked)||nextRouteNode(campaign,forest,canyon);
}
export function migrateCampaignRoute(campaign,forest={},canyon={}){
 const current=campaign.routeVersion===1;
 const validIds=CAMPAIGN_ROUTE.map(n=>n.id);
 const legacyUnlocked=current?(Array.isArray(campaign.legacyUnlocked)?campaign.legacyUnlocked.filter(id=>validIds.includes(id)):[]):[];
 // Older builds allowed entering experimental parts directly. Keep those visits,
 // and the regions already unlocked, without fabricating clears or record times.
 if(!current){
   if(forest.pending||forest.completed)legacyUnlocked.push("forest2");
   if(campaign.stage1Completed||campaign.lastStage>=2)legacyUnlocked.push("canyon1");
   if(canyon.pending||canyon.completed)legacyUnlocked.push("canyon2");
   if(campaign.stage2Completed)legacyUnlocked.push("city");
   if(campaign.stage3Completed)legacyUnlocked.push("final");
 }
 const result={...campaign,routeVersion:1,legacyUnlocked:[...new Set(legacyUnlocked)],
   canyonFirstCompleted:current?campaign.canyonFirstCompleted===true:
     campaign.stage2Completed===true||canyon.completed===true||canyon.pending===true||campaign.records?.stage2?.clears>0};
 const oldLast=canyon.pending?"canyon2":forest.pending?"forest2":routeId(campaign.lastStage||1);
 result.lastNode=current?campaign.lastNode:oldLast;
 result.lastNode=resumeRouteNode(result,forest,canyon).id;
 return result;
}

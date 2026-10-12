import {SECRET_DEFS} from "../data/secretRoutes.js";

// One permanent reward per distinct secret route, earned on normal runs.
// Rewards live in the historic progress record, not in the active campaign.
export const BOOST_UPGRADES={
  capacityStep:10,
  powerStep:.03,
  baseCapacity:100,
  baseSpeed:590,
  baseAcceleration:850,
  rewards:Object.freeze({
    canopy:"capacity",lumen:"power",horizon:"capacity",
    echo:"capacity",prism:"power",zenith:"capacity",
    antenna:"power",underpass:"capacity",skyline:"power",origin:"capacity",paradox:"power",lastlight:"capacity"
  })
};
export function secretUpgradeReward(id){
  const type=BOOST_UPGRADES.rewards[id];
  if(!type)return null;
  return {type,title:["origin","paradox","lastlight"].includes(id)?"CONSUMO DE BOOST −8% · "+(type==="capacity"?"RESERVA +10":"POTÊNCIA +3%"):type==="capacity"?"RESERVA DE BOOST +10":"POTÊNCIA DE BOOST +3%"};
}
export function secretUpgradeStats(savedSecrets){
  const found=new Set();
  for(const stage of [1,2,3,4]){
    const ids=new Set(SECRET_DEFS[stage].map(item=>item.id));
    const saved=savedSecrets?.["stage"+stage];
    if(!Array.isArray(saved))continue;
    for(const id of saved)
      if(ids.has(id))found.add(id);
  }
  let capacityLevels=0,powerLevels=0;
  const efficiencyLevels=["origin","paradox","lastlight"].filter(id=>found.has(id)).length;
  for(const id of found){
    const type=BOOST_UPGRADES.rewards[id];
    if(type==="capacity")capacityLevels++;
    if(type==="power")powerLevels++;
  }
  return {
    capacity:BOOST_UPGRADES.baseCapacity+capacityLevels*BOOST_UPGRADES.capacityStep,
    capacityLevels,powerLevels,efficiencyLevels,consumptionMultiplier:.92**efficiencyLevels,
    powerMultiplier:1+powerLevels*BOOST_UPGRADES.powerStep,
    collected:capacityLevels+powerLevels
  };
}

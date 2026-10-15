// Entering Fenda Original switches away from the other three level runtimes.
// None of their pending arrivals, exits or altar sequences may keep running.
export function clearForeignStageTransitions({stageExit,stageArrival,dashAltar}){
 for(const state of [stageExit,stageArrival,dashAltar]){
  if(!state)continue;
  state.active=false;
  state.elapsed=0;
 }
}

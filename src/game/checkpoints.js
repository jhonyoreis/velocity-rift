// Pure checkpoint logic, independent from the menu and physics engine.
// Passing near a checkpoint flag activates it even during a short hop.
export function checkpointReached(point,player){
  return !!point && !!player &&
    Number.isFinite(player.x) && Number.isFinite(player.y) &&
    player.x>=point.x && Math.abs(player.y-point.y)<=75;
}
export function checkpointRespawnTarget(points,index,spawn){
  const hasCheckpoint=Number.isInteger(index)&&index>=0 &&
    index<points.length && points[index]?.active;
  const target=hasCheckpoint?points[index]:spawn;
  return {x:target.x,y:target.y,fromCheckpoint:hasCheckpoint};
}

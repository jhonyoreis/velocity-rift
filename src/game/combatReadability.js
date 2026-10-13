const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Frame both actors when they fit; otherwise favor the player and retain arena bounds.
export function architectCameraX(playerX,bossX,left,right,width=960){
 const margin=110;
 const target=Math.abs(playerX-bossX)<=width-margin*2
  ?(playerX+bossX)/2-width/2:playerX-width*(bossX>playerX?.38:.62);
 return clamp(target,left,Math.max(left,right-width));
}
export function containArenaPlayer(cameraX,playerX,left,right,width=960){
 return clamp(clamp(cameraX,playerX-width+85,playerX-85),left,Math.max(left,right-width));
}
export function dashIndicatorState({unlocked=true,available=true,active=false,blocked=false}={}){
 return !unlocked||blocked?"hidden":active?"active":available?"ready":"spent";
}
// Place markers above touch controls and below the top HUD, with direction intact.
export function offscreenTarget(target,cameraX,cameraY,width=960,height=540){
 const x=target.x-cameraX,y=target.y-cameraY;
 if(x>=0&&x<=width&&y>=0&&y<=height)return null;
 return {x:clamp(x,32,width-32),y:clamp(y,160,height-150),
  angle:Math.atan2(y-clamp(y,160,height-150),x-clamp(x,32,width-32)),
  side:x<0?"left":x>width?"right":y<0?"top":"bottom"};
}

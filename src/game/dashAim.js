// A pointer move is an explicit aiming gesture. Never reuse an old cursor
// coordinate after Flux or the scrolling camera has moved far away.
export const DASH_AIM_MAX_AGE_MS = 900;
export const DASH_AIM_DEADZONE_PX = 42;

export function resolveAirDashDirection({
  facing, leftHeld=false, rightHeld=false,
  playerScreenX, playerScreenY,
  aimX, aimY, hasAim=false, pointerMovedAt=-Infinity, now
}) {
  const fallbackFacing = facing < 0 ? -1 : 1;
  const horizontal = leftHeld !== rightHeld
    ? (leftHeld ? -1 : 1)
    : fallbackFacing;
  const pointerIsRecent = hasAim &&
    Number.isFinite(pointerMovedAt) && Number.isFinite(now) &&
    now >= pointerMovedAt &&
    now-pointerMovedAt <= DASH_AIM_MAX_AGE_MS &&
    Number.isFinite(aimX) && Number.isFinite(aimY) &&
    Number.isFinite(playerScreenX) && Number.isFinite(playerScreenY);

  if(pointerIsRecent) {
    const deltaX=aimX-playerScreenX,deltaY=aimY-playerScreenY;
    const length=Math.hypot(deltaX,deltaY);
    if(Number.isFinite(length) && length>=DASH_AIM_DEADZONE_PX)
      return {dx:deltaX/length,dy:deltaY/length};
  }

  // Explicit held direction overrides a stale pointer. For touch controls,
  // this keeps the dash consistent with the left/right movement buttons.
  return {dx:horizontal,dy:0};
}

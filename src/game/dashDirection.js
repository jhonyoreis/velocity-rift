// Balance rule: the aerial dash is strictly horizontal in Flux's facing
// direction when activated. Mouse position and other aim inputs are ignored.
export function resolveAirDashDirection(facing) {
  return {dx: facing < 0 ? -1 : 1, dy: 0};
}

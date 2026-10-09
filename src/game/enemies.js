// Shared enemy factory and resilient type classification for all chapters.
// Stage-specific enemy variants override the default type in their world data.
export function createEnemy(x, y, patrol) {
  return {
    x,
    y,
    baseX: x,
    yBase: y,
    w: 38,
    h: 28,
    patrol,
    type: "walker",
    phase: Math.random() * Math.PI * 2,
    alive: true,
  };
}

export function isCityEnemyType(type) {
  return typeof type === "string" && type.startsWith("city-");
}

export function yOnTrack(floor, x) {
  const t = clamp((x - floor.x1) / (floor.x2 - floor.x1), 0, 1);
  return lerp(floor.y1, floor.y2, t);
}

export function circleRect(cx, cy, radius, box) {
  const nearestX = clamp(cx, box.x, box.x + box.w);
  const nearestY = clamp(cy, box.y, box.y + box.h);
  return distance(cx, cy, nearestX, nearestY) <= radius;
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

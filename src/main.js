const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");

const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const WORLD_W = 4850;
const WORLD_H = 820;
const PLAYER_RADIUS = 18;

const keys = new Set();
let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1 / 120;
let paused = false;
let jumpBuffer = 0;
let coyoteTimer = 0;
let jumpHeld = false;
let checkpointIndex = -1;
let bestTime = 0;
try { bestTime = Number(localStorage.getItem('velocity-rift-best-time')) || 0; } catch (_) { /* private storage */ }
let loopRunning = false;
let gameStarted = false;
let gameCleared = false;
let gameTime = 0;
let cameraX = 0;
let cameraY = 0;
let shakeTime = 0;

const player = {
  x: 90,
  y: 370,
  prevX: 90,
  prevY: 370,
  vx: 0,
  vy: 0,
  facing: 1,
  onGround: false,
  ground: null,
  rings: 0,
  boost: 100,
  invulnerable: 0,
  trail: [],
  sliding: false,
};

const spawn = { x: 90, y: 370 };
const checkpoints = [{ x: 1630, y: 402 }, { x: 3030, y: 452 }];

const tracks = [
  track(0, 420, 560, 420, "start"),
  track(560, 420, 850, 350, "ramp"),
  track(850, 350, 1240, 350, "mid"),
  track(1240, 350, 1580, 420, "drop"),
  track(1580, 420, 2130, 420, "low"),
  track(2130, 420, 2460, 470, "lowdrop"),
  track(2460, 470, 3290, 470, "low"),
  track(3290, 470, 3760, 365, "climb"),
  track(3760, 365, 4680, 365, "finish"),

  track(610, 284, 980, 238, "upper-entry"),
  track(980, 238, 1460, 195, "upper-fast"),
  track(1460, 195, 2020, 195, "upper-fast"),
  track(2020, 195, 2350, 258, "upper-drop"),
  track(2350, 258, 2870, 258, "upper-risk"),
  track(2870, 258, 3230, 310, "upper-exit"),

  track(1120, 304, 1620, 304, "middle"),
  track(1620, 304, 1900, 270, "middle-rise"),
  track(1900, 270, 2520, 304, "middle"),
  track(2520, 304, 3080, 304, "middle"),
  track(3080, 304, 3500, 342, "middle-exit"),
];

const walls = [
  rect(0, 480, WORLD_W, 260, "void-floor"),
  rect(-120, 0, 120, WORLD_H, "left-wall"),
  rect(1970, 344, 38, 76, "break-gate"),
  rect(3330, 388, 50, 82, "break-gate"),
];

const enemies = [
  enemy(720, 395, 0),
  enemy(1370, 326, 60),
  enemy(1740, 396, 90),
  enemy(2290, 242, 55),
  enemy(2660, 446, 95),
  enemy(2860, 282, 50),
  enemy(3570, 446, 70),
  enemy(4140, 340, 75),
];

const rings = [
  ...arcRings(680, 315, 7, 28),
  ...lineRings(980, 312, 7, 38),
  ...lineRings(1170, 256, 8, 34),
  ...arcRings(1540, 250, 8, 30),
  ...lineRings(1820, 390, 6, 38),
  ...lineRings(2150, 166, 8, 34),
  ...arcRings(2490, 222, 8, 31),
  ...lineRings(2670, 446, 7, 38),
  ...lineRings(3000, 277, 7, 38),
  ...arcRings(3400, 398, 8, 30),
  ...lineRings(3930, 328, 8, 34),
];

const boostOrbs = [
  orb(910, 314),
  orb(1535, 160),
  orb(2045, 386),
  orb(2620, 222),
  orb(3160, 434),
  orb(3720, 320),
];

const springs = [
  { x: 545, y: 399, w: 36, h: 16, powerX: 270, powerY: -820 },
  { x: 1090, y: 329, w: 38, h: 16, powerX: 360, powerY: -650 },
  { x: 3120, y: 449, w: 38, h: 16, powerX: 560, powerY: -740 },
];

const boostPads = [
  { x: 1220, y: 335, w: 74, h: 14, power: 880 },
  { x: 2380, y: 455, w: 84, h: 14, power: 980 },
  { x: 2900, y: 289, w: 84, h: 14, power: 940 },
];

const spikes = [
  { x: 1515, y: 397, w: 72, h: 23 },
  { x: 2385, y: 235, w: 74, h: 23 },
  { x: 2780, y: 447, w: 86, h: 23 },
  { x: 3460, y: 446, w: 86, h: 23 },
];

const goal = { x: 4580, y: 293, w: 50, h: 72 };

function track(x1, y1, x2, y2, kind) {
  return { x1, y1, x2, y2, kind };
}

function rect(x, y, w, h, kind) {
  return { x, y, w, h, kind, active: true };
}

function enemy(x, y, patrol) {
  return {
    x,
    y,
    baseX: x,
    yBase: y,
    w: 38,
    h: 28,
    patrol,
    phase: Math.random() * Math.PI * 2,
    alive: true,
  };
}

function orb(x, y) {
  return { x, y, r: 15, active: true };
}

function lineRings(x, y, count, gap) {
  return Array.from({ length: count }, (_, i) => ({
    x: x + i * gap,
    y,
    r: 8,
    active: true,
  }));
}

function arcRings(x, y, count, gap) {
  return Array.from({ length: count }, (_, i) => ({
    x: x + i * gap,
    y: y - Math.sin((i / (count - 1)) * Math.PI) * 38,
    r: 8,
    active: true,
  }));
}

function resetGame() {
  player.x = spawn.x;
  player.y = spawn.y;
  player.prevX = spawn.x;
  player.prevY = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.onGround = false;
  player.ground = null;
  player.rings = 0;
  player.boost = 100;
  player.invulnerable = 0;
  player.trail = [];
  player.sliding = false;
  checkpointIndex = -1;
  jumpBuffer = 0;
  coyoteTimer = 0;
  jumpHeld = false;
  paused = false;
  accumulator = 0;
  cameraX = 0;
  cameraY = 0;
  gameTime = 0;
  gameCleared = false;
  shakeTime = 0;
  walls.forEach((wall) => {
    wall.active = true;
  });
  enemies.forEach((bad) => {
    bad.alive = true;
    bad.x = bad.baseX;
    bad.y = bad.yBase;
  });
  rings.forEach((ring) => {
    ring.active = true;
  });
  boostOrbs.forEach((boostOrb) => {
    boostOrb.active = true;
  });
}

function startGame() {
  gameStarted = true;
  overlay.classList.add("is-hidden");
  resetGame();
  ensureLoop();
}

function ensureLoop() {
  if (loopRunning) return;
  loopRunning = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;

  if (gameStarted && !gameCleared && !paused) {
    accumulator += dt;
    while (accumulator >= FIXED_DT) {
      update(FIXED_DT);
      accumulator -= FIXED_DT;
    }
  } else {
    accumulator = 0;
  }

  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  gameTime += dt;
  player.prevX = player.x;
  player.prevY = player.y;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  shakeTime = Math.max(0, shakeTime - dt);

  const left = keys.has("arrowleft") || keys.has("a");
  const right = keys.has("arrowright") || keys.has("d");
  const jump = keys.has(" ") || keys.has("arrowup") || keys.has("w") || keys.has("k");
  const boost = keys.has("shift") || keys.has("j");
  const slide = keys.has("arrowdown") || keys.has("s");
  jumpBuffer = Math.max(0, jumpBuffer - dt);
  coyoteTimer = player.onGround ? 0.11 : Math.max(0, coyoteTimer - dt);

  player.sliding = slide && player.onGround && Math.abs(player.vx) > 145;
  const accel = player.onGround ? (player.sliding ? 620 : 2050) : 880;
  const friction = player.onGround ? (player.sliding ? 260 : 1550) : 130;
  const normalMax = 650;
  const boostMax = 1120;

  if (left) {
    player.vx -= accel * dt;
    player.facing = -1;
  }
  if (right) {
    player.vx += accel * dt;
    player.facing = 1;
  }
  if (!left && !right && player.onGround) {
    player.vx = approach(player.vx, 0, friction * dt);
  }

  const boosting = boost && player.boost > 0 && Math.abs(player.vx) > 80;
  if (boosting) {
    player.vx += player.facing * 3100 * dt;
    player.boost = Math.max(0, player.boost - 42 * dt);
    player.trail.push({ x: player.x, y: player.y, life: 0.24 });
  } else {
    player.boost = Math.min(100, player.boost + (player.onGround ? 16 : 9) * dt);
  }

  const maxSpeed = boosting ? boostMax : normalMax;
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  if (jumpBuffer > 0 && coyoteTimer > 0) {
    player.sliding = false;
    player.vy = -710 - Math.min(170, Math.abs(player.vx) * 0.14);
    player.onGround = false;
    player.ground = null;
    jumpBuffer = 0;
    coyoteTimer = 0;
  }

  if (!jump && player.vy < -160) player.vy += 1450 * dt;
  player.vy += 2100 * dt;
  player.vy = Math.min(player.vy, 1500);
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  resolveTracks();
  resolveWalls();
  updateCheckpoints();
  updateEnemies(dt);
  collectItems();
  handleHazards();
  handleBoostPads();
  handleSprings();
  updateTrail(dt);

  player.x = clamp(player.x, PLAYER_RADIUS, WORLD_W - PLAYER_RADIUS);

  if (player.y > 620) {
    damagePlayer(true);
  }

  if (circleRect(player.x, player.y, PLAYER_RADIUS, goal)) {
    gameCleared = true;
    if (!bestTime || gameTime < bestTime) {
      bestTime = gameTime;
      try { localStorage.setItem('velocity-rift-best-time', String(bestTime)); } catch (_) { /* storage may be disabled */ }
    }
    const grade = gameTime < 35 ? 'S' : gameTime < 50 ? 'A' : gameTime < 75 ? 'B' : 'C';
    overlay.querySelector("h1").textContent = `Stage Clear · ${grade}`;
    overlay.querySelector("p").textContent =
      `Tempo ${gameTime.toFixed(2)}s | Recorde ${bestTime.toFixed(2)}s | Coletáveis ${player.rings}`;
    startButton.textContent = "Play again";
    overlay.classList.remove("is-hidden");
    gameStarted = false;
  }

  const targetX = clamp(player.x - VIEW_W * 0.38, 0, WORLD_W - VIEW_W);
  const targetY = clamp(player.y - VIEW_H * 0.56, 0, WORLD_H - VIEW_H);
  cameraX = lerp(cameraX, targetX, 1 - Math.exp(-7 * dt));
  cameraY = lerp(cameraY, targetY, 1 - Math.exp(-5 * dt));
}

function resolveTracks() {
  let best = null;
  let bestDistance = Infinity;
  const bottom = player.y + PLAYER_RADIUS;
  const prevBottom = player.prevY + PLAYER_RADIUS;

  for (const floor of tracks) {
    const minX = Math.min(floor.x1, floor.x2) - PLAYER_RADIUS;
    const maxX = Math.max(floor.x1, floor.x2) + PLAYER_RADIUS;
    if (player.x < minX || player.x > maxX) continue;

    const y = yOnTrack(floor, player.x);
    const distance = bottom - y;
    const canLand = prevBottom <= y + 24 && bottom >= y - 12 && player.vy >= -160;
    const canStick = player.onGround && player.ground === floor && distance > -45 && distance < 74;

    if ((canLand || canStick) && Math.abs(distance) < bestDistance) {
      bestDistance = Math.abs(distance);
      best = { floor, y };
    }
  }

  if (best) {
    player.y = best.y - PLAYER_RADIUS;
    player.vy = Math.min(player.vy, 0);
    player.onGround = true;
    player.ground = best.floor;

    const slope = (best.floor.y2 - best.floor.y1) / Math.max(1, best.floor.x2 - best.floor.x1);
    player.vx += clamp(slope * 320, -170, 170) * FIXED_DT;
  } else {
    player.onGround = false;
    player.ground = null;
  }
}

function resolveWalls() {
  for (const wall of walls) {
    if (!wall.active) continue;
    if (wall.kind === "void-floor") continue;
    if (!circleRect(player.x, player.y, PLAYER_RADIUS, wall)) continue;

    if (wall.kind === "break-gate") {
      if (Math.abs(player.vx) > 760 || keys.has("shift") || keys.has("j")) {
        wall.active = false;
        player.vx += player.facing * 180;
        shakeTime = 0.16;
        continue;
      }
      damagePlayer(false);
      player.x = player.prevX;
      player.vx = -player.facing * 360;
      continue;
    }

    player.x = player.prevX;
    player.vx = 0;
  }
}

function updateEnemies(dt) {
  for (const bad of enemies) {
    if (!bad.alive) continue;
    if (bad.patrol > 0) {
      bad.phase += dt * 1.8;
      bad.x = bad.baseX + Math.sin(bad.phase) * bad.patrol;
    }

    const box = { x: bad.x - bad.w / 2, y: bad.y - bad.h, w: bad.w, h: bad.h };
    if (!circleRect(player.x, player.y, PLAYER_RADIUS, box)) continue;

    const stomp = player.prevY + PLAYER_RADIUS <= box.y + 8 && player.vy > 80;
    const smash = Math.abs(player.vx) > 820 || keys.has("shift") || keys.has("j");

    if (stomp || smash) {
      bad.alive = false;
      player.vy = stomp ? -520 : player.vy;
      player.vx += player.facing * 80;
      player.boost = Math.min(100, player.boost + 15);
    } else {
      damagePlayer(false);
    }
  }
}

function collectItems() {
  for (const ring of rings) {
    if (!ring.active) continue;
    if (distance(player.x, player.y, ring.x, ring.y) < PLAYER_RADIUS + ring.r) {
      ring.active = false;
      player.rings += 1;
      player.boost = Math.min(100, player.boost + 2.5);
    }
  }

  for (const boostOrb of boostOrbs) {
    if (!boostOrb.active) continue;
    if (distance(player.x, player.y, boostOrb.x, boostOrb.y) < PLAYER_RADIUS + boostOrb.r) {
      boostOrb.active = false;
      player.boost = Math.min(100, player.boost + 38);
      player.vx += player.facing * 120;
    }
  }
}

function handleHazards() {
  for (const spike of spikes) {
    if (circleRect(player.x, player.y, PLAYER_RADIUS, spike)) {
      damagePlayer(false);
      return;
    }
  }
}

function handleBoostPads() {
  for (const pad of boostPads) {
    if (circleRect(player.x, player.y, PLAYER_RADIUS, pad)) {
      player.vx = Math.max(player.vx, pad.power);
      player.facing = 1;
      player.boost = Math.min(100, player.boost + 12);
      player.trail.push({ x: player.x, y: player.y, life: 0.3 });
    }
  }
}

function handleSprings() {
  for (const spring of springs) {
    if (!circleRect(player.x, player.y, PLAYER_RADIUS, spring)) continue;
    if (player.prevY + PLAYER_RADIUS <= spring.y + 12) {
      player.vx = Math.max(player.vx, spring.powerX);
      player.vy = spring.powerY;
      player.onGround = false;
      shakeTime = 0.08;
    }
  }
}

function updateCheckpoints() {
  checkpoints.forEach((point, index) => {
    if (index > checkpointIndex && player.x >= point.x && Math.abs(player.y - point.y) < 110) checkpointIndex = index;
  });
}

function damagePlayer(fall) {
  if (player.invulnerable > 0) return;
  shakeTime = 0.22;

  if (fall || player.rings <= 0) {
    const respawn = checkpointIndex >= 0 ? checkpoints[checkpointIndex] : spawn;
    player.x = respawn.x;
    player.y = respawn.y;
    player.prevX = respawn.x;
    player.prevY = respawn.y;
    player.onGround = false;
    player.ground = null;
    player.vx = 0;
    player.vy = 0;
    player.rings = Math.max(0, Math.floor(player.rings / 2));
    player.boost = 70;
    coyoteTimer = 0;
    jumpBuffer = 0;
    player.invulnerable = 1.3;
    return;
  }

  player.rings = Math.max(0, player.rings - 8);
  player.vx = -player.facing * 430;
  player.vy = -450;
  player.invulnerable = 1.1;
}

function updateTrail(dt) {
  for (const dot of player.trail) {
    dot.life -= dt;
  }
  player.trail = player.trail.filter((dot) => dot.life > 0).slice(-24);
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  const shake = shakeTime > 0 ? Math.sin(performance.now() * 0.05) * shakeTime * 13 : 0;
  ctx.save();
  ctx.translate(Math.round(-cameraX + shake), Math.round(-cameraY));

  drawSky();
  drawBackground();
  drawTracks();
  drawObjects();
  drawPlayer();

  ctx.restore();
  drawHud();
}

function drawSky() {
  const grad = ctx.createLinearGradient(0, cameraY, 0, cameraY + VIEW_H);
  grad.addColorStop(0, "#101c36");
  grad.addColorStop(0.55, "#12344a");
  grad.addColorStop(1, "#153a38");
  ctx.fillStyle = grad;
  ctx.fillRect(cameraX, cameraY, VIEW_W, VIEW_H);

  ctx.fillStyle = "rgba(117, 230, 238, 0.08)";
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 330 - cameraX * 0.22) % (WORLD_W + 320);
    ctx.fillRect(x, 80 + (i % 5) * 34, 150, 2);
  }
}

function drawBackground() {
  // Three parallax layers, rendered in screen space with distinct scroll factors.
  ctx.fillStyle = "#163b50";
  for (let i = -2; i < 24; i += 1) {
    const x = i * 280 + ((-cameraX * 0.18) % 280) + cameraX;
    const h = 110 + (i % 5) * 22;
    ctx.beginPath();
    ctx.moveTo(x - 100, cameraY + VIEW_H);
    ctx.lineTo(x + 40, cameraY + 330 - h);
    ctx.lineTo(x + 190, cameraY + VIEW_H);
    ctx.fill();
  }
  ctx.fillStyle = "#0f2b32";
  for (let i = -1; i < 18; i += 1) {
    const x = i * 360 + ((-cameraX * 0.38) % 360) + cameraX;
    const h = 130 + (i % 4) * 42;
    ctx.fillRect(x, 515 - h, 210, h);
  }

  ctx.fillStyle = "rgba(68, 203, 216, 0.12)";
  for (let i = 0; i < 12; i += 1) {
    const x = i * 430 + ((-cameraX * 0.55) % 430) + cameraX;
    ctx.beginPath();
    ctx.arc(x, 158 + (i % 3) * 36, 46, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTracks() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const floor of tracks) {
    const isUpper = floor.kind.includes("upper");
    ctx.strokeStyle = isUpper ? "#78f2ff" : "#7df28d";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(floor.x1, floor.y1);
    ctx.lineTo(floor.x2, floor.y2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(4, 9, 11, 0.42)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(floor.x1, floor.y1 + 5);
    ctx.lineTo(floor.x2, floor.y2 + 5);
    ctx.stroke();
  }

  for (const wall of walls) {
    if (!wall.active || wall.kind === "void-floor") continue;
    ctx.fillStyle = wall.kind === "break-gate" ? "#e06f58" : "#27444d";
    roundRect(wall.x, wall.y, wall.w, wall.h, 6);
    ctx.fill();
    if (wall.kind === "break-gate") {
      ctx.fillStyle = "#ffe2a8";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText("BOOST", wall.x + 2, wall.y + wall.h / 2);
    }
  }
}

function drawObjects() {
  checkpoints.forEach((point, index) => {
    ctx.fillStyle = index <= checkpointIndex ? '#38dcd0' : '#f6ac43';
    ctx.fillRect(point.x, point.y - 64, 5, 64);
    ctx.beginPath();
    ctx.moveTo(point.x + 5, point.y - 64);
    ctx.lineTo(point.x + 35, point.y - 52);
    ctx.lineTo(point.x + 5, point.y - 40);
    ctx.closePath();
    ctx.fill();
  });
  for (const pad of boostPads) {
    ctx.fillStyle = "#22d6ef";
    roundRect(pad.x, pad.y, pad.w, pad.h, 7);
    ctx.fill();
    ctx.fillStyle = "#061013";
    ctx.beginPath();
    ctx.moveTo(pad.x + pad.w - 18, pad.y + 7);
    ctx.lineTo(pad.x + 14, pad.y + 3);
    ctx.lineTo(pad.x + 14, pad.y + 11);
    ctx.closePath();
    ctx.fill();
  }

  for (const spring of springs) {
    ctx.fillStyle = "#ff5b8b";
    roundRect(spring.x, spring.y, spring.w, spring.h, 5);
    ctx.fill();
    ctx.fillStyle = "#ffe7ef";
    ctx.fillRect(spring.x + 6, spring.y + 4, spring.w - 12, 3);
  }

  for (const spike of spikes) {
    ctx.fillStyle = "#f3eff0";
    const teeth = Math.floor(spike.w / 18);
    for (let i = 0; i < teeth; i += 1) {
      const x = spike.x + i * 18;
      ctx.beginPath();
      ctx.moveTo(x, spike.y + spike.h);
      ctx.lineTo(x + 9, spike.y);
      ctx.lineTo(x + 18, spike.y + spike.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  for (const ring of rings) {
    if (!ring.active) continue;
    ctx.strokeStyle = "#ffd75a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const boostOrb of boostOrbs) {
    if (!boostOrb.active) continue;
    ctx.fillStyle = "rgba(72, 224, 239, 0.28)";
    ctx.beginPath();
    ctx.arc(boostOrb.x, boostOrb.y, boostOrb.r + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#48e0ef";
    ctx.beginPath();
    ctx.arc(boostOrb.x, boostOrb.y, boostOrb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const bad of enemies) {
    if (!bad.alive) continue;
    ctx.fillStyle = "#ff805c";
    roundRect(bad.x - bad.w / 2, bad.y - bad.h, bad.w, bad.h, 8);
    ctx.fill();
    ctx.fillStyle = "#260d09";
    ctx.fillRect(bad.x - 11, bad.y - 18, 6, 5);
    ctx.fillRect(bad.x + 5, bad.y - 18, 6, 5);
  }

  ctx.fillStyle = "#ffffff";
  roundRect(goal.x, goal.y, goal.w, goal.h, 6);
  ctx.fill();
  ctx.fillStyle = "#ff5b8b";
  ctx.fillRect(goal.x + 9, goal.y + 8, 32, 20);
  ctx.fillStyle = "#071215";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.fillText("GO", goal.x + 14, goal.y + 23);
}

function drawPlayer() {
  for (const dot of player.trail) {
    ctx.globalAlpha = dot.life / 0.24;
    ctx.fillStyle = "#48e0ef";
    ctx.beginPath();
    ctx.arc(dot.x, dot.y + 4, 16 * (dot.life / 0.24), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (player.invulnerable > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  const speedGlow = clamp(Math.abs(player.vx) / 1000, 0, 1);
  if (player.sliding) {
    ctx.fillStyle = "rgba(246, 172, 67, .35)";
    ctx.beginPath();
    ctx.ellipse(player.x - player.facing * 10, player.y + 8, 37, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5ac43";
    roundRect(player.x - 22, player.y + 4, 44, 13, 6);
    ctx.fill();
    ctx.fillStyle = "#38dcd0";
    ctx.fillRect(player.x + player.facing * 6 - 4, player.y + 5, 12, 4);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = `rgba(72, 224, 239, ${0.18 + speedGlow * 0.28})`;
  ctx.beginPath();
  ctx.ellipse(player.x - player.facing * 12, player.y + 2, 28 + speedGlow * 22, 19, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4f7f7";
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1aa8bf";
  ctx.beginPath();
  ctx.arc(player.x - player.facing * 4, player.y - 3, PLAYER_RADIUS - 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#071215";
  ctx.beginPath();
  ctx.arc(player.x + player.facing * 7, player.y - 5, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff5b8b";
  ctx.fillRect(player.x - 13, player.y + 13, 12, 5);
  ctx.fillRect(player.x + 4, player.y + 13, 12, 5);

  ctx.globalAlpha = 1;
}

function drawHud() {
  const speed = Math.round(Math.abs(player.vx));
  ctx.fillStyle = "rgba(5, 9, 11, 0.72)";
  roundRect(16, 14, 290, 86, 8);
  ctx.fill();

  ctx.fillStyle = "#eef7f8";
  ctx.font = "bold 17px Inter, sans-serif";
  ctx.fillText(`Cristais ${player.rings}`, 32, 40);
  ctx.fillText(`Vel. ${speed}`, 32, 68);

  ctx.fillStyle = "#173139";
  roundRect(136, 55, 146, 14, 7);
  ctx.fill();
  ctx.fillStyle = player.boost > 22 ? "#48e0ef" : "#ff805c";
  roundRect(136, 55, 146 * (player.boost / 100), 14, 7);
  ctx.fill();
  ctx.fillStyle = "#abd8dc";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(player.sliding ? "Deslizando" : "Boost", 136, 47);

  ctx.fillStyle = "rgba(5, 9, 11, 0.62)";
  roundRect(VIEW_W - 178, 14, 158, 56, 8);
  ctx.fill();
  ctx.fillStyle = "#eef7f8";
  ctx.font = "bold 16px Inter, sans-serif";
  ctx.fillText(`${gameTime.toFixed(2)}s`, VIEW_W - 158, 38);
  ctx.font = "12px Inter, sans-serif";
  ctx.fillStyle = "#abd8dc";
  ctx.fillText(`Recorde ${bestTime ? bestTime.toFixed(2) + 's' : '--'}`, VIEW_W - 158, 58);
  if (paused) {
    ctx.fillStyle = 'rgba(5, 9, 20, .75)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillText('PAUSADO', VIEW_W / 2, VIEW_H / 2);
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('Pressione P para continuar', VIEW_W / 2, VIEW_H / 2 + 40);
    ctx.textAlign = 'left';
  }
}

function yOnTrack(floor, x) {
  const t = clamp((x - floor.x1) / (floor.x2 - floor.x1), 0, 1);
  return lerp(floor.y1, floor.y2, t);
}

function circleRect(cx, cy, radius, box) {
  const nearestX = clamp(cx, box.x, box.x + box.w);
  const nearestY = clamp(cy, box.y, box.y + box.h);
  return distance(cx, cy, nearestX, nearestY) <= radius;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function roundRect(x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if ([' ', 'arrowup', 'w', 'k'].includes(key) && !jumpHeld) {
    jumpBuffer = 0.13;
    jumpHeld = true;
  }
  if (key === 'p' && gameStarted && !gameCleared && !event.repeat) {
    paused = !paused;
    accumulator = 0;
  }
  if (event.key.toLowerCase() === "r") {
    resetGame();
    if (!gameStarted) {
      overlay.classList.add("is-hidden");
      gameStarted = true;
      ensureLoop();
    }
  }
  if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  if ([' ', 'arrowup', 'w', 'k'].includes(key)) jumpHeld = false;
});

window.addEventListener('blur', () => { keys.clear(); jumpHeld = false; if (gameStarted) paused = true; });
startButton.addEventListener("click", startGame);

// Touch input uses the same controls as the keyboard.
document.querySelectorAll('[data-key]').forEach(button => {
  const key = button.dataset.key;
  const release = event => { event.preventDefault(); keys.delete(key); if (key === ' ') jumpHeld = false; };
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(key);
    if (key === ' ' && !jumpHeld) { jumpBuffer = 0.13; jumpHeld = true; }
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

draw();

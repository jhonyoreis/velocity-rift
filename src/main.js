const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");

const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const WORLD_W = 22700;
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
  y: 402,
  prevX: 90,
  prevY: 402,
  vx: 0,
  vy: 0,
  facing: 1,
  onGround: false,
  ground: null,
  rings: 0,
  boost: 0,
  invulnerable: 0,
  trail: [],
  sliding: false,
};


const spawn = { x: 90, y: 402 };
// One continuous route with deliberate jumps between the two ground gaps.
const tracks = [
  track(0,420,1200,420,"intro"),track(1200,420,1800,455,"descent"),
  track(1800,455,2600,455,"intro"),track(2600,455,3500,420,"rise"),
  track(3500,420,4650,420,"rhythm"),track(4790,440,5400,440,"rhythm"),
  track(5400,440,6100,350,"rise"),track(6100,350,6750,350,"rhythm"),
  track(6750,350,7000,430,"descent"),track(7000,430,8000,430,"slide"),
  track(8000,430,8600,460,"descent"),track(8600,460,9900,460,"slide"),
  track(9900,460,10700,420,"rise"),track(10700,420,12100,420,"boost"),
  track(12100,420,13000,470,"descent"),track(13000,470,14500,470,"boost"),
  track(14500,470,15200,470,"mastery"),track(15200,470,15900,370,"rise"),
  track(15900,370,17000,370,"mastery"),track(17150,410,18000,410,"mastery"),
  track(18000,410,19000,450,"descent"),track(19000,450,19800,450,"finale"),
  track(19800,450,20600,350,"rise"),track(20600,350,21300,350,"finale"),
  track(21300,350,21900,420,"descent"),track(21900,420,22700,420,"finale"),
];
const chapters = [
  {x:0,title:"01 / PRIMEIROS PASSOS"},{x:3500,title:"02 / RITMO E SALTOS"},
  {x:7000,title:"03 / TUNEIS DE LUZ"},{x:10700,title:"04 / ENERGIA CINETICA"},
  {x:14500,title:"05 / PROVA DE DOMINIO"},{x:19000,title:"06 / RETA FINAL"},
];
const signs = [
  {x:280,title:"MOVER",hint:"A / D OU SETAS"},
  {x:730,title:"PULAR",hint:"ESPACO / W"},
  {x:2050,title:"CRISTAIS",hint:"COLETE PARA PONTUAR"},
  {x:3760,title:"IMPULSO",hint:"USE O TERRENO"},
  {x:4440,title:"SALTE",hint:"SUPERAR VAO"},
  {x:7120,title:"DESLIZAR",hint:"S / SETA PARA BAIXO"},
  {x:10690,title:"ENERGIA",hint:"SOMENTE ORBES RECARREGAM"},
  {x:11440,title:"PORTAO",hint:"BOOST: SHIFT OU J"},
  {x:15370,title:"COMBINE",hint:"PULO + SLIDE"},
  {x:18830,title:"ULTIMO DESAFIO",hint:"GUARDE ENERGIA"},
  {x:21850,title:"CHEGADA",hint:"SIGA EM FRENTE"},
];
const checkpoints = [2900,6600,10100,14200,18300].map(x=>({
  x,y:groundY(x)-PLAYER_RADIUS,active:false
}));
const walls = [
  rect(-120,0,120,WORLD_H,"left-wall"),
  rect(11690,346,45,74,"break-gate"),
  rect(19560,376,45,74,"break-gate"),
];
const tunnels = [
  {x:7480,w:390,ground:430},{x:8910,w:460,ground:460},
  {x:16320,w:455,ground:370},
];
const enemies = [1450,3150,3850,5480,6230,8140,9670,12370,13420,15080,
  16050,17600,18650,20100,21490,22160].map((x,i)=>
  enemy(x,groundY(x)-3,i%3===0?36:0)
);
const rings = [];
for (const [start,count,spacing] of [
  [320,9,62],[1650,10,60],[3650,12,65],[4970,7,64],
  [5730,8,68],[7070,9,60],[8230,7,65],[9530,8,68],
  [10980,9,66],[12380,10,64],[13600,8,65],[14900,10,58],
  [16000,8,65],[17250,9,65],[18550,7,62],[19800,9,66],
  [20900,8,58],[21870,10,60],
]) {
  for(let i=0;i<count;i++){
    const x=start+i*spacing,ground=groundY(x);
    if(ground!==null) rings.push({
      x,y:ground-33-Math.sin(i/Math.max(count-1,1)*Math.PI)*14,
      r:8,active:true
    });
  }
}
const boostOrbs = [930,4010,7160,8630,10840,12700,14680,16140,19160,21060]
  .map(x=>orb(x,groundY(x)-34));
const springs = [4600,16930].map(x=>({
  x,y:groundY(x)-10,w:36,h:15,powerX:480,powerY:-680
}));
const boostPads = [];
const spikes = [2320,4090,5820,8390,9780,13130,15100,17900,20550,21640]
  .map(x=>({x,y:groundY(x)-22,w:65,h:22}));
const goal = {x:22550,y:348,w:54,h:72};
function groundY(x){
  const floor=tracks.find(t=>x>=t.x1&&x<=t.x2);
  return floor?yOnTrack(floor,x):null;
}

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
  player.boost = 0;
  player.invulnerable = 0;
  player.trail = [];
  player.sliding = false;
  player.boosting = false;
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
  checkpoints.forEach(point => { point.active = false; });
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

  player.sliding = slide && player.onGround;
  const accel = player.onGround ? (player.sliding ? 390 : 1280) : 660;
  const friction = player.onGround ? (player.sliding ? 180 : 1050) : 110;
  const normalMax = 480;
  const boostMax = 790;

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

  const boosting = boost && player.boost > 0 && Math.abs(player.vx) > 50;
  player.boosting = boosting;
  if (boosting) {
    player.vx += player.facing * 1750 * dt;
    player.boost = Math.max(0, player.boost - 34 * dt);
    player.trail.push({ x: player.x, y: player.y, life: 0.24 });
  }

  const maxSpeed = boosting ? boostMax : normalMax;
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  const underTunnel = tunnels.some(t => player.x > t.x && player.x < t.x + t.w);
  if (jumpBuffer > 0 && coyoteTimer > 0 && !underTunnel) {
    player.sliding = false;
    player.vy = -660 - Math.min(90, Math.abs(player.vx) * 0.09);
    player.onGround = false;
    player.ground = null;
    jumpBuffer = 0;
    coyoteTimer = 0;
  }

  if (!jump && player.vy < -160) player.vy += 1450 * dt;
  player.vy += 1850 * dt;
  player.vy = Math.min(player.vy, 1250);
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  resolveTracks();
  resolveTunnels();
  resolveWalls();
  updateCheckpoints();
  updateEnemies(dt);
  collectItems();
  handleHazards();
  handleBoostPads();
  handleSprings();
  updateTrail(dt);

  player.x = clamp(player.x, PLAYER_RADIUS, WORLD_W - PLAYER_RADIUS);

  if (player.y > 720) {
    damagePlayer(true);
  }

  if (circleRect(player.x, player.y, PLAYER_RADIUS, goal)) {
    gameCleared = true;
    if (!bestTime || gameTime < bestTime) {
      bestTime = gameTime;
      try { localStorage.setItem('velocity-rift-best-time', String(bestTime)); } catch (_) { /* storage may be disabled */ }
    }
    const grade = gameTime < 75 ? 'S' : gameTime < 100 ? 'A' : gameTime < 145 ? 'B' : 'C';
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
    player.vx += clamp(slope * 230, -115, 115) * FIXED_DT;
  } else {
    player.onGround = false;
    player.ground = null;
  }
}

function resolveTunnels() {
  for (const tunnel of tunnels) {
    if (player.x + PLAYER_RADIUS < tunnel.x || player.x - PLAYER_RADIUS > tunnel.x + tunnel.w) continue;
    if (player.onGround && player.sliding) continue;
    // The solid roof also prevents jumping or flying through the tunnel.
    const ceiling = { x: tunnel.x, y: tunnel.ground - 165, w: tunnel.w, h: 139 };
    if (!circleRect(player.x, player.y, PLAYER_RADIUS, ceiling)) continue;
    const fromLeft = player.prevX <= tunnel.x ? true :
      player.prevX >= tunnel.x + tunnel.w ? false :
      player.x < tunnel.x + tunnel.w / 2;
    player.x = fromLeft ? tunnel.x - PLAYER_RADIUS : tunnel.x + tunnel.w + PLAYER_RADIUS;
    player.vx = 0;
    break;
  }
}
function resolveWalls() {
  for (const wall of walls) {
    if (!wall.active || !circleRect(player.x, player.y, PLAYER_RADIUS, wall)) continue;
    if (wall.kind === "break-gate") {
      if (player.boosting && Math.abs(player.vx) > 510) {
        wall.active = false;
        player.vx += player.facing * 60;
        shakeTime = 0.13;
      } else {
        // The preceding orb becomes available again if boost was used too early.
        boostOrbs.forEach(item => {
          if (item.x < wall.x && item.x > wall.x - 1400) item.active = true;
        });
        player.x = player.prevX;
        player.vx = 0;
      }
    } else {
      player.x = player.prevX;
      player.vx = 0;
    }
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
    const smash = player.boosting && Math.abs(player.vx) > 570;

    if (stomp || smash) {
      bad.alive = false;
      player.vy = stomp ? -520 : player.vy;
      player.vx += player.facing * 80;
      // Enemies do not refill boost.
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
      // Crystals grant score only.
    }
  }

  for (const boostOrb of boostOrbs) {
    if (!boostOrb.active) continue;
    if (distance(player.x, player.y, boostOrb.x, boostOrb.y) < PLAYER_RADIUS + boostOrb.r) {
      boostOrb.active = false;
      player.boost = Math.min(100, player.boost + 55);
      // Orb grants energy, not speed.
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
      // Pads do not replenish energy.
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
    if (index > checkpointIndex && player.x >= point.x) {
      checkpointIndex = index;
      point.active = true;
    }
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
    player.boost = 0;
    boostOrbs.forEach(item => { if (item.x > respawn.x) item.active = true; });
    coyoteTimer = 0;
    jumpBuffer = 0;
    player.invulnerable = 1.3;
    return;
  }

  player.rings = Math.max(0, player.rings - 8);
  player.vx = -player.facing * 250;
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
  drawForest();
  drawTracks();
  drawTunnels();
  drawSigns();
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

function drawForest() {
  // Procedural shapes repeat without external assets and are culled off-screen.
  const first = Math.floor(cameraX / 235) - 2;
  const last = Math.ceil((cameraX + VIEW_W) / 235) + 2;
  for (let i = first; i <= last; i += 1) {
    const x = i * 235 + 115, ground = groundY(x);
    if (ground == null) continue;
    const height = 55 + ((i % 4 + 4) % 4) * 21;
    ctx.fillStyle = i % 2 ? "#123e42" : "#17555a";
    ctx.fillRect(x - 6, ground - height + 18, 12, height);
    ctx.fillStyle = i % 3 ? "#18766f" : "#22918b";
    ctx.beginPath();
    ctx.moveTo(x - 47, ground - height + 20);
    ctx.lineTo(x, ground - height - 30);
    ctx.lineTo(x + 47, ground - height + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5bf0df";
    ctx.fillRect(x - 3, ground - height + 4, 6, 6);
  }
}
function drawTracks() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const floor of tracks) {
    if (floor.x2 < cameraX - 120 || floor.x1 > cameraX + VIEW_W + 120) continue;
    ctx.strokeStyle = floor.kind === "boost" ? "#f6ac43" : floor.kind === "finale" ? "#b785ef" : "#38dcd0";
    ctx.lineWidth = 19;
    ctx.beginPath();
    ctx.moveTo(floor.x1, floor.y1);
    ctx.lineTo(floor.x2, floor.y2);
    ctx.stroke();
    ctx.strokeStyle = "#14444d";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(floor.x1, floor.y1 + 5);
    ctx.lineTo(floor.x2, floor.y2 + 5);
    ctx.stroke();
  }
  for (const wall of walls) {
    if (!wall.active || wall.x < cameraX - 80 || wall.x > cameraX + VIEW_W + 80) continue;
    ctx.fillStyle = wall.kind === "break-gate" ? "#f6ac43" : "#324d59";
    roundRect(wall.x, wall.y, wall.w, wall.h, 6);
    ctx.fill();
    if (wall.kind === "break-gate") {
      ctx.fillStyle = "#101c36";
      ctx.font = "bold 12px system-ui";
      ctx.fillText("BOOST", wall.x + 1, wall.y + 39);
    }
  }
}
function drawTunnels() {
  for (const tunnel of tunnels) {
    if (tunnel.x > cameraX + VIEW_W + 80 || tunnel.x + tunnel.w < cameraX - 80) continue;
    ctx.fillStyle = "#1a384e";
    roundRect(tunnel.x, tunnel.ground - 165, tunnel.w, 139, 9);
    ctx.fill();
    ctx.strokeStyle = "#f6ac43";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(tunnel.x, tunnel.ground - 26);
    ctx.lineTo(tunnel.x + tunnel.w, tunnel.ground - 26);
    ctx.stroke();
    ctx.fillStyle = "#ffe0a6";
    ctx.font = "bold 14px system-ui";
    ctx.fillText("↓ SLIDE", tunnel.x + 22, tunnel.ground - 59);
  }
}
function drawSigns() {
  for (const sign of signs) {
    if (sign.x < cameraX - 220 || sign.x > cameraX + VIEW_W + 100) continue;
    const ground = groundY(sign.x);
    if (ground == null) continue;
    ctx.fillStyle = "rgba(16, 28, 54, 0.94)";
    roundRect(sign.x, ground - 117, 210, 66, 8);
    ctx.fill();
    ctx.strokeStyle = "#38dcd0";
    ctx.lineWidth = 2;
    ctx.strokeRect(sign.x + 2, ground - 115, 206, 62);
    ctx.fillStyle = "#f6ac43";
    ctx.font = "bold 16px system-ui";
    ctx.fillText(sign.title, sign.x + 12, ground - 88);
    ctx.fillStyle = "#f3fbff";
    ctx.font = "11px system-ui";
    ctx.fillText(sign.hint, sign.x + 12, ground - 67);
  }
}
function drawObjects() {
  checkpoints.forEach((point, index) => {
    if (point.x < cameraX - 80 || point.x > cameraX + VIEW_W + 80) return;
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

  const speedGlow = clamp(Math.abs(player.vx) / 790, 0, 1);
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

  ctx.fillStyle = "#f6ac43";
  ctx.fillRect(player.x - 15, player.y + 12, 14, 7);
  ctx.fillRect(player.x + 3, player.y + 12, 14, 7);

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
  const progress = clamp(player.x / goal.x, 0, 1);
  ctx.fillStyle = 'rgba(5, 9, 20, .64)';
  roundRect(325, 18, 420, 21, 7);
  ctx.fill();
  ctx.fillStyle = '#f6ac43';
  roundRect(332, 24, Math.max(0.01, 406 * progress), 8, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui';
  const section = chapters.slice().reverse().find(part => player.x >= part.x);
  ctx.fillText(section ? section.title : 'PRIMEIRO IMPULSO', 335, 54);
  ctx.fillText(Math.round(progress * 100) + '%', 704, 54);
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

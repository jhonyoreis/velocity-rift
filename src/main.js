import {SECRET_DEFS} from "./data/secretRoutes.js";
import {ACHIEVEMENTS} from "./data/achievements.js";
import {createStageOneWorld} from "./levels/forest.js";
import {createStageTwoWorld} from "./levels/canyon.js";
import {createStageThreeWorld} from "./levels/city.js";
import {installSecretRoutes} from "./levels/secretChallenges.js";
import {gradeForTime as gradeForTimeByStage} from "./game/scoring.js";
import {computeCampaignCompletion} from "./game/completion.js";
import {yOnTrack,circleRect,distance,approach,clamp,lerp} from "./game/geometry.js";
import {renderCityBackground,renderForest} from "./rendering/scenery.js";
import {renderSecretBackdrop} from "./rendering/secretBackdrop.js";
import {RIFT_BOSS_ARENA_LEFT,RIFT_WORLD_WIDTH} from "./levels/riftCorridor.js";
import {riftPlatformPhase,riftElevatorY} from "./game/riftPlatforms.js";
import {renderRiftCorridorBackground} from "./rendering/riftCorridorBackground.js";
import {createEnemy as enemy,isCityEnemyType} from "./game/enemies.js";
import {resolveAirDashDirection} from "./game/dashDirection.js";
import {calculateCrystalDamage} from "./game/crystals.js";
import {checkpointReached,checkpointRespawnTarget} from "./game/checkpoints.js";
import {renderCrystal} from "./rendering/crystals.js";
import {architectPhase,architectBarrageDuration,spawnArchitectRifts,architectRiftState} from "./bosses/architectPatterns.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");
const mainMenu = document.querySelector("#mainMenu");
const stageMenu = document.querySelector("#stageMenu");
const resultMenu = document.querySelector("#resultMenu");
const pauseButton = document.querySelector("#pauseButton");
const menuButton = document.querySelector("#menuButton");
const achievementsMenu=document.querySelector("#achievementsMenu");
const settingsMenu=document.querySelector("#settingsMenu");
const newGameConfirm=document.querySelector("#newGameConfirm");
const pauseMenu=document.querySelector("#pauseMenu");
const deathMenu=document.querySelector("#deathMenu");
const cinematicMenu=document.querySelector("#cinematicMenu");
const galleryMenu=document.querySelector("#galleryMenu");
const screens=[mainMenu,stageMenu,resultMenu,achievementsMenu,settingsMenu,newGameConfirm,pauseMenu,deathMenu,cinematicMenu,galleryMenu];
let selectedMapStage=1;
const soundToggle = document.querySelector("#soundToggle");
const musicToggle = document.querySelector("#musicToggle");
const trackNowPlaying = document.querySelector("#trackNowPlaying");
const debugToggle = document.querySelector("#debugToggle");

const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
let WORLD_W = 22700;
const WORLD_H = 820;
const PLAYER_RADIUS = 18;

const keys = new Set();
let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1 / 120;
const BOOST_MAX_SPEED = 590;
const BOOST_ACCELERATION = 850;
const BOOST_GATE_MIN_SPEED = 510;
const BOOST_SMASH_MIN_SPEED = 550;
// A short burst of exponential momentum downhill, bounded for readable gameplay.
const SLIDE_DOWNHILL_CAP = 870;
const CAMERA_IDLE_ANCHOR = 0.42;
const CAMERA_FAST_ANCHOR = 0.19;
let paused = false;
let jumpBuffer = 0;
let coyoteTimer = 0;
let jumpHeld = false;
let checkpointIndex = -1;
const PROGRESS_KEY = "velocity-rift-progress-v1"; // Never erase 2.0 records.
const CAMPAIGN_KEY="velocity-rift-campaign-v3";
const AUDIO_SETTINGS_KEY="velocity-rift-audio-settings-v3";
const GRADE_ORDER=["C","B","A","S"];
// Nine stepping stones per secret ascent: ~600 units above the normal road.
// Each optional ascent is hand-authored rather than a repeated tower.
// Steps are [horizontal offset, rise, platform width, platform behavior].
let activeStage = 1;
let debugMode = false;
let debugUsedThisRun = false;
let bestTime = 0;
try { bestTime = Number(localStorage.getItem("velocity-rift-best-time")) || 0; } catch (_) { /* private storage */ }
const progress=loadProgress();
const campaign=loadCampaign();
const secretTrials=[];
const notification={title:"",subtitle:"",timer:0};
let runDamageCount=0,bossDamagedThisRun=false;
if (!bestTime && progress.stage1.bestTime) bestTime = progress.stage1.bestTime;
let loopRunning = false;
let gameStarted = false;
let gameCleared = false;
let gameTime = 0;
// Short automatic arrival inside the actual level. Flux runs from a
// temporary extension of the opening road up to the ORIGINAL spawn.
// Gameplay, collisions, checkpoints, pickups and race timer only begin
// after the player receives control (never skips record-distance).
const STAGE_ARRIVAL_SECONDS=2.05;
const stageArrival={active:false,elapsed:0,duration:STAGE_ARRIVAL_SECONDS,
  startX:-270,finishX:90,startingCameraX:-430};
let cameraX = 0;
let cameraY = 0;
let cameraAnchorX = VIEW_W * CAMERA_IDLE_ANCHOR;
let shakeTime = 0;
let visualTime = 0;
let particles = [];
// Dedicated, bounded cosmetic state: it never participates in hit detection.
const FLUX_GHOST_LIMIT = 10, FLUX_WAVE_LIMIT = 16;
const fluxFx = {ghosts:[],waves:[],stepTimer:0,ghostTimer:0,sparkTimer:0,
  run:0,air:0,boost:0,landing:0,takeoff:0,turn:0,hit:0,slide:0,
  pose:"idle",previousFacing:1};
let sparkleCooldown = 0;
let pickupSoundCooldown = 0;
let sentryShots = [];
let soundEnabled = true;
let audioContext = null;
let musicEnabled = true;
let musicBus = null;
let musicStep = 0;
let nextMusicNote = 0;
try { musicEnabled = localStorage.getItem("velocity-rift-music") !== "off"; } catch (_) {}

try { soundEnabled = localStorage.getItem("velocity-rift-sound") !== "off"; } catch (_) { /* unavailable storage */ }
const audioLevels=loadAudioLevels();

// Aerial dash is always horizontal, locked to Flux's facing direction
// at activation. No mouse aiming, diagonal movement or vertical boost.
const airDash={active:false,available:true,time:0,dx:1,dy:0,trail:0};
const DASH_SECONDS=.255,DASH_SPEED=1140;
const cityDashCore={x:3730,y:396};
let dashUnlockFlash=0;
function dashUnlocked(){
  return campaign.aerialDash||((debugMode||debugUsedThisRun)&&activeStage===3);
}
function resetAirDash(){
  Object.assign(airDash,{active:false,available:true,time:0,trail:0,dx:1,dy:0});
  dashUnlockFlash=0;
}
function startAirDash(){
  if(!gameStarted||paused||cinematic.active||stageArrival.active||gameCleared||
    !dashUnlocked()||player.onGround||!airDash.available)return false;
  const direction=resolveAirDashDirection(player.facing);
  airDash.dx=direction.dx;airDash.dy=direction.dy;
  airDash.active=true;airDash.available=false;
  airDash.time=DASH_SECONDS;airDash.trail=1;
  player.vx=airDash.dx*DASH_SPEED;
  player.vy=airDash.dy*DASH_SPEED;
  triggerFluxFx("boost");
  emitParticles(player.x,player.y,"#fff2aa",17,185);
  playSfx("air-dash");
  return true;
}
function updateAirDash(dt){
  if(airDash.active){
    airDash.time=Math.max(0,airDash.time-dt);
    player.vx=airDash.dx*DASH_SPEED;
    player.vy=airDash.dy*DASH_SPEED;
    if(airDash.time===0){
      airDash.active=false;
      player.vx=airDash.dx*560;
      player.vy=Math.min(220,airDash.dy*390);
    }
  }
  if(player.onGround&&!airDash.active)airDash.available=true;
  airDash.trail=Math.max(0,airDash.trail-dt*2.4);
  dashUnlockFlash=Math.max(0,dashUnlockFlash-dt);
}
function collectCityDashCore(){
  if(activeStage!==3||campaign.aerialDash||player.x<cityDashCore.x-32||
    player.x>cityDashCore.x+32||Math.abs(player.y-cityDashCore.y)>60)return;
  if(!debugUsedThisRun){campaign.aerialDash=true;saveCampaign();grantAchievement("dash");}
  airDash.available=true;dashUnlockFlash=2;
  notification.title="NÚCLEO DE ÍMPETO RECUPERADO";
  notification.subtitle="PULE E APERTE PULO NOVAMENTE · DASH NA DIREÇÃO DO FLUX";
  notification.timer=3.4;
  emitParticles(cityDashCore.x,cityDashCore.y,"#ffe89c",42,250);
  playSfx("dash-unlock");
}
function drawCityDashCore(){
  if(activeStage!==3||campaign.aerialDash)return;
  const t=visualTime;
  ctx.save();ctx.translate(cityDashCore.x,cityDashCore.y);
  ctx.shadowColor="#ffe09c";ctx.shadowBlur=25;
  ctx.rotate(t*.8);ctx.fillStyle="#fff2b5";ctx.strokeStyle="#8ffff3";
  ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(21,0);
  ctx.lineTo(0,24);ctx.lineTo(-21,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
}
function drawAirDashFX(){
  if(!airDash.active&&airDash.trail<=0)return;
  ctx.save();ctx.globalAlpha=.12+airDash.trail*.25;
  ctx.strokeStyle="#b5fff0";ctx.lineWidth=16;
  ctx.beginPath();ctx.moveTo(player.x-airDash.dx*80,player.y-airDash.dy*80);
  ctx.lineTo(player.x,player.y);ctx.stroke();ctx.restore();
}

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
  downhillSliding: false,
  animationPhase: 0,
  cores: 0,
  falls: 0,
};


const stageOneWorld=createStageOneWorld({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H,worldW:WORLD_W});
const spawn={...stageOneWorld.spawn},goal={...stageOneWorld.goal};
const tracks=stageOneWorld.tracks.map(x=>({...x}));
const chapters=stageOneWorld.chapters.map(x=>({...x}));
const signs=stageOneWorld.signs.map(x=>({...x}));
const checkpoints=stageOneWorld.checkpoints.map(x=>({...x}));
const walls=stageOneWorld.walls.map(x=>({...x}));
const tunnels=stageOneWorld.tunnels.map(x=>({...x}));
const enemies=stageOneWorld.enemies.map(x=>({...x}));
const rings=stageOneWorld.rings.map(x=>({...x}));
const boostOrbs=stageOneWorld.boostOrbs.map(x=>({...x}));
const springs=stageOneWorld.springs.map(x=>({...x}));
const boostPads=stageOneWorld.boostPads.map(x=>({...x}));
const spikes=stageOneWorld.spikes.map(x=>({...x}));
const pulseGates=stageOneWorld.pulseGates.map(x=>({...x}));
const memoryCores=stageOneWorld.memoryCores.map(x=>({...x}));
const guardian={
  x:33360,y:336,hp:3,maxHp:3,active:false,defeated:false,
  state:"telegraph",timer:0,cycle:0,arenaLeft:32710,arenaRight:33670,
  aimX:32910,aimY:392,lockAim:false,
  pickups:[],arenaFloor:410,introDuration:1.85
};
const GUARDIAN_INTRO_SECONDS=1.85;
const GUARDIAN_COLLAPSE_SECONDS=2.75;
const GUARDIAN_SHARD_LIMIT=90;
const guardianFx={shards:[],rings:[],flash:0,impact:0,entry:0};
// The stage 2 exit is a dimensional rift, never an ordinary white goal door.
// All portal state is reset when the stage or Guardian encounter restarts.
const RIFT_OPEN_SECONDS=1.45;
const riftPortal={opening:false,open:false,time:0,particleTimer:0};
// Switching stages replaces only world data; the physics and Flux controls stay shared.
const WORLD_KEYS=["tracks","chapters","signs","checkpoints","walls","tunnels",
  "enemies","rings","boostOrbs","springs","boostPads","spikes","pulseGates","memoryCores"];
const levelApi={track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H};
const STAGES={1:stageOneWorld,2:createStageTwoWorld({...levelApi,guardian}),3:createStageThreeWorld(levelApi)};
installSecretRoutes(STAGES[1],1,{track,PLAYER_RADIUS});
installSecretRoutes(STAGES[2],2,{track,PLAYER_RADIUS});
installSecretRoutes(STAGES[3],3,{track,PLAYER_RADIUS});

function activateStage(stage=1) {
  if(!STAGES[stage])throw new Error("Unknown level "+stage);
  activeStage=stage;
  syncTrackLabel();
  const data=STAGES[stage];
  WORLD_W=data.worldW;
  for(const [key,arr] of [
    ["tracks",tracks],["chapters",chapters],["signs",signs],["checkpoints",checkpoints],
    ["walls",walls],["tunnels",tunnels],["enemies",enemies],["rings",rings],
    ["boostOrbs",boostOrbs],["springs",springs],["boostPads",boostPads],
    ["spikes",spikes],["pulseGates",pulseGates],["memoryCores",memoryCores]
  ]){
    arr.splice(0,arr.length,...data[key].map(item=>({...item})));
  }
  Object.assign(goal,data.goal);Object.assign(spawn,data.spawn);
  bestTime=progress["stage"+stage].bestTime;
  secretTrials.splice(0,secretTrials.length,...data.secretTrials.map(t=>({
    ...t,
    platforms:t.platforms.map(p=>({...p})),
    sentinels:t.sentinels.map(b=>({...b})),
    shots:[]
  })));
  resetGuardian();
  resetCityBoss();
}

function secretPlatformSolid(floor){
  if(floor.kind==="rift-phase")return riftPlatformPhase(floor,gameTime).solid;
  if(!floor.secretId)return true;
  const trial=secretTrials.find(t=>t.id===floor.secretId);
  if(!trial?.active)return true;
  if(floor.behavior==="crumble")return !floor.broken;
  if(floor.behavior==="phase")
    // A short safe opening lets the player learn the rhythm; afterwards
    // the bridge visibly flickers and periodically becomes intangible.
    return trial.elapsed<2.1||
      Math.sin(trial.elapsed*1.9+floor.phase)>-.76;
  return true;
}
function updateMovingPlatforms(dt) {
  for(const floor of tracks){
    if(activeStage===3&&floor.kind==="rift-elevator"){
      const newY=riftElevatorY(floor,gameTime),dy=newY-floor.y1;
      floor.y1=newY;floor.y2=newY;
      if(player.onGround&&player.ground===floor){
        player.y+=dy;player.prevY+=dy;
      }
      continue;
    }
    if(floor.secretId){
      const trial=secretTrials.find(t=>t.id===floor.secretId);
      if(floor.behavior==="moving"){
        const motion=trial?.active?
          Math.sin(trial.elapsed*floor.speed+floor.phase)*floor.swing:0;
        const newX=floor.originX+motion,dx=newX-floor.x1;
        floor.x1=newX;floor.x2=floor.originX2+motion;
        if(player.ground===floor&&player.onGround){
          player.x+=dx;player.prevX+=dx;
        }
      }else if(floor.behavior==="crumble"){
        if(!trial?.active){
          floor.broken=false;floor.crumbleTime=0;
        }else{
          if(player.onGround&&player.ground===floor &&
             floor.crumbleTime===0&&!floor.broken){
            floor.crumbleTime=.88;
          }
          if(floor.crumbleTime>0){
            floor.crumbleTime=Math.max(0,floor.crumbleTime-dt);
            if(floor.crumbleTime===0)floor.broken=true;
          }
        }
      }
      continue;
    }
    if(![2,3].includes(activeStage)||!["moving","city-lift"].includes(floor.kind))continue;
    const newX=floor.originX+Math.sin(gameTime*floor.speed+floor.phase)*floor.swing;
    const dx=newX-floor.x1;
    floor.x1=newX;floor.x2+=dx;
    if(player.ground===floor&&player.onGround){
      player.x+=dx;player.prevX+=dx;
    }
  }
}

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

function gradeForTime(time,stage=activeStage){return gradeForTimeByStage(time,stage);}
function defaultStageProgress() {
  return { completed:false, clears:0, bestTime:0, bestGrade:"", bestCrystals:0, bestCores:0 };
}
function defaultProgress() {
  return {stage1:defaultStageProgress(),stage2:defaultStageProgress(),stage3:defaultStageProgress(),
    secrets:{stage1:[],stage2:[],stage3:[]},secretTimes:{stage1:{},stage2:{},stage3:{}},achievements:{}};
}
function loadProgress() {
  const result=defaultProgress();
  try {
    const saved=JSON.parse(localStorage.getItem(PROGRESS_KEY)||"null");
    for (const id of [1,2,3]) {
      const item=saved?.["stage"+id];
      if (!item || typeof item!=="object") continue;
      const record=result["stage"+id];
      record.completed=item.completed===true;
      record.clears=record.completed ? Math.max(1,Math.floor(clamp(Number(item.clears)||0,0,1000000))) : 0;
      const time=Number(item.bestTime);
      record.bestTime=Number.isFinite(time)&&time>0?time:0;
      record.bestGrade=GRADE_ORDER.includes(item.bestGrade)?item.bestGrade:"";
      record.bestCrystals=Math.floor(clamp(Number(item.bestCrystals)||0,0,1000000));
      record.bestCores=Math.floor(clamp(Number(item.bestCores)||0,0,3));
    }
    for(const stage of [1,2,3]){
      const key="stage"+stage,allowed=SECRET_DEFS[stage].map(def=>def.id);
      const existing=saved?.secrets?.[key];
      if(Array.isArray(existing))
        result.secrets[key]=[...new Set(existing.filter(id=>allowed.includes(id)))];
      for(const id of allowed){
        const time=Number(saved?.secretTimes?.[key]?.[id]);
        if(Number.isFinite(time)&&time>0&&time<10000)
          result.secretTimes[key][id]=time;
      }
    }
    for(const item of ACHIEVEMENTS)
      if(saved?.achievements?.[item.id]===true)result.achievements[item.id]=true;
    // Backfill achievements supported by old records; don't invent unknown
    // no-death/boss achievements that older saves never tracked.
    for(const stage of [1,2,3]){
      const record=result["stage"+stage];
      if(record.completed)result.achievements[stage===1?"first":stage===2?"canyon":"city"]=true;
      if(record.bestGrade==="S")result.achievements[stage===1?"s1":stage===2?"s2":"cityS"]=true;
      if(record.bestCores===3)result.achievements[stage===1?"cores1":stage===2?"cores2":"cityCores"]=true;
    }
    if(result.secrets.stage1.length+result.secrets.stage2.length>0)
      result.achievements.explorer=true;
    if(result.secrets.stage1.length===3)result.achievements.forestSecrets=true;
    if(result.secrets.stage2.length===3)result.achievements.canyonSecrets=true;
    if(result.secrets.stage1.length+result.secrets.stage2.length===6)
      result.achievements.sixSecrets=true;
    if(result.secrets.stage3.length===3)result.achievements.citySecrets=true;
    if(result.secrets.stage1.length+result.secrets.stage2.length+
      result.secrets.stage3.length===9)result.achievements.nineSecrets=true;
    if (!saved?.stage1 && bestTime>0 && Number.isFinite(bestTime)) {
      result.stage1={completed:true,clears:1,bestTime,bestGrade:gradeForTime(bestTime,1),bestCrystals:0,bestCores:0};
    }
  } catch (_) { /* Unavailable storage: keep in-memory progress. */ }
  return result;
}

// ---------------------- Canvas cinematic artwork ---------------------
// Original vector art for characters and final-boss foreshadowing.
function cinemaGradient(top,bottom){
  const grad=ctx.createLinearGradient(0,0,0,VIEW_H);
  grad.addColorStop(0,top);grad.addColorStop(1,bottom);
  ctx.fillStyle=grad;ctx.fillRect(0,0,VIEW_W,VIEW_H);
}
function cinemaRidge(y,height,color,offset=0){
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-60,VIEW_H);
  ctx.lineTo(-60,y+50);
  for(let i=0;i<8;i++){
    const x=i*155-90,peak=y-(i%3)*height+Math.sin(i*2.4+offset)*22;
    ctx.lineTo(x+75,peak);ctx.lineTo(x+165,y+65);
  }
  ctx.lineTo(VIEW_W+70,VIEW_H);ctx.closePath();ctx.fill();
}
function cinemaStars(clock,color="#cefff6",density=36){
  ctx.save();ctx.fillStyle=color;
  for(let i=0;i<density;i++){
    const x=(i*187+51)%VIEW_W,y=18+(i*97)%320;
    ctx.globalAlpha=.23+.5*(.5+.5*Math.sin(clock*(.8+i%3)+i));
    ctx.beginPath();ctx.arc(x,y,i%9===0?2.3:1.15,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
// Use the EXACT sprite renderer used by gameplay, including the helmet,
 // cyan crest/visor, dark body, orange scarf and little running feet.
function cinemaFlux(x,y,scale=1,clock=0,run=false){
  ctx.save();
  ctx.translate(x,y-15*scale*2.3);
  ctx.scale(scale*2.3,scale*2.3);
  const actor={x:0,y:0,facing:1,onGround:true,ground:null,
    sliding:false,boosting:run,invulnerable:0,
    vx:run?480:0,vy:0,animationPhase:clock*(run?16:2)};
  const fx={boost:run?.5:0,turn:0,landing:0,takeoff:0,hit:0,run:run?1:0};
  drawFluxBody(actor,fx,clock);
  ctx.restore();
}
// The same silhouette seen from the rear for the portal-arrival reveal.
function cinemaFluxBack(x,y,scale=1,clock=0){
  ctx.save();ctx.translate(x,y-15*scale*2.3);
  ctx.scale(scale*2.3,scale*2.3);
  const sway=Math.sin(clock*1.4)*.7;
  ctx.fillStyle="rgba(64,209,202,.20)";
  ctx.beginPath();ctx.ellipse(-9,3,25,18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffba5e";ctx.beginPath();
  ctx.moveTo(-11,-7+sway);ctx.lineTo(-27,-14);
  ctx.lineTo(-19,0);ctx.lineTo(-11,sway);ctx.closePath();ctx.fill();
  ctx.fillStyle="#ffbd65";ctx.beginPath();
  ctx.ellipse(-8,15+sway,10,5,-.18,0,Math.PI*2);
  ctx.ellipse(9,15+sway,11,5,.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#124955";ctx.beginPath();
  ctx.ellipse(-2,5+sway,13,14,-.16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f2fffd";ctx.beginPath();
  ctx.ellipse(0,-5+sway,17,15,-.13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#55d8dc";ctx.beginPath();
  ctx.moveTo(-12,-17+sway);ctx.lineTo(-16,-24+sway);
  ctx.lineTo(0,-19+sway);ctx.lineTo(7,-18+sway);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="#a1e6e1";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(-8,-4+sway);ctx.quadraticCurveTo(0,0+sway,9,-4+sway);ctx.stroke();
  ctx.restore();
}
function cinemaAlicia(x,y,scale=1,clock=0,lift=0){
  ctx.save();ctx.translate(x,y-lift);ctx.scale(scale,scale);
  const sway=Math.sin(clock*2)*3;
  ctx.fillStyle="#162742";ctx.beginPath();ctx.ellipse(0,0,29,6,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#283955";ctx.lineCap="round";ctx.lineWidth=9;
  ctx.beginPath();ctx.moveTo(-10,-21);ctx.lineTo(-9,0);
  ctx.moveTo(8,-21);ctx.lineTo(11,0);ctx.stroke();
  ctx.fillStyle="#ab80de";ctx.beginPath();
  ctx.moveTo(-16,-54);ctx.lineTo(16,-54);ctx.lineTo(26,-23);
  ctx.lineTo(-26,-23);ctx.closePath();ctx.fill();
  ctx.fillStyle="#dfbda9";ctx.beginPath();ctx.ellipse(0,-78,20,21,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#473052";ctx.beginPath();
  ctx.arc(0,-85,23,Math.PI,Math.PI*2);ctx.lineTo(22,-72);
  ctx.lineTo(14,-64);ctx.lineTo(10,-88);ctx.quadraticCurveTo(-17,-68,-21,-66);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="#392849";ctx.lineWidth=11;
  ctx.beginPath();ctx.moveTo(-19,-82);ctx.lineTo(-23,-48);
  ctx.moveTo(20,-82);ctx.lineTo(24,-51);ctx.stroke();
  ctx.fillStyle="#ffe0a2";ctx.beginPath();ctx.arc(14,-92,5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#ddb4ad";ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(-14,-51);
  ctx.lineTo(-26+sway,-45);
  ctx.moveTo(15,-51);ctx.lineTo(25+sway,-52);ctx.stroke();
  ctx.fillStyle="#282038";
  ctx.beginPath();ctx.arc(-7,-78,2.1,0,Math.PI*2);ctx.arc(7,-78,2.1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#6a3758";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.arc(0,-73,5,.08,Math.PI-.08);ctx.stroke();
  ctx.restore();
}
function cinemaFlower(x,y,clock,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ctx.rotate(Math.sin(clock*3)*.07);ctx.strokeStyle="#318d67";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-7,12,2,36);ctx.stroke();
  ctx.fillStyle="#56c89b";ctx.beginPath();
  ctx.ellipse(-6,17,9,4,-.5,0,Math.PI*2);ctx.fill();
  for(let p=0;p<5;p++){
    const a=p*Math.PI*2/5+clock*.05;
    ctx.fillStyle=p%2===0?"#ffb6ce":"#ffcfe1";ctx.beginPath();
    ctx.ellipse(Math.cos(a)*9,Math.sin(a)*9,10,7,a,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="#ffe6a5";ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function cinemaLandscape(clock,dark=0){
  cinemaGradient(dark?"#0d0927":"#20365e",dark?"#421c53":"#f6aa72");
  const sunX=720,sunY=137;
  ctx.save();ctx.fillStyle=dark?"#bd7be7":"#ffe9b6";
  ctx.shadowColor=dark?"#be58fc":"#ffd695";ctx.shadowBlur=65;
  ctx.beginPath();ctx.arc(sunX,sunY,dark?51:65,0,Math.PI*2);ctx.fill();
  ctx.restore();
  cinemaStars(clock,dark?"#acbaff":"#fafff6",dark?53:18);
  cinemaRidge(295,58,dark?"#292049":"#7e6a91",clock*.015);
  cinemaRidge(347,28,dark?"#17233f":"#546e88",clock*.03);
  ctx.fillStyle=dark?"#173b40":"#31846f";
  ctx.beginPath();ctx.moveTo(0,414);
  ctx.quadraticCurveTo(260,367,490,403);
  ctx.quadraticCurveTo(730,439,VIEW_W,376);
  ctx.lineTo(VIEW_W,VIEW_H);ctx.lineTo(0,VIEW_H);ctx.fill();
  ctx.fillStyle=dark?"#12313c":"#215b54";
  ctx.fillRect(0,470,VIEW_W,VIEW_H-470);
  for(let i=0;i<15;i++){
    const x=i*87+Math.sin(i)*19,y=413+Math.sin(i*2)*31;
    ctx.strokeStyle=dark?"#448c99":"#9ddda3";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x,y+10);ctx.lineTo(x,y-9);ctx.stroke();
    ctx.fillStyle=i%2?"#f8c7ec":"#fce7ae";
    ctx.beginPath();ctx.arc(x,y-10,3,0,Math.PI*2);ctx.fill();
  }
}
function cinemaPortal(x,y,clock,intensity=1){
  ctx.save();ctx.translate(x,y);
  const flicker=1+Math.sin(clock*4)*.07;
  ctx.scale(flicker*intensity,intensity);
  for(let i=5;i>=0;i--){
    ctx.globalAlpha=.12+(5-i)*.14;
    ctx.strokeStyle=i%2?"#df86fd":"#8c67ff";
    ctx.lineWidth=8+i*4;ctx.beginPath();
    ctx.ellipse(0,0,125+i*7,186+i*4,
      Math.sin(clock*.4)*.04,0,Math.PI*2);ctx.stroke();
  }
  const g=ctx.createLinearGradient(-115,-140,110,170);
  g.addColorStop(0,"#142154");g.addColorStop(.44,"#5d279d");
  g.addColorStop(.72,"#180c38");g.addColorStop(1,"#2d76ac");
  ctx.globalAlpha=.91;ctx.fillStyle=g;ctx.beginPath();
  ctx.ellipse(0,0,116,179,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#dfb2ff";ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(0,0,110,177,-clock*.04,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<17;i++){
    const angle=(i*2.4+clock*(i%2?-.8:.55)),r=35+i%6*14;
    ctx.fillStyle=i%2?"#a2f7f7":"#f5b6ff";ctx.globalAlpha=.5;
    ctx.beginPath();ctx.arc(Math.cos(angle)*r,Math.sin(angle)*r*1.4,2+i%3,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function cinemaSovereign(x,y,clock,scale=1){
  // A different visual language from the Prisma Guardian: vast winglike
  // void armor, shattered orbiting crown, asymmetric limbs and bright core.
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const float=Math.sin(clock*1.5)*5;
  ctx.translate(0,float);
  ctx.save();ctx.globalAlpha=.26;ctx.strokeStyle="#ae54ed";ctx.lineWidth=6;
  for(let i=0;i<3;i++){
    ctx.beginPath();ctx.ellipse(0,-114,85+i*24,25+i*5,
      Math.sin(clock*.17+i)*.15,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle="#110c2b";ctx.strokeStyle="#6b3c9b";ctx.lineWidth=3;
  for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(side*40,-130);
    ctx.lineTo(side*169,-253);
    ctx.lineTo(side*132,-120);
    ctx.lineTo(side*204,-174);
    ctx.lineTo(side*151,-43);
    ctx.lineTo(side*78,-22);ctx.closePath();
    ctx.fill();ctx.stroke();
  }
  ctx.fillStyle="#151126";
  ctx.beginPath();ctx.moveTo(-67,-169);ctx.lineTo(75,-161);
  ctx.lineTo(100,-81);ctx.lineTo(63,5);
  ctx.lineTo(19,91);ctx.lineTo(-8,117);
  ctx.lineTo(-38,54);ctx.lineTo(-104,-83);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#8e56c6";ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle="#251542";
  for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(side*65,-150);
    ctx.lineTo(side*107,-125);
    ctx.lineTo(side*117,-32);
    ctx.lineTo(side*145,24);
    ctx.lineTo(side*119,42);
    ctx.lineTo(side*82,-17);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#170b31";ctx.beginPath();
    ctx.moveTo(side*119,39);ctx.lineTo(side*150,45);
    ctx.lineTo(side*170,104);ctx.lineTo(side*140,76);
    ctx.lineTo(side*130,96);ctx.lineTo(side*110,51);ctx.closePath();ctx.fill();
    ctx.fillStyle="#251542";
  }
  ctx.fillStyle="#090e21";ctx.beginPath();ctx.ellipse(0,-197,47,64,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#9c57d8";ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle="#a854ef";ctx.shadowBlur=18;ctx.shadowColor="#c475ff";
  ctx.beginPath();ctx.ellipse(0,-199,24,5,0,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // Shattered crown is detached from the head to imply enormous scale.
  for(let i=-3;i<=3;i++){
    const xx=i*28,yy=-279-Math.cos(i*.7)*17+Math.sin(clock*1.2+i)*3;
    ctx.fillStyle="#1c1137";ctx.strokeStyle="#bd80f8";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(xx-11,yy+16);
    ctx.lineTo(xx-3,yy-26-Math.abs(i)*4);
    ctx.lineTo(xx+12,yy+13);ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor="#ed6cfe";ctx.shadowBlur=35;
  ctx.fillStyle="#f4d4ff";ctx.beginPath();ctx.arc(0,-99,24+Math.sin(clock*4)*2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#802de0";ctx.beginPath();ctx.arc(0,-99,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f8e9ff";ctx.beginPath();ctx.arc(0,-99,5,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.restore();
}
function cinemaCanyon(clock,showBoss=false){
  cinemaGradient("#070b2d","#59368b");
  cinemaStars(clock,"#c0aaff",48);
  cinemaRidge(365,98,"#24204e",clock*.03);
  ctx.fillStyle="#252057";
  ctx.fillRect(0,405,VIEW_W,135);
  for(let i=0;i<11;i++){
    const x=i*112-25,top=240+(i%4)*35;
    ctx.fillStyle=i%2?"#7653b3":"#4f4195";
    ctx.beginPath();ctx.moveTo(x,405);
    ctx.lineTo(x+26,top);ctx.lineTo(x+58,405);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#ad8ff7";ctx.lineWidth=3;ctx.stroke();
  }
  if(showBoss){
    cinemaPortal(705,263,clock,.7);
    ctx.save();ctx.globalAlpha=.85;
    cinemaSovereign(705,408,clock,.43);ctx.restore();
  }
}
function cinemaMetropolis(clock,action=false){
  cinemaGradient("#08102f","#4f3975");
  cinemaStars(clock,"#b0c9ff",46);
  ctx.fillStyle="#f4a3bc";ctx.beginPath();ctx.arc(728,120,51,0,Math.PI*2);ctx.fill();
  for(let layer=0;layer<3;layer++){
    const step=95+layer*38,move=action?clock*(70+layer*50):0;
    for(let i=-1;i<11;i++){
      const x=i*step-(move%step);
      const h=160+((i*7+layer*4)%5+5)%5*44;
      ctx.fillStyle=["#151e43","#1b2852","#20395e"][layer];
      ctx.fillRect(x,425-h,step*.75,h+120);
      if(layer===2){
        ctx.fillStyle="#8affec";
        for(let row=0;row<5;row++)for(let col=0;col<2;col++)
          if((row+col+i)%3!==0)
            ctx.fillRect(x+18+col*25,445-h+row*37,7,15);
      }
    }
  }
  ctx.fillStyle="#182b48";ctx.fillRect(0,413,960,127);
  ctx.fillStyle="#d5a8ff";ctx.fillRect(0,408,960,7);
  if(action){
    cinemaFlux(385+Math.sin(clock*4)*8,413,1.06,clock,true);
    ctx.strokeStyle="#c6eeff";ctx.lineWidth=3;
    for(let i=0;i<7;i++){
      const x=i*150-(clock*300%150);
      ctx.beginPath();ctx.moveTo(x,340+i%3*21);ctx.lineTo(x+68,340+i%3*21);ctx.stroke();
    }
  }else cinemaFluxBack(447,413,1.25,clock);
}

function cinemaForest(clock,running=false){
  cinemaGradient("#051e32","#12565d");
  cinemaStars(clock,"#a5ffea",27);
  for(let i=0;i<11;i++){
    const x=i*117-(running?clock*200%117:0),h=185+(i%4)*35;
    ctx.fillStyle=i%2?"#0c414b":"#0e5c56";
    ctx.fillRect(x,260-h,18,h+230);
    ctx.fillStyle=i%2?"#1d7d69":"#196b69";
    ctx.beginPath();ctx.ellipse(x+8,260-h,69,47,0,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="#1a3646";ctx.fillRect(0,410,VIEW_W,130);
  ctx.fillStyle="#78ffde";ctx.fillRect(0,406,VIEW_W,8);
  if(running){
    ctx.strokeStyle="#a4ffff";ctx.lineWidth=3;
    for(let i=0;i<15;i++){
      const x=(i*103-clock*600%1200+1200)%1200-100,y=140+i%6*40;
      ctx.globalAlpha=.22+i%4*.12;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+115,y);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
}
function cinemaNewWorld(clock){
  // A clear silhouette/reveal: Flux is facing away from the viewer
  // and looking at the unfamiliar mountains he must cross.
  cinemaGradient("#081930","#de8b9f");
  ctx.save();
  const glow=ctx.createLinearGradient(0,85,0,335);
  glow.addColorStop(0,"#f4a8ab");
  glow.addColorStop(1,"#ffe2a9");
  ctx.fillStyle=glow;
  ctx.beginPath();ctx.arc(670,167,81,0,Math.PI*2);ctx.fill();
  ctx.restore();
  cinemaStars(clock,"#f6e7ff",48);
  ctx.fillStyle="#473e74";
  ctx.beginPath();ctx.moveTo(0,373);
  for(let i=0;i<=8;i++){
    const x=i*130-40;
    ctx.lineTo(x,360);
    ctx.lineTo(x+75,134+(i%3)*37);
    ctx.lineTo(x+155,368);
  }
  ctx.lineTo(VIEW_W,VIEW_H);ctx.lineTo(0,VIEW_H);ctx.fill();
  ctx.fillStyle="#34375f";
  ctx.beginPath();ctx.moveTo(0,410);
  for(let i=0;i<=8;i++){
    const x=i*142-56;
    ctx.lineTo(x,405);
    ctx.lineTo(x+63,235+(i%4)*30);
    ctx.lineTo(x+155,405);
  }
  ctx.lineTo(VIEW_W,VIEW_H);ctx.lineTo(0,VIEW_H);ctx.fill();
  ctx.strokeStyle="#bfeaff";ctx.lineWidth=3;
  ctx.globalAlpha=.43;
  for(let i=0;i<6;i++){
    const x=i*154+20,top=280+(i%3)*23;
    ctx.beginPath();ctx.moveTo(x,top);
    ctx.lineTo(x+13,top-32);ctx.lineTo(x+32,top+8);ctx.stroke();
  }
  ctx.globalAlpha=1;
  ctx.fillStyle="#172f3b";
  ctx.beginPath();ctx.moveTo(0,456);
  ctx.quadraticCurveTo(420,405,VIEW_W,465);
  ctx.lineTo(VIEW_W,VIEW_H);ctx.lineTo(0,VIEW_H);ctx.fill();
  ctx.strokeStyle="#69e6d7";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(0,456);
  ctx.quadraticCurveTo(420,405,VIEW_W,465);ctx.stroke();
  // Entrance glow fades behind the newly arrived traveler.
  const intensity=Math.max(0,1-Math.min(1,clock/5));
  if(intensity>0){
    ctx.save();ctx.globalAlpha=intensity*.42;
    cinemaPortal(238,305,clock,.43);ctx.restore();
  }
  cinemaFluxBack(471,432,1.8,clock);
}
function drawCinematic(){
  if(!cinematic.active)return;
  const frame=CINEMATICS[cinematic.key].frames[cinematic.frameIndex],
    t=cinematic.clock,elapsed=cinematic.elapsed,
    ratio=Math.min(1,elapsed/frame.duration);
  ctx.save();ctx.clearRect(0,0,VIEW_W,VIEW_H);
  switch(frame.art){
    case "peace":
      cinemaLandscape(t);cinemaFlux(328,406,1.2,t);
      cinemaAlicia(552,405,1.13,t);break;
    case "flower":
      cinemaLandscape(t);cinemaFlux(330,408,1.25,t);
      cinemaAlicia(529,406,1.17,t);
      cinemaFlower(425+ratio*63,306-ratio*8,t,1.15);
      break;
    case "rift":
      cinemaLandscape(t,true);
      cinemaPortal(720,276,t,.5+ratio*.45);
      cinemaFlux(317,419,1.14,t);
      cinemaAlicia(480,414,1.08,t);
      cinemaFlower(420,395,t,.9);break;
    case "sovereign":
      cinemaLandscape(t,true);cinemaPortal(695,264,t,1.12);
      cinemaSovereign(695,412,t,.46+ratio*.44);
      cinemaFlux(240,442,.85,t);cinemaAlicia(370,438,.83,t);
      cinemaFlower(296,427,t,.85);break;
    case "taken":
      cinemaLandscape(t,true);cinemaPortal(694,264,t,1.1);
      cinemaSovereign(704,415,t,.69);
      cinemaFlux(270,441,1.02,t);
      cinemaAlicia(420+ratio*216,431,1-ratio*.45,t,ratio*61);
      cinemaFlower(401-ratio*86,442+ratio*10,t,1-ratio*.35);
      ctx.strokeStyle="#bf96ff";ctx.globalAlpha=.35+ratio*.5;
      ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(660,277);
      ctx.quadraticCurveTo(460,270,432+ratio*206,336-ratio*61);ctx.stroke();
      ctx.globalAlpha=1;break;
    case "pursuit":
      cinemaLandscape(t,true);cinemaPortal(700,264,t,1.04);
      cinemaSovereign(710,405,t,.43);
      cinemaFlux(270+ratio*450,450-ratio*45,1.04-ratio*.35,t,true);
      cinemaFlower(310,447,t,.65);break;
    case "arrival":
      cinemaNewWorld(elapsed);break;
    case "city":
      cinemaMetropolis(t,false);break;
    case "cityRun":
      cinemaMetropolis(t,true);break;
    case "forest":
      cinemaForest(t);cinemaPortal(165,267,t,.43);
      cinemaFlux(270,409,.85,t);break;
    case "forestRun":
      cinemaForest(t,true);cinemaFlux(370+Math.sin(t*2)*8,411,1.3,t,true);break;
    case "canyon":
      cinemaCanyon(t);cinemaFlux(250,409,1.06,t);break;
    case "canyonBoss":
      cinemaCanyon(t,true);cinemaFlux(200,435,.8,t);
      break;
    default:cinemaLandscape(t);
  }
  // Film grain made from deterministic geometry, without external assets.
  ctx.globalAlpha=.075;ctx.fillStyle="#f4efff";
  for(let i=0;i<44;i++){
    const x=(i*147+Math.floor(t*4)*53)%VIEW_W;
    const y=(i*71+Math.floor(t*5)*29)%VIEW_H;
    ctx.fillRect(x,y,2,2);
  }
  ctx.globalAlpha=1;
  ctx.fillStyle="#050d23";ctx.fillRect(0,0,VIEW_W,23);
  ctx.fillRect(0,VIEW_H-21,VIEW_W,21);
  ctx.restore();
}

// --------------------- Cinematic director (3.5) ----------------------
// All scenes render natively on the game Canvas; no video files, downloads,
// third-party imagery, or game-physics mutations.
const CINEMATICS={
  opening:{chapter:"PRÓLOGO · A FLOR E A RUPTURA",frames:[
    {speaker:"O ÚLTIMO DIA DE PAZ",title:"Antes das fendas",text:"No alto de um vale tranquilo, Flux e Alicia contemplavam o pôr do sol.",duration:3.9,art:"peace"},
    {speaker:"UM PRESENTE SIMPLES",title:"Uma flor para Alicia",text:"Flux oferece uma flor. Alicia a recebe, e por um instante o mundo parece perfeito.",duration:4.1,art:"flower",sound:"cin-flower"},
    {speaker:"ALGO DESPERTA",title:"O céu se rompe",text:"Uma rachadura violeta atravessa o horizonte. A luz começa a desaparecer.",duration:3.6,art:"rift",sound:"cin-rupture"},
    {speaker:"O SENHOR DAS FENDAS",title:"O Soberano da Ruptura",text:"Uma presença colossal surge da abertura. Até as montanhas parecem pequenas diante dele.",duration:4.9,art:"sovereign",sound:"cin-ominous"},
    {speaker:"A DISTÂNCIA ENTRE MUNDOS",title:"Alicia desaparece",text:"A energia da fenda envolve Alicia e a leva para além da dimensão. A flor permanece.",duration:4.1,art:"taken",sound:"cin-rupture"},
    {speaker:"A PROMESSA DO FLUX",title:"Eu vou encontrar você",text:"Flux avança em direção ao portal. Não importa quantas fendas precise atravessar.",duration:4.2,art:"pursuit",sound:"cin-chase"},
    {speaker:"ALÉM DO PORTAL",title:"Um novo mundo à frente",text:"Do outro lado da fenda, Flux para e observa montanhas desconhecidas. A jornada para resgatar Alicia está apenas começando.",duration:4.5,art:"arrival",sound:"cin-flower"}
  ]},
  intro1:{chapter:"CAPÍTULO 01 · FLORESTA NEON",frames:[
    {speaker:"PRIMEIRO IMPULSO",title:"Atravessar o impossível",text:"O portal lança Flux no coração de uma floresta desconhecida, iluminada por energia viva.",duration:3.8,art:"forest"},
    {speaker:"O CAMINHO COMEÇA",title:"A velocidade é a resposta",text:"Flux dispara entre copas luminosas. Cada salto o aproxima de Alicia.",duration:3.6,art:"forestRun",sound:"cin-chase"}
  ]},
  intro2:{chapter:"CAPÍTULO 02 · CÂNION PRISMA",frames:[
    {speaker:"ECOS DO PRISMA",title:"O cânion desperta",text:"Cristais gigantes erguem-se sobre abismos sem fim. Algo está guardando o próximo portal.",duration:3.9,art:"canyon"},
    {speaker:"UMA NOVA AMEAÇA",title:"O Guardião observa",text:"Entre raios violeta, o Guardião do Prisma desperta. A jornada precisa continuar.",duration:4,art:"canyonBoss",sound:"cin-ominous"}
  ]},
  intro3:{chapter:"CAPÍTULO 03 · CIDADE DAS FENDAS",frames:[
    {speaker:"DO OUTRO LADO DO CÂNION",title:"Uma cidade entre dimensões",
      text:"Flux observa torres suspensas e ruas tomadas por patrulhas. Além da metrópole, uma fenda ainda maior espera por ele.",
      duration:4.5,art:"city",sound:"cin-flower"},
    {speaker:"SINAIS DO ÚLTIMO PORTAL",title:"Corra pelos telhados",
      text:"Flux atravessa os primeiros prédios em alta velocidade. A cidade é o caminho para a dimensão onde Alicia está.",
      duration:4,art:"cityRun",sound:"cin-chase"}
  ]}
};
const cinematic={active:false,key:null,frameIndex:0,elapsed:0,
  clock:0,onEnd:null,replay:false};
let cinematicMusicStep=0;
let cinematicMusicMood="warm";
function showGalleryMenu(){
  showScreen(galleryMenu);
  refreshCinematicGallery();
}
function refreshCinematicGallery(){
  const entries=[["opening","Opening"],["intro1","StageOne"],["intro2","StageTwo"],["intro3","StageThree"]];
  for(const [key,name] of entries){
    const seen=campaign.scenesSeen.includes(key);
    const button=document.querySelector("#gallery"+name);
    const state=document.querySelector("#gallery"+name+"State");
    button.disabled=!seen;
    button.classList.toggle("is-unlocked",seen);
    state.textContent=seen?"ASSISTIDA · REVER CENA":"BLOQUEADA · ASSISTA NA CAMPANHA";
  }
}
function launchCinematic(key,onEnd,replay=false){
  if(!CINEMATICS[key])return false;
  cinematic.active=true;cinematic.key=key;cinematic.frameIndex=0;
  cinematic.elapsed=0;cinematic.clock=0;cinematic.onEnd=onEnd;
  cinematicMusicStep=0;cinematicMusicMood="warm";
  cinematic.replay=replay;
  gameStarted=false;paused=false;accumulator=0;
  keys.clear();jumpHeld=false;
  if(debugToggle)debugToggle.hidden=true;
  syncMusic();
  screens.forEach(screen=>{screen.hidden=screen!==cinematicMenu;});
  overlay.classList.remove("is-hidden");
  const panel=document.querySelector(".game-panel");
  panel.classList.remove("menu-active","pause-active");
  panel.classList.add("cinematic-active");
  pauseButton.hidden=true;
  refreshCinematicText();
  unlockAudio();
  // AudioContext is often created only on the scene-start click.
  syncMusic();
  const frame=CINEMATICS[key].frames[0];
  if(frame.sound)playSfx(frame.sound);
  ensureLoop();
  document.querySelector("#cinematicNextButton").focus?.();
  return true;
}
function refreshCinematicText(){
  if(!cinematic.active)return;
  const scene=CINEMATICS[cinematic.key];
  const frame=scene.frames[cinematic.frameIndex];
  document.querySelector("#cinematicChapter").textContent=scene.chapter;
  document.querySelector("#cinematicSpeaker").textContent=frame.speaker;
  document.querySelector("#cinematicTitle").textContent=frame.title;
  document.querySelector("#cinematicText").textContent=frame.text;
  const next=document.querySelector("#cinematicNextButton");
  next.textContent=cinematic.frameIndex===scene.frames.length-1?
    (cinematic.replay?"Voltar à galeria ➜":
      cinematic.key==="opening"?"Continuar história ➜":"Começar fase ➜")
    :"Avançar ➜";
}
function updateCinematic(dt){
  if(!cinematic.active)return;
  cinematic.elapsed+=dt;
  cinematic.clock+=dt;
  const frame=CINEMATICS[cinematic.key].frames[cinematic.frameIndex];
  const progress=(cinematic.frameIndex+
    Math.min(1,cinematic.elapsed/frame.duration))/
    CINEMATICS[cinematic.key].frames.length;
  document.querySelector("#cinematicProgressFill").style.width=(progress*100).toFixed(2)+"%";
  if(cinematic.elapsed>=frame.duration)nextCinematicFrame();
}
function nextCinematicFrame(){
  if(!cinematic.active)return;
  const scene=CINEMATICS[cinematic.key];
  if(cinematic.frameIndex===scene.frames.length-1){
    finishCinematic();return;
  }
  cinematic.frameIndex++;cinematic.elapsed=0;
  refreshCinematicText();
  const frame=scene.frames[cinematic.frameIndex];
  if(frame.sound)playSfx(frame.sound);
}
function finishCinematic(){
  if(!cinematic.active)return;
  const key=cinematic.key,cb=cinematic.onEnd,replay=cinematic.replay;
  cinematic.active=false;cinematic.key=null;cinematic.onEnd=null;
  document.querySelector(".game-panel").classList.remove("cinematic-active");
  cinematicMenu.hidden=true;
  if(!replay&&!debugMode&&!campaign.scenesSeen.includes(key)){
    campaign.scenesSeen.push(key);saveCampaign();
  }
  if(cb)cb();else showMainMenu();
}
function cancelCinematic(returnToMenu=true){
  if(!cinematic.active)return;
  cinematic.active=false;cinematic.key=null;cinematic.onEnd=null;
  cinematicMenu.hidden=true;
  document.querySelector(".game-panel").classList.remove("cinematic-active");
  if(returnToMenu)showMainMenu();
}
function replayCinematic(key){
  if(!campaign.scenesSeen.includes(key))return;
  launchCinematic(key,showGalleryMenu,true);
}

// 3.0 campaign pointer: legacy progress/achievements remain a separate archive.
// This creates a safe migration from v2 on first use without modifying its key.
// The final fourth chapter remains planned. Reserve its share of the
// campaign completion so defeating the city's boss never shows 100%.
const GAME_COMPLETION_STAGES=4;
const GAME_COMPLETION_CORES_PER_STAGE=3;
const GAME_COMPLETION_ROUTES_PER_STAGE=3;
function emptyCampaignExtras(){
  return {cores:{stage1:[],stage2:[],stage3:[]},secrets:{stage1:[],stage2:[],stage3:[]}};
}
function sanitizedCampaignExtras(saved,stage1Done,stage2Done,stage3Done=false){
  const extras=emptyCampaignExtras();
  const hasExtras=saved?.extras&&typeof saved.extras==="object";
  for(const stage of [1,2,3]){
    const key="stage"+stage;
    const stageDone=stage===1?stage1Done:stage===2?stage2Done:stage3Done;
    // Pre-3.4 saves contain no collection identifiers. Preserve the
    // historically recorded count on completed stages as a best-effort
    // migration; never import archival extras into a freshly reset campaign.
    const legacyCores=stageDone?
      Math.floor(clamp(progress[key].bestCores||0,0,3)):0;
    const oldCores=Array.from({length:legacyCores},(_,i)=>i);
    const oldRoutes=stageDone?progress.secrets[key].slice():[];
    const rawCores=hasExtras? saved.extras.cores?.[key] : oldCores;
    const rawRoutes=hasExtras? saved.extras.secrets?.[key] : oldRoutes;
    extras.cores[key]=Array.isArray(rawCores)?
      [...new Set(rawCores.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]:[];
    const validIds=SECRET_DEFS[stage].map(route=>route.id);
    extras.secrets[key]=Array.isArray(rawRoutes)?
      [...new Set(rawRoutes.filter(id=>validIds.includes(id)))]:[];
  }
  return extras;
}
function loadCampaign(){
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(CAMPAIGN_KEY)||"null");}catch(_){}
  if(saved&&typeof saved==="object"){
    const d1=saved.stage1Completed===true,d2=d1&&saved.stage2Completed===true;
    const d3=d2&&saved.stage3Completed===true;
    const started=saved.started===true||d1||d2||d3;
    // A completed 3.5.x campaign had no stage-3 field; Continue should
    // open the newly unlocked city, not replay the cleared canyon.
    const legacyBeforeCity=!Object.prototype.hasOwnProperty.call(saved,"stage3Completed");
    const last=d2&&(saved.lastStage===3||legacyBeforeCity)?3:
      d1&&saved.lastStage===2?2:1;
    return {started,stage1Completed:d1,stage2Completed:d2,stage3Completed:d3,
      lastStage:last,aerialDash:saved.aerialDash===true&&d2,
      extras:sanitizedCampaignExtras(saved,d1,d2,d3),
      scenesSeen:Array.isArray(saved.scenesSeen)?
        [...new Set(saved.scenesSeen.filter(k=>["opening","intro1","intro2","intro3"].includes(k)))]:[]};
  }
  const d1=progress.stage1.completed||progress.stage2.completed||progress.stage3.completed;
  const d2=progress.stage2.completed||progress.stage3.completed;
  const d3=progress.stage3.completed;
  return {started:d1,stage1Completed:d1,stage2Completed:d2,stage3Completed:d3,
    lastStage:d2?3:d1?2:1,aerialDash:false,
    extras:sanitizedCampaignExtras(null,d1,d2,d3),scenesSeen:[]};
}
function saveCampaign(){
  try{localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(campaign));}catch(_){}
}
function resetCampaign(){
  Object.assign(campaign,{started:false,stage1Completed:false,
    stage2Completed:false,stage3Completed:false,lastStage:1,aerialDash:false,extras:emptyCampaignExtras(),scenesSeen:[]});
  saveCampaign();
}
function recordCampaignCore(stage,index){
  if(debugUsedThisRun||![1,2,3].includes(stage))return false;
  if(!Number.isInteger(index)||index<0||index>=GAME_COMPLETION_CORES_PER_STAGE)return false;
  const found=campaign.extras.cores["stage"+stage];
  if(found.includes(index))return false;
  found.push(index);
  saveCampaign();
  return true;
}
function recordCampaignSecret(stage,id){
  if(debugUsedThisRun||![1,2,3].includes(stage)||
    !SECRET_DEFS[stage].some(route=>route.id===id))return false;
  const found=campaign.extras.secrets["stage"+stage];
  if(found.includes(id))return false;
  found.push(id);
  saveCampaign();
  return true;
}
function campaignCompletion(){return computeCampaignCompletion(campaign);}
function nextCampaignStage(){
  return campaign.stage2Completed&&campaign.lastStage===3?3:campaign.stage1Completed&&campaign.lastStage===2?2:1;
}
function continueCampaign(){
  if(!campaign.started)return;
  startGame(nextCampaignStage());
}
function askNewGame(){
  showScreen(newGameConfirm);
}
function confirmNewGame(){
  resetCampaign();
  // Archive stats are permanent, but the narrative resets with the journey.
  refreshProgressView();
  launchCinematic("opening",()=>startGame(1),false);
}
function loadAudioLevels(){
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY)||"null");}catch(_){}
  const fix=value=>{
    const number=Number(value);
    return Number.isFinite(number)?Math.round(clamp(number,0,100)):100;
  };
  return {master:fix(saved?.master),music:fix(saved?.music),effects:fix(saved?.effects)};
}
function saveAudioLevels(){
  try{localStorage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify(audioLevels));}catch(_){}
}
function effectiveAudioGain(kind){
  const master=soundEnabled?audioLevels.master/100:0;
  if(kind==="music")return master*(musicEnabled?audioLevels.music/100:0);
  return master*audioLevels.effects/100;
}
function refreshAudioSettings(){
  for(const kind of ["master","music","effects"]){
    for(const prefix of ["","pause-"]){
      const slider=document.querySelector("#"+prefix+"volume-"+kind);
      const label=document.querySelector("#"+prefix+"value-"+kind);
      if(slider)slider.value=String(audioLevels[kind]);
      if(label)label.textContent=audioLevels[kind]+"%";
    }
  }
  const label=document.querySelector("#settingsAudioStatus");
  if(label)label.textContent=!soundEnabled?"Áudio geral silenciado":
    !musicEnabled?"Música silenciada pelo atalho": "Volumes salvos automaticamente";
}
function changeAudioLevel(kind,value){
  if(!["master","music","effects"].includes(kind))return;
  const level=Number(value);
  if(!Number.isFinite(level))return;
  audioLevels[kind]=Math.round(clamp(level,0,100));
  saveAudioLevels();
  refreshAudioSettings();
  // Smooth gain adjustment avoids gaps and does not restart the music clock.
  syncMusic(false);
}

function storeProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    if (progress.stage1.bestTime > 0) localStorage.setItem("velocity-rift-best-time", String(progress.stage1.bestTime));
  } catch (_) { /* Progress remains available until refresh. */ }
}

function recordStageClear(time, crystals, cores = 0) {
  const stage = progress["stage"+activeStage];
  const grade = gradeForTime(time,activeStage);
  const improvedTime = !stage.bestTime || time < stage.bestTime;
  stage.completed = true;
  stage.clears += 1;
  campaign.started=true;
  if(activeStage===1){campaign.stage1Completed=true;campaign.lastStage=2;}
  else if(activeStage===2){
    campaign.stage1Completed=true;campaign.stage2Completed=true;campaign.lastStage=3;
  }else if(activeStage===3){
    campaign.stage1Completed=true;campaign.stage2Completed=true;
    campaign.stage3Completed=true;campaign.lastStage=3;
  }
  // Backstop for legacy clears and automated results; normal gameplay
  // already records exact core identities at pickup time.
  const collected=campaign.extras.cores["stage"+activeStage];
  for(let i=0;i<Math.min(3,Math.max(0,cores));i++){
    if(collected.length>=cores)break;
    if(!collected.includes(i))collected.push(i);
  }
  saveCampaign();
  if (improvedTime) stage.bestTime = time;
  if (!stage.bestGrade || GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(stage.bestGrade)) {
    stage.bestGrade = grade;
  }
  stage.bestCrystals = Math.max(stage.bestCrystals, crystals);
  stage.bestCores = Math.max(stage.bestCores || 0, cores);
  bestTime = stage.bestTime;
  storeProgress();
  return { grade, improvedTime };
}

function formatTime(seconds) {
  return seconds > 0 ? seconds.toFixed(2) + "s" : "--";
}

// Rift atlas stays UI-only: the campaign save controls access and the
// permanent 2.0 archive provides medals, cores, secrets and best times.
function selectMapStage(stage){
  if(![1,2,3,4].includes(stage))return;
  selectedMapStage=stage;
  for(const id of [1,2,3,4]){
    const names=["One","Two","Three","Four"];
    const suffix=names[id-1];
    const node=document.querySelector("#mapNodeStage"+suffix);
    const details=document.querySelector("#stage"+suffix+"Card");
    details.hidden=id!==stage;
    node.classList.toggle("is-selected",id===stage);
    node.setAttribute("aria-pressed",String(id===stage));
  }
}
function refreshMapView(){
  const unlocked=campaign.stage1Completed||debugMode;
  const completion=campaignCompletion();
  document.querySelector("#mapCampaignSummary").textContent=
    "Conclusão "+completion.percent+"%";
  document.querySelector("#mapCoresSummary").textContent=
    "Núcleos "+completion.cores+"/12";
  document.querySelector("#mapSecretsSummary").textContent=
    "Segredos "+completion.secrets+"/12";
  document.querySelector("#mapAchievementsSummary").textContent=
    "Conquistas "+Object.values(progress.achievements).filter(Boolean).length+
    "/"+ACHIEVEMENTS.length;
  const cityUnlocked=campaign.stage2Completed||debugMode;
  document.querySelector("#stageThreeButton").disabled=!cityUnlocked;
  document.querySelector("#mapPathToCity").classList.toggle("rift-map-path-open",cityUnlocked);
  document.querySelector("#mapPathToCity").classList.toggle("rift-map-path-locked",!cityUnlocked);
  document.querySelector("#mapNodeStageThree").classList.toggle("is-locked",!cityUnlocked);
  document.querySelector("#stageFourButton").disabled=true;
  for(const stage of [1,2,3]){
    const suffix=stage===1?"One":stage===2?"Two":"Three";
    const stageProgress=progress["stage"+stage];
    document.querySelector("#mapStage"+suffix+"Best").textContent=
      formatTime(stageProgress.bestTime);
    document.querySelector("#mapStage"+suffix+"Grade").textContent=
      stageProgress.bestGrade||"--";
    document.querySelector("#mapStage"+suffix+"Cores").textContent=
      stageProgress.bestCores+"/3";
    document.querySelector("#mapStage"+suffix+"Secrets").textContent=
      progress.secrets["stage"+stage].length+"/3";
  }
  const forestStatus=campaign.stage1Completed?"CONCLUÍDA":
    campaign.started&&campaign.lastStage===1?"EM ANDAMENTO":"DISPONÍVEL";
  const canyonStatus=campaign.stage2Completed?"CONCLUÍDA":
    campaign.stage1Completed?"LIBERADA":debugMode?"ACESSO DEBUG":"BLOQUEADA";
  document.querySelector("#mapNodeStageOneStatus").textContent=forestStatus;
  document.querySelector("#mapNodeStageTwoStatus").textContent=canyonStatus;
  const cityStatus=campaign.stage3Completed?"CONCLUÍDA":
    cityUnlocked?"LIBERADA":"BLOQUEADA";
  document.querySelector("#mapNodeStageThreeStatus").textContent=cityStatus;
  document.querySelector("#mapStageThreeBadge").textContent=cityStatus;
  document.querySelector("#stageThreeProgress").textContent=campaign.stage3Completed?
    "Campanha concluída · Núcleo de Ímpeto recuperado":
    cityUnlocked?"Nova habilidade e desafios aguardam":"Conclua o Cânion para desbloquear";
  document.querySelector("#mapStageOneBadge").textContent=forestStatus;
  document.querySelector("#mapStageTwoBadge").textContent=canyonStatus;
  document.querySelector("#mapNodeStageThree").classList.toggle("is-completed",campaign.stage3Completed);
  const firstNode=document.querySelector("#mapNodeStageOne");
  const secondNode=document.querySelector("#mapNodeStageTwo");
  firstNode.classList.toggle("is-completed",campaign.stage1Completed);
  secondNode.classList.toggle("is-completed",campaign.stage2Completed);
  secondNode.classList.toggle("is-locked",!unlocked);
  document.querySelector("#mapPathToCanyon").classList.toggle("rift-map-path-locked",!unlocked);
  document.querySelector("#mapPathToCanyon").classList.toggle("rift-map-path-open",unlocked);
  selectMapStage(selectedMapStage);
}

function refreshProgressView() {
  const stage = progress.stage1;
  const completion=campaignCompletion();
  document.querySelector("#menuProgress").textContent=completion.percent+"%";
  document.querySelector("#campaignProgressTrack").setAttribute(
    "aria-valuenow",String(completion.percent));
  document.querySelector("#campaignProgressFill").style.width=completion.percent+"%";
  document.querySelector("#campaignCompletionBreakdown").textContent=
    "Fases "+completion.stages+"/4  ·  Núcleos "+completion.cores+
    "/12  ·  Rotas secretas "+completion.secrets+"/12";
  const continueButton=document.querySelector("#startButton");
  const canContinue=campaign.started===true;
  continueButton.disabled=!canContinue;
  continueButton.setAttribute("aria-disabled",String(!canContinue));
  const description=canContinue
    ? "Retomar em "+(["","Primeiro Impulso","Cânion Prisma","Cidade das Fendas"][nextCampaignStage()])
    : "Disponível depois de iniciar sua primeira campanha.";
  continueButton.title=description;
  document.querySelector("#continueDescription").textContent=description;
  document.querySelector("#stageOneProgress").textContent = campaign.stage1Completed
    ? "Campanha concluída · Melhor " + (stage.bestGrade || "--") + " · " + formatTime(stage.bestTime)
    : "Campanha disponível" + (stage.bestTime?" · Recorde "+formatTime(stage.bestTime):"");
  document.querySelector("#stageOneProgress").textContent+=
    " · Rotas "+progress.secrets.stage1.length+"/3";
  const second=progress.stage2;
  const unlocked=campaign.stage1Completed || debugMode;
  document.querySelector("#stageTwoProgress").textContent = !unlocked
    ? "Conclua a fase 1 para desbloquear"
    : campaign.stage2Completed ? "Campanha concluída · Melhor "+(second.bestGrade||"--")+" · "+formatTime(second.bestTime)
    : "Novo desafio disponível";
  if(unlocked)document.querySelector("#stageTwoProgress").textContent+=
    " · Rotas "+progress.secrets.stage2.length+"/3";
  document.querySelector("#stageTwoButton").disabled=!unlocked;
  document.querySelector("#stageTwoCard").classList.toggle("stage-card-locked",!unlocked);
  document.querySelector("#stageTwoCard").classList.toggle("stage-card-active",unlocked);
  document.querySelector("#stageTwoLock").hidden=unlocked;
  refreshMapView();
  refreshCinematicGallery();
  refreshAchievementsView();
  refreshAudioSettings();
}

function showScreen(target) {
  if(cinematic.active)cancelCinematic(false);
  stageArrival.active=false;
  gameStarted = false;
  paused = false;
  if(debugToggle)debugToggle.hidden=true;
  syncMusic();
  keys.clear();
  jumpHeld = false;
  screens.forEach(screen => { screen.hidden = screen !== target; });
  overlay.classList.remove("is-hidden");
  document.querySelector(".game-panel").classList.remove("pause-active");
  document.querySelector(".game-panel").classList.add("menu-active");
  pauseButton.hidden = true;
  refreshProgressView();
  // Focus an action belonging to the visible screen, including dialogs
  // and sliders. Never send keyboard focus into an unrelated hidden menu.
  target.querySelector?.('button:not([disabled]),input')?.focus?.();
}

function showDeathScreen(fell, lost){
  // End the current run; permanent campaign progress is not reset.
  gameStarted=false;gameCleared=false;paused=false;accumulator=0;
  airDash.active=false;airDash.time=0;
  document.querySelector("#deathStageLabel").textContent=
    ["","Floresta Neon","Cânion Prisma","Cidade das Fendas"][activeStage];
  document.querySelector("#deathReason").textContent=fell
    ?"Flux caiu na fenda. Todos os cristais foram perdidos."
    :"Flux ficou sem cristais para resistir ao impacto.";
  document.querySelector("#deathCrystalLoss").textContent=
    lost+" cristal"+(lost===1?" perdido":"is perdidos");
  const checkpoint=checkpointRespawnTarget(checkpoints,checkpointIndex,spawn);
  document.querySelector("#deathRestartButton").textContent=
    checkpoint.fromCheckpoint?"↺ VOLTAR AO CHECKPOINT":"↺ REINICIAR FASE";
  showScreen(deathMenu);
}
function restartAfterDeath(){
  const target=checkpointRespawnTarget(checkpoints,checkpointIndex,spawn);
  if(!target.fromCheckpoint){
    // No checkpoint: restart the full stage as before.
    startGame(activeStage,true,false);
    return;
  }
  // Keep the current attempt, timer, cores, secrets and permanent progress.
  // Do NOT call resetGame(): it clears the activated checkpoint.
  stageArrival.active=false;
  gameCleared=false;
  paused=false;
  gameStarted=true;
  accumulator=0;
  keys.clear();jumpHeld=false;jumpBuffer=0;coyoteTimer=0;
  resetAirDash();
  resetFluxFx();
  sentryShots=[];
  particles=[];
  player.x=target.x;player.y=target.y;
  player.prevX=target.x;player.prevY=target.y;
  player.vx=0;player.vy=0;
  player.facing=1;
  player.onGround=false;player.ground=null;
  player.boost=0;
  player.invulnerable=1.8;
  player.sliding=false;player.downhillSliding=false;player.boosting=false;
  player.trail=[];
  player.animationPhase=0;
  // All crystals lost in a pit stay lost, but collectible objects in the
  // next section can be collected again after respawn.
  rings.forEach(item=>{if(item.x>=target.x)item.active=true;});
  boostOrbs.forEach(item=>{if(item.x>=target.x)item.active=true;});
  if(activeStage===3&&cityBoss.active&&!cityBoss.defeated)resetCityBoss();
  if(activeStage===2&&guardian.active&&!guardian.defeated)resetGuardian();
  cameraAnchorX=VIEW_W*CAMERA_IDLE_ANCHOR;
  cameraX=clamp(target.x-cameraAnchorX,0,Math.max(0,WORLD_W-VIEW_W));
  cameraY=clamp(target.y-VIEW_H*.56,0,WORLD_H-VIEW_H);
  screens.forEach(screen=>{screen.hidden=true;});
  overlay.classList.add("is-hidden");
  const panel=document.querySelector(".game-panel");
  panel.classList.remove("menu-active","pause-active");
  if(debugToggle)debugToggle.hidden=false;
  syncPauseButton();
  syncMusic();
  ensureLoop();
}
function showMainMenu() {showScreen(mainMenu);}
function showSettingsMenu(){showScreen(settingsMenu);refreshAudioSettings();}
function showStageMenu(){
  selectedMapStage=campaign.stage2Completed?3:campaign.stage1Completed?2:1;
  showScreen(stageMenu);
  selectMapStage(selectedMapStage);
}
function showAchievementsMenu(){showScreen(achievementsMenu);}

function showResults(time, crystals, cores = 0) {
  const result = debugUsedThisRun
    ? {grade:gradeForTime(time,activeStage),improvedTime:false}
    : recordStageClear(time,crystals,cores);
  document.querySelector("#resultGrade").textContent = result.grade;
  document.querySelector("#resultHeading").textContent = ["","Primeiro Impulso","Cânion Prisma","Cidade das Fendas"][activeStage];
  document.querySelector("#resultTime").textContent = formatTime(time);
  document.querySelector("#resultBest").textContent = formatTime(progress["stage"+activeStage].bestTime);
  document.querySelector("#resultCrystals").textContent = String(crystals);
  document.querySelector("#resultClears").textContent = String(progress["stage"+activeStage].clears);
  document.querySelector("#resultMessage").textContent = debugUsedThisRun
    ? "TESTE DEBUG: conclusão sem salvar recordes ou desbloqueios."
    : (result.improvedTime ? "Novo recorde!" : "Missão concluída!") +
      " Núcleos " + cores + "/3 · Melhor " + progress["stage"+activeStage].bestCores + "/3.";
  if(!debugUsedThisRun)grantClearAchievements(result.grade,cores);
  document.querySelector("#resultSecrets").textContent=secretTrials.filter(t=>t.completed).length+"/3";
  const nextStageButton=document.querySelector("#nextStageButton");
  // Stages 2/3 unlock in order. Debug-only clears never grant permanent access.
  const nextPlayable=(activeStage===1&&(campaign.stage1Completed||debugMode))||
    (activeStage===2&&(campaign.stage2Completed||debugMode));
  nextStageButton.disabled=!nextPlayable;
  nextStageButton.textContent=nextPlayable
    ?("Próxima fase: "+(activeStage===1?"Cânion Prisma":"Cidade das Fendas")+" ➜")
    :activeStage===3?"Fase final — em desenvolvimento"
    :"Próxima fase bloqueada";
  nextStageButton.title=nextPlayable
    ?("Começar "+(activeStage===1?"Cânion Prisma":"Cidade das Fendas"))
    :activeStage===3?"A quarta fase ainda está em desenvolvimento"
    :"Conclua a primeira fase sem DEBUG para desbloquear a próxima";
  nextStageButton.classList.toggle("primary-action",nextPlayable);
  nextStageButton.classList.toggle("secondary-action",!nextPlayable);
  const retryButton=document.querySelector("#retryButton");
  retryButton.classList.toggle("primary-action",!nextPlayable);
  retryButton.classList.toggle("secondary-action",nextPlayable);
  playSfx("finish");
  showScreen(resultMenu);
}

function syncPauseButton(){
  pauseButton.hidden=!gameStarted||paused||gameCleared;
  pauseButton.textContent="Ⅱ PAUSA";
  pauseButton.setAttribute("aria-label","Pausar o jogo");
  pauseButton.setAttribute("aria-pressed",String(paused));
}
function showPauseMenu(){
  if(!gameStarted||gameCleared||paused)return;
  paused=true;accumulator=0;keys.clear();jumpHeld=false;
  syncMusic();
  document.querySelector("#pauseStageLabel").textContent=
    (["","Primeiro Impulso","Cânion Prisma","Cidade das Fendas"][activeStage])+
    " · "+formatTime(gameTime)+" de jornada";
  screens.forEach(screen=>{screen.hidden=screen!==pauseMenu;});
  overlay.classList.remove("is-hidden");
  const panel=document.querySelector(".game-panel");
  panel.classList.remove("menu-active");panel.classList.add("pause-active");
  refreshAudioSettings();
  syncPauseButton();
  document.querySelector("#resumeButton").focus?.();
}
function resumeGame(){
  if(!gameStarted||!paused||gameCleared)return;
  paused=false;accumulator=0;keys.clear();jumpHeld=false;
  pauseMenu.hidden=true;
  overlay.classList.add("is-hidden");
  document.querySelector(".game-panel").classList.remove("pause-active");
  syncPauseButton();syncMusic();
  pauseButton.focus?.();
}
function togglePause(){
  if(!gameStarted||gameCleared)return;
  if(paused)resumeGame();else showPauseMenu();
}

function beginStageArrival(){
  stageArrival.active=true;
  stageArrival.elapsed=0;
  stageArrival.finishX=spawn.x;
  // Both maps begin on safe, flat ground, well before the first hazards.
  stageArrival.startX=spawn.x-360;
  stageArrival.startingCameraX=stageArrival.startX-165;
  player.x=stageArrival.startX;
  player.prevX=player.x;
  player.y=spawn.y;
  player.prevY=player.y;
  player.facing=1;
  player.onGround=true;
  player.ground=tracks[0]||null;
  player.vx=220;
  player.vy=0;
  player.sliding=false;
  player.boosting=false;
  cameraX=stageArrival.startingCameraX;
  cameraY=0;
  gameTime=0;
  keys.clear();jumpHeld=false;jumpBuffer=0;coyoteTimer=0;
}
function finishStageArrival(){
  if(!stageArrival.active)return;
  stageArrival.active=false;
  stageArrival.elapsed=stageArrival.duration;
  // The genuine level begins exactly at its original spawn, at rest:
  // no free distance, crystals, health, or record advantage.
  player.x=spawn.x;
  player.prevX=spawn.x;
  player.y=spawn.y;
  player.prevY=spawn.y;
  player.vx=0;player.vy=0;
  player.facing=1;
  // Match resetGame() exactly: the first playable physics frame will
  // resolve floor contact and acceleration, just as in version 3.5.1.
  player.onGround=false;
  player.ground=null;
  player.boosting=false;player.sliding=false;player.downhillSliding=false;
  cameraX=0;cameraY=0;
  cameraAnchorX=VIEW_W*CAMERA_IDLE_ANCHOR;
  gameTime=0;
  keys.clear();jumpHeld=false;jumpBuffer=0;coyoteTimer=0;
  resetFluxFx();
}
function updateStageArrival(dt){
  if(!stageArrival.active)return;
  const before=player.x;
  stageArrival.elapsed=Math.min(stageArrival.duration,stageArrival.elapsed+dt);
  const ratio=stageArrival.elapsed/stageArrival.duration;
  // Smooth acceleration and deceleration; same body animation and
  // camera as the playable game, only an isolated run-in animation.
  const eased=ratio*ratio*(3-2*ratio);
  player.prevX=player.x;player.prevY=player.y;
  player.x=stageArrival.startX+(stageArrival.finishX-stageArrival.startX)*eased;
  // City arrival incorporates two harmless hops over rooftop obstacles
  // before the camera hands control back on the original road.
  const hop=activeStage===3?
    Math.max(0,Math.sin(Math.PI*2*ratio*2.25))*49:0;
  player.y=spawn.y-hop;player.vy=0;
  player.vx=Math.max(55,(player.x-before)/Math.max(dt,.001));
  player.animationPhase+=Math.max(170,player.vx)*dt*.052;
  player.onGround=true;
  visualTime+=dt;
  cameraX=stageArrival.startingCameraX*(1-eased);
  cameraY=0;
  updateFluxFx(dt);
  updateTrail(dt);
  updateParticles(dt);
  if(stageArrival.elapsed>=stageArrival.duration)finishStageArrival();
}
function drawStageArrivalRunway(){
  if(!stageArrival.active)return;
  const y=tracks[0]?.y1??420;
  const start=stageArrival.startX-280;
  // A temporary continuation of the real road from the portal; removed
  // before the player can interact with any level objects.
  ctx.fillStyle=activeStage===2?"#261e4d":"#102f38";
  ctx.fillRect(start,y, -start,VIEW_H-y+50);
  ctx.strokeStyle=activeStage===2?"#b999f6":"#64eed7";
  ctx.lineWidth=11;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(start,y);ctx.lineTo(0,y);ctx.stroke();
  ctx.strokeStyle="#132e47";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(start,y+8);ctx.lineTo(0,y+8);ctx.stroke();
  // Dimensional glow in the distance, right where Flux emerged.
  const fading=1-stageArrival.elapsed/stageArrival.duration;
  if(fading>.07){
    ctx.save();ctx.globalAlpha=.55*fading;
    cinemaPortal(stageArrival.startX-16,y-145,visualTime,.36);
    ctx.restore();
  }
}
function drawStageArrivalOverlay(){
  if(!stageArrival.active)return;
  const p=stageArrival.elapsed/stageArrival.duration;
  const opacity=Math.min(1,p*4,(1-p)*6);
  ctx.save();
  ctx.globalAlpha=Math.max(0,opacity);
  ctx.fillStyle="rgba(8,18,35,.65)";
  roundRect(277,48,406,75,13);ctx.fill();
  ctx.textAlign="center";
  ctx.fillStyle="#abfff0";ctx.font="bold 13px system-ui";
  ctx.fillText("UMA NOVA ETAPA DA JORNADA",VIEW_W/2,75);
  ctx.fillStyle="#fff5ee";ctx.font="bold 24px system-ui";
  ctx.fillText(activeStage===3?"CIDADE DAS FENDAS":activeStage===2?"CÂNION PRISMA":"FLORESTA NEON",VIEW_W/2,105);
  ctx.restore();
}

function resetGame() {
  stageArrival.active=false;stageArrival.elapsed=0;
  resetAirDash();
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
  resetFluxFx();
  player.animationPhase = 0;
  player.cores = 0;
  player.falls = 0;
  musicStep = 0;
  resetGuardian();
  resetCityBoss();
  particles = [];
  visualTime = 0;
  sparkleCooldown = 0;
  pickupSoundCooldown = 0;
  sentryShots = [];
  player.sliding = false;
  player.downhillSliding = false;
  player.boosting = false;
  checkpointIndex = -1;
  jumpBuffer = 0;
  coyoteTimer = 0;
  jumpHeld = false;
  paused = false;
  accumulator = 0;
  cameraX = 0;
  cameraY = 0;
  cameraAnchorX = VIEW_W * CAMERA_IDLE_ANCHOR;
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
    bad.phase=0;
    bad.shotTimer=.55 + (bad.baseX%7)*.12;
  });
  rings.forEach((ring) => {
    ring.active = true;
  });
  boostOrbs.forEach((boostOrb) => {
    boostOrb.active = true;
  });
  memoryCores.forEach(core=>{core.active=true});
  secretTrials.forEach(t=>{
    Object.assign(t,{active:false,completed:false,
      elapsed:0,armed:true,failed:false,shotTimer:1.5,shots:[]});
    t.sentinels.forEach(e=>{e.x=e.baseX;e.y=e.baseY;});
  });
  tracks.forEach(t=>{
    if(t.kind==="rift-elevator"){t.y1=t.initialY;t.y2=t.initialY;}
    if(!t.secretId)return;
    t.broken=false;t.crumbleTime=0;
    if(t.originX!==undefined){
      t.x1=t.originX;t.x2=t.originX2;
    }
  });
  runDamageCount=0;
  bossDamagedThisRun=false;
  notification.timer=0;
}

function startGame(stage=activeStage,skipCinematic=false,withArrival=false) {
  if(![1,2,3].includes(stage))return;
  if(stage===2&&!campaign.stage1Completed&&!debugMode)return;
  if(stage===3&&!campaign.stage2Completed&&!debugMode)return;
  const chapter="intro"+stage;
  if(!skipCinematic&&!debugMode&&!campaign.scenesSeen.includes(chapter)){
    launchCinematic(chapter,()=>startGame(stage,true,true),false);
    return;
  }
  unlockAudio();
  if(!debugMode){
    campaign.started=true;
    campaign.lastStage=stage;
    saveCampaign();
  }
  debugUsedThisRun = debugMode;
  if(debugToggle)debugToggle.hidden=false;
  activateStage(stage);
  resetGame();
  if(withArrival&&!debugMode)beginStageArrival();
  gameStarted = true;
  screens.forEach(screen => { screen.hidden = true; });
  document.querySelector(".game-panel").classList.remove("menu-active");
  document.querySelector(".game-panel").classList.remove("pause-active");
  overlay.classList.add("is-hidden");
  syncPauseButton();
  syncMusic();
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
  if(cinematic.active)updateCinematic(dt);

  if (gameStarted && !gameCleared && !paused) {
    accumulator += dt;
    while (accumulator >= FIXED_DT && gameStarted && !paused && !gameCleared) {
      update(FIXED_DT);
      accumulator -= FIXED_DT;
    }
  } else {
    accumulator = 0;
  }

  // A Web Audio error must never halt the physics and animation loop.
  try {
    scheduleMusic();
  } catch (error) {
    musicEnabled = false;
    try { syncMusic(); } catch (_) { /* Unsupported or failing audio backend. */ }
    syncMusicButton();
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn("Velocity Rift: música desativada após erro de áudio.", error);
    }
  }
  if(cinematic.active)drawCinematic();else draw();
  requestAnimationFrame(loop);
}

// The arena is at the end of level 2. Three hits and alternated telegraphed
// beams reward jumping, sliding, and timed attacks on the exposed energy core.
// ----------------- Guardian of the Prism: arena fight -----------------
// The Void Architect: four weak-point hits with the *aerial* dash,
// a twin-shot telegraph, guarded and exposed windows, cinematic collapse.
const cityBoss={x:RIFT_BOSS_ARENA_LEFT+750,y:324,
 arenaLeft:RIFT_BOSS_ARENA_LEFT,arenaRight:RIFT_WORLD_WIDTH,
 active:false,defeated:false,state:"intro",timer:0,hp:4,maxHp:4,shot:0,fx:0,
 rifts:[]};
const cityShards=[];
function resetCityBoss(){
 Object.assign(cityBoss,{active:false,defeated:false,state:"intro",
   timer:0,hp:4,shot:0,fx:0,rifts:[]});
 cityShards.length=0;
}
function beginCityBoss(){
 Object.assign(cityBoss,{active:true,state:"intro",timer:0,shot:0,rifts:[]});
 musicStep=0;
 if(audioContext&&audioContext.state==="running")
   nextMusicNote=audioContext.currentTime+.07;
 syncTrackLabel();playSfx("boss-enter");
}
function beginCityBossTelegraph(){
 cityBoss.timer=0;cityBoss.shot=0;cityBoss.state="telegraph";
 cityBoss.rifts=spawnArchitectRifts({
   phase:architectPhase(cityBoss.hp),playerX:player.x,facing:player.facing,
   arenaLeft:cityBoss.arenaLeft,arenaRight:cityBoss.arenaRight
 });
}
function cityBossFire(){
 const config=architectPhase(cityBoss.hp);
 const x=cityBoss.x-65,y=cityBoss.y-19;
 const a=Math.atan2(player.y-y,player.x-x);
 for(let i=0;i<config.projectiles;i++){
   if(sentryShots.length>=42)break;
   const offset=(i-(config.projectiles-1)/2)*.105;
   sentryShots.push({x,y,vx:Math.cos(a+offset)*config.speed,
     vy:Math.sin(a+offset)*config.speed,life:3,r:9,
     unblockable:true,cityShot:true});
 }
 playSfx("boss-alert");
}
function updateArchitectGroundRifts(dt){
 if(!cityBoss.active||cityBoss.defeated)return;
 for(const rift of cityBoss.rifts){
   rift.age+=dt;
   if(architectRiftState(rift.age)!=="active")continue;
   if(circleRect(player.x,player.y,PLAYER_RADIUS,
     {x:rift.x-rift.width/2,y:317,w:rift.width,h:96})){
     damagePlayer(false);
     if(!gameStarted)return;
   }
 }
 cityBoss.rifts=cityBoss.rifts.filter(rift=>architectRiftState(rift.age)!=="expired");
}
function drawArchitectGroundRifts(){
 if(activeStage!==3||!cityBoss.active||cityBoss.defeated)return;
 for(const rift of cityBoss.rifts){
   const state=architectRiftState(rift.age);
   if(state==="expired")continue;
   ctx.save();
   ctx.strokeStyle=state==="warning"?"#ffd08b":"#ff5bba";
   ctx.lineWidth=state==="warning"?4:8;
   ctx.shadowColor=state==="warning"?"#ffe498":"#ff51a8";
   ctx.shadowBlur=state==="warning"?10:25;
   const left=rift.x-rift.width/2,right=rift.x+rift.width/2;
   ctx.beginPath();
   ctx.moveTo(left,410);ctx.lineTo(rift.x-23,397);
   ctx.lineTo(rift.x,408);ctx.lineTo(rift.x+21,396);
   ctx.lineTo(right,410);ctx.stroke();
   if(state==="active"){
     ctx.fillStyle="rgba(240,64,178,.27)";
     ctx.beginPath();ctx.moveTo(left,410);
     ctx.lineTo(rift.x-17,326);ctx.lineTo(rift.x+14,335);
     ctx.lineTo(right,410);ctx.closePath();ctx.fill();
     ctx.strokeStyle="#ffc4ef";ctx.lineWidth=2;
     ctx.beginPath();ctx.moveTo(rift.x-17,326);
     ctx.lineTo(rift.x,350);ctx.lineTo(rift.x+14,335);ctx.stroke();
   }
   ctx.restore();
 }
}
function hurtCityBoss(){
 if(cityBoss.state!=="exposed"||!airDash.active)return;
 cityBoss.hp--;cityBoss.fx=1;shakeTime=Math.max(shakeTime,.22);
 emitParticles(cityBoss.x,cityBoss.y,"#ffc3ef",24,175);
 for(let i=0;i<23;i++){
   const angle=i*2.399,v=80+i%5*45;
   cityShards.push({x:cityBoss.x,y:cityBoss.y,
     vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,life:1.5});
 }
 if(cityShards.length>66)cityShards.splice(0,cityShards.length-66);
 if(cityBoss.hp===0){
   sentryShots=sentryShots.filter(p=>!p.cityShot);
   cityBoss.rifts=[];
 }
 airDash.active=false;airDash.time=0;
 player.vy=-230;player.vx=-420;
 playSfx(cityBoss.hp===0?"boss-collapse":"boss-crack");
 cityBoss.timer=0;
 cityBoss.state=cityBoss.hp===0?"collapse":"recovery";
}
function updateCityBoss(dt){
 if(activeStage!==3||cityBoss.defeated||!gameStarted)return;
 if(!cityBoss.active){
   if(player.x<cityBoss.arenaLeft)return;
   beginCityBoss();
 }
 if(player.x<cityBoss.arenaLeft+PLAYER_RADIUS){
   player.x=cityBoss.arenaLeft+PLAYER_RADIUS;player.vx=Math.max(0,player.vx);
 }
 if(player.x>cityBoss.arenaRight-PLAYER_RADIUS){
   player.x=cityBoss.arenaRight-PLAYER_RADIUS;player.vx=Math.min(0,player.vx);
 }
 cityBoss.timer+=dt;
 updateArchitectGroundRifts(dt);
 if(!gameStarted)return;
 const phase=architectPhase(cityBoss.hp);
 if(cityBoss.state==="intro"&&cityBoss.timer>=2.55){
   beginCityBossTelegraph();
 }else if(cityBoss.state==="telegraph"&&cityBoss.timer>=phase.telegraph){
   cityBoss.timer=0;cityBoss.shot=0;cityBoss.state="barrage";
 }else if(cityBoss.state==="barrage"){
   if(cityBoss.shot<phase.volleys&&cityBoss.timer>=.06+cityBoss.shot*phase.gap){
     cityBossFire();cityBoss.shot++;
   }
   if(cityBoss.timer>architectBarrageDuration(phase)){
     cityBoss.timer=0;cityBoss.state="exposed";
   }
 }else if(cityBoss.state==="exposed"){
   if(distance(player.x,player.y,cityBoss.x,cityBoss.y)<PLAYER_RADIUS+52&&airDash.active)
     hurtCityBoss();
   else if(cityBoss.timer>phase.exposed)beginCityBossTelegraph();
 }else if(cityBoss.state==="recovery"&&cityBoss.timer>phase.recovery){
   beginCityBossTelegraph();
 }else if(cityBoss.state==="collapse"&&cityBoss.timer>2.65){
   cityBoss.defeated=true;cityBoss.state="defeated";cityBoss.timer=0;
   cityBoss.rifts=[];
   playSfx("portal-open");musicStep=0;syncTrackLabel();
 }
 if(["telegraph","barrage"].includes(cityBoss.state)&&circleRect(
   player.x,player.y,PLAYER_RADIUS,
   {x:cityBoss.x-49,y:cityBoss.y-70,w:98,h:132}))damagePlayer(false);
}

function updateCityBossFX(dt){
 cityBoss.fx=Math.max(0,cityBoss.fx-dt*1.6);
 for(const p of cityShards){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
 for(let i=cityShards.length-1;i>=0;i--)
   if(cityShards[i].life<=0)cityShards.splice(i,1);
}
function drawCityBoss(){
 if(activeStage!==3||(!cityBoss.active&&player.x<cityBoss.arenaLeft-560))return;
 ctx.save();
 ctx.fillStyle="rgba(7,12,40,.86)";
 ctx.fillRect(cityBoss.arenaLeft,100,cityBoss.arenaRight-cityBoss.arenaLeft,310);
 ctx.strokeStyle="rgba(233,142,220,.27)";ctx.lineWidth=2;
 for(let x=cityBoss.arenaLeft;x<cityBoss.arenaRight;x+=115){
   ctx.beginPath();ctx.moveTo(x,102);ctx.lineTo(x+45,410);ctx.stroke();
 }
 if(cityBoss.defeated){ctx.restore();return;}
 ctx.translate(cityBoss.x,cityBoss.y+Math.sin(visualTime*3)*4);
 if(cityBoss.state==="intro"){
   const v=clamp(cityBoss.timer/2.55,0,1);
   ctx.translate(0,-(1-v)*250);
 }
 if(cityBoss.state==="collapse"){
   ctx.globalAlpha=Math.max(0,1-cityBoss.timer/2.65);
   ctx.rotate(cityBoss.timer*.3);
 }
 ctx.fillStyle="#1e1537";ctx.strokeStyle="#c676f0";ctx.lineWidth=5;
 ctx.beginPath();ctx.moveTo(0,-110);ctx.lineTo(92,-52);
 ctx.lineTo(77,72);ctx.lineTo(0,104);ctx.lineTo(-77,72);
 ctx.lineTo(-92,-52);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle="#443060";
 for(const side of [-1,1]){
   ctx.beginPath();ctx.moveTo(side*61,-78);ctx.lineTo(side*113,-142);
   ctx.lineTo(side*101,-12);ctx.lineTo(side*82,52);
   ctx.lineTo(side*54,14);ctx.closePath();ctx.fill();
 }
 const shield=cityBoss.state!=="exposed";
 ctx.shadowBlur=16;ctx.shadowColor=shield?"#ae80ff":"#fff3b0";
 ctx.fillStyle=shield?"#8960c3":"#fff1a4";
 ctx.beginPath();ctx.arc(0,0,35,0,Math.PI*2);ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle="#190c38";
 ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=shield?"#eebeff":"#e1fff1";
 ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();
 for(let i=0;i<4;i++){
   const angle=visualTime*(shield?1.3:3)+i*Math.PI/2;
   ctx.fillStyle="#bd86f9";ctx.beginPath();
   ctx.arc(Math.cos(angle)*58,Math.sin(angle)*58,9,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
 for(const p of cityShards){
   ctx.save();ctx.globalAlpha=Math.max(0,p.life/1.5);
   ctx.fillStyle="#e9b1ff";ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);
   ctx.fill();ctx.restore();
 }
}
function drawCityExit(){
 if(activeStage!==3||!cityBoss.defeated)return;
 const cx=goal.x+goal.w/2,cy=goal.y+goal.h*.45;
 ctx.save();ctx.translate(cx,cy);
 const breathe=1+Math.sin(visualTime*3.2)*.065;
 ctx.scale(breathe,breathe);
 const glow=ctx.createRadialGradient(0,0,10,0,0,140);
 glow.addColorStop(0,"rgba(141,255,234,.52)");
 glow.addColorStop(.65,"rgba(192,116,255,.22)");
 glow.addColorStop(1,"rgba(156,80,250,0)");
 ctx.fillStyle=glow;ctx.fillRect(-145,-145,290,290);
 ctx.shadowBlur=28;ctx.shadowColor="#9affed";
 for(let i=4;i>=0;i--){
   ctx.strokeStyle=i%2?"#bda7ff":"#70ffe8";
   ctx.globalAlpha=.42+(4-i)*.115;ctx.lineWidth=5;
   ctx.beginPath();ctx.ellipse(0,0,33+i*5,51+i*5,
     Math.sin(visualTime*.35+i)*.16,0,Math.PI*2);ctx.stroke();
 }
 ctx.globalAlpha=1;ctx.shadowBlur=14;
 ctx.fillStyle="rgba(147,108,235,.66)";
 ctx.beginPath();ctx.ellipse(0,0,36,57,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#b3fffa";
 ctx.beginPath();ctx.moveTo(0,-45);ctx.lineTo(28,0);
 ctx.lineTo(0,45);ctx.lineTo(-28,0);ctx.closePath();ctx.fill();
 ctx.fillStyle="#151247";
 ctx.beginPath();ctx.moveTo(0,-32);ctx.lineTo(19,0);
 ctx.lineTo(0,32);ctx.lineTo(-19,0);ctx.closePath();ctx.fill();
 ctx.shadowBlur=0;ctx.textAlign="center";
 ctx.font="bold 16px system-ui";ctx.fillStyle="#e1fff5";
 ctx.fillText("ENTRE NA FENDA",0,-98);
 ctx.restore();
}

function drawCityBossCinematic(){
 if(activeStage!==3||!cityBoss.active||cityBoss.defeated)return;
 if(!["intro","collapse"].includes(cityBoss.state))return;
 const progress=cityBoss.state==="intro"?cityBoss.timer/2.55:cityBoss.timer/2.65;
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,progress*4,(1-progress)*4));
 ctx.fillStyle="rgba(12,8,31,.92)";roundRect(160,173,640,135,14);ctx.fill();
 ctx.strokeStyle="#d5aaff";ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle="#faf0ff";ctx.textAlign="center";ctx.font="bold 29px system-ui";
 ctx.fillText(cityBoss.state==="intro"?"O ARQUITETO DO VAZIO":"NÚCLEO EM COLAPSO",480,224);
 ctx.fillStyle="#ffe2af";ctx.font="bold 14px system-ui";
 ctx.fillText(cityBoss.state==="intro"?
  "QUATRO DASHES · ESPERE A BLINDAGEM ABRIR":
  "A FENDA PARA O CAPÍTULO FINAL ESTÁ SURGINDO",480,252);
 ctx.fillStyle="#bfa0f1";ctx.fillRect(210,285,540*clamp(progress,0,1),4);
 ctx.restore();
}

function resetGuardian(){
  Object.assign(guardian,{hp:guardian.maxHp,active:false,defeated:false,
    state:"telegraph",timer:0,cycle:0,lockAim:false,
    introDuration:GUARDIAN_INTRO_SECONDS,
    aimX:guardian.arenaLeft+140,aimY:392,
    pickups:[
      {x:32810,y:375,r:15,active:true,cooldown:0},
      {x:32965,y:282,r:15,active:true,cooldown:0},
      {x:33520,y:272,r:15,active:true,cooldown:0}
    ]});
  guardianFx.shards.length=0;
  guardianFx.rings.length=0;
  guardianFx.flash=0;
  guardianFx.impact=0;
  guardianFx.entry=0;
  resetRiftPortal();
}
function guardianCorePosition(){
  // Three real attack angles; the third core is behind the body.
  const slot=Math.min(2,guardian.maxHp-guardian.hp);
  return [
    {x:guardian.x-64,y:348,name:"FRENTE"},
    {x:guardian.x-35,y:226,name:"TOPO"},
    {x:guardian.x+68,y:340,name:"COSTAS"}
  ][slot];
}
function guardianHint(){
  if(guardian.state==="intro")return "ATIVAÇÃO DO GUARDIÃO · PREPARE-SE!";
  if(guardian.state==="collapse")return "NÚCLEO DESTRUÍDO · PORTAL REATIVANDO";
  if(guardian.state==="telegraph")return guardian.lockAim?"MIRA TRAVADA! SAIA DA LINHA":"LASER MIRANDO O FLUX";
  if(guardian.state==="attack")return "LASER! DESVIE DA LINHA DE DISPARO";
  if(guardian.state==="exposed")
    return "NÚCLEO "+guardianCorePosition().name+" · BOOST OU GOLPE DESCENDENTE";
  return "NÚCLEO DESLOCADO: "+guardianCorePosition().name+" · RECONFIGURANDO";
}
function guardianLaserLine(){
  const ox=guardian.x-21,oy=guardian.y-21;
  let dx=guardian.aimX-ox,dy=guardian.aimY-oy;
  const magnitude=Math.hypot(dx,dy)||1;
  dx/=magnitude;dy/=magnitude;
  // Stop at the arena walls/ceiling/floor; the laser never bleeds into the
  // preceding platforming section.
  let reach=1350;
  if(dx<-.0001)reach=Math.min(reach,(guardian.arenaLeft+8-ox)/dx);
  if(dx>.0001)reach=Math.min(reach,(guardian.arenaRight-8-ox)/dx);
  if(dy<-.0001)reach=Math.min(reach,(93-oy)/dy);
  if(dy>.0001)reach=Math.min(reach,(guardian.arenaFloor-12-oy)/dy);
  reach=Math.max(0,reach);
  return {x1:ox,y1:oy,
    x2:clamp(ox+dx*reach,guardian.arenaLeft+8,guardian.arenaRight-8),
    y2:clamp(oy+dy*reach,93,guardian.arenaFloor-12)};
}
function distanceToLaser(px,py,line){
  const dx=line.x2-line.x1,dy=line.y2-line.y1;
  const distance2=dx*dx+dy*dy;
  const amount=clamp(((px-line.x1)*dx+(py-line.y1)*dy)/distance2,0,1);
  return Math.hypot(px-(line.x1+dx*amount),py-(line.y1+dy*amount));
}
function beginGuardianFight(quickRetry=false){
  guardian.active=true;guardian.state="intro";guardian.timer=0;
  guardian.introDuration=quickRetry?.85:GUARDIAN_INTRO_SECONDS;
  guardian.lockAim=false;
  guardian.aimX=player.x;guardian.aimY=player.y;
  guardianFx.entry=1;
  guardianFx.flash=.40;
  pushGuardianRing(guardian.x,guardian.y,"#bc94ff",105,.9);
  shakeTime=Math.max(shakeTime,.10);
  playSfx("boss-enter");
  musicStep=0;
  if(audioContext&&audioContext.state==="running")nextMusicNote=audioContext.currentTime+.07;
  syncTrackLabel();
}
function hurtGuardian(){
  // Impacts are phase-specific. Damage rules (boost or downward stomp)
  // remain in updateGuardian; the extra animations are cosmetic.
  const previousCore=guardianCorePosition();
  guardian.hp=Math.max(0,guardian.hp-1);
  guardian.cycle++;
  guardian.lockAim=false;
  guardian.timer=0;
  guardianFx.impact=1;
  // First crack: turquoise. Second: volatile amber. Finale: golden rupture.
  const impactColor=guardian.hp===0?"#fff0bf":
    guardian.hp===1?"#ffca89":"#a0ffee";
  guardianFx.flash=guardian.hp===0?.82:guardian.hp===1?.60:.42;
  pushGuardianRing(previousCore.x,previousCore.y,impactColor,
    guardian.hp===0?125:guardian.hp===1?94:70,1);
  spawnGuardianShards(previousCore.x,previousCore.y,
    guardian.hp===0?60:guardian.hp===1?38:25,
    guardian.hp===0?270:guardian.hp===1?210:160);
  emitParticles(previousCore.x,previousCore.y,impactColor,
    guardian.hp===0?48:guardian.hp===1?33:22,210);
  shakeTime=guardian.hp===0?.46:guardian.hp===1?.29:.17;
  playSfx(guardian.hp===0?"boss-collapse":
    guardian.hp===1?"boss-crack":"boss-hit");

  if(guardian.hp===0){
    guardian.state="collapse";
    guardian.defeated=false;
    // Do not open the portal until the visible 2.75-second sequence ends.
    // Music and gameplay continue, but the boss can no longer attack.
    return;
  }

  guardian.state="recovery";
  // Reposition inside the chamber for the new weak-spot challenge.
  player.x=32915;player.y=guardian.arenaFloor-PLAYER_RADIUS;
  player.prevX=player.x;player.prevY=player.y;
  player.vx=0;player.vy=0;player.onGround=false;player.ground=null;
  player.invulnerable=Math.max(.65,player.invulnerable);
  guardian.pickups.forEach(item=>{
    if(!item.active)item.cooldown=Math.min(item.cooldown,1.1);
  });
}

function updateGuardian(dt){
  if(activeStage!==2||guardian.defeated)return;
  if(!guardian.active){
    if(player.x<guardian.arenaLeft)return;
    beginGuardianFight();
  }
  // Lock both ends of the arena for a genuine boss encounter.
  if(player.x<guardian.arenaLeft+PLAYER_RADIUS){
    player.x=guardian.arenaLeft+PLAYER_RADIUS;
    player.vx=Math.max(0,player.vx);
  }
  if(player.x>guardian.arenaRight-PLAYER_RADIUS){
    player.x=guardian.arenaRight-PLAYER_RADIUS;
    player.vx=Math.min(0,player.vx);
  }
  for(const item of guardian.pickups){
    if(!item.active){
      item.cooldown-=dt;
      if(item.cooldown<=0){item.active=true;item.cooldown=0;}
    }else if(distance(player.x,player.y,item.x,item.y)<PLAYER_RADIUS+item.r){
      item.active=false;
      item.cooldown=4.2;
      player.boost=Math.min(100,player.boost+70);
      emitParticles(item.x,item.y,"#67fff1",17,160);
      playSfx("orb");
    }
  }
  guardian.timer+=dt;
  if(guardian.state==="intro"){
    // Cinematic introduction, with clear view and no damaging beams.
    if(guardian.timer>=guardian.introDuration){
      guardian.state="telegraph";guardian.timer=0;guardian.lockAim=false;
      pushGuardianRing(guardian.x,guardian.y,"#8bffe9",85,1);
      playSfx("boss-alert");
    }
  }else if(guardian.state==="collapse"){
    // During collapse the arena stays sealed and the core stops attacking.
    if(guardian.timer>=GUARDIAN_COLLAPSE_SECONDS){
      guardian.state="defeated";guardian.defeated=true;guardian.timer=0;
      activateRiftPortal();
      guardianFx.flash=.42;
      pushGuardianRing(guardian.x,guardian.y,"#c2ffdb",165,1);
      playSfx("boss-win");
      musicStep=0;
      if(audioContext&&audioContext.state==="running")
        nextMusicNote=audioContext.currentTime+.07;
      syncTrackLabel();
    }
  }else if(guardian.state==="telegraph"){
    // Track during wind-up; lock on 0.48s before the shot for fair reactions.
    if(!guardian.lockAim){
      guardian.aimX=clamp(player.x,guardian.arenaLeft+30,guardian.arenaRight-30);
      guardian.aimY=clamp(player.y,75,470);
      if(guardian.timer>=.80)guardian.lockAim=true;
    }
    if(guardian.timer>=1.32){
      guardian.state="attack";guardian.timer=0;
      playSfx("boss-alert");
    }
  }else if(guardian.state==="attack"){
    const line=guardianLaserLine();
    if(distanceToLaser(player.x,player.y,line)<PLAYER_RADIUS+8)damagePlayer(false);
    if(guardian.timer>=.66){guardian.state="exposed";guardian.timer=0;}
  }else if(guardian.state==="exposed"){
    const core=guardianCorePosition();
    const close=distance(player.x,player.y,core.x,core.y)<PLAYER_RADIUS+27;
    if(close){
      const dash=player.boosting&&Math.abs(player.vx)>=BOOST_GATE_MIN_SPEED;
      const stomp=player.vy>110&&player.prevY+PLAYER_RADIUS<=core.y-10;
      if(dash||stomp){hurtGuardian();return;}
    }
    if(guardian.timer>=3.9){guardian.state="telegraph";guardian.timer=0;guardian.lockAim=false;}
  }else if(guardian.state==="recovery"&&guardian.timer>=1.12){
    guardian.state="telegraph";guardian.timer=0;guardian.lockAim=false;
  }
  // Armoured body is dangerous outside the vulnerability/recovery windows.
  if(guardian.state==="telegraph"||guardian.state==="attack"){
    if(circleRect(player.x,player.y,PLAYER_RADIUS,
      {x:guardian.x-42,y:guardian.y-55,w:84,h:109}))damagePlayer(false);
  }
}
// --------------------------- Rift exit ---------------------------
// The former white GO door is exclusive to stage 1. The Prism Guardian
// creates this stage 2 exit only after its complete collapse cinematic.
function resetRiftPortal(){
  riftPortal.opening=false;
  riftPortal.open=false;
  riftPortal.time=0;
  riftPortal.particleTimer=0;
}
function riftCenter(){
  // Keep the rift aligned with the existing stage 2 goal and flat ground.
  return {x:goal.x+goal.w/2,y:goal.y+14};
}
function activateRiftPortal(){
  if(activeStage!==2 || riftPortal.open || riftPortal.opening)return;
  riftPortal.opening=true;
  riftPortal.time=0;
  riftPortal.particleTimer=0;
  const p=riftCenter();
  emitParticles(p.x,p.y,"#bca2ff",32,115);
  emitParticles(p.x,p.y,"#92fff0",20,125);
  playSfx("portal-open");
}
function updateRiftPortal(dt){
  if(activeStage!==2||!riftPortal.opening)return;
  riftPortal.time+=dt;
  if(!riftPortal.open&&riftPortal.time>=RIFT_OPEN_SECONDS){
    riftPortal.open=true;
    const p=riftCenter();
    emitParticles(p.x,p.y,"#a6ffeb",28,135);
  }
  riftPortal.particleTimer-=dt;
  if(riftPortal.particleTimer<=0){
    // Discrete drifting sparks share the game's existing capped particle pool.
    const p=riftCenter(),phase=riftPortal.time*8;
    emitParticles(p.x+Math.cos(phase)*21,p.y+Math.sin(phase)*44,
      Math.floor(phase)%2?"#d3afff":"#85fff3",2,32);
    riftPortal.particleTimer=.13;
  }
}
function playerTouchesRift(){
  if(activeStage!==2||!riftPortal.open)return false;
  const p=riftCenter();
  // Rounded active aperture: forgiving at ground level, not a hidden rectangle.
  const dx=(player.x-p.x)/58;
  const dy=(player.y-p.y)/79;
  return dx*dx+dy*dy<=1;
}
function drawRiftPortal(){
  if(activeStage!==2||!riftPortal.opening)return;
  const p=riftCenter();
  if(p.x<cameraX-110||p.x>cameraX+VIEW_W+110)return;
  const progress=clamp(riftPortal.time/RIFT_OPEN_SECONDS,0,1);
  const emerge=1-Math.pow(1-progress,3);
  const phase=visualTime*2.6;
  const pulse=1+Math.sin(visualTime*4.8)*.055;
  const openScale=.08+emerge*.92;
  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.scale(openScale*pulse,openScale*pulse);
  ctx.globalAlpha=Math.max(.05,Math.min(1,progress*2));
  // A shadow underneath anchors the portal to the ground.
  ctx.fillStyle="rgba(33,10,73,.40)";
  ctx.beginPath();ctx.ellipse(0,55,63,10,0,0,Math.PI*2);ctx.fill();
  // Layered translucent auras supply glow without extra image assets.
  for(let i=3;i>=0;i--){
    ctx.fillStyle=i%2===0?"rgba(164,91,255,.055)":"rgba(81,246,235,.062)";
    ctx.beginPath();ctx.ellipse(0,0,48+i*9,59+i*8,0,0,Math.PI*2);ctx.fill();
  }
  // Black-blue center that reads as depth rather than a solid exit block.
  ctx.fillStyle="#0e1741";
  ctx.beginPath();ctx.ellipse(0,0,35,53,0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<5;i++){
    const radius=29-i*4;
    const sway=Math.sin(phase+i*.9)*3;
    ctx.fillStyle=i%2===0?"rgba(71,213,246,.13)":"rgba(184,104,255,.17)";
    ctx.beginPath();ctx.ellipse(sway,0,radius,47-i*7,phase*.09+i*.2,
      0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="rgba(118,255,241,.34)";
  ctx.beginPath();ctx.ellipse(Math.sin(phase)*4,-2,12,28,
    -Math.sin(phase*.4)*.35,0,Math.PI*2);ctx.fill();
  // Two counter-rotating lilac/cyan broken rings.
  for(let side=0;side<2;side++){
    ctx.strokeStyle=side===0?"#be94ff":"#7cfff0";
    ctx.lineWidth=side===0?7:3.3;
    ctx.beginPath();
    const angle=side===0?phase*.46:-phase*.6;
    ctx.ellipse(0,0,42+side*5,57+side*4,0,
      angle,angle+Math.PI*1.62);ctx.stroke();
  }
  // Three bright crystals orbit the frame and identify it as a fenda.
  for(let i=0;i<3;i++){
    const angle=phase*(i===1?-.72:.58)+i*Math.PI*2/3;
    const x=Math.cos(angle)*47,y=Math.sin(angle)*58;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle+.8);
    ctx.fillStyle=i===1?"#8effef":"#e5b4ff";
    ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,0);
    ctx.lineTo(0,9);ctx.lineTo(-6,0);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  if(riftPortal.open){
    ctx.save();
    ctx.globalAlpha=.7+.3*Math.sin(visualTime*3)**2;
    ctx.fillStyle="#b9fff0";
    ctx.font="bold 12px system-ui";ctx.textAlign="center";
    ctx.fillText("PORTAL DA FENDA",p.x,p.y-83);
    ctx.textAlign="left";ctx.restore();
  }
}

function drawGuardianBackdrop(){
  if(!guardian.active && player.x<guardian.arenaLeft-580)return;
  ctx.fillStyle="rgba(25,14,62,.92)";
  ctx.fillRect(guardian.arenaLeft,52,guardian.arenaRight-guardian.arenaLeft,357);
  ctx.strokeStyle="rgba(194,147,255,.14)";ctx.lineWidth=2;
  for(let x=guardian.arenaLeft+40;x<guardian.arenaRight;x+=105){
    ctx.beginPath();ctx.moveTo(x,110);ctx.lineTo(x+100,403);ctx.stroke();
  }
}

// Bounded cinematic effects; no collision, camera or movement side effects.
function pushGuardianRing(x,y,color,size=70,ellipse=1){
  if(guardianFx.rings.length>=12)guardianFx.rings.shift();
  guardianFx.rings.push({x,y,color,size,ellipse,life:.7,maxLife:.7});
}
function spawnGuardianShards(x,y,count=24,power=160){
  for(let i=0;i<count&&guardianFx.shards.length<GUARDIAN_SHARD_LIMIT;i++){
    const angle=(i/count)*Math.PI*2+(Math.random()-.5)*.4;
    const velocity=power*(.3+Math.random()*.7);
    const life=.65+Math.random()*.7;
    guardianFx.shards.push({
      x,y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity-40,
      angle,spin:(Math.random()-.5)*8,
      size:2.5+Math.random()*6,
      life,maxLife:life,
      color:i%3===0?"#ffe4a5":i%2===0?"#86fff0":"#bd9cff"
    });
  }
}
function updateGuardianVisuals(dt){
  if(activeStage!==2)return;
  guardianFx.flash=Math.max(0,guardianFx.flash-dt*2.5);
  guardianFx.impact=Math.max(0,guardianFx.impact-dt*1.65);
  guardianFx.entry=Math.max(0,guardianFx.entry-dt*.9);
  if(guardian.active&&guardian.state==="collapse"){
    // Intermittent glows and disintegration rather than an abrupt disappearance.
    const now=guardian.timer;
    if(Math.floor((now-dt)*8)!==Math.floor(now*8)){
      spawnGuardianShards(guardian.x+(Math.random()-.5)*85,
        guardian.y+(Math.random()-.5)*120,9,155+now*30);
      pushGuardianRing(guardian.x,guardian.y,
        now<1.5?"#ffcaee":"#8dfff1",75+now*18,1);
    }
  }
  for(const shard of guardianFx.shards){
    shard.x+=shard.vx*dt;
    shard.y+=shard.vy*dt;
    shard.vy+=105*dt;
    shard.angle+=shard.spin*dt;
    shard.life-=dt;
  }
  guardianFx.shards=guardianFx.shards.filter(x=>x.life>0).slice(-GUARDIAN_SHARD_LIMIT);
  for(const ring of guardianFx.rings)ring.life-=dt;
  guardianFx.rings=guardianFx.rings.filter(x=>x.life>0).slice(-12);
}
function drawGuardianVisuals(){
  if(activeStage!==2||!guardian.active)return;
  for(const ring of guardianFx.rings){
    const v=1-ring.life/ring.maxLife;
    ctx.save();
    ctx.globalAlpha=(1-v)*.9;
    ctx.strokeStyle=ring.color;
    ctx.lineWidth=5*(1-v)+1;
    ctx.beginPath();
    ctx.ellipse(ring.x,ring.y,ring.size*(.25+v),
      ring.size*ring.ellipse*(.25+v),0,0,Math.PI*2);
    ctx.stroke();ctx.restore();
  }
  for(const shard of guardianFx.shards){
    if(shard.x<cameraX-30||shard.x>cameraX+VIEW_W+30)continue;
    ctx.save();ctx.globalAlpha=clamp(shard.life/shard.maxLife,0,1);
    ctx.translate(shard.x,shard.y);ctx.rotate(shard.angle);
    ctx.fillStyle=shard.color;
    ctx.beginPath();ctx.moveTo(0,-shard.size*1.6);
    ctx.lineTo(shard.size*.8,shard.size*.7);
    ctx.lineTo(-shard.size*.8,shard.size*.7);
    ctx.closePath();ctx.fill();ctx.restore();
  }
  if(guardianFx.flash>.01){
    // World-space localized flash; capped alpha avoids full-screen strobing.
    ctx.save();ctx.globalAlpha=Math.min(.32,guardianFx.flash*.34);
    ctx.fillStyle=guardian.hp===0?"#fff0c6":"#befaff";
    ctx.beginPath();ctx.arc(guardian.x,guardian.y,145+guardianFx.flash*45,0,Math.PI*2);
    ctx.fill();ctx.restore();
  }
}
function drawGuardianCinematic(){
  if(activeStage!==2||!guardian.active)return;
  const arriving=guardian.state==="intro";
  const collapsing=guardian.state==="collapse";
  if(!arriving&&!collapsing)return;
  const time=guardian.timer;
  const duration=arriving?guardian.introDuration:GUARDIAN_COLLAPSE_SECONDS;
  const progress=clamp(time/duration,0,1);
  // Fade in, then fade out to restore visibility before gameplay resumes.
  const alpha=arriving?Math.min(1,time/.30,(duration-time)/.34):
    Math.min(1,time/.24,(duration-time)/.50);
  if(alpha<=0)return;
  ctx.save();
  ctx.globalAlpha=Math.max(0,alpha);
  ctx.fillStyle="rgba(10,8,30,.86)";
  roundRect(178,193,604,100,12);ctx.fill();
  ctx.strokeStyle=arriving?"#c29bff":"#93ffe8";
  ctx.lineWidth=2;ctx.stroke();
  ctx.textAlign="center";
  ctx.fillStyle=arriving?"#f1dcff":"#caffef";
  ctx.font="bold 28px system-ui";
  ctx.fillText(arriving?"GUARDIÃO DO PRISMA":"NÚCLEO DESTRUÍDO",VIEW_W/2,236);
  ctx.font="bold 13px system-ui";
  ctx.fillStyle="#ffddb5";
  ctx.fillText(arriving?"TRÊS NÚCLEOS · UMA ÚNICA SAÍDA":
    "ESTABILIZANDO A FENDA · PORTAL REABRINDO",VIEW_W/2,259);
  ctx.fillStyle="#30294e";ctx.fillRect(237,273,486,5);
  ctx.fillStyle=arriving?"#c89fff":"#9cffe6";
  ctx.fillRect(237,273,486*progress,5);
  ctx.textAlign="left";
  ctx.restore();
}

function drawGuardian(){
  if(activeStage!==2)return;
  if(!guardian.active&&player.x<guardian.arenaLeft-580)return;
  for(const p of guardian.pickups){
    if(!p.active||guardian.defeated)continue;
    ctx.fillStyle="rgba(103,249,239,.2)";ctx.beginPath();
    ctx.arc(p.x,p.y,p.r+12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#66f9ef";ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#173e57";ctx.beginPath();ctx.arc(p.x,p.y,p.r*.44,0,Math.PI*2);ctx.fill();
  }
  if(guardian.active&&!guardian.defeated&&["telegraph","attack"].includes(guardian.state)){
    const laser=guardianLaserLine(),firing=guardian.state==="attack";
    ctx.strokeStyle=firing?"rgba(255,66,148,.9)":guardian.lockAim?"rgba(255,200,105,.7)":"rgba(255,210,118,.3)";
    ctx.lineWidth=firing?13:guardian.lockAim?4:2;
    ctx.beginPath();ctx.moveTo(laser.x1,laser.y1);ctx.lineTo(laser.x2,laser.y2);ctx.stroke();
    if(!firing){
      ctx.fillStyle="#ffe5b4";ctx.font="bold 12px system-ui";
      ctx.fillText(guardian.lockAim?"MIRA TRAVADA":"CALCULANDO ALVO",guardian.x-110,guardian.y-116);
    }
  }
  // Angular guardian body and expressive repositioning crystal.
  ctx.save();ctx.translate(guardian.x,guardian.y+Math.sin(visualTime*3)*4);
  if(guardian.state==="intro"){
    const phase=clamp(guardian.timer/guardian.introDuration,0,1);
    const smooth=1-Math.pow(1-phase,3);
    ctx.translate(0,-(1-smooth)*220);
    ctx.rotate((1-smooth)*-.24);
  }
  if(guardian.state==="collapse"){
    const progress=clamp(guardian.timer/GUARDIAN_COLLAPSE_SECONDS,0,1);
    ctx.translate(Math.sin(guardian.timer*34)*progress*11,
      Math.cos(guardian.timer*26)*progress*7);
    ctx.rotate(Math.sin(guardian.timer*7)*progress*.3);
    ctx.globalAlpha=1-progress*.88;
  }else if(guardian.defeated){ctx.globalAlpha=.25;ctx.rotate(.48);}
  if(guardianFx.impact>0 && guardian.state!=="collapse"){
    ctx.translate(Math.sin(visualTime*43)*guardianFx.impact*8,0);
  }
  ctx.fillStyle="rgba(180,107,246,.14)";
  ctx.beginPath();ctx.ellipse(0,0,94,87,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#362351";ctx.beginPath();
  ctx.moveTo(0,-79);ctx.lineTo(48,-46);ctx.lineTo(58,31);ctx.lineTo(0,68);
  ctx.lineTo(-58,31);ctx.lineTo(-48,-46);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#b38cfa";ctx.lineWidth=6;ctx.stroke();
  ctx.fillStyle="#7151aa";
  ctx.beginPath();ctx.moveTo(-45,-38);ctx.lineTo(-72,-62);ctx.lineTo(-78,22);ctx.lineTo(-49,41);ctx.fill();
  ctx.beginPath();ctx.moveTo(45,-38);ctx.lineTo(72,-62);ctx.lineTo(78,22);ctx.lineTo(49,41);ctx.fill();
  ctx.fillStyle="#271342";ctx.fillRect(-20,-33,40,9);
  ctx.fillStyle="#dcc0ff";ctx.fillRect(-13,-31,26,5);
  // Visible damage progression: one glowing fracture per successful hit.
  const cracks=guardian.maxHp-guardian.hp;
  ctx.lineWidth=2.8;ctx.strokeStyle="#b9ffed";
  if(cracks>=1){
    ctx.beginPath();ctx.moveTo(-18,-41);ctx.lineTo(-3,-17);
    ctx.lineTo(-14,4);ctx.stroke();
  }
  if(cracks>=2){
    ctx.beginPath();ctx.moveTo(24,-44);ctx.lineTo(9,-16);
    ctx.lineTo(25,17);ctx.stroke();
  }
  if(cracks>=3){
    ctx.beginPath();ctx.moveTo(-26,29);ctx.lineTo(0,10);
    ctx.lineTo(30,36);ctx.stroke();
  }
  ctx.restore();
  const core=guardianCorePosition();
  if(guardian.active&&!guardian.defeated&&guardian.state!=="collapse"){
    ctx.fillStyle=guardian.state==="exposed"?"rgba(110,255,220,.2)":"rgba(255,117,195,.1)";
    ctx.beginPath();ctx.arc(core.x,core.y,36,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=guardian.state==="exposed"?"#83ffe1":"#e0a8ff";
    ctx.beginPath();ctx.arc(core.x,core.y,23,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#1c1336";ctx.beginPath();ctx.arc(core.x,core.y,10,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#faf0ff";ctx.lineWidth=2;ctx.beginPath();
    ctx.arc(core.x,core.y,29,0,Math.PI*2);ctx.stroke();
  }
  // Entry barrier plus exit seal, drawn separately from boss sprite.
  if(guardian.active&&!guardian.defeated){
    ctx.strokeStyle="#da89ff";ctx.lineWidth=8;
    for(const x of [guardian.arenaLeft,guardian.arenaRight]){
      ctx.beginPath();ctx.moveTo(x,97);ctx.lineTo(x,405);ctx.stroke();
    }
  }
}

function update(dt) {
  if(stageArrival.active){updateStageArrival(dt);return;}
  if(activeStage===3&&cityBoss.active&&cityBoss.state==="intro"){
    // Scene is visible in the world and cannot consume race time.
    updateCityBoss(dt);updateCityBossFX(dt);return;
  }
  gameTime += dt;
  visualTime += dt;
  sparkleCooldown = Math.max(0, sparkleCooldown - dt);
  pickupSoundCooldown = Math.max(0, pickupSoundCooldown - dt);
  const wasOnGround = player.onGround;
  const previousVerticalSpeed = player.vy;
  const wasBoosting = player.boosting;
  const wasSliding = player.sliding;
  const wasDownhillSliding = player.downhillSliding;
  player.prevX = player.x;
  player.prevY = player.y;
  player.invulnerable = debugMode ? 0 : Math.max(0, player.invulnerable - dt);
  shakeTime = Math.max(0, shakeTime - dt);

  const left = keys.has("arrowleft") || keys.has("a");
  const right = keys.has("arrowright") || keys.has("d");
  const jump = keys.has(" ") || keys.has("arrowup") || keys.has("w") || keys.has("k");
  const boost = keys.has("shift") || keys.has("j");
  const slide = keys.has("arrowdown") || keys.has("s");
  jumpBuffer = Math.max(0, jumpBuffer - dt);
  coyoteTimer = player.onGround ? 0.11 : Math.max(0, coyoteTimer - dt);

  player.sliding = slide && player.onGround;
  player.animationPhase += Math.abs(player.vx) * dt * 0.049;
  const accel = player.onGround ? (player.sliding ? 390 : 1280) : 660;
  const friction = player.onGround ? (player.sliding ? 180 : 1050) : 110;
  const normalMax = 480;
  const boostMax = BOOST_MAX_SPEED;
  const speedBeforeInput = Math.abs(player.vx);

  if (left&&!airDash.active) {
    player.vx -= accel * dt;
    player.facing = -1;
  }
  if (right&&!airDash.active) {
    player.vx += accel * dt;
    player.facing = 1;
  }
  if (!left && !right && player.onGround&&!airDash.active) {
    player.vx = approach(player.vx, 0, friction * dt);
  }

  if(debugMode)player.boost=100;
  const boosting = boost && !airDash.active && player.boost > 0 && Math.abs(player.vx) > 50;
  player.boosting = boosting;
  if (boosting && !wasBoosting) { playSfx("boost"); triggerFluxFx("boost"); }
  if (boosting) {
    player.vx += player.facing * BOOST_ACCELERATION * dt;
    player.boost = debugMode?100:Math.max(0, player.boost - 34 * dt);
    player.trail.push({ x: player.x, y: player.y, life: 0.24 });
  }

  // Downhill means velocity follows the track's slope (either direction).
  // Multiplicative growth is frame-rate independent, thanks to exp(rate * dt).
  const slope = player.ground ? trackSlope(player.ground) : 0;
  const downhill = player.sliding && player.onGround && slope * player.vx > 0.001;
  player.downhillSliding = downhill;
  if (downhill && !wasDownhillSliding) playSfx("slide");
  if (downhill) {
    const rate = 0.62 + Math.min(Math.abs(slope), 0.35) * 2.4;
    player.vx = Math.sign(player.vx) *
      Math.min(SLIDE_DOWNHILL_CAP, Math.abs(player.vx) * Math.exp(rate * dt));
  }
  const maxSpeed = boosting ? boostMax : normalMax;
  if (downhill) {
    player.vx = clamp(player.vx, -SLIDE_DOWNHILL_CAP, SLIDE_DOWNHILL_CAP);
  } else if (!airDash.active&&Math.abs(player.vx) > maxSpeed) {
    // Preserve momentum inherited from a downhill slide, but never generate
    // speed above the boost cap through input/boost acceleration alone.
    const braking = player.sliding ? 880 : 1800;
    const carriedSpeed = Math.max(maxSpeed, speedBeforeInput - braking * dt);
    player.vx = Math.sign(player.vx) *
      Math.min(Math.abs(player.vx), carriedSpeed);
  } else if(!airDash.active){
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
  }

  const underTunnel = tunnels.some(t => player.x > t.x && player.x < t.x + t.w);
  if (jumpBuffer > 0 && coyoteTimer > 0 && !underTunnel&&!airDash.active) {
    const springJump=player.ground?.behavior==="spring"&&
      secretTrials.some(t=>t.active&&t.id===player.ground.secretId);
    player.sliding = false;
    player.vy = -660 - Math.min(90, Math.abs(player.vx) * 0.09) -
      (springJump?95:0);
    player.onGround = false;
    player.ground = null;
    jumpBuffer = 0;
    coyoteTimer = 0;
    emitParticles(player.x, player.y + 18, "#d4ffff", 7, 90);
    triggerFluxFx("jump");
    playSfx("jump");
  }

  if(debugMode){
    // Free flight: Space/W/Up ascends, S/Down descends, release to hover.
    const up=keys.has(" ")||keys.has("w")||keys.has("arrowup")||keys.has("k");
    const down=keys.has("s")||keys.has("arrowdown");
    player.vy=(Number(down)-Number(up))*490;
    player.y=clamp(player.y+player.vy*dt,secretTrials.some(t=>t.active)?-420:55,645);
    player.x+=player.vx*dt;
    player.onGround=false;player.ground=null;player.sliding=false;
    player.downhillSliding=false;
  }else{
    if(airDash.active){
      player.vx=airDash.dx*DASH_SPEED;player.vy=airDash.dy*DASH_SPEED;
      player.x+=player.vx*dt;player.y+=player.vy*dt;
    }else{
    if(!jump&&player.vy<-160)player.vy+=1450*dt;
    player.vy+=1850*dt;
    player.vy=Math.min(player.vy,1250);
    player.x+=player.vx*dt;
    player.y+=player.vy*dt;
    }
  }
  updateMovingPlatforms(dt);
  if(!debugMode)resolveTracks();
  if(player.onGround&&airDash.active){airDash.active=false;airDash.time=0;}
  updateAirDash(dt);
  if(!debugMode&&player.onGround&&player.ground?.secretId&&
    Math.abs(player.ground.belt||0)>0&&
    secretTrials.some(t=>t.active&&t.id===player.ground.secretId)){
    player.vx=clamp(player.vx+player.ground.belt*dt,-480,480);
  }
  if(player.onGround && slide)player.sliding=true;
  if(player.sliding && !wasSliding)triggerFluxFx("slide");
  if (!wasOnGround && player.onGround && previousVerticalSpeed > 130) {
    emitParticles(player.x, player.y + PLAYER_RADIUS, "#67c8c3", 8, 100);
    triggerFluxFx("land",previousVerticalSpeed);
    playSfx("land");
  }
  if(!debugMode)resolveTunnels();
  resolveWalls();
  resolveCityRiftGates();
  updateCheckpoints();
  updateEnemies(dt);
  if(!gameStarted)return;
  updateSentryShots(dt);
  if(!gameStarted)return;
  updateCityBoss(dt);
  if(!gameStarted)return;
  updateCityBossFX(dt);
  collectItems();
  collectCityDashCore();
  handleHazards();
  if(!gameStarted)return;
  handlePulseGates();
  if(!gameStarted)return;
  handleBoostPads();
  handleSprings();
  updateGuardian(dt);
  updateSecretTrials(dt);
  notification.timer=Math.max(0,notification.timer-dt);
  updateRiftPortal(dt);
  updateGuardianVisuals(dt);
  updateFluxFx(dt);
  updateTrail(dt);
  updateParticles(dt);
  if ((player.boosting || (player.sliding && Math.abs(player.vx) > 140)) && sparkleCooldown === 0) {
    const color = player.boosting ? "#65f8ff" : "#fbc66d";
    emitParticles(player.x - player.facing * 13, player.y + 14, color, 2, 68);
    sparkleCooldown = player.boosting ? 0.045 : 0.075;
  }

  player.x = clamp(player.x, PLAYER_RADIUS, WORLD_W - PLAYER_RADIUS);
  if(activeStage===3&&cityBoss.active&&!cityBoss.defeated&&player.x>cityBoss.arenaRight){
    player.x=cityBoss.arenaRight-PLAYER_RADIUS;player.vx=Math.min(0,player.vx);
  }
  if(activeStage===2&&!guardian.defeated&&player.x>guardian.arenaRight){
    player.x=guardian.arenaRight-PLAYER_RADIUS;player.vx=Math.min(0,player.vx);
  }

  if(!debugMode&&player.y>720){damagePlayer(true);if(!gameStarted)return;}

  // Stage 1 keeps its original exit. Stage 2 requires entering a fully open
  // dimensional portal; touching the inactive spawn point cannot win.
  const exitReached=activeStage===2?
      riftPortal.open&&playerTouchesRift():
      activeStage===3?
      cityBoss.defeated&&circleRect(player.x,player.y,PLAYER_RADIUS,goal):
      circleRect(player.x,player.y,PLAYER_RADIUS,goal);
  if(exitReached && !gameCleared){
    gameCleared=true;
    emitParticles(player.x,player.y,activeStage===2?"#a6ffeb":"#fbc66d",45,240);
    if(activeStage===2)playSfx("portal-enter");
    showResults(gameTime,player.rings,player.cores);
  }

  updateCamera(dt);
}

function trackSlope(floor) {
  return (floor.y2 - floor.y1) / Math.max(1, floor.x2 - floor.x1);
}

function cameraAnchorFor(vx, facing) {
  // Faster runners stay closer to the trailing edge, revealing more hazards ahead.
  const t = clamp((Math.abs(vx) - 90) / (SLIDE_DOWNHILL_CAP - 90), 0, 1);
  const eased = t * t * (3 - 2 * t);
  const inset = lerp(CAMERA_IDLE_ANCHOR, CAMERA_FAST_ANCHOR, eased);
  const direction = Math.abs(vx) > 35 ? Math.sign(vx) : facing;
  return (direction >= 0 ? inset : 1 - inset) * VIEW_W;
}

function updateCamera(dt) {
  // Full arena is exactly one viewport wide. No look-ahead, no following.
  if(activeStage===3&&cityBoss.active&&!cityBoss.defeated){
    cameraX=cityBoss.arenaLeft;
    cameraY=0;return;
  }
  if(activeStage===3&&cityBoss.defeated&&player.x>=cityBoss.arenaLeft){
    cameraX=lerp(cameraX,Math.max(0,WORLD_W-VIEW_W),1-Math.exp(-5*dt));
    cameraY=0;return;
  }
  if(activeStage===2&&guardian.active&&!guardian.defeated){
    cameraX=guardian.arenaLeft;
    cameraY=0;
    return;
  }
  // A calm cinematic pan reveals the newly forming rift after the Guardian
  // falls. Keep the final chamber and exit in frame instead of chasing speed.
  if(activeStage===2&&guardian.defeated&&riftPortal.opening){
    const targetX=Math.max(0,WORLD_W-VIEW_W);
    cameraX=lerp(cameraX,targetX,1-Math.exp(-3.8*dt));
    cameraY=lerp(cameraY,0,1-Math.exp(-5*dt));
    return;
  }
  const secret=secretTrials.find(t=>t.active);
  if(secret){
    // Lock horizontal framing and track the climb vertically, including
    // negative world heights that normal level cameras never expose.
    const targetX=clamp(secret.cameraX-VIEW_W*.5,0,WORLD_W-VIEW_W);
    const targetY=clamp(player.y-VIEW_H*.59,
      secret.targetY-225,secret.startY-145);
    cameraX=lerp(cameraX,targetX,1-Math.exp(-8*dt));
    cameraY=lerp(cameraY,targetY,1-Math.exp(-8*dt));
    return;
  }
  const targetAnchor = cameraAnchorFor(player.vx, player.facing);
  cameraAnchorX = lerp(cameraAnchorX, targetAnchor, 1 - Math.exp(-4.8 * dt));
  const speed = clamp(Math.abs(player.vx) / SLIDE_DOWNHILL_CAP, 0, 1);
  const targetX = clamp(player.x - cameraAnchorX, 0, WORLD_W - VIEW_W);
  const targetY = clamp(player.y - VIEW_H * 0.56, 0, WORLD_H - VIEW_H);
  cameraX = lerp(cameraX, targetX, 1 - Math.exp(-(7 + 3 * speed) * dt));
  cameraY = lerp(cameraY, targetY, 1 - Math.exp(-5 * dt));
}

function resolveTracks() {
  let best=null,bestDistance=Infinity;
  const bottom=player.y+PLAYER_RADIUS,prevBottom=player.prevY+PLAYER_RADIUS;
  for(const floor of tracks){
    if(!secretPlatformSolid(floor))continue;
    const left=Math.min(floor.x1,floor.x2),right=Math.max(floor.x1,floor.x2);
    if(player.x<left-PLAYER_RADIUS||player.x>right+PLAYER_RADIUS)continue;
    const y=yOnTrack(floor,clamp(player.x,left,right)),d=bottom-y;
    const sticking=player.onGround&&player.ground===floor
      &&player.vy>=-160&&d>-30&&d<40;
    const landing=prevBottom<=y+14&&bottom>=y-12&&player.vy>=-160;
    if(!sticking&&!landing)continue;
    const score=Math.abs(d)-(sticking?8:0);
    if(score<bestDistance){bestDistance=score;best={floor,y}}
  }
  if(best){
    player.y=best.y-PLAYER_RADIUS;player.vy=Math.min(player.vy,0);
    player.onGround=true;player.ground=best.floor;
    player.vx+=clamp(trackSlope(best.floor)*230,-115,115)*FIXED_DT;
  }else{
    player.onGround=false;player.ground=null;player.sliding=false;
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
      if (player.boosting && Math.abs(player.vx) > BOOST_GATE_MIN_SPEED) {
        wall.active = false;
        emitParticles(wall.x + wall.w / 2, wall.y + wall.h / 2, "#ffa55c", 30, 195);
        playSfx("gate");
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
function updateSentryShots(dt){
  for(const shot of sentryShots){
    shot.x+=shot.vx*dt;
    shot.y+=shot.vy*dt;
    shot.life-=dt;
    if(shot.life<=0)continue;
    // A fast boost can intercept plasma; debug mode ignores collision.
    if(distance(shot.x,shot.y,player.x,player.y)<PLAYER_RADIUS+shot.r){
      shot.life=0;
      if(!shot.unblockable&&player.boosting&&Math.abs(player.vx)>BOOST_SMASH_MIN_SPEED){
        emitParticles(shot.x,shot.y,"#ff9ccb",6,80);
      }else damagePlayer(false);
    }
  }
  sentryShots=sentryShots.filter(p=>p.life>0&&p.x>cameraX-240
    &&p.x<cameraX+VIEW_W+240&&p.y>-80&&p.y<WORLD_H+100);
}
function drawSentryShots(){
  for(const shot of sentryShots){
    ctx.fillStyle=shot.cityShot?"rgba(255,176,103,.23)":"rgba(255,107,179,.2)";
    ctx.beginPath();ctx.arc(shot.x,shot.y,shot.r+7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=shot.cityShot?"#ffac79":"#ff82c5";
    ctx.beginPath();ctx.arc(shot.x,shot.y,shot.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ffe8f6";
    ctx.beginPath();ctx.arc(shot.x-2,shot.y-2,3,0,Math.PI*2);ctx.fill();
  }
}

function updateEnemies(dt) {
  for (const bad of enemies) {
    if (!bad.alive) continue;
    bad.phase += dt*(["drone","city-drone"].includes(bad.type)?2.3:1.8);
    if (bad.patrol>0)bad.x=bad.baseX+Math.sin(bad.phase)*bad.patrol;
    if(["drone","city-drone"].includes(bad.type))
      bad.y=bad.yBase+Math.sin(bad.phase*1.6)*15;
    if(bad.type==="city-hunter"&&Math.abs(bad.x-player.x)<300)
      bad.x+=Math.sign(player.x-bad.x)*Math.min(100*dt,Math.abs(player.x-bad.x));
    if(activeStage===3&&["city-drone","city-turret"].includes(bad.type)){
      bad.shotTimer-=dt;
      if(bad.shotTimer<=0&&Math.abs(bad.x-player.x)<760&&sentryShots.length<34){
        const x=bad.x,y=bad.y-bad.h*.7;
        const a=Math.atan2(player.y-y,player.x-x);
        const speed=bad.type==="city-drone"?450:500;
        for(const offset of [-.115,.115]){
          sentryShots.push({x,y,vx:Math.cos(a+offset)*speed,
            vy:Math.sin(a+offset)*speed,life:3,r:8,
            unblockable:true,cityShot:true});
        }
        bad.shotTimer=bad.type==="city-drone"?1.22:1.55;
        playSfx("boss-alert");
      }
    }
    if(bad.type==="sentry"){
      bad.shotTimer=(bad.shotTimer??(.75+(bad.baseX%4)*.23))-dt;
      const dist=Math.hypot(bad.x-player.x,(bad.y-27)-player.y);
      if(bad.shotTimer<=0 && dist<720 && sentryShots.length<36){
        // Sentries aim once and fire slow, readable plasma bolts.
        const dx=player.x-bad.x,dy=player.y-(bad.y-24);
        const len=Math.hypot(dx,dy)||1;
        sentryShots.push({
          x:bad.x,y:bad.y-24,
          vx:dx/len*310,vy:dy/len*310,
          life:3.8,r:9
        });
        bad.shotTimer=2.25;
        playSfx("boss-alert");
      }
    }

    const box = { x: bad.x - bad.w / 2, y: bad.y - bad.h, w: bad.w, h: bad.h };
    if (!circleRect(player.x, player.y, PLAYER_RADIUS, box)) continue;

    const cityEnemy=isCityEnemyType(bad.type);
    const stomp=bad.type!=="sentry"&&bad.type!=="city-turret"&&
      player.prevY+PLAYER_RADIUS<=box.y+8&&player.vy>80&&!airDash.active;
    const smash=player.boosting&&!cityEnemy&&
      Math.abs(player.vx)>BOOST_SMASH_MIN_SPEED;
    const cut=airDash.active;
    if(stomp||smash||cut){
      bad.alive = false;
      emitParticles(bad.x, bad.y - 12, "#ff956f", 12, 145);
      playSfx("hit");
      player.vy = stomp ? -520 : player.vy;
      player.vx += player.facing * 80;
      // Enemies do not refill boost.
    } else {
      damagePlayer(false);
    }
  }
}

// ---------------------- Optional routes & achievements ----------------------
function announce(title,subtitle=""){
  notification.title=title;notification.subtitle=subtitle;notification.timer=3.1;
}
function grantAchievement(id){
  if(debugUsedThisRun||progress.achievements[id])return false;
  const item=ACHIEVEMENTS.find(a=>a.id===id);
  if(!item)return false;
  progress.achievements[id]=true;
  storeProgress();
  announce("CONQUISTA: "+item.title,item.description);
  playSfx("achievement");
  return true;
}
function updateRouteAchievements(){
  if(debugUsedThisRun)return;
  const one=progress.secrets.stage1.length,
    two=progress.secrets.stage2.length,
    three=progress.secrets.stage3.length;
  if(one+two+three>0)grantAchievement("explorer");
  if(one===3)grantAchievement("forestSecrets");
  if(two===3)grantAchievement("canyonSecrets");
  if(one+two===6)grantAchievement("sixSecrets");
  if(three===3)grantAchievement("citySecrets");
  if(one+two+three===9)grantAchievement("nineSecrets");
}
function grantClearAchievements(grade,cores){
  const stage=activeStage;
  grantAchievement(stage===1?"first":stage===2?"canyon":"city");
  if(grade==="S")grantAchievement(stage===1?"s1":stage===2?"s2":"cityS");
  if(stage===1&&player.falls===0)grantAchievement("zero1");
  if(stage===2&&player.falls===0)grantAchievement("zero2");
  if(cores===3)grantAchievement(stage===1?"cores1":stage===2?"cores2":"cityCores");
  if(stage===2&&guardian.defeated&&!bossDamagedThisRun)grantAchievement("untouched");
  if(stage===3&&cityBoss.defeated)grantAchievement("architect");
}
// ---------------------- Vertical secret ascent -----------------------
// A route is a single attempt per stage run. Checkpoints do NOT rearm it.
function failSecretTrial(trial){
  if(!trial||!trial.active||trial.failed||trial.completed)return;
  trial.active=false;
  trial.failed=true;
  trial.armed=false;
  trial.shots.length=0;
  announce("Desafio perdido","");
  playSfx("hurt");
}

function secretEnemyPosition(trial,bad){
  const t=trial.elapsed;
  if(bad.type==="moth")return {
    x:bad.baseX+Math.sin(t*2.5+bad.phase)*bad.patrol,
    y:bad.baseY+Math.sin(t*4.6+bad.phase)*19
  };
  if(bad.type==="drone")return {
    x:bad.baseX+Math.sin(t*1.9+bad.phase)*bad.patrol,
    y:bad.baseY+Math.sin(t*3+bad.phase)*11
  };
  if(bad.type==="dart")return {
    x:bad.baseX+Math.sin(t*3.1+bad.phase)*bad.patrol,
    y:bad.baseY+Math.sin(t*2+bad.phase)*14
  };
  if(bad.type==="orbiter")return {
    x:bad.baseX+Math.cos(t*2.7+bad.phase)*bad.patrol,
    y:bad.baseY+Math.sin(t*2.7+bad.phase)*bad.patrol
  };
  if(bad.type==="hunter")return {x:bad.x,y:bad.y};
  return {x:bad.baseX,y:bad.baseY};
}
function secretLaserFiring(trial,bad){
  return Math.sin(trial.elapsed*2.65+bad.phase)>.1;
}
function updateSecretTrialEnemies(trial,dt){
  for(const bad of trial.sentinels){
    if(bad.type==="hunter"){
      // This enemy slowly closes in, but has a capped pursuit speed.
      const tx=clamp(player.x,bad.baseX-130,bad.baseX+155);
      const ty=clamp(player.y,bad.baseY-115,bad.baseY+85);
      const dx=tx-bad.x,dy=ty-bad.y;
      const distanceToTarget=Math.hypot(dx,dy)||1;
      const amount=Math.min(56*dt,distanceToTarget);
      bad.x+=dx/distanceToTarget*amount;
      bad.y+=dy/distanceToTarget*amount;
    }
    if(bad.type==="laser"){
      if(!secretLaserFiring(trial,bad))continue;
      const half=bad.patrol/2;
      const closest=clamp(player.x,bad.baseX-half,bad.baseX+half);
      if(Math.hypot(player.x-closest,player.y-bad.baseY)<PLAYER_RADIUS+7){
        failSecretTrial(trial);return;
      }
      continue;
    }
    const {x,y}=secretEnemyPosition(trial,bad);
    const radius={moth:14,drone:17,dart:15,orbiter:14,mine:14,
      hunter:18,sentry:20}[bad.type]||17;
    if(Math.hypot(player.x-x,player.y-y)<PLAYER_RADIUS+radius){
      failSecretTrial(trial);return;
    }
  }
  const sentry=trial.sentinels.find(s=>s.type==="sentry");
  if(sentry){
    trial.shotTimer-=dt;
    if(trial.shotTimer<=0){
      const dx=player.x-sentry.baseX,dy=player.y-sentry.baseY;
      const distanceToPlayer=Math.hypot(dx,dy)||1;
      if(distanceToPlayer<380&&trial.shots.length<10){
        trial.shots.push({x:sentry.baseX,y:sentry.baseY,
          vx:dx/distanceToPlayer*245,vy:dy/distanceToPlayer*245,
          life:2.4});
        playSfx("boss-alert");
      }
      trial.shotTimer=1.85;
    }
  }
  for(const shot of trial.shots){
    const oldX=shot.x,oldY=shot.y;
    shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
    const vx=shot.x-oldX,vy=shot.y-oldY,length2=vx*vx+vy*vy;
    const amount=length2?
      clamp(((player.x-oldX)*vx+(player.y-oldY)*vy)/length2,0,1):0;
    if(Math.hypot(player.x-(oldX+vx*amount),
      player.y-(oldY+vy*amount))<PLAYER_RADIUS+9){
      failSecretTrial(trial);return;
    }
  }
  trial.shots=trial.shots.filter(shot=>shot.life>0).slice(-10);
}

function updateSecretTrials(dt){
  for(const trial of secretTrials){
    if(trial.completed||trial.failed)continue;
    const atStart=distance(player.x,player.y,trial.startX,trial.startY)<31;
    if(!trial.active){
      if(!atStart)trial.armed=true;
      if(!trial.armed||!atStart)continue;
      // Starting a platforming trial from a speedrunning sprint must be fair.
      trial.active=true;trial.armed=false;trial.elapsed=0;
      trial.shots.length=0;trial.shotTimer=1.35;
      player.vx=clamp(player.vx,-160,160);
      announce("DESAFIO: "+trial.name,trial.hint);
      playSfx("secret-start");
    }
    trial.elapsed+=dt;
    const left=trial.leftBound,right=trial.rightBound;
    if(trial.elapsed>=trial.limit
      ||player.y>trial.startY+94
      ||player.x<left||player.x>right){
      failSecretTrial(trial);
      continue;
    }
    updateSecretTrialEnemies(trial,dt);
    if(trial.failed)continue;
    if(distance(player.x,player.y,trial.targetX,trial.targetY)<30){
      trial.active=false;trial.completed=true;
      trial.shots.length=0;
      player.rings+=8;
      player.boost=Math.min(100,player.boost+20);
      emitParticles(trial.targetX,trial.targetY,"#bc9cff",26,165);
      playSfx("secret-win");
      announce("ROTA DESCOBERTA: "+trial.name,
        "Fragmento recuperado · +8 cristais · +20 boost");
      if(!debugUsedThisRun){
        recordCampaignSecret(activeStage,trial.id);
        const key="stage"+activeStage;
        if(!progress.secrets[key].includes(trial.id))
          progress.secrets[key].push(trial.id);
        const old=progress.secretTimes[key][trial.id];
        if(!old||trial.elapsed<old)progress.secretTimes[key][trial.id]=trial.elapsed;
        storeProgress();
        updateRouteAchievements();
      }
    }
  }
}
function interruptSecretTrials(){
  for(const trial of secretTrials)
    if(trial.active)failSecretTrial(trial);
}

function drawSecretBackdrop(){const trial=secretTrials.find(t=>t.active);if(trial)renderSecretBackdrop(ctx,trial,{cameraX,cameraY,VIEW_W,VIEW_H});}
function drawSecretEnemy(trial,bad){
  const {x,y}=secretEnemyPosition(trial,bad),t=trial.elapsed;
  ctx.save();ctx.translate(x,y);ctx.lineWidth=2.5;
  if(bad.type==="moth"){
    ctx.fillStyle="#bbf8ae";ctx.strokeStyle="#e3ffd2";
    for(const d of [-1,1]){
      ctx.beginPath();ctx.ellipse(d*13,Math.sin(t*15)*5,13,9,0,0,Math.PI*2);
      ctx.fill();ctx.stroke();
    }
    ctx.fillStyle="#263e38";ctx.beginPath();
    ctx.ellipse(0,0,6,13,0,0,Math.PI*2);ctx.fill();
  }else if(bad.type==="orbiter"){
    ctx.strokeStyle="#be9cff";ctx.fillStyle="#896aff";
    ctx.rotate(t*3);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,r=i%2?10:21;
      if(i===0){ctx.beginPath();ctx.moveTo(r,0);}
      else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
  }else if(bad.type==="dart"){
    ctx.fillStyle="#ffa55f";ctx.strokeStyle="#ffddb4";
    ctx.beginPath();ctx.moveTo(25,0);ctx.lineTo(-16,-12);
    ctx.lineTo(-8,0);ctx.lineTo(-16,12);ctx.closePath();ctx.fill();ctx.stroke();
  }else if(bad.type==="mine"){
    ctx.strokeStyle="#ffb092";ctx.beginPath();
    ctx.arc(0,0,25+Math.sin(t*7)*3,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#ea657e";
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      ctx.beginPath();ctx.arc(Math.cos(a)*13,Math.sin(a)*13,5,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle="#291633";ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fill();
  }else if(bad.type==="hunter"){
    ctx.strokeStyle="rgba(255,133,177,.5)";
    ctx.beginPath();ctx.arc(0,0,29,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#cf477e";ctx.beginPath();
    ctx.moveTo(0,-22);ctx.lineTo(21,0);ctx.lineTo(0,19);
    ctx.lineTo(-21,0);ctx.closePath();ctx.fill();
    ctx.fillStyle="#fcddf5";ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();
  }else if(bad.type==="laser"){
    const active=secretLaserFiring(trial,bad);
    ctx.strokeStyle=active?"#ff669b":"rgba(255,201,144,.58)";
    ctx.lineWidth=active?10:3;
    ctx.beginPath();ctx.moveTo(-bad.patrol/2,0);
    ctx.lineTo(bad.patrol/2,0);ctx.stroke();
    ctx.fillStyle="#ffba9b";
    ctx.fillRect(-bad.patrol/2-5,-11,11,22);
    ctx.fillRect(bad.patrol/2-5,-11,11,22);
  }else if(bad.type==="sentry"){
    ctx.fillStyle="#ab79e4";ctx.strokeStyle="#ffc9ed";
    ctx.fillRect(-18,-18,36,36);ctx.strokeRect(-18,-18,36,36);
    ctx.fillStyle="#94fff0";ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle="#ff9bcb";ctx.strokeStyle="#ffc9ed";
    ctx.beginPath();ctx.ellipse(0,0,19,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle="#25214a";ctx.fillRect(-6,-3,12,6);
    ctx.strokeStyle="#d6fffa";ctx.beginPath();
    ctx.moveTo(-30,-8);ctx.lineTo(-15,-1);
    ctx.moveTo(15,-1);ctx.lineTo(30,-8);ctx.stroke();
  }
  ctx.restore();
}
function drawSecretTrials(){
  for(const trial of secretTrials){
    if(trial.rightBound<cameraX-75||trial.leftBound>cameraX+VIEW_W+75)continue;
    ctx.save();if(trial.failed)ctx.globalAlpha=.30;
    if(trial.active){
      ctx.strokeStyle="rgba(128,255,229,.35)";ctx.lineWidth=2;
      ctx.setLineDash([6,9]);ctx.beginPath();
      trial.platforms.forEach((p,i)=>{
        if(i===0)ctx.moveTo(p.x,p.y-20);else ctx.lineTo(p.x,p.y-20);
      });
      ctx.stroke();ctx.setLineDash([]);
    }
    ctx.save();ctx.translate(trial.startX,trial.startY);
    ctx.strokeStyle=trial.completed?"#ffe29a":trial.failed?"#647b80":"#6dffe7";
    ctx.lineWidth=2.5;ctx.rotate(Math.PI/4);
    ctx.strokeRect(-13,-13,26,26);ctx.rotate(-Math.PI/4);
    ctx.fillStyle=trial.completed?"#ffe29a":"#baffef";
    ctx.beginPath();ctx.arc(0,0,5+Math.sin(visualTime*4)**2*2,0,Math.PI*2);ctx.fill();
    ctx.font="bold 11px system-ui";ctx.textAlign="center";
    ctx.fillText(trial.completed?"DESCOBERTO":trial.failed?"":"DESAFIO",0,-29);
    ctx.restore();
    if(!trial.failed&&!trial.completed){
      ctx.save();ctx.translate(trial.targetX,trial.targetY);ctx.rotate(visualTime*1.4);
      ctx.fillStyle="#b99aff";ctx.strokeStyle="#fff1b9";ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(13,0);
      ctx.lineTo(0,17);ctx.lineTo(-13,0);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.restore();
    }
    if(trial.active){
      for(const e of trial.sentinels)drawSecretEnemy(trial,e);
      for(const shot of trial.shots){
        ctx.fillStyle="#ff92ce";ctx.beginPath();
        ctx.arc(shot.x,shot.y,9,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#ffe1fa";ctx.lineWidth=2;ctx.stroke();
      }
      ctx.font="bold 13px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffe0a2";
      ctx.fillText(Math.max(0,trial.limit-trial.elapsed).toFixed(1)+"s",
        trial.targetX,trial.targetY-38);
    }
    ctx.restore();
  }
}

function refreshAchievementsView(){
  const unlocked=ACHIEVEMENTS.filter(a=>progress.achievements[a.id]).length;
  const total=ACHIEVEMENTS.length;
  const counter=document.querySelector("#achievementsCount");
  if(counter)counter.textContent=unlocked+"/"+total+" conquistas desbloqueadas";
  const summary=document.querySelector("#secretCollection");
  if(summary)summary.textContent="Rotas: Floresta "+
    progress.secrets.stage1.length+"/3 · Cânion "+
    progress.secrets.stage2.length+"/3 · Cidade "+
    progress.secrets.stage3.length+"/3";
  const list=document.querySelector("#achievementList");
  const routes=document.querySelector("#secretRouteList");
  if(routes)routes.innerHTML=[1,2,3].flatMap(stage=>
    SECRET_DEFS[stage].map(def=>{
      const earned=progress.secrets["stage"+stage].includes(def.id);
      const time=progress.secretTimes["stage"+stage][def.id];
      return '<div class="secret-route-entry'+(earned?' discovered':'')+'">'+
        '<strong>'+(earned?'✦ ':'◇ ')+def.name+'</strong>'+
        '<small>'+def.hint.toLowerCase()+'</small>'+
        '<small>Fase '+stage+' · '+(earned
          ?'Recorde '+(time?time.toFixed(2)+'s':'concluída')
          :'Ainda não descoberta')+'</small></div>';
    })
  ).join("");
  if(list)list.innerHTML=ACHIEVEMENTS.map(a=>{
    const unlocked=progress.achievements[a.id]===true;
    return '<div class="achievement-entry'+(unlocked?' achieved':' locked')+'">'+
      '<span class="achievement-symbol" aria-hidden="true">'+(unlocked?'✦':'◇')+'</span>'+
      '<div><strong>'+a.title+'</strong><small>'+a.description+'</small></div>'+
      '<span class="achievement-status">'+(unlocked?'CONCLUÍDA':'PENDENTE')+'</span></div>';
  }).join("");
}

function collectItems() {
  for (const ring of rings) {
    if (!ring.active) continue;
    if (distance(player.x, player.y, ring.x, ring.y) < PLAYER_RADIUS + ring.r) {
      ring.active = false;
      player.rings += 1;
      emitParticles(ring.x, ring.y, "#ffe089", 4, 70);
      if (pickupSoundCooldown === 0) {
        playSfx("crystal");
        pickupSoundCooldown = 0.075;
      }
      // Crystals grant score only.
    }
  }

  for (const core of memoryCores) {
    if (core.active && distance(player.x, player.y, core.x, core.y) < PLAYER_RADIUS + core.r) {
      core.active = false;
      player.cores += 1;
      recordCampaignCore(activeStage,memoryCores.indexOf(core));
      emitParticles(core.x,core.y,"#ffcb79",22,150);
      playSfx("checkpoint");
    }
  }
  for (const boostOrb of boostOrbs) {
    if (!boostOrb.active) continue;
    if (distance(player.x, player.y, boostOrb.x, boostOrb.y) < PLAYER_RADIUS + boostOrb.r) {
      boostOrb.active = false;
      player.boost = Math.min(100, player.boost + 55);
      emitParticles(boostOrb.x, boostOrb.y, "#61eefa", 16, 155);
      playSfx("orb");
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

function pulseState(gate, t = gameTime) {
  const phase = ((t + gate.phase) % gate.period + gate.period) % gate.period;
  return {active:phase < gate.live, warning:phase >= gate.period - .40};
}
function handlePulseGates() {
  for (const gate of pulseGates) {
    if (!pulseState(gate).active || Math.abs(gate.x-player.x)>55) continue;
    if (circleRect(player.x,player.y,PLAYER_RADIUS,gate)) {
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
      playSfx("spring");
      emitParticles(spring.x + spring.w / 2, spring.y, "#ffa9d0", 12, 135);
      player.onGround = false;
      shakeTime = 0.08;
    }
  }
}

function updateCheckpoints() {
  checkpoints.forEach((point, index) => {
    if (index > checkpointIndex && checkpointReached(point,player)) {
      checkpointIndex = index;
      point.active = true;
      emitParticles(point.x, point.y - 45, "#75ffcc", 20, 130);
      playSfx("checkpoint");
    }
  });
}
function damagePlayer(fall) {
 if(debugMode||(player.invulnerable>0&&!fall)||!gameStarted)return;
 if(airDash.active){airDash.active=false;airDash.time=0;}
 runDamageCount++;
 interruptSecretTrials();
 if(activeStage===2&&guardian.active&&!guardian.defeated)bossDamagedThisRun=true;
 if(fall)player.falls+=1;
 shakeTime=.22;
 triggerFluxFx("hurt");
 emitParticles(player.x,player.y,"#ff896d",13,155);
 playSfx("hurt");
 const result=calculateCrystalDamage(player.rings,{fall});
 player.rings=result.remaining;
 if(result.dead){
   showDeathScreen(fall,result.lost);
   return;
 }
 // Surviving a normal collision: lose substantial crystals and bounce away.
 player.vx=-player.facing*250;
 player.vy=-450;
 player.invulnerable=1.1;
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
  drawSecretBackdrop();
  drawForest();
  drawStageArrivalRunway();
  if(activeStage===2)drawChasms();
  if(activeStage===3){drawCityChasms();drawCityRiftGates();}
  if(activeStage===2)drawGuardianBackdrop();
  drawTracks();
  drawTunnels();
  drawPulseGates();
  drawSigns();
  drawObjects();
  drawCityDashCore();
  drawSentryShots();
  drawCityBoss();
  drawArchitectGroundRifts();
  drawCityExit();
  drawGuardian();
  drawGuardianVisuals();
  drawRiftPortal();
  drawMemoryCores();
  drawSecretTrials();
  drawFluxWaves();
  drawParticles();
  drawFluxGhosts();
  drawAirDashFX();
  drawPlayer();

  ctx.restore();
  if(stageArrival.active)drawStageArrivalOverlay();
  else drawHud();
}

function drawSky() {
  const grad = ctx.createLinearGradient(0, cameraY, 0, cameraY + VIEW_H);
  if(activeStage===3){
    grad.addColorStop(0,"#080f31");
    grad.addColorStop(.53,"#203063");
    grad.addColorStop(1,"#27335a");
  }else if(activeStage===2) {
    grad.addColorStop(0,"#170f33");
    grad.addColorStop(.53,"#2d2453");
    grad.addColorStop(1,"#132b4a");
  } else {
    grad.addColorStop(0,"#101c36");
    grad.addColorStop(.55,"#12344a");
    grad.addColorStop(1,"#153a38");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(cameraX, cameraY, VIEW_W, VIEW_H);

  ctx.fillStyle = "rgba(117, 230, 238, 0.08)";
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 330 - cameraX * 0.22) % (WORLD_W + 320);
    ctx.fillRect(x, 80 + (i % 5) * 34, 150, 2);
  }
}

function drawCityBackground(){
  renderCityBackground(ctx,{cameraX,VIEW_W,tracks});
  const area=STAGES[3].riftCorridor;
  const approach=cameraX+VIEW_W*.55;
  const mix=clamp((approach-(area.start-400))/700,0,1);
  if(mix>0){
    ctx.save();ctx.globalAlpha=mix;
    renderRiftCorridorBackground(ctx,{cameraX,cameraY,VIEW_W,VIEW_H,time:visualTime});
    ctx.restore();
  }
}
function drawBackground() {
  if(activeStage===3){drawCityBackground();return;}
  if(activeStage===2){drawCanyonBackground();return;}
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

function drawCanyonBackground() {
  const first=Math.floor(cameraX/340)-3;
  const last=Math.ceil((cameraX+VIEW_W)/340)+3;
  for(let i=first;i<=last;i++){
    const x=i*340+cameraX*.14;
    const h=105+(Math.abs(i)%5)*30;
    ctx.fillStyle=i%2?"#262047":"#302251";
    ctx.beginPath();ctx.moveTo(x-100,cameraY+VIEW_H);
    ctx.lineTo(x+20,cameraY+VIEW_H-h);
    ctx.lineTo(x+135,cameraY+VIEW_H);ctx.closePath();ctx.fill();
  }
  for(let i=Math.floor(cameraX/240)-3;i<Math.ceil((cameraX+VIEW_W)/240)+3;i++){
    const x=i*240+55,y=180+(Math.abs(i)%4)*30;
    ctx.fillStyle=i%2?"rgba(157,119,239,.18)":"rgba(110,240,238,.1)";
    ctx.beginPath();
    ctx.moveTo(x,y-55);ctx.lineTo(x+36,y);ctx.lineTo(x,y+55);ctx.lineTo(x-36,y);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(163,124,255,.26)";ctx.lineWidth=2;ctx.stroke();
  }
  for(let i=Math.floor(cameraX/165)-2;i<Math.ceil((cameraX+VIEW_W)/165)+2;i++){
    const x=i*165+50,gy=groundY(x);
    if(gy==null)continue;
    ctx.fillStyle="#392f64";ctx.fillRect(x-5,gy-43,10,42);
    ctx.fillStyle="#8e70e4";
    ctx.beginPath();ctx.moveTo(x-24,gy-34);ctx.lineTo(x,gy-81);
    ctx.lineTo(x+24,gy-34);ctx.closePath();ctx.fill();
  }
}

// Three luminous rift barriers span rooftops AND streets. Unlike a normal
// pit, these gates must be crossed while the aerial dash is actually active.
function cityRiftGates(){
  return STAGES[3].pits.map(([left,right])=>Math.round((left+right)/2));
}
function resolveCityRiftGates(){
  if(activeStage!==3||debugMode)return;
  for(const x of cityRiftGates()){
    const intersects=Math.abs(player.x-x)<PLAYER_RADIUS+9||
      (player.prevX<x&&player.x>=x)||(player.prevX>x&&player.x<=x);
    if(!intersects||airDash.active)continue;
    const fromLeft=player.prevX<=x;
    player.x=x+(fromLeft?-1:1)*(PLAYER_RADIUS+10);
    player.prevX=player.x;
    player.vx=0;
  }
}
function drawCityRiftGates(){
  if(activeStage!==3)return;
  for(const x of cityRiftGates()){
    if(x<cameraX-60||x>cameraX+VIEW_W+60)continue;
    const wave=Math.sin(visualTime*7+x*.004);
    ctx.save();
    ctx.globalAlpha=.74+.14*wave;
    ctx.fillStyle="rgba(116,73,205,.2)";
    ctx.fillRect(x-23,cameraY-100,46,VIEW_H+220);
    ctx.strokeStyle="#f2afff";ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(x,cameraY-100);
    ctx.lineTo(x,cameraY+VIEW_H+120);ctx.stroke();
    ctx.strokeStyle="#75fff1";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x-13,cameraY-100);
    ctx.lineTo(x-13,cameraY+VIEW_H+120);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+13,cameraY-100);
    ctx.lineTo(x+13,cameraY+VIEW_H+120);ctx.stroke();
    ctx.fillStyle="#fff2ce";ctx.font="bold 12px system-ui";
    ctx.textAlign="center";ctx.fillText("DASH",x,320);ctx.textAlign="left";
    ctx.restore();
  }
}
function drawCityChasms(){
 for(const [from,to] of STAGES[3].pits){
   if(to<cameraX-40||from>cameraX+VIEW_W+40)continue;
   ctx.fillStyle="#090e28";
   ctx.fillRect(from,403,to-from,290);
   ctx.strokeStyle="#ffb9a0";ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(from,518);ctx.lineTo(to,518);ctx.stroke();
   ctx.fillStyle="#ffe3be";ctx.font="bold 12px system-ui";
   ctx.fillText("DASH AÉREO",from+12,531);
 }
}

function drawChasms() {
  for(const [from,to] of STAGES[2].pits){
    if(to<cameraX-30||from>cameraX+VIEW_W+30)continue;
    ctx.fillStyle="rgba(7,8,29,.93)";
    ctx.fillRect(from,Math.max(365,cameraY+350),to-from,600);
    ctx.strokeStyle="#fd79ad";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(from,512);ctx.lineTo(to,512);ctx.stroke();
    ctx.fillStyle="#f7b6cb";ctx.font="bold 12px system-ui";
    ctx.fillText("ABISMO",from+Math.max(12,(to-from)/2-26),548);
  }
}

function drawForest(){if(activeStage!==1)return;renderForest(ctx,{cameraX,VIEW_W,groundY});}
function drawTracks() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const floor of tracks) {
    if (floor.x2 < cameraX - 120 || floor.x1 > cameraX + VIEW_W + 120) continue;
    if(floor.kind==="rift-phase"){
      const {solid,warning}=riftPlatformPhase(floor,gameTime);
      ctx.save();
      ctx.globalAlpha=solid?1:.22;
      ctx.strokeStyle=warning?"#ffd18e":"#be9bff";
      ctx.lineWidth=18;ctx.beginPath();
      ctx.moveTo(floor.x1,floor.y1);ctx.lineTo(floor.x2,floor.y2);ctx.stroke();
      ctx.strokeStyle=warning?"#ff986e":"#fff0fd";
      ctx.lineWidth=3;ctx.setLineDash([11,8]);
      ctx.beginPath();ctx.moveTo(floor.x1+3,floor.y1-7);
      ctx.lineTo(floor.x2-3,floor.y2-7);ctx.stroke();
      ctx.setLineDash([]);ctx.restore();continue;
    }
    if(floor.kind==="rift-elevator"){
      ctx.save();
      ctx.fillStyle="rgba(129,255,228,.15)";
      ctx.fillRect(floor.x1,floor.y1-13,floor.x2-floor.x1,13);
      ctx.strokeStyle="#aafbe9";ctx.lineWidth=17;
      ctx.beginPath();ctx.moveTo(floor.x1,floor.y1);ctx.lineTo(floor.x2,floor.y2);ctx.stroke();
      ctx.strokeStyle="#ffe6af";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(floor.x1+12,floor.y1-10);
      ctx.lineTo(floor.x2-12,floor.y2-10);ctx.stroke();
      ctx.restore();continue;
    }
    if(floor.secretId){
      const trial=secretTrials.find(t=>t.id===floor.secretId);
      const solid=secretPlatformSolid(floor);
      const palette={fixed:"#74f8ed",moving:"#ffda84",spring:"#b5ff83",
        phase:"#c6a3ff","belt-right":"#ffb77b","belt-left":"#ffb77b",
        crumble:"#ff8fa5"};
      ctx.save();
      ctx.globalAlpha=trial?.active&&!solid?.17:1;
      ctx.strokeStyle=trial?.failed?"#698287":palette[floor.behavior]||"#74f8ed";
      ctx.lineWidth=15;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(floor.x1,floor.y1);
      ctx.lineTo(floor.x2,floor.y2);ctx.stroke();
      ctx.strokeStyle="#1a374b";ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(floor.x1,floor.y1+4);
      ctx.lineTo(floor.x2,floor.y2+4);ctx.stroke();
      if(floor.behavior==="spring"){
        ctx.strokeStyle="#b7ffb8";ctx.lineWidth=2.5;
        for(let i=0;i<5;i++){
          const x=floor.x1+22+i*(floor.x2-floor.x1-45)/4;
          ctx.beginPath();ctx.moveTo(x-9,floor.y1-6);
          ctx.lineTo(x,floor.y1-16);ctx.lineTo(x+9,floor.y1-6);ctx.stroke();
        }
      }else if(floor.behavior.startsWith("belt")){
        ctx.fillStyle="#ffe6ac";
        for(let x=floor.x1+14;x<floor.x2-8;x+=24){
          const dir=floor.belt>0?1:-1;
          ctx.beginPath();ctx.moveTo(x-dir*6,floor.y1-5);
          ctx.lineTo(x+dir*4,floor.y1-9);
          ctx.lineTo(x-dir*6,floor.y1-13);ctx.closePath();ctx.fill();
        }
      }else if(floor.behavior==="phase"){
        ctx.strokeStyle="#e4cfff";ctx.lineWidth=1.5;ctx.setLineDash([5,6]);
        ctx.strokeRect(floor.x1+6,floor.y1-9,floor.x2-floor.x1-12,13);
        ctx.setLineDash([]);
      }else if(floor.behavior==="crumble"){
        ctx.strokeStyle="#fff0e5";ctx.lineWidth=1.8;
        for(let i=1;i<=3;i++){
          const x=floor.x1+(floor.x2-floor.x1)*i/4;
          ctx.beginPath();ctx.moveTo(x,floor.y1-7);
          ctx.lineTo(x-8,floor.y1+1);ctx.stroke();
        }
      }else if(floor.behavior==="moving"){
        ctx.fillStyle="#fff0bd";ctx.fillRect(floor.x1+8,floor.y1-9,10,5);
        ctx.fillRect(floor.x2-18,floor.y1-9,10,5);
      }
      ctx.restore();continue;
    }
    ctx.strokeStyle = activeStage===3?
      floor.kind==="city-roof"?"#f0b1fe":
      floor.kind==="moving"?"#fff2a7":"#a0eafb":
      activeStage===2
      ? floor.kind==="moving" ? "#ffcf82" : (floor.kind==="secret"||floor.kind==="secret-moving") ? "#76ffeb" : floor.kind==="platform" ? "#bb91ff" : floor.kind==="finish" ? "#a2f5ff" : "#a47df7"
      : (floor.kind==="secret"||floor.kind==="secret-moving") ? "#9bfff0" : floor.kind==="boost" ? "#f6ac43" : floor.kind==="finale" ? "#b785ef" : "#38dcd0";
    ctx.lineWidth = 19;
    ctx.beginPath();
    ctx.moveTo(floor.x1, floor.y1);
    ctx.lineTo(floor.x2, floor.y2);
    ctx.stroke();
    ctx.strokeStyle = activeStage===3?"#303c67":activeStage===2 ? "#43366b" : "#14444d";
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
    // Keep the vertical secret ascent readable instead of covering it with
    // old rectangular hint boards.
    if(secretTrials.some(t=>Math.abs(t.startX-sign.x)<215))continue;
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
function drawPulseGates() {
  for (const gate of pulseGates) {
    if (gate.x < cameraX-60 || gate.x > cameraX+VIEW_W+60) continue;
    const state = pulseState(gate);
    ctx.fillStyle="#244658";
    roundRect(gate.x-10,gate.y-10,38,15,4);ctx.fill();
    roundRect(gate.x-10,gate.y+gate.h-5,38,15,4);ctx.fill();
    if (state.active || state.warning) {
      ctx.fillStyle = state.active ? "rgba(255,82,126,.23)" : "rgba(248,187,94,.16)";
      ctx.fillRect(gate.x-11,gate.y,40,gate.h);
      ctx.strokeStyle=state.active?"#ff527e":"#ffd17c";
      ctx.lineWidth=state.active?7:3;
      ctx.beginPath();ctx.moveTo(gate.x+9,gate.y);ctx.lineTo(gate.x+9,gate.y+gate.h);ctx.stroke();
    } else {
      ctx.fillStyle="#5ef8da";ctx.fillRect(gate.x+4,gate.y+gate.h/2-3,10,6);
    }
    ctx.font="bold 11px system-ui";
    ctx.fillStyle=state.active?"#ffcbd5":"#b5f5eb";
    ctx.fillText(state.active?"PULSO":"LIVRE",gate.x-18,gate.y-18);
  }
}
function drawMemoryCores() {
  for (const core of memoryCores) {
    if (!core.active || core.x < cameraX-60 || core.x > cameraX+VIEW_W+60) continue;
    ctx.save();ctx.translate(core.x,core.y+Math.sin(visualTime*5+core.id)*3);
    ctx.rotate(visualTime*.6);
    ctx.fillStyle="#a86ff6";ctx.strokeStyle="#ffdf9a";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(18,0);ctx.lineTo(0,18);ctx.lineTo(-18,0);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.fillStyle="#fff3ce";ctx.fillRect(-3,-3,6,6);ctx.restore();
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

  for(const ring of rings){
    if(ring.active)renderCrystal(ctx,ring,visualTime);
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
    if(["city-drone","city-hunter","city-turret"].includes(bad.type)){
      const isDrone=bad.type==="city-drone",isHunter=bad.type==="city-hunter";
      ctx.fillStyle=isDrone?"#ffbd7a":isHunter?"#f079af":"#a4b5f7";
      ctx.strokeStyle="#f8e4ff";ctx.lineWidth=2.4;
      ctx.beginPath();
      if(isDrone){
        ctx.ellipse(bad.x,bad.y-bad.h*.6,26,17,0,0,Math.PI*2);
      }else{
        ctx.rect(bad.x-bad.w/2,bad.y-bad.h,bad.w,bad.h);
      }
      ctx.fill();ctx.stroke();
      ctx.fillStyle="#15233d";
      ctx.fillRect(bad.x-12,bad.y-bad.h*.72,24,9);
      ctx.fillStyle="#95fff0";
      ctx.fillRect(bad.x-9,bad.y-bad.h*.7,18,4);
      if(isDrone){
        ctx.strokeStyle="#fff4bc";ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(bad.x-37,bad.y-22);
        ctx.lineTo(bad.x-23,bad.y-18);
        ctx.moveTo(bad.x+23,bad.y-18);
        ctx.lineTo(bad.x+37,bad.y-22);ctx.stroke();
      }
    } else if(bad.type==="drone"){
      const bob=Math.sin(visualTime*15+bad.baseX)*3;
      ctx.fillStyle="rgba(214,137,255,.24)";
      ctx.beginPath();ctx.ellipse(bad.x,bad.y-12,31,26,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#cf94ff";
      roundRect(bad.x-23,bad.y-bad.h+bob,46,bad.h,11);ctx.fill();
      ctx.fillStyle="#22183a";ctx.fillRect(bad.x-10,bad.y-17+bob,20,6);
      ctx.fillStyle="#6dfff4";ctx.fillRect(bad.x-6,bad.y-16+bob,12,3);
      ctx.strokeStyle="#7affef";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(bad.x-34,bad.y-25+bob);ctx.lineTo(bad.x-20,bad.y-22+bob);
      ctx.moveTo(bad.x+20,bad.y-22+bob);ctx.lineTo(bad.x+34,bad.y-25+bob);ctx.stroke();
    } else if(bad.type==="sentry"){
      ctx.fillStyle="#6b536f";
      roundRect(bad.x-bad.w/2,bad.y-bad.h,bad.w,bad.h,5);ctx.fill();
      ctx.fillStyle="#d5b0ff";
      roundRect(bad.x-bad.w/2+5,bad.y-bad.h+5,bad.w-10,bad.h-12,4);ctx.fill();
      ctx.fillStyle="#221438";ctx.fillRect(bad.x-14,bad.y-bad.h+17,28,9);
      ctx.fillStyle=bad.shotTimer<.55?"#ffe091":"#ff6e99";
      ctx.fillRect(bad.x-9,bad.y-bad.h+19,18,4);
      if(bad.shotTimer<.55){
        ctx.strokeStyle="#ffe5b4";ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(bad.x,bad.y-24,25,0,Math.PI*2);ctx.stroke();
      }
      ctx.strokeStyle="#ffe2a1";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(bad.x-bad.w/2,bad.y-8);ctx.lineTo(bad.x+bad.w/2,bad.y-8);ctx.stroke();
    } else {
      ctx.fillStyle=bad.type==="walker"?"#f1a05e":"#ff805c";
      roundRect(bad.x-bad.w/2,bad.y-bad.h,bad.w,bad.h,8);ctx.fill();
      ctx.fillStyle="#260d09";
      ctx.fillRect(bad.x-11,bad.y-18,6,5);ctx.fillRect(bad.x+5,bad.y-18,6,5);
    }
  }

  // The simple GO marker belongs only to the tutorial stage.
  if(activeStage===1){
    ctx.fillStyle="#ffffff";
    roundRect(goal.x,goal.y,goal.w,goal.h,6);ctx.fill();
    ctx.fillStyle="#ff5b8b";
    ctx.fillRect(goal.x+9,goal.y+8,32,20);
    ctx.fillStyle="#071215";ctx.font="bold 13px Inter, sans-serif";
    ctx.fillText("GO",goal.x+14,goal.y+23);
  }
}

// Flux has a unique vector silhouette: white helmet, cyan visor, orange
// scarf, twin amber boots and a glowing cyan core. Poses follow actual physics.
// Player visual effects — independent of speed, collision and camera maths.
function resetFluxFx() {
  fluxFx.ghosts.length=0;fluxFx.waves.length=0;
  Object.assign(fluxFx,{stepTimer:0,ghostTimer:0,sparkTimer:0,run:0,
    air:0,boost:0,landing:0,takeoff:0,turn:0,hit:0,slide:0,
    pose:"idle",previousFacing:player.facing});
}
function fluxWave(x,y,color,radius=36,flatten=.42) {
  if(fluxFx.waves.length>=FLUX_WAVE_LIMIT)fluxFx.waves.shift();
  fluxFx.waves.push({x,y,color,radius,flatten,life:.34,maxLife:.34});
}
function triggerFluxFx(kind,impact=0) {
  if(kind==="jump") {
    fluxFx.takeoff=1;
    fluxWave(player.x,player.y+PLAYER_RADIUS-3,"#89fff1",33);
  }else if(kind==="land"){
    fluxFx.landing=clamp(impact/850,.35,1);
    fluxWave(player.x,player.y+PLAYER_RADIUS-3,
      impact>490?"#ffdb92":"#8bfff0",48+Math.min(impact*.04,26));
    if(impact>410)emitParticles(player.x,player.y+16,"#f8e3b9",6,105);
  }else if(kind==="boost"){
    fluxFx.boost=1;
    fluxWave(player.x,player.y,"#7cfff9",44,.9);
  }else if(kind==="slide"){
    fluxFx.slide=1;
    fluxWave(player.x,player.y+10,"#ffd48a",25,.22);
  }else if(kind==="hurt"){
    fluxFx.hit=1;
    fluxWave(player.x,player.y,"#ff96b5",45,1);
  }
}
function updateFluxFx(dt){
  const speed=Math.abs(player.vx),ease=1-Math.exp(-15*dt);
  fluxFx.run+=( (player.onGround&&speed>60?clamp(speed/480,0,1):0)-fluxFx.run)*ease;
  fluxFx.air+=(Number(!player.onGround)-fluxFx.air)*ease;
  fluxFx.slide+=(Number(player.sliding)-fluxFx.slide)*(1-Math.exp(-22*dt));
  fluxFx.boost+=(Number(Boolean(player.boosting))-fluxFx.boost)*(1-Math.exp(-12*dt));
  fluxFx.landing=Math.max(0,fluxFx.landing-dt*2.7);
  fluxFx.takeoff=Math.max(0,fluxFx.takeoff-dt*4.1);
  fluxFx.turn=Math.max(0,fluxFx.turn-dt*5);
  fluxFx.hit=Math.max(0,fluxFx.hit-dt*2.6);
  if(fluxFx.previousFacing!==player.facing&&speed>115){
    fluxFx.turn=1;
    if(player.onGround)emitParticles(player.x,player.y+14,"#b9f7f0",4,65);
  }
  fluxFx.previousFacing=player.facing;
  fluxFx.pose=player.sliding?"slide":!player.onGround?
    player.vy<-90?"jump":player.vy>110?"fall":"float":
    speed>85?"run":"idle";
  for(const w of fluxFx.waves)w.life-=dt;
  fluxFx.waves=fluxFx.waves.filter(w=>w.life>0).slice(-FLUX_WAVE_LIMIT);
  for(const ghost of fluxFx.ghosts)ghost.life-=dt;
  fluxFx.ghosts=fluxFx.ghosts.filter(g=>g.life>0).slice(-FLUX_GHOST_LIMIT);
  if(speed>415||player.boosting){
    fluxFx.ghostTimer-=dt;
    if(fluxFx.ghostTimer<=0){
      fluxFx.ghosts.push({x:player.x,y:player.y,facing:player.facing,
        slide:player.sliding,boost:Boolean(player.boosting),life:.25,maxLife:.25});
      if(fluxFx.ghosts.length>FLUX_GHOST_LIMIT)fluxFx.ghosts.shift();
      fluxFx.ghostTimer=player.boosting?.045:.075;
    }
  }else fluxFx.ghostTimer=0;
  fluxFx.stepTimer-=dt;
  if(player.onGround&&!player.sliding&&speed>160&&fluxFx.stepTimer<=0){
    emitParticles(player.x-player.facing*9,player.y+PLAYER_RADIUS-4,
      activeStage===2?"#baafea":"#9cdec9",2,54);
    fluxFx.stepTimer=clamp(75/speed,.09,.29);
  }
  fluxFx.sparkTimer-=dt;
  if(player.sliding&&speed>245&&fluxFx.sparkTimer<=0){
    emitParticles(player.x-player.facing*16,player.y+PLAYER_RADIUS-6,
      "#ffc778",3,80);
    fluxFx.sparkTimer=.075;
  }else if(player.boosting&&fluxFx.sparkTimer<=0){
    emitParticles(player.x-player.facing*15,player.y+5,"#79ffff",2,75);
    fluxFx.sparkTimer=.065;
  }
}
function drawFluxWaves(){
  for(const wave of fluxFx.waves){
    if(wave.x<cameraX-90||wave.x>cameraX+VIEW_W+90)continue;
    const age=1-wave.life/wave.maxLife;
    ctx.save();
    ctx.globalAlpha=(1-age)*.65;
    ctx.strokeStyle=wave.color;ctx.lineWidth=3*(1-age)+.5;
    ctx.beginPath();
    ctx.ellipse(wave.x,wave.y,wave.radius*(.42+age*.95),
      wave.radius*wave.flatten*(.42+age*.95),0,0,Math.PI*2);
    ctx.stroke();ctx.restore();
  }
}
function drawFluxGhosts(){
  for(const g of fluxFx.ghosts){
    if(g.x<cameraX-75||g.x>cameraX+VIEW_W+75)continue;
    const life=clamp(g.life/g.maxLife,0,1);
    ctx.save();
    ctx.globalAlpha=life*life*(g.boost?.34:.20);
    ctx.translate(g.x,g.y);ctx.scale(g.facing,1);
    ctx.fillStyle=g.boost?"#70fff8":"#b8edf1";
    ctx.beginPath();ctx.ellipse(0,g.slide?0:-3,g.slide?24:17,
      g.slide?8:18,-.12,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#b5ffff";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-17,-7);ctx.lineTo(-34,-6);ctx.stroke();
    ctx.restore();
  }
}

function drawFluxBody(actor,fx,clock){
  const moving=Math.abs(actor.vx)>40;
  const airborne=!actor.onGround;
  const fast=clamp(Math.abs(actor.vx)/SLIDE_DOWNHILL_CAP,0,1);

  ctx.save();
  ctx.translate(actor.x, actor.y);
  ctx.scale(actor.facing, 1);
  if (actor.invulnerable > 0 && Math.floor(clock * 12) % 2 === 0) {
    ctx.globalAlpha = 0.42;
  }

  // Ground shadow, engine glow and momentum streaks.
  ctx.fillStyle = actor.boosting ? "rgba(71,242,255,.44)" : "rgba(64,209,202,.20)";
  ctx.beginPath();
  ctx.ellipse(-9 - fast * 7, actor.sliding ? -2 : 3,
    25 + fast * 20, actor.sliding ? 8 : 18, 0, 0, Math.PI * 2);
  ctx.fill();
  if (actor.boosting || fx.boost>.1) {
    ctx.strokeStyle = "rgba(94,243,250,.8)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-21 - i * 6, -10 + i * 10);
      ctx.lineTo(-39 - fast * 20 - i * 7, -10 + i * 10);
      ctx.stroke();
    }
  }

  if (actor.sliding) {
    // Collider center remains at ground - PLAYER_RADIUS. The sprite bounds
    // stay within [-8,+7] of that center, above the 19px ground stroke.
    const incline=actor.ground?trackSlope(actor.ground):0;
    ctx.rotate(actor.facing*Math.atan(incline));
    ctx.translate(0,-3);
    const flick=Math.sin(clock*14)*1.3;
    ctx.fillStyle="rgba(255,183,95,.18)";
    ctx.beginPath();ctx.ellipse(-7,-1,25,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#f8b85a";ctx.beginPath();
    ctx.moveTo(-11,-4);ctx.lineTo(-30-fast*10,-5+flick);
    ctx.lineTo(-22,3);ctx.closePath();ctx.fill();
    ctx.fillStyle="#0d404e";ctx.beginPath();
    ctx.ellipse(1,0,21,7,-.06,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#e9fbf8";ctx.beginPath();
    ctx.ellipse(9,-1,12,6,-.1,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#128e9b";ctx.beginPath();
    ctx.ellipse(14,-1,6,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#85fff0";ctx.fillRect(15,-3,3,2);
    ctx.fillStyle="#f9ba61";roundRect(-23,4,46,3,1.5);ctx.fill();
  } else {
    const stride = moving && !airborne ? Math.sin(actor.animationPhase) : 0;
    const swing = Math.cos(actor.animationPhase);
    const bounce = airborne ? Math.sin(clock * 7) * 1.5 : moving ? Math.abs(stride) * -1.6 : Math.sin(clock * 2.5) * 1.2;
    const legFront = airborne ? -3 : stride * 6;
    const legBack = airborne ? 5 : -stride * 6;

    ctx.rotate((airborne ? clamp(actor.vy/2100,-.29,.29) : fast*.11)
      + fx.turn*.08);
    if (!actor.sliding) ctx.scale(1+fx.landing*.055-fx.takeoff*.035,
      1-fx.landing*.15+fx.takeoff*.11);

    // Scarf reacts to motion and gives Flux a recognizable profile.
    ctx.fillStyle = "#ffba5e";
    ctx.beginPath();
    ctx.moveTo(-11, -7 + bounce);
    ctx.lineTo(-25 - fast * 15, -13 + Math.sin(clock * 12) * 3);
    ctx.lineTo(-19 - fast * 9, 0);
    ctx.lineTo(-11, 0 + bounce);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffbd65";
    ctx.beginPath();
    ctx.ellipse(-8 + legBack, 15 + bounce, 10, 5, -0.18, 0, Math.PI * 2);
    ctx.ellipse(9 + legFront, 15 + bounce, 11, 5, 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Arms alternate with the footfall rhythm and tuck during jumps.
    ctx.strokeStyle="#43788a";ctx.lineWidth=6;ctx.lineCap="round";
    const armFront=airborne?(actor.vy<0?-7:6):-swing*7*fx.run;
    const armBack=airborne?(actor.vy<0?8:-6):swing*7*fx.run;
    ctx.beginPath();ctx.moveTo(-7,0+bounce);
    ctx.lineTo(-13+armBack,7+bounce);ctx.stroke();
    ctx.beginPath();ctx.moveTo(7,0+bounce);
    ctx.lineTo(12+armFront,6+bounce);ctx.stroke();
    ctx.fillStyle="#c2fef7";ctx.beginPath();
    ctx.arc(12+armFront,6+bounce,3,0,Math.PI*2);
    ctx.arc(-13+armBack,7+bounce,3,0,Math.PI*2);ctx.fill();

    ctx.fillStyle = "#124955";
    ctx.beginPath();
    ctx.ellipse(-2, 5 + bounce, 13, 14, -0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#52ebe1";
    ctx.beginPath();
    ctx.arc(3, 6 + bounce, 6, 0, Math.PI * 2);
    ctx.fill();

    // Helmet and aerodynamic crest.
    ctx.fillStyle = "#f2fffd";
    ctx.beginPath();
    ctx.ellipse(0, -5 + bounce, 17, 15, -0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#55d8dc";
    ctx.beginPath();
    ctx.moveTo(-12, -17 + bounce);
    ctx.lineTo(-16, -24 + bounce);
    ctx.lineTo(0, -19 + bounce);
    ctx.lineTo(7, -18 + bounce);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#092b3b";
    ctx.beginPath();
    ctx.ellipse(7, -6 + bounce, 10, 6, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#73fff0";
    if(clock%4.8>4.67)ctx.fillRect(7,-8+bounce,7,1.5);
    else{ctx.beginPath();ctx.ellipse(9,-8+bounce,4,2,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle = "#f0c06c";
    ctx.fillRect(12, -1 + bounce, 6, 2);
  }
  if(fx.hit>.01){
    ctx.strokeStyle="rgba(255,142,176,"+(fx.hit*.72)+")";
    ctx.lineWidth=2.5;ctx.beginPath();
    ctx.arc(0,0,22+fx.hit*12,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function drawPlayer() {
  const moving = Math.abs(player.vx) > 40;
  const airborne = !player.onGround;
  const fast = clamp(Math.abs(player.vx) / SLIDE_DOWNHILL_CAP, 0, 1);
  for (const dot of player.trail) {
    ctx.globalAlpha = clamp(dot.life / 0.24, 0, 0.65);
    ctx.fillStyle = "#59f4e6";
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 16 * dot.life / 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawFluxBody(player,fluxFx,visualTime);
}
function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0).slice(-180);
}

function emitParticles(x, y, color, count, speed = 95) {
  const room = Math.max(0, 180 - particles.length);
  for (let i = 0; i < Math.min(room, count); i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = speed * (0.25 + Math.random() * 0.75);
    const life = 0.22 + Math.random() * 0.36;
    particles.push({
      x, y, vx: Math.cos(angle) * magnitude, vy: Math.sin(angle) * magnitude - 20,
      gravity: 100 + Math.random() * 90, size: 1.8 + Math.random() * 3.2,
      color, life, maxLife: life
    });
  }
}

function drawParticles() {
  for (const p of particles) {
    if (p.x < cameraX - 40 || p.x > cameraX + VIEW_W + 40) continue;
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fill();
  }
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
  ctx.fillText(player.downhillSliding ? "Slide + impulso" : player.sliding ? "Deslizando" : "Boost", 136, 47);

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
  ctx.fillText(section ? section.title : (activeStage===3?"CIDADE DAS FENDAS":activeStage===2?"CÂNION PRISMA":"PRIMEIRO IMPULSO"),335,54);
  ctx.fillText(Math.round(progress * 100) + '%', 704, 54);
  ctx.fillStyle="#f9cb83";ctx.font="bold 13px system-ui";ctx.fillText("Núcleos "+player.cores+"/3",335,80);
  if(activeStage>=2){ctx.fillStyle="#ffa2be";ctx.fillText("Quedas "+player.falls,610,80);}
  ctx.fillStyle="#baffed";ctx.font="bold 12px system-ui";
  ctx.fillText("Rotas secretas "+secretTrials.filter(t=>t.completed).length+"/3",335,99);
  const timedRoute=secretTrials.find(t=>t.active);
  if(timedRoute){
    ctx.fillStyle="#ffdd9a";
    ctx.fillText("DESAFIO "+Math.max(0,timedRoute.limit-timedRoute.elapsed).toFixed(1)+"s",530,99);
  }
  if(notification.timer>0){
    ctx.save();ctx.globalAlpha=Math.min(1,notification.timer/.4);
    ctx.fillStyle="rgba(13,24,46,.92)";
    roundRect(240,notification.subtitle?443:452,480,notification.subtitle?67:45,10);ctx.fill();
    ctx.strokeStyle="#8bffed";ctx.lineWidth=2;ctx.stroke();
    ctx.textAlign="center";
    ctx.fillStyle="#c5fff5";ctx.font="bold 17px system-ui";
    ctx.fillText(notification.title,VIEW_W/2,notification.subtitle?468:481);
    ctx.fillStyle="#ffe0a5";ctx.font="12px system-ui";
    if(notification.subtitle)ctx.fillText(notification.subtitle,VIEW_W/2,490);
    ctx.textAlign="left";ctx.restore();
  }
  if(debugMode){
    ctx.fillStyle="#ffd79d";ctx.font="bold 12px system-ui";
    ctx.fillText("DEBUG: BOOST ∞ · VOO · INVENCÍVEL",20,119);
    ctx.fillText("F3: alternar · B: ir ao chefe",20,135);
  }
  if(activeStage===3&&cityBoss.active&&!cityBoss.defeated){
    ctx.fillStyle="rgba(14,8,39,.87)";roundRect(310,108,355,72,9);ctx.fill();
    ctx.fillStyle="#f4d6ff";ctx.font="bold 15px system-ui";
    ctx.fillText("ARQUITETO DO VAZIO",326,130);
    ctx.fillStyle="#37254c";ctx.fillRect(326,138,320,12);
    ctx.fillStyle="#f7b7df";ctx.fillRect(326,138,320*cityBoss.hp/4,12);
    ctx.font="12px system-ui";ctx.fillStyle="#fff2b5";
    ctx.fillText(cityBoss.state==="exposed"?"NÚCLEO ABERTO · USE O DASH":
      (cityBoss.hp<=2?"CUIDADO COM AS FENDAS DO CHÃO":"DESVIE DOS PROJÉTEIS"),326,168);
  }
  if(activeStage===3&&dashUnlocked()){
    ctx.fillStyle="#fff0b4";ctx.font="bold 12px system-ui";
    ctx.fillText("DASH AÉREO: "+(airDash.available?"PRONTO":"RECARREGUE NO CHÃO"),
      335,cityBoss.active&&!cityBoss.defeated?193:121);
  }
  if(activeStage===2&&guardian.active&&!guardian.defeated){
    ctx.fillStyle="rgba(15,8,35,.86)";roundRect(310,102,355,68,9);ctx.fill();
    ctx.fillStyle="#e7ceff";ctx.font="bold 15px system-ui";
    ctx.fillText("GUARDIÃO DO PRISMA",325,123);
    ctx.fillStyle="#35234e";ctx.fillRect(325,131,322,12);
    ctx.fillStyle="#bc93ff";ctx.fillRect(325,131,322*guardian.hp/guardian.maxHp,12);
    ctx.font="12px system-ui";ctx.fillStyle="#ffe3ac";
    ctx.fillText(guardianHint(),325,161);
  }
  if(activeStage===3&&cityBoss.defeated&&player.x>=cityBoss.arenaLeft){
    ctx.fillStyle="#afffea";ctx.font="bold 14px system-ui";
    ctx.fillText("O ARQUITETO CAIU · PORTAL FINAL LIBERADO",329,111);
  }
  if(activeStage===2&&guardian.defeated&&player.x>=guardian.arenaLeft){
    ctx.fillStyle="#adffd8";ctx.font="bold 15px system-ui";
    ctx.fillText(riftPortal.open?"PORTAL DA FENDA ABERTO · ENTRE NA FENDA":
      "PORTAL DA FENDA SE MATERIALIZANDO...",329,115);
  }
  drawGuardianCinematic();
  drawCityBossCinematic();
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

// All sound effects are synthesized locally using Web Audio: no downloaded assets.
// The context is only created after a click/key/pointer gesture.
function unlockAudio() {
  if (!soundEnabled || audioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  try {
    audioContext = new AudioCtor();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    initMusic();
  } catch (_) {
    audioContext = null;
  }
}

function playSfx(kind) {
  if (!soundEnabled || effectiveAudioGain("effects")===0 || !audioContext || audioContext.state !== "running") return;
  const sounds = {
    "ui-select": [390,660,.075,"sine",.025],
    "ui-confirm": [570,920,.135,"triangle",.036],
    "ui-back": [330,190,.09,"sine",.025],
    "cin-flower": [560,930,.32,"sine",.031],
    "cin-rupture": [92,340,1.18,"sawtooth",.037],
    "cin-ominous": [145,65,.95,"triangle",.054],
    "cin-chase": [360,750,.42,"triangle",.041],
    "air-dash": [265,1160,.26,"sawtooth",.038],
    "dash-unlock": [390,1580,.8,"triangle",.054],
    jump:       [440, 680, 0.16, "sine", 0.038],
    land:       [125, 65, 0.095, "triangle", 0.024],
    crystal:    [850, 1260, 0.12, "sine", 0.023],
    orb:        [430, 920, 0.26, "sine", 0.058],
    boost:      [170, 425, 0.28, "sawtooth", 0.028],
    slide:      [230, 105, 0.17, "triangle", 0.026],
    checkpoint: [500, 840, 0.35, "sine", 0.052],
    gate:       [160, 60, 0.25, "sawtooth", 0.048],
    hit:        [270, 95, 0.12, "square", 0.023],
    spring:     [280, 750, 0.22, "sine", 0.046],
    "secret-start": [470, 680, .25, "triangle", .025],
    "secret-win": [550, 1280, .48, "sine", .043],
    achievement: [660, 1100, .45, "sine", .04],
    "boss-alert": [220, 410, 0.29, "triangle", 0.031],
    "boss-enter": [105, 385, 0.95, "sawtooth", 0.026],
    "boss-collapse": [625, 75, 1.45, "sawtooth", 0.047],
    "boss-crack": [750, 135, 0.48, "sawtooth", 0.036],
    "portal-open": [160, 925, 1.18, "sine", 0.052],
    "portal-enter": [760, 1320, 0.53, "triangle", 0.047],
    "boss-hit": [600, 140, 0.34, "sawtooth", 0.043],
    "boss-win": [310, 1050, 0.7, "sine", 0.055],
    hurt:       [270, 115, 0.24, "triangle", 0.045],
    finish:     [530, 1060, 0.65, "sine", 0.06],
  };
  const config = sounds[kind];
  if (!config) return;
  try {
    const [start, end, duration, waveform, volume] = config;
    const gain=volume*effectiveAudioGain("effects");
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0001,gain), now + 0.014);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  } catch (_) {
    // Audio is optional; never let a device's sound support interrupt physics.
  }
}

function syncSoundButton() {
  if (!soundToggle) return;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.textContent = soundEnabled ? "🔊 Som ligado" : "🔇 Som desligado";
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem("velocity-rift-sound", soundEnabled ? "on" : "off"); } catch (_) {}
  if (soundEnabled) unlockAudio();
  syncSoundButton();
  syncMusic();
  refreshAudioSettings();
}
if (soundToggle) soundToggle.addEventListener("click", toggleSound);
syncSoundButton();

// Neon Canopy: an original 108 BPM synthesized electronic soundtrack.
// Lead, bass, harmony and percussive tones change subtly across stage sectors.
const MUSIC_STEP_SECONDS = 60 / 108 / 4; // Neon Canopy: 108 BPM
const PRISM_STEP_SECONDS = 60 / 126 / 4; // Ecos do Prisma: 126 BPM
const GUARDIAN_STEP_SECONDS = 60 / 142 / 4; // Ruptura do Prisma: 142 BPM
const MUSIC_MELODY=[0,null,3,null,7,null,10,7,5,null,3,0,null,3,7,null,
  0,3,5,null,7,null,10,12,10,null,7,5,3,null,2,null];
const MUSIC_BASS=[0,0,7,0,5,5,3,7];
// Supports every one of Prism Canyon's nine sectors, including the finale.
const MUSIC_SECTOR_SHIFTS=[0,0,3,5,7,10,12,14,17];
const MUSIC_CHORDS=[[0,3,7],[5,8,12],[7,10,14],[3,7,10]];
const midiToHz = midi => 440*Math.pow(2,(midi-69)/12);

// "Ecos do Prisma" is a separate composition, not a transposed Neon Canopy.
// D Phrygian colour, four-bar harmonic cycle and asymmetrical syncopation.
// Entries are semitone offsets; null means a deliberate rhythmic rest.
const PRISM_LEAD=[
  null,0,null,1, 7,null,5,null, 3,1,null,-2, 0,null,7,null,
  null,0,1,null, 10,7,null,5, 3,null,1,0, null,-2,1,null,
  0,null,3,1, null,7,8,null, 7,5,null,3, 1,null,0,null,
  null,12,10,null, 8,7,null,5, 3,1,0,null, -2,null,0,null
];
const PRISM_BASS_PATTERN=[0,null,null,12, null,0,7,null,
  0,null,12,null, 3,null,7,null];
const PRISM_ROOTS=[38,39,36,41]; // D, E♭, C, F — independent chord progression.
const PRISM_SECTION_LIFT=[0,0,0,2,2,3,3,5,5];
const PRISM_KICKS=new Set([0,6,8,11,14]);
const PRISM_HATS=new Set([2,5,7,10,13,15]);

function initMusic(){
  if(!audioContext || musicBus)return;
  try{musicBus=audioContext.createGain();musicBus.gain.value=0;musicBus.connect(audioContext.destination)}
  catch(_){musicBus=null}
}
function syncMusic(resetSchedule=true){
  if(!musicBus||!audioContext)return;
  const level=cinematic.active?.115*effectiveAudioGain("music"):
    gameStarted&&!paused&&!gameCleared?
      (activeStage===3?.13:activeStage===2?.13:.14)*effectiveAudioGain("music"):0;
  const now=audioContext.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setTargetAtTime(level,now,.055);
  if(level>0&&resetSchedule)nextMusicNote=now+.05;
}
function synthMusic(hz,at,duration,level,type="sine"){
  if(!musicBus||!audioContext||![hz,at,duration,level].every(Number.isFinite)
    ||hz<=0||duration<=0||level<=0)return;
  const osc=audioContext.createOscillator(),volume=audioContext.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(hz,at);
  volume.gain.setValueAtTime(.0001,at);
  volume.gain.linearRampToValueAtTime(level,at+.008);
  volume.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(volume);volume.connect(musicBus);
  osc.start(at);osc.stop(at+duration+.02);
  osc.onended=()=>{osc.disconnect();volume.disconnect()};
}
// Prism mallets are dry, pitched and metallic; bass passes through a low-pass
// filter to avoid drowning the FX or causing harsh sustained sawtooth sound.
function prismVoice(hz,at,duration,level,voice="glass"){
  if(!musicBus||!audioContext||![hz,at,duration,level].every(Number.isFinite)
    ||hz<=0||duration<=0||level<=0)return;
  const oscillator=audioContext.createOscillator();
  const envelope=audioContext.createGain();
  const filter=typeof audioContext.createBiquadFilter==="function"
    ?audioContext.createBiquadFilter():null;
  oscillator.type=voice==="bass"?"sawtooth":voice==="pad"?"triangle":"sine";
  oscillator.frequency.setValueAtTime(hz,at);
  const attack=voice==="pad"?.10:voice==="bass"?.008:.004;
  envelope.gain.setValueAtTime(.0001,at);
  envelope.gain.linearRampToValueAtTime(level,at+Math.min(attack,duration*.3));
  envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);
  if(filter){
    filter.type="lowpass";
    filter.frequency.setValueAtTime(voice==="bass"?330:voice==="pad"?1100:3600,at);
    oscillator.connect(filter);
    filter.connect(envelope);
  }else oscillator.connect(envelope);
  envelope.connect(musicBus);
  oscillator.start(at);oscillator.stop(at+duration+.02);
  oscillator.onended=()=>{
    oscillator.disconnect();
    if(filter)filter.disconnect();
    envelope.disconnect();
  };
}

function scheduleNeonCanopyStep(at,step,chapter){
  // Retain the first stage's original song and musical arrangement.
  const beat=step%16,bar=Math.floor(step/16);
  const shift=MUSIC_SECTOR_SHIFTS[chapter%MUSIC_SECTOR_SHIFTS.length];
  if(beat%4===0){
    synthMusic(74,at,.10,.12);
    const bass=38+MUSIC_BASS[(Math.floor(step/4)+chapter)%8];
    synthMusic(midiToHz(bass),at,MUSIC_STEP_SECONDS*3.4,.12,"triangle");
  }
  if(beat%4===2)synthMusic(185,at,.07,.026,"square");
  if(beat%2===1)synthMusic(1320,at,.034,.014,"triangle");
  const lead=MUSIC_MELODY[step%32];
  if(lead!==null)synthMusic(midiToHz(69+lead+shift),at,
    MUSIC_STEP_SECONDS*(chapter>=4?1.6:1.2),.078);
  if(beat===0&&chapter>0){
    const chord=MUSIC_CHORDS[(bar+Math.floor(chapter/2))%4];
    for(const note of chord)synthMusic(midiToHz(57+note+shift),
      at,MUSIC_STEP_SECONDS*6.5,.019);
  }
}

function schedulePrismCanyonStep(at,step,chapter){
  const beat=step%16;
  const bar=Math.floor(step/16)%4;
  const root=PRISM_ROOTS[bar]+PRISM_SECTION_LIFT[Math.min(chapter,8)];
  const advanced=chapter>=4;
  const finale=chapter>=7;
  const sixteenth=PRISM_STEP_SECONDS;

  // A broken-beat motor: unlike Neon Canopy's straight quarter-note kick.
  if(PRISM_KICKS.has(beat)){
    synthMusic(57,at,.088,beat===0?.14:.105,"sine");
  }
  if(beat===4||beat===12){
    synthMusic(170,at,.105,advanced?.043:.031,"triangle");
    if(advanced)synthMusic(340,at,.045,.012,"square");
  }
  if(PRISM_HATS.has(beat) && (chapter>=2 || beat===7||beat===15)){
    synthMusic(1850,at,.027,finale?.02:.012,"triangle");
  }

  // Pulsating low end: syncopated octave motion with an occasional fifth.
  const bass=PRISM_BASS_PATTERN[beat];
  if(bass!==null){
    prismVoice(midiToHz(root+bass),at,sixteenth*(bass===0?2.3:1.45),
      advanced?.087:.064,"bass");
  }

  // A distinctive rising/falling crystal motif and subtle inharmonic shimmer.
  const lead=PRISM_LEAD[step%PRISM_LEAD.length];
  if(lead!==null && (chapter>=2 || beat%4!==1)){
    const hz=midiToHz(root+36+lead);
    prismVoice(hz,at,sixteenth*1.48,advanced?.098:.080);
    prismVoice(hz*2.89,at,sixteenth*.83,.014,"glass");
    if(finale && beat%4===0){
      prismVoice(hz*2,at+.019,sixteenth*.95,.034,"glass");
    }
  }

  // Sparse wide harmonies slowly become full pads by the final sectors.
  if(beat===0 && chapter>=1){
    const harmony=[0,3,7];
    for(const note of harmony){
      prismVoice(midiToHz(root+24+note),at,
        sixteenth*(advanced?9:6.5),advanced?.022:.013,"pad");
    }
  }
  if(chapter>=5 && beat===10){
    // Echo arpeggio on an offbeat; enough movement without extra files.
    for(let i=0;i<2;i++){
      prismVoice(midiToHz(root+36+[7,15][i]),
        at+i*sixteenth*.66,sixteenth*.9,.028,"glass");
    }
  }
}

// A third, independent composition: "Ruptura do Prisma".
// 142 BPM, irregular bass ostinato, dark fifths, emergency beeps and
// accelerating syncopation, contrasting with both stage themes.
const GUARDIAN_RIFF=[
  0,null,1,7, null,6,7,null, 10,7,null,1, 0,null,-2,7,
  0,1,null,10, 8,null,7,6, null,3,1,null, 0,null,1,null
];
const GUARDIAN_BASS=[0,null,0,12,null,7,0,null, 0,0,null,7,12,null,0,5];
function scheduleGuardianTheme(at,step){
  const beat=step%16,bar=Math.floor(step/16)%4;
  const root=[38,39,43,36][bar];
  const tense=guardian.hp<=2;
  const finalHit=guardian.hp===1;
  const unit=GUARDIAN_STEP_SECONDS;
  if([0,3,6,8,11,14].includes(beat)){
    synthMusic(59,at,.09,beat===0?.15:.11,"sine");
    if(finalHit)synthMusic(84,at,.055,.045,"triangle");
  }
  if([4,12].includes(beat)){
    synthMusic(185,at,.082,.056,"square");
    synthMusic(790,at,.042,.019,"triangle");
  }
  if(beat%2===1 || (tense&&beat%4===0)){
    synthMusic(1770,at,.022,finalHit?.026:.013,"triangle");
  }
  const bass=GUARDIAN_BASS[beat];
  if(bass!==null){
    prismVoice(midiToHz(root+bass),at,unit*1.5,.095,"bass");
  }
  const lead=GUARDIAN_RIFF[step%GUARDIAN_RIFF.length];
  if(lead!==null){
    const hz=midiToHz(root+36+lead);
    prismVoice(hz,at,unit*(tense?1.3:.95),.064,"glass");
    if(finalHit && beat%4===3)prismVoice(hz*2,at+.018,unit*.62,.022,"glass");
  }
  if(beat===0){
    for(const semitone of [0,6,10]){
      prismVoice(midiToHz(root+24+semitone),at,unit*6.7,.014,"pad");
    }
  }
  // The charging laser has a short rising musical pulse; all frequencies
  // remain positive and finite even when the player waits for many loops.
  if(guardian.state==="telegraph" && [5,9,13].includes(beat)){
    prismVoice(midiToHz(78+beat/4),at,unit*.7,.033,"glass");
  }
}

// "A Flor e a Ruptura" — original 88 BPM interactive cinematic score.
// A gentle theme becomes dissonant beneath the Sovereign's appearance,
// then resolves into a hopeful motif as Flux sees the new world's mountains.
const CINEMA_STEP_SECONDS=60/88/4;
const CINEMA_WARM_NOTES=[0,null,4,null,7,null,12,null, 11,null,7,4, 2,null,4,null,
  7,null,9,null,12,11,7,null, 4,null,2,0, null,4,null,7];
const CINEMA_DANGER_NOTES=[0,null,1,null,6,7,null,1, 10,null,6,null, 3,1,null,0,
  0,null,6,null,1,7,null,10, 11,null,7,null, 3,1,null,0];
const CINEMA_HOPE_NOTES=[0,null,2,4,7,null,9,null, 12,null,9,7, 4,null,2,null,
  0,4,null,7,11,null,12,null, 14,12,9,7, 4,null,2,0];
function cinematicMood(){
  if(!cinematic.active)return "warm";
  const art=CINEMATICS[cinematic.key].frames[cinematic.frameIndex].art;
  if(["rift","sovereign","taken","canyonBoss"].includes(art))return "danger";
  if(["pursuit","arrival","forestRun","canyon","city","cityRun"].includes(art))return "hope";
  return "warm";
}
function scheduleCinematicMusic(at,step){
  const mood=cinematicMood(),unit=CINEMA_STEP_SECONDS,beat=step%16;
  const bar=Math.floor(step/16)%4;
  const roots=mood==="danger"?[38,39,36,41]:
    mood==="hope"?[43,45,40,47]:[45,42,47,40];
  const root=roots[bar];
  const melody=mood==="danger"?CINEMA_DANGER_NOTES:
    mood==="hope"?CINEMA_HOPE_NOTES:CINEMA_WARM_NOTES;
  const note=melody[step%melody.length];
  if(beat===0){
    const chord=mood==="danger"?[0,1,7]:[0,4,7];
    for(const interval of chord){
      prismVoice(midiToHz(root+12+interval),at,unit*13,.019,"pad");
    }
    synthMusic(midiToHz(root),at,unit*6,
      mood==="danger"?.065:.048,"triangle");
  }
  if(note!==null){
    const lead=root+24+note;
    prismVoice(midiToHz(lead),at,unit*(mood==="danger"?1.8:2.8),
      mood==="danger"?.065:.056,"glass");
    if(mood==="warm"&&beat%4===0)
      prismVoice(midiToHz(lead+12),at+.025,unit*1.2,.012,"glass");
  }
  // Sparse heartbeat during danger; brighter arpeggios at arrival.
  if(mood==="danger"&&[0,7,12].includes(beat))
    synthMusic(58,at,.13,.041,"sine");
  if(mood==="hope"&&beat%4===2)
    prismVoice(midiToHz(root+31),at,unit*2,.022,"glass");
}

// Two original scores: "Cidade Entre Estrelas" (136 BPM) and
// "Coroa do Vazio" (158 BPM). Synthesized in real time, no external assets.
const CITY_STEP_SECONDS=60/136/4,CITY_BOSS_STEP_SECONDS=60/158/4;
const CITY_ROOTS=[45,40,47,42,45,52,49,44];
const CITY_BASS=[0,null,7,12,null,7,3,null,0,12,null,7,10,null,3,7];
const CITY_LEAD=[12,null,16,19,null,23,19,null,16,14,null,12,7,null,9,11,
  12,16,null,19,23,null,26,23,19,null,16,14,12,11,9,null];
const CITY_BOSS_RIFF=[0,1,6,null,12,7,6,1,0,10,6,null,13,12,7,null];
function scheduleCityTheme(at,step,chapter){
  const beat=step%16,bar=Math.floor(step/16)%8;
  const root=CITY_ROOTS[bar],unit=CITY_STEP_SECONDS;
  if([0,4,7,8,11,14].includes(beat))
    synthMusic(52,at,.09,beat===0?.135:.095,"sine");
  if(beat===4||beat===12){
    synthMusic(170,at,.09,.044,"triangle");
    synthMusic(760,at+.025,.025,.009,"square");
  }
  if(beat%2===1||chapter>=3)
    synthMusic(2100,at,.026,chapter>=3?.019:.011,"triangle");
  const bass=CITY_BASS[beat];
  if(bass!==null)prismVoice(midiToHz(root+bass),at,unit*1.7,.086,"bass");
  const melody=CITY_LEAD[step%CITY_LEAD.length];
  if(melody!==null){
    const hz=midiToHz(root+24+melody);
    prismVoice(hz,at,unit*(chapter>=4?1.9:1.4),.091,"glass");
    if(beat%4===0)prismVoice(hz*2,at+.038,unit*.8,.019,"glass");
  }
  if(beat===0)
    for(const n of [0,4,7,11])
      prismVoice(midiToHz(root+24+n),at,unit*11,.021,"pad");
  if(chapter>=4&&beat===14)
    prismVoice(midiToHz(root+43),at,unit*2.7,.051,"glass");
}
function scheduleCityBossTheme(at,step){
  const beat=step%16,bar=Math.floor(step/16)%4,unit=CITY_BOSS_STEP_SECONDS;
  const root=[38,39,44,37][bar],rage=cityBoss.hp<=2;
  if([0,3,6,8,10,13].includes(beat)){
    synthMusic(52,at,.10,rage?.166:.138,"sine");
    if(beat===0)synthMusic(76,at,.12,.029,"triangle");
  }
  if(beat===4||beat===12)synthMusic(200,at,.09,.067,"square");
  if(beat%2===1||rage)synthMusic(1950,at,.02,rage?.024:.013,"triangle");
  if(beat%4===0)
    for(const n of [0,1,7,10])
      prismVoice(midiToHz(root+24+n),at,unit*5.7,.016,"pad");
  const riff=CITY_BOSS_RIFF[step%CITY_BOSS_RIFF.length];
  if(riff!==null){
    prismVoice(midiToHz(root+36+riff),at,unit*1.15,rage?.105:.079,"glass");
    if(rage&&beat%4===2)
      prismVoice(midiToHz(root+48+riff),at+.019,unit*.6,.025,"glass");
  }
  if(cityBoss.state==="telegraph"&&beat%4===3)
    synthMusic(465+beat*27,at,.1,.029,"sawtooth");
}

function scheduleMusic(){
  if((!gameStarted&&!cinematic.active)||paused||
    (gameCleared&&!cinematic.active)||effectiveAudioGain("music")===0||
    !audioContext||!musicBus||audioContext.state!=="running")return;
  const now=audioContext.currentTime;
  const bossTheme=activeStage===2&&guardian.active&&!guardian.defeated;
  const cityBossTheme=activeStage===3&&cityBoss.active&&!cityBoss.defeated;
  const stepDuration=cinematic.active?CINEMA_STEP_SECONDS:
    cityBossTheme?CITY_BOSS_STEP_SECONDS:
    activeStage===3?CITY_STEP_SECONDS:
    bossTheme?GUARDIAN_STEP_SECONDS:
    activeStage===2?PRISM_STEP_SECONDS:MUSIC_STEP_SECONDS;
  if(!Number.isFinite(now)||!Number.isFinite(nextMusicNote))return;
  if(nextMusicNote<now-.15||nextMusicNote>now+1)nextMusicNote=now+.05;
  let scheduled=0;
  while(nextMusicNote<now+.18&&scheduled++<3){
    if(cinematic.active){
      const mood=cinematicMood();
      if(mood!==cinematicMusicMood){
        cinematicMusicMood=mood;
        cinematicMusicStep=0;
      }
      scheduleCinematicMusic(nextMusicNote,cinematicMusicStep++);
      nextMusicNote+=stepDuration;
      continue;
    }
    const chapter=Math.max(0,chapters.findLastIndex(ch=>player.x>=ch.x));
    if(cityBossTheme)scheduleCityBossTheme(nextMusicNote,musicStep);
    else if(activeStage===3)scheduleCityTheme(nextMusicNote,musicStep,chapter);
    else if(bossTheme)scheduleGuardianTheme(nextMusicNote,musicStep);
    else if(activeStage===2)schedulePrismCanyonStep(nextMusicNote,musicStep,chapter);
    else scheduleNeonCanopyStep(nextMusicNote,musicStep,chapter);
    musicStep=(musicStep+1)%128;
    nextMusicNote+=stepDuration;
  }
}

function syncTrackLabel(){
  if(!trackNowPlaying)return;
  trackNowPlaying.textContent=activeStage===3
    ?cityBoss.active&&!cityBoss.defeated
      ?"♫ CHEFE: Coroa do Vazio · 158 BPM"
      :"♫ Cidade Entre Estrelas · 136 BPM"
    :activeStage===2
    ?guardian.active&&!guardian.defeated
      ?"♫ CHEFE: Ruptura do Prisma · 142 BPM"
      :"♫ Trilha original: Ecos do Prisma · 126 BPM"
    :"♫ Trilha original: Neon Canopy · 108 BPM";
}

function syncMusicButton(){
  if(!musicToggle)return;
  musicToggle.textContent=musicEnabled?"♫ Música ligada":"♫ Música desligada";
  musicToggle.setAttribute("aria-pressed",String(musicEnabled));
}
function toggleMusic(){
  musicEnabled=!musicEnabled;
  try{localStorage.setItem("velocity-rift-music",musicEnabled?"on":"off")}catch(_){}
  if(musicEnabled)unlockAudio();
  syncMusic();syncMusicButton();refreshAudioSettings();
}
if(musicToggle)musicToggle.addEventListener("click",toggleMusic);
syncMusicButton();
syncTrackLabel();


// DEBUG is deliberately session-only. Runs that ever used cheats are unranked.
function setDebugMode(enabled){
  debugMode=Boolean(enabled);
  if(debugMode){
    player.boost=100;
    if(gameStarted)debugUsedThisRun=true;
  }else{
    player.vy=0;player.onGround=false;player.ground=null;
    player.sliding=false;
  }
  if(debugToggle){
    debugToggle.textContent=debugMode?"DEBUG: ON":"DEBUG: OFF";
    debugToggle.setAttribute("aria-pressed",String(debugMode));
    debugToggle.title=debugMode?"Desligar boost infinito, voo e invencibilidade":
      "Ligar modo de teste (F3)";
  }
  if(!gameStarted)refreshProgressView();
}
function toggleDebugMode(){setDebugMode(!debugMode);}
function warpToGuardian(){
  if(!debugMode||!gameStarted||gameCleared)return;
  if(activeStage===3){
    player.x=cityBoss.arenaLeft+95;player.y=410-PLAYER_RADIUS;
    player.prevX=player.x;player.prevY=player.y;player.vx=0;player.vy=0;
    player.onGround=false;player.ground=null;
    cameraX=cityBoss.arenaLeft;cameraY=0;
    checkpointIndex=checkpoints.length-1;
    checkpoints.forEach((p,i)=>p.active=i<=checkpointIndex);
    resetCityBoss();debugUsedThisRun=true;return;
  }
  if(activeStage!==2)return;
  player.x=guardian.arenaLeft+90;
  player.y=groundY(player.x)-PLAYER_RADIUS;
  player.prevX=player.x;player.prevY=player.y;
  player.vx=0;player.vy=0;
  player.boost=100;player.onGround=false;player.ground=null;
  checkpointIndex=checkpoints.length-1;
  checkpoints.forEach((point,i)=>{point.active=i<=checkpointIndex;});
  resetGuardian();
  cameraAnchorX=VIEW_W*CAMERA_IDLE_ANCHOR;
  cameraX=guardian.arenaLeft;
  cameraY=0;
  debugUsedThisRun=true;
}
if(debugToggle)debugToggle.addEventListener("click",toggleDebugMode);

window.addEventListener("keydown",(event)=>{
  const key=event.key.toLowerCase();
  if(cinematic.active){
    if(event.repeat)return;
    if(["enter"," ","arrowright"].includes(key)){
      event.preventDefault();nextCinematicFrame();return;
    }
    if(key==="escape"){event.preventDefault();finishCinematic();return;}
    return;
  }
  if((key==="p"||key==="escape")&&gameStarted&&!event.repeat){
    event.preventDefault();togglePause();return;
  }
  if(stageArrival.active){
    // Optional fast-forward for replaying the story; no movement controls
    // leak into the scripted entrance and the timer stays untouched.
    if((key==="enter"||key===" ")&&!event.repeat){
      event.preventDefault();finishStageArrival();return;
    }
    if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(key))
      event.preventDefault();
    return;
  }
  if(!gameStarted||paused){
    if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(key)
      &&event.target?.tagName!=="INPUT")event.preventDefault();
    return;
  }
  if([" ","w","arrowup","k"].includes(key)&&!event.repeat&&
    !jumpHeld&&!player.onGround&&dashUnlocked()){
    if(startAirDash()){event.preventDefault();jumpHeld=true;return;}
  }
  if(key==="m"&&!event.repeat)toggleSound();
  if(key==="n"&&!event.repeat)toggleMusic();
  if(key==="f3"&&!event.repeat){toggleDebugMode();event.preventDefault();}
  if(key==="b"&&!event.repeat&&debugMode)warpToGuardian();
  if(soundEnabled)unlockAudio();
  keys.add(key);
  if([" ","arrowup","w","k"].includes(key)&&!jumpHeld){
    jumpBuffer=.13;jumpHeld=true;
  }
  if(key==="r"&&!event.repeat)startGame(activeStage);
  if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(key))
    event.preventDefault();
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  if ([' ', 'arrowup', 'w', 'k'].includes(key)) jumpHeld = false;
});

window.addEventListener('blur',()=>{keys.clear();jumpHeld=false;if(gameStarted&&!paused&&!gameCleared)showPauseMenu();});
startButton.addEventListener("click",continueCampaign);
document.querySelector("#newGameButton").addEventListener("click",askNewGame);
document.querySelector("#confirmNewGameButton").addEventListener("click",confirmNewGame);
document.querySelector("#cancelNewGameButton").addEventListener("click",showMainMenu);
document.querySelector("#settingsButton").addEventListener("click",showSettingsMenu);
document.querySelector("#settingsBackButton").addEventListener("click",showMainMenu);
for(const name of ["master","music","effects"]){
  for(const prefix of ["","pause-"])
    document.querySelector("#"+prefix+"volume-"+name).addEventListener("input",event=>
      changeAudioLevel(name,event.target.value));
}
document.querySelector("#selectStagesButton").addEventListener("click", showStageMenu);
document.querySelector("#galleryButton").addEventListener("click",showGalleryMenu);
document.querySelector("#galleryBackButton").addEventListener("click",showMainMenu);
document.querySelector("#galleryOpening").addEventListener("click",()=>replayCinematic("opening"));
document.querySelector("#galleryStageOne").addEventListener("click",()=>replayCinematic("intro1"));
document.querySelector("#galleryStageTwo").addEventListener("click",()=>replayCinematic("intro2"));
document.querySelector("#galleryStageThree").addEventListener("click",()=>replayCinematic("intro3"));
document.querySelector("#cinematicNextButton").addEventListener("click",nextCinematicFrame);
document.querySelector("#cinematicSkipButton").addEventListener("click",finishCinematic);
document.querySelector("#cinematicExitButton").addEventListener("click",()=>cancelCinematic(true));
for(const [index,name] of ["One","Two","Three","Four"].entries()){
  const button=document.querySelector("#mapNodeStage"+name);
  button.addEventListener("click",()=>selectMapStage(index+1));
  button.addEventListener("keydown",event=>{
    const next=event.key==="ArrowRight"||event.key==="ArrowDown"?
      Math.min(4,index+2):
      event.key==="ArrowLeft"||event.key==="ArrowUp"?Math.max(1,index):
      event.key==="Home"?1:event.key==="End"?4:0;
    if(!next)return;
    event.preventDefault();
    selectMapStage(next);
    document.querySelector("#mapNodeStage"+["One","Two","Three","Four"][next-1]).focus?.();
  });
}
document.querySelector("#stageOneButton").addEventListener("click", ()=>startGame(1));
 document.querySelector("#stageTwoButton").addEventListener("click",()=>{if(campaign.stage1Completed||debugMode)startGame(2)});
document.querySelector("#stageThreeButton").addEventListener("click",()=>{if(campaign.stage2Completed||debugMode)startGame(3)});
document.querySelector("#backToMainButton").addEventListener("click", showMainMenu);
document.querySelector("#achievementsButton").addEventListener("click",showAchievementsMenu);
document.querySelector("#stageAchievementsButton").addEventListener("click",showAchievementsMenu);
document.querySelector("#resultsAchievementsButton").addEventListener("click",showAchievementsMenu);
document.querySelector("#achievementsBackButton").addEventListener("click",showMainMenu);
document.querySelector("#nextStageButton").addEventListener("click",()=>{
  if(gameCleared&&activeStage===1&&(campaign.stage1Completed||debugMode))startGame(2);
  else if(gameCleared&&activeStage===2&&(campaign.stage2Completed||debugMode))startGame(3);
});
document.querySelector("#retryButton").addEventListener("click", ()=>startGame(activeStage));
document.querySelector("#resultsStagesButton").addEventListener("click", showStageMenu);
document.querySelector("#resultsMainButton").addEventListener("click", showMainMenu);
menuButton.addEventListener("click",showMainMenu);
pauseButton.addEventListener("click",togglePause);
document.querySelector("#resumeButton").addEventListener("click",resumeGame);
document.querySelector("#restartPauseButton").addEventListener("click",()=>startGame(activeStage));
document.querySelector("#deathRestartButton").addEventListener("click",restartAfterDeath);
document.querySelector("#deathMainButton").addEventListener("click",showMainMenu);
// All menu button feedback uses the existing SFX bus and stored effect volume.
document.querySelectorAll("button:not([data-key])").forEach(button=>{
  button.addEventListener("click",()=>{
    if(button.disabled)return;
    unlockAudio();
    const id=button.id;
    const kind=["confirmNewGameButton","newGameButton","startButton","resumeButton","nextStageButton"].includes(id)?"ui-confirm":
      ["cancelNewGameButton","settingsBackButton","menuButton","backToMainButton",
       "resultsMainButton","achievementsBackButton"].includes(id)?"ui-back":"ui-select";
    playSfx(kind);
  });
});

// Touch input uses the same controls as the keyboard.
document.querySelectorAll('[data-key]').forEach(button => {
  const key = button.dataset.key;
  const release = event => { event.preventDefault(); keys.delete(key); if (key === ' ') jumpHeld = false; };
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    unlockAudio();
    keys.add(key);
    if(key===' '&&!jumpHeld){
      if(!player.onGround&&dashUnlocked()&&startAirDash()){
        jumpHeld=true;
      }else{jumpBuffer=.13;jumpHeld=true;}
    }
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

showMainMenu();
draw();

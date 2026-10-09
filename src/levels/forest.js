// First Impulse stage layout, extracted without changing geometry.
export function createStageOneWorld({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H,worldW}){
const WORLD_W=worldW;
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
const groundY=x=>{const floor=tracks.find(t=>x>=t.x1&&x<=t.x2);return floor?yOnTrack(floor,x):null;};
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
  {x:5000,title:"ELETROPULSOS",hint:"PARE OU SALTE O FEIXE"},
  {x:12250,title:"CICLO DE ENERGIA",hint:"LUZ VERMELHA = PERIGO"},
  {x:17180,title:"REFLEXOS",hint:"OBSERVE A JANELA SEGURA"},
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
// Five visible rhythmic hazards. Each can be cleared by jumping or timing.
const pulseGates = [5250,9520,12520,17370,20750].map((x,i)=>({
  x,y:groundY(x)-105,w:18,h:81,phase:i*.47,period:2.7,live:1.05
}));
const memoryCores = [4920,10220,19060].map((x,i)=>({
  x,y:groundY(x)-91,r:13,id:i,active:true
}));
const goal = {x:22550,y:348,w:54,h:72};
const stageOneWorld={
  worldW:WORLD_W, spawn:{...spawn}, goal:{...goal},
  tracks:tracks.map(t=>({...t})),chapters:chapters.map(t=>({...t})),
  signs:signs.map(t=>({...t})),checkpoints:checkpoints.map(t=>({...t})),
  walls:walls.map(t=>({...t})),tunnels:tunnels.map(t=>({...t})),
  enemies:enemies.map(t=>({...t})),rings:rings.map(t=>({...t})),
  boostOrbs:boostOrbs.map(t=>({...t})),springs:springs.map(t=>({...t})),
  boostPads:boostPads.map(t=>({...t})),spikes:spikes.map(t=>({...t})),
  pulseGates:pulseGates.map(t=>({...t})),memoryCores:memoryCores.map(t=>({...t})),
  pits:[]
};
return stageOneWorld;
}

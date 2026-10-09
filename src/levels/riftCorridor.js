// The Corredor das Fendas precedes the Architect's arena.
// Gaps are dash-gated, but the dash stays exclusively horizontal.
export const RIFT_CORRIDOR_START=17600;
export const RIFT_BOSS_ARENA_LEFT=22000;
export const RIFT_WORLD_WIDTH=23560;

export function createRiftCorridor({track,PLAYER_RADIUS}){
  const trackAt=(a,b,y,kind="rift-floor")=>track(a,y,b,y,kind);
  const gaps=[
    [18180,18395],[18810,19025],[19450,19665],
    [20080,20295],[20705,20920],[21320,21535]
  ];
  // Solid footholds between fixed 215px gaps. Dash gates, not gap length,
  // make the dash mandatory; it crosses without any vertical steering.
  const floors=[
    trackAt(17600,18180,422),
    trackAt(18395,18810,410),
    trackAt(19025,19145,380),
    trackAt(19145,19310,380,"rift-phase"),
    trackAt(19310,19450,380),
    trackAt(19665,20080,410),
    trackAt(20295,20410,365),
    trackAt(20410,20560,365,"rift-phase"),
    trackAt(20560,20705,365),
    trackAt(20920,21040,410),
    trackAt(21040,21180,410,"rift-phase"),
    trackAt(21180,21320,410),
    trackAt(21535,RIFT_BOSS_ARENA_LEFT,410),
    trackAt(RIFT_BOSS_ARENA_LEFT,RIFT_WORLD_WIDTH,410,"boss-floor")
  ];
  for(const floor of floors){
    if(floor.kind!=="rift-phase")continue;
    floor.period=3.25;
    floor.solidFor=2.40;
    floor.phase=floor.x1===19145?0.55:floor.x1===20410?1.2:1.9;
  }
  const elevators=[
    [17970,304,135,68,1.14,0.2],
    [18545,309,132,78,0.94,1.1],
    [19840,306,135,81,1.07,0.5],
    [20490,265,126,62,1.30,1.6],
    [21100,302,136,77,0.88,2.3]
  ].map(([x,y,width,swingY,speedY,phaseY])=>{
    const floor=trackAt(x,x+width,y,"rift-elevator");
    floor.originY=y-Math.sin(phaseY)*swingY;
    floor.initialY=y;
    floor.swingY=swingY;
    floor.speedY=speedY;
    floor.phaseY=phaseY;
    return floor;
  });
  const traps=[
    [18595,410],[19815,410],[21000,410],[21680,410]
  ].map(([x,ground])=>({x,y:ground-22,w:54,h:22}));
  return {
    start:RIFT_CORRIDOR_START,
    end:RIFT_BOSS_ARENA_LEFT,
    tracks:[...floors,...elevators],
    pits:gaps,
    spikes:traps,
    enemies:[],
    checkpoints:[
      {x:17770,y:422-PLAYER_RADIUS,active:false},
      {x:21820,y:410-PLAYER_RADIUS,active:false}
    ],
    signs:[
      {x:17730,title:"CORREDOR DAS FENDAS",hint:"SEM INIMIGOS · DOMINE O DASH"},
      {x:18390,title:"PULOS DE PRECISÃO",hint:"USE DASH HORIZONTAL NOS VÃOS"},
      {x:18990,title:"PLATAFORMAS FANTASMA",hint:"A LUZ APAGA · NÃO DEMORE"},
      {x:19750,title:"ELEVADORES",hint:"SUBA · ESPERE · AVANCE"},
      {x:20880,title:"ÚLTIMO DESAFIO",hint:"DASH E PLATAFORMAS TEMPORÁRIAS"},
      {x:21700,title:"O ARQUITETO ADIANTE",hint:"CHECKPOINT · PREPARE-SE"}
    ]
  };
}

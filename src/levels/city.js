import {createRiftCorridor,RIFT_CORRIDOR_START,RIFT_WORLD_WIDTH} from "./riftCorridor.js";

export function createStageThreeWorld({track,rect,enemy,orb,PLAYER_RADIUS,WORLD_H}){
  // Rooftops are safer elevated shortcuts. Streets have more enemies.
  const parts=[[0,1600,422],[1600,3020,438],[3020,4500,418],[4500,5900,430],
    [5900,7240,430],[7670,9050,416],[9050,10630,412],
    [11110,12630,425],[13120,14750,413],[14750,16100,413],
    [16100,17600,410]];
  const ground=parts.map(([a,b])=>track(a,422,b,422,"city-street"));
  const roofs=[[510,298,950],[1450,280,1820],[2190,305,2630],[2980,265,3460],
    [3540,295,4080],[4760,279,5350],[5500,290,6130],[6350,284,6980],
    [7740,283,8270],[8410,268,8980],[9270,281,9850],[9960,255,10580],
    [11170,283,11780],[11980,263,12560],[13160,279,13670],[13840,267,14590],
    [14960,281,15510],[15860,288,16320],[16880,290,17360]]
    .map(([a,y,b])=>track(a,y,b,y,"city-roof"));
  const lifts=[[7120,304,160,110,1.15,.4],[10690,293,165,115,.95,1.1],
    [12680,277,160,112,1.06,1.8]].map(([x,y,w,swing,speed,phase])=>{
    const f=track(x,y,x+w,y,"moving");f.originX=x-Math.sin(phase)*swing;
    f.swing=swing;f.speed=speed;f.phase=phase;return f;
  });
  const corridor=createRiftCorridor({track,PLAYER_RADIUS});
  const groundY=x=>[...ground,...corridor.tracks.filter(t=>t.kind==="rift-floor"||t.kind==="boss-floor")].find(t=>x>=t.x1&&x<=t.x2)?.y1??418;
  const bads=[[830,"city-drone",90,300],[1320,"city-hunter",80,0],
    [2180,"city-drone",105,307],[2650,"city-turret",0,0],
    [3140,"city-drone",105,270],[4820,"city-hunter",80,0],
    [5260,"city-drone",90,272],[6160,"city-turret",0,0],
    [6670,"city-drone",90,302],[8000,"city-drone",95,280],
    [8520,"city-hunter",75,0],[9390,"city-turret",0,0],
    [9860,"city-drone",105,270],[11330,"city-drone",85,278],
    [11830,"city-hunter",76,0],[13310,"city-turret",0,0],
    [13970,"city-drone",80,272],[15020,"city-hunter",70,0],
    [15830,"city-drone",88,286],[16650,"city-turret",0,0],
    [17100,"city-drone",72,285]]
    .map(([x,type,patrol,flightY])=>{
      const b=enemy(x,flightY||groundY(x)-3,patrol);
      b.type=type;b.w=type==="city-hunter"?46:45;
      b.h=type==="city-drone"?28:38;b.shotTimer=.6+x%3*.2;
      b.doubleShots=0;return b;
    });
  const rings=[];
  for(const [a,b] of [[200,1500],[1920,2900],[3340,4250],[4810,5610],
    [6150,6990],[7800,8950],[9300,10480],[11320,12400],
    [13220,14500],[14930,15800],[16200,17300]]){
    for(let x=a;x<b;x+=62)rings.push({x,y:groundY(x)-49,r:8,active:true});
  }
  const signs=[
    [210,"CIDADE DAS FENDAS","TELHADOS SEGUROS · RUAS PERIGOSAS"],
    [1700,"DRONES DE ASSALTO","TIROS DUPLOS · BOOST NÃO BLOQUEIA"],
    [3370,"NÚCLEO DE ÍMPETO","COLETE PARA APRENDER O DASH"],
    [4710,"DASH AÉREO","APERTE PULO DUAS VEZES · SÓ HORIZONTAL"],
    [6640,"VÃO DIMENSIONAL","O DASH É OBRIGATÓRIO"],
    [9620,"ROTAS ELEVADAS","TELHADOS MAIS SEGUROS · RUAS COM PATRULHAS"],
    [10490,"PASSAGEM OBRIGATÓRIA","DASH AÉREO NECESSÁRIO"],
    [12460,"PROJÉTEIS","BOOST E DASH NÃO BLOQUEIAM TIROS"],
    [13720,"RITMO FINAL","ENCADEIE SALTO E DASH"],
    [17290,"ZONA DE TRANSIÇÃO","CORREDOR DAS FENDAS À FRENTE"]
  ].map(([x,title,hint])=>({x,title,hint}));
  return {worldW:RIFT_WORLD_WIDTH,spawn:{x:90,y:404},goal:{x:RIFT_WORLD_WIDTH-160,y:338,w:54,h:72},
    riftCorridor:{start:RIFT_CORRIDOR_START,end:corridor.end},
    tracks:[...ground,...roofs,...lifts,...corridor.tracks],
    chapters:[{x:0,title:"01 / LUZES DA METRÓPOLE"},
      {x:3250,title:"02 / NÚCLEO DE ÍMPETO"},
      {x:5850,title:"03 / SALTO SOBRE O VAZIO"},
      {x:9100,title:"04 / TELHADOS OU RUAS"},
      {x:12900,title:"05 / FENDAS DO CÉU"},
      {x:17600,title:"06 / CORREDOR DAS FENDAS"},
      {x:22000,title:"07 / ARQUITETO DO VAZIO"}],
    signs:[...signs,...corridor.signs],
    checkpoints:[...([2550,5330,8000,11530,14450,17330]
      .map(x=>({x,y:groundY(x)-PLAYER_RADIUS,active:false}))),...corridor.checkpoints],
    walls:[rect(-120,0,120,WORLD_H,"left-wall")],
    tunnels:[],enemies:bads,rings,
    boostOrbs:[700,2100,3090,4950,6310,7940,9510,11610,13440,15340,17020]
      .map(x=>orb(x,groundY(x)-35)),
    springs:[],boostPads:[],
    spikes:[...([2350,4970,6210,8340,9710,11900,13580,15530,16920]
      .map(x=>({x,y:groundY(x)-22,w:56,h:22}))),...corridor.spikes],
    pulseGates:[],
    memoryCores:[{x:2920,y:227,r:13,id:0,active:true},
      {x:9530,y:232,r:13,id:1,active:true},
      {x:15650,y:230,r:13,id:2,active:true}],
    pits:[[7240,7670],[10630,11110],[12630,13120],...corridor.pits]};
}

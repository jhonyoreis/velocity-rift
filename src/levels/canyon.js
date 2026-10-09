function createStageTwoWorldOriginal({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H}) {
  const base=[
    track(0,420,1150,420,"intro"),track(1150,420,1900,405,"rise"),
    track(2130,435,2900,435,"canyon"),track(2900,435,3620,435,"canyon"),
    track(3620,435,3900,345,"rise"),track(3900,345,4650,345,"cliff"),
    track(4870,395,5610,395,"canyon"),
    track(5840,420,6580,420,"canyon"),track(6580,420,7400,465,"drop"),
    track(7400,465,7780,465,"cliff"),track(8020,450,8750,450,"canyon"),
    track(8750,450,9200,355,"rise"),track(9200,355,9950,355,"cliff"),
    track(10180,405,10800,405,"canyon"),track(10800,405,11600,440,"drop"),
    track(11600,440,12300,440,"cliff"),track(12560,460,13300,460,"canyon"),
    track(13300,460,14000,375,"rise"),track(14000,375,14900,375,"cliff"),
    track(15130,410,16400,410,"canyon"),track(16400,410,16900,360,"rise"),
    track(16900,360,17600,360,"finish")
  ];
  const lookup=x=>{
    const floor=base.find(t=>x>=t.x1&&x<=t.x2);
    return floor?yOnTrack(floor,x):null;
  };
  const pits=[[1900,2130],[4650,4870],[5610,5840],[7780,8020],
    [9950,10180],[12300,12560],[14900,15130]];
  // Platforms float above pits or reward an optional high route.
  const ledges=[
    track(1670,310,1970,310,"platform"),
    track(2730,315,3030,315,"platform"),
    track(4390,260,4690,260,"platform"),
    track(7630,350,7930,350,"platform"),
    track(9710,270,10070,270,"platform"),
    track(12100,335,12430,335,"platform"),
    track(14700,290,15020,290,"platform"),
    track(15700,315,16010,315,"platform")
  ];
  // Moving platforms are useful shortcuts, never mandatory.
  const moving=[
    {x:5330,y:300,width:175,swing:72,speed:1.1,phase:0},
    {x:8700,y:313,width:170,swing:96,speed:.9,phase:1.1},
    {x:13390,y:294,width:185,swing:86,speed:1,phase:2.3},
  ].map(obj=>{
    const p=track(obj.x,obj.y,obj.x+obj.width,obj.y,"moving");
    // Match the starting position so moving ledges never teleport on frame one.
    p.originX=obj.x-Math.sin(obj.phase)*obj.swing;
    p.swing=obj.swing;p.speed=obj.speed;p.phase=obj.phase;
    return p;
  });
  const stageTracks=[...base,...ledges,...moving];
  const stageRings=[];
  for (const [start,count,gap] of [
    [280,11,57],[2200,10,60],[3230,7,56],[3940,9,63],
    [4940,8,60],[5890,10,58],[6920,8,58],[8100,10,57],
    [9030,8,64],[10270,8,59],[11450,10,60],
    [12630,10,59],[13640,8,57],[15190,10,61],[16630,11,58]
  ]) {
    for(let i=0;i<count;i++){
      const x=start+i*gap,y=lookup(x);
      if(y!=null)stageRings.push({x,y:y-34-Math.sin(i/(count-1)*Math.PI)*12,r:8,active:true});
    }
  }
  const stageEnemies=[
    [860,"walker",30],[2530,"sentry",0],[3300,"drone",78],
    [4140,"walker",70],[5220,"drone",65],[6140,"sentry",0],
    [7160,"walker",90],[8370,"drone",65],[9350,"sentry",0],
    [10530,"drone",90],[11290,"walker",70],[11880,"sentry",0],
    [13130,"drone",85],[14180,"walker",65],[15360,"sentry",0],
    [16200,"drone",75],[17020,"walker",85]
  ].map(([x,type,patrol])=>{
    const y=lookup(x);
    const bad=enemy(x, y-(type==="drone"?46:2), patrol);
    bad.type=type;bad.w=type==="sentry"?46:42;bad.h=type==="drone"?25:type==="sentry"?38:28;
    return bad;
  });
  const checkpoints2=[2400,6020,9050,12860,15840].map(x=>({
    x,y:lookup(x)-PLAYER_RADIUS,active:false
  }));
  const stageSigns=[
    {x:250,title:"CANION PRISMA",hint:"NOVOS INIMIGOS E ABISMOS"},
    {x:1460,title:"PRIMEIRO ABISMO",hint:"GANHE IMPULSO E PULE"},
    {x:2570,title:"SENTINELA",hint:"EVITE OU USE BOOST"},
    {x:3200,title:"DRONE",hint:"VOA E PATRULHA O AR"},
    {x:4360,title:"PLATAFORMAS",hint:"BUSQUE UM CAMINHO ALTO"},
    {x:7490,title:"NOVO SALTO",hint:"ACERTE A HORA DE PULAR"},
    {x:11550,title:"ABISMO MAIOR",hint:"PREPARE SUA CORRIDA"},
    {x:14610,title:"ULTIMO VAO",hint:"JUMP + CONTROLE"},
    {x:16940,title:"CHEGADA",hint:"O CANION FOI SUPERADO"}
  ];
  return {
    worldW:17600,spawn:{x:90,y:402},goal:{x:17460,y:288,w:55,h:72},
    tracks:stageTracks,
    chapters:[{x:0,title:"01 / PORTAL PRISMA"},{x:2900,title:"02 / PRIMEIRAS PLATAFORMAS"},
      {x:5900,title:"03 / ABISMOS"},{x:8900,title:"04 / DRONES"},
      {x:12300,title:"05 / RISCO E PRECISAO"},{x:15100,title:"06 / ESCAPE"}],
    signs:stageSigns,
    checkpoints:checkpoints2,
    walls:[rect(-120,0,120,WORLD_H,"left-wall"),
      rect(6340,346,44,74,"break-gate"),rect(13760,336,44,80,"break-gate")],
    tunnels:[{x:3500,w:240,ground:435},{x:10630,w:290,ground:405}],
    enemies:stageEnemies,rings:stageRings,
    boostOrbs:[510,2250,5920,8420,10390,12660,13430,15630,16990]
      .map(x=>orb(x,lookup(x)-32)),
    springs:[{x:1840,y:394,w:36,h:15,powerX:540,powerY:-700},
      {x:7650,y:449,w:36,h:15,powerX:525,powerY:-690},
      {x:14830,y:359,w:36,h:15,powerX:560,powerY:-720}],
    boostPads:[],
    spikes:[3100,4160,6810,8640,11030,12950,14270,16140]
      .map(x=>({x,y:lookup(x)-22,w:60,h:22})),
    pulseGates:[{x:7050,y:lookup(7050)-102,w:18,h:76,phase:.7,period:2.8,live:1.05},
      {x:14380,y:lookup(14380)-105,w:18,h:81,phase:1.2,period:2.7,live:1}],
    memoryCores:[{x:2820,y:277,r:13,id:0,active:true},
      {x:9860,y:225,r:13,id:1,active:true},
      {x:15800,y:267,r:13,id:2,active:true}],
    pits
  };
}
// Rebuild Prism Canyon as a main stage: preserve the tested foundation, then
// add progressively harder landings, enemy combinations and upper risk routes.
export function createStageTwoWorld({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H,guardian}) {
  const world=createStageTwoWorldOriginal({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H});
  const additions=[
    [17600,360,18820,360],[19050,400,21350,395],
    [21600,420,23340,420],[23590,445,25700,360],
    [25940,410,27980,410],[28230,440,30140,365],
    [30390,400,32070,435],[32320,410,34000,410]
  ];
  const ground=[];
  for(const [x1,y1,x2,y2] of additions){
    if(y1===y2)ground.push(track(x1,y1,x2,y2,"canyon"));
    else {
      const middle=x1+Math.min(700,(x2-x1)*.42);
      ground.push(track(x1,y1,middle,y2,y2<y1?"rise":"drop"));
      ground.push(track(middle,y2,x2,y2,"canyon"));
    }
  }
  const groundY2=x=>{
    const f=ground.find(q=>x>=q.x1&&x<=q.x2);
    return f?yOnTrack(f,x):null;
  };
  const highs=[
    [18330,275,18980],[20580,292,21250],[22830,320,23540],
    [25370,263,26040],[27500,300,28220],[29520,271,30280],
    [31620,315,32320],[32930,290,33500]
  ].map(([start,y,end])=>track(start,y,end,y,"platform"));
  const moving=[
    [18790,285,175,88,.88,.4],[23300,324,170,105,.9,1.2],
    [27970,307,180,95,1.02,.7],[31940,300,175,92,1.06,1.4]
  ].map(([x,y,width,swing,speed,phase])=>{
    const p=track(x,y,x+width,y,"moving");
    p.originX=x-Math.sin(phase)*swing;
    p.swing=swing;p.speed=speed;p.phase=phase;return p;
  });
  world.tracks.push(...ground,...highs,...moving);
  world.worldW=34000;
  world.goal={x:33820,y:338,w:55,h:72};
  world.pits.push(...additions.slice(0,-1).map((v,i)=>[v[2],additions[i+1][0]]));
  world.chapters=[
    {x:0,title:"01 / ENTRADA NO CANION"},
    {x:3800,title:"02 / PLATAFORMAS DE PRECISAO"},
    {x:7600,title:"03 / SALTOS EM SEQUENCIA"},
    {x:11400,title:"04 / CAMINHOS ELEVADOS"},
    {x:15100,title:"05 / GAUNTLET DE INIMIGOS"},
    {x:18700,title:"06 / PLATAFORMAS MOVEIS"},
    {x:22800,title:"07 / ENERGIA E CONTROLE"},
    {x:27000,title:"08 / RITMO ALTO"},
    {x:31100,title:"09 / DESAFIO FINAL"}
  ];
  world.signs.push(...[
    [18120,"NOVA ESCALADA","PREPARE A ATERRISSAGEM"],
    [20450,"DUAS ROTAS","VIA ALTA TEM MAIS CRISTAIS"],
    [22570,"SENTINELAS","PULO OU BOOST"],
    [25000,"PLATAFORMAS","OLHE ANTES DE SALTAR"],
    [27520,"CORREDOR RAPIDO","SLIDE E SALTO"],
    [28480,"RECARREGUE","ORBE ANTES DO PORTAO"],
    [29460,"VIGIAS DO CANION","DESVIE DOS DRONES"],
    [31190,"ULTIMA PROVA","MOMENTO EXATO DO PULO"],
    [32800,"GUARDIAO DO PRISMA","SALTE / DESLIZE / USE BOOST"]
  ].map(([x,title,hint])=>({x,title,hint})));
  world.checkpoints.push(...[19400,23850,28510,32570].map(x=>({
    x,y:groundY2(x)-PLAYER_RADIUS,active:false
  })));
  const robots=[
    [18160,"walker",85],[19900,"drone",88],[20780,"sentry",0],
    [21840,"walker",85],[22600,"drone",90],[24320,"sentry",0],
    [25030,"walker",90],[26400,"drone",80],[27220,"sentry",0],
    [27690,"walker",95],[29060,"drone",80],[29730,"sentry",0],
    [30740,"walker",85],[31590,"drone",88],[33180,"sentry",0],
    [33590,"walker",70]
  ];
  for(const [x,type,patrol] of robots){
    const bad=enemy(x,groundY2(x)-(type==="drone"?48:2),patrol);
    bad.type=type;bad.w=type==="sentry"?46:42;
    bad.h=type==="drone"?25:type==="sentry"?38:28;
    world.enemies.push(bad);
  }
  for(const start of [17820,19300,20100,21780,22580,23910,
    24610,25500,26530,27090,28560,29450,30720,32600,33200]){
    for(let i=0;i<9;i++){
      const x=start+i*58,y=groundY2(x);
      if(y!==null)world.rings.push({x,y:y-33-12*Math.sin(i/8*Math.PI),r:8,active:true});
    }
  }
  world.boostOrbs.push(...[18060,19260,21000,22400,23900,26120,
    28420,28620,29010,30700,32830,33030].map(x=>orb(x,groundY2(x)-32)));
  world.walls.push(rect(28960,291,44,74,"break-gate"));
  world.tunnels.push({x:22100,w:310,ground:420},
    {x:26670,w:260,ground:410},{x:32600,w:260,ground:410});
  world.springs.push({x:18720,y:345,w:36,h:15,powerX:535,powerY:-700},
    {x:25610,y:345,w:36,h:15,powerX:540,powerY:-710},
    {x:31870,y:395,w:36,h:15,powerX:550,powerY:-715});
  world.spikes.push(...[20300,22000,24920,26540,27630,28780,
    30680,32910].map(x=>({x,y:groundY2(x)-22,w:62,h:22})));
  world.pulseGates.push(...[20870,27170,31400].map((x,i)=>({
    x,y:groundY2(x)-104,w:18,h:79,phase:i*.56+.4,period:2.8,live:1.03
  })));
  // An isolated 960px boss chamber: no common enemies, signs, rings, spikes,
  // tunnels, springs, moving platforms or original boost pickups inside it.
  // The full-length ground stays flat at y=410.
  const chamberStart=guardian.arenaLeft-10;
  for(const key of ["enemies","rings","spikes","tunnels","springs","signs",
    "boostOrbs","pulseGates","memoryCores"]){
    world[key]=world[key].filter(item=>(item.x??0)<chamberStart);
  }
  world.tracks=world.tracks.filter(t=>t.kind!=="platform"&&t.kind!=="moving"||
    t.x1<chamberStart);
  world.tracks.push(
    track(32850,320,33050,320,"boss-platform"),
    track(33115,269,33325,269,"boss-platform"),
    track(33435,308,33610,308,"boss-platform")
  );
  world.signs.push({x:32450,title:"GUARDIÃO ADIANTE",
    hint:"ARENA ISOLADA · PREPARE O BOOST"});
  world.memoryCores=[
    {x:2820,y:277,r:13,id:0,active:true},
    {x:9860,y:225,r:13,id:1,active:true},
    {x:15800,y:267,r:13,id:2,active:true}
  ];
  return world;
}

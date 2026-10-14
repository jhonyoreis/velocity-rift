// Eight chapters alternate flowing runs, waterfall crossings and broken aqueducts.
export const SANCTUARY={entrance:3300,ruins:7200,cascades:11100,bridge:15800,aqueduct:19800,greatFalls:23800,fractures:28200,arenaLeft:34800,arenaRight:35760,guardianX:35450,exit:36200};
export function createCanyonTwoWorld({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H}){
 const points=[[0,420],[850,420],[1700,485],[2450,485],[3200,415],[4250,415],[4900,475],[5750,475],[6500,410],[7350,410],[8050,475],[8850,475],[9550,400],[10350,400],[11100,410],
 [11600,410],[12000,370],[12600,370],[13100,430],[13600,430],[14400,380],[14900,380],[15500,450],[16100,450],[18100,450],[18600,400],[19300,400],[19800,445],
 [20600,445],[21100,390],[22100,390],[22600,445],[23300,445],[24000,425],[26600,425],[27200,370],[27800,370],[28400,430],[28600,430],[31200,430],[32000,370],[32600,370],[33200,430],[33900,430],[34400,410],[36800,410]];
 const contour=points.slice(1).map((p,i)=>track(...points[i],...p,'cave-floor'));
 const floor=x=>{const t=contour.find(t=>x>=t.x1&&x<=t.x2);return t?yOnTrack(t,x):410;};
 const pits=[[1550,1780],[4700,4930],[9200,9440],[12100,12400],[13600,13920],[14900,15170],[16300,18000],[18920,19220],[21500,21790],[22900,23180],[24200,26400],[27620,27890],[28700,31000],[32100,32410],[33300,33600]];
 // Physically remove the floor in every waterfall. No invisible rescue plane.
 const tracks=[];
 for(const t of contour){let segments=[[t.x1,t.x2]];for(const [a,b] of pits)segments=segments.flatMap(([l,r])=>b<=l||a>=r?[[l,r]]:[[l,Math.min(a,r)],[Math.max(b,l),r]].filter(([u,v])=>v>u));for(const [a,b] of segments)tracks.push(track(a,floor(a),b,floor(b),'cave-floor'));}
 const highs=[[1880,2150,355],[3510,3800,290],[5210,5550,345],[7400,7770,305],[8110,8400,350],[8690,9040,345],[9700,10050,275],[10550,10920,290],[12800,13050,290],[14200,14520,275],[18350,18520,300],[20100,20400,310],[22280,22450,305],[26800,27100,280],[31500,31750,300],[33800,34100,305]];
 for(const [a,b,y] of highs)tracks.push(track(a,y,b,y,'platform'));
 for(const [x,y,w,swing,phase] of [[7860,325,170,60,.3],[8500,340,180,72,1.4],[10100,290,180,60,.8],[17770,395,210,35,0],[26110,385,240,35,0]]){
  const p=track(x,y,x+w,y,'moving');Object.assign(p,{originX:x-Math.sin(phase)*swing,swing,speed:.85,phase});tracks.push(p);
 }
 // Mandatory stepping stones: readable landing widths and progressively higher jumps.
 const stepping=[[16430,16670,395],[16870,17120,340],[17330,17590,375],[24330,24580,400],[24770,25030,340],[25230,25490,370],[25690,25950,320],
 [28820,29070,390],[29250,29500,350],[29700,29960,385],[30160,30420,330],[30610,30880,380]];
 for(const [a,b,y] of stepping)tracks.push(track(a,y,b,y,a>=28700?'cave-crumble':'cave-bridge'));
 const shift=SANCTUARY.arenaLeft-11800;
 tracks.push(track(11940+shift,320,12140+shift,320,'boss-platform'),track(12205+shift,330,12415+shift,330,'boss-platform'),track(12525+shift,308,12700+shift,308,'boss-platform'));
 const inPit=x=>pits.some(([a,b])=>x>a&&x<b);
 const landingSafe=x=>pits.every(([a,b])=>x<a-150||x>b+180);
 const rings=[];
 for(const [a,n] of [[210,9],[1850,5],[2510,7],[3040,4],[4040,4],[5000,6],[5870,6],[6640,6],[7130,4],[9050,5],[11140,6],[11700,5],[12620,5],[13250,5],[14580,4],[15350,5],[15820,6],[18160,5],[19450,5],[19950,4],[20800,5],[21860,6],[23400,6],[23800,4],[26500,6],[27920,5],[28330,4],[31120,6],[31830,4],[32600,7],[33700,5],[34300,5],[34640,3],[35870,6],[36400,6]])for(let i=0;i<n;i+=2){const x=a+i*46;if(!inPit(x))rings.push({x,y:floor(x)-35-14*Math.sin(i/(n-1)*Math.PI),r:8,active:true});}
 for(const [a,b,y] of [...highs,...stepping])for(let x=a+35;x<b-20;x+=92)rings.push({x,y:y-34,r:8,active:true});
 // Arcs teach the takeoff and landing before the first deadly crossing.
 for(const [a,b] of pits.filter(([a,b])=>b-a<500)){
  // Keep the first two tutorial arcs fully readable; thin later rewards.
  const count=a<5000?7:5;
  for(let i=0;i<count;i++){const t=i/(count-1),x=a-55+(b-a+110)*t;rings.push({x,y:floor(x)-36-Math.sin(t*Math.PI)*85,r:8,active:true});}
 }
 // Recovery reserves are concentrated at the final Guardian approach and arena,
 // rather than flooding the entire canyon with collectibles.
 for(let x=33760;x<34800;x+=80){
  if(!inPit(x))rings.push({x,y:floor(x)-35,r:8,active:true});
 }
 for(let x=34840;x<35750;x+=100){
  rings.push({x,y:floor(x)-48,r:8,active:true});
 }
 const fallingCrystals=[1100,1390,2800,4330,6020,6250,6900,11000,11480,13020,13200,15720,18300,18510,19680,20520,20700,22020,23650,26900,27100,28180,31420,32900,33950].filter(x=>!inPit(x)).map((x,i)=>({x,ceiling:floor(x)-250,floor:floor(x),width:42,height:88,trigger:180,delay:i===0?1.05:.9}));
 const refractors=[3350,5650,8870,10300,12750,14600,18250,20200,22300,26700,28000,31600,33000].map((x,i)=>({x,floor:floor(x),phase:(i*1.1)%4.4}));
 const enemySpecs=[[690,'walker'],[2040,'drone'],[2640,'walker'],[3750,'drone'],[5380,'walker'],[6770,'walker'],[7370,'drone'],[8250,'sentry'],[9800,'drone'],[10870,'walker'],
 [11720,'walker'],[12860,'drone'],[13380,'sentry'],[14470,'walker'],[15600,'drone'],[18230,'walker'],[18570,'drone'],[19440,'sentry'],[20140,'walker'],[20750,'drone'],[21980,'walker'],[22480,'sentry'],[23470,'drone'],[23900,'walker'],[26800,'drone'],[27260,'walker'],[28100,'sentry'],[28460,'walker'],[31300,'drone'],[31900,'walker'],[32740,'sentry'],[33100,'walker'],[33790,'drone'],[34200,'walker']];
 return {worldW:36800,spawn:{x:100,y:402},goal:{x:36570,y:338,w:55,h:72},tracks,rings,fallingCrystals,refractors,pits,
 waterfalls:pits.map(([left,right],i)=>({left,right,leftY:floor(left),rightY:floor(right),wide:right-left>500,seed:i})),
 chapters:[{x:0,title:'CÂNION PRISMA 2 / SOB A PEDRA'},{x:3000,title:'02 / GALERIA DA LUZ PARTIDA'},{x:7200,title:'03 / SANTUÁRIO SUSPENSO'},{x:11100,title:'04 / CATEDRAL DAS ÁGUAS'},{x:15800,title:'05 / A PONTE PARTIDA'},{x:19800,title:'06 / AQUEDUTOS ESQUECIDOS'},{x:23800,title:'07 / AS GRANDES CATARATAS'},{x:28200,title:'08 / PONTES DE VIDRO'},{x:34300,title:'09 / CORAÇÃO DO PRISMA'},{x:35900,title:'10 / O SILÊNCIO DEPOIS DA LUZ'}],
 signs:[{x:300,title:'SANTUÁRIO DA REFRAÇÃO',hint:'A LUZ ENCONTROU OUTRO CAMINHO'},{x:790,title:'CRISTAIS INSTÁVEIS',hint:'RACHOU? SAIA DA MARCA NO CHÃO'},{x:1250,title:'CACHOEIRAS SEM FUNDO',hint:'SALTE · CAIR NA ÁGUA É FATAL'},{x:3030,title:'LUZ PARTIDA',hint:'TRACEJADO AVISA · FEIXE MACHUCA'},{x:7110,title:'RUÍNAS SUSPENSAS',hint:'SIGA OS CRISTAIS PELO ALTO'},{x:11400,title:'CATEDRAL DAS ÁGUAS',hint:'OBSERVE A PRÓXIMA MARGEM'},{x:15850,title:'A PONTE PARTIDA',hint:'FREIE PARA POUSAR · SALTE DE NOVO'},{x:19800,title:'AQUEDUTOS',hint:'SLIDE · SOLTE · SALTE'},{x:23740,title:'AS GRANDES CATARATAS',hint:'CADA PILAR É UMA ATERRISSAGEM'},{x:28330,title:'PONTES DE VIDRO',hint:'RACHOU SOB OS PÉS? SALTE LOGO'},{x:31200,title:'ÚLTIMA TRAVESSIA',hint:'CONTROLE O RITMO'},{x:34450,title:'GUARDIÃO DO PRISMA',hint:'DESVIE DO LASER · ATINJA O NÚCLEO'},{x:36100,title:'O PRISMA RESPIRA',hint:'A FENDA ESTÁ LIVRE'}],
 checkpoints:[2460,5010,7110,9630,11530,14050,15940,18120,21000,23300,23950,26520,28540,31120,33700,34530,35900].map(x=>({x,y:floor(x)-PLAYER_RADIUS,active:false,boss:x===34530})),
 walls:[rect(-120,0,120,WORLD_H,'left-wall'),...[6550,15470,22800,32840].map(x=>rect(x,floor(x)-80,38,80,'break-gate'))],
 tunnels:[[2330,120],[4100,120],[7040,130],[11200,150],[13420,130],[18700,120],[21200,120],[22620,120],[27300,90],[32500,130]].map(([x,w])=>({x,w,ground:floor(x)})),
 enemies:enemySpecs.filter(([x])=>!inPit(x)).map(([x,type])=>{const b=enemy(x,floor(x)-(type==='drone'?70:2),type==='sentry'?0:35);return {...b,type,w:type==='sentry'?46:42,h:type==='drone'?25:type==='sentry'?38:28,crystalline:true};}),
 boostOrbs:[580,1850,2990,4120,5120,6370,7270,8540,9670,11200,11610,12550,14050,15350,15880,18160,19400,21050,21870,22400,22600,23370,23950,26570,28270,28560,31170,32000,32620,34370,34610,35920].filter(x=>!inPit(x)).map(x=>orb(x,floor(x)-32)),
 springs:[],boostPads:[],spikes:[{x:5140,w:65},{x:7950,w:68},{x:10030,w:65},{x:11850,w:65},{x:13070,w:75},{x:19520,w:75},{x:20680,w:70},{x:22240,w:70},{x:23580,w:75},{x:27890,w:65},{x:31780,w:70},{x:34180,w:65}].filter(s=>landingSafe(s.x)).map(s=>({...s,y:floor(s.x)-22,h:22})),
 pulseGates:[20480,27080,33400].filter(x=>!inPit(x)).map((x,i)=>({x,y:floor(x)-115,w:18,h:93,period:3.5,live:.85,phase:i*.8})),memoryCores:[],secretTrials:[]};
}
// The Guardian now concludes the second part. Preserve part one's extras.
export function prepareCanyonOne(world){
 world.worldW=32700;world.goal={x:32580,y:338,w:55,h:72};
 world.tracks=world.tracks.filter(t=>t.kind!=='boss-platform').map(t=>t.x2>32700?{...t,x2:32700}:t).filter(t=>t.x1<32700);
 for(const key of ['enemies','rings','spikes','tunnels','springs','boostOrbs','pulseGates','checkpoints'])world[key]=world[key].filter(o=>o.x<32400);
 world.signs=world.signs.filter(o=>o.x<32400);world.signs.push({x:32290,title:'O CAMINHO CONTINUA',hint:'DESÇA AO SANTUÁRIO DA REFRAÇÃO'});
 return world;
}

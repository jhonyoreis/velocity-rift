// A continuous lower trail catches missed jumps; elevated ruins reward control.
export const SANCTUARY={entrance:3300,ruins:7200,arenaLeft:11800,arenaRight:12760,guardianX:12450,exit:13200};
export function createCanyonTwoWorld({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H}){
 const points=[[0,420],[850,420],[1700,485],[2450,485],[3200,415],[4250,415],[4900,475],[5750,475],[6500,410],[7350,410],[8050,475],[8850,475],[9550,400],[10350,400],[11100,410],[13800,410]];
 const tracks=points.slice(1).map((p,i)=>track(...points[i],...p,'cave-floor'));
 const floor=x=>yOnTrack(tracks.find(t=>x>=t.x1&&x<=t.x2),x);
 const highs=[[1880,2150,355],[3510,3800,290],[5210,5550,345],[7400,7770,305],[8110,8400,350],[8690,9040,345],[9700,10050,275],[10550,10920,290]];
 for(const [a,b,y] of highs)tracks.push(track(a,y,b,y,'platform'));
 for(const [x,y,w,swing,phase] of [[7860,325,170,60,.3],[8500,340,180,72,1.4],[10100,290,180,60,.8]]){
  const p=track(x,y,x+w,y,'moving');Object.assign(p,{originX:x-Math.sin(phase)*swing,swing,speed:.85,phase});tracks.push(p);
 }
 tracks.push(track(11940,320,12140,320,'boss-platform'),track(12205,330,12415,330,'boss-platform'),track(12525,308,12700,308,'boss-platform'));
 const rings=[];
 for(const [a,n] of [[210,9],[1570,5],[2510,7],[3040,4],[4040,4],[4690,6],[5870,6],[6640,6],[7130,4],[9050,5],[11140,6],[11640,3],[12870,6],[13400,6]])for(let i=0;i<n;i++){const x=a+i*46;rings.push({x,y:floor(x)-35-14*Math.sin(i/(n-1)*Math.PI),r:8,active:true});}
 for(const [a,b,y] of highs)for(let x=a+30;x<b-10;x+=58)rings.push({x,y:y-34,r:8,active:true});
 const fallingCrystals=[1100,1390,2800,4330,4580,6020,6250,6900,9260,9480,11000].map((x,i)=>({x,ceiling:100+(i%3)*15,floor:floor(x),width:42,height:88,trigger:180,delay:i===0?1.05:.9}));
 const refractors=[{x:3350,floor:floor(3350),phase:0},{x:5650,floor:floor(5650),phase:1.1},{x:8870,floor:floor(8870),phase:2.2},{x:10300,floor:floor(10300),phase:.5}];
 return {worldW:13800,spawn:{x:100,y:402},goal:{x:13570,y:338,w:55,h:72},tracks,rings,fallingCrystals,refractors,
 chapters:[{x:0,title:'CÂNION PRISMA 2 / SOB A PEDRA'},{x:3000,title:'02 / GALERIA DA LUZ PARTIDA'},{x:7200,title:'03 / SANTUÁRIO SUSPENSO'},{x:11200,title:'04 / CORAÇÃO DO PRISMA'},{x:12900,title:'05 / O SILÊNCIO DEPOIS DA LUZ'}],
 signs:[{x:300,title:'SANTUÁRIO DA REFRAÇÃO',hint:'A LUZ ENCONTROU OUTRO CAMINHO'},{x:790,title:'CRISTAIS INSTÁVEIS',hint:'RACHOU? SAIA DA MARCA NO CHÃO'},{x:1750,title:'DUAS ROTAS',hint:'O CAMINHO ALTO GUARDA CRISTAIS'},{x:3030,title:'LUZ PARTIDA',hint:'TRACEJADO AVISA · FEIXE MACHUCA'},{x:7110,title:'RUÍNAS SUSPENSAS',hint:'SIGA OS CRISTAIS PELO ALTO'},{x:11450,title:'GUARDIÃO DO PRISMA',hint:'DESVIE DO LASER · ATINJA O NÚCLEO'},{x:13100,title:'O PRISMA RESPIRA',hint:'A FENDA ESTÁ LIVRE'}],
 checkpoints:[2460,5010,7110,9630,11530,12900].map(x=>({x,y:floor(x)-PLAYER_RADIUS,active:false,boss:x===11530})),
 walls:[rect(-120,0,120,WORLD_H,'left-wall'),rect(6550,floor(6550)-80,38,80,'break-gate')],
 tunnels:[{x:2330,w:120,ground:floor(2330)},{x:4100,w:120,ground:floor(4100)},{x:7040,w:130,ground:floor(7040)},{x:11200,w:150,ground:floor(11200)}],
 enemies:[[690,'walker'],[2040,'drone'],[2640,'walker'],[3750,'drone'],[4850,'sentry'],[5380,'walker'],[6770,'walker'],[7370,'drone'],[8250,'sentry'],[9800,'drone'],[10870,'walker']].map(([x,type])=>{const b=enemy(x,floor(x)-(type==='drone'?70:2),type==='sentry'?0:35);return {...b,type,w:type==='sentry'?46:42,h:type==='drone'?25:type==='sentry'?38:28,crystalline:true};}),
 boostOrbs:[580,1790,2990,4120,5120,6370,7270,8540,9670,11200,11610,12920].map(x=>orb(x,floor(x)-32)),
 springs:[],boostPads:[],spikes:[{x:5140,w:65},{x:7950,w:68},{x:10030,w:65}].map(s=>({...s,y:floor(s.x)-22,h:22})),pulseGates:[],memoryCores:[],secretTrials:[],pits:[]};
}
// The Guardian now concludes the second part. Preserve part one's extras.
export function prepareCanyonOne(world){
 world.worldW=32700;world.goal={x:32580,y:338,w:55,h:72};
 world.tracks=world.tracks.filter(t=>t.kind!=='boss-platform').map(t=>t.x2>32700?{...t,x2:32700}:t).filter(t=>t.x1<32700);
 for(const key of ['enemies','rings','spikes','tunnels','springs','boostOrbs','pulseGates','checkpoints'])world[key]=world[key].filter(o=>o.x<32400);
 world.signs=world.signs.filter(o=>o.x<32400);world.signs.push({x:32290,title:'O CAMINHO CONTINUA',hint:'DESÇA AO SANTUÁRIO DA REFRAÇÃO'});
 return world;
}

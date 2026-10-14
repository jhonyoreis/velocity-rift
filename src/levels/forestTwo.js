import {circleRect} from "../game/geometry.js";

// Both routes share continuous ground. A missed canopy jump returns Flux to
// the slower machinery route; only a real crush is instantly fatal.
export const FACTORY={yard:6500,entrance:11200,assembly:15100,greenhouse:18500,canopy:22000,reactor:25000,arenaLeft:30400,arenaRight:31400,exit:32100};
export function createForestTwoWorld({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H}){
 const points=[[0,430],[1150,430],[1850,360],[2600,360],[3300,450],[4200,450],[4900,380],[5600,380],[6200,450],[6900,450],[7600,420],[11200,420],[12000,450],[15100,450],[15800,395],[17000,395],[17700,450],[19300,450],[20000,400],[21300,400],[22000,455],[23700,455],[24400,400],[25500,400],[26100,450],[28200,450],[28900,430],[31500,430],[32100,460],[34000,460]];
 const base=points.slice(1).map((p,i)=>track(...points[i],...p,points[i][0]<6500||points[i][0]>=32100?'ancient-root':'factory-floor'));
 const floorAt=x=>yOnTrack(base.find(t=>x>=t.x1&&x<=t.x2),x);
 const belts=[[7800,8270,-140],[9440,9950,155],[12200,12700,-165],[14000,14500,150],[16100,16600,-175],[17800,18250,145],[26300,26800,-180],[28280,28720,165]];
 const tracks=[];
 for(const t of base){
  const cuts=[t.x1,...belts.flatMap(b=>b.slice(0,2)).filter(x=>x>t.x1&&x<t.x2),t.x2].sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++){const a=cuts[i-1],b=cuts[i],belt=belts.find(v=>(a+b)/2>=v[0]&&(a+b)/2<=v[1]);tracks.push({...track(a,yOnTrack(t,a),b,yOnTrack(t,b),belt?'factory-belt':t.kind),...(belt?{belt:belt[2]}:{})});}
 }
 const ledges=[
  [2050,2450,252,'root-branch'],[3500,3890,328,'root-branch'],[4180,4460,330,'root-branch'],[4630,4930,255,'root-branch'],[5100,5390,245,'root-branch'],[5570,5850,305,'root-branch'],
  [7750,8070,305],[8430,8730,292],[9390,9750,310],[10120,10470,290],
  [12350,12720,325],[13340,13680,315],[14200,14600,320],[16030,16400,280],[17100,17450,305],
  [19060,19350,330,'root-branch'],[19500,19850,270,'root-branch'],[20100,20470,245,'root-branch'],[20700,21050,245,'root-branch'],[21240,21570,285,'root-branch'],
  [22260,22570,335,'root-branch'],[22750,23120,265,'root-branch'],[23300,23670,240,'root-branch'],[23850,24220,285,'root-branch'],
  [26300,26600,325],[27380,27700,320],[28420,28750,310],[29200,29550,315]
 ];
 for(const [a,b,y,kind='factory-catwalk'] of ledges)tracks.push({...track(a,y,b,y,kind),upper:true});
 for(const [x,y,w,swing,phase] of [[8830,320,230,34,0],[12900,330,230,32,2],[21690,340,220,32,1],[24600,300,240,35,2]])tracks.push({...track(x,y,x+w,y,'factory-lift'),upper:true,initialY:y,swing,phase,speed:.8});
 const tunnels=[[930,160],[2730,150],[6030,145],[7060,145],[10560,150],[11720,135],[14800,135],[16820,140],[18340,110],[20500,130],[21840,125],[24400,120],[25570,135],[27900,130],[29900,150]].map(([x,w])=>({x,w,ground:floorAt(x)}));
 const presses=[3690,12500,13480,14400,16200,17300,26600,27520,28620,29580].map((x,i)=>({x,y:floorAt(x),w:i>6?108:94,phase:(i*.73)%3.8,period:3.8}));
 const cargoLoads=[8090,8710,9720,10240,13100,18000,25790,28980].map((x,i)=>({x,floor:floorAt(x),w:88+(i%2)*12,h:74,trigger:290,delay:1.05}));
 const vents=[5180,15380,17620,18850,19800,21120,22500,23550,24100,26980,29120].map((x,i)=>({x,y:floorAt(x),w:66,h:84,period:4.4,phase:i*.61,kind:x>=18500&&x<25000?'spore':'steam'}));
 const spikes=[1540,3140,4430,5580,7380,9170,10870,13690,15550,19340,23000,24920,27200,29750].map((x,i)=>({x,y:floorAt(x)-22,w:72+(i%3)*12,h:22}));
 const pulseGates=[2520,5740,8990,13880,15780,20900,23900,26160].map((x,i)=>({x,y:floorAt(x)-104,w:18,h:82,period:3.8,live:.8,phase:i*.65}));
 const walkers=[740,1960,2940,3970,4920,6300,6810,7630,9260,11000,11480,12100,14700,15930,18580,20020,22100,23200,25280,27800,30130];
 const enemies=walkers.map((x,i)=>({...enemy(x,floorAt(x)-3,18+i%3*9),weathered:true}));
 for(const [x,y] of [[4290,255],[5300,280],[8500,240],[10050,275],[12860,285],[17030,260],[19660,215],[21400,235],[22830,210],[24680,240],[26420,270],[29300,250]])enemies.push({...enemy(x,y,32),type:'drone',weathered:true});
 for(const x of [10000,13280,17470,20200,23680,27070,29020])enemies.push({...enemy(x,floorAt(x)-3,0),w:42,h:43,type:'sentry',weathered:true,shotTimer:1.3});
 const checkpoints=[2900,5900,7530,10500,11980,15100,17720,18620,21980,25060,26220,28070,30090,31570,32900].map(x=>({x,y:floorAt(x)-PLAYER_RADIUS,active:false,boss:x===30090}));
 const rings=[];
 for(const start of [230,1270,2810,3370,4030,5930,6320,7560,9200,10690,11400,12040,14730,15120,17740,18640,20020,22020,23150,25020,26230,28080,30120,31590,32500,33100])for(let i=0;i<6;i++){const x=start+i*43;rings.push({x,y:floorAt(x)-29-Math.sin(i/5*Math.PI)*12,r:8,active:true});}
 for(const t of tracks.filter(t=>t.upper&&t.kind!=='factory-lift'))for(let x=t.x1+38;x<t.x2-20;x+=65)rings.push({x,y:t.y1-30,r:8,active:true});
 const boostOrbs=[590,1770,3280,4110,5450,6300,7550,8390,10110,11010,11930,12910,14630,15150,17520,18680,20100,21760,22200,24310,25120,26250,27740,28830,30190,31600].map(x=>orb(x,floorAt(x)-35));
 return {worldW:34000,spawn:{x:100,y:412},goal:{x:33780,y:370,w:65,h:90},tracks,rings,boostOrbs,enemies,checkpoints,tunnels,presses,cargoLoads,vents,
  chapters:[{x:0,title:'01 / RAÍZES COLOSSAIS'},{x:3300,title:'02 / A MATA RETOMA O AÇO'},{x:6500,title:'03 / PÁTIO DOS GIGANTES'},{x:11200,title:'04 / A FÁBRICA DESPERTA'},{x:15100,title:'05 / SINFONIA DE PISTÕES'},{x:18500,title:'06 / JARDINS SOB O VIDRO'},{x:22000,title:'07 / COPAS DE BIOLUZ'},{x:25000,title:'08 / AS VEIAS DO REATOR'},{x:30100,title:'09 / O ÚLTIMO TURBILHÃO'},{x:32100,title:'10 / A FLORESTA RESPIRA'}],
  signs:[{x:420,title:'RAÍZES DO AMANHÃ',hint:'A FLORESTA ESCONDE CAMINHOS'},{x:2040,title:'POR CIMA DAS RAÍZES',hint:'SALTE · SIGA OS CRISTAIS'},{x:3370,title:'PRENSA ATIVA',hint:'ÂMBAR AVISA · ESMAGA AO FECHAR'},{x:6600,title:'PÁTIO DE CARGA',hint:'ESTEIRAS MUDAM O SEU RITMO'},{x:7760,title:'CARGA SUSPENSA',hint:'AFASTE-SE AO VER O AVISO'},{x:11300,title:'HELIX / LINHA 07',hint:'AS MÁQUINAS ACORDARAM'},{x:15120,title:'SINFONIA DE PISTÕES',hint:'ESPERE · ATRAVESSE NA ABERTURA'},{x:18630,title:'JARDINS SOB O VIDRO',hint:'ESPOROS BRILHAM ANTES DA DESCARGA'},{x:22000,title:'DOIS CAMINHOS',hint:'COPAS RÁPIDAS · CHÃO SEGURO'},{x:25100,title:'REATOR EM CARGA',hint:'ALTERNE SLIDE, SALTO E BOOST'},{x:30140,title:'TITÃ HELIX',hint:'SALTE NO REATOR QUANDO ABRIR'},{x:32400,title:'O SILÊNCIO DA MATA',hint:'A FENDA ESTÁ LOGO ADIANTE'}],
  walls:[rect(-120,0,120,WORLD_H,'left-wall'),...[11100,18480,25390,30290].map(x=>rect(x,floorAt(x)-190,38,190,'break-gate'))],
  springs:[],boostPads:[],spikes,pulseGates,memoryCores:[],secretTrials:[],pits:[]
 };
}
// Long readable charge, brief impact, then a generous safe crossing window.
export function pressState(press,time){const t=((time+press.phase)%press.period+press.period)%press.period;return {warning:t>=1.5&&t<2.25,active:t>=2.25&&t<2.7,extension:t<2.25?0:t<2.4?Math.min(1,(t-2.25)/.15):t<2.7?1:Math.max(0,1-(t-2.7)/.65)};}
export function pressCrushes(press,time,player,radius=18){
 const state=pressState(press,time);
 if(!state.active||state.extension<.9)return false;
 const top=press.y-185+145*state.extension;
 return circleRect(player.x,player.y,radius,{x:press.x-press.w/2,y:top,w:press.w,h:press.y-top});
}

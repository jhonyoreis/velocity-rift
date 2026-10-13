import {circleRect} from "../game/geometry.js";
// A continuous forest floor becomes an abandoned turbine hall. Upper paths
// offer speed and crystals; missing a jump returns to the lower route.
export const FACTORY={entrance:6100,arenaLeft:11200,arenaRight:12200,exit:12900};
export function createForestTwoWorld({track,rect,enemy,orb,yOnTrack,PLAYER_RADIUS,WORLD_H}){
 const points=[[0,430],[1150,430],[1850,360],[2600,360],[3300,450],[4200,450],[4900,380],[5600,380],[6200,450],[7200,450],[7750,390],[8500,390],[9100,450],[10300,450],[10900,430],[12500,430],[13200,460],[14200,460]];
 const tracks=points.slice(1).map((p,i)=>track(...points[i],...p,i<8?'ancient-root':'factory-floor'));
 const floorAt=x=>{const t=tracks.find(t=>x>=t.x1&&x<=t.x2);return yOnTrack(t,x);};
 // Reachable by an ordinary jump, and all have a safe floor underneath.
 for(const [a,b,y] of [[2050,2470,252],[3620,4020,322],[4330,4720,290],[6670,7100,310],[7860,8280,260],[9460,9820,318],[10040,10420,298]])tracks.push(track(a,y,b,y,'factory-catwalk'));
 const rings=[];
 for(const [start,count,step] of [[230,8,50],[1270,6,58],[2730,7,54],[3410,4,54],[5060,6,52],[5850,5,42],[6310,5,46],[7320,5,45],[8620,5,46],[9240,4,44],[10600,5,42],[11080,3,36],[12400,5,48],[13400,10,48]])for(let i=0;i<count;i++){const x=start+i*step;rings.push({x,y:floorAt(x)-35-Math.sin(i/(count-1)*Math.PI)*25,r:8,active:true});}
 for(const t of tracks.filter(t=>t.kind==='factory-catwalk'))for(let x=t.x1+40;x<t.x2-20;x+=64)rings.push({x,y:t.y1-34,r:8,active:true});
 const spikes=[{x:1540,w:72},{x:3040,w:90},{x:4430,w:105},{x:6980,w:100},{x:8790,w:92},{x:9920,w:110}].map(s=>({...s,y:floorAt(s.x)-22,h:22}));
 const pulseGates=[2520,5320,7460,8390,10270].map((x,i)=>({x,y:floorAt(x)-112,w:18,h:90,period:3.25,live:.95,phase:i*.65}));
 return {worldW:14200,spawn:{x:100,y:412},goal:{x:14000,y:370,w:65,h:90},tracks,
  chapters:[{x:0,title:'FLORESTA NEON 2 / RAÍZES GIGANTES'},{x:3300,title:'02 / A MATA RETOMA O AÇO'},{x:6100,title:'03 / FÁBRICA HELIX'},{x:8500,title:'04 / CORAÇÃO MECÂNICO'},{x:11000,title:'05 / O ÚLTIMO TURBILHÃO'},{x:12900,title:'06 / O AR LÁ FORA'}],
  signs:[{x:450,title:'RAÍZES DO AMANHÃ',hint:'SIGA PARA A FÁBRICA'},{x:2190,title:'ROTAS ALTAS',hint:'CRISTAIS GUIAM O SALTO'},{x:3550,title:'PRENSAS',hint:'OBSERVE A LUZ ÂMBAR'},{x:5730,title:'FÁBRICA HELIX',hint:'MÁQUINAS AINDA ATIVAS'},{x:6800,title:'LINHA DE MONTAGEM',hint:'ALTERNE SALTOS E SLIDE'},{x:11100,title:'TITÃ HELIX',hint:'SALTE NO REATOR QUANDO ABRIR'},{x:13280,title:'LIBERDADE',hint:'ATRAVESSE A FENDA'}],
  checkpoints:[2900,5670,8550,10980,12520].map(x=>({x,y:floorAt(x)-PLAYER_RADIUS,active:false,boss:x===10980})),
  walls:[rect(-120,0,120,WORLD_H,'left-wall'),rect(6020,376,38,74,'break-gate'),rect(10520,358,38,80,'break-gate')],
  tunnels:[{x:930,w:160,ground:430},{x:4670,w:220,ground:floorAt(4670)},{x:6460,w:170,ground:450},{x:8000,w:160,ground:390},{x:9540,w:185,ground:450}],
  enemies:[740,1960,2810,3910,5100,5550,6250,7190,7690,8530,9360,10680].map((x,i)=>({...enemy(x,floorAt(x)-3,i%2?40:22),weathered:true})),
  rings,boostOrbs:[590,1750,3230,4220,5500,5910,6800,7550,9170,10370,11010,12420].map(x=>orb(x,floorAt(x)-36)),
  springs:[],boostPads:[],spikes,pulseGates,memoryCores:[],secretTrials:[],pits:[],
  presses:[3690,6560,9010,9780].map((x,i)=>({x,y:floorAt(x),w:94,phase:i*.9,period:3.8})),
 };
}
// Long readable charge, brief impact, then a generous safe crossing window.
export function pressState(press,time){const t=(time+press.phase)%press.period;return {warning:t>=1.5&&t<2.25,active:t>=2.25&&t<2.7,extension:t<2.25?0:t<2.4?Math.min(1,(t-2.25)/.15):t<2.7?1:Math.max(0,1-(t-2.7)/.65)};}

// A fatal crush only occurs once the head closes against the solid floor.
export function pressCrushes(press,time,player,radius=18){
 const state=pressState(press,time);
 if(!state.active||state.extension<.9)return false;
 const top=press.y-185+145*state.extension;
 return circleRect(player.x,player.y,radius,{x:press.x-press.w/2,y:top,w:press.w,h:press.y-top});
}

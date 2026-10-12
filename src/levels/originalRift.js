// Final campaign: deliberate seals, pursuit, optional ascents and the Soberano throne.
export const RIFT_WORLD_WIDTH=48000;
export const RIFT_FINISH_X=47600;
export const RIFT_SECTORS=[
 {x:0,name:"ALTAR DOS NOVE NÚCLEOS",music:0},
 {x:700,name:"ESTILHAÇOS DA ORIGEM",music:0},
 {x:4250,name:"O CÉU É O CHÃO",music:1},
 {x:11200,name:"ENTRE DUAS REALIDADES",music:2},
 {x:15600,name:"AVALANCHE DE ÍMPETO",music:3},
 {x:20200,name:"A PERSEGUIÇÃO DO SOBERANO",music:4},
 {x:33000,name:"CATEDRAL DO PARADOXO",music:2},
 {x:40150,name:"O ÚLTIMO SELO",music:5},
 {x:43200,name:"TRONO DA RUPTURA",music:6}
];
export function riftSectorAt(x){return RIFT_SECTORS.findLast(s=>x>=s.x)||RIFT_SECTORS[0];}
export function createOriginalRiftLayout(){
 const platforms=[];
 const track=(x1,x2,y1,y2=y1,dimension=-1,orientation="floor",motion=0)=>{
  const p={id:platforms.length,x1,x2,y1,y2,dimension,orientation,motion};
  platforms.push(p);return p;
 };
 track(0,1200,440);track(1200,3200,440,650);track(3200,4250,650,500);
 track(4250,4720,500);track(4920,5420,470);track(5610,6260,500);
 track(6650,7850,170,170,-1,"ceiling");
 track(8050,9150,200,150,-1,"ceiling");track(9390,9950,150,150,-1,"ceiling");
 track(10180,11500,500);
 track(11500,12400,500,460,1);track(12590,13450,440,500,1);
 track(13450,13900,500);track(13900,14700,500,440,0);
 track(14890,15600,470);track(15600,15900,470);
 track(15900,17700,470,665);track(17700,19000,665,485);
 track(19000,19600,485);track(20150,20800,510);
 track(21000,21480,470,470,0,"floor",20);
 track(21670,22150,435,435,0,"floor",24);
 track(22350,23200,485,520);track(23200,24150,520,420,1);
 track(24340,24700,420,420,1);
 track(25050,26000,170,170,-1,"ceiling");
 track(26210,27100,200,285,1,"ceiling");
 track(27320,28300,245,155,1,"ceiling");
 track(28500,29200,190,190,-1,"ceiling");track(29550,30350,500);
 track(30350,31800,500,665);track(31800,33100,665,450);
 track(33100,33750,450);track(33960,34450,420,420,0,"floor",16);
 track(34650,35200,460,460,1);track(35720,36600,480);
 // Dimensional silhouettes: always drawn, only collide in their reality.
 track(11800,12300,310,310,0);track(14100,14500,285,285,1);
 track(23500,23800,280,280,0);track(26400,26900,425,425,0);
 // Replace the straight second half with pursuit, a seal cathedral and arena.
 for(let i=platforms.length-1;i>=0;i--)if(platforms[i].x1>=19600)platforms.splice(i,1);
 track(19550,20900,510);track(20900,23200,510,620);track(23200,25000,620,510);
 track(25000,27700,510,610);track(27700,30100,610,510);track(30100,33000,510);
 track(33000,34600,540);track(34800,36400,170,170,-1,"ceiling");
 track(36600,37850,190,190,-1,"ceiling");
 track(38170,39700,200,170,0,"ceiling");track(40150,41800,540);
 track(41800,42450,500,500,0,"floor",22);track(42650,48000,650);
 // Arena has walkable floor and ceiling, ledges and two linked tactical rifts.
 track(43200,47200,150,150,-1,"ceiling");
 track(44000,44500,475);track(45600,46100,330);
 const portals=[
  {id:"a",x:6060,y:457,target:{x:6810,y:202,gravity:-1,dimension:0},label:"TETO",color:"#df9aff"},
  {id:"b",x:9750,y:190,target:{x:10320,y:465,gravity:1,dimension:0},label:"CHÃO",color:"#7cffee"},
  {id:"d",x:34200,y:497,target:{x:35100,y:202,gravity:-1,dimension:1},label:"CATEDRAL",color:"#df9aff"},
  {id:"e",x:39350,y:230,target:{x:40400,y:505,gravity:1,dimension:0},label:"RETORNO",color:"#7cffee"},
  {id:"arena-left",x:43520,y:598,target:{x:44200,y:190,gravity:-1,dimension:0},label:"INVERTER",color:"#df9aff",arena:true},
  {id:"arena-right",x:46880,y:190,target:{x:46250,y:608,gravity:1,dimension:0},label:"RETORNAR",color:"#7cffee",arena:true}
 ];
 const anchors=[{x:10320,y:458,dimension:1},{x:11430,y:458,dimension:1},
  {x:13710,y:458,dimension:0},{x:37300,y:228,dimension:0}];
 const runes=[
  {id:0,x:8500,y:245,dimension:0,gravity:-1,label:"CÉU"},
  {id:1,x:10620,y:430,dimension:-1,gravity:1,label:"ECO"},
  {id:2,x:13050,y:405,dimension:1,gravity:1,label:"REFLEXO"},
  {id:3,x:14320,y:382,dimension:0,gravity:1,label:"ORIGEM"},
  {id:4,x:35600,y:243,dimension:1,gravity:-1,label:"INVERSÃO"},
  {id:5,x:40800,y:467,dimension:0,gravity:1,label:"REGRESSO"}
 ];
 // Mandatory seals occupy the whole room; speed cannot bypass the puzzle.
 const gates=[{x:10920,requires:[0,1],label:"SELO DA DUALIDADE"},
  {x:15450,requires:[2,3],label:"SELO DO REFLEXO"},
  {x:41450,requires:[4,5],label:"SELO DA ORIGEM"}];
 // Platforms to reach the elevated origin rune and three optional ascents.
 track(14000,14200,440,440,0);track(14200,14500,415,415,0);
 const trials=[{id:"origin",name:"Memória da Origem",x:12790,y:178,limit:24,core:0},
  {id:"paradox",name:"Paradoxo Suspenso",x:33590,y:218,limit:25,core:1},
  {id:"lastlight",name:"A Última Luz",x:41540,y:238,limit:25,core:2}];
 for(const [x,base,dim] of [[12300,390,1],[33100,430,0],[41050,450,0]]){
  track(x,x+150,base,base,dim);track(x+200,x+355,base-90,base-90,dim);
  track(x+400,x+585,base-180,base-180,dim);
 }
 const cores=[{id:0,x:12790,y:178,dimension:1},{id:1,x:33590,y:218,dimension:0},
  {id:2,x:41540,y:238,dimension:0}];
 const checkpoints=[
  {x:720,y:422,gravity:1,dimension:0},{x:4380,y:482,gravity:1,dimension:0},
  {x:6880,y:188,gravity:-1,dimension:0},{x:11180,y:482,gravity:1,dimension:1},
  {x:15700,y:452,gravity:1,dimension:0},{x:20100,y:492,gravity:1,dimension:0},
  {x:33050,y:522,gravity:1,dimension:0},{x:35150,y:188,gravity:-1,dimension:1},
  {x:40500,y:522,gravity:1,dimension:0},{x:43050,y:632,gravity:1,dimension:0}
 ];
 const barricades=[1800,2350,2950,16400,17050,17600,18250,18750,22000,25700,28500].map(x=>{
  const p=platforms.find(p=>p.orientation==="floor"&&x>=p.x1&&x<=p.x2);
  const y=p.y1+(p.y2-p.y1)*(x-p.x1)/(p.x2-p.x1);
  return {x,y:y-115,w:35,h:120};
 });
 const enemies=[];
 const enemy=(x,type,dim=-1,g=1)=>{
  const p=platforms.find(p=>p.orientation===(g===1?"floor":"ceiling")&&(p.dimension===-1||p.dimension===dim)&&x>=p.x1&&x<=p.x2);
  if(!p)return;
  enemies.push({x,y:platformSurface(p,x,0)-g*(type==="wraith"?65:type==="rift-triple"?55:25),
   type,dimension:dim,gravity:g,range:type==="rift-laser"?0:type==="rift-triple"?45:30});
 };
 for(const [x,dim,g] of [[1050,-1,1],[2580,-1,1],[7530,-1,-1],[12150,1,1],
  [14500,0,1],[16700,-1,1],[22600,-1,1],[28200,-1,1],[35800,-1,-1],[38900,0,-1],[41200,-1,1]])enemy(x,"shard",dim,g);
 for(const [x,dim,g] of [[5290,-1,1],[9420,-1,-1],[13000,1,1],[17600,-1,1],
  [23900,-1,1],[29800,-1,1],[37400,-1,-1],[42200,0,1]])enemy(x,"rift-triple",dim,g);
 for(const [x,dim,g] of [[5740,-1,1],[8520,-1,-1],[15140,-1,1],[18800,-1,1],
  [27000,-1,1],[35700,-1,-1],[40700,-1,1]])enemy(x,"rift-laser",dim,g);
 for(const [x,dim,g] of [[12800,1,1],[17200,-1,1],[24300,-1,1],[38180,0,-1],[42000,0,1]])enemy(x,"wraith",dim,g);
 const hazards=[
  {x:5170,y:455,w:72,h:15,type:"spikes",gravity:1},
  {x:8760,y:110,w:64,h:15,type:"spikes",gravity:-1},
  {x:13230,y:463,w:70,h:15,type:"spikes",gravity:1},
  {x:21900,y:540,w:74,h:15,type:"spikes",gravity:1},
  {x:25400,y:510,w:84,h:15,type:"spikes",gravity:1},
  {x:29300,y:540,w:72,h:15,type:"spikes",gravity:1},
  {x:36900,y:190,w:72,h:15,type:"spikes",gravity:-1},
  {x:38900,y:190,w:72,h:15,type:"spikes",gravity:-1},
  {x:5850,y:325,w:20,h:175,type:"laser",period:4.8,offset:0},
  {x:15140,y:290,w:20,h:180,type:"laser",period:4.8,offset:1.2},
  {x:37600,y:190,w:20,h:175,type:"laser",period:4.5,offset:.7}
 ];
 for(const h of hazards.filter(h=>h.type==="spikes")){
  const p=platforms.find(p=>p.orientation===(h.gravity===1?"floor":"ceiling")&&h.x>=p.x1&&h.x+h.w<=p.x2);
  if(p)h.y=platformSurface(p,h.x+h.w/2,0)-(h.gravity===1?h.h:0);
 }
 platforms.forEach((p,i)=>p.id=i);
 const items=[];
 for(const p of platforms.filter(p=>p.x1<43200)){
  const g=p.orientation==="ceiling"?-1:1;
  for(let x=p.x1+130;x<p.x2-75;x+=180)items.push({id:items.length,x,
   y:p.y1+(p.y2-p.y1)*(x-p.x1)/(p.x2-p.x1)-g*42,type:"crystal",dimension:p.dimension,motion:p.motion,platform:p.id});
 }
 const orb=(x,y,dimension=-1)=>items.push({id:items.length,x,y,type:"boost",dimension});
 for(const c of checkpoints)orb(c.x+48,c.y,c.dimension);
 for(const [x,y] of [[1460,455],[2260,535],[2800,585],[7350,209],[8350,210],[12000,436],
  [14300,430],[16200,460],[17350,605],[18400,550],[21300,520],[25300,490],[28600,535],[31900,470]])orb(x,y);
 for(let x=43600;x<47000;x+=350){
  items.push({id:items.length,x,y:608,type:"crystal",dimension:-1,arena:true});
  items.push({id:items.length,x,y:192,type:"crystal",dimension:-1,arena:true});
  if(x%700===200)orb(x,605);
 }

 return {platforms,portals,anchors,checkpoints,barricades,enemies,hazards,items,runes,gates,trials,cores,
  apparitions:[9050,18150,35500,41900]};
}

export function platformSurface(p,x,time){
 return p.y1+(p.y2-p.y1)*Math.max(0,Math.min(1,(x-p.x1)/(p.x2-p.x1)))+
  (p.motion?Math.sin(time*1.6+p.id)*p.motion:0);
}
export function laserState(h,time){
 if(h.type!=="laser")return "off";
 const phase=(time+h.offset)%h.period;
 return phase<.8?"warning":phase<1.5?"active":"off";
}

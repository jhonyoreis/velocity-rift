// Ordered traversal of the fourth chapter. The final battle belongs to 4.0.
export const RIFT_WORLD_WIDTH=36600;
export const RIFT_FINISH_X=36000;
export const RIFT_SECTORS=[
 {x:0,name:"ALTAR DOS NOVE NÚCLEOS",music:0},
 {x:700,name:"ESTILHAÇOS DA ORIGEM",music:0},
 {x:4250,name:"O CÉU É O CHÃO",music:1},
 {x:11200,name:"ENTRE DUAS REALIDADES",music:2},
 {x:15600,name:"AVALANCHE DE ÍMPETO",music:3},
 {x:20200,name:"ARQUIPÉLAGO DO VAZIO",music:2},
 {x:25100,name:"CATEDRAL INVERTIDA",music:1},
 {x:29600,name:"CAMINHO DA RUPTURA",music:3},
 {x:33300,name:"LIMIAR DO SOBERANO",music:4}
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
 track(8050,8850,200,110,-1,"ceiling");track(9270,9950,150,150,-1,"ceiling");
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
 const portals=[
  {id:"a",x:6060,y:457,target:{x:6810,y:202,gravity:-1,dimension:0},label:"TETO",color:"#df9aff"},
  {id:"b",x:9750,y:190,target:{x:10320,y:465,gravity:1,dimension:0},label:"CHÃO",color:"#7cffee"},
  {id:"c",x:19360,y:442,target:{x:20310,y:475,gravity:1,dimension:0},label:"TRAVESSIA",color:"#ffbd77"},
  {id:"d",x:24520,y:377,target:{x:25220,y:202,gravity:-1,dimension:0},label:"INVERSÃO",color:"#df9aff"},
  {id:"e",x:29020,y:230,target:{x:29720,y:465,gravity:1,dimension:0},label:"RUPTURA",color:"#7cffee"}
 ];
 // Automatic switches at visible anchors: no extra mobile command required.
 const anchors=[
  {x:11430,y:458,dimension:1}, {x:13710,y:458,dimension:0},
  {x:23040,y:472,dimension:1}, {x:25900,y:212,dimension:1},
  {x:34520,y:430,dimension:1}
 ];
 const checkpoints=[
  {x:720,y:422,gravity:1,dimension:0},
  {x:4380,y:482,gravity:1,dimension:0},
  {x:6880,y:188,gravity:-1,dimension:0},
  {x:11180,y:482,gravity:1,dimension:0},
  {x:15700,y:452,gravity:1,dimension:0},
  {x:20500,y:492,gravity:1,dimension:0},
  {x:25300,y:188,gravity:-1,dimension:0},
  {x:29860,y:482,gravity:1,dimension:0},
  {x:33370,y:432,gravity:1,dimension:0}
 ];
 const barricades=[1800,2350,2950,16400,17050,17600,18250,18750,30750,31350,32100].map(x=>{
  const p=platforms.find(p=>p.orientation==="floor"&&x>=p.x1&&x<=p.x2);
  const y=p.y1+(p.y2-p.y1)*(x-p.x1)/(p.x2-p.x1);
  return {x,y:y-115,w:35,h:120};
 });
 barricades.push({x:35330,y:230,w:20,h:450,type:"membrane"});
 const enemies=[];
 const enemy=(x,type,dimension=-1,gravity=1)=>{
  const p=platforms.find(p=>p.orientation===(gravity===1?"floor":"ceiling")&&
   (p.dimension===-1||p.dimension===dimension)&&x>=p.x1&&x<=p.x2);
  const floor=p.y1+(p.y2-p.y1)*(x-p.x1)/(p.x2-p.x1);
  enemies.push({x,y:floor-gravity*(type==="wraith"?62:22),type,dimension,gravity,
   range:type==="sentinel"?0:type==="wraith"?55:32});
 };
 for(const x of [1050,2580,3800,5290,7530,8520,12150,13050,14500,16700,18000,18900,22600,23800,25700,26900,27800,31000,32500,34200,35900])
  enemy(x,"shard",x===12150||x===13050||x===23800||x===26900||x===27800?1:x===14500||x===34200?0:-1,
   [7530,8520,25700,26900,27800].includes(x)?-1:1);
 for(const [x,dim,g] of [[5740,-1,1],[9420,-1,-1],[15300,-1,1],[21850,0,1],[28700,-1,-1],[33620,-1,1]])enemy(x,"sentinel",dim,g);
 for(const [x,dim,g] of [[12800,1,1],[17200,-1,1],[23400,1,1],[27500,1,-1],[35000,1,1]])enemy(x,"wraith",dim,g);
 for(const [x,dim,g] of [[4550,-1,1],[8250,-1,-1],[21150,0,1],[28050,1,-1],[35850,-1,1]])enemy(x,"crusher",dim,g);
 const hazards=[
  {x:5170,y:455,w:72,h:15,type:"spikes",gravity:1},
  {x:8760,y:110,w:64,h:15,type:"spikes",gravity:-1},
  {x:13230,y:463,w:70,h:15,type:"spikes",gravity:1},
  {x:24000,y:420,w:64,h:15,type:"spikes",gravity:1},
  {x:28180,y:155,w:70,h:15,type:"spikes",gravity:-1},
  {x:35920,y:465,w:72,h:15,type:"spikes",gravity:1},
  {x:5850,y:325,w:20,h:175,type:"laser",period:3.6,offset:0},
  {x:15140,y:290,w:20,h:180,type:"laser",period:3.8,offset:1.2},
  {x:22880,y:325,w:20,h:182,type:"laser",period:3.5,offset:.7},
  {x:28600,y:190,w:20,h:175,type:"laser",period:3.8,offset:.2},
  {x:33480,y:280,w:20,h:170,type:"laser",period:3.4,offset:1.7}
 ];
 for(const h of hazards.filter(h=>h.type==="spikes")){
  const p=platforms.find(p=>p.orientation===(h.gravity===1?"floor":"ceiling")&&h.x>=p.x1&&h.x+h.w<=p.x2);
  if(p)h.y=platformSurface(p,h.x+h.w/2,0)-(h.gravity===1?h.h:0);
 }
 const items=[];
 for(const p of platforms.slice(0,34)){
  const gravity=p.orientation==="ceiling"?-1:1;
  for(let x=p.x1+130;x<p.x2-75;x+=150){
   const y=p.y1+(p.y2-p.y1)*(x-p.x1)/(p.x2-p.x1)-gravity*42;
   items.push({id:items.length,x,y,type:"crystal",dimension:p.dimension,motion:p.motion,platform:p.id});
  }
 }
 const orb=(x,y,dimension=-1)=>items.push({id:items.length,x,y,type:"boost",dimension});
 for(const c of checkpoints)orb(c.x+48,c.y,c.dimension);
 for(const [x,y] of [[1460,455],[2260,535],[2800,585],[7350,209],[8350,210],[12000,436],
  [14300,430],[16200,460],[17350,605],[18400,550],[22500,465],[26300,225],[27700,225],
  [30550,470],[31550,595],[32450,545],[34850,427]])orb(x,y);
 return {platforms,portals,anchors,checkpoints,barricades,enemies,hazards,items,
  apparitions:[9050,18150,28000,35280]};
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

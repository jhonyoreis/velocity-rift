// Optional holographic story memories. They never stop a speedrun.
export const ALICIA_ECHOES=Object.freeze([
 {id:"forest-voice",stage:1,x:6170,title:"Um caminho de luz",speaker:"ALICIA",
  text:"Flux, se conseguir me ouvir, siga o brilho que atravessa as árvores."},
 {id:"forest-warning",stage:1,x:12470,title:"Além das raízes",speaker:"ALICIA",
  text:"Ele continua abrindo fendas. Tenho pouco tempo para deixar estes ecos."},
 {id:"forest-promise",stage:1,x:19870,title:"Ainda estou aqui",speaker:"ALICIA",
  text:"Não importa o quanto os mundos mudem. Ainda acredito que você vai me encontrar."},
 {id:"prism-map",stage:2,x:6020,title:"Cristais que lembram",speaker:"ALICIA",
  text:"Neste cânion, os cristais guardam lembranças de quem passa por eles."},
 {id:"prism-courage",stage:2,x:15520,title:"A saída",speaker:"ALICIA",
  text:"O Guardião protege uma passagem. Observe a abertura entre os ataques."},
 {id:"prism-bridge",stage:2,x:28120,title:"Siga adiante",speaker:"ALICIA",
  text:"Ouço a cidade do outro lado. É lá que o rastro do Soberano continua."},
 {id:"city-signal",stage:3,x:5260,title:"Voz na metrópole",speaker:"ALICIA",
  text:"As torres interferem na minha voz. Não pare quando tudo parecer escuro."},
 {id:"city-dash",stage:3,x:11480,title:"Núcleo desperto",speaker:"ALICIA",
  text:"O poder que você encontrou pode atravessar fendas que pareciam impossíveis."},
 {id:"city-gate",stage:3,x:16560,title:"Antes do vazio",speaker:"ALICIA",
  text:"A próxima fenda está perto. Estou esperando do outro lado."}
]);
export function validEchoId(id){return ALICIA_ECHOES.some(e=>e.id===id);}
export function sanitizeEchoArchive(value){
 const set=new Set();
 if(Array.isArray(value))for(const id of value)
   if(typeof id==="string"&&validEchoId(id))set.add(id);
 return [...set];
}

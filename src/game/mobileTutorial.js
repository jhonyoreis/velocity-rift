// Mobile-only level signage uses on-screen controls, never desktop keys.
// Tutorial boards fade as Flux approaches and disappear after passing.
export function mobileTutorialSign(sign,playerX){
  const title=String(sign?.title||"").toUpperCase();
  const hint=String(sign?.hint||"");
  const normalized=(title+" "+hint).normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"").toUpperCase();
  let label=title,help=hint;
  if(normalized.includes("DASH")){
    label="DASH AÉREO";help="TOQUE PULAR 2 VEZES NO AR";
  }else if(normalized.includes("DESLIZ")||normalized.includes("SLIDE")||
    normalized.includes("ABAIXO")||normalized.includes("TUNEL")){
    label="SLIDE";help="SEGURE SLIDE";
  }else if(normalized.includes("BOOST")||normalized.includes("IMPULSO")){
    label=title==="MOVER"?"MOVER":title;
    help="SEGURE BOOST";
  }else if(normalized.includes("PULAR")||normalized.includes("SALTE")||
    normalized.includes("SALTO")||normalized.includes("ESPACO")){
    help="TOQUE EM PULAR";
  }else if(normalized.includes("MOVER")||normalized.includes("SETAS")||
    normalized.includes("A / D")){
    label="MOVER";help="USE ◀ E ▶";
  }
  const distance=sign.x-playerX;
  const fadeIn=Math.min(1,Math.max(0,(420-distance)/110));
  const fadeOut=Math.min(1,Math.max(0,(distance+160)/120));
  return {title:label,hint:help,alpha:Math.min(fadeIn,fadeOut)};
}

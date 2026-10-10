import test from "node:test";
import assert from "node:assert/strict";
import {mobileTutorialSign} from "../src/game/mobileTutorial.js";
import {readFileSync} from "node:fs";
test("mobile signs use touch language without keyboard commands",()=>{
 const signs=[
   {x:1000,title:"MOVER",hint:"A / D OU SETAS"},
   {x:1000,title:"PULAR",hint:"ESPACO / W"},
   {x:1000,title:"DESLIZAR",hint:"S / SETA PARA BAIXO"},
   {x:1000,title:"DASH AÉREO",hint:"APERTE PULO DUAS VEZES · SÓ HORIZONTAL"},
   {x:1000,title:"PORTAO",hint:"BOOST: SHIFT OU J"}
 ];
 const mapped=signs.map(sign=>mobileTutorialSign(sign,750));
 assert.ok(mapped.every(x=>x.alpha>0));
 assert.ok(mapped.every(x=>!/\\b(?:SHIFT|ESPACO|ESPAÇO|SETAS|ARROW|W)\\b/.test(x.hint)));
 assert.equal(mapped[0].hint,"USE ◀ E ▶");
 assert.equal(mapped[1].hint,"TOQUE EM PULAR");
 assert.equal(mapped[2].hint,"SEGURE SLIDE");
 assert.equal(mapped[3].hint,"TOQUE PULAR 2 VEZES NO AR");
 assert.equal(mapped[4].hint,"SEGURE BOOST");
});
test("signs appear near Flux and disappear after passing",()=>{
 const sign={x:1000,title:"MOVER",hint:"A / D"};
 assert.equal(mobileTutorialSign(sign,0).alpha,0);
 assert.equal(mobileTutorialSign(sign,750).alpha,1);
 assert.equal(mobileTutorialSign(sign,1250).alpha,0);
});
test("desktop retains original boards while mobile UI uses fading signs",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.ok(main.includes("mobileTutorialSign(sign,player.x)"));
 assert.ok(main.includes("const title=mobile?touchSign.title:sign.title"));
 assert.ok(main.includes("const hint=mobile?touchSign.hint:sign.hint"));
 assert.ok(main.includes("ctx.globalAlpha=touchSign.alpha"));
});

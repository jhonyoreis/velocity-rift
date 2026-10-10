import test from "node:test";
import assert from "node:assert/strict";
import {speedometer,SPEED_STOPS} from "../src/game/speedometer.js";
import {readFileSync} from "node:fs";
test("speed color bands follow exact grey blue cyan green yellow orange red sequence",()=>{
 assert.deepEqual(SPEED_STOPS.map(x=>x.name),[
  "cinza","azul","ciano","verde","amarelo","laranja","vermelho"]);
 for(const speed of [0,110,200,320,450,570,900])
  assert.equal(speedometer(speed).colorName,
    ["cinza","azul","ciano","verde","amarelo","laranja","vermelho"][[0,110,200,320,450,570,900].indexOf(speed)]);
});
test("speedometer clamps safely above boost, works for reverse speed",()=>{
 assert.equal(speedometer(-590).value,590);
 assert.equal(speedometer(2000).fraction,1);
 assert.equal(speedometer(NaN).value,0);
 assert.equal(speedometer(300).fraction,.25);
});
test("actual running speed drives a colored bar and numeric display in gameplay HUD",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.ok(main.includes("speedometer(player.vx)"));
 assert.ok(main.includes("ctx.fillStyle=gauge.color"));
 assert.ok(main.includes("VELOCIDADE"));
 assert.ok(main.includes('gauge.value+" u/s"'));
});

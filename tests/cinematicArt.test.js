import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCinematicArt} from "../src/rendering/cinematicArt.js";
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
test("cinematic Canvas artwork is a separate module without losing scene commands",()=>{
 assert.equal(typeof createCinematicArt,"function");
 assert.ok(main.includes('import {createCinematicArt} from "./rendering/cinematicArt.js";'));
 assert.ok(main.includes("createCinematicArt(ctx,VIEW_W,VIEW_H,drawFluxBody)"));
 for(const scene of ["forestChase","forestDive","canyonDive"])
   assert.ok(main.includes(scene),scene);
 assert.ok(!main.includes("function cinemaAlicia("));
});

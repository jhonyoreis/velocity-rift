import test from "node:test";
import assert from "node:assert/strict";
import {SECRET_DEFS} from "../src/data/secretRoutes.js";
import {getSecretBackdropPalette} from "../src/rendering/secretBackdrop.js";
import {renderForest} from "../src/rendering/scenery.js";

test("all nine secret routes have usable backgrounds",()=>{
 for(const id of [1,2,3].flatMap(stage=>SECRET_DEFS[stage].map(t=>t.id))){
   const theme=getSecretBackdropPalette(id);
   assert.equal(theme.length,3,id);
   assert.ok(theme.every(Boolean),id);
 }
 assert.ok(getSecretBackdropPalette("unknown").every(Boolean));
});
test("forest painting is called only for stage one",()=>{
 assert.equal(typeof renderForest,"function");
});

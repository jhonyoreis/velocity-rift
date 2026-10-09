import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderCrystal} from "../src/rendering/crystals.js";
test("gem is a faceted polygon, not a gold circle",()=>{
 const calls=[];
 const ctx=new Proxy({}, {get(_,key){return (...args)=>calls.push([key,...args]);}, set(){return true;}});
 renderCrystal(ctx,{x:20,y:40,r:8},0);
 assert.ok(calls.filter(x=>x[0]==="fill").length>=7);
 assert.equal(calls.filter(x=>x[0]==="arc").length,0);
});
test("all game levels use same crystal renderer",()=>{
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.ok(main.includes("renderCrystal(ctx,ring,visualTime)"));
});

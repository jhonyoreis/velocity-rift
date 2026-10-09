import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync("index.html","utf8");
const main=readFileSync("src/main.js","utf8");
test("HTML IDs and JavaScript literal selectors agree",()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 const pattern=/querySelector\(\s*["'`]#([A-Za-z][\w-]*)["'`]\s*\)/g;
 const requested=[...main.matchAll(pattern)].map(m=>m[1]);
 assert.ok(requested.length>90);
 for(const id of requested)assert.ok(ids.includes(id),"missing id: "+id);
});
test("forest decoration no longer renders in the city",()=>{
 assert.match(main,/function drawForest\(\)\{if\(activeStage!==1\)return;renderForest/);
});

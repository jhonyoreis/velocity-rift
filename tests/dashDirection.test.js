import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveAirDashDirection} from "../src/game/dashDirection.js";

test("facing right always produces a perfectly horizontal right dash",()=>{
  assert.deepEqual(resolveAirDashDirection(1),{dx:1,dy:0});
});
test("facing left always produces a perfectly horizontal left dash",()=>{
  assert.deepEqual(resolveAirDashDirection(-1),{dx:-1,dy:0});
});
test("no direction can produce diagonal or vertical dash velocity",()=>{
  for(const facing of [-3,-1,-0.01,0,0.01,1,3,undefined]){
    const {dx,dy}=resolveAirDashDirection(facing);
    assert.equal(Math.abs(dx),1);
    assert.equal(dy,0);
    assert.equal(Math.hypot(dx,dy),1);
  }
});
test("main dash entry point only uses the facing direction, never a cursor",()=>{
  const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
  assert.match(main,/const direction=resolveAirDashDirection\(player\.facing\);/);
  assert.doesNotMatch(main,/airDash\.(?:aimX|aimY|hasAim|pointerMovedAt)|clearAirDashAim|pointermove/);
  assert.match(main,/player\.vx=airDash\.dx\*DASH_SPEED;/);
  assert.match(main,/player\.vy=airDash\.dy\*DASH_SPEED;/);
});

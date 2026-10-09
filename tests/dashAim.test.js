import test from "node:test";
import assert from "node:assert/strict";
import {resolveAirDashDirection,DASH_AIM_MAX_AGE_MS,DASH_AIM_DEADZONE_PX} from "../src/game/dashAim.js";

const base={
  facing:1,playerScreenX:400,playerScreenY:250,
  aimX:800,aimY:250,hasAim:true,pointerMovedAt:1000,now:1100
};

test("recent pointer movement aims accurately relative to the character",()=>{
  assert.deepEqual(resolveAirDashDirection(base),{dx:1,dy:0});
  const up=resolveAirDashDirection({...base,aimX:400,aimY:130});
  assert.ok(Math.abs(up.dx)<1e-10);
  assert.ok(up.dy < -0.99);
  const left=resolveAirDashDirection({...base,aimX:100,aimY:250});
  assert.deepEqual(left,{dx:-1,dy:0});
});

test("camera/player movement with stale pointer cannot reverse the dash",()=>{
  const oldCursor={
    ...base,facing:1,leftHeld:false,rightHeld:true,
    playerScreenX:700,aimX:150,aimY:250,
    now:1000+DASH_AIM_MAX_AGE_MS+1
  };
  assert.deepEqual(resolveAirDashDirection(oldCursor),{dx:1,dy:0});
  assert.deepEqual(resolveAirDashDirection({...oldCursor,facing:-1,leftHeld:true,rightHeld:false}),{dx:-1,dy:0});
});

test("no pointer, pointer leaving the canvas, and touch defaults are stable",()=>{
  assert.deepEqual(resolveAirDashDirection({...base,hasAim:false,facing:-1}),{dx:-1,dy:0});
  assert.deepEqual(resolveAirDashDirection({...base,pointerMovedAt:-Infinity}),{dx:1,dy:0});
  assert.deepEqual(resolveAirDashDirection({...base,aimX:400+DASH_AIM_DEADZONE_PX-1,aimY:250}),{dx:1,dy:0});
});

test("invalid pointer coordinates and clock anomalies fall back safely",()=>{
  const invalid=[{aimX:NaN},{aimY:Infinity},{now:500},{now:NaN},{pointerMovedAt:Infinity}];
  for(const overrides of invalid){
    assert.deepEqual(resolveAirDashDirection({...base,...overrides}),{dx:1,dy:0});
  }
});

test("a freshly moved cursor takes priority over movement keys and normalizes diagonal input",()=>{
  const aim=resolveAirDashDirection({...base,leftHeld:true,aimX:500,aimY:150});
  assert.ok(aim.dx>0&&aim.dy<0);
  assert.ok(Math.abs(Math.hypot(aim.dx,aim.dy)-1)<1e-10);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {setAndroidLandscape,addImmersiveMainActivity,setAndroidVersion} from "../scripts/configure-android.mjs";

test("native orientation patch targets only the Capacitor activity",()=>{
  const source='<manifest xmlns:android="http://schemas.android.com/apk/res/android">'+
    '<application><activity android:name=".Other"/>'+
    '<activity android:name=".MainActivity" android:exported="true"></activity></application></manifest>';
  const patched=setAndroidLandscape(source);
  assert.ok(patched.includes('android:name=".Other"/>'));
  assert.match(patched,/<activity android:name="\.MainActivity"[^>]*android:screenOrientation="sensorLandscape"/);
  assert.equal(setAndroidLandscape(patched),patched);
  assert.throws(()=>setAndroidLandscape("<manifest/>"),/MainActivity/);
});

test("Capacitor packages and web directory are configured for offline Android",()=>{
 const config=JSON.parse(readFileSync(new URL("../capacitor.config.json",import.meta.url),"utf8"));
 const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
 assert.equal(config.webDir,"dist");
 assert.equal(config.appId,"com.velocityrift.game");
 assert.equal(config.appName,"Velocity Rift");
 assert.ok(!config.server?.url);
 assert.equal(pkg.dependencies["@capacitor/android"],pkg.dependencies["@capacitor/core"]);
 assert.equal(pkg.dependencies["@capacitor/core"],pkg.devDependencies["@capacitor/cli"]);
 assert.ok(pkg.scripts["android:sync"].includes("npx cap sync android"));
});

test("GitHub Actions produces a downloadable debug APK",()=>{
 const flow=readFileSync(new URL("../.github/workflows/android-apk.yml",import.meta.url),"utf8");
 assert.ok(flow.includes("npx cap add android"));
 assert.ok(flow.includes("npx cap sync android"));
 assert.ok(flow.includes("node scripts/configure-android.mjs"));
 assert.ok(flow.includes("assembleDebug"));
 assert.ok(flow.includes("actions/upload-artifact@v4"));
 assert.ok(flow.includes("android/app/build/outputs/apk/debug/app-debug.apk"));
 assert.ok(flow.includes("ANDROID_KEYSTORE_BASE64"));
 assert.ok(flow.includes("steps.signing.outputs.enabled == 'true'"));
 assert.ok(flow.includes("assembleRelease"));
 assert.ok(flow.includes("apksigner"));
 assert.ok(flow.includes("velocity-rift-android-update"));
});

test("landscape game continues to expose touch controls",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
 assert.match(html,/class="touch-controls"/);
 for(const key of ['data-key="arrowleft"','data-key="arrowright"','data-key="shift"'])
   assert.ok(html.includes(key));
 assert.ok(css.includes("@media (pointer:coarse) and (orientation:landscape)"));
 assert.ok(css.includes(".touch-controls button:nth-child(3)"));
});

test("native Android activity hides status and navigation bars",()=>{
  const basic='package com.velocityrift.game;'+
    'import com.getcapacitor.BridgeActivity;'+
    'public class MainActivity extends BridgeActivity {}';
  const changed=addImmersiveMainActivity(basic);
  for(const feature of ["onCreate(android.os.Bundle","onWindowFocusChanged(boolean hasFocus)",
    "void enterImmersiveMode()","WindowInsets.Type.systemBars()",
    "BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE","SYSTEM_UI_FLAG_IMMERSIVE_STICKY",
    "LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES"])
    assert.ok(changed.includes(feature),feature);
  assert.equal(addImmersiveMainActivity(changed),changed);
  assert.throws(()=>addImmersiveMainActivity("class Other {}"),/BridgeActivity/);
});

test("Android native APK version matches the package version",()=>{
 const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
 const before='android { defaultConfig { versionCode 1 versionName "1.0" } }';
 const updated=setAndroidVersion(before,pkg.version);
 assert.ok(updated.includes("versionCode 3007010"));
 assert.ok(updated.includes('versionName "3.7.10"'));
 assert.equal(setAndroidVersion(updated,pkg.version),updated);
 assert.throws(()=>setAndroidVersion("no version fields",pkg.version),/version fields/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {setAndroidLandscape} from "../scripts/configure-android.mjs";

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
 assert.ok(!flow.includes("secrets."));
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

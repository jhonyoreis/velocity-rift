import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const wf=readFileSync(new URL("../.github/workflows/android-apk.yml",import.meta.url),"utf8");
test("debug APK is always produced even without signing secrets",()=>{
 assert.ok(wf.includes("assembleDebug"));
 assert.ok(wf.includes("velocity-rift-android-debug"));
 assert.ok(wf.includes("android/app/build/outputs/apk/debug/app-debug.apk"));
});
test("release updates use persistent keystore in GitHub Secrets, not in Git",()=>{
 for(const secret of ["ANDROID_KEYSTORE_BASE64","ANDROID_KEYSTORE_PASSWORD",
   "ANDROID_KEY_PASSWORD","ANDROID_KEY_ALIAS"])assert.ok(wf.includes("secrets."+secret));
 assert.ok(wf.includes("base64 --decode"));
 assert.ok(wf.includes("assembleRelease"));
 assert.ok(wf.includes('"$BUILD_TOOLS/zipalign"'));
 assert.ok(wf.includes('"$BUILD_TOOLS/apksigner" sign'));
 assert.ok(wf.includes('"$BUILD_TOOLS/apksigner" verify'));
 assert.ok(wf.includes("steps.signing.outputs.enabled == 'true'"));
 assert.ok(wf.includes("velocity-rift-android-update"));
 assert.ok(!wf.includes("echo \"$KEYSTORE_B64\""));
});

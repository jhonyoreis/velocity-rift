import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {setAndroidVersion} from "../scripts/configure-android.mjs";

test("project, document title and Android build label have the same version",()=>{
 const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const readme=readFileSync(new URL("../README.md",import.meta.url),"utf8");
 assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 assert.ok(html.includes("<title>Velocity Rift "+pkg.version+" —"),"HTML title outdated");
 assert.ok(html.includes("v"+pkg.version+" ·"),"home screen version outdated");
 assert.ok(readme.includes("# Velocity Rift — Cidade das Fendas (versão "+pkg.version+" em teste)"));
 const gradle='android { defaultConfig { versionCode 1 versionName "1.0" } }';
 const patched=setAndroidVersion(gradle,pkg.version);
 assert.ok(patched.includes('versionName "'+pkg.version+'"'));
});

test("each published Android APK revision has a visible unique marker",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.match(html,/class="vr-build-id">APK R\d+<\/span>/);
});

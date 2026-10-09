// Applied to the Capacitor-generated native project before debug builds.
// Keep the app in landscape so the game's 960x540 canvas and touch buttons fit.
import {readFileSync,writeFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

export function setAndroidLandscape(manifest){
  const activityTags=[...manifest.matchAll(/<activity(?=\s)[^>]*>/gs)];
  const activity=activityTags.find(match=>
    /android:name\s*=\s*["'][^"']*MainActivity["']/.test(match[0]));
  if(!activity)throw new Error("Capacitor MainActivity missing in AndroidManifest.xml");
  const tag=activity[0];
  const edited=/android:screenOrientation\s*=/.test(tag)
    ?tag.replace(/android:screenOrientation\s*=\s*["'][^"']*["']/,
      'android:screenOrientation="sensorLandscape"')
    :tag.replace(/>$/,' android:screenOrientation="sensorLandscape">');
  return manifest.slice(0,activity.index)+edited+
    manifest.slice(activity.index+tag.length);
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const path="android/app/src/main/AndroidManifest.xml";
  writeFileSync(path,setAndroidLandscape(readFileSync(path,"utf8")));
  process.stdout.write("Android locked to sensor landscape orientation.\n");
}

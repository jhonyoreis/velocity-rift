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


export function addImmersiveMainActivity(javaSource){
  if(javaSource.includes("void enterImmersiveMode()"))return javaSource;
  if(!/class\s+MainActivity\s+extends\s+BridgeActivity/.test(javaSource))
    throw new Error("Capacitor BridgeActivity not found");
  const close=javaSource.lastIndexOf("}");
  if(close<0)throw new Error("Invalid MainActivity.java");
  const methods="\n  @Override\n  public void onCreate(android.os.Bundle savedInstanceState) {\n    super.onCreate(savedInstanceState);\n    enterImmersiveMode();\n  }\n\n  @Override\n  public void onWindowFocusChanged(boolean hasFocus) {\n    super.onWindowFocusChanged(hasFocus);\n    if (hasFocus) enterImmersiveMode();\n  }\n\n  private void enterImmersiveMode() {\n    if (android.os.Build.VERSION.SDK_INT >= 30) {\n      android.view.WindowInsetsController controller = getWindow().getInsetsController();\n      if (controller != null) {\n        controller.hide(android.view.WindowInsets.Type.systemBars());\n        controller.setSystemBarsBehavior(\n          android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);\n      }\n    } else {\n      getWindow().getDecorView().setSystemUiVisibility(\n        android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY\n        | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION\n        | android.view.View.SYSTEM_UI_FLAG_FULLSCREEN\n        | android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE\n        | android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN\n        | android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);\n    }\n    if (android.os.Build.VERSION.SDK_INT >= 28) {\n      android.view.WindowManager.LayoutParams params = getWindow().getAttributes();\n      params.layoutInDisplayCutoutMode =\n        android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;\n      getWindow().setAttributes(params);\n    }\n  }\n";
  return javaSource.slice(0,close)+methods+"\n"+javaSource.slice(close);
}


/** Align Android Settings and install/update metadata with package.json. */
export function setAndroidVersion(gradle,version){
  const match=/^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if(!match)throw new Error("Android requires a numeric MAJOR.MINOR.PATCH version");
  const [major,minor,patch]=match.slice(1).map(Number);
  if(minor>999||patch>999)throw new RangeError("Version minor/patch exceeds 999");
  const code=major*1000000+minor*1000+patch;
  if(code>2100000000)throw new RangeError("Android versionCode overflow");
  if(!/\bversionCode\s+\d+/.test(gradle)||
     !/\bversionName\s+["'][^"']+["']/.test(gradle))
    throw new Error("Android Gradle version fields missing");
  return gradle.replace(/\bversionCode\s+\d+/,
    "versionCode "+code).replace(/\bversionName\s+["'][^"']+["']/,
    'versionName "'+version+'"');
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const path="android/app/src/main/AndroidManifest.xml";
  writeFileSync(path,setAndroidLandscape(readFileSync(path,"utf8")));
  const activityPath="android/app/src/main/java/com/velocityrift/game/MainActivity.java";
  writeFileSync(activityPath,addImmersiveMainActivity(readFileSync(activityPath,"utf8")));
  const androidGradle="android/app/build.gradle";
  const version=JSON.parse(readFileSync("package.json","utf8")).version;
  writeFileSync(androidGradle,setAndroidVersion(readFileSync(androidGradle,"utf8"),version));
  process.stdout.write("Android "+version+" landscape, immersive fullscreen and version metadata enabled.\n");
}

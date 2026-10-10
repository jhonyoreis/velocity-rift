// A native Android build and touch landscape browsers share a game-focused UI.
// Desktop browser windows keep the usual desktop layout.
export function shouldUseMobilePresentation({nativeAndroid=false,pointerCoarse=false,landscape=false}={}){
  return !!nativeAndroid||!!(pointerCoarse&&landscape);
}
export function isNativeAndroid(capacitor){
  return !!(capacitor?.isNativePlatform?.()&&capacitor?.getPlatform?.()==="android");
}

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const js=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");

test("touch controls are explicitly enabled only for live gameplay",()=>{
  const start=js.indexOf("function syncPauseButton(){");
  const end=js.indexOf("function showPauseMenu(){",start);
  assert.ok(start>=0&&end>start);
  const source=js.slice(start,end);
  const elements={
    ".game-panel":{classList:{current:new Set(),toggle(name,on){
      if(on)this.current.add(name);else this.current.delete(name);
    }}}
  };
  const pauseButton={hidden:true,textContent:"",attrs:{},setAttribute(k,v){this.attrs[k]=v}};
  const doc={querySelector(sel){return elements[sel];}};
  const build=new Function("document","pauseButton",
    "let gameStarted=false,paused=false,gameCleared=false;"+
    "const cinematic={active:false};"+
    source+
    "return {syncPauseButton,setState:(started,isPaused,cleared,scene)=>{"+
    "gameStarted=started;paused=isPaused;gameCleared=cleared;cinematic.active=scene;}};");
  const run=build(doc,pauseButton);
  for(const [start,paused,cleared,scene,visible] of [
    [false,false,false,false,false],
    [true,false,false,false,true],
    [true,true,false,false,false],
    [true,false,true,false,false],
    [true,false,false,true,false],
    [true,false,false,false,true],
  ]){
    run.setState(start,paused,cleared,scene);
    run.syncPauseButton();
    assert.equal(!pauseButton.hidden,visible);
    assert.equal(elements[".game-panel"].classList.current.has("gameplay-active"),visible);
  }
});

test("Android presentation uses user agent fallback to retain the gamepad",()=>{
  assert.ok(js.includes('/android/i.test(window.navigator.userAgent)'));
  assert.ok(js.includes('shouldUseMobilePresentation({nativeAndroid:android,pointerCoarse:coarse,landscape}'));
  assert.ok(js.includes('classList.remove("menu-active","pause-active","gameplay-active")'));
  assert.ok(js.includes('classList.remove("pause-active","cinematic-active")'));
  assert.ok(css.includes("html.mobile-game .game-panel.gameplay-active .touch-controls"));
  assert.ok(css.includes("display:grid!important;"));
  assert.ok(css.includes("visibility:visible!important;"));
  assert.ok(css.includes("html.mobile-game .game-panel.gameplay-active .v31-in-game-pause"));
  assert.ok(css.includes(".game-panel:not(.gameplay-active) .touch-controls{display:none!important;}"));
  for(const key of ["arrowleft","arrowright"," ","shift","arrowdown"])
    assert.ok(html.includes('data-key="'+key+'"'),key);
});

test("cinematic mobile dialogue hides speaker and title but preserves story and buttons",()=>{
  assert.ok(css.includes(".vr-film-dialogue #cinematicSpeaker"));
  assert.ok(css.includes(".vr-film-dialogue #cinematicTitle"));
  assert.ok(css.includes("max-height:min(25vh,130px)"));
  assert.ok(html.includes('id="cinematicText"'));
  for(const id of ["cinematicNextButton","cinematicExitButton"])
    assert.ok(html.includes('id="'+id+'"'));
  assert.ok(!html.includes('id="cinematicSkipButton"'));
  assert.match(html,/id="cinematicNextButton"[^>]*aria-label="Avançar diálogo"/);
  assert.match(html,/id="cinematicExitButton"[^>]*aria-label="Voltar ao menu principal"/);
  assert.ok(js.includes('next.setAttribute("aria-label",action)'));
  assert.ok(!js.includes('querySelector("#cinematicSkipButton")'));
  assert.ok(js.includes('document.querySelector("#cinematicText").textContent=frame.text;'));
});

test("louder synthesized audio uses a shared dynamics compressor and respects volume sliders",()=>{
  assert.ok(js.includes("function gameAudioOutput(){"));
  assert.ok(js.includes("createDynamicsCompressor"));
  assert.ok(js.includes("output.ratio.value=10"));
  assert.ok(js.includes('volume*3.0*effectiveAudioGain("effects")'));
  assert.ok(js.includes('4.0*effectiveAudioGain("music")'));
  assert.ok(js.includes("envelope.connect(gameAudioOutput()||audioContext.destination)"));
  assert.ok(js.includes("musicBus.connect(gameAudioOutput()||audioContext.destination)"));
  assert.ok(js.includes("return master*audioLevels.effects/100"));
  assert.ok(js.includes("master*(musicEnabled?audioLevels.music/100:0)"));
  const start=js.indexOf("function gameAudioOutput(){");
  const end=js.indexOf("\n}\n",start);
  const fnSource=js.slice(start,end+2);
  const connections=[];
  const compressor={
    threshold:{value:0},knee:{value:0},ratio:{value:0},
    attack:{value:0},release:{value:0},
    connect(target){connections.push(target)}
  };
  const destination={};
  const context={destination,createDynamicsCompressor(){return compressor}};
  const output=new Function("audioContext",
    "let audioMixOutput=null;"+fnSource+";return [gameAudioOutput(),gameAudioOutput()];")(context);
  assert.equal(output[0],compressor);
  assert.equal(output[1],compressor);
  assert.equal(compressor.threshold.value,-14);
  assert.equal(compressor.ratio.value,10);
  assert.deepEqual(connections,[destination]);
});

test("touch handler uses safe pointer capture and does not drop game input",()=>{
  assert.ok(js.includes("button.addEventListener('pointerdown'"));
  assert.ok(js.includes("keys.add(key)"));
  assert.ok(js.includes("try{button.setPointerCapture(event.pointerId)}catch"));
});

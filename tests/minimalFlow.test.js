import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
test("minimal death screen has only heading and icon actions visible",()=>{
 const part=html.split('<section id="deathMenu"')[1].split('<section id="pauseMenu"')[0];
 assert.ok(part.includes("VOCÊ MORREU"));
 assert.ok(part.includes('id="deathRestartButton"'));
 assert.ok(part.includes('id="deathMainButton"'));
 assert.ok(part.includes('aria-label="Voltar ao menu principal"'));
 assert.ok(part.includes('<svg viewBox='));
 assert.ok(part.includes('<div hidden aria-hidden="true">'));
 assert.ok(css.includes(".vr-death-minimal"));
 assert.ok(main.includes("function restartAfterDeath()"));
});
test("new game confirmation is short and retains explicit accessible actions",()=>{
 const part=html.split('<section id="newGameConfirm"')[1].split('<section id="stageMenu"')[0];
 assert.ok(part.includes("NOVO JOGO?"));
 assert.ok(part.includes("Conquistas e recordes permanecem"));
 assert.ok(part.includes('aria-label="Confirmar novo jogo"'));
 assert.ok(part.includes('aria-label="Cancelar novo jogo"'));
 assert.ok(!part.includes("NOVA JORNADA //"));
 assert.ok(main.includes("function confirmNewGame()"));
});
test("full test is separate from DEBUG, does not change saved collections",()=>{
 assert.ok(html.includes('id="fullTestToggle"'));
 assert.ok(main.includes("let fullTestMode=false"));
 assert.ok(main.includes("function toggleFullTestMode()"));
 assert.ok(main.includes("function boostCapacity(){return fullTestMode?150:boostUpgrades.capacity;}"));
 assert.ok(main.includes("debugUsedThisRun = debugMode||fullTestMode"));
 assert.ok(main.includes("if(debugMode||(player.invulnerable>0"));
 assert.ok(!main.includes("progress.secrets=allSecrets"));
});

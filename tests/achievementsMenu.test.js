import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ACHIEVEMENTS} from "../src/data/achievements.js";
import {SECRET_DEFS} from "../src/data/secretRoutes.js";
import {secretUpgradeReward} from "../src/game/secretUpgrades.js";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const start=html.indexOf('<section id="achievementsMenu"'),end=html.indexOf('<section id="resultMenu"',start);
const page=html.slice(start,end);
const cstart=css.indexOf("/* Etapa 4 — Arquivo de conquistas");
const cend=css.indexOf("/* =============== Velocity Rift 3.0:",cstart);
const styles=css.slice(cstart,cend);

test("redesigned achievement archive has progress and two concise sections",()=>{
 assert.ok(page.includes('class="menu-screen achievement-screen vr-collection"'));
 for(const id of ["achievementsHeading","achievementsCount","achievementProgressTrack",
   "achievementProgressFill","achievementList","secretCollection","secretRouteList",
   "achievementsBackButton"]){
   assert.ok(page.includes('id="'+id+'"'),"missing "+id);
 }
 assert.ok(page.includes('aria-labelledby="achievementSectionHeading"'));
 assert.ok(page.includes('aria-labelledby="secretSectionHeading"'));
 assert.ok(page.includes('role="progressbar"'));
 assert.ok(page.indexOf('id="achievementList"')<page.indexOf('id="secretRouteList"'));
 assert.ok(!page.includes("achievement-instructions"));
});

test("one scroll container: both lists have no nested scrollbar on all sizes",()=>{
 assert.ok(styles.includes('overflow-y:auto;'));
 assert.ok(styles.includes('.vr-collection .achievement-list,'));
 assert.ok(styles.includes('.vr-collection .secret-route-list{'));
 assert.ok(styles.includes('overflow:visible;'));
 assert.ok(styles.includes('max-height:none;'));
 assert.ok(!styles.includes('max-height:122px'));
 assert.ok(!styles.includes('max-height:44vh'));
 assert.ok(styles.includes('@media(max-width:700px)'));
 assert.ok(styles.includes('grid-template-columns:minmax(0,1fr)'));
});

test("archive opens at top and focuses heading, not footer action",()=>{
 assert.ok(page.includes('id="achievementsHeading" tabindex="-1"'));
 const start=main.indexOf("function showAchievementsMenu(){");
 const end=main.indexOf("function showResults(",start);
 assert.ok(start>0&&end>start);
 const source=main.slice(start,end);
 assert.ok(source.includes("achievementsMenu.scrollTop=0"));
 assert.ok(source.includes('.focus({preventScroll:true})'));
});

test("collection counts and progress bar use saved achievements and secret archive",()=>{
 const beg=main.indexOf("function refreshAchievementsView(){");
 const end=main.indexOf("function collectItems()",beg);
 assert.ok(beg>0&&end>beg);
 const source=main.slice(beg,end);
 const nodes=new Map();
 for(const id of ["achievementsCount","achievementProgressTrack",
   "achievementProgressFill","secretCollection","achievementList","secretRouteList"]){
   nodes.set("#"+id,{textContent:"",style:{width:""},
     attributes:{},setAttribute(k,v){this.attributes[k]=v},innerHTML:""});
 }
 const document={querySelector(selector){return nodes.get(selector)||null}};
 const progress={
   achievements:{first:true,explorer:true},
   secrets:{stage1:[SECRET_DEFS[1][0].id],stage2:[],stage3:[]},
   secretTimes:{stage1:{},stage2:{},stage3:{}}
 };
 const run=new Function("document","ACHIEVEMENTS","SECRET_DEFS","progress","secretUpgradeReward",source+
   "\nreturn refreshAchievementsView;");
 run(document,ACHIEVEMENTS,SECRET_DEFS,progress,secretUpgradeReward)();
 assert.equal(nodes.get("#achievementsCount").textContent,"2 de "+ACHIEVEMENTS.length);
 assert.equal(nodes.get("#achievementProgressTrack").attributes["aria-valuenow"],"2");
 assert.equal(nodes.get("#achievementProgressTrack").attributes["aria-valuemax"],String(ACHIEVEMENTS.length));
 assert.equal(nodes.get("#achievementProgressFill").style.width,
   Math.round(200/ACHIEVEMENTS.length)+"%");
 assert.equal(nodes.get("#secretCollection").textContent,"1 de 9 descobertas");
 assert.ok(nodes.get("#achievementList").innerHTML.includes("Primeiro Impulso"));
 assert.ok(nodes.get("#secretRouteList").innerHTML.includes("Recorde"));
});

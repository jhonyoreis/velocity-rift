import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAMPAIGN_ROUTE} from '../src/game/campaignRoute.js';
const html=readFileSync('index.html','utf8'),main=readFileSync('src/main.js','utf8');
const map=html.slice(html.indexOf('<section id="stageMenu"'),html.indexOf('<section id="achievementsMenu"'));
test('atlas gives all six destinations their own node, detail and guarded launch',()=>{
 for(const entry of CAMPAIGN_ROUTE){
  for(const id of [entry.node,entry.card,entry.button,'mapStage'+entry.suffix+'Best',entry.node+'Status'])assert.ok(map.includes('id="'+id+'"'),id);
  if(entry.path)assert.ok(map.includes('id="'+entry.path+'"'));
 }
 assert.ok(map.includes('viewBox="0 0 600 360"'));
 assert.ok(map.includes('Mapa interativo dos seis destinos'));
 assert.ok(main.includes('if(!entry?.unlocked)return;'));
});
test('second parts have independent records and no invented core requirements',()=>{
 for(const entry of CAMPAIGN_ROUTE.filter(n=>n.part===2)){
  const start=map.indexOf('id="'+entry.card+'"'),end=map.indexOf('</article>',start),card=map.slice(start,end);
  assert.ok(card.includes('mapStage'+entry.suffix+'Clears'));
  assert.ok(!card.includes('Cores'));assert.ok(!card.includes('Secrets'));
 }
});
test('selecting every node, including locked destinations, shows only its detail',()=>{
 const source=main.slice(main.indexOf('function selectMapStage(stage){'),main.indexOf('function refreshMapView(){'));
 const registry=new Map();
 for(const entry of CAMPAIGN_ROUTE){
  const values=new Set();
  registry.set(entry.node,{classList:{toggle(k,on){if(on)values.add(k);else values.delete(k);},contains:k=>values.has(k)},setAttribute(k,v){this[k]=v;}});
  registry.set(entry.card,{hidden:false});
 }
 const document={getElementById:id=>registry.get(id)};
 const control=new Function('document','CAMPAIGN_ROUTE','let selectedMapStage="forest1";'+source+'return {selectMapStage,getSelection:()=>selectedMapStage}')(document,CAMPAIGN_ROUTE);
 for(const selected of CAMPAIGN_ROUTE){
  control.selectMapStage(selected.id);assert.equal(control.getSelection(),selected.id);
  for(const entry of CAMPAIGN_ROUTE){
   assert.equal(registry.get(entry.card).hidden,selected.id!==entry.id);
   assert.equal(registry.get(entry.node)['aria-pressed'],String(selected.id===entry.id));
  }
 }
 control.selectMapStage('unknown');assert.equal(control.getSelection(),'final');
});
test('new game erases current-route progress and records, preserving historical archive',()=>{
 const reset=main.slice(main.indexOf('function resetCampaign(){'),main.indexOf('function recordCampaignCore'));
 assert.ok(reset.includes('legacyUnlocked:[]'));assert.ok(reset.includes('canyonFirstCompleted:false'));
 assert.ok(reset.includes('records:emptyCampaignRecords()'));assert.ok(reset.includes('completed:false,bestTime:0,clears:0'));
 assert.ok(!reset.includes('storeProgress()'));assert.ok(!reset.includes('removeItem(PROGRESS_KEY)'));
});

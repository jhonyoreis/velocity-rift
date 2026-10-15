import test from 'node:test';
import assert from 'node:assert/strict';
import {finaleBeat,FINALE_SHOTS} from '../src/rendering/finale.js';

test('nine memories appear in order before the Rubro burst',()=>{
 let count=0;
 for(let i=0;i<=100;i++){
  const beat=finaleBeat('awaken',i/100);
  assert.ok(beat.cores>=count&&beat.cores<=9);count=beat.cores;
  if(beat.burst>0)assert.equal(beat.cores,9,'all nine cores precede the transformation');
 }
 assert.equal(finaleBeat('awaken',.1).burst,0);
 assert.equal(finaleBeat('awaken',1).burst,1);
});
test('camera interpolation is bounded and the closing fade ends completely',()=>{
 for(const art of FINALE_SHOTS)for(const p of [-1,0,.1,.5,.9,1,3,NaN,Infinity]){
  const b=finaleBeat(art,p);
  assert.ok(Object.values(b).every(Number.isFinite));
  assert.ok(b.zoom>=.86&&b.zoom<=1.12);
  assert.ok(Math.abs(b.tilt)<=.055);
  assert.ok(b.fade>=0&&b.fade<=1);
 }
 assert.equal(finaleBeat('promise',1).fade,1);
 assert.equal(finaleBeat('throne',1).tilt<1e-10,true);
});

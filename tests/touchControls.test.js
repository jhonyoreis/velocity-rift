import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchDragState} from '../src/game/touchControls.js';

function setup(){
 const held=new Set(),events=[];
 const drag=createTouchDragState({
  onPress:key=>{held.add(key);events.push('+'+key);},
  onRelease:key=>{held.delete(key);events.push('-'+key);}
 });
 return {drag,held,events};
}

test('dragging Slide to Boost keeps both active until finger leaves the screen',()=>{
 const {drag,held,events}=setup();
 drag.start(10,'arrowdown');
 drag.enter(10,'shift');
 drag.enter(10,'shift');
 assert.deepEqual([...held],['arrowdown','shift']);
 assert.deepEqual(events,['+arrowdown','+shift']);
 drag.end(10);
 assert.equal(held.size,0);
 assert.deepEqual(events,['+arrowdown','+shift','-arrowdown','-shift']);
});

test('simultaneous fingers holding the same command do not release it early',()=>{
 const {drag,held}=setup();
 drag.start(1,'shift');drag.start(2,'shift');
 drag.end(1);
 assert.equal(held.has('shift'),true);
 drag.end(2);
 assert.equal(held.has('shift'),false);
});

test('a stray move cannot start a touch and cancelling releases all combinations',()=>{
 const {drag,held,events}=setup();
 drag.enter(999,'shift');
 assert.equal(held.size,0);
 drag.start(7,'arrowright');
 drag.enter(7,' ');
 drag.start(8,'arrowdown');
 drag.reset();
 assert.equal(held.size,0);
 assert.equal(drag.has(7),false);
 assert.equal(drag.has(8),false);
 assert.equal(events.filter(x=>x==='+ ').length,1);
});

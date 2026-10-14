import test from 'node:test';
import assert from 'node:assert/strict';
import {canyonEnemyVolley,canyonEnemyCooldown} from '../src/game/canyonCombat.js';

test('Prism sentries fire two different aimed bolts while drones fire one',()=>{
 const aim={x:100,y:120};
 const sentry=canyonEnemyVolley('sentry',0,0,aim),drone=canyonEnemyVolley('drone',0,0,aim);
 assert.equal(sentry.length,2);
 assert.ok(sentry[0].vy!==sentry[1].vy);
 assert.ok(sentry.every(b=>b.life>0&&b.caveShot&&!b.droneShot));
 assert.equal(drone.length,1);
 assert.ok(drone[0].vx>0&&drone[0].vy>0&&drone[0].droneShot);
 assert.deepEqual(canyonEnemyVolley('walker',0,0,aim),[]);
 assert.ok(canyonEnemyCooldown('sentry')<2.25);
 assert.ok(Number.isFinite(canyonEnemyCooldown('drone')));
});

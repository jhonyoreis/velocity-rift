import {FACTORY} from '../levels/forestTwo.js';
export function createHelix(){return {active:false,defeated:false,hp:4,maxHp:4,x:FACTORY.arenaLeft+690,y:302,time:0,cycle:-1,aim:0,waves:[],hitCooldown:0,collapse:0,exposed:false};}
// One attack at a time: target locks before impact, ground waves are jumpable,
// and the lowered reactor is reachable without the later aerial Dash upgrade.
export function advanceHelix(b,p,dt,hooks){
 if(b.defeated){b.collapse+=dt;return;}
 if(!b.active){if(p.x<FACTORY.arenaLeft+65)return;b.active=true;hooks.sound('boss-enter');hooks.notice('TITÃ HELIX','Salte no reator aberto ou use Boost.');}
 p.x=Math.max(FACTORY.arenaLeft+18,Math.min(FACTORY.arenaRight-18,p.x));
 b.time+=dt;b.hitCooldown=Math.max(0,b.hitCooldown-dt);
 const duration=6.6,cycle=Math.floor(b.time/duration),phase=b.time%duration;
 if(cycle!==b.cycle){b.cycle=cycle;b.aim=Math.max(FACTORY.arenaLeft+110,Math.min(FACTORY.arenaRight-110,p.x));b.fired=false;hooks.sound('boss-alert');}
 b.warning=phase<1.2;b.strike=phase>=1.2&&phase<1.5;b.exposed=phase>=2.6&&phase<5.4;
 b.y=b.exposed?365:302+Math.sin(b.time*2)*7;
 if(b.strike&&Math.abs(p.x-b.aim)<62)hooks.damage();
 if(phase>=1.5&&!b.fired){b.fired=true;hooks.sound('gate');for(const direction of [-1,1])b.waves.push({x:b.aim,y:414,vx:direction*(185+(4-b.hp)*18),life:4});}
 for(const w of b.waves){w.x+=w.vx*dt;w.life-=dt;if(Math.abs(p.x-w.x)<29&&p.y>386)hooks.damage();}
 b.waves=b.waves.filter(w=>w.life>0&&w.x>FACTORY.arenaLeft&&w.x<FACTORY.arenaRight);
 const contact=Math.hypot(p.x-b.x,p.y-b.y)<59;
 if(contact&&b.exposed&&b.hitCooldown===0&&(p.boosting||p.vy>40||hooks.dashing())){
  b.hp--;b.hitCooldown=1;b.exposed=false;p.vy=-490;p.vx=p.x<b.x?-240:240;
  hooks.sound(b.hp?'boss-crack':'boss-collapse');hooks.burst(b.x,b.y);
  if(!b.hp){b.defeated=true;b.waves=[];hooks.notice('REATOR DESLIGADO','A saída da fábrica está aberta.');}
 }else if(contact&&b.hitCooldown===0&&!b.exposed)hooks.damage();
}

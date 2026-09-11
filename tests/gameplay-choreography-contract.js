'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const Events=require('../src/presentation-events.js');
const Choreo=require('../src/gameplay-choreography.js');

assert.strictEqual(Events.version,'10.4B.0');
assert.strictEqual(Choreo.version,'10.4B.0');

const tx={kind:'game_action',events:[
  {type:'CARD_DRAW',playerId:'p1',iid:'d1'},{type:'CARD_DRAW',playerId:'p1',iid:'d2'},
  {type:'SPY_TRIGGER',playerId:'p1',iid:'spy',drawCount:2},
  {type:'MUSTER_SUMMON',playerId:'p1',iid:'m1',row:'close'},{type:'MUSTER_SUMMON',playerId:'p1',iid:'m2',row:'close'},
  {type:'SCORCH_TRIGGER',playerId:'p1',doomed:[{iid:'x',playerId:'p2',row:'siege'}]},
  {type:'DECOY_SWAP',playerId:'p1',row:'ranged',targetIid:'t'},
  {type:'MEDIC_REVIVE',playerId:'p1',row:'close',iid:'r'},
  {type:'WEATHER_APPLY',playerId:'p1',abilities:['frost']},{type:'WEATHER_CLEAR',playerId:'p1'},
  {type:'HORN_TRIGGER',playerId:'p1',row:'siege',source:'card'},
  {type:'TIGHT_BOND_TRIGGER',playerId:'p1',row:'close'},
  {type:'MORALE_TRIGGER',playerId:'p1',row:'ranged'},
  {type:'HERO_LAND',playerId:'p1',row:'close',iid:'h'},
  {type:'LEADER_TRIGGER',playerId:'p1'},
  {type:'PASS',playerId:'p1',reason:'manual'},
  {type:'LIFE_CHANGE',playerId:'p2',from:2,to:1},
  {type:'ROUND_END',round:1,winnerId:'p1'},{type:'BOARD_CLEAR',round:1},{type:'ROUND_START',round:2,currentPlayerId:'p1'},
  {type:'MATCH_END',winner:'p1'},{type:'FACTION_REVIVE',playerId:'p1',iid:'sk'}
]};
const plan=Choreo.plan(tx);
const kinds=plan.map(x=>x.kind);
for(const kind of ['spy','muster','scorch','decoy','medic','weather','weather-clear','horn','bond','morale','hero','leader','pass','round-end','match-result','faction-revive'])assert(kinds.includes(kind),`missing ${kind}`);
assert.strictEqual(kinds.filter(x=>x==='draw').length,0,'spy draws must be authored inside Spy sequence');
assert.strictEqual(plan.find(x=>x.kind==='spy').draws.length,2,'Spy must preserve exactly two actual draw events');
const round=plan.find(x=>x.kind==='round-end');assert.strictEqual(round.life.length,1);assert(round.clear);assert(round.roundStart);

const standalone=Choreo.plan({kind:'game_action',events:[{type:'CARD_DRAW',playerId:'p1',iid:'solo'}]});
assert.deepStrictEqual(standalone.map(x=>x.kind),['draw']);
assert.deepStrictEqual(Choreo.plan({kind:'invalid_drop',events:[]}),[]);

const source=fs.readFileSync(path.join(__dirname,'../src/gameplay-choreography.js'),'utf8');
for(const forbidden of ['.playCard(','.activateLeader(','.resolveChoice(','GwentEnginePass9'])assert(!source.includes(forbidden),`presentation layer must not own rules: ${forbidden}`);
assert(source.includes("const result=await executor(signal,token)"),'base 10.4A executor must run before authored choreography');
assert(source.includes("if(meta?.kind==='game_action')await present(meta,signal)"),'game actions must stay in one serialized presentation transaction');
assert(source.includes('MutationObserver'),'external/pass/bot/leader commits must be observed without a second rules path');

console.log('gameplay-choreography-contract: semantic planning, cause/effect grouping, engine isolation, and queue ordering passed');

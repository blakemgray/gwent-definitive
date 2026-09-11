'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const Events=require('../src/presentation-events.js');
const Choreo=require('../src/gameplay-choreography.js');

assert.strictEqual(Events.version,'10.4B.0');
assert.strictEqual(Choreo.version,'10.4B.0');

const tx={kind:'game_action',events:[
  {type:'CARD_DRAW',playerId:'p1',iid:'d1',engineIndex:1},{type:'CARD_DRAW',playerId:'p1',iid:'d2',engineIndex:2},
  {type:'SPY_TRIGGER',playerId:'p1',iid:'spy',drawCount:2,engineIndex:3},
  {type:'MUSTER_SUMMON',playerId:'p1',iid:'m1',row:'close',engineIndex:4},{type:'MUSTER_SUMMON',playerId:'p1',iid:'m2',row:'close',engineIndex:5},
  {type:'SCORCH_TRIGGER',playerId:'p1',doomed:[{iid:'x',playerId:'p2',row:'siege'}],engineIndex:6},
  {type:'DECOY_SWAP',playerId:'p1',row:'ranged',targetIid:'t',engineIndex:7},
  {type:'MEDIC_REVIVE',playerId:'p1',row:'close',iid:'r',engineIndex:8},
  {type:'WEATHER_APPLY',playerId:'p1',abilities:['frost'],engineIndex:9},{type:'WEATHER_CLEAR',playerId:'p1',engineIndex:10},
  {type:'HORN_TRIGGER',playerId:'p1',row:'siege',source:'card',engineIndex:11},
  {type:'MARDROEME_TRIGGER',playerId:'p1',row:'ranged',engineIndex:12},{type:'BERSERKER_TRANSFORM',playerId:'p1',row:'ranged',iid:'z',engineIndex:13},
  {type:'AVENGER_SUMMON',playerId:'p1',iid:'av',engineIndex:14},
  {type:'TIGHT_BOND_TRIGGER',playerId:'p1',row:'close'},{type:'MORALE_TRIGGER',playerId:'p1',row:'ranged'},
  {type:'HERO_LAND',playerId:'p1',row:'close',iid:'h'},{type:'LEADER_TRIGGER',playerId:'p1',engineIndex:0},
  {type:'ROW_SCORE_CHANGE',playerId:'p1',row:'close',from:4,to:12},{type:'TOTAL_SCORE_CHANGE',playerId:'p1',from:4,to:12},
  {type:'PASS',playerId:'p1',reason:'manual',engineIndex:15},
  {type:'LIFE_CHANGE',playerId:'p2',from:2,to:1},
  {type:'ROUND_END',round:1,winnerId:'p1',engineIndex:16},{type:'BOARD_CLEAR',round:1},
  {type:'CARD_DRAW',playerId:'p1',iid:'bonus',engineIndex:17},{type:'FACTION_REVIVE',playerId:'p1',iid:'sk',engineIndex:18},
  {type:'ROUND_START',round:2,currentPlayerId:'p1',engineIndex:19},{type:'MONSTER_RETAIN',retained:[{playerId:'p2',iid:'keep'}]},
  {type:'MATCH_END',winner:'p1',engineIndex:20}
]};
const plan=Choreo.plan(tx),kinds=plan.map(x=>x.kind);
for(const kind of ['leader','medic','spy','muster','scorch','decoy','weather','weather-clear','horn','mardroeme','transform','avenger','bond','morale','hero','pass','round-end','match-result'])assert(kinds.includes(kind),`missing ${kind}`);
assert.strictEqual(kinds.filter(x=>x==='draw').length,0,'Spy and post-round draws must be grouped with their causal sequence');
const spy=plan.find(x=>x.kind==='spy');assert.strictEqual(spy.draws.length,2,'Spy must preserve exactly two actual draw events');assert.strictEqual(spy.scores.length,2,'Spy stage must own its score consequences before draw arrivals');
assert(kinds.indexOf('leader')<kinds.indexOf('horn'),'leader origin must precede leader/card target consequences');
assert(kinds.indexOf('medic')<kinds.indexOf('muster'),'Medic revive must establish before nested Muster consequence');
const round=plan.find(x=>x.kind==='round-end');assert.strictEqual(round.life.length,1);assert(round.clear);assert(round.roundStart);assert.strictEqual(round.bonusDraws.length,1);assert.strictEqual(round.factionRevives.length,1);assert(round.retention&&round.retention.retained.length===1,'round transition must own faction carryover');

const scored=Choreo.plan({kind:'game_action',events:[{type:'HORN_TRIGGER',playerId:'p1',row:'siege',source:'card'},{type:'ROW_SCORE_CHANGE',playerId:'p1',row:'siege',from:6,to:12},{type:'TOTAL_SCORE_CHANGE',playerId:'p1',from:6,to:12}]});
assert.deepStrictEqual(scored.map(x=>x.kind),['horn','score'],'score must follow visible Horn cause');
const standalone=Choreo.plan({kind:'game_action',events:[{type:'CARD_DRAW',playerId:'p1',iid:'solo'}]});assert.deepStrictEqual(standalone.map(x=>x.kind),['draw']);
assert.deepStrictEqual(Choreo.plan({kind:'invalid_drop',events:[]}),[]);

const source=fs.readFileSync(path.join(__dirname,'../src/gameplay-choreography.js'),'utf8');
for(const forbidden of ['.playCard(','.activateLeader(','.resolveChoice(','GwentEnginePass9'])assert(!source.includes(forbidden),`presentation layer must not own rules: ${forbidden}`);
assert(source.includes("const result=await executor(signal,token)"),'base 10.4A executor must run before authored choreography');
assert(source.includes("const afterVisual=captureVisual();await present(meta,signal,{before:beforeVisual,after:afterVisual})"),'authored choreography must use presentation-only before/after visual snapshots after committed state');
assert(source.includes('MutationObserver'),'external/pass/bot/leader commits must be observed without a second rules path');
assert(source.includes('freezeBoardBefore')&&source.includes('presentScorch'),'destructive/round choreography must preserve pre-collapse visual identity');
assert(source.includes('scoreSequence'),'score presentation must be sequenced after visible cause');

const eventSource=fs.readFileSync(path.join(__dirname,'../src/presentation-events.js'),'utf8');
assert(!eventSource.includes('gameplay-choreography.js')&&!eventSource.includes('choreography-external-gate.js'),'semantic event adapter must not bootstrap presentation runtime');
assert(!eventSource.includes('document.createElement'),'semantic event adapter must remain free of DOM loader side effects');
assert(eventSource.includes('engineIndex'),'semantic events must preserve engine order metadata for causal planning');
assert(eventSource.includes("type:'MONSTER_RETAIN'")||eventSource.includes("'MONSTER_RETAIN'"),'Monster retention must be derivable without changing engine rules');

console.log('gameplay-choreography-contract: causal planning, visual snapshots, score ordering, lifecycle grouping, engine isolation, and adapter purity passed');

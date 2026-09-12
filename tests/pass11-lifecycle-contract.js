'use strict';
const assert=require('assert');
const G=require('../src/gwent-engine.js');

let assertions=0;
function ok(value,message){assert.ok(value,message);assertions++;}
function eq(actual,expected,message){assert.deepStrictEqual(actual,expected,message);assertions++;}

function medicFixture(target='realms_keira'){
  let state=G.createMatch({
    p1Faction:'realms',p2Faction:'monsters',
    p1Deck:['realms_banner_nurse',target],p2Deck:['monsters_fiend'],
    handSize:1,firstPlayerId:'p1',seed:111002,autoPass:false
  });
  state.players.p1.grave.push(state.players.p1.deck.shift());
  return G.applyAction(state,{type:'PLAY_CARD',playerId:'p1',iid:state.players.p1.hand[0].iid,row:'siege'});
}

let state=medicFixture();
eq(state.pendingChoice.type,'medic','Medic exposes an explicit typed pending choice');
const p1Choices=G.legalChoiceActions(state,'p1');
eq(p1Choices.length,1,'only the engine-provided grave candidate is exposed');
eq(G.legalChoiceActions(state,'p2'),[],'the other player cannot resolve the choice');
state=G.applyAction(state,p1Choices[0]);
ok(!state.pendingChoice,'ordinary Medic choice completes');
ok(state.players.p1.board.ranged.some(x=>x.cardId==='realms_keira'),'chosen unit is revived to its legal row');
eq(state.currentPlayerId,'p2','turn resumes exactly once after the choice');

state=medicFixture('neutral_olgierd');
let choice=G.legalChoiceActions(state,'p1')[0];
state=G.applyAction(state,choice);
eq(state.pendingChoice.type,'revive_row','agile revive creates a nested row choice');
const rows=G.legalChoiceActions(state,'p1');
eq(rows.map(x=>x.row),['close','ranged'],'nested choice exposes only legal rows');
state=G.applyAction(state,rows.find(x=>x.row==='ranged'));
ok(state.players.p1.board.ranged.some(x=>x.cardId==='neutral_olgierd'),'agile unit lands in the chosen row');
eq(state.currentPlayerId,'p2','nested resolution resumes the turn once');

const unknown=G.helpers.deepClone(state);
unknown.pendingChoice={type:'future_choice',playerId:'p1'};
eq(G.legalChoiceActions(unknown,'p1'),[],'unknown choices fail closed with no invented action');

let terminal=G.createMatch({
  p1Faction:'realms',p2Faction:'monsters',
  p1Deck:['realms_keira'],p2Deck:['monsters_fiend'],
  handSize:1,firstPlayerId:'p1',seed:111003
});
terminal=G.applyAction(terminal,G.legalActions(terminal,'p1').find(x=>x.type==='PLAY_CARD'));
terminal=G.applyAction(terminal,G.legalActions(terminal,'p2').find(x=>x.type==='PLAY_CARD'));
ok(!!terminal.winner,'automatic exhaustion reaches a terminal best-of-three result');
ok(terminal.roundHistory.length>=2,'terminal trace records round progression');
ok(terminal.eventLog.some(x=>x.type==='MATCH_ENDED'),'terminal semantic event is recorded');

console.log(`pass11-lifecycle-contract: ${assertions} assertions passed`);

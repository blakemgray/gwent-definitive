'use strict';
const assert=require('assert');
const catalog=require('../src/cards-catalog.js');
const G=require('../src/gwent-engine.js');

let assertions=0;
function ok(value,message){assert.ok(value,message);assertions++;}
function eq(actual,expected,message){assert.deepStrictEqual(actual,expected,message);assertions++;}

function leaderFor(faction){
  return catalog.find(c=>c.faction===faction&&c.row==='leader')?.stableId;
}
function legalDeck(faction){
  const units=[];
  for(const card of catalog){
    if(card.row==='leader'||card.faction==='special'||card.faction==='weather')continue;
    if(card.faction!==faction&&card.faction!=='neutral')continue;
    for(let i=0;i<Math.max(0,Number(card.count)||0)&&units.length<24;i++)units.push(card.stableId);
    if(units.length>=24)break;
  }
  return units.concat(['special_decoy','weather_clear']);
}

const realms=legalDeck('realms');
const monsters=legalDeck('monsters');
const realmsLeader=leaderFor('realms');
const monstersLeader=leaderFor('monsters');

const realmsCheck=G.validateDeck({faction:'realms',leaderId:realmsLeader,deckIds:realms});
const monstersCheck=G.validateDeck({faction:'monsters',leaderId:monstersLeader,deckIds:monsters});
ok(realmsCheck.valid,'generated Northern Realms deck must be legal');
ok(monstersCheck.valid,'generated Monsters deck must be legal');
eq(realmsCheck.summary.units,24,'unit count is explicit');
eq(realmsCheck.summary.specials,2,'weather and special cards share the special cap');

let invalid=G.validateDeck({faction:'realms',leaderId:realmsLeader,deckIds:realms.slice(0,16)});
ok(!invalid.valid&&invalid.errors.some(e=>e.code==='minimum_units'),'undersized integration deck must be rejected');
invalid=G.validateDeck({faction:'realms',leaderId:monstersLeader,deckIds:realms});
ok(!invalid.valid&&invalid.errors.some(e=>e.code==='leader_faction_mismatch'),'wrong-faction leader must be rejected');
invalid=G.validateDeck({faction:'realms',leaderId:realmsLeader,deckIds:realms.concat(['monsters_fiend'])});
ok(!invalid.valid&&invalid.errors.some(e=>e.code==='card_faction_mismatch'),'wrong-faction unit must be rejected');
invalid=G.validateDeck({faction:'realms',leaderId:realmsLeader,deckIds:realms.concat(Array(11).fill('special_horn'))});
ok(!invalid.valid&&invalid.errors.some(e=>e.code==='maximum_specials'),'special-card maximum must be enforced');
ok(invalid.errors.some(e=>e.code==='copy_limit_exceeded'),'catalog copy availability must be enforced');

const options={
  p1Faction:'realms',p2Faction:'monsters',p1LeaderId:realmsLeader,p2LeaderId:monstersLeader,
  p1Deck:realms,p2Deck:monsters,handSize:10,seed:110011,firstPlayerId:'p1',
  validateDecks:true,shuffleDecks:true,mulligan:true
};
const a=G.createMatch(options);
const b=G.createMatch(options);
const c=G.createMatch({...options,seed:110012});
eq(a,b,'same seed and options must produce identical shuffled setup');
ok(JSON.stringify(a.players.p1.hand.map(x=>x.cardId))!==JSON.stringify(c.players.p1.hand.map(x=>x.cardId)),'different seed should change the opening hand');
eq(a.setupPhase,'mulligan','production setup begins in mulligan phase');
eq(a.players.p1.hand.length,10,'player opening draw');
eq(a.players.p2.hand.length,10,'opponent opening draw');
eq(a.players.p1.deck.length,realms.length-10,'player remaining deck is full-size');
eq(a.players.p2.deck.length,monsters.length-10,'opponent remaining deck is full-size');
eq(G.legalActions(a,'p1').length,0,'gameplay is gated until mulligan finishes');
ok(a.eventLog.some(e=>e.type==='DECKS_VALIDATED'),'validation is recorded');
eq(a.eventLog.filter(e=>e.type==='DECK_SHUFFLED').length,2,'both decks are shuffled');

const allBefore=[...a.players.p1.hand,...a.players.p1.deck].map(x=>x.iid).sort();
const outgoing=a.players.p1.hand[0];
const first=G.applyAction(a,{type:'MULLIGAN_CARD',playerId:'p1',iid:outgoing.iid});
eq(first.mulliganCounts.p1,1,'first mulligan counted');
ok(!first.players.p1.hand.some(x=>x.iid===outgoing.iid),'outgoing card leaves the hand');
ok(first.players.p1.deck.some(x=>x.iid===outgoing.iid),'outgoing card returns to the deck');
const allAfter=[...first.players.p1.hand,...first.players.p1.deck].map(x=>x.iid).sort();
eq(allAfter,allBefore,'mulligan conserves every physical card instance');
ok(first.eventLog.at(-1).type==='CARD_MULLIGANED','mulligan semantic event recorded');

const second=G.applyAction(first,{type:'MULLIGAN_CARD',playerId:'p1',iid:first.players.p1.hand[0].iid});
eq(second.mulliganCounts.p1,2,'second mulligan counted');
assert.throws(()=>G.applyAction(second,{type:'MULLIGAN_CARD',playerId:'p1',iid:second.players.p1.hand[0].iid}),/limit/i);
assertions++;

const started=G.applyAction(second,{type:'FINISH_MULLIGAN'});
eq(started.setupPhase,'playing','finish action opens gameplay');
ok(started.eventLog.at(-1).type==='MULLIGAN_FINISHED','mulligan completion recorded');
ok(G.legalActions(started,'p1').some(x=>x.type==='PLAY_CARD'),'normal legal actions become available');
assert.throws(()=>G.applyAction(started,{type:'FINISH_MULLIGAN'}),/already closed/i);
assertions++;

console.log(`pass11-setup-contract: ${assertions} assertions passed`);

'use strict';
const assert=require('assert');
const catalog=require('../src/cards-catalog.js');
const G=require('../src/gwent-engine.js');
let n=0; const ok=(cond,msg)=>{assert.ok(cond,msg);n++;};

ok(catalog.length===216,'catalog must contain 216 entries');
ok(new Set(catalog.map(c=>c.stableId)).size===216,'stable ids must be unique');
const cov=G.abilityCoverage();
ok(cov.catalogCards===216,'engine catalog breadth');
ok(cov.unsupported.length===0,'no unsupported ability tokens');
ok(cov.supported.length===44,'44 supported ability tokens');
ok(cov.leaders===22,'22 leaders');
ok(JSON.stringify(G.ROWS)===JSON.stringify(['close','ranged','siege']),'canonical rows');

const base={
 p1Faction:'realms',p2Faction:'monsters',p1LeaderId:'realms_foltest_copper',p2LeaderId:'monsters_eredin_silver',
 p1Deck:['realms_thaler','realms_blue_stripes','realms_blue_stripes','realms_catapult_1','weather_frost','weather_clear','special_scorch','special_decoy','realms_banner_nurse','neutral_geralt','realms_keira','realms_trebuchet_1'],
 p2Deck:['monsters_earth_elemental','monsters_gravehag','monsters_cockatrice','monsters_gargoyle','monsters_fiend','monsters_fogling','monsters_ghoul_1','monsters_ghoul_2','monsters_ghoul','weather_fog','weather_rain','special_scorch'],
 handSize:4,seed:424242,firstPlayerId:'p1'
};
const a=G.createMatch(base), b=G.createMatch(base);
ok(JSON.stringify(a)===JSON.stringify(b),'same seed/options must create identical state');
ok(a.players.p1.hand.length===4&&a.players.p1.deck.length===8,'opening draw counts');

let s=G.createMatch({...base,handSize:1,p1Deck:['realms_blue_stripes','realms_blue_stripes'],p2Deck:['monsters_cockatrice','monsters_gargoyle']});
let act=G.legalActions(s,'p1').find(x=>x.type==='PLAY_CARD');
s=G.applyAction(s,act);
ok(s.players.p1.board.close.length===1,'unit placed into close row');
ok(s.currentPlayerId==='p2','turn advances after ordinary unit play');

s=G.createMatch({...base,handSize:1,p1Deck:['realms_thaler','realms_keira','realms_sheldon'],p2Deck:['monsters_cockatrice','monsters_gargoyle','monsters_fiend']});
act=G.legalActions(s,'p1').find(x=>x.type==='PLAY_CARD');
s=G.applyAction(s,act);
ok(s.players.p2.board.siege.some(x=>x.cardId==='realms_thaler'),'spy deploys to opponent row');
ok(s.players.p1.hand.length===2,'spy draws two cards after leaving hand');

s=G.createMatch({...base,handSize:1,p1Deck:['weather_frost','realms_keira'],p2Deck:['monsters_cockatrice','monsters_gargoyle']});
act=G.legalActions(s,'p1').find(x=>x.type==='PLAY_CARD');
s=G.applyAction(s,act);
ok(s.weather.close===true,'frost applies close-row weather');

s=G.createMatch({...base,handSize:2,p1Deck:['realms_blue_stripes','realms_blue_stripes'],p2Deck:['monsters_cockatrice','monsters_gargoyle']});
act=G.legalActions(s,'p1').find(x=>x.type==='PLAY_CARD'); s=G.applyAction(s,act);
act=G.legalActions(s,'p2').find(x=>x.type==='PASS'); s=G.applyAction(s,act);
act=G.legalActions(s,'p1').find(x=>x.type==='PLAY_CARD'); s=G.applyAction(s,act);
ok(G.rowScore(s,'p1','close')===16,'tight bond doubles both identical units');

s=G.createMatch({...base,handSize:1,p1Deck:['realms_catapult_1','realms_keira'],p2Deck:['monsters_cockatrice','monsters_gargoyle']});
act=G.legalActions(s,'p1').find(x=>x.type==='ACTIVATE_LEADER'); s=G.applyAction(s,act);
ok(s.players.p1.board.leaderHorn.siege===true,'Foltest leader horn occupies siege special state');
ok(s.players.p1.leaderUsed===true,'leader marked used');

s=G.createMatch({...base,handSize:1,p1Deck:['realms_keira'],p2Deck:['monsters_cockatrice'],firstPlayerId:'p1'});
s=G.applyAction(s,G.legalActions(s,'p1').find(x=>x.type==='PASS'));
s=G.applyAction(s,G.legalActions(s,'p2').find(x=>x.type==='PASS'));
ok(s.round===2||!!s.winner,'double pass resolves round');
ok(s.roundHistory.length===1,'round history recorded');

console.log(`engine-regression: ${n} assertions passed`);

'use strict';
const assert=require('assert');
const catalog=require('../src/cards-catalog.js');
const G=require('../src/gwent-engine.js');
const factions=['realms','nilfgaard','monsters','scoiatael','skellige'];
function rng(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
function shuffled(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pool(f){const out=[];for(const c of catalog){if(c.row==='leader'||c.count<=0)continue;if([f,'neutral','special','weather'].includes(c.faction)){for(let i=0;i<Math.max(1,c.count);i++)out.push(c.stableId);}}return out;}
function leader(f){return catalog.find(c=>c.faction===f&&c.row==='leader')?.stableId||null;}
function resolvePending(s,r){const c=s.pendingChoice;if(!c)return s;switch(c.type){
 case 'scoiatael_first': return G.resolveChoice(s,{type:'RESOLVE_FIRST_PLAYER',playerId:c.candidatePlayerIds[Math.floor(r()*c.candidatePlayerIds.length)]});
 case 'medic': return G.resolveChoice(s,{type:'RESOLVE_MEDIC',targetIid:c.candidateIids[0]});
 case 'revive_row': return G.resolveChoice(s,{type:'RESOLVE_REVIVE_ROW',row:c.candidateRows[0]});
 case 'leader_steal_grave': return G.resolveChoice(s,{type:'RESOLVE_LEADER_STEAL',targetIid:c.candidateIids[0]});
 case 'leader_return_grave': return G.resolveChoice(s,{type:'RESOLVE_LEADER_RETURN',targetIid:c.candidateIids[0]});
 case 'leader_weather_choice': return G.resolveChoice(s,{type:'RESOLVE_LEADER_WEATHER',targetIid:c.candidateIids[0]});
 case 'leader_destroyer': return G.resolveChoice(s,{type:'RESOLVE_LEADER_DESTROYER',discardIids:c.handIids.slice(0,2),deckTargetIid:c.deckIids[0]});
 case 'skellige_row': return G.resolveChoice(s,{type:'RESOLVE_SKELLIGE_ROW',row:'close'});
 default: throw new Error('Unhandled pending choice '+c.type);
}}
let games=0,actions=0;
for(let g=0;g<75;g++){
 const r=rng(9000+g), f1=factions[g%factions.length], f2=factions[(g+2)%factions.length];
 let s=G.createMatch({p1Faction:f1,p2Faction:f2,p1LeaderId:leader(f1),p2LeaderId:leader(f2),p1Deck:shuffled(pool(f1),r),p2Deck:shuffled(pool(f2),r),handSize:10,seed:100000+g,firstPlayerId:g%2?'p2':'p1'});
 for(let step=0;step<320&&!s.winner;step++){
   if(s.pendingChoice){s=resolvePending(s,r);actions++;continue;}
   const pid=s.currentPlayerId;if(!pid)break;
   const acts=G.legalActions(s,pid);if(!acts.length)break;
   const a=acts[Math.floor(r()*acts.length)];
   try{s=G.applyAction(s,a);}catch(err){throw new Error(`game ${g} step ${step} ${pid} ${JSON.stringify(a)}: ${err.message}`);}
   actions++;
   for(const p of ['p1','p2']){
     assert(s.players[p].health>=0&&s.players[p].health<=2,'health invariant');
     for(const row of G.ROWS)assert(Array.isArray(s.players[p].board[row]),'row array invariant');
   }
 }
 games++;
}
console.log(`catalog-fuzz: ${games} games / ${actions} actions / 0 invariant failures`);

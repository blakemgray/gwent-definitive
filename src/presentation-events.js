(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GwentPresentationEvents=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  const ROWS=['close','ranged','siege'];
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  function scores(G,s){if(!s)return null;const x=G.scoreSnapshot(s);return {p1:x.p1,p2:x.p2};}
  function locate(G,s,iid){if(!s||!iid)return null;try{return clone(G.helpers.locateAny(s,iid));}catch(_){return null;}}
  function boardSnapshot(G,s){
    if(!s)return null;const out={p1:{},p2:{},weather:[],round:s.round,winner:s.winner||null};
    for(const pid of ['p1','p2'])for(const row of ROWS)out[pid][row]=(s.players[pid]?.board?.[row]||[]).map(inst=>({iid:inst.iid,cardId:inst.cardId,power:G.helpers.effectiveCardPower(s,pid,row,inst)}));
    out.weather=(s.weatherCards||[]).map(x=>({ownerId:x.ownerId,iid:x.inst?.iid||null,cardId:x.inst?.cardId||null}));return out;
  }
  const healthSnapshot=s=>s?{p1:s.players.p1.health,p2:s.players.p2.health}:null;
  const handsSnapshot=s=>s?{p1:s.players.p1.hand.length,p2:s.players.p2.hand.length}:null;
  function pushScoreEvents(events,b,a){if(!b||!a)return;for(const pid of ['p1','p2']){for(const row of ROWS){const from=b[pid][row],to=a[pid][row];if(from!==to)events.push({type:'ROW_SCORE_CHANGE',playerId:pid,row,from,to});}if(b[pid].total!==a[pid].total)events.push({type:'TOTAL_SCORE_CHANGE',playerId:pid,from:b[pid].total,to:a[pid].total});}}
  function semanticFromEngine(G,engineEvents,beforeBoard){
    const out=[],lookup={};if(beforeBoard)for(const pid of ['p1','p2'])for(const row of ROWS)for(const c of beforeBoard[pid][row]||[])lookup[c.iid]={playerId:pid,row,...c};
    for(const e of engineEvents){const d=e.data||{};switch(e.type){
      case 'CARD_DRAWN':out.push({type:'CARD_DRAW',playerId:d.playerId,iid:d.iid,cardId:d.cardId});break;
      case 'SPY_RESOLVED':out.push({type:'SPY_TRIGGER',playerId:d.playerId,iid:d.iid,drawCount:d.drawCount||2});break;
      case 'MUSTER_SUMMON':out.push({type:'MUSTER_SUMMON',playerId:d.playerId,iid:d.iid,cardId:d.cardId,row:d.row});break;
      case 'SCORCH_RESOLVED':case 'ROW_SCORCH_RESOLVED':out.push({type:'SCORCH_TRIGGER',playerId:d.playerId,row:d.row||null,sourceIid:d.sourceIid||null,doomed:(d.doomed||[]).map(iid=>({iid,...(lookup[iid]||{})}))});break;
      case 'UNIT_REVIVED':out.push({type:'MEDIC_REVIVE',playerId:d.playerId,iid:d.iid,cardId:d.cardId,row:d.row});break;
      case 'DECOY_SWAP':out.push({type:'DECOY_SWAP',playerId:d.playerId,targetIid:d.targetIid,row:d.row});break;
      case 'WEATHER_APPLIED':out.push({type:'WEATHER_APPLY',playerId:d.playerId,cardId:d.cardId,abilities:clone(d.abilities||[])});break;
      case 'CLEAR_WEATHER':out.push({type:'WEATHER_CLEAR',playerId:d.playerId});break;
      case 'LEADER_HORN':out.push({type:'HORN_TRIGGER',playerId:d.playerId,row:d.row,source:'leader'});break;
      case 'ROW_SPECIAL_PLACED':{const def=G.CARD_DB[d.cardId];if(def?.abilities?.includes('horn'))out.push({type:'HORN_TRIGGER',playerId:d.playerId,row:d.row,source:'card',iid:d.iid,cardId:d.cardId});break;}
      case 'LEADER_USED':out.push({type:'LEADER_TRIGGER',playerId:d.playerId,leaderId:d.leaderId});break;
      case 'PLAYER_PASSED':out.push({type:'PASS',playerId:d.playerId,reason:'manual'});break;
      case 'AUTO_PASS':out.push({type:'PASS',playerId:d.playerId,reason:d.reason||'exhaustion'});break;
      case 'ROUND_ENDED':out.push({type:'ROUND_END',round:d.round,winnerId:d.winnerId||null,scores:clone(d.scores)});break;
      case 'ROUND_STARTED':out.push({type:'ROUND_START',round:d.round,currentPlayerId:d.currentPlayerId});break;
      case 'MATCH_ENDED':out.push({type:'MATCH_END',winner:d.winner});break;
      case 'SKELLIGE_REVIVE':out.push({type:'FACTION_REVIVE',playerId:d.playerId,iid:d.iid,cardId:d.cardId});break;
    }}return out;
  }
  function build(G,before,after,action,meta={}){
    const iid=action?.iid||null,beforeLoc=locate(G,before,iid),afterLoc=locate(G,after,iid),beforeScores=scores(G,before),afterScores=scores(G,after),beforeBoard=boardSnapshot(G,before),afterBoard=boardSnapshot(G,after),beforeHealth=healthSnapshot(before),afterHealth=healthSnapshot(after),beforeHands=handsSnapshot(before),afterHands=handsSnapshot(after),events=[];
    if(iid&&beforeLoc?.zone==='hand')events.push({type:'CARD_LEAVE_HAND',iid,from:beforeLoc});
    if(iid&&afterLoc){if(afterLoc.zone==='board')events.push({type:'CARD_ENTER_ROW',iid,playerId:afterLoc.playerId,row:afterLoc.row});else if(afterLoc.zone==='special')events.push({type:'CARD_ENTER_SPECIAL',iid,playerId:afterLoc.playerId,row:afterLoc.row});else if(afterLoc.zone==='weather')events.push({type:'CARD_ENTER_WEATHER',iid});else if(afterLoc.zone==='grave')events.push({type:'CARD_ENTER_GRAVE',iid,playerId:afterLoc.playerId});}
    pushScoreEvents(events,beforeScores,afterScores);
    if(beforeHealth&&afterHealth)for(const pid of ['p1','p2'])if(beforeHealth[pid]!==afterHealth[pid])events.push({type:'LIFE_CHANGE',playerId:pid,from:beforeHealth[pid],to:afterHealth[pid]});
    if(before?.currentPlayerId!==after?.currentPlayerId)events.push({type:'TURN_CHANGE',from:before?.currentPlayerId||null,to:after?.currentPlayerId||null});
    if(before?.round!==after?.round)events.push({type:'ROUND_CHANGE',from:before?.round||null,to:after?.round||null});
    const beforeLog=before?.eventLog?.length||0,engineEvents=(after?.eventLog||[]).slice(beforeLog).map(clone);events.push(...semanticFromEngine(G,engineEvents,beforeBoard));if(engineEvents.some(e=>e.type==='ROUND_ENDED'))events.push({type:'BOARD_CLEAR',round:before?.round||null});
    const cardId=beforeLoc?.card?.cardId||null,def=cardId?G.CARD_DB[cardId]:null,pid=afterLoc?.playerId||action?.playerId||null,row=afterLoc?.row||action?.row||null;
    if(def?.abilities?.includes('bond'))events.push({type:'TIGHT_BOND_TRIGGER',iid,playerId:pid,row,cardId});if(def?.abilities?.includes('morale'))events.push({type:'MORALE_TRIGGER',iid,playerId:pid,row,cardId});if(def?.abilities?.includes('hero'))events.push({type:'HERO_LAND',iid,playerId:pid,row,cardId});
    return {version:'10.4B.0',kind:'game_action',inputMethod:meta.inputMethod||'unknown',action:clone(action),iid,beforeLocation:beforeLoc,afterLocation:afterLoc,events,engineEvents,beforeScores,afterScores,beforeHealth,afterHealth,beforeHands,afterHands,beforeBoard,afterBoard,createdAt:Date.now()};
  }
  return Object.freeze({version:'10.4B.0',build,boardSnapshot,semanticFromEngine});
});

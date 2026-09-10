(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GwentPresentationEvents=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function scores(G,state){
    if(!state)return null;
    return {p1:G.scoreSnapshot(state).p1,p2:G.scoreSnapshot(state).p2};
  }
  function locate(G,state,iid){
    if(!state||!iid)return null;
    try{return clone(G.helpers.locateAny(state,iid));}catch(_){return null;}
  }
  function pushScoreEvents(events,beforeScores,afterScores){
    if(!beforeScores||!afterScores)return;
    for(const pid of ['p1','p2']){
      for(const row of ['close','ranged','siege']){
        const from=beforeScores[pid][row],to=afterScores[pid][row];
        if(from!==to)events.push({type:'ROW_SCORE_CHANGE',playerId:pid,row,from,to});
      }
      if(beforeScores[pid].total!==afterScores[pid].total)events.push({type:'TOTAL_SCORE_CHANGE',playerId:pid,from:beforeScores[pid].total,to:afterScores[pid].total});
    }
  }
  function build(G,before,after,action,meta={}){
    const iid=action?.iid||null;
    const beforeLoc=locate(G,before,iid);
    const afterLoc=locate(G,after,iid);
    const beforeScores=scores(G,before),afterScores=scores(G,after);
    const events=[];
    if(iid&&beforeLoc?.zone==='hand')events.push({type:'CARD_LEAVE_HAND',iid,from:beforeLoc});
    if(iid&&afterLoc){
      if(afterLoc.zone==='board')events.push({type:'CARD_ENTER_ROW',iid,playerId:afterLoc.playerId,row:afterLoc.row});
      else if(afterLoc.zone==='special')events.push({type:'CARD_ENTER_SPECIAL',iid,playerId:afterLoc.playerId,row:afterLoc.row});
      else if(afterLoc.zone==='weather')events.push({type:'CARD_ENTER_WEATHER',iid});
      else if(afterLoc.zone==='grave')events.push({type:'CARD_ENTER_GRAVE',iid,playerId:afterLoc.playerId});
    }
    pushScoreEvents(events,beforeScores,afterScores);
    if(before?.currentPlayerId!==after?.currentPlayerId)events.push({type:'TURN_CHANGE',from:before?.currentPlayerId||null,to:after?.currentPlayerId||null});
    if(before?.round!==after?.round)events.push({type:'ROUND_CHANGE',from:before?.round||null,to:after?.round||null});
    const beforeLog=before?.eventLog?.length||0;
    const engineEvents=(after?.eventLog||[]).slice(beforeLog).map(e=>clone(e));
    return {
      version:'10.4A.0',
      kind:'game_action',
      inputMethod:meta.inputMethod||'unknown',
      action:clone(action),
      iid,
      beforeLocation:beforeLoc,
      afterLocation:afterLoc,
      events,
      engineEvents,
      beforeScores,
      afterScores,
      createdAt:Date.now()
    };
  }

  return Object.freeze({version:'10.4A.0',build});
});

(function(root){
  'use strict';
  const SAVE_KEY='gwent-definitive-match-v2';
  const SETTINGS_KEY='gwent-definitive-settings-v2';
  const SAVE_SCHEMA=2;
  const SAVE_BUILD='11.golden.1';
  const SAVE_FORMAT='pass11-normal-v1';
  const LEGACY_COMPATIBLE_BUILDS=new Set(['11.1A','11.1B']);
  const VALID_PHASES=new Set(['mulligan','match','result']);
  const PLAYER_IDS=new Set(['p1','p2']);
  const ROWS=['close','ranged','siege'];
  let lastWriteStatus={ok:true,recovered:false,phase:null,error:null};

  function safeParse(raw){try{return JSON.parse(raw);}catch{return null;}}
  function safeGet(key){try{return localStorage.getItem(key);}catch{return null;}}
  function loadSettings(){return safeParse(safeGet(SETTINGS_KEY))||{};}
  function saveSettings(value){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(value||{}));return true;}catch{return false;}}

  function dispatchWriteStatus(status){
    lastWriteStatus=status;
    if(!root||typeof root.dispatchEvent!=='function'||typeof root.CustomEvent!=='function')return;
    const emit=()=>{try{root.dispatchEvent(new root.CustomEvent('gwent:save-status',{detail:status}));}catch(_){/* storage telemetry is non-authoritative */}};
    if(typeof root.queueMicrotask==='function')root.queueMicrotask(emit);else Promise.resolve().then(emit);
  }

  function cardKnown(cardId){
    if(typeof cardId!=='string'||!cardId)return false;
    const engine=root?.GwentEnginePass9||root?.GwentEnginePass8;
    return !engine?.CARD_DB||!!engine.CARD_DB[cardId];
  }

  function validateInstance(inst,seen){
    if(!inst||typeof inst!=='object'||typeof inst.iid!=='string'||!inst.iid||!cardKnown(inst.cardId))return false;
    if(seen.has(inst.iid))return false;
    seen.add(inst.iid);
    return true;
  }

  function validatePlayer(player,seen){
    if(!player||typeof player!=='object')return false;
    for(const zone of ['hand','deck','grave']){
      if(!Array.isArray(player[zone]))return false;
      for(const inst of player[zone])if(!validateInstance(inst,seen))return false;
    }
    const board=player.board;
    if(!board||typeof board!=='object'||!board.special||typeof board.special!=='object'||!board.leaderHorn||typeof board.leaderHorn!=='object')return false;
    for(const row of ROWS){
      if(!Array.isArray(board[row]))return false;
      for(const inst of board[row])if(!validateInstance(inst,seen))return false;
      if(board.special[row]!=null&&!validateInstance(board.special[row],seen))return false;
      if(typeof board.leaderHorn[row]!=='boolean')return false;
    }
    if(player.leaderId!=null&&!cardKnown(player.leaderId))return false;
    if(typeof player.passed!=='boolean'||!Number.isFinite(Number(player.health)))return false;
    return true;
  }

  function validatePendingChoice(choice,allIids){
    if(choice==null)return true;
    if(typeof choice!=='object'||typeof choice.type!=='string'||!choice.type||!PLAYER_IDS.has(choice.playerId))return false;
    for(const key of ['candidateIids','handIids','deckIids']){
      if(choice[key]!=null){
        if(!Array.isArray(choice[key])||choice[key].some(iid=>typeof iid!=='string'||!allIids.has(iid)))return false;
      }
    }
    for(const key of ['targetIid','sourceIid']){
      if(choice[key]!=null&&(typeof choice[key]!=='string'||!allIids.has(choice[key])))return false;
    }
    if(choice.candidatePlayerIds!=null&&(!Array.isArray(choice.candidatePlayerIds)||choice.candidatePlayerIds.some(pid=>!PLAYER_IDS.has(pid))))return false;
    if(choice.candidateRows!=null&&(!Array.isArray(choice.candidateRows)||choice.candidateRows.some(row=>!ROWS.includes(row))))return false;
    if(choice.opponentId!=null&&!PLAYER_IDS.has(choice.opponentId))return false;
    return true;
  }

  function validateState(state){
    if(!state||typeof state!=='object'||!state.players||!state.players.p1||!state.players.p2)return false;
    if(!PLAYER_IDS.has(state.currentPlayerId)||!Number.isFinite(Number(state.round))||Number(state.round)<1)return false;
    if(state.winner!=null&&!['p1','p2','draw'].includes(state.winner))return false;
    if(!['mulligan','playing'].includes(state.setupPhase))return false;
    if(!state.weather||typeof state.weather!=='object'||ROWS.some(row=>typeof state.weather[row]!=='boolean'))return false;
    if(!Array.isArray(state.weatherCards))return false;
    const seen=new Set();
    if(!validatePlayer(state.players.p1,seen)||!validatePlayer(state.players.p2,seen))return false;
    for(const entry of state.weatherCards){
      if(!entry||typeof entry!=='object'||!PLAYER_IDS.has(entry.ownerId)||!validateInstance(entry.inst,seen))return false;
    }
    if(!validatePendingChoice(state.pendingChoice,seen))return false;
    return true;
  }

  function compatiblePayload(p){
    if(p.format!=null)return p.format===SAVE_FORMAT;
    return LEGACY_COMPATIBLE_BUILDS.has(p.build);
  }

  function validatePayload(p){
    if(!p||p.schema!==SAVE_SCHEMA||!VALID_PHASES.has(p.phase)||!compatiblePayload(p)||!validateState(p.state))return false;
    if(p.phase==='mulligan'&&p.state.setupPhase!=='mulligan')return false;
    if(p.phase!=='mulligan'&&p.state.setupPhase==='mulligan')return false;
    if(p.phase==='result'&&!p.state.winner)return false;
    if(p.phase!=='result'&&p.state.winner)return false;
    return true;
  }

  function writeMatch({state,setup,lab=false,phase='match',mulliganUsed=0}){
    if(!state)return null;
    const safePhase=VALID_PHASES.has(phase)?phase:'match';
    const payload={schema:SAVE_SCHEMA,format:SAVE_FORMAT,build:SAVE_BUILD,savedAt:new Date().toISOString(),phase:safePhase,mulliganUsed:Math.max(0,Math.min(2,Number(mulliganUsed)||0)),classification:state.classification||'classic',lab:!!lab,setup:setup||{},state};
    const recovered=lastWriteStatus.ok===false;
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify(payload));
      dispatchWriteStatus({ok:true,recovered,phase:safePhase,error:null,savedAt:payload.savedAt});
      return payload;
    }catch(err){
      dispatchWriteStatus({ok:false,recovered:false,phase:safePhase,error:{name:String(err?.name||'StorageError'),message:String(err?.message||'Unable to save match')}});
      return null;
    }
  }

  function readMatch(){
    const p=safeParse(safeGet(SAVE_KEY));
    if(!validatePayload(p))return null;
    p.mulliganUsed=Math.max(0,Math.min(2,Number(p.mulliganUsed)||0));
    return p;
  }
  function clearMatch(){try{localStorage.removeItem(SAVE_KEY);return true;}catch{return false;}}
  root.GwentStorage={SAVE_KEY,SETTINGS_KEY,SAVE_SCHEMA,SAVE_BUILD,SAVE_FORMAT,LEGACY_COMPATIBLE_BUILDS,VALID_PHASES,loadSettings,saveSettings,writeMatch,readMatch,clearMatch,validateState,validatePayload,get lastWriteStatus(){return lastWriteStatus;}};
})(typeof self!=='undefined'?self:this);
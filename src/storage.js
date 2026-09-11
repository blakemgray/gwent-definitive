(function(root){
  'use strict';
  const SAVE_KEY='gwent-definitive-match-v2';
  const SETTINGS_KEY='gwent-definitive-settings-v2';
  const SAVE_SCHEMA=2;
  const VALID_PHASES=new Set(['mulligan','match','result']);
  function safeParse(raw){try{return JSON.parse(raw);}catch{return null;}}
  function loadSettings(){return safeParse(localStorage.getItem(SETTINGS_KEY))||{};}
  function saveSettings(value){localStorage.setItem(SETTINGS_KEY,JSON.stringify(value||{}));}
  function writeMatch({state,setup,lab=false,phase='match',mulliganUsed=0}){
    if(!state)return null;
    const safePhase=VALID_PHASES.has(phase)?phase:'match';
    const payload={schema:SAVE_SCHEMA,build:'11.1B',savedAt:new Date().toISOString(),phase:safePhase,mulliganUsed:Math.max(0,Math.min(2,Number(mulliganUsed)||0)),classification:state.classification||'classic',lab:!!lab,setup:setup||{},state};
    localStorage.setItem(SAVE_KEY,JSON.stringify(payload));
    return payload;
  }
  function readMatch(){
    const p=safeParse(localStorage.getItem(SAVE_KEY));
    if(!p||p.schema!==SAVE_SCHEMA||!VALID_PHASES.has(p.phase)||!p.state||!p.state.players||!p.state.players.p1||!p.state.players.p2)return null;
    if(p.phase==='mulligan'&&p.state.setupPhase!=='mulligan')return null;
    if(p.phase!=='mulligan'&&p.state.setupPhase==='mulligan')return null;
    if(p.phase==='result'&&!p.state.winner)return null;
    if(p.phase!=='result'&&p.state.winner)return null;
    p.mulliganUsed=Math.max(0,Math.min(2,Number(p.mulliganUsed)||0));
    return p;
  }
  function clearMatch(){localStorage.removeItem(SAVE_KEY);}
  root.GwentStorage={SAVE_KEY,SETTINGS_KEY,SAVE_SCHEMA,VALID_PHASES,loadSettings,saveSettings,writeMatch,readMatch,clearMatch};
})(typeof self!=='undefined'?self:this);

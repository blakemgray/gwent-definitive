(function(root){
  'use strict';
  const SAVE_KEY='gwent-definitive-match-v1';
  const SETTINGS_KEY='gwent-definitive-settings-v2';
  const SAVE_SCHEMA=1;
  function safeParse(raw){try{return JSON.parse(raw);}catch{return null;}}
  function loadSettings(){return safeParse(localStorage.getItem(SETTINGS_KEY))||{};}
  function saveSettings(value){localStorage.setItem(SETTINGS_KEY,JSON.stringify(value||{}));}
  function writeMatch({state,setup,lab=false}){
    if(!state||state.winner){clearMatch();return null;}
    const payload={schema:SAVE_SCHEMA,build:'10.4A',savedAt:new Date().toISOString(),classification:state.classification||'classic',lab:!!lab,setup:setup||{},state};
    localStorage.setItem(SAVE_KEY,JSON.stringify(payload));
    return payload;
  }
  function readMatch(){
    const p=safeParse(localStorage.getItem(SAVE_KEY));
    if(!p||p.schema!==SAVE_SCHEMA||!p.state||!p.state.players||!p.state.players.p1||!p.state.players.p2) return null;
    return p;
  }
  function clearMatch(){localStorage.removeItem(SAVE_KEY);}
  root.GwentStorage={SAVE_KEY,SETTINGS_KEY,SAVE_SCHEMA,loadSettings,saveSettings,writeMatch,readMatch,clearMatch};
})(typeof self!=='undefined'?self:this);
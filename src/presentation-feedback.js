(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else {root.GwentPresentationFeedback=api;api.install();}
})(typeof self!=='undefined'?self:globalThis,function(root){
  'use strict';

  const VERSION='10.4C.0';
  const SETTINGS_KEY='gwent-definitive-feedback-v1';
  const HOOKS=Object.freeze([
    'UI_CARD_SELECT','VALID_DESTINATION','CARD_COMMIT_CLOSE','CARD_COMMIT_RANGED','CARD_COMMIT_SIEGE',
    'CARD_DRAW','CARD_DISCARD','SPY_TRIGGER','HORN_TRIGGER','BOND_TRIGGER','MUSTER_TRIGGER','MEDIC_TRIGGER',
    'DECOY_TRIGGER','SCORCH_TRIGGER','WEATHER_FROST','WEATHER_FOG','WEATHER_RAIN','WEATHER_CLEAR','PASS',
    'TURN_PLAYER','TURN_OPPONENT','ROUND_WIN','ROUND_LOSE','ROUND_DRAW','GAME_WIN','GAME_LOSE','GAME_DRAW'
  ]);
  const HOOK_SET=new Set(HOOKS);
  const DEFAULTS=Object.freeze({effectsVolume:.55,muted:false,haptics:false});
  const HAPTIC_PATTERNS=Object.freeze({
    UI_CARD_SELECT:6,VALID_DESTINATION:4,
    CARD_COMMIT_CLOSE:10,CARD_COMMIT_RANGED:10,CARD_COMMIT_SIEGE:10,
    HORN_TRIGGER:16,SCORCH_TRIGGER:[14,7,22],
    ROUND_WIN:[8,8,15],ROUND_LOSE:[15,8,8],ROUND_DRAW:10,
    GAME_WIN:[10,8,18],GAME_LOSE:[18,8,10],GAME_DRAW:12
  });

  const runtime={
    installed:false,observer:null,copyObserver:null,unsubscribeQueue:null,lastStage:null,lastSelected:null,lastActive:null,
    hooks:0,audioDispatches:0,
    hapticRequests:0,hapticAttempts:0,hapticSuccesses:0,hapticFailures:0,hapticUnsupported:0,hapticDisabled:0,lastHapticStatus:null,
    settingsWrites:0,copyPolishes:0
  };
  const listeners=new Set();
  let settings=loadSettings();

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function loadSettings(){
    try{
      const raw=root.localStorage?.getItem?.(SETTINGS_KEY);if(!raw)return {...DEFAULTS};
      const parsed=JSON.parse(raw);return {effectsVolume:clamp(Number(parsed.effectsVolume??DEFAULTS.effectsVolume),0,1),muted:!!parsed.muted,haptics:!!parsed.haptics};
    }catch(_){return {...DEFAULTS};}
  }
  function persist(){
    try{root.localStorage?.setItem?.(SETTINGS_KEY,JSON.stringify(settings));runtime.settingsWrites++;}catch(_){/* optional persistence */}
  }
  function hapticCapable(){return typeof root.navigator?.vibrate==='function';}
  function copy(v){return v==null?v:JSON.parse(JSON.stringify(v));}

  function dispatchAudio(name,detail){
    if(settings.muted||settings.effectsVolume<=0)return false;
    const payload={name,gain:settings.effectsVolume,detail:copy(detail)||null};
    try{root.dispatchEvent?.(new CustomEvent('gwent:audio-hook',{detail:payload}));runtime.audioDispatches++;return true;}catch(_){return false;}
  }
  function publishHaptic(packet){
    runtime.lastHapticStatus=copy(packet);
    try{root.dispatchEvent?.(new CustomEvent('gwent:haptic-status',{detail:copy(packet)}));}catch(_){/* observation only */}
  }
  function dispatchHaptic(name){
    const pattern=HAPTIC_PATTERNS[name];if(pattern==null)return false;
    runtime.hapticRequests++;
    const packet={name,pattern:copy(pattern),enabled:settings.haptics,capable:hapticCapable(),attempted:false,success:false,reason:null,time:Date.now()};
    if(!settings.haptics){runtime.hapticDisabled++;packet.reason='disabled';publishHaptic(packet);return false;}
    if(!packet.capable){runtime.hapticUnsupported++;packet.reason='unsupported';publishHaptic(packet);return false;}
    try{
      runtime.hapticAttempts++;packet.attempted=true;packet.success=!!root.navigator.vibrate(pattern);packet.reason=packet.success?'played':'rejected';
      if(packet.success)runtime.hapticSuccesses++;else runtime.hapticFailures++;
      publishHaptic(packet);return packet.success;
    }catch(err){
      runtime.hapticAttempts++;runtime.hapticFailures++;packet.attempted=true;packet.reason='error';packet.error=String(err?.message||err);publishHaptic(packet);return false;
    }
  }
  function emit(name,detail={}){
    if(!HOOK_SET.has(name))return false;
    const packet={name,detail:copy(detail)||{},time:Date.now(),effectsVolume:settings.effectsVolume,muted:settings.muted,haptics:settings.haptics};
    runtime.hooks++;
    for(const fn of listeners){try{fn(packet);}catch(err){console.error(err);}}
    try{root.dispatchEvent?.(new CustomEvent('gwent:feedback-hook',{detail:packet}));}catch(_){/* optional DOM event */}
    dispatchAudio(name,detail);dispatchHaptic(name);
    return true;
  }

  function currentStageData(kind){
    const plan=root.GwentGameplayChoreography?.runtime?.lastPlan||[];
    return [...plan].reverse().find(x=>x?.kind===kind)||null;
  }
  function stageHook(kind){
    const stage=currentStageData(kind);
    switch(kind){
      case 'spy':return ['SPY_TRIGGER',stage];
      case 'draw':return ['CARD_DRAW',stage];
      case 'muster':return ['MUSTER_TRIGGER',stage];
      case 'scorch':return ['SCORCH_TRIGGER',stage];
      case 'medic':return ['MEDIC_TRIGGER',stage];
      case 'decoy':return ['DECOY_TRIGGER',stage];
      case 'horn':return ['HORN_TRIGGER',stage];
      case 'bond':return ['BOND_TRIGGER',stage];
      case 'weather-clear':return ['WEATHER_CLEAR',stage];
      case 'weather':{
        const abilities=stage?.event?.abilities||[];
        if(abilities.includes('frost'))return ['WEATHER_FROST',stage];
        if(abilities.includes('fog'))return ['WEATHER_FOG',stage];
        if(abilities.includes('rain'))return ['WEATHER_RAIN',stage];
        return [null,stage];
      }
      case 'pass':return ['PASS',stage];
      case 'turn':return [stage?.event?.to==='p1'?'TURN_PLAYER':'TURN_OPPONENT',stage];
      case 'round-end':{
        const winner=stage?.event?.winnerId;return [winner==='p1'?'ROUND_WIN':winner==='p2'?'ROUND_LOSE':'ROUND_DRAW',stage];
      }
      case 'match-result':{
        const winner=stage?.event?.winner;return [winner==='p1'?'GAME_WIN':winner==='p2'?'GAME_LOSE':'GAME_DRAW',stage];
      }
      default:return [null,stage];
    }
  }
  function inspectStage(){
    const stage=root.document?.body?.dataset?.gcStage||null;
    if(stage===runtime.lastStage)return;
    runtime.lastStage=stage;
    if(!stage)return;
    const [hook,data]=stageHook(stage);if(hook)emit(hook,{stage,data});
  }
  function inspectInteraction(){
    const selected=root.document?.querySelector?.('#match-screen .hand-card.dm-selected[data-card-iid]')?.dataset?.cardIid||null;
    if(selected!==runtime.lastSelected){runtime.lastSelected=selected;if(selected)emit('UI_CARD_SELECT',{iid:selected});}
    const active=root.document?.querySelector?.('#match-screen .dm-active-target');
    const activeKey=active?.dataset?.dmActionKey||null;
    if(activeKey!==runtime.lastActive){runtime.lastActive=activeKey;if(activeKey)emit('VALID_DESTINATION',{actionKey:activeKey,label:active?.dataset?.dmLabel||null});}
  }
  function onQueue(type,payload){
    if(type!=='start')return;
    const meta=payload?.meta;if(meta?.kind!=='game_action'||meta?.action?.type!=='PLAY_CARD')return;
    const row=meta.afterLocation?.row||meta.action?.row;
    const hook=row==='close'?'CARD_COMMIT_CLOSE':row==='ranged'?'CARD_COMMIT_RANGED':row==='siege'?'CARD_COMMIT_SIEGE':null;
    if(hook)emit(hook,{iid:meta.iid||meta.action?.iid||null,row,inputMethod:meta.inputMethod||'unknown'});
  }

  // 10.4C owns player-facing presentation language, but not milestone identity.
  // The current product shell owns release/title/build marks so a closed lower
  // presentation layer cannot silently downgrade a later Pass 11 release label.
  function polishLegacyCopy(){
    if(!root.document)return false;
    let changed=false;
    const toast=root.document.querySelector('#toast');
    if(toast){
      const text=(toast.textContent||'').trim();
      if(/\s·\sENGINE RESOLVED$/.test(text)){
        toast.textContent=text==='MEDIC REVIVE · ENGINE RESOLVED'?'MEDIC · UNIT REVIVED':text.replace(/\s·\sENGINE RESOLVED$/,'');
        changed=true;
      }else if(text==='ENGINE REJECTED ACTION'){
        toast.textContent='ACTION NOT AVAILABLE';changed=true;
      }
    }
    const panel=root.document.querySelector('#overlay-root .side-panel');
    const eyebrow=panel?.querySelector('.eyebrow');
    if(eyebrow?.textContent?.trim()==='MEDIC · ENGINE CHOICE'){
      eyebrow.textContent='MEDIC · REVIVE A UNIT';changed=true;
    }
    const copyLine=panel?.querySelector('p.sub');
    if(copyLine?.textContent?.includes('exposed by the engine')){
      copyLine.textContent='Choose a legal non-Hero unit from your graveyard.';changed=true;
    }
    if(changed)runtime.copyPolishes++;
    return changed;
  }
  function installCopyPolish(){
    polishLegacyCopy();
    const observer=new MutationObserver(()=>polishLegacyCopy());
    const toast=root.document?.querySelector?.('#toast'),overlay=root.document?.querySelector?.('#overlay-root');
    if(toast)observer.observe(toast,{subtree:true,childList:true,characterData:true});
    if(overlay)observer.observe(overlay,{subtree:true,childList:true,characterData:true});
    runtime.copyObserver=observer;
  }

  function updateSettings(next={}){
    settings={
      effectsVolume:clamp(Number(next.effectsVolume??settings.effectsVolume),0,1),
      muted:next.muted==null?settings.muted:!!next.muted,
      haptics:next.haptics==null?settings.haptics:!!next.haptics
    };
    persist();syncSettingsUI();return getSettings();
  }
  function getSettings(){return {...settings,hapticCapable:hapticCapable()};}
  function subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}

  function syncSettingsUI(){
    const range=root.document?.querySelector?.('#effects-volume'),mute=root.document?.querySelector?.('#mute-effects'),haptics=root.document?.querySelector?.('#haptic-feedback'),out=root.document?.querySelector?.('#effects-volume-value'),note=root.document?.querySelector?.('#haptic-support-note');
    if(range)range.value=String(Math.round(settings.effectsVolume*100));
    if(out)out.textContent=`${Math.round(settings.effectsVolume*100)}%`;
    if(mute)mute.checked=settings.muted;
    if(haptics){haptics.checked=settings.haptics;haptics.disabled=!hapticCapable();}
    if(note)note.textContent=hapticCapable()?'Supported by this browser':'Unavailable in this browser';
  }
  function installSettings(){
    const panel=root.document?.querySelector?.('#settings-screen .deck-page-panel');if(!panel||root.document.querySelector('#effects-volume'))return;
    const anchor=root.document.querySelector('#developer-mode')?.closest('label');
    const volume=root.document.createElement('label');volume.className='deck-card feel-setting-row';volume.innerHTML='<span>Effects volume <small id="effects-volume-value"></small></span><input id="effects-volume" type="range" min="0" max="100" step="5" aria-label="Effects volume">';
    const mute=root.document.createElement('label');mute.className='deck-card feel-setting-row';mute.innerHTML='<span>Mute effects</span><input id="mute-effects" type="checkbox">';
    const haptics=root.document.createElement('label');haptics.className='deck-card feel-setting-row';haptics.innerHTML='<span>Haptic feedback <small id="haptic-support-note"></small></span><input id="haptic-feedback" type="checkbox">';
    panel.insertBefore(volume,anchor||panel.firstChild);panel.insertBefore(mute,anchor||panel.firstChild);panel.insertBefore(haptics,anchor||panel.firstChild);
    root.document.querySelector('#effects-volume')?.addEventListener('input',e=>updateSettings({effectsVolume:Number(e.target.value)/100}));
    root.document.querySelector('#mute-effects')?.addEventListener('change',e=>updateSettings({muted:e.target.checked}));
    root.document.querySelector('#haptic-feedback')?.addEventListener('change',e=>updateSettings({haptics:e.target.checked}));
    syncSettingsUI();
  }
  function install(){
    if(runtime.installed||!root.document)return false;
    const q=root.GwentPresentationQueue;if(!q?.subscribe)return false;
    runtime.unsubscribeQueue=q.subscribe(onQueue);
    runtime.observer=new MutationObserver(()=>{inspectStage();inspectInteraction();});
    runtime.observer.observe(root.document.body,{subtree:true,attributes:true,attributeFilter:['class','data-gc-stage','data-dm-action-key']});
    installSettings();installCopyPolish();inspectStage();inspectInteraction();runtime.installed=true;return true;
  }
  function uninstall(){
    runtime.unsubscribeQueue?.();runtime.unsubscribeQueue=null;runtime.observer?.disconnect?.();runtime.observer=null;runtime.copyObserver?.disconnect?.();runtime.copyObserver=null;runtime.installed=false;runtime.lastStage=null;runtime.lastSelected=null;runtime.lastActive=null;
  }

  return Object.freeze({
    version:VERSION,HOOKS,install,uninstall,emit,subscribe,getSettings,updateSettings,hapticCapable,polishLegacyCopy,
    get stats(){return copy(runtime);}
  });
});

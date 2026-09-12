(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else {root.GwentPlatformFeedback=api;api.install();}
})(typeof self!=='undefined'?self:globalThis,function(root){
  'use strict';

  const VERSION='11.audio.0';
  const MAX_PENDING=8;
  const runtime={
    installed:false,supported:false,contextCreated:false,contextState:'uncreated',
    unlockAttempts:0,unlockSuccesses:0,unlockFailures:0,
    audioRequests:0,audioPlayed:0,audioQueued:0,audioBlocked:0,audioFailures:0,
    lifecycleResumeAttempts:0,lifecycleResumeSuccesses:0,lifecycleResumeFailures:0,
    lastCue:null,lastStatus:null,lastError:null,lastUserActivation:null,lastUserActivationAt:0,
    pending:0
  };
  let context=null;
  let activationSeen=false;
  let resumePromise=null;
  const pending=[];
  const removers=[];

  const copy=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const AudioCtor=()=>root.AudioContext||root.webkitAudioContext||null;
  const nowMs=()=>Date.now();

  function snapshot(){
    runtime.contextState=context?.state||runtime.contextState||'uncreated';
    runtime.pending=pending.length;
    return copy(runtime);
  }

  function publish(status,name,extra={}){
    runtime.lastCue=name||runtime.lastCue;
    runtime.lastStatus=status;
    const packet={status,name:name||null,contextState:context?.state||runtime.contextState||'uncreated',time:nowMs(),...copy(extra)};
    try{root.dispatchEvent?.(new CustomEvent('gwent:audio-status',{detail:packet}));}catch(_){/* observation only */}
    return packet;
  }

  function fail(name,err,status='failed'){
    runtime.audioFailures++;
    runtime.lastError=String(err?.message||err||'unknown audio failure');
    publish(status,name,{error:runtime.lastError});
    return false;
  }

  function ensureContext(){
    if(context)return context;
    const Ctor=AudioCtor();
    runtime.supported=!!Ctor;
    if(!Ctor)return null;
    try{
      context=new Ctor({latencyHint:'interactive'});
      runtime.contextCreated=true;
      runtime.contextState=context.state||'unknown';
      if('onstatechange' in context)context.onstatechange=()=>{runtime.contextState=context.state||'unknown';};
      return context;
    }catch(err){
      runtime.lastError=String(err?.message||err);
      runtime.contextState='error';
      return null;
    }
  }

  function connectGain(gainValue,start,duration){
    const gain=context.createGain();
    const peak=Math.max(.0001,gainValue);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,start+Math.max(.025,duration));
    gain.connect(context.destination);
    return gain;
  }

  function tone(freq,duration,volume,type='sine',endFreq=null,offset=0){
    const start=context.currentTime+offset;
    const osc=context.createOscillator();
    const gain=connectGain(volume,start,duration);
    osc.type=type;
    osc.frequency.setValueAtTime(Math.max(20,freq),start);
    if(endFreq!=null)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),start+duration);
    osc.connect(gain);osc.start(start);osc.stop(start+duration+.03);
  }

  function noise(duration,volume,filterType='bandpass',freq=900,q=.7,offset=0){
    const start=context.currentTime+offset;
    const frames=Math.max(64,Math.floor(context.sampleRate*duration));
    const buffer=context.createBuffer(1,frames,context.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length*.35);
    const src=context.createBufferSource();src.buffer=buffer;
    const filter=context.createBiquadFilter();filter.type=filterType;filter.frequency.setValueAtTime(freq,start);filter.Q.value=q;
    const gain=connectGain(volume,start,duration);
    src.connect(filter);filter.connect(gain);src.start(start);src.stop(start+duration+.03);
  }

  function chord(freqs,duration,volume,type='sine',step=.035){
    freqs.forEach((f,i)=>tone(f,duration,volume/Math.max(1,Math.sqrt(freqs.length)),type,null,i*step));
  }

  function synth(name,gain){
    const g=clamp(Number(gain),0,1);
    const soft=.06*g,medium=.10*g,strong=.16*g;
    switch(name){
      case 'UI_CARD_SELECT':tone(760,.055,soft,'triangle',620);noise(.035,.022*g,'highpass',1500,0);break;
      case 'VALID_DESTINATION':tone(1080,.065,.05*g,'sine',1320);break;
      case 'CARD_COMMIT_CLOSE':tone(190,.12,medium,'sine',110);noise(.055,.04*g,'lowpass',900,.5);break;
      case 'CARD_COMMIT_RANGED':tone(225,.12,medium,'sine',130);noise(.05,.035*g,'bandpass',1200,.7);break;
      case 'CARD_COMMIT_SIEGE':tone(145,.145,.12*g,'triangle',78);noise(.07,.04*g,'lowpass',650,.7);break;
      case 'CARD_DRAW':noise(.10,.04*g,'bandpass',1700,.8);tone(620,.07,.035*g,'sine',800,.025);break;
      case 'CARD_DISCARD':noise(.12,.05*g,'lowpass',900,.6);tone(260,.09,.035*g,'triangle',150,.02);break;
      case 'SPY_TRIGGER':tone(330,.11,.05*g,'triangle',520);tone(740,.08,.035*g,'sine',620,.08);break;
      case 'HORN_TRIGGER':chord([220,330,440],.28,.15*g,'sawtooth',.025);break;
      case 'BOND_TRIGGER':chord([440,554,660],.18,.09*g,'triangle',.02);break;
      case 'MUSTER_TRIGGER':tone(180,.09,.045*g,'triangle',240);tone(220,.09,.045*g,'triangle',300,.07);tone(270,.10,.05*g,'triangle',360,.14);break;
      case 'MEDIC_TRIGGER':tone(310,.22,.05*g,'sine',620);tone(465,.18,.04*g,'sine',820,.06);break;
      case 'DECOY_TRIGGER':noise(.10,.045*g,'bandpass',1100,.8);tone(520,.08,.04*g,'triangle',320,.03);break;
      case 'SCORCH_TRIGGER':noise(.34,strong,'lowpass',1900,.45);noise(.22,.08*g,'bandpass',2600,.8,.04);tone(120,.30,.09*g,'sawtooth',48,.025);break;
      case 'WEATHER_FROST':noise(.28,.055*g,'highpass',2400,.7);tone(980,.20,.035*g,'sine',720,.02);break;
      case 'WEATHER_FOG':noise(.32,.06*g,'lowpass',720,.45);tone(240,.25,.03*g,'sine',190,.03);break;
      case 'WEATHER_RAIN':noise(.30,.055*g,'bandpass',1500,.5);tone(420,.18,.025*g,'sine',330,.02);break;
      case 'WEATHER_CLEAR':noise(.18,.04*g,'highpass',1800,.5);tone(520,.16,.04*g,'sine',900,.015);break;
      case 'PASS':tone(240,.14,.055*g,'triangle',150);break;
      case 'TURN_PLAYER':tone(560,.08,.035*g,'sine',700);break;
      case 'TURN_OPPONENT':tone(360,.08,.03*g,'sine',300);break;
      case 'ROUND_WIN':chord([392,494,587],.28,.13*g,'triangle',.045);break;
      case 'ROUND_LOSE':chord([294,247,196],.30,.12*g,'triangle',.045);break;
      case 'ROUND_DRAW':chord([330,392],.24,.09*g,'triangle',.04);break;
      case 'GAME_WIN':chord([392,494,587,784],.42,.18*g,'triangle',.055);break;
      case 'GAME_LOSE':chord([330,277,220,165],.42,.17*g,'triangle',.055);break;
      case 'GAME_DRAW':chord([330,440,523],.34,.12*g,'triangle',.05);break;
      default:tone(440,.07,.035*g,'sine',380);break;
    }
  }

  function playPayload(payload){
    const name=payload?.name||'UNKNOWN';
    if(!context||context.state!=='running')return false;
    try{
      synth(name,clamp(Number(payload?.gain??.55),0,1));
      runtime.audioPlayed++;
      runtime.lastError=null;
      publish('played',name,{gain:clamp(Number(payload?.gain??.55),0,1)});
      return true;
    }catch(err){return fail(name,err);}
  }

  function flushPending(){
    if(!context||context.state!=='running')return;
    const queued=pending.splice(0,pending.length);
    runtime.pending=0;
    for(const payload of queued)playPayload(payload);
  }

  async function resume(reason='manual',lifecycle=false){
    const c=ensureContext();
    if(!c){
      runtime.audioBlocked++;
      publish('unsupported',null,{reason});
      return false;
    }
    if(lifecycle)runtime.lifecycleResumeAttempts++;else runtime.unlockAttempts++;
    if(c.state==='running'){
      if(lifecycle)runtime.lifecycleResumeSuccesses++;else runtime.unlockSuccesses++;
      runtime.contextState=c.state;flushPending();return true;
    }
    if(resumePromise)return resumePromise;
    resumePromise=(async()=>{
      try{
        await c.resume();
        runtime.contextState=c.state||'unknown';
        const ok=c.state==='running';
        if(ok){
          if(lifecycle)runtime.lifecycleResumeSuccesses++;else runtime.unlockSuccesses++;
          publish('unlocked',null,{reason});flushPending();
        }else{
          if(lifecycle)runtime.lifecycleResumeFailures++;else runtime.unlockFailures++;
          publish('blocked',null,{reason,state:c.state});
        }
        return ok;
      }catch(err){
        runtime.lastError=String(err?.message||err);
        if(lifecycle)runtime.lifecycleResumeFailures++;else runtime.unlockFailures++;
        publish('failed',null,{reason,error:runtime.lastError});return false;
      }finally{resumePromise=null;}
    })();
    return resumePromise;
  }

  function noteActivation(type){
    const t=nowMs();
    if(t-runtime.lastUserActivationAt<35)return;
    activationSeen=true;runtime.lastUserActivation=type;runtime.lastUserActivationAt=t;
    resume(`user-${type}`,false);
  }

  function onAudio(event){
    const payload=copy(event?.detail)||{};
    const name=payload.name||'UNKNOWN';
    runtime.audioRequests++;runtime.lastCue=name;
    runtime.supported=!!AudioCtor();
    if(!runtime.supported){runtime.audioBlocked++;publish('unsupported',name,{reason:'webaudio-unavailable'});return;}
    if(context?.state==='running'){playPayload(payload);return;}
    if(pending.length>=MAX_PENDING)pending.shift();
    pending.push(payload);runtime.audioQueued++;runtime.pending=pending.length;publish('queued',name,{reason:activationSeen?'context-not-running':'awaiting-user-activation'});
    if(activationSeen)resume('queued-cue',false);
  }

  function onVisible(reason){
    if(!context||context.state==='running'||!activationSeen)return;
    resume(reason,true);
  }

  function install(){
    if(runtime.installed||!root.addEventListener)return false;
    runtime.supported=!!AudioCtor();
    const add=(type,fn,opts)=>{root.addEventListener(type,fn,opts);removers.push(()=>root.removeEventListener(type,fn,opts));};
    add('gwent:audio-hook',onAudio);
    add('pointerdown',e=>{if(e.isTrusted!==false)noteActivation('pointerdown');},{capture:true,passive:true});
    add('touchstart',e=>{if(e.isTrusted!==false)noteActivation('touchstart');},{capture:true,passive:true});
    add('keydown',e=>{if(e.isTrusted!==false)noteActivation('keydown');},{capture:true});
    add('pageshow',()=>onVisible('pageshow'));
    if(root.document){
      const vis=()=>{if(root.document.visibilityState==='visible')onVisible('visibility');};
      root.document.addEventListener('visibilitychange',vis);removers.push(()=>root.document.removeEventListener('visibilitychange',vis));
    }
    runtime.installed=true;return true;
  }

  function uninstall(){
    while(removers.length){try{removers.pop()();}catch(_){}}
    pending.splice(0,pending.length);runtime.pending=0;runtime.installed=false;
  }

  return Object.freeze({
    version:VERSION,install,uninstall,unlock:(reason='manual')=>resume(reason,false),getStatus:snapshot,
    get context(){return context;},
    get stats(){return snapshot();}
  });
});

(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else {root.GwentGameplayChoreography=api;api.install();}
})(typeof self!=='undefined'?self:globalThis,function(root){
  'use strict';

  const VERSION='10.4B.0';
  const runtime={installed:false,stage:null,lastPlan:[],lastTransaction:null,presented:0,cancelled:0,errors:0,externalTransactions:0,lastObservedState:null,observer:null,scheduled:false};
  const $=(s,r=root.document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=root.document)=>[...(r?.querySelectorAll?.(s)||[])];
  const wait=ms=>new Promise(resolve=>root.setTimeout(resolve,Math.max(0,ms||0)));
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

  function plan(tx){
    if(!tx||tx.kind!=='game_action')return [];
    const e=tx.events||[], stages=[];
    const all=t=>e.filter(x=>x.type===t), one=t=>e.find(x=>x.type===t);
    const spy=one('SPY_TRIGGER');
    const draws=all('CARD_DRAW');
    const muster=all('MUSTER_SUMMON');
    const scorch=all('SCORCH_TRIGGER');
    if(spy)stages.push({kind:'spy',event:spy,draws:draws.slice(0,spy.drawCount||2)});
    else for(const d of draws)stages.push({kind:'draw',event:d});
    if(muster.length)stages.push({kind:'muster',events:muster});
    for(const s of scorch)stages.push({kind:'scorch',event:s});
    for(const d of all('DECOY_SWAP'))stages.push({kind:'decoy',event:d});
    for(const m of all('MEDIC_REVIVE'))stages.push({kind:'medic',event:m});
    for(const w of all('WEATHER_APPLY'))stages.push({kind:'weather',event:w});
    for(const w of all('WEATHER_CLEAR'))stages.push({kind:'weather-clear',event:w});
    for(const h of all('HORN_TRIGGER'))stages.push({kind:'horn',event:h});
    for(const b of all('TIGHT_BOND_TRIGGER'))stages.push({kind:'bond',event:b});
    for(const m of all('MORALE_TRIGGER'))stages.push({kind:'morale',event:m});
    for(const h of all('HERO_LAND'))stages.push({kind:'hero',event:h});
    for(const l of all('LEADER_TRIGGER'))stages.push({kind:'leader',event:l});
    for(const p of all('PASS'))stages.push({kind:'pass',event:p});
    const roundEnd=one('ROUND_END'), life=all('LIFE_CHANGE'), clear=one('BOARD_CLEAR'), roundStart=one('ROUND_START');
    if(roundEnd)stages.push({kind:'round-end',event:roundEnd,life,clear,roundStart});
    else {
      for(const l of life)stages.push({kind:'life',event:l});
      if(clear)stages.push({kind:'board-clear',event:clear});
      if(roundStart)stages.push({kind:'round-start',event:roundStart});
    }
    const match=one('MATCH_END'); if(match)stages.push({kind:'match-result',event:match});
    for(const r of all('FACTION_REVIVE'))stages.push({kind:'faction-revive',event:r});
    return stages;
  }

  function queue(){return root.GwentPresentationQueue;}
  function motion(){return root.GwentMotionTokens;}
  function duration(name='abilityFast'){return motion()?.duration?.(name)??220;}
  function reduced(){return !!motion()?.reduced?.();}
  function register(anim){queue()?.registerAnimation?.(anim);return anim;}
  function done(anim){return anim?.finished?.catch?.(()=>{})||Promise.resolve();}
  function abortCheck(signal){if(signal?.aborted){const e=new Error('presentation cancelled');e.name='AbortError';throw e;}}
  function rectOf(el){if(!el)return null;const r=el.getBoundingClientRect();return r&&r.width&&r.height?{x:r.x,y:r.y,width:r.width,height:r.height}:null;}
  function rowEl(pid,row){return $(`#match-screen .lane[data-pid="${pid}"][data-row="${row}"]`);}
  function scoreEl(pid,row=null){return row?rowEl(pid,row)?.querySelector('.rscore'):(pid==='p1'?$('#player-total'):$('#opp-total'));}
  function handCard(iid){return iid?$(`#match-screen .hand-card[data-card-iid="${iid}"]`):null;}
  function boardCard(iid){return iid?$(`#match-screen [data-inspect-board="${iid}"]`):null;}
  function weatherEl(){return $('#match-screen .weather');}
  function leaderEl(){return $('#leader-button');}

  function overlayRoot(){
    let el=$('#gc-overlay');
    if(el)return el;
    el=root.document.createElement('div');el.id='gc-overlay';el.className='gc-overlay';el.setAttribute('aria-hidden','true');
    root.document.body.appendChild(el);queue()?.registerCleanup?.(()=>{try{el.replaceChildren();delete el.dataset.stage;}catch(_){}});
    return el;
  }
  function transientClass(el,cls){
    if(!el)return()=>{};el.classList.add(cls);const off=()=>el.classList.remove(cls);queue()?.registerCleanup?.(off);return off;
  }
  async function pulse(el,kind='impact',name='abilityFast',signal){
    abortCheck(signal);if(!el)return;
    const ms=duration(reduced()?'microNormal':name);transientClass(el,`gc-${kind}`);
    const frames=reduced()?[{opacity:.72},{opacity:1}]:[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.035)',filter:'brightness(1.2)'},{transform:'scale(1)',filter:'brightness(1)'}];
    const a=register(el.animate(frames,{duration:ms,easing:motion()?.EASING?.impact||'ease-out'}));await done(a);abortCheck(signal);
  }
  async function cue(text,kind,target,signal,name='abilityFast'){
    abortCheck(signal);const host=overlayRoot(),el=root.document.createElement('div');el.className=`gc-cue gc-cue-${kind}`;el.textContent=text;
    const r=rectOf(target);if(!r)el.classList.add('gc-center');
    host.appendChild(el);
    if(r){
      const er=el.getBoundingClientRect(),margin=8,halfW=er.width/2,halfH=er.height/2;
      const minX=margin+halfW,maxX=Math.max(minX,(root.innerWidth||0)-margin-halfW),minY=margin+halfH,maxY=Math.max(minY,(root.innerHeight||0)-margin-halfH);
      const cx=Math.min(maxX,Math.max(minX,r.x+r.width/2)),cy=Math.min(maxY,Math.max(minY,r.y+r.height/2));
      el.style.left=`${cx}px`;el.style.top=`${cy}px`;
    }
    const cleanup=()=>{try{el.remove();}catch(_){}};queue()?.registerCleanup?.(cleanup);
    const ms=duration(reduced()?'microNormal':name);
    const frames=reduced()?[{opacity:0},{opacity:1},{opacity:0}]:[{opacity:0,transform:'translate(-50%,-35%) scale(.88)'},{offset:.25,opacity:1,transform:'translate(-50%,-50%) scale(1.04)'},{offset:.72,opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-68%) scale(.98)'}];
    const a=register(el.animate(frames,{duration:ms,easing:motion()?.EASING?.direct||'ease-out'}));await done(a);cleanup();abortCheck(signal);
  }
  async function ghostTravel(target,startEl,kind,signal){
    abortCheck(signal);if(reduced()||!target)return pulse(target,kind,'microNormal',signal);
    const end=rectOf(target),start=rectOf(startEl)||rectOf($('#counts'))||rectOf($('#match-screen'));
    if(!end||!start)return;
    const ghost=target.cloneNode(true);ghost.className=`${target.className} gc-ghost gc-ghost-${kind}`;ghost.style.position='fixed';ghost.style.left=`${start.x+start.width/2-end.width/2}px`;ghost.style.top=`${start.y+start.height/2-end.height/2}px`;ghost.style.width=`${end.width}px`;ghost.style.height=`${end.height}px`;ghost.style.pointerEvents='none';overlayRoot().appendChild(ghost);
    const cleanup=()=>{try{ghost.remove();}catch(_){}};queue()?.registerCleanup?.(cleanup);
    const dx=end.x-(start.x+start.width/2-end.width/2),dy=end.y-(start.y+start.height/2-end.height/2);
    const a=register(ghost.animate([{opacity:.3,transform:'translate3d(0,0,0) scale(.82)'},{opacity:1,transform:`translate3d(${dx}px,${dy}px,0) scale(1)`}],{duration:duration('routineSlow'),easing:motion()?.EASING?.direct||'ease-out',fill:'forwards'}));await done(a);cleanup();abortCheck(signal);
  }

  async function drawCard(ev,signal){
    const target=ev.playerId==='p1'?handCard(ev.iid):null;
    if(target)await ghostTravel(target,$('#counts'),'draw',signal);else await cue('DRAW','draw',ev.playerId==='p1'?$('#counts'):$('#matchline'),signal,'routineFast');
  }
  async function presentStage(stage,tx,signal){
    runtime.stage=stage.kind;root.document.body.dataset.gcStage=stage.kind;abortCheck(signal);
    switch(stage.kind){
      case 'spy': {
        const loc=tx.afterLocation;await cue('SPY','spy',loc?.row?rowEl(loc.playerId,loc.row):$('#board'),signal,'abilityNormal');
        if(loc?.row)await pulse(rowEl(loc.playerId,loc.row),'spy-row','abilityFast',signal);
        for(const d of stage.draws)await drawCard(d,signal);break;
      }
      case 'draw': await drawCard(stage.event,signal);break;
      case 'muster': {
        const evs=stage.events;await cue('MUSTER','muster',rowEl(evs[0]?.playerId,evs[0]?.row),signal,'abilityFast');
        const max=evs.length>=6?55:90;for(let i=0;i<evs.length;i++){const ev=evs[i],card=boardCard(ev.iid);if(card)await pulse(card,'muster-unit',i===0||i===evs.length-1?'routineFast':'microNormal',signal);if(i<evs.length-1)await wait(reduced()?8:max);}
        if(evs[0])await pulse(rowEl(evs[0].playerId,evs[0].row),'muster-row','abilityFast',signal);break;
      }
      case 'scorch': {
        const doomed=stage.event.doomed||[];const groups=new Map();for(const d of doomed){const key=`${d.playerId||'x'}:${d.row||'x'}`;if(!groups.has(key))groups.set(key,{pid:d.playerId,row:d.row,count:0});groups.get(key).count++;}
        if(!groups.size)await cue('SCORCH','scorch',$('#board'),signal,'majorNormal');
        for(const g of groups.values()){const row=rowEl(g.pid,g.row);await cue(`SCORCH ×${g.count}`,'scorch',row,signal,'abilityNormal');await pulse(row,'scorch-row','abilityNormal',signal);}break;
      }
      case 'decoy': await cue('DECOY · SWAP','decoy',rowEl(stage.event.playerId,stage.event.row),signal,'abilityNormal');await pulse(rowEl(stage.event.playerId,stage.event.row),'decoy-row','abilityFast',signal);break;
      case 'medic': await cue('REVIVE','medic',rowEl(stage.event.playerId,stage.event.row),signal,'abilityNormal');await pulse(boardCard(stage.event.iid)||rowEl(stage.event.playerId,stage.event.row),'medic-card','abilityFast',signal);break;
      case 'weather': {
        await cue('WEATHER','weather',weatherEl(),signal,'abilityFast');await pulse(weatherEl(),'weather-core','abilityFast',signal);const map={frost:'close',fog:'ranged',rain:'siege'};for(const a of stage.event.abilities||[]){const row=map[a];if(row)await Promise.all([pulse(rowEl('p1',row),'weather-row','routineFast',signal),pulse(rowEl('p2',row),'weather-row','routineFast',signal)]);}break;
      }
      case 'weather-clear': await cue('CLEAR WEATHER','weather-clear',weatherEl(),signal,'abilityFast');for(const pid of ['p1','p2'])for(const row of ['close','ranged','siege'])await pulse(rowEl(pid,row),'weather-clear-row','microNormal',signal);break;
      case 'horn': {
        const row=rowEl(stage.event.playerId,stage.event.row);await cue('COMMANDER’S HORN','horn',stage.event.source==='leader'?leaderEl():row?.querySelector('.special-slot-wrap'),signal,'abilityFast');await pulse(row,'horn-row','abilityNormal',signal);await pulse(scoreEl(stage.event.playerId,stage.event.row),'score','routineFast',signal);break;
      }
      case 'bond': await cue('TIGHT BOND','bond',rowEl(stage.event.playerId,stage.event.row),signal,'abilityFast');await pulse(rowEl(stage.event.playerId,stage.event.row),'bond-row','abilityNormal',signal);break;
      case 'morale': await cue('MORALE BOOST','morale',rowEl(stage.event.playerId,stage.event.row),signal,'abilityFast');await pulse(rowEl(stage.event.playerId,stage.event.row),'morale-row','abilityFast',signal);break;
      case 'hero': await cue('HERO','hero',boardCard(stage.event.iid)||rowEl(stage.event.playerId,stage.event.row),signal,'routineFast');break;
      case 'leader': await cue('LEADER','leader',leaderEl(),signal,'abilityFast');await pulse(leaderEl(),'leader-card','abilityFast',signal);break;
      case 'pass': await cue(stage.event.reason==='manual'?'PASS':'HAND EXHAUSTED · PASS','pass',stage.event.playerId==='p1'?$('#pass-button'):$('#matchline'),signal,'abilityFast');break;
      case 'life': await pulse(stage.event.playerId==='p1'?$('#player-total'):$('#opp-total'),'life','abilityFast',signal);break;
      case 'board-clear': await cue('CLEARING FIELD','round',$('#board'),signal,'abilityFast');break;
      case 'round-start': await cue(`ROUND ${stage.event.round}`,'round-start',$('#matchline'),signal,'abilityNormal');break;
      case 'round-end': {
        const text=stage.event.winnerId==='p1'?'ROUND WON':stage.event.winnerId==='p2'?'ROUND LOST':'ROUND DRAW';await cue(text,'round',$('#board'),signal,'majorNormal');
        for(const l of stage.life||[])await pulse(l.playerId==='p1'?$('#player-total'):$('#opp-total'),'life','routineFast',signal);
        if(stage.clear){const occupied=[];for(const pid of ['p1','p2'])for(const row of ['close','ranged','siege'])if((tx.beforeBoard?.[pid]?.[row]||[]).length)occupied.push(rowEl(pid,row));for(const r of occupied)await pulse(r,'board-clear','microNormal',signal);}
        if(stage.roundStart)await cue(`ROUND ${stage.roundStart.round}`,'round-start',$('#matchline'),signal,'abilityFast');break;
      }
      case 'match-result': await cue(stage.event.winner==='p1'?'VICTORY':stage.event.winner==='p2'?'DEFEAT':'DRAW','match',$('#board'),signal,'majorNormal');break;
      case 'faction-revive': await cue('SKELLIGE · RETURN','medic',boardCard(stage.event.iid)||$('#board'),signal,'abilityFast');break;
    }
    delete root.document.body.dataset.gcStage;runtime.stage=null;
  }
  async function present(tx,signal){
    const stages=plan(tx);runtime.lastPlan=clone(stages);runtime.lastTransaction=clone(tx);if(!stages.length)return;
    root.document.body.classList.add('gc-presenting');queue()?.registerCleanup?.(()=>{root.document.body.classList.remove('gc-presenting');delete root.document.body.dataset.gcStage;runtime.stage=null;});
    for(const stage of stages){abortCheck(signal);await presentStage(stage,tx,signal);}runtime.presented++;
  }

  function inferAction(before,after){
    const added=(after?.eventLog||[]).slice(before?.eventLog?.length||0);const unit=added.find(e=>e.type==='UNIT_PLAYED');if(unit)return {type:'PLAY_CARD',playerId:unit.data?.playerId||after.currentPlayerId,iid:unit.data?.iid||null,row:unit.data?.row||null};
    const pass=added.find(e=>e.type==='PLAYER_PASSED'||e.type==='AUTO_PASS');if(pass)return {type:'PASS',playerId:pass.data?.playerId||null};
    const leader=added.find(e=>e.type==='LEADER_USED');if(leader)return {type:'ACTIVATE_LEADER',playerId:leader.data?.playerId||null};
    const revive=added.find(e=>e.type==='UNIT_REVIVED');if(revive)return {type:'RESOLVE_CHOICE',playerId:revive.data?.playerId||null,targetIid:revive.data?.iid||null};
    return {type:'STATE_ACTION',playerId:before?.currentPlayerId||null};
  }
  function observeExternal(){
    const app=root.__GWENT_PASS10__,Events=root.GwentPresentationEvents,Queue=root.GwentPresentationQueue;if(!app||!Events||!Queue||!root.MutationObserver)return;
    const sync=()=>{
      runtime.scheduled=false;const after=app.getState?.();if(!after){runtime.lastObservedState=null;return;}
      const before=runtime.lastObservedState;if(!before){runtime.lastObservedState=after;return;}
      const beforeN=before.eventLog?.length||0,afterN=after.eventLog?.length||0;
      runtime.lastObservedState=after;
      if(afterN<=beforeN)return;
      if(Queue.busy)return;
      const tx=Events.build(app.engine,before,after,inferAction(before,after),{inputMethod:'external'});runtime.externalTransactions++;
      Queue.run(tx,async()=>{}).catch?.(()=>{});
    };
    runtime.lastObservedState=app.getState?.()||null;
    runtime.observer=new root.MutationObserver(()=>{if(runtime.scheduled)return;runtime.scheduled=true;root.queueMicrotask?root.queueMicrotask(sync):Promise.resolve().then(sync);});
    const target=$('#match-screen');if(target)runtime.observer.observe(target,{subtree:true,childList:true,characterData:true,attributes:true});
  }
  function install(){
    if(runtime.installed||!root.document)return false;
    const Queue=root.GwentPresentationQueue;if(!Queue?.run)return false;
    const baseRun=Queue.run.bind(Queue);
    Queue.run=async function(meta,executor){
      return baseRun(meta,async(signal,token)=>{
        const result=await executor(signal,token);if(meta?.kind==='game_action')await present(meta,signal);return result;
      });
    };
    runtime.installed=true;observeExternal();return true;
  }
  function snapshot(){return clone({...runtime,observer:null,lastObservedState:null});}
  return {version:VERSION,plan,present,install,snapshot,runtime};
});
(() => {
  'use strict';

  const api=window.__GWENT_PASS10__;
  const G=api?.engine;
  const Motion=window.GwentMotionTokens;
  const Queue=window.GwentPresentationQueue;
  const Flip=window.GwentFlipLayout;
  const Events=window.GwentPresentationEvents;
  if(!api||!G||!Motion||!Queue||!Flip||!Events){
    console.error('Pass 10.4A dependencies missing');
    return;
  }

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const MODE_KEY='gwent-definitive-interaction-mode-v1';
  const VALID_MODES=new Set(['hybrid','tap','drag']);
  const DRAG_THRESHOLD=8;
  const LONG_PRESS_MS=480;

  const runtime={
    phase:'idle',
    mode:VALID_MODES.has(localStorage.getItem(MODE_KEY))?localStorage.getItem(MODE_KEY):'hybrid',
    selectedIid:null,
    selectedAt:0,
    selectedActions:[],
    targets:[],
    candidate:null,
    drag:null,
    dragRaf:0,
    suppressClickUntil:0,
    lastTransaction:null,
    lastCancelReason:null,
    stats:{selections:0,tapCommits:0,dragCommits:0,invalidDrops:0,cancels:0,inspections:0,pointerFrames:0,maxPointerLagPx:0,transactions:0,errors:0}
  };

  function attr(value){return String(value).replace(/\\/g,'\\\\').replace(/"/g,'\\"');}
  function actionKey(a){
    return [a?.type||'',a?.playerId||'',a?.iid||'',a?.row||'',a?.targetIid||''].join('|');
  }
  function getState(){return api.getState();}
  function cardDefForIid(state,iid){
    if(!state)return null;
    for(const pid of ['p1','p2']){
      for(const zone of ['hand','deck','grave']){
        const inst=state.players[pid]?.[zone]?.find(c=>c.iid===iid);
        if(inst)return G.CARD_DB[inst.cardId]||null;
      }
      for(const row of G.ROWS){
        const inst=state.players[pid]?.board?.[row]?.find(c=>c.iid===iid);
        if(inst)return G.CARD_DB[inst.cardId]||null;
      }
    }
    return null;
  }
  function actionsFor(iid,state=getState()){
    if(!state||state.currentPlayerId!=='p1'||state.pendingChoice||state.winner||state.players.p1.passed)return[];
    return G.legalActions(state,'p1').filter(a=>a.type==='PLAY_CARD'&&a.iid===iid);
  }
  function normalizeDestination(action,state=getState()){
    if(!action)return null;
    const d=cardDefForIid(state,action.iid);
    if(!d)return null;
    if(action.targetIid)return {kind:'target',playerId:'p1',targetIid:action.targetIid,label:'SWAP'};
    if(d.type==='weather')return {kind:'weather',label:'WEATHER'};
    if(d.type==='special'){
      if(d.abilities?.includes('horn')||d.abilities?.includes('mardroeme'))return {kind:'special',playerId:'p1',row:action.row,label:'SPECIAL'};
      if(d.abilities?.includes('scorch'))return {kind:'global',label:'PLAY'};
    }
    if(d.type==='unit'){
      const owner=d.abilities?.includes('spy')?'p2':'p1';
      return {kind:'row',playerId:owner,row:action.row,label:d.abilities?.includes('spy')?'SPY':'PLAY'};
    }
    return {kind:'global',label:'PLAY'};
  }
  function destinationElement(dest){
    if(!dest)return null;
    if(dest.kind==='row')return $(`#match-screen .lane[data-pid="${attr(dest.playerId)}"][data-row="${attr(dest.row)}"]`);
    if(dest.kind==='special')return $(`#match-screen .lane[data-pid="${attr(dest.playerId)}"][data-row="${attr(dest.row)}"] .special-slot-wrap`);
    if(dest.kind==='target')return $(`#match-screen [data-inspect-board="${attr(dest.targetIid)}"]`);
    if(dest.kind==='weather'||dest.kind==='global')return $('#match-screen .weather');
    return null;
  }
  function destinationText(dest){
    if(!dest)return 'legal destination';
    if(dest.kind==='row')return `${dest.playerId==='p2'?'opponent ':''}${dest.row} row`;
    if(dest.kind==='special')return `${dest.row} special slot`;
    if(dest.kind==='target')return 'target unit';
    if(dest.kind==='weather')return 'weather zone';
    return 'play zone';
  }

  function announce(text){
    const live=$('#dm-live');
    if(live){live.textContent='';requestAnimationFrame(()=>{live.textContent=text;});}
  }
  function ensureLiveRegion(){
    if($('#dm-live'))return;
    const live=document.createElement('div');
    live.id='dm-live';live.className='dm-sr-only';live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');
    document.body.appendChild(live);
  }

  function clearTargetDecorations(){
    for(const t of runtime.targets){
      const el=t.el;
      if(!el)continue;
      el.classList.remove('dm-legal-target','dm-active-target');
      delete el.dataset.dmLabel;delete el.dataset.dmActionKey;
      if(el.dataset.dmAddedTabindex==='1'){el.removeAttribute('tabindex');delete el.dataset.dmAddedTabindex;}
      if(el.dataset.dmAddedRole==='1'){el.removeAttribute('role');delete el.dataset.dmAddedRole;}
      delete el.__gwentDmAction;
    }
    runtime.targets=[];
  }
  function buildTargets(actions,state){
    clearTargetDecorations();
    const seen=new Set();
    for(const action of actions){
      const dest=normalizeDestination(action,state);
      const el=destinationElement(dest);
      if(!el)continue;
      const key=actionKey(action);
      const unique=`${key}@${dest.kind}`;
      if(seen.has(unique))continue;seen.add(unique);
      el.classList.add('dm-legal-target');
      el.dataset.dmLabel=dest.label||'PLAY';
      el.dataset.dmActionKey=key;
      el.__gwentDmAction=action;
      if(!el.hasAttribute('tabindex')){el.tabIndex=0;el.dataset.dmAddedTabindex='1';}
      if(!el.hasAttribute('role')){el.setAttribute('role','button');el.dataset.dmAddedRole='1';}
      runtime.targets.push({action,dest,el,key});
    }
    return runtime.targets;
  }
  function legalSummary(){
    const labels=[...new Set(runtime.targets.map(t=>destinationText(t.dest)))];
    return labels.length?labels.join(', '):'no legal destinations';
  }

  function clearCandidate(){
    const c=runtime.candidate;if(!c)return;
    if(c.longTimer)clearTimeout(c.longTimer);
    c.card?.classList.remove('dm-pressing');
    runtime.candidate=null;
    if(runtime.phase==='pointer_down'||runtime.phase==='press_candidate')runtime.phase=runtime.selectedIid?'selected':'idle';
  }
  function cancelSelection(reason='cancelled',announceIt=false){
    if(runtime.selectedIid)runtime.stats.cancels++;
    runtime.lastCancelReason=reason;
    const selected=$(`#match-screen .hand-card[data-card-iid="${attr(runtime.selectedIid||'')}" ]`);
    if(selected){selected.classList.remove('dm-selected');selected.removeAttribute('aria-pressed');}
    clearTargetDecorations();
    runtime.selectedIid=null;runtime.selectedActions=[];runtime.selectedAt=0;
    document.body.classList.remove('dm-has-selection');
    if(!runtime.drag)runtime.phase='idle';
    if(announceIt)announce('Card selection cancelled.');
  }
  function selectIid(iid,opts={}){
    const state=getState();
    const actions=actionsFor(iid,state);
    const card=$(`#match-screen .hand-card[data-card-iid="${attr(iid)}"]`);
    if(!card)return false;
    if(!actions.length){
      cancelSelection('unplayable');
      if(opts.inspectWhenUnplayable!==false){api.selectCard(iid);runtime.stats.inspections++;}
      return false;
    }
    if(runtime.selectedIid&&runtime.selectedIid!==iid)cancelSelection('transfer');
    runtime.selectedIid=iid;runtime.selectedActions=actions;runtime.selectedAt=Date.now();runtime.phase='selected';runtime.stats.selections++;
    card.classList.add('dm-selected');card.setAttribute('aria-pressed','true');
    buildTargets(actions,state);
    document.body.classList.add('dm-has-selection');
    if(opts.announce!==false){
      const d=cardDefForIid(state,iid);
      announce(`${d?.name||'Card'} selected. Choose ${legalSummary()}.`);
    }
    return true;
  }
  function inspectIid(iid){
    clearCandidate();
    abortDrag('inspect',true);
    cancelSelection('inspect');
    runtime.suppressClickUntil=Date.now()+350;
    runtime.stats.inspections++;
    api.selectCard(iid);
  }

  function activeTarget(target){
    for(const t of runtime.targets)t.el?.classList.toggle('dm-active-target',t===target);
    if(runtime.drag)runtime.drag.activeTarget=target||null;
  }
  function expandedContains(rect,x,y,pad=7){return x>=rect.left-pad&&x<=rect.right+pad&&y>=rect.top-pad&&y<=rect.bottom+pad;}
  function targetAt(x,y){
    const hits=[];
    for(const t of runtime.targets){
      const r=t.el?.getBoundingClientRect();
      if(!r||!r.width||!r.height)continue;
      if(expandedContains(r,x,y)){hits.push({t,area:r.width*r.height});}
    }
    hits.sort((a,b)=>a.area-b.area);
    return hits[0]?.t||null;
  }

  function makeProxy(card,rect,cls='dm-flight-proxy'){
    const proxy=card.cloneNode(true);
    proxy.removeAttribute('id');proxy.removeAttribute('aria-pressed');proxy.className=`${card.className.replace(/dm-[\w-]+/g,'').trim()} ${cls}`;
    proxy.style.position='fixed';proxy.style.left=`${rect.x}px`;proxy.style.top=`${rect.y}px`;proxy.style.width=`${rect.width}px`;proxy.style.height=`${rect.height}px`;
    proxy.style.margin='0';proxy.style.zIndex='10000';proxy.style.pointerEvents='none';proxy.style.transform='none';
    document.body.appendChild(proxy);
    return proxy;
  }
  function dragEnabled(){return runtime.mode!=='tap';}
  function beginDrag(c,e){
    if(!c||runtime.drag||Queue.busy||!dragEnabled())return false;
    if(!selectIid(c.iid,{announce:false,inspectWhenUnplayable:false}))return false;
    const card=c.card;
    const proxy=makeProxy(card,c.rect,'dm-drag-proxy');
    card.classList.add('dm-source-placeholder');
    try{card.setPointerCapture?.(c.pointerId);}catch(_){ }
    runtime.drag={
      pointerId:c.pointerId,iid:c.iid,card,proxy,sourceRect:c.rect,
      startX:c.startX,startY:c.startY,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,lastT:performance.now(),tilt:0,activeTarget:null
    };
    if(c.longTimer)clearTimeout(c.longTimer);
    runtime.candidate=null;runtime.phase='dragging';document.body.classList.add('dm-dragging');
    scheduleDragFrame(e.clientX,e.clientY);
    announce(`Dragging ${cardDefForIid(getState(),c.iid)?.name||'card'}. ${legalSummary()}.`);
    return true;
  }
  function scheduleDragFrame(x,y){
    if(!runtime.drag)return;
    runtime.drag.x=x;runtime.drag.y=y;
    if(runtime.dragRaf)return;
    runtime.dragRaf=requestAnimationFrame(renderDragFrame);
  }
  function renderDragFrame(){
    runtime.dragRaf=0;
    const d=runtime.drag;if(!d)return;
    const now=performance.now(),dt=Math.max(1,now-d.lastT);
    const vx=(d.x-d.lastX)/dt*1000;
    d.tilt=clamp(vx/330,-4,4);
    const dx=d.x-d.startX,dy=d.y-d.startY;
    d.proxy.style.transform=`translate3d(${dx}px,${dy}px,0) rotate(${d.tilt.toFixed(2)}deg) scale(1.04)`;
    const hit=targetAt(d.x,d.y);activeTarget(hit);
    runtime.phase=hit?'dragging_over_legal':'dragging_over_invalid';
    runtime.stats.pointerFrames++;
    try{
      const r=d.proxy.getBoundingClientRect();
      const centerX=r.x+r.width/2,centerY=r.y+r.height/2;
      const intendedX=d.sourceRect.x+d.sourceRect.width/2+dx,intendedY=d.sourceRect.y+d.sourceRect.height/2+dy;
      runtime.stats.maxPointerLagPx=Math.max(runtime.stats.maxPointerLagPx,Math.hypot(centerX-intendedX,centerY-intendedY));
    }catch(_){ }
    d.lastX=d.x;d.lastY=d.y;d.lastT=now;
  }

  function cleanupDragVisuals({keepProxy=false}={}){
    const d=runtime.drag;if(!d)return null;
    if(runtime.dragRaf){cancelAnimationFrame(runtime.dragRaf);runtime.dragRaf=0;}
    try{d.card?.releasePointerCapture?.(d.pointerId);}catch(_){ }
    d.card?.classList.remove('dm-source-placeholder');
    if(!keepProxy)d.proxy?.remove();
    document.body.classList.remove('dm-dragging');activeTarget(null);
    runtime.drag=null;
    return d;
  }
  function abortDrag(reason='cancelled',immediate=false){
    const d=runtime.drag;if(!d)return false;
    if(immediate){cleanupDragVisuals();cancelSelection(reason);runtime.lastCancelReason=reason;return true;}
    returnInvalidDrag(reason);
    return true;
  }

  function settleRectForAction(action,tx){
    const iid=action?.iid;
    const exact=iid?$(`#match-screen [data-inspect-board="${attr(iid)}"]`):null;
    if(exact)return {el:exact,rect:exact.getBoundingClientRect()};
    const dest=normalizeDestination(action,getState());
    const el=destinationElement(dest);
    if(el)return {el:null,rect:el.getBoundingClientRect()};
    const board=$('#board')?.getBoundingClientRect();
    return board?{el:null,rect:{x:board.x+board.width/2-15,y:board.y+board.height/2-20,width:30,height:40}}:null;
  }
  function rebaseProxy(proxy){
    if(!proxy)return null;
    const r=proxy.getBoundingClientRect();
    proxy.style.transform='none';proxy.style.left=`${r.x}px`;proxy.style.top=`${r.y}px`;proxy.style.width=`${r.width}px`;proxy.style.height=`${r.height}px`;
    return r;
  }
  function nextFrame(){return new Promise(resolve=>requestAnimationFrame(()=>resolve()));}
  function animationDone(anim){return anim?.finished?.catch(()=>{})||Promise.resolve();}
  function animateFlight(proxy,startRect,target,signal){
    if(!proxy||!target?.rect)return Promise.resolve();
    const end=target.rect;
    if(target.el)target.el.style.visibility='hidden';
    const cleanup=()=>{try{proxy.remove();}catch(_){}if(target.el)target.el.style.visibility='';};
    Queue.registerCleanup(cleanup);
    if(signal.aborted){cleanup();return Promise.resolve();}
    const reduced=Motion.reduced();
    const dx=end.x-startRect.x,dy=end.y-startRect.y;
    const sx=end.width/Math.max(1,startRect.width),sy=end.height/Math.max(1,startRect.height);
    const duration=Motion.duration(reduced?'microNormal':'routineNormal');
    let frames;
    if(reduced){
      frames=[{opacity:1,transform:'scale(1)'},{opacity:.68,transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`}];
    }else{
      frames=[
        {offset:0,transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'},
        {offset:.22,transform:`translate3d(${dx*.20}px,${dy*.20-7}px,0) scale(${1+(sx-1)*.20},${1+(sy-1)*.20})`,filter:'brightness(1.07)'},
        {offset:.78,transform:`translate3d(${dx*.82}px,${dy*.82-2}px,0) scale(${1+(sx-1)*.82},${1+(sy-1)*.82})`,filter:'brightness(1.03)'},
        {offset:1,transform:`translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`,filter:'brightness(1)'}
      ];
    }
    const anim=proxy.animate(frames,{duration,easing:Motion.EASING.direct,fill:'forwards'});
    Queue.registerAnimation(anim);
    return animationDone(anim).then(cleanup);
  }

  async function commitAction(action,inputMethod,sourceVisual){
    if(!action||Queue.busy)return false;
    const before=getState();if(!before)return false;
    const iid=action.iid;
    const sourceCard=$(`#match-screen .hand-card[data-card-iid="${attr(iid)}"]`);
    const sourceRect=sourceVisual?.rect||sourceCard?.getBoundingClientRect();
    const proxy=sourceVisual?.proxy||((sourceCard&&sourceRect)?makeProxy(sourceCard,sourceRect,'dm-flight-proxy'):null);
    const rebased=sourceVisual?.proxy?rebaseProxy(proxy):sourceRect;
    const beforeRects=Flip.capture();
    clearCandidate();
    if(runtime.drag)cleanupDragVisuals({keepProxy:true});
    cancelSelection('commit');
    runtime.phase='committing';
    try{
      api.playAction(action);
      window.GwentBattlefieldUX?.reconcile?.();
    }catch(err){
      runtime.stats.errors++;console.error(err);proxy?.remove();runtime.phase='idle';announce('That play is no longer legal.');return false;
    }
    const after=getState();
    const tx=Events.build(G,before,after,action,{inputMethod});
    runtime.lastTransaction=tx;runtime.stats.transactions++;
    if(inputMethod==='drag')runtime.stats.dragCommits++;else runtime.stats.tapCommits++;
    await Queue.run(tx,async(signal)=>{
      await nextFrame();
      window.GwentBattlefieldUX?.reconcile?.();
      const target=settleRectForAction(action,tx);
      const flip=Flip.animate(beforeRects,{exclude:[iid],duration:Motion.duration('routineNormal'),easing:Motion.EASING.direct});
      const flight=proxy&&rebased?animateFlight(proxy,rebased,target,signal):Promise.resolve();
      await Promise.all([flip,flight]);
    });
    window.GwentBattlefieldUX?.reconcile?.();
    runtime.phase='idle';
    announce(`${cardDefForIid(after,iid)?.name||'Card'} played.`);
    return true;
  }

  async function returnInvalidDrag(reason='invalid_drop'){
    const d=runtime.drag;if(!d)return;
    runtime.stats.invalidDrops++;runtime.lastCancelReason=reason;runtime.phase='returning';runtime.suppressClickUntil=Date.now()+350;
    activeTarget(null);
    const current=rebaseProxy(d.proxy);
    d.card?.classList.remove('dm-source-placeholder');
    try{d.card?.releasePointerCapture?.(d.pointerId);}catch(_){ }
    document.body.classList.remove('dm-dragging');
    runtime.drag=null;
    await Queue.run({kind:'invalid_drop',iid:d.iid,reason},async(signal)=>{
      const cleanup=()=>d.proxy?.remove();Queue.registerCleanup(cleanup);
      if(signal.aborted){cleanup();return;}
      if(Motion.reduced()){
        const a=d.proxy.animate([{opacity:.8},{opacity:0}],{duration:Motion.duration('microNormal'),easing:Motion.EASING.fade});Queue.registerAnimation(a);await animationDone(a);
      }else{
        const dx=d.sourceRect.x-current.x,dy=d.sourceRect.y-current.y;
        const sx=d.sourceRect.width/Math.max(1,current.width),sy=d.sourceRect.height/Math.max(1,current.height);
        const a=d.proxy.animate([
          {transform:'translate3d(0,0,0) scale(1)'},
          {offset:.78,transform:`translate3d(${dx}px,${dy-2}px,0) scale(${sx},${sy})`},
          {transform:`translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`}
        ],{duration:Motion.duration('invalidReturn'),easing:Motion.EASING.return,fill:'forwards'});
        Queue.registerAnimation(a);await animationDone(a);
      }
      cleanup();
    });
    cancelSelection(reason,true);runtime.phase='idle';window.GwentBattlefieldUX?.reconcile?.();
  }

  function onPointerDown(e){
    const card=e.target.closest?.('#match-screen .hand-card[data-card-iid]');
    if(!card||Queue.busy||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
    clearCandidate();
    const iid=card.dataset.cardIid;
    const rect=card.getBoundingClientRect();
    runtime.phase='pointer_down';card.classList.add('dm-pressing');
    const candidate={pointerId:e.pointerId,iid,card,startX:e.clientX,startY:e.clientY,rect,longTimer:0};
    candidate.longTimer=setTimeout(()=>{
      if(runtime.candidate===candidate&&!runtime.drag){inspectIid(iid);runtime.candidate=null;}
    },LONG_PRESS_MS);
    runtime.candidate=candidate;
  }
  function onPointerMove(e){
    const c=runtime.candidate;
    if(c&&c.pointerId===e.pointerId&&!runtime.drag){
      const dist=Math.hypot(e.clientX-c.startX,e.clientY-c.startY);
      if(dist>3&&c.longTimer){clearTimeout(c.longTimer);c.longTimer=0;}
      if(dist>=DRAG_THRESHOLD&&dragEnabled()){
        e.preventDefault();beginDrag(c,e);return;
      }
      runtime.phase='press_candidate';
    }
    if(runtime.drag&&runtime.drag.pointerId===e.pointerId){e.preventDefault();scheduleDragFrame(e.clientX,e.clientY);}
  }
  function onPointerUp(e){
    if(runtime.drag&&runtime.drag.pointerId===e.pointerId){
      e.preventDefault();e.stopPropagation();runtime.suppressClickUntil=Date.now()+420;
      scheduleDragFrame(e.clientX,e.clientY);if(runtime.dragRaf){cancelAnimationFrame(runtime.dragRaf);runtime.dragRaf=0;renderDragFrame();}
      const d=runtime.drag,target=d.activeTarget;
      if(target)commitAction(target.action,'drag',{proxy:d.proxy,rect:d.proxy.getBoundingClientRect()});
      else returnInvalidDrag('invalid_drop');
      return;
    }
    const c=runtime.candidate;if(c&&c.pointerId===e.pointerId)clearCandidate();
  }
  function onPointerCancel(e){
    if(runtime.drag&&runtime.drag.pointerId===e.pointerId){e.preventDefault();runtime.suppressClickUntil=Date.now()+300;abortDrag('pointercancel',true);announce('Drag cancelled.');}
    clearCandidate();
  }

  function onClickCapture(e){
    const inMatch=e.target.closest?.('#match-screen');
    if(inMatch&&Date.now()<runtime.suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();return;}
    if(inMatch&&Queue.busy){e.preventDefault();e.stopImmediatePropagation();return;}
    const hand=e.target.closest?.('#match-screen .hand-card[data-card-iid]');
    if(hand){
      e.preventDefault();e.stopImmediatePropagation();
      const iid=hand.dataset.cardIid;
      if(runtime.selectedIid===iid){inspectIid(iid);return;}
      selectIid(iid);return;
    }
    if(runtime.selectedIid){
      const legal=e.target.closest?.('.dm-legal-target');
      if(legal?.__gwentDmAction){
        e.preventDefault();e.stopImmediatePropagation();
        const selected=$(`#match-screen .hand-card[data-card-iid="${attr(runtime.selectedIid)}"]`);
        const rect=selected?.getBoundingClientRect();
        commitAction(legal.__gwentDmAction,'tap',selected&&rect?{proxy:makeProxy(selected,rect,'dm-flight-proxy'),rect}:null);return;
      }
      if(e.target.closest?.('#board,#board-geometry,.weather')){
        e.preventDefault();e.stopImmediatePropagation();cancelSelection('background',true);return;
      }
      if(!e.target.closest?.('#card-inspector'))cancelSelection('other_control');
    }
  }
  function onKeyDown(e){
    if(e.key==='Escape'&&runtime.selectedIid){e.preventDefault();cancelSelection('escape',true);return;}
    if((e.key==='Enter'||e.key===' ')&&runtime.selectedIid){
      const target=e.target.closest?.('.dm-legal-target');
      if(target?.__gwentDmAction){e.preventDefault();e.stopPropagation();const selected=$(`#match-screen .hand-card[data-card-iid="${attr(runtime.selectedIid)}"]`);const rect=selected?.getBoundingClientRect();commitAction(target.__gwentDmAction,'tap',selected&&rect?{proxy:makeProxy(selected,rect,'dm-flight-proxy'),rect}:null);}
    }
  }
  function onDblClick(e){
    const hand=e.target.closest?.('#match-screen .hand-card[data-card-iid]');if(hand){e.preventDefault();e.stopPropagation();inspectIid(hand.dataset.cardIid);}
  }

  function handleViewportInterruption(reason){
    Queue.cancel(reason);
    if(runtime.drag)abortDrag(reason,true);
    clearCandidate();
    if(runtime.selectedIid){requestAnimationFrame(()=>{const iid=runtime.selectedIid;cancelSelection(reason);selectIid(iid,{announce:false,inspectWhenUnplayable:false});});}
    window.GwentBattlefieldUX?.reconcile?.();
  }

  function setMode(mode){
    if(!VALID_MODES.has(mode))throw new Error(`Unknown interaction mode: ${mode}`);
    runtime.mode=mode;localStorage.setItem(MODE_KEY,mode);
    const select=$('#card-interaction-mode');if(select)select.value=mode;
    cancelSelection('mode_change');announce(`Card interaction set to ${mode}.`);return mode;
  }
  function installSettings(){
    const panel=$('#settings-screen .deck-page-panel');if(!panel||$('#card-interaction-mode'))return;
    const row=document.createElement('label');row.className='deck-card dm-setting-row';
    row.innerHTML='<span>Card interaction</span><select id="card-interaction-mode" class="mini-select" aria-label="Card interaction mode"><option value="hybrid">Hybrid · tap or drag</option><option value="tap">Tap-first</option><option value="drag">Drag-first</option></select>';
    const dev=$('#developer-mode')?.closest('label');panel.insertBefore(row,dev||panel.firstChild);
    const select=$('#card-interaction-mode');select.value=runtime.mode;select.addEventListener('change',e=>setMode(e.target.value));
  }
  function installVersionMarks(){
    document.title='Gwent Classic — Definitive Edition · Pass 10.4A';
    const build=$('.buildline');if(build)build.textContent='BUILD 10.4A · DIRECT MANIPULATION · CI-GATED';
    const profile=$('#profile-screen h2');if(profile)profile.textContent='Pass 10.4A interaction status';
  }
  function install(){
    ensureLiveRegion();installSettings();installVersionMarks();
    document.addEventListener('pointerdown',onPointerDown,{capture:true,passive:false});
    document.addEventListener('pointermove',onPointerMove,{capture:true,passive:false});
    document.addEventListener('pointerup',onPointerUp,{capture:true,passive:false});
    document.addEventListener('pointercancel',onPointerCancel,{capture:true,passive:false});
    document.addEventListener('click',onClickCapture,true);
    document.addEventListener('dblclick',onDblClick,true);
    document.addEventListener('keydown',onKeyDown,true);
    window.addEventListener('orientationchange',()=>handleViewportInterruption('orientationchange'),{passive:true});
    let lastW=innerWidth,lastH=innerHeight;
    window.addEventListener('resize',()=>{
      if(runtime.drag&&(Math.abs(innerWidth-lastW)>20||Math.abs(innerHeight-lastH)>20))handleViewportInterruption('resize');
      lastW=innerWidth;lastH=innerHeight;
    },{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)handleViewportInterruption('visibilitychange');});
  }

  install();

  window.GwentDirectManipulation={
    version:'10.4A.0',contractVersion:'1.0',
    get phase(){return runtime.phase;},
    get mode(){return runtime.mode;},
    get selectedIid(){return runtime.selectedIid;},
    get lastTransaction(){return runtime.lastTransaction?JSON.parse(JSON.stringify(runtime.lastTransaction)):null;},
    get stats(){return JSON.parse(JSON.stringify(runtime.stats));},
    setMode,
    select:(iid)=>selectIid(iid),
    cancel:(reason='qa')=>{Queue.cancel(reason);if(runtime.drag)abortDrag(reason,true);clearCandidate();cancelSelection(reason);window.GwentBattlefieldUX?.reconcile?.();},
    actionsFor:(iid)=>actionsFor(iid).map(a=>JSON.parse(JSON.stringify(a))),
    normalizeDestination:(action)=>normalizeDestination(action),
    actionKey,
    targets:()=>runtime.targets.map(t=>({key:t.key,dest:{...t.dest},action:{...t.action},box:t.el?.getBoundingClientRect()||null})),
    waitForIdle:(timeout=3000)=>new Promise((resolve,reject)=>{const start=performance.now();const tick=()=>{if(!Queue.busy&&!runtime.drag&&runtime.phase!=='committing'&&runtime.phase!=='returning')resolve(true);else if(performance.now()-start>timeout)reject(new Error('Direct manipulation did not become idle'));else requestAnimationFrame(tick);};tick();}),
    reduced:(value)=>Motion.setReducedOverride(value),
    constants:{DRAG_THRESHOLD,LONG_PRESS_MS}
  };
  window.__GWENT_PASS10_4A__=api;
})();

(() => {
  'use strict';

  const Motion=window.GwentMotionTokens;
  if(!Motion){
    console.error('Pass 11.2C target exposure dependency missing');
    return;
  }

  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const runtime={
    target:null,
    actor:null,
    actorRestRect:null,
    actorLift:null,
    neighbors:[],
    meta:null,
    updates:0,
    clears:0,
    lastClearReason:null,
    scheduled:false,
    pendingRefresh:false,
    trajectoryTimer:0
  };

  function direct(){return window.GwentDirectManipulation||null;}
  function iid(el){return el?.dataset?.inspectBoard||el?.dataset?.teActorFor||null;}
  function rect(el){
    if(!el?.isConnected)return null;
    const r=el.getBoundingClientRect();
    if(!r.width||!r.height)return null;
    return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,cx:r.x+r.width/2,cy:r.y+r.height/2};
  }
  function plainRect(r){
    if(!r)return null;
    return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,cx:r.cx??r.x+r.width/2,cy:r.cy??r.y+r.height/2};
  }
  function clearNeighbor(entry){
    const el=entry?.el;
    if(!el)return;
    el.classList.remove('te-neighbor-yield');
    el.style.removeProperty('--te-yield-x');
    delete el.dataset.teYieldSide;
  }
  function removeActor(){
    const actor=runtime.actor;
    runtime.actor=null;
    runtime.actorRestRect=null;
    runtime.actorLift=null;
    if(actor){try{actor.remove();}catch(_){}}
  }
  function clearTarget(el){
    if(!el)return;
    el.classList.remove('te-locked-target','te-actor-source');
    delete el.dataset.teConfidence;
    delete el.dataset.teReason;
    delete el.dataset.teLocked;
  }
  function clear(reason='clear'){
    const hadState=!!runtime.target||!!runtime.actor||runtime.neighbors.length>0||document.body.classList.contains('te-has-card-target');
    for(const entry of runtime.neighbors)clearNeighbor(entry);
    clearTarget(runtime.target);
    removeActor();
    runtime.target=null;
    runtime.neighbors=[];
    runtime.meta=null;
    runtime.lastClearReason=reason;
    if(hadState)runtime.clears++;
    document.body.classList.remove('te-has-card-target','te-reduced');
    return true;
  }
  function clearStaleMarks(){
    for(const el of $$('#match-screen .te-intent-stale'))el.classList.remove('te-intent-stale');
  }
  function cancelTrajectoryExpiry(){
    if(runtime.trajectoryTimer){clearTimeout(runtime.trajectoryTimer);runtime.trajectoryTimer=0;}
  }

  function immediateNeighbors(target){
    const rail=target?.closest?.('.units');
    if(!rail)return [];
    const all=$$('.unit[data-inspect-board]',rail)
      .map(el=>({el,r:rect(el)}))
      .filter(x=>x.r)
      .sort((a,b)=>a.r.cx-b.r.cx||String(iid(a.el)).localeCompare(String(iid(b.el))));
    const index=all.findIndex(x=>x.el===target);
    if(index<0)return [];
    const out=[];
    if(index>0)out.push({...all[index-1],side:'left'});
    if(index<all.length-1)out.push({...all[index+1],side:'right'});
    return out;
  }

  function yieldDistance(targetRect,neighborRect,side){
    const width=Math.max(1,targetRect.width);
    const overlap=side==='left'
      ? Math.max(0,neighborRect.right-targetRect.x)
      : Math.max(0,targetRect.right-neighborRect.x);
    const desired=Math.max(width*.13,overlap*.16+width*.08);
    return clamp(desired,2,Math.min(8,Math.max(2,width*.30)));
  }

  function actorLiftFor(targetRect,proxyRect,reduced){
    if(reduced)return {x:0,y:0,scale:1};
    const centered=!proxyRect||Math.abs(targetRect.cx-proxyRect.cx)<Math.max(2,targetRect.width*.12);
    let direction;
    if(!centered)direction=targetRect.cx<proxyRect.cx?-1:1;
    else direction=targetRect.cx<(window.innerWidth||852)/2?-1:1;
    return {
      x:direction*clamp(targetRect.width*.18,2,7),
      y:-clamp(targetRect.height*.20,4,9),
      scale:1.16
    };
  }

  function createActor(target,targetRect,normalized){
    const actor=target.cloneNode(true);
    actor.classList.remove('dm-legal-target','dm-active-target','te-locked-target','te-neighbor-yield','te-actor-source','te-intent-stale');
    actor.classList.add('te-target-actor');
    actor.removeAttribute('data-inspect-board');
    actor.removeAttribute('data-dm-action-key');
    actor.removeAttribute('data-dm-label');
    actor.removeAttribute('tabindex');
    actor.removeAttribute('role');
    actor.removeAttribute('title');
    actor.removeAttribute('aria-label');
    actor.setAttribute('aria-hidden','true');
    actor.dataset.teActorFor=iid(target)||'';
    for(const child of actor.querySelectorAll('[id]'))child.removeAttribute('id');

    actor.style.position='fixed';
    actor.style.left=`${targetRect.x}px`;
    actor.style.top=`${targetRect.y}px`;
    actor.style.width=`${targetRect.width}px`;
    actor.style.height=`${targetRect.height}px`;
    actor.style.margin='0';
    actor.style.zIndex='10020';
    actor.style.pointerEvents='none';

    const proxy=rect(document.querySelector('.dm-drag-proxy'));
    const lift=actorLiftFor(targetRect,proxy,normalized.reduced);
    actor.style.setProperty('--te-actor-x',`${lift.x.toFixed(2)}px`);
    actor.style.setProperty('--te-actor-y',`${lift.y.toFixed(2)}px`);
    actor.style.setProperty('--te-actor-scale',String(lift.scale));
    actor.dataset.teReduced=normalized.reduced?'true':'false';
    actor.dataset.teConfidence=normalized.confidence.toFixed(3);
    actor.dataset.teReason=normalized.reason;

    document.body.appendChild(actor);
    runtime.actor=actor;
    runtime.actorRestRect=plainRect(targetRect);
    runtime.actorLift={...lift};

    // The actor is already painted at the exact resting rectangle before the
    // source is hidden. The next frame supplies only presentational lift.
    actor.getBoundingClientRect();
    target.classList.add('te-actor-source');
    if(!normalized.reduced){
      requestAnimationFrame(()=>{
        if(runtime.actor===actor&&actor.isConnected)actor.classList.add('te-actor-raised');
      });
    }
    return actor;
  }

  function lock(target,meta={}){
    if(!target?.isConnected||meta.kind!=='target')return clear('no-card-target');

    const same=runtime.target===target;
    const normalized={
      kind:'target',
      iid:meta.iid||iid(target),
      confidence:Number(meta.confidence||0),
      reason:String(meta.reason||''),
      classification:String(meta.classification||''),
      reduced:Motion.reduced()
    };

    if(same&&runtime.meta?.reduced===normalized.reduced&&runtime.actor?.isConnected){
      runtime.meta=normalized;
      target.dataset.teConfidence=normalized.confidence.toFixed(3);
      target.dataset.teReason=normalized.reason;
      runtime.actor.dataset.teConfidence=normalized.confidence.toFixed(3);
      runtime.actor.dataset.teReason=normalized.reason;
      document.body.classList.toggle('te-reduced',normalized.reduced);
      runtime.updates++;
      return snapshot();
    }

    clear('replace');
    const targetRect=rect(target);
    if(!targetRect)return false;

    runtime.target=target;
    runtime.meta=normalized;
    target.classList.add('te-locked-target');
    target.dataset.teLocked='true';
    target.dataset.teConfidence=normalized.confidence.toFixed(3);
    target.dataset.teReason=normalized.reason;
    document.body.classList.add('te-has-card-target');
    document.body.classList.toggle('te-reduced',normalized.reduced);

    if(!normalized.reduced){
      for(const entry of immediateNeighbors(target)){
        const distance=yieldDistance(targetRect,entry.r,entry.side);
        const shift=entry.side==='left'?-distance:distance;
        entry.el.classList.add('te-neighbor-yield');
        entry.el.style.setProperty('--te-yield-x',`${shift.toFixed(2)}px`);
        entry.el.dataset.teYieldSide=entry.side;
        runtime.neighbors.push({el:entry.el,side:entry.side,shift});
      }
    }

    createActor(target,targetRect,normalized);
    runtime.updates++;
    return snapshot();
  }

  function sync(target,meta={}){
    if(!target||meta.kind!=='target')return clear(meta.reason||'inactive');
    return lock(target,meta);
  }

  function scheduleTrajectoryExpiry(active,intent){
    cancelTrajectoryExpiry();
    if(!active||intent?.reason!=='trajectory_singular'||!intent?.trajectoryConsidered)return;
    const actionKey=active.dataset.dmActionKey||'';
    const delay=(direct()?.constants?.VELOCITY_FRESH_MS||120)+10;
    runtime.trajectoryTimer=setTimeout(()=>{
      runtime.trajectoryTimer=0;
      const current=$$('#match-screen .dm-active-target')[0]||null;
      const latest=direct()?.lastIntent;
      if(current===active&&(current.dataset.dmActionKey||'')===actionKey&&latest?.reason==='trajectory_singular'){
        clear('trajectory-expired');
        current.classList.add('te-intent-stale');
      }
    },delay);
  }

  function syncFromController(refresh=false){
    const match=document.querySelector('#match-screen');
    if(!match)return clear('no-match');
    const rawActive=match.querySelector('.dm-active-target');
    if(refresh)clearStaleMarks();
    if(!rawActive){
      cancelTrajectoryExpiry();
      clearStaleMarks();
      return clear('controller-inactive');
    }
    if(rawActive.classList.contains('te-intent-stale')&&!refresh){
      cancelTrajectoryExpiry();
      return clear('stale-controller-intent');
    }

    const intent=direct()?.lastIntent;
    scheduleTrajectoryExpiry(rawActive,intent);
    const isCardTarget=rawActive.matches('.unit[data-inspect-board]')&&intent?.candidate?.kind==='target';
    if(!isCardTarget)return clear(intent?.reason||'non-card-target');
    return lock(rawActive,{
      kind:'target',
      iid:iid(rawActive),
      confidence:intent?.confidence||0,
      reason:intent?.reason||'',
      classification:intent?.classification||''
    });
  }

  function scheduleSync(refresh=false){
    runtime.pendingRefresh=runtime.pendingRefresh||refresh;
    if(runtime.scheduled)return;
    runtime.scheduled=true;
    requestAnimationFrame(()=>{
      runtime.scheduled=false;
      const shouldRefresh=runtime.pendingRefresh;
      runtime.pendingRefresh=false;
      syncFromController(shouldRefresh);
    });
  }

  function actorTelemetry(){
    const actorRect=rect(runtime.actor);
    const proxy=document.querySelector('.dm-drag-proxy');
    const proxyRect=rect(proxy);
    const actorZ=runtime.actor?Number(getComputedStyle(runtime.actor).zIndex)||0:0;
    const proxyZ=proxy?Number(getComputedStyle(proxy).zIndex)||0:0;
    return {
      iid:iid(runtime.actor),
      restRect:runtime.actorRestRect?plainRect(runtime.actorRestRect):null,
      rect:actorRect?plainRect(actorRect):null,
      lift:runtime.actorLift?{...runtime.actorLift}:null,
      sourceVisibility:runtime.target?.isConnected?getComputedStyle(runtime.target).visibility:null,
      actorZ,
      proxyZ,
      aboveProxy:!!runtime.actor&&!!proxy&&actorZ>proxyZ,
      hasArt:!!runtime.actor?.querySelector('img'),
      power:runtime.actor?.querySelector('.u-score')?.textContent||null
    };
  }

  function snapshot(){
    return {
      version:'11.2C.0',
      targetIid:iid(runtime.target),
      neighborIids:runtime.neighbors.map(n=>iid(n.el)),
      neighborShifts:runtime.neighbors.map(n=>({iid:iid(n.el),side:n.side,shift:n.shift})),
      reduced:!!runtime.meta?.reduced,
      confidence:runtime.meta?.confidence??0,
      reason:runtime.meta?.reason||null,
      classification:runtime.meta?.classification||null,
      actor:actorTelemetry(),
      updates:runtime.updates,
      clears:runtime.clears,
      lastClearReason:runtime.lastClearReason,
      staleActiveIids:$$('#match-screen .dm-active-target.te-intent-stale').map(iid)
    };
  }

  const match=document.querySelector('#match-screen');
  if(match){
    const observer=new MutationObserver(()=>scheduleSync(false));
    observer.observe(match,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }
  document.addEventListener('pointermove',()=>scheduleSync(true),{passive:true});
  document.addEventListener('pointerup',()=>scheduleSync(true),{passive:true});
  document.addEventListener('pointercancel',()=>scheduleSync(true),{passive:true});
  window.addEventListener('orientationchange',()=>scheduleSync(true),{passive:true});
  window.addEventListener('resize',()=>scheduleSync(true),{passive:true});
  scheduleSync(true);

  window.GwentTargetExposure=Object.freeze({
    version:'11.2C.0',
    sync,
    lock,
    clear,
    syncFromController,
    snapshot,
    yieldDistance,
    actorLiftFor
  });
})();

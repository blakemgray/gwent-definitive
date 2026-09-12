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
    neighbors:[],
    meta:null,
    updates:0,
    clears:0,
    lastClearReason:null
  };

  function iid(el){return el?.dataset?.inspectBoard||null;}
  function rect(el){
    if(!el?.isConnected)return null;
    const r=el.getBoundingClientRect();
    if(!r.width||!r.height)return null;
    return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,cx:r.x+r.width/2,cy:r.y+r.height/2};
  }
  function clearNeighbor(entry){
    const el=entry?.el;
    if(!el)return;
    el.classList.remove('te-neighbor-yield');
    el.style.removeProperty('--te-yield-x');
    delete el.dataset.teYieldSide;
  }
  function clearTarget(el){
    if(!el)return;
    el.classList.remove('te-locked-target');
    delete el.dataset.teConfidence;
    delete el.dataset.teReason;
    delete el.dataset.teLocked;
  }
  function clear(reason='clear'){
    for(const entry of runtime.neighbors)clearNeighbor(entry);
    clearTarget(runtime.target);
    runtime.target=null;
    runtime.neighbors=[];
    runtime.meta=null;
    runtime.lastClearReason=reason;
    runtime.clears++;
    document.body.classList.remove('te-has-card-target');
    return true;
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

    if(same&&runtime.meta?.reduced===normalized.reduced){
      runtime.meta=normalized;
      target.dataset.teConfidence=normalized.confidence.toFixed(3);
      target.dataset.teReason=normalized.reason;
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

    runtime.updates++;
    return snapshot();
  }

  function sync(target,meta={}){
    if(!target||meta.kind!=='target')return clear(meta.reason||'inactive');
    return lock(target,meta);
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
      updates:runtime.updates,
      clears:runtime.clears,
      lastClearReason:runtime.lastClearReason
    };
  }

  window.GwentTargetExposure=Object.freeze({
    version:'11.2C.0',
    sync,
    lock,
    clear,
    snapshot,
    yieldDistance
  });
})();

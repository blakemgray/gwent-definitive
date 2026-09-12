(() => {
  'use strict';

  const api=window.__GWENT_PASS10__;
  const G=api?.engine;
  const Queue=window.GwentPresentationQueue;
  if(!api||!G||!Queue){
    console.error('Pass 11.2D continuity dependencies missing');
    return;
  }

  const TRACE_LIMIT=240;
  const trace=[];
  let seq=0;
  let raf=0;
  let quietFrames=0;
  const guarded=new Map();
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const attr=value=>String(value).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  const rectOf=el=>{
    if(!el)return null;
    const r=el.getBoundingClientRect();
    return {x:Number(r.x),y:Number(r.y),width:Number(r.width),height:Number(r.height)};
  };
  function isVisible(el){
    if(!el||!el.isConnected)return false;
    const c=getComputedStyle(el),r=el.getBoundingClientRect();
    return c.display!=='none'&&c.visibility!=='hidden'&&Number(c.opacity||1)>.02&&r.width>0&&r.height>0;
  }
  function snapEl(el,role){
    if(!el)return {role,present:false,visible:false,placeholder:false,fullStrength:false,rect:null,presentationIid:null};
    const placeholder=el.classList.contains('dm-source-placeholder');
    const visible=isVisible(el);
    return {
      role,present:true,visible,placeholder,
      fullStrength:visible&&!placeholder,
      rect:rectOf(el),
      presentationIid:el.dataset.presentationIid||null
    };
  }
  function engineZone(iid,state=api.getState()){
    if(!state||!iid)return 'missing';
    for(const pid of ['p1','p2']){
      for(const zone of ['hand','deck','grave'])if(state.players?.[pid]?.[zone]?.some(c=>c.iid===iid))return `${zone}:${pid}`;
      for(const row of G.ROWS){
        if(state.players?.[pid]?.board?.[row]?.some(c=>c.iid===iid))return `board:${pid}:${row}`;
        if(state.players?.[pid]?.board?.special?.[row]?.iid===iid)return `special:${pid}:${row}`;
      }
    }
    if((state.weatherCards||[]).some(e=>e?.inst?.iid===iid))return 'weather';
    return 'missing';
  }
  function proxyFor(iid){
    return $(`.dm-drag-proxy[data-presentation-iid="${attr(iid)}"],.dm-flight-proxy[data-presentation-iid="${attr(iid)}"]`);
  }
  function sourceFor(iid){return $(`#match-screen .hand-card[data-card-iid="${attr(iid)}"]`);}
  function finalFor(iid){return $(`#match-screen [data-inspect-board="${attr(iid)}"]`);}
  function activeIids(){
    const ids=new Set();
    $$('.dm-drag-proxy,.dm-flight-proxy').forEach(el=>{const iid=el.dataset.presentationIid||el.dataset.cardIid;if(iid)ids.add(iid);});
    guarded.forEach((_,iid)=>ids.add(iid));
    return [...ids];
  }
  function annotateProxies(){
    $$('.dm-drag-proxy,.dm-flight-proxy').forEach(proxy=>{
      const iid=proxy.dataset.presentationIid||proxy.dataset.cardIid;
      if(!iid)return;
      proxy.dataset.presentationIid=iid;
      proxy.dataset.presentationRole=proxy.classList.contains('dm-drag-proxy')?'drag-proxy':'flight-proxy';
    });
  }
  function sample(stage,iid,extra={}){
    if(!iid)return null;
    const source=sourceFor(iid),proxy=proxyFor(iid),final=finalFor(iid);
    const sourceSnap=snapEl(source,'source');
    const proxySnap=snapEl(proxy,proxy?.dataset.presentationRole||'proxy');
    const finalSnap=snapEl(final,'final');
    const visibleRepresentationCount=[sourceSnap,proxySnap,finalSnap].filter(x=>x.visible).length;
    const fullStrengthVisibleCount=[sourceSnap,proxySnap,finalSnap].filter(x=>x.fullStrength).length;
    const row={
      seq:++seq,stage,timeMs:performance.now(),iid,
      inputMethod:proxy?.classList.contains('dm-drag-proxy')?'drag':(proxy?'tap':null),
      phase:window.GwentDirectManipulation?.phase||null,
      queueBusy:!!Queue.busy,
      engineZone:engineZone(iid),
      source:sourceSnap,proxy:proxySnap,final:finalSnap,
      visibleRepresentationCount,fullStrengthVisibleCount,
      ...extra
    };
    trace.push(row);if(trace.length>TRACE_LIMIT)trace.splice(0,trace.length-TRACE_LIMIT);
    return row;
  }
  function guardFinal(iid,final){
    if(!iid||!final||guarded.get(iid)===final)return;
    const existing=guarded.get(iid);
    if(existing&&existing!==final)releaseGuard(iid,'final-replaced');
    final.dataset.continuityGuardIid=iid;
    final.style.visibility='hidden';
    guarded.set(iid,final);
    sample('final-guarded',iid);
    if(Queue.busy)Queue.registerCleanup(()=>releaseGuard(iid,'queue-cleanup'));
  }
  function releaseGuard(iid,reason='released'){
    const final=guarded.get(iid);
    if(!final)return false;
    if(final.isConnected&&final.dataset.continuityGuardIid===iid){
      delete final.dataset.continuityGuardIid;
      final.style.visibility='';
    }
    guarded.delete(iid);
    sample('final-revealed',iid,{reason});
    return true;
  }
  function reconcileContinuity(stage='mutation'){
    annotateProxies();
    for(const iid of activeIids()){
      const proxy=proxyFor(iid);
      const zone=engineZone(iid);
      const final=finalFor(iid);
      if(proxy&&zone.startsWith('board:')&&final)guardFinal(iid,final);
      if(!proxy&&guarded.has(iid))releaseGuard(iid,'proxy-gone');
      sample(stage,iid);
    }
    ensureFrameLoop();
  }
  function frame(){
    raf=0;
    annotateProxies();
    const ids=activeIids();
    if(ids.length){
      quietFrames=0;
      ids.forEach(iid=>{
        const proxy=proxyFor(iid),zone=engineZone(iid),final=finalFor(iid);
        if(proxy&&zone.startsWith('board:')&&final)guardFinal(iid,final);
        if(!proxy&&guarded.has(iid))releaseGuard(iid,'proxy-gone-frame');
        sample('frame',iid);
      });
      raf=requestAnimationFrame(frame);
    }else if(quietFrames++<1){
      raf=requestAnimationFrame(frame);
    }
  }
  function ensureFrameLoop(){if(!raf)raf=requestAnimationFrame(frame);}

  const observer=new MutationObserver(()=>reconcileContinuity('mutation'));
  observer.observe(document.body,{childList:true,subtree:true});
  Queue.subscribe((type,payload)=>{
    const iid=payload?.meta?.action?.iid||payload?.meta?.iid||activeIids()[0]||null;
    if(iid)sample(`queue-${type}`,iid,{queueEvent:type,reason:payload?.reason||null});
    if(type==='complete'||type==='cancel'||type==='error')requestAnimationFrame(()=>{
      [...guarded.keys()].forEach(id=>releaseGuard(id,`queue-${type}`));
      reconcileContinuity(`post-queue-${type}`);
    });
  });

  reconcileContinuity('install');

  window.GwentCardContinuity={
    version:'11.2D.0',
    get trace(){return JSON.parse(JSON.stringify(trace));},
    get latest(){return trace.length?JSON.parse(JSON.stringify(trace[trace.length-1])):null;},
    clear(){trace.length=0;seq=0;return true;},
    sample:(stage,iid,extra={})=>sample(stage,iid,extra),
    snapshot:iid=>sample('manual',iid),
    reconcile:()=>reconcileContinuity('manual-reconcile'),
    guardedIids:()=>[...guarded.keys()],
    constants:{TRACE_LIMIT}
  };
})();
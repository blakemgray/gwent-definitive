(() => {
  'use strict';

  const api=window.__GWENT_PASS10__;
  const Queue=window.GwentPresentationQueue;
  if(!api||!Queue||typeof api.playAction!=='function'||typeof api.maybeAutoBot!=='function'){
    console.error('Pass 10.4A interaction turn gate dependencies missing');
    return;
  }

  const originalPlayAction=api.playAction.bind(api);
  let pending=false;
  let pendingSince=0;
  let releases=0;
  let deferrals=0;

  function autoBotToggle(){return document.querySelector('#auto-bot');}
  function release(reason){
    if(!pending)return false;
    pending=false;
    pendingSince=0;
    releases++;
    queueMicrotask(()=>api.maybeAutoBot());
    return reason||true;
  }

  api.playAction=function presentationAwarePlayerAction(action){
    const toggle=autoBotToggle();
    const shouldGate=!!toggle?.checked;
    if(!shouldGate)return originalPlayAction(action);

    // The legacy match controller schedules the bot synchronously from commit().
    // Momentarily disable that scheduler while preserving the persisted setting.
    // The bot is re-armed only after the presentation transaction completes,
    // is cancelled, or presentation itself fails and reconciles to engine state.
    toggle.checked=false;
    try{
      const result=originalPlayAction(action);
      pending=true;
      pendingSince=performance.now();
      deferrals++;
      queueMicrotask(()=>{
        // Inspector/developer play paths do not necessarily start a presentation
        // queue. In that case preserve the old behavior instead of deadlocking.
        if(pending&&!Queue.busy)release('no_presentation');
      });
      return result;
    }finally{
      toggle.checked=true;
    }
  };

  Queue.subscribe((type)=>{
    if((type==='complete'||type==='cancel'||type==='error')&&pending)release(type);
  });

  window.GwentInteractionTurnGate={
    version:'10.4A.0',
    get pending(){return pending;},
    get pendingMs(){return pending?Math.max(0,performance.now()-pendingSince):0;},
    get stats(){return {deferrals,releases,pending};},
    release:()=>release('manual')
  };
})();
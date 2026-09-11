(() => {
  'use strict';
  const api=window.__GWENT_PASS10__;
  const Queue=window.GwentPresentationQueue;
  if(!api||!Queue){console.error('Pass 10.4B external choreography gate dependencies missing');return;}

  let gated=false;
  let deferrals=0;
  let releases=0;
  let geometrySyncs=0;
  function toggle(){return document.querySelector('#auto-bot');}
  function isPlayerCommitControl(target){return !!target?.closest?.('#pass-button,#activate-leader,[data-medic],[data-play-index]');}
  function release(reason){
    if(!gated)return false;
    gated=false;releases++;
    const t=toggle();if(t)t.checked=true;
    queueMicrotask(()=>api.maybeAutoBot?.());
    return reason||true;
  }

  // gameplay-choreography wraps Queue.run before this module loads. Wrap that
  // boundary once more so every committed game action—gesture-driven or an
  // external control such as Medic/Pass/leader—reconciles through the frozen
  // Pass 10.3 compositor before 10.4B captures its authoritative "after" visual.
  // This prevents raw, pre-layout DOM geometry from becoming presentation data.
  const choreographyRun=Queue.run.bind(Queue);
  Queue.run=async function geometrySynchronizedRun(meta,executor){
    if(meta?.kind!=='game_action')return choreographyRun(meta,executor);
    return choreographyRun(meta,async(signal,token)=>{
      const result=await executor(signal,token);
      window.GwentBattlefieldUX?.reconcile?.();
      geometrySyncs++;
      return result;
    });
  };

  document.addEventListener('click',event=>{
    if(!isPlayerCommitControl(event.target)||Queue.busy)return;
    const t=toggle();if(!t?.checked)return;
    // Disable only the legacy synchronous scheduler. The persisted setting is
    // untouched and is restored after the external presentation transaction.
    t.checked=false;gated=true;deferrals++;
    setTimeout(()=>{if(gated&&!Queue.busy)release('no_presentation');},0);
  },true);

  Queue.subscribe(type=>{
    if((type==='complete'||type==='cancel'||type==='error')&&gated)release(type);
  });

  window.GwentChoreographyExternalGate={
    version:'10.4B.0',
    get pending(){return gated;},
    get stats(){return {deferrals,releases,pending:gated,geometrySyncs};},
    release:()=>release('manual')
  };

  // This module remains a Pass 10.4B behavioral substrate. Visible release /
  // milestone identity belongs to the latest presentation layer (10.4C+), so
  // lower layers must never overwrite document/profile version marks.
})();

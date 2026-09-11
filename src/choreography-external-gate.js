(() => {
  'use strict';
  const api=window.__GWENT_PASS10__;
  const Queue=window.GwentPresentationQueue;
  if(!api||!Queue){console.error('Pass 10.4B external choreography gate dependencies missing');return;}

  let gated=false;
  let deferrals=0;
  let releases=0;
  function toggle(){return document.querySelector('#auto-bot');}
  function isPlayerCommitControl(target){return !!target?.closest?.('#pass-button,#activate-leader,[data-medic],[data-play-index]');}
  function release(reason){
    if(!gated)return false;
    gated=false;releases++;
    const t=toggle();if(t)t.checked=true;
    queueMicrotask(()=>api.maybeAutoBot?.());
    return reason||true;
  }
  function installVersionMarks(){
    document.title='Gwent Classic — Definitive Edition · Pass 10.4B';
    const build=document.querySelector('.buildline');if(build)build.textContent='BUILD 10.4B · SIGNATURE GAMEPLAY CHOREOGRAPHY · CI-GATED';
    const profile=document.querySelector('#profile-screen h2');if(profile)profile.textContent='Pass 10.4B choreography status';
    const eyebrow=document.querySelector('#profile-screen .eyebrow');if(eyebrow)eyebrow.textContent='PASS 10.4B';
  }

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
    get stats(){return {deferrals,releases,pending:gated};},
    release:()=>release('manual')
  };
  // Gesture-controller 10.4A stamps its own version during parser execution;
  // defer this presentation-pass mark until the current script graph has settled.
  setTimeout(installVersionMarks,0);
})();

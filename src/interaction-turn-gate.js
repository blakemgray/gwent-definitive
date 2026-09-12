(() => {
  'use strict';

  const api=window.__GWENT_PASS10__;
  const Queue=window.GwentPresentationQueue;
  if(!api||!Queue||typeof api.playAction!=='function'||typeof api.botMove!=='function'||typeof api.maybeAutoBot!=='function'){
    console.error('Pass 10.4A interaction turn gate dependencies missing');
    return;
  }

  const originalPlayAction=api.playAction.bind(api);
  const originalBotMove=api.botMove.bind(api);
  let pending=false;
  let pendingSince=0;
  let releases=0;
  let deferrals=0;
  let botPending=false;
  let botPendingSince=0;
  let botReleases=0;
  let botDeferrals=0;
  let deferredRearm=false;

  function autoBotToggle(){return document.querySelector('#auto-bot');}

  function clearScheduledBot(){
    const toggle=autoBotToggle();
    if(!toggle)return false;
    const wasChecked=toggle.checked;
    toggle.checked=false;
    try{api.maybeAutoBot();}
    finally{toggle.checked=wasChecked;}
    return true;
  }

  function opponentEligible(){
    const s=api.getState?.();
    if(!s||s.winner)return false;
    const ownsChoice=s.pendingChoice?.playerId==='p2';
    return !!(ownsChoice||(!s.pendingChoice&&s.currentPlayerId==='p2'));
  }

  function flushRearmWhenIdle(){
    queueMicrotask(()=>{
      if(!deferredRearm||Queue.busy)return;
      deferredRearm=false;
      api.maybeAutoBot();
    });
  }

  function requestRearm(){
    deferredRearm=true;
    flushRearmWhenIdle();
  }

  function release(reason){
    if(!pending)return false;
    pending=false;
    pendingSince=0;
    releases++;
    requestRearm();
    return reason||true;
  }

  function armBot(reason){
    if(botPending)return false;
    botPending=true;
    botPendingSince=performance.now();
    botDeferrals++;
    deferredRearm=true;
    return reason||true;
  }

  function releaseBot(reason){
    if(!botPending)return false;
    botPending=false;
    botPendingSince=0;
    botReleases++;
    requestRearm();
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

  // Public/manual opponent actions share the same mutation eligibility rule.
  // The production auto-bot timer is additionally cancelled at queue start below.
  api.botMove=function presentationAwareBotAction(...args){
    if(Queue.busy){
      armBot('busy_bot_action');
      return undefined;
    }
    return originalBotMove(...args);
  };

  Queue.subscribe((type)=>{
    if(type==='start'){
      // A bot commit schedules its next 220 ms action before MutationObserver
      // choreography begins. Cancel that already-scheduled timer immediately.
      // If p2 still owns the turn/choice, queue one re-arm for true post-cleanup idle.
      clearScheduledBot();
      if(opponentEligible())armBot('presentation_start');
      return;
    }

    if(type==='complete'||type==='cancel'||type==='error'){
      if(pending)release(type);
      if(botPending)releaseBot(type);
    }
  });

  window.GwentInteractionTurnGate={
    version:'10.4A.0',
    botSerialization:'11.F1.0',
    get pending(){return pending;},
    get pendingMs(){return pending?Math.max(0,performance.now()-pendingSince):0;},
    get botPending(){return botPending;},
    get botPendingMs(){return botPending?Math.max(0,performance.now()-botPendingSince):0;},
    get stats(){return {deferrals,releases,pending,botDeferrals,botReleases,botPending,deferredRearm};},
    release:()=>release('manual')
  };
})();

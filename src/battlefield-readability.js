(() => {
  'use strict';

  const api=window.__GWENT_PASS10__;
  const G=api?.engine;
  if(!api||!G){
    console.error('Pass 11.2A battlefield readability dependencies missing');
    return;
  }

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let scheduled=false;
  let refreshes=0;

  function cardContext(state,el){
    const iid=el?.dataset?.inspectBoard;
    if(!state||!iid)return null;
    const lane=el.closest?.('.lane[data-pid][data-row]');
    const pid=lane?.dataset?.pid;
    const row=lane?.dataset?.row;
    if(pid&&row){
      const inst=state.players?.[pid]?.board?.[row]?.find(c=>c.iid===iid);
      if(inst)return {pid,row,inst,def:G.CARD_DB?.[inst.cardId]||null};
    }
    for(const owner of ['p1','p2']){
      for(const r of G.ROWS){
        const inst=state.players?.[owner]?.board?.[r]?.find(c=>c.iid===iid);
        if(inst)return {pid:owner,row:r,inst,def:G.CARD_DB?.[inst.cardId]||null};
      }
    }
    return null;
  }

  function abilityLabel(def){
    const abilities=Array.isArray(def?.abilities)?def.abilities.filter(Boolean):[];
    return abilities.length?abilities.join(', '):'no special ability';
  }

  function enhanceUnit(state,el){
    const ctx=cardContext(state,el);
    if(!ctx?.def)return false;
    const power=G.helpers.effectiveCardPower(state,ctx.pid,ctx.row,ctx.inst);
    const base=Number(ctx.def.strength||0);
    const modified=power!==base;
    const direction=modified?(power>base?'up':'down'):'same';
    let score=$('.u-score',el);
    if(!score){
      score=document.createElement('span');
      el.appendChild(score);
    }
    score.className=`u-score ${modified?'modified-power':'base-power'}`;
    score.textContent=String(power);
    score.setAttribute('aria-hidden','true');
    el.dataset.currentPower=String(power);
    el.dataset.basePower=String(base);
    el.dataset.powerModified=modified?'true':'false';
    el.dataset.powerDirection=direction;
    el.classList.toggle('unit-power-modified',modified);
    const rowName=ctx.row==='close'?'close combat':ctx.row;
    const label=`${ctx.def.name}, current power ${power}, ${rowName} row, ${abilityLabel(ctx.def)}`;
    el.setAttribute('aria-label',label);
    el.title=label;
    return true;
  }

  function refresh(){
    scheduled=false;
    const state=api.getState?.();
    if(!state)return 0;
    let count=0;
    for(const el of $$('#match-screen .unit[data-inspect-board]')){
      if(enhanceUnit(state,el))count++;
    }
    refreshes++;
    return count;
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(refresh);
  }

  const match=$('#match-screen');
  if(match){
    const observer=new MutationObserver(schedule);
    observer.observe(match,{childList:true,subtree:true});
  }
  document.addEventListener('click',schedule,true);
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  schedule();

  window.GwentBattlefieldReadability={
    version:'11.2A.0',
    refresh,
    schedule,
    get refreshes(){return refreshes;}
  };
})();

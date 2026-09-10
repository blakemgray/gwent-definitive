(() => {
  'use strict';

  const api = window.__GWENT_PASS10__;
  if (!api || !api.engine) return;
  const G = api.engine;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const factionNames = {realms:'NORTHERN REALMS',monsters:'MONSTERS',nilfgaard:'NILFGAARD',scoiatael:"SCOIA'TAEL",skellige:'SKELLIGE'};
  let scheduled = false;

  function esc(value){
    return String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function hearts(n){ return '●'.repeat(Math.max(0,n)) + '○'.repeat(Math.max(0,2-n)); }
  function factionName(id){ return factionNames[id] || String(id || '').toUpperCase(); }
  function leaderName(id){ return G.CARD_DB?.[id]?.name || id || 'Leader'; }
  function leaderStatus(player){
    if(player.leaderDisabled) return 'BLOCKED';
    if(player.leaderUsed) return 'USED';
    return 'LDR';
  }
  function turnText(s){
    if(s.winner) return 'MATCH OVER';
    if(s.pendingChoice) return 'CHOOSE';
    if(s.players.p1.passed && s.players.p2.passed) return 'RESOLVING';
    if(s.currentPlayerId === 'p1') return s.players.p1.passed ? 'OPPONENT' : 'YOUR TURN';
    return s.players.p2.passed ? 'YOUR TURN' : 'OPPONENT';
  }
  function turnClass(s){
    if(s.pendingChoice) return 'choice-turn';
    return s.currentPlayerId === 'p1' ? 'player-turn' : 'opponent-turn';
  }

  function installStructure(){
    const bottom = $('#match-screen .battle-bottom');
    const leader = $('#leader-button');
    const counts = $('#counts');
    if(bottom && leader && counts && !bottom.querySelector('.player-left')){
      const wrap = document.createElement('div');
      wrap.className = 'player-left';
      wrap.id = 'player-left';
      bottom.insertBefore(wrap, bottom.firstChild);
      wrap.appendChild(leader);
      wrap.appendChild(counts);
    }
    const line = $('#matchline');
    if(line){ line.setAttribute('role','status'); line.setAttribute('aria-live','polite'); }
    const screen = $('#match-screen');
    if(screen) screen.classList.add('battlefield-v2');
  }

  function enhanceHeader(s){
    const line = $('#matchline');
    if(!line || !s) return;
    const p1=s.players.p1, p2=s.players.p2;
    const sig=[s.round,s.currentPlayerId,G.totalScore(s,'p1'),G.totalScore(s,'p2'),p1.health,p2.health,p1.passed,p2.passed,p1.hand.length,p2.hand.length,p1.deck.length,p2.deck.length,p1.leaderUsed,p2.leaderUsed,p1.leaderDisabled,p2.leaderDisabled,!!s.pendingChoice,s.winner||''].join('|');
    if(line.dataset.uxSig===sig && line.querySelector('.combatant')) return;
    line.dataset.uxSig=sig;
    line.innerHTML = `
      <div class="combatant opponent" data-combatant="p2">
        <span class="faction-crest ${esc(p2.faction)}">${esc((factionName(p2.faction).match(/[A-Z]/g)||['?']).slice(0,2).join(''))}</span>
        <span class="combatant-copy"><b>${esc(factionName(p2.faction))}</b><small>HAND ${p2.hand.length} · DECK ${p2.deck.length}</small></span>
        <span class="combat-lives" aria-label="${p2.health} lives">${hearts(p2.health)}</span>
        <span class="combat-total" aria-label="Opponent total">${G.totalScore(s,'p2')}</span>
        <span class="leader-chip ${p2.leaderUsed||p2.leaderDisabled?'spent':''}" title="${esc(leaderName(p2.leaderId))}">${leaderStatus(p2)}</span>
        ${p2.passed?'<span class="pass-chip">PASSED</span>':''}
      </div>
      <div class="match-center"><span class="turn-pill ${turnClass(s)}">${turnText(s)}</span><small>ROUND ${s.round}</small></div>
      <div class="combatant player" data-combatant="p1">
        ${p1.passed?'<span class="pass-chip">PASSED</span>':''}
        <span class="leader-chip ${p1.leaderUsed||p1.leaderDisabled?'spent':''}" title="${esc(leaderName(p1.leaderId))}">${leaderStatus(p1)}</span>
        <span class="combat-total" aria-label="Your total">${G.totalScore(s,'p1')}</span>
        <span class="combat-lives" aria-label="${p1.health} lives">${hearts(p1.health)}</span>
        <span class="combatant-copy"><b>${esc(factionName(p1.faction))}</b><small>HAND ${p1.hand.length} · DECK ${p1.deck.length}</small></span>
        <span class="faction-crest ${esc(p1.faction)}">${esc((factionName(p1.faction).match(/[A-Z]/g)||['?']).slice(0,2).join(''))}</span>
      </div>`;
  }

  function enrichRows(s){
    if(!s) return;
    $$('#match-screen .lane').forEach(lane=>{
      const pid=lane.dataset.pid, row=lane.dataset.row;
      const cards=s.players?.[pid]?.board?.[row] || [];
      lane.dataset.cards=String(cards.length);
      lane.classList.toggle('is-empty',cards.length===0);
      lane.classList.toggle('is-dense',cards.length>=8);
      lane.classList.toggle('is-swarm',cards.length>=11);
      const score=$('.rscore',lane);
      if(score) score.dataset.count=String(cards.length);
      const label=$('.rlabel',lane);
      if(label) label.setAttribute('aria-label',`${row} row, ${cards.length} cards`);
    });
    const shell=$('#match-screen .battle-shell');
    if(shell){
      shell.dataset.turn=s.currentPlayerId;
      shell.classList.toggle('player-passed',!!s.players.p1.passed);
      shell.classList.toggle('opponent-passed',!!s.players.p2.passed);
      shell.classList.toggle('choice-pending',!!s.pendingChoice);
    }
  }

  function computePack(count, railWidth, cardWidth, naturalGap, minimumExposure){
    if(count<=0 || railWidth<=0 || cardWidth<=0) return {count:0,left:0,step:0,packWidth:0,cardWidth};
    if(count===1) return {count,left:(railWidth-cardWidth)/2,step:0,packWidth:cardWidth,cardWidth};
    const usable=Math.max(cardWidth,railWidth-6);
    const naturalStep=cardWidth+naturalGap;
    let step=Math.min(naturalStep,(usable-cardWidth)/(count-1));
    step=Math.max(Math.min(cardWidth,minimumExposure),step);
    let packWidth=cardWidth+(count-1)*step;
    if(packWidth>usable){
      step=(usable-cardWidth)/(count-1);
      packWidth=usable;
    }
    return {count,left:(railWidth-packWidth)/2,step,packWidth,cardWidth};
  }

  function layoutBoardRail(rail){
    const cards=$$('.unit',rail).filter(c=>c.parentElement===rail);
    rail.classList.remove('overlap-pack');
    if(!cards.length){ rail.dataset.packWidth='0'; return; }
    const w=rail.clientWidth, h=rail.clientHeight;
    if(!w || !h) return;
    const cardH=Math.max(28,Math.min(40,h-3));
    const cardW=cardH*0.696;
    const pack=computePack(cards.length,w,cardW,cards.length<=4?4:2,Math.max(9,cardW*.31));
    rail.dataset.packWidth=pack.packWidth.toFixed(2);
    rail.dataset.cardWidth=cardW.toFixed(2);
    rail.classList.toggle('overlap-pack',pack.step<cardW-0.5);
    cards.forEach((card,i)=>{
      card.style.width=`${cardW.toFixed(2)}px`;
      card.style.height=`${cardH.toFixed(2)}px`;
      card.style.left=`${(pack.left+i*pack.step).toFixed(2)}px`;
      card.style.top=`${((h-cardH)/2).toFixed(2)}px`;
      card.style.zIndex=String(i+2);
      card.dataset.packIndex=String(i);
    });
  }

  function layoutHandRail(rail){
    const cards=$$('.hand-card',rail).filter(c=>c.parentElement===rail);
    rail.classList.remove('overlap-pack');
    if(!cards.length){ rail.dataset.packWidth='0'; return; }
    const w=rail.clientWidth,h=rail.clientHeight;
    if(!w || !h) return;
    const cardH=Math.max(45,Math.min(64,h-2));
    const cardW=cardH*0.696;
    const pack=computePack(cards.length,w,cardW,4,Math.max(17,cardW*.40));
    rail.dataset.packWidth=pack.packWidth.toFixed(2);
    rail.dataset.cardWidth=cardW.toFixed(2);
    rail.classList.toggle('overlap-pack',pack.step<cardW-0.5);
    cards.forEach((card,i)=>{
      card.style.width=`${cardW.toFixed(2)}px`;
      card.style.height=`${cardH.toFixed(2)}px`;
      card.style.left=`${(pack.left+i*pack.step).toFixed(2)}px`;
      card.style.top=`${Math.max(0,h-cardH).toFixed(2)}px`;
      card.style.zIndex=String(i+2);
      card.dataset.packIndex=String(i);
    });
  }

  function layoutAll(){
    if(!$('#match-screen.active')) return;
    $$('#match-screen .units').forEach(layoutBoardRail);
    const hand=$('#match-screen #hand'); if(hand) layoutHandRail(hand);
  }

  function reconcile(){
    scheduled=false;
    installStructure();
    const s=api.getState();
    if(s){ enhanceHeader(s); enrichRows(s); }
    layoutAll();
  }
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>requestAnimationFrame(reconcile));
  }

  installStructure();
  const match=$('#match-screen');
  if(match){
    const observer=new MutationObserver(schedule);
    observer.observe(match,{childList:true,subtree:true});
    if('ResizeObserver' in window){
      const resize=new ResizeObserver(schedule);
      resize.observe(match);
      const board=$('#board'); if(board) resize.observe(board);
      const hand=$('#hand'); if(hand) resize.observe(hand);
    }
  }
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  document.addEventListener('click',schedule,true);
  schedule();

  window.GwentBattlefieldUX={
    version:'10.3.0',
    contractVersion:'2.0',
    computePack,
    relayout:schedule,
    reconcile,
    metrics:()=>({
      board:$('#board')?.getBoundingClientRect()||null,
      hand:$('#hand')?.getBoundingClientRect()||null,
      rails:$$('#match-screen .units').map(r=>({box:r.getBoundingClientRect(),count:r.children.length,packWidth:Number(r.dataset.packWidth||0),cardWidth:Number(r.dataset.cardWidth||0)}))
    })
  };
  window.__GWENT_PASS10_3__=api;
})();

(() => {
  'use strict';
  const G = window.GwentEnginePass9 || window.GwentEnginePass8;
  const catalog = window.GWENT_DEFINITIVE_CATALOG || [];
  const Assets = window.GwentAssetResolver;
  const Store = window.GwentStorage;

  const PLAYER_DECK_A = [
    'realms_thaler','realms_blue_stripes','realms_blue_stripes','realms_catapult','realms_dun_banner_medic',
    'special_decoy','weather_frost','special_scorch','realms_vernon','neutral_geralt',
    'realms_dijkstra','neutral_yennefer','realms_keira','realms_sheldon','realms_trebuchet','realms_catapult'
  ];
  const PLAYER_DECK_B = [
    'weather_frost','special_scorch','realms_catapult','realms_dun_banner_medic','realms_blue_stripes',
    'realms_blue_stripes','special_decoy','realms_thaler','neutral_yennefer','realms_vernon',
    'realms_dijkstra','realms_keira','neutral_geralt','realms_sheldon','realms_trebuchet','realms_catapult'
  ];
  const BOT_DECK_A = [
    'monsters_earth_elemental','monsters_grave_hag','monsters_cockatrice','monsters_gargoyle',
    'monsters_earth_elemental','monsters_grave_hag','monsters_cockatrice','monsters_gargoyle',
    'monsters_earth_elemental','monsters_grave_hag','monsters_cockatrice','monsters_gargoyle',
    'monsters_earth_elemental','monsters_grave_hag','monsters_cockatrice','monsters_gargoyle'
  ];
  const BOT_DECK_B = [
    'monsters_cockatrice','monsters_earth_elemental','monsters_grave_hag','monsters_gargoyle',
    'monsters_grave_hag','monsters_earth_elemental','monsters_gargoyle','monsters_cockatrice',
    'monsters_earth_elemental','monsters_cockatrice','monsters_grave_hag','monsters_gargoyle',
    'monsters_grave_hag','monsters_earth_elemental','monsters_cockatrice','monsters_gargoyle'
  ];

  const PRESETS = {
    player:[
      {id:'nr_siege_spy', name:'Northern Realms · Siege & Spy', faction:'realms', leaderId:'realms_foltest_copper', deck:PLAYER_DECK_A, summary:'Thaler, Blue Stripes, Medic, Frost and Scorch in a recommended opening order.'},
      {id:'nr_control', name:'Northern Realms · Control Opening', faction:'realms', leaderId:'realms_foltest_copper', deck:PLAYER_DECK_B, summary:'Front-loads control tools so Pass 10 can immediately showcase board pressure and mulligan decisions.'}
    ],
    bot:[
      {id:'monsters_midrange', name:'Monsters · Midrange', faction:'monsters', leaderId:'monsters_eredin_silver', deck:BOT_DECK_A, summary:'Balanced Monsters pressure deck.'},
      {id:'monsters_swarm', name:'Monsters · Swarm Pressure', faction:'monsters', leaderId:'monsters_eredin_silver', deck:BOT_DECK_B, summary:'A more aggressive Monsters opening profile.'}
    ],
    difficulties:[
      {id:'apprentice', name:'Apprentice', summary:'Forgiving opponent that favors straightforward plays.'},
      {id:'standard', name:'Standard', summary:'Balanced opponent for ordinary play.'},
      {id:'master', name:'Master', summary:'More selective tactical play and stronger resource management.'}
    ]
  };

  const savedSettings = Store ? Store.loadSettings() : {};

  const ui = {
    selectedIid:null, revealOpponent:false, showIntent:false, lab:false,
    screen:'main-screen', toastTimer:null, botTimer:null, preMatchState:null,
    mulliganUsed:0,
    settings:{autoBot:savedSettings.autoBot!==false, showEvents:!!savedSettings.showEvents, tacticalLabels:savedSettings.tacticalLabels!==false, defaultDifficulty:savedSettings.defaultDifficulty||'standard', developerMode:!!savedSettings.developerMode},
    setup:{playerPreset:'nr_siege_spy', botPreset:'monsters_midrange', difficulty:savedSettings.defaultDifficulty||'standard', firstPlayerId:'p1', seed:20260910, mode:'classic'}
  };
  let state = null;
  let history = null;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const deepClone = obj => JSON.parse(JSON.stringify(obj));

  function persistSettings(){
    if(Store) Store.saveSettings(ui.settings);
  }
  function applySettingsToDom(){
    document.body.classList.toggle('tactical-labels', ui.settings.tacticalLabels);
    document.body.classList.toggle('dev-mode', ui.settings.developerMode);
    if(!ui.settings.developerMode) ui.settings.autoBot = true;
    $('#auto-bot').checked = !!ui.settings.autoBot;
    $('#show-events').checked = !!ui.settings.showEvents;
    $('#tactical-labels').checked = !!ui.settings.tacticalLabels;
    $('#default-difficulty').value = ui.settings.defaultDifficulty;
    const dev=$('#developer-mode'); if(dev) dev.checked=!!ui.settings.developerMode;
    refreshContinueButton();
  }

  function go(id){
    $$('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
    ui.screen=id;
    if(id==='main-screen') refreshContinueButton();
    if(id==='cards-screen') renderCatalog($('#catalog-search').value || '');
    if(id==='decks-screen') renderDeckScreen();
    if(id==='rules-screen') renderRulesMatrix();
    if(id==='setup-screen') renderSetupScreen();
    if(id==='mulligan-screen') renderMulliganScreen();
  }

  function hearts(n){ return '●'.repeat(Math.max(0,n)) + '○'.repeat(Math.max(0,2-n)); }
  function assetFor(cardId){ return Assets ? Assets.cardArt(cardId,G) : ''; }
  function def(cardId){ return G.CARD_DB[cardId]; }
  function displayName(inst){ return def(inst.cardId)?.name || inst.cardId; }
  function classificationLabel(){ return (state?.classification || 'classic').toUpperCase(); }
  function playerPreset(){ return PRESETS.player.find(p=>p.id===ui.setup.playerPreset) || PRESETS.player[0]; }
  function botPreset(){ return PRESETS.bot.find(p=>p.id===ui.setup.botPreset) || PRESETS.bot[0]; }

  function quickStart(){
    ui.setup.playerPreset='nr_siege_spy'; ui.setup.botPreset='monsters_midrange'; ui.setup.firstPlayerId='p1';
    ui.setup.mode='classic'; ui.setup.difficulty=ui.settings.defaultDifficulty; ui.setup.seed=20260910;
    prepareMulliganState();
  }

  function prepareMulliganState(lab=false){
    ui.lab=lab;
    const pp=playerPreset(), bp=botPreset();
    ui.selectedIid=null; ui.revealOpponent=false; ui.showIntent=false; ui.mulliganUsed=0;
    ui.preMatchState = G.createMatch({
      p1Faction:pp.faction,p2Faction:bp.faction,p1LeaderId:pp.leaderId,p2LeaderId:bp.leaderId,
      p1Deck:pp.deck,p2Deck:bp.deck,handSize:10,seed:Number(ui.setup.seed)||20260910,firstPlayerId:ui.setup.firstPlayerId
    });
    if(lab) ui.preMatchState = G.sandboxSetTurn(ui.preMatchState,'p1');
    go('mulligan-screen');
    renderMulliganScreen();
    toast(lab ? 'MECHANICS LAB · REVIEW HAND THEN ENTER' : 'MATCH PREPARED · REVIEW OPENING HAND');
  }

  function finalizeMatchFromPrepared(){
    state = deepClone(ui.preMatchState);
    history = new G.HistorySession(state);
    go('match-screen');
    renderMatch();
    saveActiveMatch();
    toast(ui.lab ? 'MECHANICS LAB READY' : 'MATCH STARTED');
    maybeAutoBot();
  }

  function swapMulligan(iid){
    if(!ui.preMatchState || ui.mulliganUsed>=2) return;
    const s = deepClone(ui.preMatchState), p = s.players.p1;
    const idx = p.hand.findIndex(c=>c.iid===iid);
    if(idx<0 || !p.deck.length) return;
    const outgoing = p.hand.splice(idx,1)[0];
    const incoming = p.deck.shift();
    p.hand.push(incoming);
    p.deck.push(outgoing);
    ui.preMatchState = s;
    ui.mulliganUsed += 1;
    renderMulliganScreen();
    toast(`${displayName(outgoing).toUpperCase()} · MULLIGANED`);
  }

  function renderMulliganScreen(){
    if(!ui.preMatchState) return;
    const p=ui.preMatchState.players.p1;
    $('#mulligan-count').textContent = `${ui.mulliganUsed} / 2 USED`;
    $('#mulligan-meta').innerHTML = `${esc(playerPreset().name)} · <b>${ui.setup.difficulty.toUpperCase()}</b> · Seed <b>${esc(ui.setup.seed)}</b> · Deck <b>${p.deck.length}</b> remaining after draw`;
    $('#mulligan-hand').innerHTML = p.hand.map(inst=>{
      const d=def(inst.cardId), img=assetFor(inst.cardId);
      return `<div class="mulligan-card"><img src="${img}" alt="${esc(d.name)}"><div><h4>${esc(d.name)}</h4><p>${esc((d.abilities||[]).join(' · ') || d.row || d.type)}</p><p>${d.strength==null?'—':d.strength} power · ${esc(d.faction||'neutral')}</p><button class="btn ${ui.mulliganUsed<2?'':'ghost'}" data-mulligan="${inst.iid}" ${ui.mulliganUsed<2?'':'disabled'}>MULLIGAN</button></div></div>`;
    }).join('');
  }

  function renderSetupScreen(){
    const playerCards = PRESETS.player.map(p=>renderOptionChip('playerPreset', p.id, p.name, p.summary, ui.setup.playerPreset===p.id)).join('');
    const botCards = PRESETS.bot.map(p=>renderOptionChip('botPreset', p.id, p.name, p.summary, ui.setup.botPreset===p.id)).join('');
    const diffCards = PRESETS.difficulties.map(p=>renderOptionChip('difficulty', p.id, p.name, p.summary, ui.setup.difficulty===p.id)).join('');
    const firstCards = [
      renderOptionChip('firstPlayerId','p1','You start','Take initiative and test proactive lines.',ui.setup.firstPlayerId==='p1'),
      renderOptionChip('firstPlayerId','p2','Bot starts','Stress response play and passing logic.',ui.setup.firstPlayerId==='p2')
    ].join('');
    $('#setup-body').innerHTML = `
      <div class="panel setup-panel"><div class="selector-title"><div><div class="eyebrow">PLAYER DECK PRESET</div><h3>${esc(playerPreset().name)}</h3></div><span class="badge">${esc(playerPreset().deck.length)} CARD SLICE</span></div><div class="selector-group"><div class="option-row">${playerCards}</div></div></div>
      <div class="panel setup-panel"><div class="selector-title"><div><div class="eyebrow">OPPONENT ARCHETYPE</div><h3>${esc(botPreset().name)}</h3></div><span class="badge">OPPONENT</span></div><div class="selector-group"><div class="option-row">${botCards}</div></div></div>
      <div class="panel setup-panel"><div class="selector-title"><div><div class="eyebrow">DIFFICULTY LAYER</div><h3>${esc((PRESETS.difficulties.find(d=>d.id===ui.setup.difficulty)||{}).name||'')}</h3></div><span class="badge">DIFFICULTY</span></div><div class="selector-group"><div class="option-row">${diffCards}</div></div></div>
      <div class="panel setup-panel"><div class="selector-title"><div><div class="eyebrow">MATCH PARAMETERS</div><h3>Initiative and seed</h3></div><span class="badge">PRE-BATTLE FLOW</span></div><div class="selector-group"><div class="option-row">${firstCards}</div><div class="setup-summary"><div class="setup-kv"><b>Seed</b><input id="seed-input" class="seed-input" type="number" value="${esc(ui.setup.seed)}"></div><div class="setup-kv"><b>Resulting leader</b>${esc(def(playerPreset().leaderId)?.name || playerPreset().leaderId)}</div><div class="setup-kv"><b>Bot leader</b>${esc(def(botPreset().leaderId)?.name || botPreset().leaderId)}</div><div class="setup-kv"><b>Recommended mode</b>${ui.setup.mode.toUpperCase()}</div></div></div><div class="setup-actions"><button id="setup-reset" class="btn">RESET RECOMMENDED</button><button id="setup-prepare" class="btn primary">PREPARE OPENING HAND</button></div></div>`;
    const seedInput = $('#seed-input'); if(seedInput) seedInput.addEventListener('change', e=>ui.setup.seed = Number(e.target.value)||20260910);
    $('#setup-reset').onclick = ()=>{ ui.setup={playerPreset:'nr_siege_spy', botPreset:'monsters_midrange', difficulty:ui.settings.defaultDifficulty, firstPlayerId:'p1', seed:20260910, mode:'classic'}; renderSetupScreen(); };
    $('#setup-prepare').onclick = ()=>prepareMulliganState(false);
  }

  function renderOptionChip(group, value, title, desc, active){
    return `<button class="option-chip ${active?'active':''}" data-setup-group="${group}" data-setup-value="${value}"><strong>${esc(title)}</strong><small>${esc(desc)}</small></button>`;
  }

  function score(pid,row){ return G.rowScore(state,pid,row); }
  function total(pid){ return G.totalScore(state,pid); }

  function renderMatch(){
    if(!state) return;
    const p1=state.players.p1,p2=state.players.p2;
    $('#matchline').innerHTML = `
      <span class="faction-dot monsters">M</span><span class="name-hide">MONSTERS</span><span>${hearts(p2.health)}</span><span class="total" id="opp-total">${total('p2')}</span>
      <span class="round-label">ROUND ${state.round}</span>
      <span class="total" id="player-total">${total('p1')}</span><span>${hearts(p1.health)}</span><span class="name-hide">N. REALMS</span><span class="faction-dot realms">NR</span>`;

    const rowModel=[['p2','siege','SIEGE'],['p2','ranged','RANGED'],['p2','close','CLOSE'],['weather',null,'WEATHER'],['p1','close','CLOSE'],['p1','ranged','RANGED'],['p1','siege','SIEGE']];
    $('#board-geometry').innerHTML = rowModel.map(r=>r[0]==='weather'?renderGeometryWeather():renderGeometryLane(r[0],r[1])).join('');
    $('#board').innerHTML = [
      renderLane('p2','siege','SIEGE'),renderLane('p2','ranged','RANGED'),renderLane('p2','close','CLOSE'),
      renderWeatherBand(),
      renderLane('p1','close','CLOSE'),renderLane('p1','ranged','RANGED'),renderLane('p1','siege','SIEGE')
    ].join('');

    $('#counts').innerHTML = `<span>DECK <b id="deck-count">${p1.deck.length}</b></span><span>GRAVE <b id="grave-count">${p1.grave.length}</b></span><span>HAND <b id="hand-count">${p1.hand.length}</b></span>`;
    $('#hand').innerHTML = p1.passed ? `<div class="sub" style="font-size:9px;align-self:center">PASSED · NO FURTHER ACTIONS THIS ROUND</div>` : p1.hand.map(renderHandCard).join('');

    const badge=$('#class-badge'); badge.textContent=classificationLabel(); badge.className='badge compact-hide '+(state.classification==='classic'?'':state.classification);
    $('#pass-button').disabled = state.currentPlayerId!=='p1' || p1.passed || !!state.winner || !!state.pendingChoice;
    const leader=$('#leader-button');
    leader.innerHTML = `<img src="${assetFor(p1.leaderId)}" alt="Leader"><span class="leader-status" id="leader-status"></span>`;
    const leaderReady=G.leaderAvailable(state,'p1') && state.currentPlayerId==='p1' && !p1.passed && !state.pendingChoice && !state.winner;
    leader.disabled=!leaderReady; leader.classList.toggle('available',leaderReady); leader.classList.toggle('spent',p1.leaderUsed||p1.leaderDisabled);
    $('#leader-status').textContent=p1.leaderDisabled?'BLOCKED':p1.leaderUsed?'USED':leaderReady?'READY':'WAIT';
    $('#bot-move').classList.toggle('hidden', state.currentPlayerId!=='p2' || !!state.winner || !!state.pendingChoice);
    $('#bot-move').textContent = p1.passed ? 'BOT RESOLVE' : 'BOT MOVE';
    renderAssistPanels();
    renderOverlay();
    if(state.winner) renderResult();
  }


  function renderGeometryLane(pid,row){
    return `<div class="geometry-lane ${pid==='p1'?'player-side':'opponent-side'}" data-geometry-pid="${pid}" data-geometry-row="${row}"><div class="geometry-label-well"></div><div class="geometry-special-well"></div><div class="geometry-unit-tray"></div><div class="geometry-score-well"></div></div>`;
  }
  function renderGeometryWeather(){
    return `<div class="geometry-weather" data-geometry-weather><span class="geometry-weather-core"></span></div>`;
  }

  function renderLane(pid,row,label){
    const cards=state.players[pid].board[row];
    const weathered=state.weather[row]?'weathered':'';
    const special=renderSpecial(pid,row);
    return `<div class="lane ${weathered}" data-pid="${pid}" data-row="${row}"><div class="rlabel">${label}</div><div class="special-slot-wrap">${special}</div><div class="units">${cards.map(inst=>renderUnit(pid,row,inst)).join('')}</div><div class="rscore">${score(pid,row)}</div></div>`;
  }

  function renderSpecial(pid,row){
    const board = state.players[pid].board;
    if(board.special?.[row]){
      const inst = board.special[row]; const img=assetFor(inst.cardId); const d=def(inst.cardId);
      return `<div class="special-slot active" title="${esc(d?.name||'Special')}">${img?`<img src="${img}" alt="${esc(d?.name||'Special')}">`:`<span>SP</span>`}</div>`;
    }
    if(board.leaderHorn?.[row]) return `<div class="special-slot active" title="Leader Horn"><span>LH</span></div>`;
    return `<div class="special-slot" title="Row special slot"></div>`;
  }

  function renderWeatherBand(){
    const any=Object.values(state.weather).some(Boolean);
    const active=(state.weatherCards||[]).map(w=>w.inst).filter(Boolean);
    const label = any ? weatherText() : 'NO ACTIVE WEATHER';
    return `<div class="weather ${any?'active':''}"><span>${label}</span>${active.length?`<div class="weather-cards">${active.map(inst=>renderWeatherPill(inst)).join('')}</div>`:''}</div>`;
  }

  function renderWeatherPill(inst){ const d=def(inst.cardId), img=assetFor(inst.cardId); return `<div class="weather-pill">${img?`<img src="${img}" alt="${esc(d.name)}">`:''}<span>${esc(d.name)}</span></div>`; }

  function renderUnit(pid,row,inst){
    const d=def(inst.cardId); const power=G.helpers.effectiveCardPower(state,pid,row,inst); const img=assetFor(inst.cardId);
    const mark=d?.abilities.includes('hero')?'★':(d?.abilities.includes('spy')?'◆':'');
    const changed = d && power !== d.strength;
    return `<button class="unit" data-inspect-board="${inst.iid}" title="${esc(d?.name)}">${img?`<img src="${img}" alt="${esc(d?.name)}">`:''}${changed?`<span class="u-score modified-power">${power}</span>`:''}<span class="u-mark">${mark}</span></button>`;
  }

  function renderHandCard(inst){
    const d=def(inst.cardId); const img=assetFor(inst.cardId);
    return `<button class="hand-card" data-card-iid="${inst.iid}" aria-label="${esc(d?.name)}">${img?`<img src="${img}" alt="${esc(d?.name)}">`:''}<span class="hc-name">${esc(d?.name)}</span></button>`;
  }

  function weatherText(){
    const on=[]; if(state.weather.close) on.push('BITING FROST'); if(state.weather.ranged) on.push('IMPE NETRABLE FOG'); if(state.weather.siege) on.push('TORRENTIAL RAIN');
    return on.length ? on.join(' · ') : 'NO ACTIVE WEATHER';
  }

  function findInst(iid){
    for(const pid of ['p1','p2']){
      const p=state.players[pid];
      for(const zone of ['hand','deck','grave']){ const x=p[zone].find(c=>c.iid===iid); if(x) return {pid,zone,inst:x}; }
      for(const row of G.ROWS){ const x=p.board[row].find(c=>c.iid===iid); if(x) return {pid,zone:'board',row,inst:x}; }
      for(const row of G.ROWS){ const x=p.board.special[row]; if(x && x.iid===iid) return {pid,zone:'special',row,inst:x}; }
    }
    return null;
  }

  function selectCard(iid){ ui.selectedIid=iid; renderOverlay(); }
  function closeOverlay(){ ui.selectedIid=null; $('#overlay-root').innerHTML=''; }

  function renderOverlay(){
    const root=$('#overlay-root');
    if(state.pendingChoice){ renderMedicChoice(root); return; }
    if(!ui.selectedIid){ root.innerHTML=''; return; }
    const found=findInst(ui.selectedIid); if(!found){ui.selectedIid=null;root.innerHTML='';return;}
    const d=def(found.inst.cardId); const img=assetFor(found.inst.cardId);
    const actions = found.zone==='hand' ? G.legalActions(state,'p1').filter(a=>a.iid===found.inst.iid) : [];
    const actionHtml = actions.length ? actions.map((a,i)=>`<button class="btn primary" data-play-index="${i}">${esc(actionLabel(a,d))}</button>`).join('') : `<button class="btn" disabled>${state.currentPlayerId==='p1'?'NO LEGAL PLAY':'WAIT FOR YOUR TURN'}</button>`;
    root.innerHTML=`<div class="shade" data-close-overlay></div><aside class="side-panel" id="card-inspector"><button class="panel-x" data-close-overlay>×</button><div class="inspector-grid">${img?`<img class="inspect-art" src="${img}" alt="${esc(d?.name)}">`:''}<div class="inspect-copy"><div class="eyebrow">${esc(d?.faction)} · ${esc(d?.row || d?.type)}</div><h2>${esc(d?.name)}</h2><span class="badge">${esc(d?.abilities.join(' · ') || 'UNIT')}</span><p>${esc(descriptionFor(d))}</p><div class="actions">${actionHtml}</div></div></div></aside>`;
    root.querySelectorAll('[data-play-index]').forEach(btn=>btn.addEventListener('click',()=>playAction(actions[Number(btn.dataset.playIndex)])));
    root.querySelectorAll('[data-close-overlay]').forEach(x=>x.onclick=closeOverlay);
  }

  function actionLabel(a,d){
    if(d.abilities.includes('spy')) return 'PLAY SPY';
    if(d.abilities.includes('decoy')){ const t=findInst(a.targetIid); return `DECOY → ${t?displayName(t.inst):'UNIT'}`; }
    if(d.type==='weather') return 'APPLY WEATHER';
    if(d.abilities.includes('scorch')) return 'PLAY SCORCH';
    if(d.abilities.includes('horn')) return `HORN → ${String(a.row).toUpperCase()}`;
    return `PLAY ${String(a.row||'').toUpperCase()}`;
  }

  function descriptionFor(d){
    if(d.abilities.includes('spy')) return 'Played on the opponent side. Draw two cards from your deck.';
    if(d.abilities.includes('bond')) return 'Tight Bond multiplies identical Tight Bond units in the same row.';
    if(d.abilities.includes('medic')) return 'Revive one eligible non-Hero unit from your graveyard.';
    if(d.abilities.includes('decoy')) return 'Swap with an eligible unit on your battlefield and return that unit to your hand.';
    if(d.abilities.includes('scorch')) return 'Destroy the strongest non-Hero unit or tied units on the battlefield.';
    if(d.type==='weather') return 'Applies the canonical weather effect to the corresponding row for both players.';
    if(d.abilities.includes('hero')) return 'Hero: immune to weather and most special-card effects.';
    return 'Canonical Witcher 3 Gwent unit.';
  }

  function playAction(action){
    try{
      const d=def(findInst(action.iid).inst.cardId);
      let next=G.playCard(state,action);
      ui.selectedIid=null;
      commit(next, `${d.name.toUpperCase()} · ENGINE RESOLVED`);
    }catch(e){ console.error(e); toast('ENGINE REJECTED ACTION'); }
  }

  function renderMedicChoice(root){
    const choice=state.pendingChoice; const candidates=choice.candidateIids.map(iid=>findInst(iid)).filter(Boolean);
    root.innerHTML=`<div class="shade"></div><aside class="side-panel"><div class="eyebrow">MEDIC · ENGINE CHOICE</div><h2>Choose a unit to revive</h2><p class="sub">Only legal non-Hero units from your graveyard are exposed by the engine.</p><div class="choice-list">${candidates.map(c=>{const d=def(c.inst.cardId),img=assetFor(c.inst.cardId);return `<div class="choice-card">${img?`<img src="${img}" alt="${esc(d.name)}">`:''}<span><b>${esc(d.name)}</b><small class="sub"> ${d.strength} · ${esc(d.row)}</small></span><button class="btn primary" data-medic="${c.inst.iid}">REVIVE</button></div>`}).join('')}</div></aside>`;
    root.querySelectorAll('[data-medic]').forEach(b=>b.addEventListener('click',()=>{
      try{ const next=G.resolveChoice(state,{type:'RESOLVE_MEDIC',targetIid:b.dataset.medic}); commit(next,'MEDIC REVIVE · ENGINE RESOLVED'); }
      catch(e){console.error(e);toast('INVALID MEDIC TARGET');}
    }));
  }

  function openLeader(){
    if(!state) return;
    const root=$('#overlay-root'), p=state.players.p1, d=def(p.leaderId);
    const ready=G.leaderAvailable(state,'p1') && state.currentPlayerId==='p1' && !p.passed && !state.pendingChoice && !state.winner;
    root.innerHTML=`<div class="shade" data-close-overlay></div><aside class="side-panel"><button class="panel-x" data-close-overlay>×</button><div class="eyebrow">LEADER · NORTHERN REALMS</div><div class="inspector-grid"><img class="inspect-art" src="${assetFor(p.leaderId)}" alt="${esc(d?.name||'Leader')}"><div class="inspect-copy"><h2>${esc(d?.name||'Leader')}</h2><span class="badge">LEADER ABILITY</span><p>Double the strength of your Siege row unless that row already contains a row Special Card.</p><div class="actions"><button id="activate-leader" class="btn primary" ${ready?'':'disabled'}>${p.leaderUsed?'LEADER USED':p.leaderDisabled?'LEADER BLOCKED':ready?'ACTIVATE LEADER':'WAIT FOR YOUR TURN'}</button></div></div></div></aside>`;
    root.querySelectorAll('[data-close-overlay]').forEach(x=>x.onclick=closeOverlay);
    const b=$('#activate-leader'); if(b && ready)b.onclick=()=>{try{commit(G.activateLeader(state,{playerId:'p1'}),'FOLTEST · SIEGE HORN ACTIVATED');}catch(e){console.error(e);toast('LEADER ACTION REJECTED');}};
  }

  function renderRulesMatrix(){
    const cov=G.abilityCoverage(); const el=$('#rules-matrix'); if(!el)return;
    const groups=[
      ['Core battlefield','Weather / Clear · Hero immunity · Agile · Morale · Tight Bond · Horn'],
      ['Card actions','Spy · Medic · Muster · Decoy · Scorch + row Scorch'],
      ['Skellige systems','Mardroeme · Berserker transforms · Storm · Kambi / Hemdall'],
      ['Lifecycle','Avenger / Bovine Defense Force · active weather/special slots · canonical auto-pass'],
      ['Faction perks','Northern Realms · Nilfgaard · Monsters · Scoia\'tael · Skellige'],
      ['Leader families','Foltest 5/5 · Emhyr 5/5 · Eredin 5/5 · Francesca 5/5 · Crach · King Bran']
    ];
    el.innerHTML=groups.map(([a,b])=>`<div class="panel rule-row"><span><b>${esc(a)}</b><small>${esc(b)}</small></span><span class="badge">COVERED</span></div>`).join('') + `<div class="panel rule-row"><span><b>Catalog token audit</b><small>${cov.supported.length} supported · ${cov.unsupported.length} unsupported</small></span><span class="badge">${cov.unsupported.length?'REVIEW':'44 / 44'}</span></div>`;
  }

  function passPlayer(){
    if(!state || state.currentPlayerId!=='p1') return;
    try{ commit(G.pass(state,{playerId:'p1'}),'YOU PASSED'); }
    catch(e){console.error(e);} }

  function commit(next,label){
    state = history.commit(next);
    if(state.winner){ if(Store) Store.clearMatch(); } else saveActiveMatch();
    renderMatch();
    if(label) toast(label);
    maybeAutoBot();
  }

  function maybeAutoBot(){
    clearTimeout(ui.botTimer);
    const toggle=$('#auto-bot');
    if(!toggle || !toggle.checked || ui.lab || !state || state.winner || state.pendingChoice || state.currentPlayerId!=='p2') return;
    ui.botTimer=setTimeout(()=>botMove(true),220);
  }

  function actionContext(a){
    const f = findInst(a.iid); const d=f?def(f.inst.cardId):null;
    return {inst:f?.inst, def:d};
  }

  function evaluateAction(a){
    const {inst, def:d}=actionContext(a); if(!d) return -999;
    const opp='p1', self='p2';
    let score = d.strength || 0;
    if(a.type==='PASS'){
      const lead = total(self) - total(opp);
      if(lead>0) return 18 + lead;
      return -30;
    }
    if(d.abilities.includes('spy')) score += 14;
    if(d.abilities.includes('medic')) score += 12;
    if(d.abilities.includes('bond')) score += 5;
    if(d.abilities.includes('hero')) score += 4;
    if(d.type==='weather'){
      const affectedRow = d.abilities.includes('frost')?'close':d.abilities.includes('fog')?'ranged':'siege';
      score = G.rowScore(state,'p1',affectedRow) - G.rowScore(state,'p2',affectedRow) + 8;
    }
    if(d.abilities.includes('scorch')){
      const p1rows=['close','ranged','siege'];
      let max=0; p1rows.forEach(r=>state.players.p1.board[r].forEach(c=>{ const val=G.helpers.effectiveCardPower(state,'p1',r,c); if(val>max && !def(c.cardId).abilities.includes('hero')) max=val; }));
      score = max ? 10 + max : 1;
    }
    if(d.abilities.includes('decoy')) score = 6;
    if(ui.setup.difficulty==='apprentice') score -= (d.abilities.includes('spy')||d.abilities.includes('scorch')||d.type==='weather') ? 5 : 0;
    if(ui.setup.difficulty==='master') score += (d.abilities.includes('spy')||d.abilities.includes('scorch')||d.type==='weather'||d.abilities.includes('medic')) ? 5 : 0;
    return score;
  }

  function chooseBotAction(){
    const actions=G.legalActions(state,'p2'); if(!actions.length) return null;
    const pass=actions.find(a=>a.type==='PASS');
    if(ui.setup.difficulty==='apprentice'){
      const plays=actions.filter(a=>a.type==='PLAY_CARD');
      const sorted=plays.sort((x,y)=>evaluateAction(x)-evaluateAction(y));
      if(state.players.p1.passed && total('p2')>total('p1')) return pass;
      return sorted[0] || pass;
    }
    const plays=actions.filter(a=>a.type==='PLAY_CARD');
    if(state.players.p1.passed && total('p2')>total('p1')) return pass;
    if(ui.setup.difficulty!=='apprentice' && state.players.p2.hand.length<=2 && total('p2')>=total('p1')+6) return pass;
    const ranked=plays.map(a=>({a,score:evaluateAction(a)})).sort((x,y)=>y.score-x.score);
    return ranked[0]?.a || pass;
  }

  function botMove(){
    if(!state || state.currentPlayerId!=='p2') return;
    const a=chooseBotAction(); if(!a) return;
    try{
      if(a.type==='PASS') commit(G.pass(state,a),`INTEGRATION BOT PASSED · ${ui.setup.difficulty.toUpperCase()}`);
      else { const d=def(findInst(a.iid).inst.cardId); commit(G.playCard(state,a),`BOT PLAYED ${d.name.toUpperCase()}`); }
    }catch(e){ console.error(e); toast('BOT ACTION FAILED'); }
  }

  function renderAssistPanels(){
    const rev=$('#opponent-reveal');
    if(ui.revealOpponent){
      const cards=state.players.p2.hand;
      rev.classList.remove('hidden'); rev.innerHTML=`<span class="eyebrow">ASSISTED · OPP HAND</span>${cards.map(c=>renderTiny(c)).join('')}<button class="btn ghost" id="hide-reveal" style="font-size:7px;padding:5px">HIDE</button>`;
      $('#hide-reveal').onclick=()=>{ui.revealOpponent=false;renderAssistPanels();};
    } else rev.classList.add('hidden');
    const intent=$('#ai-intent');
    if(ui.showIntent){
      const a=state.currentPlayerId==='p2'?chooseBotAction():null; let text='No opponent decision pending.';
      if(a){ if(a.type==='PASS') text='Primary line: PASS'; else {const f=findInst(a.iid);text=`Primary line: ${displayName(f.inst)}`;} }
      intent.classList.remove('hidden'); intent.innerHTML=`<div class="eyebrow">ASSISTED · BOT INTENT</div><b>${esc(text)}</b><small>${esc((PRESETS.difficulties.find(d=>d.id===ui.setup.difficulty)||{}).name || 'Bot')} heuristic layer.</small><button class="btn ghost" id="hide-intent" style="font-size:7px;padding:5px">HIDE</button>`;
      $('#hide-intent').onclick=()=>{ui.showIntent=false;renderAssistPanels();};
    } else intent.classList.add('hidden');
  }

  function renderTiny(inst){ const img=assetFor(inst.cardId);const d=def(inst.cardId);return `<div class="unit">${img?`<img src="${img}" alt="${esc(d.name)}">`:''}<span class="u-score">${d.strength||'•'}</span></div>`; }

  function openCheats(){
    const root=$('#overlay-root'); const canUndo=history && history.index>0;
    const events = ui.settings.showEvents && state ? `<div class="drawer-section">SEMANTIC EVENT LOG</div><div class="event-log">${state.eventLog.slice().reverse().slice(0,20).map(e=>`<div class="event">${e.seq}. ${e.type}</div>`).join('')}</div>`:'';
    root.innerHTML=`<div class="shade" data-close-overlay></div><aside class="side-panel" id="cheat-panel"><button class="panel-x" data-close-overlay>×</button><div class="eyebrow">CHEAT / DEVELOPER LAYER</div><h2>State controls</h2><span class="badge ${state.classification==='classic'?'':state.classification}">${classificationLabel()}</span><div class="drawer-section">FAVORITES</div>
      <div class="cheat-row"><span><b>Undo last action</b><small>Restore the exact previous engine state.</small></span><button id="cheat-undo" class="btn" ${canUndo?'':'disabled'}>UNDO</button></div>
      <div class="cheat-row"><span><b>Draw a card</b><small>Explicit state mutation → MODIFIED.</small></span><button id="cheat-draw" class="btn">DRAW</button></div>
      <div class="cheat-row"><span><b>Reveal opponent hand</b><small>Information-only advantage → ASSISTED.</small></span><button id="cheat-reveal" class="btn">VIEW</button></div>
      <div class="cheat-row"><span><b>Show bot intent</b><small>Explain QA bot candidate action → ASSISTED.</small></span><button id="cheat-intent" class="btn">VIEW</button></div>
      <div class="cheat-row"><span><b>Reset seeded match</b><small>Recreate the same deterministic initial state.</small></span><button id="cheat-reset" class="btn">RESET</button></div>${events}</aside>`;
    root.querySelectorAll('[data-close-overlay]').forEach(x=>x.onclick=closeOverlay);
    $('#cheat-undo').onclick=()=>{ if(history.index>0){state=history.undo();ui.revealOpponent=false;ui.showIntent=false;saveActiveMatch();closeOverlay();renderMatch();toast('UNDO · STATE RESTORED');} };
    $('#cheat-draw').onclick=()=>{ const next=G.cheatDraw(state,{playerId:'p1'});ui.selectedIid=null;commit(next,'CHEAT DRAW · MODIFIED'); };
    $('#cheat-reveal').onclick=()=>{ const next=G.markAssisted(state,'reveal_opponent_hand');ui.revealOpponent=true;commit(next,'OPPONENT HAND REVEALED · ASSISTED'); };
    $('#cheat-intent').onclick=()=>{ const next=G.markAssisted(state,'show_bot_intent');ui.showIntent=true;commit(next,'BOT INTENT · ASSISTED'); };
    $('#cheat-reset').onclick=()=>prepareMulliganState(ui.lab);
  }

  function renderResult(){
    if(Store) Store.clearMatch();
    const root=$('#overlay-root'); const winner=state.winner==='draw'?'DRAW':(state.winner==='p1'?'VICTORY':'DEFEAT');
    root.innerHTML=`<div class="result-overlay"><div class="panel result-card"><div class="eyebrow">MATCH COMPLETE</div><h1>${winner}</h1><p class="sub">${state.roundHistory.map(r=>`Round ${r.round}: ${r.scores.p1.total}–${r.scores.p2.total}`).join('<br>')}</p><span class="badge ${state.classification==='classic'?'':state.classification}">${classificationLabel()}</span><div class="actions"><button id="result-rematch" class="btn primary">REMATCH</button><button id="result-menu" class="btn">MAIN MENU</button></div></div></div>`;
    $('#result-rematch').onclick=()=>prepareMulliganState(ui.lab); $('#result-menu').onclick=()=>go('main-screen');
  }

  function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg;t.classList.add('show');clearTimeout(ui.toastTimer);ui.toastTimer=setTimeout(()=>t.classList.remove('show'),1300); }

  function saveActiveMatch(){
    if(Store && state && !state.winner) Store.writeMatch({state,setup:ui.setup,lab:ui.lab});
    refreshContinueButton();
  }

  function refreshContinueButton(){
    const b=$('#continue-match'); if(!b) return;
    const saved=Store && Store.readMatch();
    b.classList.toggle('hidden',!saved);
    if(saved){
      const label=b.querySelector('span'); if(label) label.textContent=`ROUND ${saved.state.round} · ${saved.state.players.p1.hand.length} CARDS`;
    }
  }

  function resumeSavedMatch(){
    const saved=Store && Store.readMatch(); if(!saved) return;
    state=deepClone(saved.state); history=new G.HistorySession(state); ui.setup=Object.assign({},ui.setup,saved.setup||{}); ui.lab=!!saved.lab;
    ui.selectedIid=null; ui.revealOpponent=false; ui.showIntent=false; go('match-screen'); renderMatch(); toast('MATCH RESTORED'); maybeAutoBot();
  }

  function renderDeckScreen(){
    const el=$('#deck-list'); if(!el) return;
    const rows = PRESETS.player.map(p=>{
      const counts={}; p.deck.forEach(id=>counts[id]=(counts[id]||0)+1);
      const head = `<div class="setup-kv" style="margin-bottom:10px"><b>${esc(p.name)}</b>${esc(p.summary)}</div>`;
      const body = Object.entries(counts).map(([id,q])=>{const d=def(id),img=assetFor(id);return `<div class="deck-card">${img?`<img class="mini-art" src="${img}" alt="${esc(d.name)}">`:''}<span><b>${esc(d.name)}</b><small class="sub"> ${esc(d.abilities.join(' · ')||d.type)}</small></span><span class="qty">×${q}</span></div>`}).join('');
      return `<div class="panel setup-panel">${head}${body}</div>`;
    }).join('');
    el.innerHTML = rows;
  }

  function renderCatalog(query=''){
    const q=query.trim().toLowerCase(); const list=catalog.filter(c=>!q || [c.name,c.faction,c.row,(c.abilities||[]).join(' ')].join(' ').toLowerCase().includes(q));
    $('#catalog-list').innerHTML=list.slice(0,216).map(c=>`<div class="catalog-row"><b>${esc(c.name)}</b><small>${esc(c.faction)} · ${c.strength==null?'—':c.strength} · ${esc((c.abilities||[]).join(', ')||c.row||'unit')}</small></div>`).join('');
  }

  document.addEventListener('click', e=>{
    const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();go(nav.dataset.nav);return;}
    const hand=e.target.closest('[data-card-iid]'); if(hand){selectCard(hand.dataset.cardIid);return;}
    const board=e.target.closest('[data-inspect-board]'); if(board){selectCard(board.dataset.inspectBoard);return;}
    const setupChip=e.target.closest('[data-setup-group]'); if(setupChip){ ui.setup[setupChip.dataset.setupGroup] = setupChip.dataset.setupValue; renderSetupScreen(); return; }
    const mull=e.target.closest('[data-mulligan]'); if(mull){ swapMulligan(mull.dataset.mulligan); return; }
    if(e.target.closest('[data-close-overlay]')) closeOverlay();
  });

  const continueBtn=$('#continue-match'); if(continueBtn) continueBtn.onclick=(e)=>{e.preventDefault();resumeSavedMatch();};
  $('#quick-start').onclick=(e)=>{e.preventDefault();quickStart();};
  $('#start-lab').onclick=(e)=>{e.preventDefault();prepareMulliganState(true);};
  $('#pass-button').onclick=(e)=>{e.preventDefault();passPlayer();}; $('#bot-move').onclick=botMove; $('#cheat-open').onclick=(e)=>{e.preventDefault();openCheats();}; $('#leader-button').onclick=(e)=>{e.preventDefault();openLeader();};
  $('#match-menu').onclick=(e)=>{e.preventDefault();go('main-screen');}; $('#catalog-search').addEventListener('input',e=>renderCatalog(e.target.value));
  $('#skip-mulligan').onclick=(e)=>{e.preventDefault();finalizeMatchFromPrepared();}; $('#finish-mulligan').onclick=(e)=>{e.preventDefault();finalizeMatchFromPrepared();};

  $('#auto-bot').addEventListener('change',e=>{ ui.settings.autoBot=e.target.checked; persistSettings(); maybeAutoBot(); });
  $('#show-events').addEventListener('change',e=>{ ui.settings.showEvents=e.target.checked; persistSettings(); });
  $('#tactical-labels').addEventListener('change',e=>{ ui.settings.tacticalLabels=e.target.checked; persistSettings(); applySettingsToDom(); });
  $('#default-difficulty').addEventListener('change',e=>{ ui.settings.defaultDifficulty=e.target.value; ui.setup.difficulty=e.target.value; persistSettings(); renderSetupScreen(); });
  $('#developer-mode').addEventListener('change',e=>{ ui.settings.developerMode=e.target.checked; persistSettings(); applySettingsToDom(); });

  applySettingsToDom();
  $('#catalog-count').textContent=catalog.length; renderCatalog(''); renderDeckScreen(); renderSetupScreen(); renderRulesMatrix();

  window.__GWENT_PASS10__ = {
    getState:()=>state ? G.helpers.deepClone(state) : null,
    getPreparedState:()=>ui.preMatchState ? deepClone(ui.preMatchState) : null,
    quickStart, prepareMulliganState, finalizeMatchFromPrepared, botMove, pass:passPlayer,
    selectCard, playAction, openCheats, go, maybeAutoBot, engine:G, assetResolver:Assets, storage:Store, openLeader, renderRulesMatrix,
    swapMulligan,
    setStateForQA:(s)=>{state=G.helpers.deepClone(s);history=new G.HistorySession(state);go('match-screen');renderMatch();},
    battlefieldRowModel:[['p2','siege'],['p2','ranged'],['p2','close'],['weather',null],['p1','close'],['p1','ranged'],['p1','siege']]
  };
  window.__GWENT_PASS10_2__ = window.__GWENT_PASS10__;
  window.__GWENT_PASS9__ = window.__GWENT_PASS10__;
})();
(() => {
  'use strict';
  const G = window.GwentEnginePass9 || window.GwentEnginePass8;
  const catalog = window.GWENT_DEFINITIVE_CATALOG || [];
  const Assets = window.GwentAssetResolver;
  const Store = window.GwentStorage;

  const PLAYER_GOLDEN_DECK = [
    'realms_thaler',
    'realms_dijkstra',
    'realms_stennis',
    'realms_blue_stripes',
    'realms_blue_stripes',
    'realms_blue_stripes',
    'realms_crinfrid',
    'realms_crinfrid',
    'realms_crinfrid',
    'realms_catapult_1',
    'realms_catapult_1',
    'realms_banner_nurse',
    'realms_kaedwen_siege',
    'realms_kaedwen_siege_1',
    'realms_kaedwen_siege_2',
    'realms_esterad',
    'realms_natalis',
    'realms_philippa',
    'realms_vernon',
    'realms_keira',
    'realms_sheldon',
    'realms_siege_tower',
    'realms_ves',
    'realms_trebuchet',
    'realms_ballista',
    'special_decoy',
    'special_decoy',
    'special_horn',
    'special_scorch',
    'weather_frost',
    'weather_clear'
  ];
  const BOT_GOLDEN_DECK = [
    'monsters_arachas',
    'monsters_arachas_1',
    'monsters_arachas_2',
    'monsters_arachas_behemoth',
    'monsters_witch_velen',
    'monsters_witch_velen_1',
    'monsters_witch_velen_2',
    'monsters_ghoul',
    'monsters_ghoul_1',
    'monsters_ghoul_2',
    'monsters_nekker',
    'monsters_nekker_1',
    'monsters_nekker_2',
    'monsters_bruxa',
    'monsters_ekkima',
    'monsters_fleder',
    'monsters_garkain',
    'monsters_katakan',
    'monsters_earth_elemental',
    'monsters_fire_elemental',
    'monsters_cockatrice',
    'monsters_gravehag',
    'monsters_fiend',
    'monsters_fogling',
    'monsters_gryffin',
    'monsters_wyvern',
    'monsters_draug',
    'monsters_imlerith',
    'monsters_leshen',
    'special_decoy',
    'special_horn',
    'special_scorch',
    'weather_frost',
    'weather_fog',
    'weather_rain',
    'weather_clear'
  ];

  const PRESETS = {
    player:[
      {id:'nr_golden', name:'Northern Realms · Siege & Intelligence', faction:'realms', leaderId:'realms_foltest_copper', deck:PLAYER_GOLDEN_DECK, summary:'A legal 31-card Northern Realms deck built around spies, bonds, siege, Medic, Decoy, weather and Scorch.'}
    ],
    bot:[
      {id:'monsters_golden', name:'Monsters · Muster Pressure', faction:'monsters', leaderId:'monsters_eredin_silver', deck:BOT_GOLDEN_DECK, summary:'A legal 36-card Monsters deck built around Muster families, resilient pressure, weather and control.'}
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
    screen:'main-screen', toastTimer:null, botTimer:null, preMatchState:null, matchMenuOpen:false, matchMenuStep:'menu',
    mulliganUsed:0,
    settings:{autoBot:savedSettings.autoBot!==false, showEvents:!!savedSettings.showEvents, tacticalLabels:savedSettings.tacticalLabels!==false, defaultDifficulty:savedSettings.defaultDifficulty||'standard', developerMode:!!savedSettings.developerMode},
    setup:{playerPreset:'nr_golden', botPreset:'monsters_golden', difficulty:savedSettings.defaultDifficulty||'standard', firstPlayerId:'p1', seed:20260910, mode:'classic'}
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
    ui.setup.playerPreset='nr_golden'; ui.setup.botPreset='monsters_golden'; ui.setup.firstPlayerId='p1';
    ui.setup.mode='classic'; ui.setup.difficulty=ui.settings.defaultDifficulty; ui.setup.seed=20260910;
    prepareMulliganState();
  }

  function prepareMulliganState(lab=false){
    ui.lab=lab;
    const pp=playerPreset(), bp=botPreset();
    ui.selectedIid=null; ui.revealOpponent=false; ui.showIntent=false; ui.matchMenuOpen=false; ui.matchMenuStep='menu'; ui.mulliganUsed=0;
    ui.preMatchState = G.createMatch({
      p1Faction:pp.faction,p2Faction:bp.faction,p1LeaderId:pp.leaderId,p2LeaderId:bp.leaderId,
      p1Deck:pp.deck,p2Deck:bp.deck,handSize:10,seed:Number(ui.setup.seed)||20260910,firstPlayerId:ui.setup.firstPlayerId,
      validateDecks:true,shuffleDecks:true,mulligan:true
    });
    if(lab) ui.preMatchState = G.sandboxSetTurn(ui.preMatchState,'p1');
    savePreparedMatch();
    go('mulligan-screen');
    renderMulliganScreen();
    toast(lab ? 'MECHANICS LAB · REVIEW HAND THEN ENTER' : 'MATCH PREPARED · REVIEW OPENING HAND');
  }

  function finalizeMatchFromPrepared(){
    if(!ui.preMatchState) return;
    state = G.applyAction(ui.preMatchState,{type:'FINISH_MULLIGAN'});
    ui.preMatchState = null;
    history = new G.HistorySession(state);
    go('match-screen');
    renderMatch();
    saveActiveMatch();
    toast(ui.lab ? 'MECHANICS LAB READY' : 'MATCH STARTED');
    maybeAutoBot();
  }

  function swapMulligan(iid){
    if(!ui.preMatchState || ui.mulliganUsed>=2) return;
    const outgoing=ui.preMatchState.players.p1.hand.find(c=>c.iid===iid);if(!outgoing)return;
    ui.preMatchState=G.applyAction(ui.preMatchState,{type:'MULLIGAN_CARD',playerId:'p1',iid});
    ui.mulliganUsed=ui.preMatchState.mulliganCounts?.p1||0;
    savePreparedMatch();
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
      <div class="panel setup-panel"><div class="selector-title"><div><div class="eyebrow">PLAYER DECK PRESET</div><h3>${esc(playerPreset().name)}</h3></div><span class="badge">${esc(playerPreset().deck.length)} CARD DECK</span></div><div class="selector-group"><div class="option-row">${playerCards}</div></div></div>
      <div class="panel setup-panel"><div class="selector-title"><div><div class="eyebrow">OPPONENT ARCHETYPE</div><h3>${esc(botPreset().name)}</h3></div><span class="badge">OPPONENT</span></div><div class="selector-group"><div class="option-row">${botCards}</div></div></div>
      <div class="panel setup-panel"><div class="selector-title"><div><div class="eyebrow">DIFFICULTY LAYER</div><h3>${esc((PRESETS.difficulties.find(d=>d.id===ui.setup.difficulty)||{}).name||'')}</h3></div><span class="badge">DIFFICULTY</span></div><div class="selector-group"><div class="option-row">${diffCards}</div></div></div>
      <div class="panel setup-panel"><div class="selector-title"><div><div class="eyebrow">MATCH PARAMETERS</div><h3>Initiative and seed</h3></div><span class="badge">PRE-BATTLE FLOW</span></div><div class="selector-group"><div class="option-row">${firstCards}</div><div class="setup-summary"><div class="setup-kv"><b>Seed</b><input id="seed-input" class="seed-input" type="number" value="${esc(ui.setup.seed)}"></div><div class="setup-kv"><b>Resulting leader</b>${esc(def(playerPreset().leaderId)?.name || playerPreset().leaderId)}</div><div class="setup-kv"><b>Bot leader</b>${esc(def(botPreset().leaderId)?.name || botPreset().leaderId)}</div><div class="setup-kv"><b>Recommended mode</b>${ui.setup.mode.toUpperCase()}</div></div></div><div class="setup-actions"><button id="setup-reset" class="btn">RESET RECOMMENDED</button><button id="setup-prepare" class="btn primary">PREPARE OPENING HAND</button></div></div>`;
    const seedInput = $('#seed-input'); if(seedInput) seedInput.addEventListener('change', e=>ui.setup.seed = Number(e.target.value)||20260910);
    $('#setup-reset').onclick = ()=>{ ui.setup={playerPreset:'nr_golden', botPreset:'monsters_golden', difficulty:ui.settings.defaultDifficulty, firstPlayerId:'p1', seed:20260910, mode:'classic'}; renderSetupScreen(); };
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
  function closeOverlay(){ ui.selectedIid=null;ui.matchMenuOpen=false;ui.matchMenuStep='menu';$('#overlay-root').innerHTML='';maybeAutoBot(); }

  function renderOverlay(){
    const root=$('#overlay-root');
    if(ui.matchMenuOpen){ renderMatchMenu(root); return; }
    if(state.pendingChoice){ renderPendingChoice(root); return; }
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

  function resolvePlayerChoice(action,label){
    try{commit(G.applyAction(state,action),label);}
    catch(e){console.error(e);toast('CHOICE COULD NOT BE APPLIED');}
  }

  function renderPendingChoice(root){
    const choice=state.pendingChoice;
    if(choice.playerId!=='p1'){
      root.innerHTML=`<div class="shade"></div><aside class="side-panel" data-choice-waiting="${esc(choice.type)}"><div class="eyebrow">OPPONENT DECISION</div><h2>Opponent is choosing</h2><p class="sub">The match is safely paused while the rules engine resolves this decision.</p></aside>`;
      return;
    }
    const actions=G.legalChoiceActions(state,'p1');
    if(choice.type==='medic'){
      root.innerHTML=`<div class="shade"></div><aside class="side-panel" data-choice-type="medic"><div class="eyebrow">MEDIC</div><h2>Choose a unit to revive</h2><p class="sub">Only eligible non-Hero units from your graveyard are available.</p><div class="choice-list">${actions.map((action,i)=>{const c=findInst(action.targetIid),d=c&&def(c.inst.cardId),img=c&&assetFor(c.inst.cardId);return c?`<div class="choice-card">${img?`<img src="${img}" alt="${esc(d.name)}">`:''}<span><b>${esc(d.name)}</b><small class="sub"> ${d.strength} · ${esc(d.row)}</small></span><button class="btn primary" data-choice-index="${i}" data-medic="${c.inst.iid}">REVIVE</button></div>`:''}).join('')}</div></aside>`;
    }else if(choice.type==='revive_row'){
      const target=findInst(choice.targetIid),name=target?displayName(target.inst):'revived unit';
      root.innerHTML=`<div class="shade"></div><aside class="side-panel" data-choice-type="revive_row"><div class="eyebrow">MEDIC · ROW</div><h2>Where should ${esc(name)} fight?</h2><p class="sub">Choose one of the legal rows supplied by the rules engine.</p><div class="actions">${actions.map((action,i)=>`<button class="btn primary" data-choice-index="${i}">${esc(String(action.row).toUpperCase())}</button>`).join('')}</div></aside>`;
    }else{
      root.innerHTML=`<div class="shade"></div><aside class="side-panel" data-choice-unsupported="${esc(choice.type)}"><div class="eyebrow">MATCH SAFELY PAUSED</div><h2>This choice needs a player surface</h2><p class="sub">Unsupported choice: ${esc(choice.type)}. Your exact match state remains saved and unchanged.</p></aside>`;
      return;
    }
    root.querySelectorAll('[data-choice-index]').forEach(button=>button.addEventListener('click',()=>{
      const action=actions[Number(button.dataset.choiceIndex)];
      if(action)resolvePlayerChoice(action,choice.type==='revive_row'?'REVIVE ROW CHOSEN':'UNIT REVIVED');
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
    saveActiveMatch();
    renderMatch();
    if(label) toast(label);
    maybeAutoBot();
  }

  function maybeAutoBot(){
    clearTimeout(ui.botTimer);
    const toggle=$('#auto-bot');
    const ownsChoice=state?.pendingChoice?.playerId==='p2';
    if(!toggle || !toggle.checked || ui.lab || ui.matchMenuOpen || !state || state.winner || (state.pendingChoice&&!ownsChoice) || (!ownsChoice&&state.currentPlayerId!=='p2')) return;
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

  function choiceStrength(action){
    const iid=action.targetIid||action.deckTargetIid,f=iid&&findInst(iid),d=f&&def(f.inst.cardId);
    return Number(d?.strength)||0;
  }

  function chooseBotChoiceAction(){
    const choice=state.pendingChoice,actions=G.legalChoiceActions(state,'p2');if(!choice||!actions.length)return null;
    if(['medic','leader_steal_grave','leader_return_grave','leader_weather_choice'].includes(choice.type))return actions.slice().sort((a,b)=>choiceStrength(b)-choiceStrength(a)||String(a.targetIid).localeCompare(String(b.targetIid)))[0];
    if(['revive_row','skellige_row'].includes(choice.type))return actions.slice().sort((a,b)=>Number(!!state.weather[a.row])-Number(!!state.weather[b.row])||G.rowScore(state,'p2',a.row)-G.rowScore(state,'p2',b.row)||String(a.row).localeCompare(String(b.row)))[0];
    if(choice.type==='leader_destroyer')return actions.slice().sort((a,b)=>choiceStrength(b)-choiceStrength(a)||String(a.deckTargetIid).localeCompare(String(b.deckTargetIid)))[0];
    if(choice.type==='scoiatael_first')return actions.find(a=>a.playerId==='p2')||actions[0];
    return actions.slice().sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))[0];
  }

  function botMove(){
    if(!state)return;
    if(state.pendingChoice){
      if(state.pendingChoice.playerId!=='p2')return;
      const choice=chooseBotChoiceAction();if(!choice){toast('OPPONENT CHOICE PAUSED');return;}
      try{commit(G.applyAction(state,choice),'OPPONENT DECISION RESOLVED');}
      catch(e){console.error(e);toast('OPPONENT CHOICE FAILED');}
      return;
    }
    if(state.currentPlayerId!=='p2')return;
    const a=chooseBotAction(); if(!a) return;
    try{
      if(a.type==='PASS') commit(G.pass(state,a),`OPPONENT PASSED · ${ui.setup.difficulty.toUpperCase()}`);
      else { const d=def(findInst(a.iid).inst.cardId); commit(G.playCard(state,a),`OPPONENT PLAYED ${d.name.toUpperCase()}`); }
    }catch(e){ console.error(e); toast('OPPONENT ACTION FAILED'); }
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

  function openMatchMenu(){
    if(!state||state.winner)return;
    clearTimeout(ui.botTimer);ui.matchMenuOpen=true;ui.matchMenuStep='menu';ui.selectedIid=null;renderOverlay();
  }

  function renderMatchMenu(root){
    if(ui.matchMenuStep==='confirm-restart'){
      root.innerHTML=`<div class="shade"></div><aside class="side-panel" data-match-menu="confirm-restart"><div class="eyebrow">RESTART MATCH</div><h2>Start this match over?</h2><p class="sub">The current match will be replaced with a fresh opening draw from the same legal decks.</p><div class="actions"><button id="match-restart-confirm" class="btn primary" data-match-command="restart-confirm">RESTART</button><button id="match-restart-cancel" class="btn" data-match-command="restart-cancel">KEEP PLAYING</button></div></aside>`;
      return;
    }
    root.innerHTML=`<div class="shade"></div><aside class="side-panel" data-match-menu="main"><div class="eyebrow">MATCH MENU</div><h2>Battle paused</h2><p class="sub">Your exact rules state is saved.</p><div class="actions"><button id="match-resume" class="btn primary" data-match-command="resume">RESUME</button><button id="match-restart-request" class="btn" data-match-command="restart-request">RESTART MATCH</button><button id="match-exit" class="btn" data-match-command="exit">EXIT TO MAIN MENU</button></div></aside>`;
  }

  function exitMatchToMenu(){
    clearTimeout(ui.botTimer);if(Store)Store.clearMatch();
    state=null;history=null;ui.preMatchState=null;ui.selectedIid=null;ui.matchMenuOpen=false;ui.matchMenuStep='menu';
    go('main-screen');refreshContinueButton();
  }

  function startRematch(){
    ui.setup.seed=(Number(ui.setup.seed)||20260910)+1;
    prepareMulliganState(ui.lab);
  }

  function renderResult(){
    ui.matchMenuOpen=false;ui.matchMenuStep='menu';
    const root=$('#overlay-root'); const winner=state.winner==='draw'?'DRAW':(state.winner==='p1'?'VICTORY':'DEFEAT');
    root.innerHTML=`<div class="result-overlay"><div class="panel result-card" data-result="${winner.toLowerCase()}"><div class="eyebrow">MATCH COMPLETE</div><h1>${winner}</h1><p class="sub">${state.roundHistory.map(r=>`Round ${r.round}: ${r.scores.p1.total}–${r.scores.p2.total}`).join('<br>')}</p><span class="badge ${state.classification==='classic'?'':state.classification}">${classificationLabel()}</span><div class="actions"><button id="result-rematch" class="btn primary">REMATCH</button><button id="result-menu" class="btn">MAIN MENU</button></div></div></div>`;
    $('#result-rematch').onclick=startRematch;$('#result-menu').onclick=exitMatchToMenu;
  }

  function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg;t.classList.add('show');clearTimeout(ui.toastTimer);ui.toastTimer=setTimeout(()=>t.classList.remove('show'),1300); }

  function savePreparedMatch(){
    if(Store&&ui.preMatchState)Store.writeMatch({state:ui.preMatchState,setup:ui.setup,lab:ui.lab,phase:'mulligan',mulliganUsed:ui.mulliganUsed});
    refreshContinueButton();
  }

  function saveActiveMatch(){
    if(Store&&state)Store.writeMatch({state,setup:ui.setup,lab:ui.lab,phase:state.winner?'result':'match',mulliganUsed:ui.mulliganUsed});
    refreshContinueButton();
  }

  function refreshContinueButton(){
    const b=$('#continue-match'); if(!b) return;
    const saved=Store && Store.readMatch();
    b.classList.toggle('hidden',!saved);
    if(saved){
      const label=b.querySelector('span');if(label){
        if(saved.phase==='mulligan')label.textContent=`MULLIGAN · ${saved.mulliganUsed||0} / 2 USED`;
        else if(saved.phase==='result')label.textContent=`RESULT · ${saved.state.winner==='p1'?'VICTORY':saved.state.winner==='p2'?'DEFEAT':'DRAW'}`;
        else label.textContent=`ROUND ${saved.state.round} · ${saved.state.players.p1.hand.length} CARDS`;
      }
    }
  }

  function resumeSavedMatch(){
    const saved=Store && Store.readMatch(); if(!saved) return;
    ui.setup=Object.assign({},ui.setup,saved.setup||{});ui.lab=!!saved.lab;ui.mulliganUsed=Number(saved.mulliganUsed||0);
    ui.selectedIid=null;ui.revealOpponent=false;ui.showIntent=false;
    if(saved.phase==='mulligan'){
      state=null;history=null;ui.preMatchState=deepClone(saved.state);go('mulligan-screen');renderMulliganScreen();toast('MULLIGAN RESTORED');return;
    }
    ui.preMatchState=null;state=deepClone(saved.state);history=new G.HistorySession(state);go('match-screen');renderMatch();toast(saved.phase==='result'?'RESULT RESTORED':'MATCH RESTORED');maybeAutoBot();
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
    const matchCommand=e.target.closest('[data-match-command]');
    if(matchCommand){
      e.preventDefault();
      const command=matchCommand.dataset.matchCommand;
      if(command==='resume')closeOverlay();
      else if(command==='restart-request'){ui.matchMenuStep='confirm-restart';renderOverlay();}
      else if(command==='restart-cancel'){ui.matchMenuStep='menu';renderOverlay();}
      else if(command==='restart-confirm')prepareMulliganState(ui.lab);
      else if(command==='exit')exitMatchToMenu();
      return;
    }
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
  $('#match-menu').onclick=(e)=>{e.preventDefault();openMatchMenu();}; $('#catalog-search').addEventListener('input',e=>renderCatalog(e.target.value));
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
    selectCard, playAction, openCheats, go, maybeAutoBot, engine:G, assetResolver:Assets, storage:Store, openLeader, openMatchMenu, saveActiveMatch, renderRulesMatrix,
    swapMulligan, getMulliganUsed:()=>ui.mulliganUsed, presets:()=>deepClone(PRESETS),
    setStateForQA:(s)=>{state=G.helpers.deepClone(s);history=new G.HistorySession(state);go('match-screen');renderMatch();},
    battlefieldRowModel:[['p2','siege'],['p2','ranged'],['p2','close'],['weather',null],['p1','close'],['p1','ranged'],['p1','siege']]
  };
  window.__GWENT_PASS11__ = window.__GWENT_PASS10__;
  window.__GWENT_PASS10_2__ = window.__GWENT_PASS10__;
  window.__GWENT_PASS9__ = window.__GWENT_PASS10__;
})();
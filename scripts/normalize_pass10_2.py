from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
chunks=root/'.deploy'/'chunks'

def join(prefix,dest):
    parts=sorted(chunks.glob(prefix+'.*.part'))
    if not parts: raise SystemExit(f'No chunks for {prefix}')
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(''.join(p.read_text() for p in parts))

join('app.js',root/'app.js')
join('styles.css',root/'styles.css')
join('cards-catalog.js',root/'src'/'cards-catalog.js')
join('gwent-engine.js',root/'src'/'gwent-engine.js')

p=root/'app.js'; s=p.read_text()
s=s.replace("  const G = window.GwentEnginePass9 || window.GwentEnginePass8;\n  const catalog = window.GWENT_DEFINITIVE_CATALOG || [];\n\n", "  const G = window.GwentEnginePass9 || window.GwentEnginePass8;\n  const catalog = window.GWENT_DEFINITIVE_CATALOG || [];\n  const Assets = window.GwentAssetResolver;\n  const Store = window.GwentStorage;\n\n")
s=re.sub(r"\n  const ASSET = \{.*?\n  \};\n\n", "\n", s, count=1, flags=re.S)
s=re.sub(r"  const STORAGE_KEY = 'gwent-definitive-pass10-settings';\n  const savedSettings = \(\(\)=>\{ try\{return JSON.parse\(localStorage.getItem\(STORAGE_KEY\)\|\|'\{\}'\);\}catch\{return \{\};\}\}\)\(\);", "  const savedSettings = Store ? Store.loadSettings() : {};", s)
s=s.replace("settings:{autoBot:!!savedSettings.autoBot, showEvents:!!savedSettings.showEvents, tacticalLabels:savedSettings.tacticalLabels!==false, defaultDifficulty:savedSettings.defaultDifficulty||'standard'},", "settings:{autoBot:savedSettings.autoBot!==false, showEvents:!!savedSettings.showEvents, tacticalLabels:savedSettings.tacticalLabels!==false, defaultDifficulty:savedSettings.defaultDifficulty||'standard', developerMode:!!savedSettings.developerMode},")
s=s.replace("  function persistSettings(){\n    localStorage.setItem(STORAGE_KEY, JSON.stringify(ui.settings));\n  }", "  function persistSettings(){\n    if(Store) Store.saveSettings(ui.settings);\n  }")
s=s.replace("    document.body.classList.toggle('tactical-labels', ui.settings.tacticalLabels);\n    $('#auto-bot').checked = !!ui.settings.autoBot;", "    document.body.classList.toggle('tactical-labels', ui.settings.tacticalLabels);\n    document.body.classList.toggle('dev-mode', ui.settings.developerMode);\n    if(!ui.settings.developerMode) ui.settings.autoBot = true;\n    $('#auto-bot').checked = !!ui.settings.autoBot;")
s=s.replace("    $('#default-difficulty').value = ui.settings.defaultDifficulty;", "    $('#default-difficulty').value = ui.settings.defaultDifficulty;\n    const dev=$('#developer-mode'); if(dev) dev.checked=!!ui.settings.developerMode;\n    refreshContinueButton();")
s=s.replace("    ui.screen=id;", "    ui.screen=id;\n    if(id==='main-screen') refreshContinueButton();")
s=s.replace("  function assetFor(cardId){ return ASSET[cardId] || ''; }", "  function assetFor(cardId){ return Assets ? Assets.cardArt(cardId,G) : ''; }")
s=s.replace("Stable pressure deck for the Integration Bot.","Balanced Monsters pressure deck.")
s=s.replace("Slightly faster pressure profile for difficulty testing.","A more aggressive Monsters opening profile.")
s=s.replace("Plays simple lines and conserves little.","Forgiving opponent that favors straightforward plays.")
s=s.replace("Balanced QA heuristic for normal integration testing.","Balanced opponent for ordinary play.")
s=s.replace("Higher-value tactical preferences for weather, Spy, Scorch and passing.","More selective tactical play and stronger resource management.")
s=s.replace("<span class=\"badge\">INTEGRATION BOT</span>","<span class=\"badge\">OPPONENT</span>")
s=s.replace("<span class=\"badge\">HEURISTIC</span>","<span class=\"badge\">DIFFICULTY</span>")
s=s.replace("    renderMatch();\n    toast(ui.lab ? 'MECHANICS LAB READY' : 'MATCH STARTED');", "    renderMatch();\n    saveActiveMatch();\n    toast(ui.lab ? 'MECHANICS LAB READY' : 'MATCH STARTED');")
s=s.replace("    state = history.commit(next);\n    renderMatch();", "    state = history.commit(next);\n    if(state.winner){ if(Store) Store.clearMatch(); } else saveActiveMatch();\n    renderMatch();")
s=s.replace("  function renderResult(){\n    const root=$('#overlay-root');", "  function renderResult(){\n    if(Store) Store.clearMatch();\n    const root=$('#overlay-root');")
s=s.replace("state=history.undo();ui.revealOpponent=false;ui.showIntent=false;closeOverlay();renderMatch();toast('UNDO · STATE RESTORED');", "state=history.undo();ui.revealOpponent=false;ui.showIntent=false;saveActiveMatch();closeOverlay();renderMatch();toast('UNDO · STATE RESTORED');")
anchor="  function renderDeckScreen(){"
insert="""  function saveActiveMatch(){
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

"""
s=s.replace(anchor,insert+anchor)
listener="  $('#default-difficulty').addEventListener('change',e=>{ ui.settings.defaultDifficulty=e.target.value; ui.setup.difficulty=e.target.value; persistSettings(); renderSetupScreen(); });"
s=s.replace(listener,listener+"\n  $('#developer-mode').addEventListener('change',e=>{ ui.settings.developerMode=e.target.checked; persistSettings(); applySettingsToDom(); });")
s=s.replace("  $('#quick-start').onclick=(e)=>{e.preventDefault();quickStart();};", "  const continueBtn=$('#continue-match'); if(continueBtn) continueBtn.onclick=(e)=>{e.preventDefault();resumeSavedMatch();};\n  $('#quick-start').onclick=(e)=>{e.preventDefault();quickStart();};")
s=s.replace("engine:G, assetMap:ASSET, openLeader", "engine:G, assetResolver:Assets, storage:Store, openLeader")
s=s.replace("  window.__GWENT_PASS9__ = window.__GWENT_PASS10__;", "  window.__GWENT_PASS10_2__ = window.__GWENT_PASS10__;\n  window.__GWENT_PASS9__ = window.__GWENT_PASS10__;")
p.write_text(s)

p=root/'index.html'; s=p.read_text()
s=s.replace('Pass 10.1','Pass 10.2').replace('DEFINITIVE EDITION · PASS 10.1','DEFINITIVE EDITION')
s=s.replace('Purpose-built battlefield art, match setup flow, mulligan entry, and difficulty-layered Integration Bot.','Classic Witcher 3 Gwent rebuilt as a deterministic, touch-first web game.')
s=s.replace('<button class="btn primary" data-nav="play-screen"><strong>PLAY</strong><span>→</span></button>', '<button id="continue-match" class="btn primary hidden"><strong>CONTINUE MATCH</strong><span>RESUME</span></button><button class="btn primary" data-nav="play-screen"><strong>PLAY</strong><span>→</span></button>')
s=s.replace('<button class="btn" data-nav="profile-screen"><strong>PROFILE</strong><span>QA</span></button>', '<button class="btn dev-only" data-nav="profile-screen"><strong>DEVELOPER</strong><span>QA</span></button>')
s=s.replace('<div class="buildline">ENGINE 10.1 · SHARED BATTLEFIELD GEOMETRY · SETUP + MULLIGAN FLOW</div>', '<div class="buildline dev-only">BUILD 10.2 · JS PRODUCTION · CI-GATED</div>')
s=s.replace('Launch immediately with the recommended Northern Realms setup and one mulligan-ready hand.','Launch immediately with the recommended Northern Realms deck and opening hand.')
s=s.replace('Choose deck preset, bot archetype, difficulty, initiative, and seed. Then review your opening hand and mulligan before battle.','Choose your deck preset, opponent, difficulty, and initiative, then review your opening hand before battle.')
s=s.replace('<div class="panel mode-card"><div class="eyebrow">MECHANICS QA</div>', '<div class="panel mode-card dev-only"><div class="eyebrow">MECHANICS QA</div>')
s=s.replace('<div class="panel mode-card compact"><div class="eyebrow">SOURCE PARITY</div>', '<div class="panel mode-card compact dev-only"><div class="eyebrow">SOURCE PARITY</div>')
s=s.replace('<div class="panel mode-card compact"><div class="eyebrow">PASS 10 NOTE</div>', '<div class="panel mode-card compact dev-only"><div class="eyebrow">PASS 10 NOTE</div>')
s=s.replace('<div class="eyebrow">PASS 10 SETUP</div>','<div class="eyebrow">MATCH SETUP</div>')
s=s.replace('Pass 10 still rides a controlled deck slice, but it now exposes multiple setup presets so the match-entry shell feels like a product rather than a fixed script.','Choose from the current playable deck presets. Full deck construction arrives in a later gameplay pass.')
s=s.replace('<section id="profile-screen" class="screen">','<section id="profile-screen" class="screen dev-screen">').replace('<section id="rules-screen" class="screen">','<section id="rules-screen" class="screen dev-screen">')
needle='<label class="deck-card"><span>Default difficulty</span><select id="default-difficulty" class="mini-select"><option value="apprentice">Apprentice</option><option value="standard">Standard</option><option value="master">Master</option></select></label>'
s=s.replace(needle,needle+'<label class="deck-card"><span>Developer Mode</span><input id="developer-mode" type="checkbox"></label>')
s=s.replace('These controls persist locally in Pass 10. Difficulty remains an Integration Bot heuristic layer, not the final campaign-grade opponent suite.','Preferences persist on this device. Developer Mode reveals QA, rules, manual bot, and cheat controls.')
s=s.replace('<button id="bot-move" class="bot-button hidden">BOT MOVE</button><button id="cheat-open" class="battle-icon">✦</button>', '<button id="bot-move" class="bot-button hidden dev-only">BOT MOVE</button><button id="cheat-open" class="battle-icon dev-only">✦</button>')
s=s.replace('<img src="https://raw.githubusercontent.com/asundr/gwent-classic/main/img/lg/realms_foltest_copper.jpg" alt="Leader Card">','<img src="icon.svg" alt="Leader Card">')
s=s.replace('<link rel="icon" href="icon.svg" type="image/svg+xml">','<link rel="icon" href="icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png">')
s=s.replace('<script src="src/cards-catalog.js"></script><script src="src/gwent-engine.js"></script><script src="app.js"></script>', '<script src="src/cards-catalog.js"></script><script src="src/gwent-engine.js"></script><script src="src/asset-resolver.js"></script><script src="src/storage.js"></script><script src="app.js"></script>')
p.write_text(s)

with (root/'styles.css').open('a') as f:
    f.write("\n/* Pass 10.2 production hardening */\nbody:not(.dev-mode) .dev-only{display:none!important}\nbody:not(.dev-mode) .dev-screen{display:none!important}\n#continue-match.hidden{display:none!important}\n")
print('Normalized Pass 10.2 source files')

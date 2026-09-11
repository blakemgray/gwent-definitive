import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('GWENT_TEST_URL','http://127.0.0.1:4173/')
QA=Path('qa/pass11_lifecycle')
QA.mkdir(parents=True,exist_ok=True)
errors=[]

with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
    if not exe and Path('/usr/bin/chromium').exists():
        exe='/usr/bin/chromium'
    kwargs={'args':['--no-sandbox']}
    if exe:
        kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':852,'height':393})
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle')

    page.evaluate("""()=>{
      const G=window.__GWENT_PASS11__.engine;
      let state=G.createMatch({
        p1Faction:'realms',p2Faction:'monsters',
        p1Deck:['realms_banner_nurse','realms_keira'],p2Deck:['monsters_fiend'],
        handSize:1,firstPlayerId:'p1',seed:111102,autoPass:false
      });
      state.players.p1.grave.push(state.players.p1.deck.shift());
      state=G.applyAction(state,{type:'PLAY_CARD',playerId:'p1',iid:state.players.p1.hand[0].iid,row:'siege'});
      const setup={playerPreset:'nr_golden',botPreset:'monsters_golden',difficulty:'standard',firstPlayerId:'p1',seed:111102,mode:'classic'};
      window.GwentStorage.writeMatch({state,setup,phase:'match'});
    }""")
    page.reload(wait_until='networkidle')
    page.locator('#continue-match').click()
    assert page.locator('[data-choice-type="medic"]').is_visible()
    assert page.locator('[data-choice-index]').count()==1
    restored=page.evaluate('window.__GWENT_PASS11__.getState()')
    assert restored['pendingChoice']['type']=='medic'
    page.screenshot(path=str(QA/'01_restored_medic_choice.png'))

    page.locator('#auto-bot').evaluate('(el)=>el.checked=false')
    page.locator('[data-choice-index]').click()
    resolved=page.evaluate('window.__GWENT_PASS11__.getState()')
    assert resolved['pendingChoice'] is None
    assert resolved['currentPlayerId']=='p2'
    assert any(x['cardId']=='realms_keira' for x in resolved['players']['p1']['board']['ranged'])
    saved=page.evaluate('window.GwentStorage.readMatch()')
    assert saved['phase']=='match' and saved['state']==resolved

    unknown=json.loads(json.dumps(resolved))
    unknown['currentPlayerId']='p1'
    unknown['pendingChoice']={'type':'future_choice','playerId':'p1'}
    page.evaluate('(state)=>window.__GWENT_PASS11__.setStateForQA(state)',unknown)
    before=page.evaluate('window.__GWENT_PASS11__.getState()')
    assert page.locator('[data-choice-unsupported="future_choice"]').is_visible()
    page.wait_for_timeout(60)
    assert page.evaluate('window.__GWENT_PASS11__.getState()')==before

    page.evaluate("""()=>{
      const G=window.__GWENT_PASS11__.engine;
      const state=G.createMatch({p1Faction:'realms',p2Faction:'monsters',p1Deck:['realms_keira'],p2Deck:['monsters_fiend'],handSize:1,firstPlayerId:'p1',seed:111103,autoPass:false});
      window.__GWENT_PASS11__.setStateForQA(state);
      window.__GWENT_PASS11__.saveActiveMatch();
    }""")
    page.evaluate('window.__GWENT_PASS11__.openMatchMenu()')
    assert page.locator('[data-match-menu="main"]').is_visible()
    page.locator('#match-restart-request').click()
    assert page.locator('[data-match-menu="confirm-restart"]').is_visible()
    page.screenshot(path=str(QA/'02_restart_confirmation.png'))
    page.locator('#match-restart-confirm').click()
    assert page.locator('#mulligan-screen.active').count()==1
    restarted=page.evaluate('window.GwentStorage.readMatch()')
    assert restarted['phase']=='mulligan'
    assert len(restarted['state']['players']['p1']['hand'])==10
    assert len(restarted['state']['players']['p1']['deck'])==21

    page.locator('#finish-mulligan').click()
    page.evaluate("""()=>{
      const state=window.__GWENT_PASS11__.getState();
      state.winner='p1';
      state.roundHistory=[{round:1,scores:{p1:{total:52},p2:{total:41}},winnerId:'p1'},{round:2,scores:{p1:{total:37},p2:{total:20}},winnerId:'p1'}];
      window.__GWENT_PASS11__.setStateForQA(state);
      window.__GWENT_PASS11__.saveActiveMatch();
    }""")
    terminal=page.evaluate('window.GwentStorage.readMatch()')
    assert terminal['phase']=='result' and terminal['state']['winner']=='p1'
    page.reload(wait_until='networkidle')
    assert 'RESULT' in page.locator('#continue-match').inner_text()
    page.locator('#continue-match').click()
    assert page.locator('[data-result="victory"]').is_visible()
    assert page.evaluate('window.GwentStorage.readMatch().phase')=='result'
    page.screenshot(path=str(QA/'03_restored_terminal_result.png'))

    prior_seed=page.evaluate('window.GwentStorage.readMatch().setup.seed')
    page.locator('#result-rematch').click()
    assert page.locator('#mulligan-screen.active').count()==1
    rematch=page.evaluate('window.GwentStorage.readMatch()')
    assert rematch['phase']=='mulligan'
    assert rematch['setup']['seed']==prior_seed+1
    assert rematch['state']['winner'] is None

    assert not errors,errors
    (QA/'lifecycle_summary.json').write_text(json.dumps({
      'restoredChoice':'medic','unknownChoiceFailedClosed':True,
      'restartConfirmed':True,'terminalRestored':True,'rematchSeedAdvanced':True,
      'pageErrors':errors
    },indent=2))
    browser.close()

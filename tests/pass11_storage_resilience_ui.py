import json
import os
from copy import deepcopy
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('GWENT_TEST_URL','http://127.0.0.1:4173/')
QA=Path('qa/pass11_storage')
QA.mkdir(parents=True,exist_ok=True)
errors=[]


def disable_auto_bot(page):
    page.evaluate("""()=>{
      const toggle=document.querySelector('#auto-bot');
      toggle.checked=false;
      window.__GWENT_PASS11__.maybeAutoBot();
    }""")


def fail_match_writes(page):
    page.evaluate("""()=>{
      if(!window.__qaOriginalStorageSetItem)window.__qaOriginalStorageSetItem=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
        if(key===window.GwentStorage.SAVE_KEY)throw new DOMException('QA quota exhausted','QuotaExceededError');
        return window.__qaOriginalStorageSetItem.call(this,key,value);
      };
    }""")


def restore_writes(page):
    page.evaluate("""()=>{
      if(window.__qaOriginalStorageSetItem){Storage.prototype.setItem=window.__qaOriginalStorageSetItem;delete window.__qaOriginalStorageSetItem;}
    }""")


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    kwargs={'args':['--no-sandbox']}
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':852,'height':393})
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle')
    page.evaluate('localStorage.clear()')

    # F3: prepared-match persistence failure must not abort the real mulligan flow.
    fail_match_writes(page)
    page.evaluate('window.__GWENT_PASS11__.quickStart()')
    page.wait_for_timeout(80)
    assert page.locator('#mulligan-screen.active').count()==1
    assert page.evaluate("document.body.dataset.saveStatus==='error'")
    assert page.evaluate('window.__GWENT_PASS11__.getPreparedState()!=null')
    assert page.evaluate('window.GwentStorage.lastWriteStatus.ok') is False

    # Enter a deterministic ordinary match, then fail the post-commit write.
    restore_writes(page)
    page.evaluate("""()=>{
      const G=window.__GWENT_PASS11__.engine;
      const s=G.createMatch({p1Faction:'realms',p2Faction:'monsters',p1Deck:['realms_redania','realms_keira'],p2Deck:['monsters_fiend'],handSize:1,firstPlayerId:'p1',seed:311001,autoPass:false});
      window.__GWENT_PASS11__.setStateForQA(s);
      window.__GWENT_PASS11__.saveActiveMatch();
    }""")
    disable_auto_bot(page)
    before=page.evaluate('window.__GWENT_PASS11__.getState()')
    fail_match_writes(page)
    page.evaluate("""()=>{
      const api=window.__GWENT_PASS11__,s=api.getState(),G=api.engine;
      const action=G.legalActions(s,'p1').find(a=>a.type==='PLAY_CARD');
      if(!action)throw new Error('ordinary QA play missing');
      api.playAction(action);
    }""")
    page.wait_for_timeout(100)
    committed=page.evaluate('window.__GWENT_PASS11__.getState()')
    assert committed!=before
    assert len(committed['players']['p1']['hand'])==len(before['players']['p1']['hand'])-1
    assert page.locator('#hand-count').inner_text()==str(len(committed['players']['p1']['hand']))
    assert page.evaluate("document.body.dataset.saveStatus==='error'")
    assert 'NOT SAVED' in page.locator('#toast').inner_text()
    assert 'ENGINE REJECTED' not in page.locator('#toast').inner_text()
    failed_saved=page.evaluate('window.GwentStorage.readMatch()')
    assert failed_saved is not None and failed_saved['state']==before, 'failed write should leave prior durable save unchanged'

    # Recovery saves the exact already-committed state without replaying the move.
    restore_writes(page)
    page.evaluate('window.__GWENT_PASS11__.saveActiveMatch()')
    page.wait_for_timeout(100)
    assert page.evaluate("document.body.dataset.saveStatus==='ok'")
    assert 'SAVE RECOVERED' in page.locator('#toast').inner_text()
    recovered=page.evaluate('window.GwentStorage.readMatch()')
    assert recovered['state']==committed
    assert page.evaluate('window.__GWENT_PASS11__.getState()')==committed

    # Pending player choice must render and remain actionable even when its save fails.
    page.evaluate("""()=>{
      const G=window.__GWENT_PASS11__.engine;
      let s=G.createMatch({p1Faction:'realms',p2Faction:'monsters',p1Deck:['realms_banner_nurse','realms_keira'],p2Deck:['monsters_fiend'],handSize:1,firstPlayerId:'p1',seed:311002,autoPass:false});
      s.players.p1.grave.push(s.players.p1.deck.shift());
      window.__GWENT_PASS11__.setStateForQA(s);
    }""")
    disable_auto_bot(page)
    fail_match_writes(page)
    page.evaluate("""()=>{
      const api=window.__GWENT_PASS11__,s=api.getState(),G=api.engine;
      const action=G.legalActions(s,'p1').find(a=>a.type==='PLAY_CARD');
      if(!action)throw new Error('medic QA play missing');
      api.playAction(action);
    }""")
    page.wait_for_timeout(100)
    choice_state=page.evaluate('window.__GWENT_PASS11__.getState()')
    assert choice_state['pendingChoice']['type']=='medic'
    assert page.locator('[data-choice-type="medic"]').is_visible()
    assert page.evaluate("document.body.dataset.saveStatus==='error'")

    # Terminal authoritative truth also survives a failed write and still reaches result UI.
    restore_writes(page)
    page.evaluate("""()=>{
      const G=window.__GWENT_PASS11__.engine;
      const s=G.createMatch({p1Faction:'realms',p2Faction:'monsters',p1Deck:['realms_esterad'],p2Deck:['monsters_fiend'],handSize:1,firstPlayerId:'p1',seed:311003,autoPass:false});
      const lead=s.players.p1.hand.shift();s.players.p1.board.close.push(lead);
      s.players.p2.passed=true;s.players.p2.health=1;s.currentPlayerId='p1';
      window.__GWENT_PASS11__.setStateForQA(s);
      window.__GWENT_PASS11__.saveActiveMatch();
    }""")
    disable_auto_bot(page)
    fail_match_writes(page)
    page.evaluate('window.__GWENT_PASS11__.pass()')
    page.wait_for_timeout(100)
    terminal=page.evaluate('window.__GWENT_PASS11__.getState()')
    assert terminal['winner']=='p1'
    assert page.evaluate("document.body.dataset.saveStatus==='error'")
    page.wait_for_function('!window.GwentPresentationQueue.busy',timeout=7000)
    assert page.locator('[data-result="victory"]').is_visible()
    assert 'ENGINE REJECTED' not in page.locator('#toast').inner_text()
    restore_writes(page)

    # F4: start from a real current-format durable payload, then corrupt one
    # compatibility/structural invariant at a time. Continue must reject safely.
    page.evaluate('window.__GWENT_PASS11__.saveActiveMatch()')
    page.wait_for_timeout(60)
    valid=page.evaluate('window.GwentStorage.readMatch()')
    assert valid and valid['format']=='pass11-normal-v1' and valid['build']=='11.golden.1'
    save_key=page.evaluate('window.GwentStorage.SAVE_KEY')

    malformed=[]
    x=deepcopy(valid);del x['state']['players']['p1']['board']['close'];malformed.append(('missing-zone',x))
    x=deepcopy(valid);x['state']['currentPlayerId']='p3';malformed.append(('bad-current-player',x))
    x=deepcopy(valid);x['state']['players']['p1']['grave'].append({'iid':'qa-unknown','cardId':'not_a_real_card'});malformed.append(('unknown-card',x))
    x=deepcopy(valid);dup={'iid':'qa-duplicate','cardId':'realms_redania'};x['state']['players']['p1']['grave'].append(deepcopy(dup));x['state']['players']['p2']['grave'].append(deepcopy(dup));malformed.append(('duplicate-iid',x))
    x=deepcopy(valid);x['state']['pendingChoice']={'type':'medic','playerId':'p1','candidateIids':['missing-iid']};malformed.append(('bad-pending-choice',x))
    x=deepcopy(valid);x['format']='future-save-format';malformed.append(('unsupported-format',x))
    x=deepcopy(valid);x.pop('format',None);x['build']='incompatible';malformed.append(('unsupported-legacy-build',x))

    rejected=[]
    for name,payload in malformed:
        page.evaluate('(args)=>localStorage.setItem(args[0],JSON.stringify(args[1]))',[save_key,payload])
        read=page.evaluate('window.GwentStorage.readMatch()')
        assert read is None,name
        rejected.append(name)

    # Compatible legacy schema-v2 saves from the two closed persistence slices
    # remain readable without adding a general migration framework.
    for build in ['11.1A','11.1B']:
        legacy=deepcopy(valid);legacy.pop('format',None);legacy['build']=build
        page.evaluate('(args)=>localStorage.setItem(args[0],JSON.stringify(args[1]))',[save_key,legacy])
        read=page.evaluate('window.GwentStorage.readMatch()')
        assert read is not None and read['build']==build,build

    # Restore current payload and prove Continue visibility is derived from valid data.
    page.evaluate('(args)=>localStorage.setItem(args[0],JSON.stringify(args[1]))',[save_key,valid])
    page.evaluate("window.__GWENT_PASS11__.go('main-screen')")
    page.wait_for_timeout(60)
    assert page.locator('#continue-match').is_visible()

    assert not errors,errors
    summary={
      'preparedFailureStayedCoherent':True,
      'ordinaryCommitRenderedDespiteSaveFailure':True,
      'truthfulUnsavedStatus':True,
      'recoverySavedCommittedStateExactly':True,
      'pendingChoiceRenderedDespiteSaveFailure':True,
      'terminalResultRenderedDespiteSaveFailure':True,
      'malformedRejected':rejected,
      'compatibleLegacyBuilds':['11.1A','11.1B'],
      'pageErrors':errors,
    }
    (QA/'storage_resilience_matrix.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    browser.close()

print('pass11-storage-resilience-ui: committed state survives save failure with truthful recovery; malformed/incompatible saves reject safely while 11.1A/11.1B remain compatible')

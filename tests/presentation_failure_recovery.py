import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()


def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(180)


def setup_state(page):
    return page.evaluate("""()=>{
      const api=window.__GWENT_PASS10__,G=api.engine,s=api.getState();
      for(const pid of ['p1','p2']){
        for(const row of G.ROWS){s.players[pid].board[row]=[];s.players[pid].board.special[row]=null;s.players[pid].board.leaderHorn[row]=false;}
        s.players[pid].passed=false;
      }
      s.weather={close:false,ranged:false,siege:false};s.weatherCards=[];s.pendingChoice=null;s.pendingResume=null;s.winner=null;s.currentPlayerId='p1';
      s.players.p1.hand=[{iid:'qa-failure-card',cardId:'realms_keira'},{iid:'qa-failure-filler',cardId:'realms_blue_stripes'}];
      s.players.p2.hand=[{iid:'qa-failure-bot',cardId:'monsters_cockatrice'},{iid:'qa-failure-bot2',cardId:'monsters_gargoyle'}];
      return s;
    }""")


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);page=browser.new_page(viewport={'width':852,'height':393});page_errors=[];console_errors=[]
    page.on('pageerror',lambda e:page_errors.append(str(e)))
    page.on('console',lambda m:console_errors.append(m.text) if m.type=='error' else None)
    enter(page)
    s=setup_state(page);page.evaluate("s=>{window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s);page.wait_for_timeout(55)
    assert page.locator('#auto-bot').is_checked(),'auto bot must be enabled to validate turn-gate recovery'
    before=page.evaluate('window.__GWENT_PASS10__.getState()')
    action=page.evaluate("window.GwentDirectManipulation.actionsFor('qa-failure-card')[0]");assert action

    # Throw only when the source-card flight tries to start. The engine commit has
    # already happened at that point and animateFlight has already registered its
    # cleanup, so the presentation layer must fail closed around the committed state.
    page.evaluate("""()=>{
      window.__qaFailureAnimate=Element.prototype.animate;
      window.__qaFailureThrown=false;
      Element.prototype.animate=function(frames,options){
        if(!window.__qaFailureThrown && this.classList?.contains('dm-flight-proxy')){
          window.__qaFailureThrown=true;
          throw new Error('QA_INJECTED_PRESENTATION_FAILURE');
        }
        return window.__qaFailureAnimate.call(this,frames,options);
      };
    }""")
    page.locator('#hand [data-card-iid="qa-failure-card"]').click()
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',action)
    page.locator(f'[data-dm-action-key="{key}"]').click()
    page.wait_for_timeout(100)

    assert page.evaluate('window.__qaFailureThrown'),'injected failure did not execute'
    assert not page.evaluate('window.GwentPresentationQueue.busy'),'presentation queue remained deadlocked after animation failure'
    assert page.evaluate('window.GwentPresentationQueue.errorCount')==1
    last=page.evaluate('window.GwentPresentationQueue.lastCompleted')
    assert last and last['reason']=='presentation_error' and last['cancelled'],last
    assert not page.evaluate('window.GwentInteractionTurnGate.pending'),'bot gate remained pending after presentation failure'
    assert page.evaluate("window.GwentDirectManipulation.phase")=='idle'
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder,.dm-legal-target').count()==0,'presentation failure leaked transient DOM'

    committed=page.evaluate('window.__GWENT_PASS10__.getState()')
    assert committed!=before,'engine commit was incorrectly rolled back with disposable presentation failure'
    assert committed['currentPlayerId']=='p2','engine turn did not advance before presentation failure'
    saved=page.evaluate('window.GwentStorage.readMatch()?.state||null');assert saved==committed,'persisted engine state diverged after presentation failure'

    # Deferred bot must resume from the committed state once the failed presentation
    # transaction has reconciled, proving the failure cannot strand the match.
    page.wait_for_timeout(330)
    after_bot=page.evaluate('window.__GWENT_PASS10__.getState()')
    assert after_bot!=committed,'bot did not resume after presentation failure recovery'
    assert not page.evaluate('window.GwentInteractionTurnGate.pending')
    assert not page_errors,page_errors
    assert any('QA_INJECTED_PRESENTATION_FAILURE' in x or 'authoritative game state retained' in x for x in console_errors),console_errors
    # Restore inside a function so Playwright serializes a plain boolean result
    # instead of trying to marshal a native Web API function (Illegal invocation).
    page.evaluate("()=>{Element.prototype.animate=window.__qaFailureAnimate;return true;}")
    browser.close()

print('presentation-failure-recovery: injected card-flight animation exception retained committed/saved engine state, cleaned transient UI, released turn gate, and resumed bot')

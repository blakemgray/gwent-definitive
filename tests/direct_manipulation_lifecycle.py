import json, os
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


def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('lifecycle-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s)
    page.wait_for_timeout(55)


def wait_idle(page,timeout=5000):
    page.evaluate('t=>window.GwentDirectManipulation.waitForIdle(t)',timeout);page.wait_for_timeout(30)


def state(page):return page.evaluate('window.__GWENT_PASS10__.getState()')


def base_scenario(page,one_card=False):
    return page.evaluate("""one=>{
      const api=window.__GWENT_PASS10__,G=api.engine,s=api.getState();
      for(const pid of ['p1','p2']){
        for(const row of G.ROWS){s.players[pid].board[row]=[];s.players[pid].board.special[row]=null;s.players[pid].board.leaderHorn[row]=false;}
        s.players[pid].passed=false;
      }
      s.weather={close:false,ranged:false,siege:false};s.weatherCards=[];s.pendingChoice=null;s.pendingResume=null;s.winner=null;s.round=1;s.currentPlayerId='p1';
      s.players.p1.health=2;s.players.p2.health=2;
      s.players.p1.hand=[{iid:'qa-life-card',cardId:'realms_keira'}];
      if(!one)s.players.p1.hand.push({iid:'qa-life-filler',cardId:'realms_blue_stripes'});
      s.players.p2.hand=[{iid:'qa-life-p2',cardId:'monsters_cockatrice'}];
      s.players.p2.passed=!!one;
      return s;
    }""",one_card)


def action(page):return page.evaluate("window.GwentDirectManipulation.actionsFor('qa-life-card')[0]")

def key(page,a):return page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a)


def tap(page,a):
    page.locator('#hand [data-card-iid="qa-life-card"]').click();page.locator(f'[data-dm-action-key="{key(page,a)}"]').click();wait_idle(page)


def drag(page,a):
    card=page.locator('#hand [data-card-iid="qa-life-card"]');b=card.bounding_box();assert b
    sx,sy=b['x']+b['width']/2,b['y']+b['height']*.48
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+13,sy-2,steps=2);page.wait_for_timeout(35)
    t=page.locator(f'[data-dm-action-key="{key(page,a)}"]');assert t.count()==1;tb=t.bounding_box();assert tb
    page.mouse.move(tb['x']+tb['width']/2,tb['y']+tb['height']/2,steps=7);page.wait_for_timeout(35);assert page.locator('.dm-active-target').count()==1
    page.mouse.up();wait_idle(page)


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);page=browser.new_page(viewport={'width':852,'height':393});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    page.evaluate("document.querySelector('#auto-bot').checked=false")
    page.evaluate('window.GwentDirectManipulation.reduced(true)')

    # Last-card play: engine auto-pass + round resolution can remove the just-played
    # unit before presentation reads the new DOM. Tap and drag must still agree and
    # the flight must use snapshotted row intent rather than board-center guessing.
    base=base_scenario(page,True);reset(page,base);a=action(page);assert a
    tap(page,a);tap_state=state(page);tap_settle=page.evaluate('window.GwentDirectManipulation.lastSettlement')
    assert tap_state['round']>=2 or tap_state['winner'] is not None,tap_state['round']
    assert tap_settle['destination']['kind']=='row' and tap_settle['resolvedBy']=='semantic-destination',tap_settle
    reset(page,base);a=action(page);drag(page,a);drag_state=state(page);drag_settle=page.evaluate('window.GwentDirectManipulation.lastSettlement')
    assert drag_state==tap_state,'last-card tap/drag diverged through auto-pass round resolution'
    assert drag_settle['resolvedBy']=='semantic-destination' and drag_settle['resolvedBy']!='board-fallback',drag_settle

    # Save occurs on authoritative commit, not animation completion. Stretch the
    # presentation, interrupt it via an actual visibilitychange path, then restore
    # from persisted state and demand exact state equivalence with zero transient DOM.
    base=base_scenario(page,False);reset(page,base);a=action(page);assert a
    page.evaluate("""()=>{
      window.__qaLifeAnimate=Element.prototype.animate;
      Element.prototype.animate=function(frames,options){let next=options;if(options&&typeof options==='object')next={...options,duration:Math.max(850,Number(options.duration)||0)};return window.__qaLifeAnimate.call(this,frames,next);};
    }""")
    page.locator('#hand [data-card-iid="qa-life-card"]').click();page.locator(f'[data-dm-action-key="{key(page,a)}"]').click();page.wait_for_timeout(90)
    assert page.evaluate('window.GwentPresentationQueue.busy'),'stretched presentation never became active'
    committed=state(page);saved=page.evaluate('window.GwentStorage.readMatch()?.state||null');assert saved==committed,'persisted state lagged authoritative engine commit'
    page.evaluate("""()=>{
      Object.defineProperty(document,'hidden',{configurable:true,value:true});
      document.dispatchEvent(new Event('visibilitychange'));
    }""");page.wait_for_timeout(90)
    assert not page.evaluate('window.GwentPresentationQueue.busy'),'visibility interruption did not cancel presentation'
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder,.dm-legal-target').count()==0,'visibility interruption leaked transient presentation DOM'
    assert state(page)==committed,'visibility cancellation changed already-committed engine state'
    assert page.evaluate('window.GwentStorage.readMatch()?.state||null')==committed,'visibility cancellation damaged persisted state'
    page.evaluate("()=>{delete document.hidden;Element.prototype.animate=window.__qaLifeAnimate;}")

    # Exercise the actual Continue Match product path rather than reading storage only.
    page.evaluate("window.__GWENT_PASS10__.go('main-screen')");page.wait_for_timeout(35)
    assert page.locator('#continue-match').count()==1 and not page.locator('#continue-match').evaluate("e=>e.classList.contains('hidden')")
    page.locator('#continue-match').click();page.wait_for_timeout(80)
    assert state(page)==committed,'Continue Match did not restore exact committed state after interrupted presentation'
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder,.dm-legal-target').count()==0

    assert not errors,errors
    browser.close()

print('direct-manipulation-lifecycle: last-card auto-pass/round-resolution tap-drag parity + visibility interruption + persisted Continue Match restore all passed')

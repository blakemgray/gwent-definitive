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
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(220)


def state(page):return page.evaluate('window.__GWENT_PASS10__.getState()')

def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('webkit-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s);page.wait_for_timeout(65)

def wait_idle(page):page.evaluate('window.GwentDirectManipulation.waitForIdle(4000)');page.wait_for_timeout(30)

def first_ordinary(page):
    return page.evaluate("""()=>{const api=window.__GWENT_PASS10__,s=api.getState(),G=api.engine;for(const i of s.players.p1.hand){const d=G.CARD_DB[i.cardId];const a=G.legalActions(s,'p1').find(x=>x.type==='PLAY_CARD'&&x.iid===i.iid);if(a&&d.type==='unit'&&!d.abilities.includes('spy')&&!d.abilities.includes('medic'))return{iid:i.iid,action:a,cardId:i.cardId,abilities:[...d.abilities]};}return null;}""")

def target(page,a):
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a);loc=page.locator(f'[data-dm-action-key="{key}"]');assert loc.count()==1;return loc

def wait_active_target(page,a):
    # The drag controller resolves spatial hit state inside requestAnimationFrame.
    # Synchronize to WebKit's next serviced frame instead of imposing a runner-
    # speed wall-clock deadline on rAF, then assert both semantic and DOM state.
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a)
    page.evaluate("()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()))")
    assert page.evaluate("window.GwentDirectManipulation.phase==='dragging_over_legal'")
    active=page.locator(f'[data-dm-action-key="{key}"].dm-active-target')
    assert active.count()==1
    assert page.locator('.dm-active-target').count()==1

def touch_tap(page,locator):
    b=locator.bounding_box();assert b;page.touchscreen.tap(b['x']+b['width']/2,b['y']+b['height']/2)

def drag(page,iid,a):
    card=page.locator(f'#hand [data-card-iid="{iid}"]');b=card.bounding_box();assert b
    sx,sy=b['x']+b['width']/2,b['y']+b['height']*.48
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+12,sy-2,steps=2);page.wait_for_timeout(45)
    assert page.locator('.dm-drag-proxy').count()==1
    assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid',iid)
    # Legal targets are created by selection/beginDrag, not pre-rendered by the UI.
    t=target(page,a);tb=t.bounding_box();assert tb
    tx,ty=tb['x']+tb['width']/2,tb['y']+tb['height']/2
    page.mouse.move(tx,ty,steps=7);wait_active_target(page,a)
    page.mouse.up();wait_idle(page)

with sync_playwright() as p:
    browser=p.webkit.launch();ctx=browser.new_context(viewport={'width':852,'height':393},has_touch=True,is_mobile=True);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    assert page.evaluate("window.GwentDirectManipulation?.version==='10.4A.0'")
    assert page.evaluate("CSS.supports('touch-action','none')")
    base=state(page);base['players']['p2']['passed']=True;base['currentPlayerId']='p1'
    # This inherited 10.4A gate measures generic direct-manipulation latency and
    # parity, not authored ability choreography. The deterministic quick-start
    # hand can contain only ability-bearing playable units, so normalize one
    # existing instance to a canonical ability-free close-row unit for this test.
    assert base['players']['p1']['hand']
    base['players']['p1']['hand'][0]['cardId']='realms_redania'
    reset(page,base)
    item=first_ordinary(page);assert item and item['cardId']=='realms_redania' and item['abilities']==[],item

    # Real touch taps on WebKit must select and commit without the inspector stealing intent.
    card=page.locator(f'#hand [data-card-iid="{item["iid"]}"]');touch_tap(page,card);page.wait_for_timeout(55)
    assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid',item['iid'])
    assert page.locator('#card-inspector').count()==0
    t=target(page,item['action']);touch_tap(page,t);wait_idle(page);tap_state=state(page)

    # Pointer/mouse drag through WebKit must resolve exactly the same state.
    reset(page,base);drag(page,item['iid'],item['action']);drag_state=state(page);assert drag_state==tap_state

    # Invalid drag returns without mutation or stale presentation artifacts.
    reset(page,base);before=state(page);card=page.locator(f'#hand [data-card-iid="{item["iid"]}"]');b=card.bounding_box();assert b
    sx,sy=b['x']+b['width']/2,b['y']+b['height']*.48
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+14,sy-2,steps=2);page.wait_for_timeout(40);assert page.locator('.dm-drag-proxy').count()==1
    page.mouse.move(8,45,steps=6);page.mouse.up();wait_idle(page)
    assert state(page)==before
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder,.dm-legal-target').count()==0

    # WebKit reduced-motion path retains exact rules outcome and the inherited
    # generic interaction budget. Signature ability timing is owned by 10.4B QA.
    page.emulate_media(reduced_motion='reduce');page.evaluate('window.GwentDirectManipulation.reduced(null)');reset(page,base)
    assert page.evaluate("window.GwentMotionTokens.reduced()===true")
    card=page.locator(f'#hand [data-card-iid="{item["iid"]}"]');touch_tap(page,card);page.wait_for_timeout(35);t=target(page,item['action']);touch_tap(page,t);wait_idle(page)
    assert state(page)==tap_state
    last=page.evaluate('window.GwentPresentationQueue.lastCompleted');assert last and last['durationMs']<350,last

    stats=page.evaluate('window.GwentDirectManipulation.stats');assert stats['errors']==0 and stats['tapCommits']>=2 and stats['dragCommits']>=1 and stats['invalidDrops']>=1,stats
    assert not errors,errors
    ctx.close();browser.close()

print('direct-manipulation-webkit: WebKit touch-tap, drag parity, invalid return, cleanup, and generic reduced-motion gate passed')
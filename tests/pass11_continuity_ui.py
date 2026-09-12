import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass11_continuity';QA.mkdir(parents=True,exist_ok=True)
IID='qa-cont-card'


def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(180)
    page.evaluate('window.GwentDirectManipulation.reduced(false)')
    assert page.evaluate("window.GwentCardContinuity?.version==='11.2D.0'")


def wait_idle(page,timeout=5000):
    page.evaluate('t=>window.GwentDirectManipulation.waitForIdle(t)',timeout)
    page.wait_for_timeout(60)


def state(page):return page.evaluate('window.__GWENT_PASS10__.getState()')

def digest(value):return json.dumps(value,sort_keys=True,separators=(',',':'))


def make_scenario(page):
    return page.evaluate("""iid=>{
      const api=window.__GWENT_PASS10__,G=api.engine,s=api.getState();
      for(const pid of ['p1','p2']){
        for(const row of G.ROWS){s.players[pid].board[row]=[];s.players[pid].board.special[row]=null;s.players[pid].board.leaderHorn[row]=false;}
        s.players[pid].passed=false;
      }
      s.weather={close:false,ranged:false,siege:false};s.weatherCards=[];
      s.pendingChoice=null;s.pendingResume=null;s.winner=null;s.currentPlayerId='p1';s.round=Math.max(1,s.round||1);
      s.players.p2.passed=true;
      s.players.p1.hand=[{iid,cardId:'realms_keira'},{iid:'qa-cont-filler',cardId:'realms_blue_stripes'}];
      return s;
    }""",IID)


def reset(page,s):
    page.evaluate("""s=>{
      window.GwentDirectManipulation.cancel('continuity-reset');
      window.__GWENT_PASS10__.setStateForQA(s);
      window.GwentBattlefieldUX.reconcile();
      window.GwentBattlefieldReadability?.refresh?.();
      window.GwentTargetExposure?.clear?.('continuity-reset');
      window.GwentCardContinuity.clear();
      window.GwentCardContinuity.reconcile();
    }""",s)
    page.wait_for_timeout(90)


def action(page):
    a=page.evaluate("iid=>window.GwentDirectManipulation.actionsFor(iid).find(x=>x.type==='PLAY_CARD')||null",IID)
    assert a,a
    return a


def target_box(page,a):
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a)
    target=page.locator(f'[data-dm-action-key="{key}"]')
    assert target.count()==1,(key,target.count())
    box=target.bounding_box();assert box
    return key,box


def start_drag(page):
    card=page.locator(f'#hand [data-card-iid="{IID}"]');box=card.bounding_box();assert box
    sx,sy=box['x']+box['width']/2,box['y']+box['height']*.48
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+13,sy-2,steps=2);page.wait_for_timeout(55)
    assert page.locator(f'.dm-drag-proxy[data-presentation-iid="{IID}"]').count()==1
    return sx,sy


def move_to_action(page,a,steps=8):
    _,box=target_box(page,a)
    p={'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}
    page.mouse.move(p['x'],p['y'],steps=steps);page.wait_for_timeout(65)
    assert page.locator('.dm-active-target').count()==1
    return p


def count_engine(page,zone='board'):
    return page.evaluate("""({iid,zone})=>{
      const G=window.__GWENT_PASS10__.engine,s=window.__GWENT_PASS10__.getState();let n=0;
      for(const pid of ['p1','p2']){
        if(zone==='hand')n+=s.players[pid].hand.filter(c=>c.iid===iid).length;
        if(zone==='grave')n+=s.players[pid].grave.filter(c=>c.iid===iid).length;
        if(zone==='board')for(const row of G.ROWS)n+=s.players[pid].board[row].filter(c=>c.iid===iid).length;
      }
      return n;
    }""",{'iid':IID,'zone':zone})


def trace(page):return page.evaluate('iid=>window.GwentCardContinuity.trace.filter(x=>x.iid===iid)',IID)

def manual(page):return page.evaluate('iid=>window.GwentCardContinuity.snapshot(iid)',IID)


def assert_no_identity_gap_or_duplicate(rows,label):
    proxy_indices=[i for i,r in enumerate(rows) if r['proxy']['visible']]
    assert proxy_indices,(label,'no visible proxy samples')
    start=proxy_indices[0]
    relevant=rows[start:]
    assert all(r['fullStrengthVisibleCount']>=1 for r in relevant),(label,'identity gap',[(r['stage'],r['fullStrengthVisibleCount']) for r in relevant if r['fullStrengthVisibleCount']<1])
    assert all(r['fullStrengthVisibleCount']<=1 for r in relevant),(label,'duplicate full-strength identity',[(r['stage'],r['fullStrengthVisibleCount'],r['engineZone']) for r in relevant if r['fullStrengthVisibleCount']>1])


def assert_final_board(page,label):
    snap=manual(page)
    assert snap['engineZone'].startswith('board:p1:'),(label,snap)
    assert snap['proxy']['present'] is False,(label,snap)
    assert snap['final']['visible'] is True,(label,snap)
    assert snap['source']['present'] is False,(label,snap)
    assert snap['fullStrengthVisibleCount']==1,(label,snap)
    assert count_engine(page,'board')==1 and count_engine(page,'hand')==0,(label,'engine identity count')
    return snap


def assert_final_hand(page,label):
    snap=manual(page)
    assert snap['engineZone']=='hand:p1',(label,snap)
    assert snap['proxy']['present'] is False,(label,snap)
    assert snap['source']['visible'] is True,(label,snap)
    assert snap['final']['present'] is False,(label,snap)
    assert snap['fullStrengthVisibleCount']==1,(label,snap)
    assert count_engine(page,'hand')==1 and count_engine(page,'board')==0,(label,'engine identity count')
    return snap


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);ctx=browser.new_context(viewport={'width':852,'height':393});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    base=make_scenario(page);results=[]

    # 1. Valid drag: source placeholder -> drag proxy -> engine commit -> guarded
    # authoritative final -> settled one-card identity.
    reset(page,base);a=action(page);start_drag(page)
    page.screenshot(path=str(QA/'01_drag_pickup.png'))
    move_to_action(page,a);page.mouse.up()
    page.wait_for_function("iid=>window.GwentPresentationQueue.busy&&window.GwentCardContinuity.guardedIids().includes(iid)&&document.querySelector(`[data-presentation-iid=\"${iid}\"]`)",arg=IID)
    page.screenshot(path=str(QA/'02_drag_committed_guarded_flight.png'))
    wait_idle(page);rows=trace(page);assert_no_identity_gap_or_duplicate(rows,'valid-drag');final=assert_final_board(page,'valid-drag')
    page.screenshot(path=str(QA/'03_drag_settled.png'))
    results.append({'case':'valid-drag','samples':len(rows),'final':final,'stages':[r['stage'] for r in rows]})

    # 2. Valid tap: same canonical engine action and continuity invariants, using
    # a flight proxy instead of the held drag proxy.
    reset(page,base);a=action(page)
    page.locator(f'#hand [data-card-iid="{IID}"]').click();page.wait_for_timeout(35)
    key,_=target_box(page,a);page.locator(f'[data-dm-action-key="{key}"]').click()
    page.wait_for_function("iid=>window.GwentPresentationQueue.busy&&document.querySelector(`.dm-flight-proxy[data-presentation-iid=\"${iid}\"]`)",arg=IID)
    page.screenshot(path=str(QA/'04_tap_flight.png'))
    wait_idle(page);rows=trace(page);assert_no_identity_gap_or_duplicate(rows,'valid-tap');final=assert_final_board(page,'valid-tap')
    results.append({'case':'valid-tap','samples':len(rows),'final':final})

    # 3. Invalid drag: return proxy is the moving actor, engine state is byte-identical,
    # and idle ends with exactly one authoritative hand source.
    reset(page,base);before=digest(state(page));start_drag(page)
    page.mouse.move(6,6,steps=7);page.wait_for_timeout(35);page.mouse.up()
    page.wait_for_function("()=>window.GwentDirectManipulation.phase==='returning'&&window.GwentPresentationQueue.busy")
    page.screenshot(path=str(QA/'05_invalid_return.png'))
    wait_idle(page);after=digest(state(page));assert after==before,'invalid return mutated engine state'
    rows=trace(page);assert_no_identity_gap_or_duplicate(rows,'invalid-return');final=assert_final_hand(page,'invalid-return')
    results.append({'case':'invalid-return','samples':len(rows),'zeroMutation':True,'final':final})

    # 4. Pre-commit interruption: cancellation during drag never mutates rules state and
    # cleans proxy/placeholder ownership back to exactly one hand representation.
    reset(page,base);before=digest(state(page));start_drag(page);page.screenshot(path=str(QA/'06_precommit_interrupt_before.png'))
    page.evaluate("window.GwentDirectManipulation.cancel('qa-precommit-interrupt')");page.mouse.up();wait_idle(page)
    assert digest(state(page))==before,'precommit interruption mutated engine state'
    final=assert_final_hand(page,'precommit-interrupt');page.screenshot(path=str(QA/'07_precommit_interrupt_restored.png'))
    results.append({'case':'precommit-interrupt','zeroMutation':True,'final':final})

    # 5. Post-commit interruption: cancel presentation only after engine state has moved
    # the card to the board. The action remains committed exactly once and cleanup reveals
    # one authoritative final representation.
    reset(page,base);a=action(page);start_drag(page);move_to_action(page,a);page.mouse.up()
    page.wait_for_function("iid=>window.GwentPresentationQueue.busy&&window.GwentCardContinuity.guardedIids().includes(iid)&&window.__GWENT_PASS10__.getState().players.p1.board.ranged.concat(window.__GWENT_PASS10__.getState().players.p1.board.close,window.__GWENT_PASS10__.getState().players.p1.board.siege).some(c=>c.iid===iid)",arg=IID)
    page.screenshot(path=str(QA/'08_postcommit_interrupt_guarded.png'))
    assert count_engine(page,'board')==1
    page.evaluate("window.GwentPresentationQueue.cancel('qa-postcommit-interrupt')")
    wait_idle(page);rows=trace(page);assert_no_identity_gap_or_duplicate(rows,'postcommit-interrupt');final=assert_final_board(page,'postcommit-interrupt')
    page.screenshot(path=str(QA/'09_postcommit_interrupt_reconciled.png'))
    results.append({'case':'postcommit-interrupt','committedExactlyOnce':True,'samples':len(rows),'final':final})

    # 6. Reduced motion: movement may collapse, identity invariants may not.
    reset(page,base);page.evaluate('window.GwentDirectManipulation.reduced(true)');a=action(page);start_drag(page);move_to_action(page,a);page.mouse.up();wait_idle(page)
    rows=trace(page);assert_no_identity_gap_or_duplicate(rows,'reduced-motion');final=assert_final_board(page,'reduced-motion')
    page.screenshot(path=str(QA/'10_reduced_motion_settled.png'))
    page.evaluate('window.GwentDirectManipulation.reduced(false)')
    results.append({'case':'reduced-motion','samples':len(rows),'final':final})

    assert not errors,errors
    (QA/'continuity_matrix.json').write_text(json.dumps(results,indent=2))
    (QA/'last_trace.json').write_text(json.dumps(trace(page),indent=2))
    ctx.close();browser.close()

print('pass11-continuity-ui: drag/tap identity continuity, invalid return, interruption cleanup, and reduced-motion invariants passed')
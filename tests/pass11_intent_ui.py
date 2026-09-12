import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass11_intent';QA.mkdir(parents=True,exist_ok=True)


def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(220)
    page.evaluate('window.GwentDirectManipulation.reduced(true)')


def wait_idle(page,timeout=4000):
    page.evaluate('t=>window.GwentDirectManipulation.waitForIdle(t)',timeout)
    page.wait_for_timeout(28)


def state(page):return page.evaluate('window.__GWENT_PASS10__.getState()')


def make_scenario(page,card_id,targets=0):
    return page.evaluate("""({cardId,targets})=>{
      const api=window.__GWENT_PASS10__,G=api.engine,s=api.getState();
      for(const pid of ['p1','p2']){
        for(const row of G.ROWS){s.players[pid].board[row]=[];s.players[pid].board.special[row]=null;s.players[pid].board.leaderHorn[row]=false;}
        s.players[pid].passed=false;
      }
      s.weather={close:false,ranged:false,siege:false};s.weatherCards=[];s.pendingChoice=null;s.pendingResume=null;s.winner=null;s.currentPlayerId='p1';
      s.players.p2.passed=true;
      s.players.p1.hand=[{iid:'qa-intent-card',cardId},{iid:'qa-intent-filler',cardId:'realms_blue_stripes'}];
      if(targets>0)s.players.p1.board.close=Array.from({length:targets},(_,i)=>({iid:`qa-target-${i}`,cardId:i%2?'realms_blue_stripes':'realms_keira'}));
      return s;
    }""",{'cardId':card_id,'targets':targets})


def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('intent-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s)
    page.wait_for_timeout(65)


def action(page,iid='qa-intent-card',row=None,target=None):
    return page.evaluate("""({iid,row,target})=>window.GwentDirectManipulation.actionsFor(iid).find(a=>(row==null||a.row===row)&&(target==null||a.targetIid===target))||null""",{'iid':iid,'row':row,'target':target})


def target_box(page,a):
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a)
    loc=page.locator(f'[data-dm-action-key="{key}"]');assert loc.count()==1
    box=loc.bounding_box();assert box
    return box


def start_drag(page):
    card=page.locator('#hand [data-card-iid="qa-intent-card"]');box=card.bounding_box();assert box
    sx,sy=box['x']+box['width']/2,box['y']+box['height']*.48
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+13,sy-2,steps=2);page.wait_for_timeout(28)
    assert page.locator('.dm-drag-proxy').count()==1
    return sx,sy


def intent(page):return page.evaluate('window.GwentDirectManipulation.lastIntent')


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);ctx=browser.new_context(viewport={'width':852,'height':393});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    assert page.evaluate("window.GwentDirectManipulation.intentVersion==='11.2B.0'")
    results=[]

    # 1. Geometry-relative singular forgiveness: 10 px beyond a row edge is outside the old fixed 7 px rule.
    base=make_scenario(page,'realms_keira');reset(page,base);a=action(page,row='ranged');assert a
    tb=target_box(page,a);start_drag(page)
    x,y=tb['x']+tb['width']+10,tb['y']+tb['height']/2
    page.mouse.move(x,y,steps=8);page.wait_for_timeout(30)
    d=intent(page);assert d and d['reason']=='forgiven_singular' and d['candidate'],d
    page.screenshot(path=str(QA/'01_singular_forgiveness.png'))
    page.mouse.up();wait_idle(page)
    after=state(page);assert any(c['iid']=='qa-intent-card' for c in after['players']['p1']['board']['ranged'])
    results.append({'case':'singular-near-miss','reason':d['reason'],'confidence':d['confidence']})

    # 2. Card-specific precision: 5 px outside a Decoy target must reject and preserve state byte-for-byte.
    base=make_scenario(page,'special_decoy',1);reset(page,base);before=state(page);a=action(page,target='qa-target-0');assert a
    tb=target_box(page,a);start_drag(page)
    x,y=tb['x']+tb['width']+5,tb['y']+tb['height']/2
    page.mouse.move(x,y,steps=8);page.wait_for_timeout(30)
    d=intent(page);assert d and d['candidate'] is None and d['reason'] in ('outside','low_confidence'),d
    assert page.locator('.dm-active-target').count()==0
    page.screenshot(path=str(QA/'02_decoy_near_miss_rejected.png'))
    page.mouse.up();wait_idle(page);after=state(page);assert after==before,'rejected Decoy drag mutated engine state'
    results.append({'case':'decoy-near-miss','reason':d['reason'],'confidence':d['confidence']})

    # 3. Multiple-row ambiguity: release in the physical gap between agile legal rows and reject instead of guessing.
    agile=page.evaluate("""()=>Object.values(window.__GWENT_PASS10__.engine.CARD_DB).find(d=>d.type==='unit'&&d.row==='agile'&&!d.abilities.includes('spy'))?.id||null""");assert agile
    base=make_scenario(page,agile);reset(page,base);before=state(page)
    close=action(page,row='close');ranged=action(page,row='ranged');assert close and ranged
    cb=target_box(page,close);rb=target_box(page,ranged);start_drag(page)
    x=(cb['x']+cb['width']/2+rb['x']+rb['width']/2)/2
    y=(cb['y']+cb['height']+rb['y'])/2
    page.mouse.move(x,y,steps=8);page.wait_for_timeout(30)
    d=intent(page);assert d and d['candidate'] is None and d['reason']=='ambiguous',d
    page.screenshot(path=str(QA/'03_agile_boundary_ambiguous.png'))
    page.mouse.up();wait_idle(page);after=state(page);assert after==before,'ambiguous agile drag mutated engine state'
    results.append({'case':'agile-boundary','reason':d['reason'],'margin':d['margin']})

    # 4. Immediate fast overshoot: one singular row may use the most recent segment, but only within bounded distance.
    base=make_scenario(page,'realms_keira');reset(page,base);a=action(page,row='ranged');assert a
    tb=target_box(page,a);start_drag(page)
    y=tb['y']+tb['height']/2
    inside_x=tb['x']+tb['width']-2
    page.mouse.move(inside_x,y,steps=8);page.wait_for_timeout(34)
    page.mouse.move(tb['x']+tb['width']+28,y,steps=1);page.wait_for_timeout(18)
    d=intent(page);assert d and d['reason']=='trajectory_singular' and d['candidate'] and d['trajectoryConsidered'],d
    page.screenshot(path=str(QA/'04_singular_trajectory_overshoot.png'))
    page.mouse.up();wait_idle(page);after=state(page);assert any(c['iid']=='qa-intent-card' for c in after['players']['p1']['board']['ranged'])
    results.append({'case':'singular-overshoot','reason':d['reason'],'confidence':d['confidence']})

    assert not errors,errors
    (QA/'intent_matrix.json').write_text(json.dumps(results,indent=2))
    ctx.close();browser.close()

print('pass11-intent-ui: singular forgiveness + Decoy precision + agile ambiguity + bounded trajectory integration passed')

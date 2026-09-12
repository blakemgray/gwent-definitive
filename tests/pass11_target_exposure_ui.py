import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass11_target_exposure';QA.mkdir(parents=True,exist_ok=True)


def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(220)
    page.evaluate('window.GwentDirectManipulation.reduced(false)')


def wait_idle(page,timeout=4000):
    page.evaluate('t=>window.GwentDirectManipulation.waitForIdle(t)',timeout)
    page.wait_for_timeout(40)


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
      s.players.p1.hand=[{iid:'qa-exposure-card',cardId},{iid:'qa-exposure-filler',cardId:'realms_blue_stripes'}];
      if(targets>0)s.players.p1.board.close=Array.from({length:targets},(_,i)=>({iid:`qa-target-${i}`,cardId:i%2?'realms_blue_stripes':'realms_keira'}));
      return s;
    }""",{'cardId':card_id,'targets':targets})


def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('exposure-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();window.GwentBattlefieldReadability.refresh();window.GwentTargetExposure.clear('exposure-reset');}",s)
    page.wait_for_timeout(80)


def action(page,row=None,target=None):
    return page.evaluate("""({row,target})=>window.GwentDirectManipulation.actionsFor('qa-exposure-card').find(a=>(row==null||a.row===row)&&(target==null||a.targetIid===target))||null""",{'row':row,'target':target})


def target_box(page,a):
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a)
    loc=page.locator(f'[data-dm-action-key="{key}"]');assert loc.count()==1
    box=loc.bounding_box();assert box
    return box


def start_drag(page):
    card=page.locator('#hand [data-card-iid="qa-exposure-card"]');box=card.bounding_box();assert box
    sx,sy=box['x']+box['width']/2,box['y']+box['height']*.48
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+13,sy-2,steps=2);page.wait_for_timeout(45)
    assert page.locator('.dm-drag-proxy').count()==1
    return sx,sy


def geometry(page):
    return page.evaluate("""()=>Object.fromEntries([...document.querySelectorAll('#match-screen .unit[data-inspect-board]')].map(el=>[el.dataset.inspectBoard,{left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height,offsetLeft:el.offsetLeft,offsetTop:el.offsetTop,offsetWidth:el.offsetWidth,offsetHeight:el.offsetHeight,position:getComputedStyle(el).position}]))""")


def assert_geometry_equal(before,after):
    assert before.keys()==after.keys()
    for iid,b in before.items():
        a=after[iid]
        assert a['position']=='absolute',(iid,a)
        for k in ('left','top','width','height','offsetLeft','offsetTop','offsetWidth','offsetHeight'):
            assert a[k]==b[k],(iid,k,b[k],a[k])


def safe_target_point(page,target_iid):
    point=page.evaluate("""targetIid=>{
      const DM=window.GwentDirectManipulation,I=window.GwentInteractionIntent;
      const targets=DM.targets();
      const wanted=targets.find(t=>t.dest?.targetIid===targetIid);if(!wanted)return null;
      const candidates=targets.map(t=>({key:t.key,kind:t.dest?.kind||'',rect:{x:t.box.x,y:t.box.y,width:t.box.width,height:t.box.height}}));
      const r=wanted.box,best=[];
      for(const fx of [.12,.25,.38,.5,.62,.75,.88])for(const fy of [.28,.5,.72]){
        const p={x:r.x+r.width*fx,y:r.y+r.height*fy};
        const d=I.resolve({point:p,candidates});
        if(d.candidate?.key===wanted.key&&d.reason==='direct_hit')best.push({x:p.x,y:p.y,confidence:d.confidence,margin:d.margin});
      }
      best.sort((a,b)=>b.margin-a.margin||b.confidence-a.confidence);return best[0]||null;
    }""",target_iid)
    assert point, f'no unambiguous direct-hit point for {target_iid}'
    return point


def move_to(page,p,steps=8):
    page.mouse.move(p['x'],p['y'],steps=steps);page.wait_for_timeout(85)


def exposure(page):return page.evaluate('window.GwentTargetExposure.snapshot()')


def assert_material_actor(page,target_iid,reduced=False):
    actor=page.locator(f'.te-target-actor[data-te-actor-for="{target_iid}"]')
    source=page.locator(f'#match-screen [data-inspect-board="{target_iid}"]')
    proxy=page.locator('.dm-drag-proxy')
    assert actor.count()==1 and source.count()==1 and proxy.count()==1
    if not reduced:
        page.wait_for_function("iid=>document.querySelector(`.te-target-actor[data-te-actor-for=\"${iid}\"]`)?.classList.contains('te-actor-raised')",target_iid)
        page.wait_for_timeout(115)
    snap=exposure(page);tele=snap['actor']
    assert tele['iid']==target_iid,tele
    assert tele['aboveProxy'] is True,tele
    assert tele['sourceVisibility']=='hidden',tele
    assert tele['hasArt'] is True and tele['power'] not in (None,''),tele
    assert actor.locator('img').count()==1 and actor.locator('.u-score').count()==1
    assert source.get_attribute('data-current-power')==tele['power'],(source.get_attribute('data-current-power'),tele)
    ar=actor.bounding_box();pr=proxy.bounding_box();assert ar and pr
    assert ar['width']*ar['height'] < pr['width']*pr['height']*.92,(ar,pr)
    if reduced:
        transform=actor.evaluate("e=>getComputedStyle(e).transform")
        assert transform=='none',transform
    else:
        rr=tele['restRect'];vr=tele['rect'];assert rr and vr
        assert vr['width']>rr['width']*1.08,(rr,vr)
        assert vr['y']<rr['y']-2,(rr,vr)
    return tele


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);ctx=browser.new_context(viewport={'width':852,'height':393});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    assert page.evaluate("window.GwentTargetExposure?.version==='11.2C.0'")
    results=[]

    # 1. Crowded Decoy row: authoritative targets remain in 10.3 absolute geometry,
    # one target receives a presentation actor above the held Decoy, and only its
    # immediate local neighbors yield. The full actor art/current-power identity is
    # materially visible rather than merely carrying a CSS lock class underneath it.
    base=make_scenario(page,'special_decoy',8);reset(page,base);base_geom=geometry(page)
    first=action(page,target='qa-target-3');second=action(page,target='qa-target-5');assert first and second
    start_drag(page)
    after_select=geometry(page);assert_geometry_equal(base_geom,after_select)
    p1=safe_target_point(page,'qa-target-3');move_to(page,p1)
    snap=exposure(page);assert snap['targetIid']=='qa-target-3',snap
    assert 1<=len(snap['neighborIids'])<=2,snap
    assert set(snap['neighborIids']).issubset({'qa-target-2','qa-target-4'}),snap
    assert page.locator('.te-locked-target').count()==1
    assert page.locator('.te-neighbor-yield').count()==len(snap['neighborIids'])
    tele=assert_material_actor(page,'qa-target-3')
    assert_geometry_equal(base_geom,geometry(page))
    page.screenshot(path=str(QA/'01_crowded_decoy_predictive_lock.png'))
    results.append({'case':'crowded-lock','snapshot':exposure(page),'materialActor':tele})

    # 2. Move directly to another explicit target: the actor/lock transfers, the old
    # source is visible again, and the old local yield is fully reversed before the new
    # neighborhood responds.
    p2=safe_target_point(page,'qa-target-5');move_to(page,p2)
    snap2=exposure(page);assert snap2['targetIid']=='qa-target-5',snap2
    assert set(snap2['neighborIids']).issubset({'qa-target-4','qa-target-6'}),snap2
    assert page.locator('[data-inspect-board="qa-target-3"].te-locked-target').count()==0
    assert page.locator('[data-inspect-board="qa-target-3"]').evaluate("e=>getComputedStyle(e).visibility")!='hidden'
    assert_material_actor(page,'qa-target-5')
    assert page.locator('.te-target-actor').count()==1
    assert_geometry_equal(base_geom,geometry(page))
    page.screenshot(path=str(QA/'02_decoy_lock_transfer.png'))
    results.append({'case':'lock-transfer','snapshot':exposure(page)})

    # 3. Leave the target row: predictive actor/lock disappears and every neighbor
    # returns to untouched 10.3 resting geometry. Re-enter proves reversibility.
    wb=page.locator('#match-screen .weather').bounding_box();assert wb
    move_to(page,{'x':wb['x']+wb['width']/2,'y':wb['y']+wb['height']/2})
    assert page.locator('.te-locked-target,.te-neighbor-yield,.te-target-actor').count()==0
    assert not page.evaluate("document.body.classList.contains('te-has-card-target')")
    assert page.locator('[data-inspect-board="qa-target-5"]').evaluate("e=>getComputedStyle(e).visibility")!='hidden'
    assert_geometry_equal(base_geom,geometry(page))
    page.screenshot(path=str(QA/'03_decoy_leave_restored.png'))
    move_to(page,p1)
    assert exposure(page)['targetIid']=='qa-target-3'
    assert_material_actor(page,'qa-target-3')
    page.evaluate("window.GwentDirectManipulation.cancel('exposure-cancel')");page.mouse.up();page.wait_for_timeout(100)
    assert page.locator('.te-locked-target,.te-neighbor-yield,.te-target-actor').count()==0
    assert page.locator('[data-inspect-board="qa-target-3"]').evaluate("e=>getComputedStyle(e).visibility")!='hidden'
    assert_geometry_equal(base_geom,geometry(page))
    results.append({'case':'leave-reenter-cancel','restored':True})

    # 4. Runtime reduced motion preserves unmistakable full-card target identity above
    # the drag proxy but performs no neighbor translation or actor lift animation.
    reset(page,base);page.evaluate('window.GwentDirectManipulation.reduced(true)');start_drag(page)
    rp=safe_target_point(page,'qa-target-3');move_to(page,rp)
    rs=exposure(page);assert rs['targetIid']=='qa-target-3' and rs['reduced'] is True,rs
    assert page.locator('.te-neighbor-yield').count()==0
    assert page.evaluate("document.body.classList.contains('te-reduced')")
    source_transform=page.locator('[data-inspect-board="qa-target-3"]').evaluate("e=>getComputedStyle(e).transform")
    assert source_transform=='none',source_transform
    rtele=assert_material_actor(page,'qa-target-3',reduced=True)
    page.screenshot(path=str(QA/'04_reduced_motion_target_lock.png'))
    page.evaluate("window.GwentDirectManipulation.cancel('reduced-cleanup');window.GwentDirectManipulation.reduced(false)");page.mouse.up();page.wait_for_timeout(90)
    assert page.locator('.te-target-actor').count()==0
    results.append({'case':'reduced-motion','snapshot':rs,'actor':rtele,'sourceTransform':source_transform})

    # 5. A trajectory-only row highlight visually demotes when the 120 ms velocity
    # window expires. Releasing after that pause must still reject with zero mutation.
    single=make_scenario(page,'realms_keira',0);reset(page,single);before=state(page);row_action=action(page,row='ranged');assert row_action
    start_drag(page);tb=target_box(page,row_action);y=tb['y']+tb['height']/2
    inside_x=tb['x']+tb['width']-2
    page.mouse.move(inside_x,y,steps=8);page.wait_for_timeout(28)
    page.mouse.move(tb['x']+tb['width']+28,y,steps=1);page.wait_for_timeout(32)
    intent=page.evaluate('window.GwentDirectManipulation.lastIntent');assert intent and intent['reason']=='trajectory_singular',intent
    assert page.locator('.dm-active-target').count()==1
    page.wait_for_timeout(170)
    assert page.locator('.dm-active-target.te-intent-stale').count()==1
    assert page.locator('.te-locked-target,.te-neighbor-yield,.te-target-actor').count()==0
    stale=exposure(page);assert stale['staleActiveIids'] or page.locator('.dm-active-target.te-intent-stale').count()==1
    page.screenshot(path=str(QA/'05_trajectory_highlight_expired.png'))
    page.mouse.up();wait_idle(page);after=state(page);assert after==before,'expired trajectory release mutated engine state'
    results.append({'case':'trajectory-expiry','intent':intent['reason'],'zeroMutation':True})

    assert not errors,errors
    (QA/'exposure_matrix.json').write_text(json.dumps(results,indent=2))
    ctx.close();browser.close()

print('pass11-target-exposure-ui: material target actor, localized yield, frozen geometry, cleanup, reduced motion, and trajectory expiry passed')

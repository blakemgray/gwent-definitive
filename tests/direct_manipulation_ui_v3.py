import json, os, math
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass10_4a';QA.mkdir(parents=True,exist_ok=True)


def wait_idle(page,timeout=5000):
    page.evaluate('t=>window.GwentDirectManipulation.waitForIdle(t)',timeout);page.wait_for_timeout(35)

def state(page):return page.evaluate('window.__GWENT_PASS10__.getState()')
def reset(page,s):page.evaluate("s=>{window.GwentDirectManipulation.cancel('qa-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s);page.wait_for_timeout(60)
def promote(s,iid):
    hand=s['players']['p1']['hand'];idx=next(i for i,c in enumerate(hand) if c['iid']==iid);hand.append(hand.pop(idx));return s

def target_box(page,a):
    return page.evaluate("""a=>{const d=window.GwentDirectManipulation.normalizeDestination(a);let el=null;if(d.kind==='row')el=document.querySelector(`#match-screen .lane[data-pid="${d.playerId}"][data-row="${d.row}"]`);else if(d.kind==='special')el=document.querySelector(`#match-screen .lane[data-pid="${d.playerId}"][data-row="${d.row}"] .special-slot-wrap`);else if(d.kind==='target')el=document.querySelector(`#match-screen [data-inspect-board="${d.targetIid}"]`);else el=document.querySelector('#match-screen .weather');if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};}""",a)
def action_key(page,a):return page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a)

def visible_point(page,iid):
    pt=page.evaluate("""iid=>{const el=document.querySelector(`#hand .hand-card[data-card-iid="${iid}"]`);if(!el)return null;const r=el.getBoundingClientRect();const ys=[r.y+r.height*.45,r.y+r.height*.25,r.y+r.height*.70];for(const y of ys){for(let x=r.x+2;x<=r.right-2;x+=2){const hit=document.elementFromPoint(x,y);if(hit&&(hit===el||hit.closest?.('.hand-card')===el))return{x,y};}}return null;}""",iid)
    assert pt,f'card {iid} has no exposed hit point';return pt

def tap_play(page,iid,a,shot=None):
    page.locator(f'#hand .hand-card[data-card-iid="{iid}"]').click();assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid',iid)
    target=page.locator(f'[data-dm-action-key="{action_key(page,a)}"]');assert target.count()==1
    if shot:page.screenshot(path=str(QA/shot))
    target.click();wait_idle(page)

def mouse_drag(page,iid,a,shot=None,use_visible_point=False):
    card=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]');cb=card.bounding_box();assert cb;tb=target_box(page,a);assert tb
    if use_visible_point:pt=visible_point(page,iid);sx,sy=pt['x'],pt['y']
    else:sx,sy=cb['x']+cb['width']/2,cb['y']+cb['height']/2
    tx,ty=tb['x']+tb['width']/2,tb['y']+tb['height']/2
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+12,sy-2,steps=2);page.wait_for_timeout(35)
    assert page.locator('.dm-drag-proxy').count()==1,page.evaluate('({phase:window.GwentDirectManipulation.phase,mode:window.GwentDirectManipulation.mode,sel:window.GwentDirectManipulation.selectedIid})')
    assert card.evaluate("e=>e.classList.contains('dm-source-placeholder')")
    page.mouse.move(tx,ty,steps=7);page.wait_for_timeout(45);assert page.locator('.dm-active-target').count()==1
    stats=page.evaluate('window.GwentDirectManipulation.stats');assert stats['maxPointerLagPx']<=7.0,stats
    if shot:page.screenshot(path=str(QA/shot))
    page.mouse.up();wait_idle(page)

def cdp_touch_drag(context,page,iid,a):
    pt=visible_point(page,iid);tb=target_box(page,a);assert tb;sx,sy=pt['x'],pt['y'];tx,ty=tb['x']+tb['width']/2,tb['y']+tb['height']/2
    cdp=context.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':sx,'y':sy,'radiusX':6,'radiusY':6,'force':0.5,'id':1}]})
    for i in range(1,9):
        t=i/8;cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':sx+(tx-sx)*t,'y':sy+(ty-sy)*t,'radiusX':6,'radiusY':6,'force':0.5,'id':1}]});page.wait_for_timeout(18)
    assert page.locator('.dm-drag-proxy').count()==1;assert page.locator('.dm-active-target').count()==1;page.screenshot(path=str(QA/'10_real_touch_drag_over_target.png'));cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});wait_idle(page)

def assert_pack(page,selector,tol=2.3):
    rail=page.locator(selector);rb=rail.bounding_box();assert rb;cards=rail.locator('.unit');boxes=[cards.nth(i).bounding_box() for i in range(cards.count())];boxes=[b for b in boxes if b];assert boxes
    left=min(b['x'] for b in boxes);right=max(b['x']+b['width'] for b in boxes);assert left>=rb['x']-1.25;assert right<=rb['x']+rb['width']+1.25;assert abs((left+right)/2-(rb['x']+rb['width']/2))<=tol

def enter(page):
    page.goto(BASE,wait_until='networkidle');page.locator('#main-screen [data-nav="play-screen"]').click();page.locator('#play-screen #quick-start').click();page.locator('#mulligan-screen #finish-mulligan').click();page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(220)

def ordinary_cards(page):
    return page.evaluate("""()=>{const a=window.__GWENT_PASS10__,s=a.getState(),G=a.engine;return s.players.p1.hand.map(i=>({i,d:G.CARD_DB[i.cardId]})).filter(x=>x.d.type==='unit'&&!x.d.abilities.includes('spy')).map(x=>({iid:x.i.iid,cardId:x.i.cardId,actions:G.legalActions(s,'p1').filter(a=>a.type==='PLAY_CARD'&&a.iid===x.i.iid)})).filter(x=>x.actions.length);}""")

with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);ctx=browser.new_context(viewport={'width':393,'height':852});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    assert page.evaluate("window.GwentDirectManipulation?.version==='10.4A.0'&&window.GwentDirectManipulation.mode==='hybrid'")
    page.evaluate("""()=>{window.__qaAnimationCalls=[];const orig=Element.prototype.animate;Element.prototype.animate=function(f,o){window.__qaAnimationCalls.push({cls:String(this.className||''),duration:typeof o==='number'?o:(o?.duration||0)});return orig.call(this,f,o);};}""")
    base=state(page);base['players']['p2']['passed']=True;base['currentPlayerId']='p1';reset(page,base);ordinary=ordinary_cards(page);assert len(ordinary)>=3;primary=ordinary[0];iid=primary['iid'];base=promote(base,iid);reset(page,base);action=page.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)[0]',iid)

    # Every hand card must retain an exposed hit region even when the hand overlaps.
    for c in base['players']['p1']['hand']:visible_point(page,c['iid'])

    # Selection = play intent; legal targets are explicit and accessible.
    page.locator(f'#hand .hand-card[data-card-iid="{iid}"]').click();assert page.locator('#card-inspector').count()==0;assert page.locator('.dm-selected').count()==1
    legal=page.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)',iid);targets=page.evaluate('window.GwentDirectManipulation.targets()');assert len(legal)>0 and len(targets)==len(legal)
    for t in targets:
        el=page.locator(f'[data-dm-action-key="{t["key"]}"]');assert el.count()==1 and el.get_attribute('data-dm-label') and el.get_attribute('role')=='button'
    page.screenshot(path=str(QA/'01_tap_selected_legal_targets.png'));frozen=state(page);page.keyboard.press('Escape');page.wait_for_timeout(40);assert state(page)==frozen;assert page.locator('.dm-legal-target,.dm-selected').count()==0

    # Tap and drag use one deterministic action path.
    tap_play(page,iid,action,'02_two_tap_selected.png');tap_state=state(page);tx=page.evaluate('window.GwentDirectManipulation.lastTransaction');assert tx['inputMethod']=='tap' and any(e['type']=='CARD_LEAVE_HAND' for e in tx['events']) and any(e['type']=='CARD_ENTER_ROW' for e in tx['events']);assert page.evaluate('window.__qaAnimationCalls.length>0')
    reset(page,base);mouse_drag(page,iid,action,'03_drag_over_legal_target.png');assert state(page)==tap_state;assert page.evaluate('window.GwentDirectManipulation.lastTransaction.inputMethod')=='drag'

    # Also prove an overlapped non-top card can begin drag from its exposed strip.
    reset(page,base);under=next(c for c in ordinary if c['iid']!=iid);under_action=page.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)[0]',under['iid']);under_before=state(page);mouse_drag(page,under['iid'],under_action,'03b_overlap_exposed_strip_drag.png',True);assert state(page)!=under_before

    # Invalid drop returns and mutates nothing.
    reset(page,base);before=state(page);card=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]');cb=card.bounding_box();sx,sy=cb['x']+cb['width']/2,cb['y']+cb['height']/2;page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+14,sy-3,steps=2);page.wait_for_timeout(35);assert page.locator('.dm-drag-proxy,.dm-source-placeholder').count()==2;page.mouse.move(8,45,steps=6);page.wait_for_timeout(45);assert page.locator('.dm-active-target').count()==0;page.screenshot(path=str(QA/'04_invalid_drag_before_return.png'));page.mouse.up();wait_idle(page);assert state(page)==before;assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder,.dm-legal-target').count()==0

    # Preferences.
    page.evaluate("window.GwentDirectManipulation.setMode('tap')");reset(page,base);card=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]');cb=card.bounding_box();page.mouse.move(cb['x']+cb['width']/2,cb['y']+cb['height']/2);page.mouse.down();page.mouse.move(cb['x']+cb['width']/2+32,cb['y']+cb['height']/2-6);page.wait_for_timeout(40);assert page.locator('.dm-drag-proxy').count()==0;page.mouse.up();page.evaluate("window.GwentDirectManipulation.cancel('mode-test')");page.evaluate("window.GwentDirectManipulation.setMode('drag')");reset(page,base);mouse_drag(page,iid,action);page.evaluate("window.GwentDirectManipulation.setMode('hybrid')")

    # Adaptive compositor remains authoritative at 1/3/8/12 final cards.
    for idx,count in enumerate([1,3,8,12],start=5):
        s=json.loads(json.dumps(base));row=action['row'];inst=next(c for c in s['players']['p1']['hand'] if c['iid']==iid);s['players']['p1']['board'][row]=[{'iid':f'qa-density-{count}-{j}','cardId':inst['cardId']} for j in range(count-1)];reset(page,s);a=page.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)[0]',iid);tap_play(page,iid,a);selector=f'#match-screen .lane[data-pid="p1"][data-row="{row}"] .units';assert page.locator(selector+' .unit').count()==count;assert_pack(page,selector);page.screenshot(path=str(QA/f'{idx:02d}_reflow_{count:02d}_cards.png'))

    # Rotation/viewport change cancels transient presentation only.
    reset(page,base);frozen=state(page);card=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]');cb=card.bounding_box();page.mouse.move(cb['x']+cb['width']/2,cb['y']+cb['height']/2);page.mouse.down();page.mouse.move(cb['x']+cb['width']/2+16,cb['y']+cb['height']/2-3);page.wait_for_timeout(35);assert page.locator('.dm-drag-proxy').count()==1;page.set_viewport_size({'width':393,'height':852});page.wait_for_timeout(120);assert page.locator('.dm-drag-proxy,.dm-source-placeholder,.dm-legal-target').count()==0;assert state(page)==frozen;page.mouse.up();page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(100)

    # Reduced motion preserves action and information.
    page.emulate_media(reduced_motion='reduce');page.evaluate('window.GwentDirectManipulation.reduced(null)');reset(page,base);tap_play(page,iid,action);r1=state(page);last=page.evaluate('window.GwentPresentationQueue.lastCompleted');assert last and last['durationMs']<350,last;reset(page,base);mouse_drag(page,iid,action);assert state(page)==r1;page.screenshot(path=str(QA/'09_reduced_motion_final.png'))

    # 64 parity trials over 12 density levels and multiple card identities.
    page.evaluate('window.GwentDirectManipulation.reduced(true)');trials=[]
    for trial in range(64):
        candidate=ordinary[trial%len(ordinary)];trial_iid=candidate['iid'];template=promote(json.loads(json.dumps(base)),trial_iid);reset(page,template);a=page.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)[0]',trial_iid);dest=page.evaluate('a=>window.GwentDirectManipulation.normalizeDestination(a)',a)
        if dest['kind']=='row' and dest['playerId']=='p1':
            inst=next(c for c in template['players']['p1']['hand'] if c['iid']==trial_iid);template['players']['p1']['board'][dest['row']]=[{'iid':f'qa-trial-{trial}-{j}','cardId':inst['cardId']} for j in range(trial%12)]
        reset(page,template);a=page.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)[0]',trial_iid);tap_play(page,trial_iid,a);s1=state(page);reset(page,template);a=page.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)[0]',trial_iid);mouse_drag(page,trial_iid,a);s2=state(page);assert s1==s2,f'parity trial {trial}';trials.append({'trial':trial,'iid':trial_iid,'row':a.get('row'),'density':trial%12,'equal':True})
    (QA/'parity_trials.json').write_text(json.dumps(trials,indent=2));page.evaluate('window.GwentDirectManipulation.reduced(null)');page.emulate_media(reduced_motion='no-preference');stats=page.evaluate('window.GwentDirectManipulation.stats');assert stats['tapCommits']>=70 and stats['dragCommits']>=68,stats;assert stats['invalidDrops']>=1 and stats['errors']==0 and stats['maxPointerLagPx']<=7.0,stats;assert not errors,errors;(QA/'runtime_stats_mouse.json').write_text(json.dumps(stats,indent=2));ctx.close()

    # Native Chromium touch injection exercises touchStart/move/end -> Pointer Events.
    tctx=browser.new_context(viewport={'width':852,'height':393},has_touch=True,is_mobile=True);touch=tctx.new_page();terr=[];touch.on('pageerror',lambda e:terr.append(str(e)));enter(touch);tb=state(touch);tb['players']['p2']['passed']=True;tb['currentPlayerId']='p1';reset(touch,tb);tcards=ordinary_cards(touch);tc=tcards[0];tb=promote(tb,tc['iid']);reset(touch,tb);ta=touch.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)[0]',tc['iid']);expected_base=json.loads(json.dumps(tb));touch.evaluate('a=>window.__GWENT_PASS10__.playAction(a)',ta);expected=state(touch);reset(touch,expected_base);cdp_touch_drag(tctx,touch,tc['iid'],ta);assert state(touch)==expected;assert not terr,terr;(QA/'runtime_stats_touch.json').write_text(json.dumps(touch.evaluate('window.GwentDirectManipulation.stats'),indent=2));tctx.close();browser.close()

print('direct-manipulation-ui-v3: exposed-hit geometry, selection, two-tap, mouse + touch drag, invalid return, reflow, interruption, reduced motion, and 64 parity trials passed')

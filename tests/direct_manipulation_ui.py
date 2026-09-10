import json, os, math
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
qa_dir=ROOT/'qa'/'pass10_4a'
qa_dir.mkdir(parents=True,exist_ok=True)
errors=[]


def wait_idle(page, timeout=4000):
    page.evaluate("timeout=>window.GwentDirectManipulation.waitForIdle(timeout)", timeout)
    page.wait_for_timeout(25)


def dm_state(page):
    return page.evaluate("window.__GWENT_PASS10__.getState()")


def reset_state(page, state):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('qa-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}", state)
    page.wait_for_timeout(45)


def action_key(page, action):
    return page.evaluate("a=>window.GwentDirectManipulation.actionKey(a)", action)


def target_box(page, action):
    return page.evaluate("""a=>{
      const dm=window.GwentDirectManipulation;
      const d=dm.normalizeDestination(a);
      let el=null;
      if(d.kind==='row')el=document.querySelector(`#match-screen .lane[data-pid="${d.playerId}"][data-row="${d.row}"]`);
      else if(d.kind==='special')el=document.querySelector(`#match-screen .lane[data-pid="${d.playerId}"][data-row="${d.row}"] .special-slot-wrap`);
      else if(d.kind==='target')el=document.querySelector(`#match-screen [data-inspect-board="${d.targetIid}"]`);
      else el=document.querySelector('#match-screen .weather');
      if(!el)return null;
      const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};
    }""", action)


def drag_action(page, iid, action, midshot=None):
    card=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]')
    cb=card.bounding_box(); assert cb, 'drag source card missing'
    tb=target_box(page,action); assert tb, f'drag target missing for {action}'
    sx=cb['x']+cb['width']/2; sy=cb['y']+cb['height']/2
    tx=tb['x']+tb['width']/2; ty=tb['y']+tb['height']/2
    page.mouse.move(sx,sy)
    page.mouse.down()
    page.mouse.move(sx+14,sy-3,steps=2)
    page.wait_for_timeout(35)
    assert page.locator('.dm-drag-proxy').count()==1, 'drag proxy missing after threshold'
    assert card.evaluate("el=>el.classList.contains('dm-source-placeholder')"), 'source placeholder missing during drag'
    page.mouse.move(tx,ty,steps=5)
    page.wait_for_timeout(35)
    proxy=page.locator('.dm-drag-proxy').bounding_box(); assert proxy
    intended_x=tx; intended_y=ty
    actual_x=proxy['x']+proxy['width']/2; actual_y=proxy['y']+proxy['height']/2
    assert math.hypot(actual_x-intended_x,actual_y-intended_y) <= 5.0, (actual_x,actual_y,intended_x,intended_y)
    assert page.locator('.dm-active-target').count()==1, 'active destination not emphasized while dragging'
    if midshot: page.screenshot(path=str(qa_dir/midshot))
    page.mouse.up()
    wait_idle(page)


def tap_action(page, iid, action, midshot=None):
    page.locator(f'#hand .hand-card[data-card-iid="{iid}"]').click()
    assert page.evaluate("iid=>window.GwentDirectManipulation.selectedIid===iid",iid), 'tap did not establish selection'
    key=action_key(page,action)
    target=page.locator(f'[data-dm-action-key="{key}"]')
    assert target.count()==1, f'normalized legal destination missing: {key}'
    if midshot: page.screenshot(path=str(qa_dir/midshot))
    target.click()
    wait_idle(page)


def assert_pack(page, selector, tolerance=2.25):
    rail=page.locator(selector); rb=rail.bounding_box(); assert rb
    cards=rail.locator('.unit')
    boxes=[cards.nth(i).bounding_box() for i in range(cards.count())]
    boxes=[b for b in boxes if b]
    assert boxes
    left=min(b['x'] for b in boxes); right=max(b['x']+b['width'] for b in boxes)
    assert left>=rb['x']-1.25, (left,rb)
    assert right<=rb['x']+rb['width']+1.25, (right,rb)
    pack_center=(left+right)/2; rail_center=rb['x']+rb['width']/2
    assert abs(pack_center-rail_center)<=tolerance,(pack_center,rail_center)


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
    if not exe and Path('/usr/bin/chromium').exists(): exe='/usr/bin/chromium'
    kwargs={'args':['--no-sandbox']}
    if exe: kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':393,'height':852},has_touch=True)
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(200)

    assert page.evaluate("!!window.GwentDirectManipulation && window.GwentDirectManipulation.version==='10.4A.0'")
    assert page.evaluate("window.GwentDirectManipulation.mode==='hybrid'")
    assert page.evaluate("!!window.GwentMotionTokens && !!window.GwentPresentationQueue && !!window.GwentPresentationEvents && !!window.GwentFlipLayout")

    # Instrument Web Animations usage without changing behavior.
    page.evaluate("""()=>{
      window.__qaAnimationCalls=[];
      const original=Element.prototype.animate;
      Element.prototype.animate=function(frames,options){
        window.__qaAnimationCalls.push({cls:this.className||'',duration:typeof options==='number'?options:(options?.duration||0)});
        return original.call(this,frames,options);
      };
    }""")

    base=dm_state(page)
    base['players']['p2']['passed']=True;base['currentPlayerId']='p1'
    reset_state(page,base)

    ordinary=page.evaluate("""()=>{
      const a=window.__GWENT_PASS10__,s=a.getState(),G=a.engine;
      return s.players.p1.hand.map(i=>({i,d:G.CARD_DB[i.cardId]}))
        .filter(x=>x.d.type==='unit'&&!x.d.abilities.includes('spy'))
        .map(x=>({iid:x.i.iid,cardId:x.i.cardId,actions:G.legalActions(s,'p1').filter(a=>a.type==='PLAY_CARD'&&a.iid===x.i.iid)}))
        .filter(x=>x.actions.length);
    }""")
    assert len(ordinary)>=3, ordinary
    iid=ordinary[0]['iid']; action=ordinary[0]['actions'][0]

    # First tap means play intent, not inspector. Destinations communicate via shape/text and keyboard focus.
    page.locator(f'#hand .hand-card[data-card-iid="{iid}"]').click()
    assert page.locator('#card-inspector').count()==0, 'first tap incorrectly opened inspector'
    assert page.locator(f'#hand .hand-card[data-card-iid="{iid}"].dm-selected').count()==1
    legal_actions=page.evaluate("iid=>window.GwentDirectManipulation.actionsFor(iid)",iid)
    targets=page.evaluate("window.GwentDirectManipulation.targets()")
    assert len(targets)==len(legal_actions) and len(targets)>0
    assert all(t['key'] in [action_key(page,a) for a in legal_actions] for t in targets)
    assert all(page.locator(f'[data-dm-action-key="{t["key"]}"]').get_attribute('data-dm-label') for t in targets)
    page.screenshot(path=str(qa_dir/'01_tap_selected_legal_targets.png'))

    # Escape cancellation must be complete and mutation-free.
    before_cancel=dm_state(page)
    page.keyboard.press('Escape');page.wait_for_timeout(30)
    assert dm_state(page)==before_cancel
    assert page.evaluate("window.GwentDirectManipulation.selectedIid===null")
    assert page.locator('.dm-legal-target').count()==0

    # Two-tap placement: same engine action and semantic transaction.
    tap_action(page,iid,action,'02_two_tap_selected.png')
    tap_state=dm_state(page)
    tx=page.evaluate("window.GwentDirectManipulation.lastTransaction")
    assert tx['inputMethod']=='tap'
    assert any(e['type']=='CARD_LEAVE_HAND' for e in tx['events'])
    assert any(e['type']=='CARD_ENTER_ROW' for e in tx['events'])
    assert page.evaluate("window.__qaAnimationCalls.length>=1")

    # Reset and direct drag from idle to the exact same action; states must be byte-equivalent.
    reset_state(page,base)
    drag_action(page,iid,action,'03_drag_over_legal_target.png')
    drag_state=dm_state(page)
    assert drag_state==tap_state, 'tap and drag produced different deterministic engine states'
    tx=page.evaluate("window.GwentDirectManipulation.lastTransaction")
    assert tx['inputMethod']=='drag'

    # Invalid drag: source visibly returns and engine state never changes.
    reset_state(page,base)
    invalid_before=dm_state(page)
    card=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]');cb=card.bounding_box();assert cb
    sx=cb['x']+cb['width']/2;sy=cb['y']+cb['height']/2
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+16,sy-4,steps=2);page.wait_for_timeout(30)
    assert page.locator('.dm-source-placeholder').count()==1
    page.mouse.move(8,45,steps=5);page.wait_for_timeout(35)
    assert page.locator('.dm-active-target').count()==0
    page.screenshot(path=str(qa_dir/'04_invalid_drag_before_return.png'))
    page.mouse.up();wait_idle(page)
    assert dm_state(page)==invalid_before
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder,.dm-legal-target').count()==0
    assert page.evaluate("window.GwentDirectManipulation.selectedIid===null")

    # Interaction modes: tap disables drag activation; drag-first still keeps accessible tap fallback.
    page.evaluate("window.GwentDirectManipulation.setMode('tap')")
    reset_state(page,base)
    card=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]');cb=card.bounding_box();
    page.mouse.move(cb['x']+cb['width']/2,cb['y']+cb['height']/2);page.mouse.down();page.mouse.move(cb['x']+cb['width']/2+30,cb['y']+cb['height']/2-8);page.wait_for_timeout(30)
    assert page.locator('.dm-drag-proxy').count()==0
    page.mouse.up();page.wait_for_timeout(25)
    page.evaluate("window.GwentDirectManipulation.cancel('mode-test')")
    page.evaluate("window.GwentDirectManipulation.setMode('drag')")
    reset_state(page,base)
    drag_action(page,iid,action)
    page.evaluate("window.GwentDirectManipulation.setMode('hybrid')")

    # Density trials: landing into 1/3/8/12-card rows stays centered and edge-safe while the row reflows.
    for idx,final_count in enumerate([1,3,8,12],start=5):
        s=json.loads(json.dumps(base))
        chosen=next(x for x in ordinary if x['iid']==iid)
        row=action['row']
        source_card=next(c for c in s['players']['p1']['hand'] if c['iid']==iid)
        s['players']['p1']['board'][row]=[{'iid':f'qa-density-{final_count}-{j}','cardId':source_card['cardId']} for j in range(final_count-1)]
        reset_state(page,s)
        current_action=page.evaluate("iid=>window.GwentDirectManipulation.actionsFor(iid)[0]",iid)
        tap_action(page,iid,current_action)
        selector=f'#match-screen .lane[data-pid="p1"][data-row="{row}"] .units'
        assert page.locator(selector+' .unit').count()==final_count
        assert_pack(page,selector)
        page.screenshot(path=str(qa_dir/f'{idx:02d}_reflow_{final_count:02d}_cards.png'))

    # Viewport change while actively dragging is a hard cancel: no mutation, no orphan proxy, no stale selection.
    reset_state(page,base);rotation_before=dm_state(page)
    card=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]');cb=card.bounding_box();
    page.mouse.move(cb['x']+cb['width']/2,cb['y']+cb['height']/2);page.mouse.down();page.mouse.move(cb['x']+cb['width']/2+18,cb['y']+cb['height']/2-4);page.wait_for_timeout(30)
    assert page.locator('.dm-drag-proxy').count()==1
    page.set_viewport_size({'width':393,'height':852});page.wait_for_timeout(100)
    assert page.locator('.dm-drag-proxy,.dm-source-placeholder,.dm-legal-target').count()==0
    assert page.evaluate("window.GwentDirectManipulation.selectedIid===null")
    assert dm_state(page)==rotation_before
    page.mouse.up();page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(100)

    # Reduced motion preserves both play paths and shortens nonessential travel.
    page.emulate_media(reduced_motion='reduce')
    page.evaluate("window.GwentDirectManipulation.reduced(null)")
    reset_state(page,base)
    tap_action(page,iid,action)
    reduced_tap=dm_state(page)
    lastq=page.evaluate("window.GwentPresentationQueue.lastCompleted")
    assert lastq and lastq['durationMs']<350,lastq
    reset_state(page,base)
    drag_action(page,iid,action)
    assert dm_state(page)==reduced_tap
    page.screenshot(path=str(qa_dir/'09_reduced_motion_final.png'))

    # Immense parity trial: 64 independent densities/cards, each executed once by tap and once by direct drag.
    # Reduced motion keeps CI duration reasonable while exercising the identical production action path.
    page.evaluate("window.GwentDirectManipulation.reduced(true)")
    trial_results=[]
    for trial in range(64):
        template=json.loads(json.dumps(base))
        candidate=ordinary[trial%len(ordinary)]
        trial_iid=candidate['iid']
        # Resolve current action from the reset state; vary destination-row occupancy 0..11.
        reset_state(page,template)
        trial_action=page.evaluate("iid=>window.GwentDirectManipulation.actionsFor(iid)[0]",trial_iid)
        assert trial_action
        dest=page.evaluate("a=>window.GwentDirectManipulation.normalizeDestination(a)",trial_action)
        if dest['kind']=='row' and dest['playerId']=='p1':
            inst=next(c for c in template['players']['p1']['hand'] if c['iid']==trial_iid)
            template['players']['p1']['board'][dest['row']]=[{'iid':f'qa-trial-{trial}-{j}','cardId':inst['cardId']} for j in range(trial%12)]
        reset_state(page,template)
        trial_action=page.evaluate("iid=>window.GwentDirectManipulation.actionsFor(iid)[0]",trial_iid)
        tap_action(page,trial_iid,trial_action)
        a_state=dm_state(page)
        reset_state(page,template)
        trial_action=page.evaluate("iid=>window.GwentDirectManipulation.actionsFor(iid)[0]",trial_iid)
        drag_action(page,trial_iid,trial_action)
        b_state=dm_state(page)
        assert a_state==b_state,f'parity trial {trial} diverged'
        trial_results.append({'trial':trial,'iid':trial_iid,'row':trial_action.get('row'),'density':trial%12,'equal':True})
    (qa_dir/'parity_trials.json').write_text(json.dumps(trial_results,indent=2))
    page.evaluate("window.GwentDirectManipulation.reduced(null)")
    page.emulate_media(reduced_motion='no-preference')

    stats=page.evaluate("window.GwentDirectManipulation.stats")
    assert stats['tapCommits']>=70 and stats['dragCommits']>=67,stats
    assert stats['invalidDrops']>=1
    assert stats['errors']==0,stats
    assert stats['maxPointerLagPx']<=6.0,stats
    assert not errors,errors
    (qa_dir/'runtime_stats.json').write_text(json.dumps(stats,indent=2))
    browser.close()

print('direct-manipulation-ui: hybrid tap/drag, parity, interruption, reduced-motion, 64-trial density stress passed')

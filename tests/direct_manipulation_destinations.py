import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass10_4a'/'destinations';QA.mkdir(parents=True,exist_ok=True)


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


def make_scenario(page,card_id,decoy=False):
    return page.evaluate("""({cardId,decoy})=>{
      const api=window.__GWENT_PASS10__,G=api.engine,s=api.getState();
      for(const pid of ['p1','p2']){
        for(const row of G.ROWS){s.players[pid].board[row]=[];s.players[pid].board.special[row]=null;s.players[pid].board.leaderHorn[row]=false;}
        s.players[pid].passed=false;
      }
      s.weather={close:false,ranged:false,siege:false};s.weatherCards=[];s.pendingChoice=null;s.pendingResume=null;s.winner=null;s.currentPlayerId='p1';
      s.players.p2.passed=true;
      s.players.p1.hand=[{iid:'qa-direct-card',cardId}];
      if(decoy)s.players.p1.board.close=[{iid:'qa-decoy-target',cardId:'realms_keira'}];
      return s;
    }""",{'cardId':card_id,'decoy':decoy})


def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('destination-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s)
    page.wait_for_timeout(55)


def pick_action(page,iid,row=None,target=None):
    return page.evaluate("""({iid,row,target})=>{
      const xs=window.GwentDirectManipulation.actionsFor(iid);
      return xs.find(a=>(row==null||a.row===row)&&(target==null||a.targetIid===target))||null;
    }""",{'iid':iid,'row':row,'target':target})


def target_locator(page,action):
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',action)
    return page.locator(f'[data-dm-action-key="{key}"]')


def tap_commit(page,iid,action,shot=None):
    page.locator(f'#hand [data-card-iid="{iid}"]').click()
    assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid',iid)
    loc=target_locator(page,action);assert loc.count()==1
    if shot:page.screenshot(path=str(QA/shot))
    loc.click();wait_idle(page)
    return state(page),page.evaluate('window.GwentDirectManipulation.lastTransaction')


def drag_commit(page,iid,action,shot=None):
    card=page.locator(f'#hand [data-card-iid="{iid}"]');box=card.bounding_box();assert box
    sx,sy=box['x']+box['width']/2,box['y']+box['height']*.48
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+13,sy-2,steps=2);page.wait_for_timeout(28)
    assert page.locator('.dm-drag-proxy').count()==1
    assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid',iid)
    loc=target_locator(page,action);assert loc.count()==1
    tb=loc.bounding_box();assert tb
    tx,ty=tb['x']+tb['width']/2,tb['y']+tb['height']/2
    page.mouse.move(tx,ty,steps=8);page.wait_for_timeout(38)
    assert page.locator('.dm-active-target').count()==1
    if shot:page.screenshot(path=str(QA/shot))
    page.mouse.up();wait_idle(page)
    return state(page),page.evaluate('window.GwentDirectManipulation.lastTransaction')


def assert_parity(page,name,baseline,action,expected_dest,shot_prefix=None):
    iid=action['iid']
    reset(page,baseline)
    # Destination semantics are a pre-commit intent. Capture and verify while the
    # source card is still in hand; weather/special cards legitimately move into
    # storage shapes that are not part of cardDefForIid's source lookup afterward.
    dest=page.evaluate('a=>window.GwentDirectManipulation.normalizeDestination(a)',action)
    assert dest is not None,f'{name}: destination missing before commit'
    for k,v in expected_dest.items():assert dest.get(k)==v,f'{name}: destination {k} expected {v}, got {dest}'
    tap_state,tap_tx=tap_commit(page,iid,action,f'{shot_prefix}_tap_selected.png' if shot_prefix else None)
    reset(page,baseline)
    drag_state,drag_tx=drag_commit(page,iid,action,f'{shot_prefix}_drag_target.png' if shot_prefix else None)
    assert tap_state==drag_state,f'{name}: tap/drag engine-state mismatch'
    assert tap_tx['action']==drag_tx['action']==action,f'{name}: transaction action mismatch'
    assert tap_tx['inputMethod']=='tap' and drag_tx['inputMethod']=='drag'
    return {'name':name,'destination':dest,'events':[e['type'] for e in drag_tx['events']]}


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);ctx=browser.new_context(viewport={'width':852,'height':393});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    api=page.evaluate("({dm:window.GwentDirectManipulation.version,gate:window.GwentInteractionTurnGate?.version})")
    assert api=={'dm':'10.4A.0','gate':'10.4A.0'},api
    results=[]

    # Ordinary own-row unit.
    base=make_scenario(page,'realms_keira');reset(page,base);a=pick_action(page,'qa-direct-card','ranged');assert a
    results.append(assert_parity(page,'ordinary-row',base,a,{'kind':'row','playerId':'p1','row':'ranged'},'01_ordinary'))

    # Spy crosses ownership boundary to opponent siege row.
    base=make_scenario(page,'realms_thaler');reset(page,base);a=pick_action(page,'qa-direct-card','siege');assert a
    results.append(assert_parity(page,'spy-opponent-row',base,a,{'kind':'row','playerId':'p2','row':'siege'},'02_spy'))

    # Weather uses central weather band.
    base=make_scenario(page,'weather_frost');reset(page,base);a=pick_action(page,'qa-direct-card');assert a
    results.append(assert_parity(page,'weather-zone',base,a,{'kind':'weather'},'03_weather'))

    # Global special (Scorch) uses global play zone and resolves identically.
    base=make_scenario(page,'special_scorch');reset(page,base);a=pick_action(page,'qa-direct-card');assert a
    results.append(assert_parity(page,'global-special',base,a,{'kind':'global'},'04_scorch'))

    # Commander's Horn exposes each unoccupied row special socket independently.
    for idx,row in enumerate(['close','ranged','siege'],start=5):
        base=make_scenario(page,'special_horn');reset(page,base);a=pick_action(page,'qa-direct-card',row);assert a
        results.append(assert_parity(page,f'horn-{row}',base,a,{'kind':'special','playerId':'p1','row':row},f'{idx:02d}_horn_{row}' if row=='close' else None))

    # Decoy targets an exact legal board unit, not a row inferred by UI metadata.
    base=make_scenario(page,'special_decoy',True);reset(page,base);a=pick_action(page,'qa-direct-card',target='qa-decoy-target');assert a
    results.append(assert_parity(page,'decoy-exact-target',base,a,{'kind':'target','playerId':'p1','targetIid':'qa-decoy-target'},'06_decoy'))

    # Agile unit must expose two independent engine-provided own-row choices.
    agile=page.evaluate("""()=>Object.values(window.__GWENT_PASS10__.engine.CARD_DB).find(d=>d.type==='unit'&&d.row==='agile'&&!d.abilities.includes('spy'))?.id||null""")
    assert agile,'no agile unit found in catalog'
    for row in ['close','ranged']:
        base=make_scenario(page,agile);reset(page,base);actions=page.evaluate("iid=>window.GwentDirectManipulation.actionsFor(iid)",'qa-direct-card');assert len(actions)==2,actions
        a=next(x for x in actions if x.get('row')==row)
        results.append(assert_parity(page,f'agile-{row}',base,a,{'kind':'row','playerId':'p1','row':row}))

    # No destination may be UI-invented: selected decoration count equals unique legal actions.
    base=make_scenario(page,'special_horn');reset(page,base);page.locator('#hand [data-card-iid="qa-direct-card"]').click()
    acts=page.evaluate("window.GwentDirectManipulation.actionsFor('qa-direct-card')");targets=page.evaluate('window.GwentDirectManipulation.targets()')
    assert len(acts)==3 and len(targets)==3
    assert sorted(t['action']['row'] for t in targets)==['close','ranged','siege']
    page.keyboard.press('Escape')

    assert not errors,errors
    (QA/'destination_matrix.json').write_text(json.dumps(results,indent=2))
    ctx.close();browser.close()

print(f'direct-manipulation-destinations: {len(results)} destination variants × tap/drag parity passed (row, opponent spy row, weather, global, 3 special sockets, exact target, agile rows)')

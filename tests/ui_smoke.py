import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
contract=json.loads((ROOT/'config/battlefield-geometry.json').read_text())
limits=contract['canonical_limits']
qa_dir=ROOT/'qa'/'pass10_3'
qa_dir.mkdir(parents=True,exist_ok=True)
errors=[]


def assert_centered(inner, outer, tolerance, label):
    ic=inner['x']+inner['width']/2
    oc=outer['x']+outer['width']/2
    assert abs(ic-oc)<=tolerance, f'{label} center drift: {ic} vs {oc}'


def assert_pack(page, rail_selector, card_selector, tolerance, label):
    rail=page.locator(rail_selector)
    rb=rail.bounding_box(); assert rb, f'{label} rail missing'
    cards=rail.locator(card_selector)
    boxes=[cards.nth(i).bounding_box() for i in range(cards.count())]
    boxes=[b for b in boxes if b]
    if not boxes: return
    left=min(b['x'] for b in boxes); right=max(b['x']+b['width'] for b in boxes)
    assert left>=rb['x']-limits['card_edge_tolerance_px'], f'{label} first card clipped: {left} < {rb["x"]}'
    assert right<=rb['x']+rb['width']+limits['card_edge_tolerance_px'], f'{label} last card clipped: {right} > {rb["x"]+rb["width"]}'
    pack={'x':left,'width':right-left}
    assert_centered(pack,rb,tolerance,label)


def set_row_count(page,pid,row,count):
    page.evaluate("""({pid,row,count})=>{
      const api=window.__GWENT_PASS10__;
      const s=api.getState();
      const p=s.players[pid];
      const pool=[...p.hand,...p.deck,...p.grave];
      const fallback={iid:'qa-base',cardId:pid==='p1'?'realms_keira':'monsters_grave_hag'};
      const source=pool.length?pool:[fallback];
      p.board[row]=Array.from({length:count},(_,i)=>({...source[i%source.length],iid:`qa-${pid}-${row}-${count}-${i}`}));
      api.setStateForQA(s);
    }""",{'pid':pid,'row':row,'count':count})
    page.wait_for_timeout(100)


def set_balanced_state(page):
    page.evaluate("""()=>{
      const api=window.__GWENT_PASS10__;
      const s=api.getState();
      const counts={p2:{siege:3,ranged:4,close:2},p1:{close:4,ranged:3,siege:5}};
      for(const pid of ['p1','p2']){
        const p=s.players[pid];
        const pool=[...p.hand,...p.deck,...p.grave];
        for(const row of ['close','ranged','siege']){
          p.board[row]=Array.from({length:counts[pid][row]},(_,i)=>({...pool[i%pool.length],iid:`qa-balanced-${pid}-${row}-${i}`}));
        }
      }
      api.setStateForQA(s);
    }""")
    page.wait_for_timeout(100)


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
    if not exe and Path('/usr/bin/chromium').exists(): exe='/usr/bin/chromium'
    kwargs={'args':['--no-sandbox']}
    if exe: kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':393,'height':852})
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle')

    assert page.locator('#main-screen.active').count()==1
    dev_entry=page.locator('#main-screen [data-nav="profile-screen"]')
    assert dev_entry.count()==1 and dev_entry.is_hidden(), 'developer entry visible by default'
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    assert page.locator('#mulligan-screen.active').count()==1
    assert page.locator('#mulligan-screen [data-mulligan]').count()==10
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393})
    page.wait_for_timeout(180)

    assert page.locator('#match-screen.active').count()==1
    assert page.evaluate("!!window.GwentBattlefieldUX && window.GwentBattlefieldUX.contractVersion==='2.0'")
    lanes=page.locator('#match-screen .lane')
    assert lanes.count()==6
    got=[(lanes.nth(i).get_attribute('data-pid'),lanes.nth(i).get_attribute('data-row')) for i in range(6)]
    assert got==[('p2','siege'),('p2','ranged'),('p2','close'),('p1','close'),('p1','ranged'),('p1','siege')],got

    board=page.locator('#board').bounding_box(); assert board
    assert abs(board['width']-limits['board_width_target'])<=limits['board_width_tolerance_px'],board
    assert_centered(board,{'x':0,'width':852},limits['board_center_tolerance_px'],'battlefield')
    for i in range(6):
        box=lanes.nth(i).bounding_box(); assert box
        assert limits['combat_row_height_min']<=box['height']<=limits['combat_row_height_max'],box
        rail=lanes.nth(i).locator('.units').bounding_box(); assert rail
        assert rail['width']<=limits['unit_rail_width_max']+1,rail

    # Default ten-card hand: every edge protected and the whole pack centered.
    assert page.locator('#hand .hand-card').count()==10
    assert_pack(page,'#hand','.hand-card',limits['hand_pack_center_tolerance_px'],'opening hand')
    page.screenshot(path=str(qa_dir/'01_opening_battlefield.png'))

    # Sparse-to-swarm density matrix. These are the row states that exposed the old left bias/cutoff behavior.
    for idx,count in enumerate(contract['stress_row_card_counts'],start=2):
        set_row_count(page,'p1','close',count)
        assert page.locator('#match-screen .lane[data-pid="p1"][data-row="close"] .unit').count()==count
        assert_pack(page,'#match-screen .lane[data-pid="p1"][data-row="close"] .units','.unit',limits['card_pack_center_tolerance_px'],f'{count}-card row')
        page.screenshot(path=str(qa_dir/f'{idx:02d}_row_{count:02d}_cards.png'))

    # Six-row occupied state validates scan hierarchy rather than a single hero screenshot.
    set_balanced_state(page)
    for i in range(6):
        assert lanes.nth(i).locator('.unit').count()>0
        rail=lanes.nth(i).locator('.units')
        assert_pack(page,f'#match-screen .lane:nth-of-type({i+1}) .units','.unit',limits['card_pack_center_tolerance_px'],f'balanced row {i}')
    page.screenshot(path=str(qa_dir/'07_all_six_rows_balanced.png'))

    # Weather belongs to affected rows and summary band simultaneously.
    page.evaluate("""()=>{const a=window.__GWENT_PASS10__;const s=a.getState();s.weather={close:true,ranged:true,siege:true};a.setStateForQA(s)}""")
    page.wait_for_timeout(100)
    assert page.locator('#match-screen .lane.weathered').count()==6
    page.screenshot(path=str(qa_dir/'08_all_weather.png'))

    # Persistent pass state must survive outside transient toast messaging.
    page.evaluate("""()=>{const a=window.__GWENT_PASS10__;const s=a.getState();s.players.p2.passed=true;s.currentPlayerId='p1';a.setStateForQA(s)}""")
    page.wait_for_timeout(100)
    assert page.locator('#matchline [data-combatant="p2"] .pass-chip').is_visible()
    assert 'YOUR TURN' in page.locator('#matchline .turn-pill').inner_text()
    page.screenshot(path=str(qa_dir/'09_opponent_passed.png'))

    # Late-game three-card hand must remain centered instead of sticking to an edge.
    page.evaluate("""()=>{const a=window.__GWENT_PASS10__;const s=a.getState();s.players.p1.hand=s.players.p1.hand.slice(0,3);a.setStateForQA(s)}""")
    page.wait_for_timeout(100)
    assert page.locator('#hand .hand-card').count()==3
    assert_pack(page,'#hand','.hand-card',limits['hand_pack_center_tolerance_px'],'three-card hand')
    page.screenshot(path=str(qa_dir/'10_three_card_hand.png'))

    # Inspector is deliberately narrower than the old 56–64vw panel so battlefield context remains visible.
    page.locator('#hand .hand-card').first.click()
    page.wait_for_timeout(80)
    inspector=page.locator('#card-inspector').bounding_box(); assert inspector
    assert inspector['width']<=852*.43,inspector
    page.screenshot(path=str(qa_dir/'11_context_preserving_inspector.png'))
    page.locator('#overlay-root [data-close-overlay]').first.click()

    # Save/restore remains intact after the structural re-parenting of leader and counts.
    saved=page.evaluate("localStorage.getItem('gwent-definitive-match-v1')")
    assert saved and json.loads(saved)['schema']==1
    page.reload(wait_until='domcontentloaded')
    page.set_viewport_size({'width':393,'height':852})
    assert page.locator('#main-screen #continue-match').is_visible(),'continue match should be visible after reload'
    page.locator('#main-screen #continue-match').click()
    page.set_viewport_size({'width':852,'height':393}); page.wait_for_timeout(120)
    assert page.locator('#match-screen.active').count()==1
    assert page.locator('#player-left #leader-button').count()==1
    assert page.locator('#player-left #counts').count()==1

    # Developer controls stay gated.
    page.evaluate("localStorage.removeItem('gwent-definitive-match-v1')")
    page.locator('#match-screen #match-menu').click(); page.set_viewport_size({'width':393,'height':852})
    page.locator('#main-screen [data-nav="settings-screen"]').click(); page.locator('#settings-screen #developer-mode').check()
    page.locator('#settings-screen [data-nav="main-screen"]').click()
    assert dev_entry.is_visible(),'developer entry should appear when enabled'
    assert not errors,errors
    browser.close()

print('ui-smoke: Pass 10.3 battlefield v2, density matrix, centering, pass state, inspector, save/restore passed')

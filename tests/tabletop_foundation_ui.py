"""Normal-path evidence for persistent card DOM and presentation-only poses.

The legacy-mode control must fail the exact same identity oracle that the
opt-in foundation passes. No test replaces or injects authoritative match state.
"""
import json
import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('GWENT_TEST_URL') or (ROOT / 'index.html').as_uri()
QA = Path(os.environ.get('GWENT_QA_DIR', str(ROOT.parent / 'evidence' / 'tabletop-foundation')))
QA.mkdir(parents=True, exist_ok=True)


def mode_url(enabled):
    parts = urlsplit(BASE)
    query = [(key, value) for key, value in parse_qsl(parts.query) if key != 'tabletop']
    if enabled:
        query.append(('tabletop', '1'))
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def enter(page, enabled):
    page.goto(mode_url(enabled), wait_until='networkidle')
    # Configure the normal opponent scheduler; do not manufacture engine state.
    page.evaluate("document.querySelector('#auto-bot').checked=false")
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.wait_for_function('!!window.__GWENT_PASS11__.getState()')
    page.evaluate('window.GwentBattlefieldUX.reconcile()')
    frame(page)


def frame(page):
    page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')


def wait_idle(page):
    page.evaluate('window.GwentDirectManipulation.waitForIdle(12000)')
    page.wait_for_function('!window.GwentPresentationQueue.busy && !document.body.dataset.gcStage')
    frame(page)


def capture_nodes(page):
    return page.evaluate("""()=>{
      const cards=[...document.querySelectorAll('#hand [data-card-iid],#board [data-inspect-board]')];
      window.__qaFoundationNodes=new Map(cards.map(el=>[el.dataset.cardIid||el.dataset.inspectBoard,{el,img:el.querySelector('img')} ]));
      return cards.map(el=>({iid:el.dataset.cardIid||el.dataset.inspectBoard,zone:el.closest('#hand')?'hand':'board'}));
    }""")


def identity_result(page):
    return page.evaluate("""()=>{
      const now=new Map([...document.querySelectorAll('#hand [data-card-iid],#board [data-inspect-board]')].map(el=>[el.dataset.cardIid||el.dataset.inspectBoard,el]));
      return [...window.__qaFoundationNodes].filter(([iid])=>now.has(iid)).map(([iid,old])=>({
        iid,sameNode:old.el===now.get(iid),sameImage:old.img===now.get(iid).querySelector('img'),
        zone:now.get(iid).closest('#hand')?'hand':'board'
      }));
    }""")


def ordinary_action(page, excluded_row=None):
    action = page.evaluate("""excludedRow=>{
      const api=window.__GWENT_PASS11__,s=api.getState(),G=api.engine;
      const candidates=G.legalActions(s,'p1').filter(a=>{
        if(a.type!=='PLAY_CARD')return false;
        const inst=s.players.p1.hand.find(i=>i.iid===a.iid),d=inst&&G.CARD_DB[inst.cardId];
        return d?.type==='unit'&&!d.abilities.includes('spy')&&!d.abilities.includes('medic')&&(!excludedRow||a.row!==excludedRow);
      });
      // The normal opponent may Scorch a lone non-Hero. Use a legal opening
      // Hero as the pose anchor so the next commit leaves that card on board.
      return candidates.find(a=>G.CARD_DB[s.players.p1.hand.find(i=>i.iid===a.iid).cardId].abilities.includes('hero'))||candidates[0]||null;
    }""", excluded_row)
    assert action, 'normal opening hand contains no eligible board unit'
    return action


def tap_play(page, action):
    page.locator(f'#hand [data-card-iid="{action["iid"]}"]').click()
    assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid', action['iid'])
    key = page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)', action)
    page.locator(f'[data-dm-action-key="{key}"]').click()
    wait_idle(page)


def drag_play(page, action):
    card = page.locator(f'#hand [data-card-iid="{action["iid"]}"]')
    source = card.bounding_box()
    assert source, 'normal drag source is missing'
    start_x, start_y = source['x'] + source['width'] / 2, source['y'] + source['height'] * .48
    page.mouse.move(start_x, start_y)
    page.mouse.down()
    page.mouse.move(start_x + 14, start_y - 2, steps=2)
    page.wait_for_function('!!document.querySelector(".dm-drag-proxy")')
    key = page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)', action)
    target = page.locator(f'[data-dm-action-key="{key}"]')
    bounds = target.bounding_box()
    assert bounds, 'normal drag legal destination is missing'
    page.mouse.move(bounds['x'] + bounds['width'] / 2, bounds['y'] + bounds['height'] / 2, steps=7)
    frame(page)
    assert target.evaluate('el=>el.classList.contains("dm-active-target")'), 'normal drag did not resolve semantic destination'
    page.mouse.up()
    wait_idle(page)


def state_and_save(page):
    return page.evaluate("()=>({state:window.__GWENT_PASS11__.getState(),save:window.GwentStorage.readMatch()})")


def check_legacy_control(browser):
    context = browser.new_context(viewport={'width': 852, 'height': 393}, device_scale_factor=3, has_touch=True)
    page = context.new_page()
    enter(page, False)
    assert not page.evaluate('!!window.GwentTabletopRenderer?.enabled')
    capture_nodes(page)
    action = ordinary_action(page)
    tap_play(page, action)
    identity = identity_result(page)
    assert identity and any(not item['sameNode'] for item in identity), 'legacy control unexpectedly passes stable-node oracle'
    assert any(item['iid'] == action['iid'] and not item['sameNode'] for item in identity), 'control does not expose hand-to-board replacement'
    context.close()
    return {'mode': 'legacy-control', 'identityOracle': 'expected-failure', 'survivors': identity}


def check_foundation(browser, name):
    context = browser.new_context(viewport={'width': 852, 'height': 393}, device_scale_factor=3, has_touch=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    enter(page, True)
    assert page.evaluate('window.GwentTabletopRenderer.enabled && window.GwentTabletopScene.enabled')
    capture_nodes(page)
    action = ordinary_action(page)
    tap_play(page, action)
    player_identity = identity_result(page)
    assert player_identity and all(item['sameNode'] and item['sameImage'] for item in player_identity), player_identity
    assert any(item['iid'] == action['iid'] and item['zone'] == 'board' for item in player_identity), 'played iid did not retain its hand node on board'
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder').count() == 0
    card = page.locator(f'#board [data-inspect-board="{action["iid"]}"]')
    assert card.is_visible() and card.evaluate("el=>getComputedStyle(el).visibility==='visible'"), 'settled card is still hidden after actor handoff'

    before_pose = state_and_save(page)
    pose = page.evaluate('iid=>window.GwentTabletopScene.getPose(iid)', action['iid'])
    assert pose and pose['width'] > 0 and pose['height'] > 0, pose
    requested = {'x': pose['x'] + 5, 'y': pose['y']}
    page.evaluate('arg=>window.GwentTabletopScene.setPose(arg.iid,arg.pose)', {'iid': action['iid'], 'pose': requested})
    frame(page)
    assert state_and_save(page) == before_pose, 'setPose changed authoritative engine or persisted match'
    placed = page.evaluate('iid=>window.GwentTabletopScene.getPose(iid)', action['iid'])
    assert placed['userPlaced'] and abs(placed['x'] - requested['x']) < .1 and abs(placed['y'] - requested['y']) < .1, placed
    page.evaluate('()=>{for(let i=0;i<4;i++)window.GwentBattlefieldUX.reconcile();}')
    frame(page)
    retained = page.evaluate('iid=>window.GwentTabletopScene.getPose(iid)', action['iid'])
    assert abs(retained['x'] - placed['x']) < .1 and abs(retained['y'] - placed['y']) < .1, 'legacy reconciler overwrote scene-owned pose'
    assert card.evaluate('(el,p)=>Math.abs(parseFloat(el.style.left)-p.x)<.1&&Math.abs(parseFloat(el.style.top)-p.y)<.1', placed), 'DOM final geometry disagrees with scene owner'

    capture_nodes(page)
    state_before_bot = page.evaluate('window.__GWENT_PASS11__.getState()')
    assert state_before_bot['currentPlayerId'] == 'p2', state_before_bot
    # Invoke the existing canonical normal-opponent path, never QA state injection.
    page.evaluate('window.__GWENT_PASS11__.botMove()')
    frame(page)
    wait_idle(page)
    state_after_bot = page.evaluate('window.__GWENT_PASS11__.getState()')
    assert state_after_bot != state_before_bot, 'normal opponent path did not commit'
    bot_identity = identity_result(page)
    assert bot_identity and all(item['sameNode'] and item['sameImage'] for item in bot_identity), bot_identity
    retained_after_bot = page.evaluate('iid=>window.GwentTabletopScene.getPose(iid)', action['iid'])
    assert retained_after_bot and abs(retained_after_bot['x'] - placed['x']) < .1 and abs(retained_after_bot['y'] - placed['y']) < .1, 'unrelated opponent commit lost physical placement'
    assert page.evaluate('window.GwentStorage.validateState(window.__GWENT_PASS11__.getState())')

    # An unrelated-territory play traverses the actual hand drag path. The
    # adaptive territories may resize; the manual normalized pose must survive.
    # Same-territory contact displacement is covered by tabletop-motion-ui.js.
    capture_nodes(page)
    anchor_before_drag = page.evaluate('iid=>window.GwentTabletopScene.getPose(iid)', action['iid'])
    drag_action = ordinary_action(page, action['row'])
    expected_drag = page.evaluate('a=>window.__GWENT_PASS11__.engine.playCard(window.__GWENT_PASS11__.getState(),a)', drag_action)
    drag_play(page, drag_action)
    assert page.evaluate('window.__GWENT_PASS11__.getState()') == expected_drag, 'normal drag changed canonical engine outcome'
    drag_identity = identity_result(page)
    assert drag_identity and all(item['sameNode'] and item['sameImage'] for item in drag_identity), drag_identity
    assert any(item['iid'] == drag_action['iid'] and item['zone'] == 'board' for item in drag_identity), 'drag did not preserve hand-to-board body'
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder').count() == 0
    retained_after_drag = page.evaluate('iid=>window.GwentTabletopScene.getPose(iid)', action['iid'])
    expected_x = anchor_before_drag['u'] * max(0, retained_after_drag['railWidth'] - retained_after_drag['width'])
    expected_y = anchor_before_drag['v'] * max(0, retained_after_drag['railHeight'] - retained_after_drag['height'])
    assert retained_after_drag['userPlaced'] and abs(retained_after_drag['x'] - expected_x) < .1 and abs(retained_after_drag['y'] - expected_y) < .1, 'unrelated hand drag repacked the existing physical arrangement'

    # Viewport changes may recompose presentation, never change rules or save.
    before_resize = state_and_save(page)
    page.set_viewport_size({'width': 740, 'height': 360})
    frame(page)
    page.evaluate('window.GwentBattlefieldUX.reconcile()')
    frame(page)
    assert state_and_save(page) == before_resize, 'viewport resize mutated engine or persistence'
    assert page.evaluate("""()=>window.GwentTabletopScene.metrics().poses.every(p=>p.x>=-.1&&p.y>=-.1&&p.x+p.width<=p.railWidth+.1&&p.y+p.height<=p.railHeight+.1)"""), 'resized scene placed a body outside its rail'
    assert page.evaluate('iid=>window.GwentTabletopScene.getPose(iid).userPlaced', action['iid']), 'resize erased manual-pose identity'
    page.set_viewport_size({'width': 852, 'height': 393})
    frame(page)

    assert not errors, errors
    snapshot = page.evaluate('window.GwentTabletopRenderer.snapshot()')
    assert snapshot['errors'] == 0, snapshot
    page.wait_for_function("""()=>{
      const images=[...document.querySelectorAll('#hand [data-card-iid] img,#board [data-inspect-board] img')];
      return images.length>0&&images.every(image=>image.complete&&image.naturalWidth>0&&image.naturalHeight>0);
    }""", timeout=15000)
    page.screenshot(path=str(QA / f'{name}-normal-play-foundation.png'))

    # Starting a new normal match is a new registry lifetime, even when the
    # deterministic engine reuses an iid such as c19 in its opening hand.
    card.evaluate('el=>{window.__qaOldFoundationCard=el;}')
    generation = snapshot['generation']
    page.evaluate("window.__GWENT_PASS11__.go('main-screen')")
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    frame(page)
    assert page.evaluate('window.GwentTabletopRenderer.snapshot().generation') > generation, 'fresh match reused prior registry generation'
    assert page.evaluate('!window.__qaOldFoundationCard.isConnected'), 'fresh match retained prior physical body'
    assert page.locator('#board [data-inspect-board]').count() == 0
    assert page.evaluate('window.GwentTabletopScene.metrics().poses.every(p=>!p.userPlaced)'), 'fresh match retained prior user placement'
    context.close()
    return {'browser': name, 'playerIdentity': player_identity, 'botIdentity': bot_identity, 'dragIdentity': drag_identity, 'requestedPose': requested, 'retainedPose': retained_after_drag, 'registry': snapshot}


def check_normal_scorch_retirement(browser, name):
    context = browser.new_context(viewport={'width': 852, 'height': 393}, has_touch=True)
    page = context.new_page()
    enter(page, True)
    action = page.evaluate("""()=>{
      const api=window.__GWENT_PASS11__,s=api.getState(),G=api.engine;
      return G.legalActions(s,'p1').find(a=>{
        if(a.type!=='PLAY_CARD')return false;
        const d=G.CARD_DB[s.players.p1.hand.find(i=>i.iid===a.iid).cardId];
        return d.type==='unit'&&!d.abilities.some(ability=>['hero','spy','medic'].includes(ability));
      });
    }""")
    assert action, 'normal retirement scenario lacks an eligible non-Hero'
    tap_play(page, action)
    capture_nodes(page)
    page.evaluate('window.__GWENT_PASS11__.botMove()')
    frame(page)
    wait_idle(page)
    state = page.evaluate('window.__GWENT_PASS11__.getState()')
    assert any(event['type'] == 'SCORCH_RESOLVED' and action['iid'] in event['data']['doomed'] for event in state['eventLog']), 'normal opponent did not exercise expected Scorch retirement'
    assert any(card['iid'] == action['iid'] for card in state['players']['p1']['grave'])
    assert page.locator(f'#board [data-inspect-board="{action["iid"]}"]').count() == 0
    assert page.evaluate('iid=>window.GwentTabletopScene.getPose(iid)', action['iid']) is None
    snapshot = page.evaluate('window.GwentTabletopRenderer.snapshot()')
    assert all(item['iid'] != action['iid'] for item in snapshot['live']) and snapshot['retired'] >= 1
    survivors = identity_result(page)
    assert survivors and all(item['sameNode'] and item['sameImage'] for item in survivors), survivors
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder').count() == 0
    context.close()
    return {'browser': name, 'retiredIid': action['iid'], 'cause': 'normal-opponent-Scorch', 'survivors': survivors}


def main():
    results = []
    with sync_playwright() as playwright:
        options = {}
        executable = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
        if executable:
            options['executable_path'] = executable
        elif Path('/usr/bin/chromium').exists():
            options['executable_path'] = '/usr/bin/chromium'
        chromium = playwright.chromium.launch(**options)
        results.append(check_legacy_control(chromium))
        results.append(check_foundation(chromium, 'chromium'))
        results.append(check_normal_scorch_retirement(chromium, 'chromium'))
        chromium.close()
        webkit = playwright.webkit.launch()
        results.append(check_foundation(webkit, 'webkit'))
        results.append(check_normal_scorch_retirement(webkit, 'webkit'))
        webkit.close()
    (QA / 'tabletop-foundation-results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    print('tabletop-foundation: legacy replacement oracle fails; normal player/opponent paths retain card and image identity; presentation poses preserve engine/save state')


if __name__ == '__main__':
    main()

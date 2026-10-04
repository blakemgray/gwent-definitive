"""Normal-match Spy/draw and Decoy identity evidence for the opt-in renderer.

Cards come from the normal opening hand and subsequent legal plays. Neither
engine state nor final DOM is injected to manufacture an ability fixture.
"""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

from tabletop_foundation_ui import enter, frame, wait_idle, tap_play, capture_nodes, identity_result, state_and_save

ROOT = Path(__file__).resolve().parents[1]
QA = Path(os.environ.get('GWENT_QA_DIR', str(ROOT / 'qa' / 'tabletop_abilities')))
QA.mkdir(parents=True, exist_ok=True)


def assert_survivors(page):
    survivors = identity_result(page)
    assert survivors and all(item['sameNode'] and item['sameImage'] for item in survivors), survivors
    return survivors


def assert_clean(page):
    page.wait_for_function("""()=>[...document.querySelectorAll('#hand [data-card-iid],#board [data-inspect-board]')]
      .every(el=>{const img=el.querySelector('img');return img?.complete&&img.naturalWidth>0&&img.naturalHeight>0;})""")
    evidence = page.evaluate("""()=>{
      const cards=[...document.querySelectorAll('#hand [data-card-iid],#board [data-inspect-board]')];
      return {cards:cards.map(el=>({iid:el.dataset.cardIid||el.dataset.inspectBoard,
          visible:getComputedStyle(el).visibility==='visible'&&getComputedStyle(el).display!=='none',
          placeholder:el.classList.contains('dm-source-placeholder')})),
        actors:document.querySelectorAll('.dm-drag-proxy,.dm-flight-proxy,.te-target-actor,.gc-snapshot-ghost').length,
        guarded:window.GwentCardContinuity.guardedIids(),renderer:window.GwentTabletopRenderer.snapshot(),
        valid:window.GwentStorage.validateState(window.__GWENT_PASS11__.getState())};
    }""")
    assert evidence['cards'] and all(card['visible'] and not card['placeholder'] for card in evidence['cards']), evidence
    assert len({card['iid'] for card in evidence['cards']}) == len(evidence['cards']), 'duplicate settled embodiment'
    assert evidence['actors'] == 0 and not evidence['guarded'], 'ability cleanup left a transient actor or hidden-card lease'
    assert evidence['renderer']['errors'] == 0 and evidence['valid'], evidence
    return evidence


def next_step(page):
    return page.evaluate("""()=>{
      const api=window.__GWENT_PASS11__,s=api.getState(),G=api.engine;
      if(s.winner)return {stop:'match ended before normal Decoy swap'};
      if(s.currentPlayerId==='p2'||s.pendingChoice?.playerId==='p2')return {bot:true};
      if(s.pendingChoice)return {stop:'unexpected player choice during ordinary setup plays'};
      const legal=G.legalActions(s,'p1');
      const definition=a=>G.CARD_DB[s.players.p1.hand.find(card=>card.iid===a.iid)?.cardId];
      const decoy=legal.find(a=>a.type==='PLAY_CARD'&&definition(a)?.abilities.includes('decoy'));
      if(decoy)return {action:decoy,decoy:true};
      const unit=legal.find(a=>a.type==='PLAY_CARD'&&definition(a)?.type==='unit'&&!definition(a).abilities.includes('medic'));
      return unit?{action:unit}:{stop:'opening deck provided no ordinary legal setup play'};
    }""")


def check_browser(browser, name):
    context = browser.new_context(viewport={'width': 852, 'height': 393}, device_scale_factor=3, has_touch=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    enter(page, True)
    spy = page.evaluate("""()=>{
      const api=window.__GWENT_PASS11__,s=api.getState(),G=api.engine;
      return G.legalActions(s,'p1').find(a=>a.type==='PLAY_CARD'&&G.CARD_DB[s.players.p1.hand.find(c=>c.iid===a.iid)?.cardId]?.abilities.includes('spy'))||null;
    }""")
    assert spy, 'normal deterministic opening hand does not contain the required legal Spy'

    # A real pickup followed by interruption must leave the entire normal match
    # and save unchanged, including persistent source identity.
    before_cancel = state_and_save(page)
    capture_nodes(page)
    source = page.locator(f'#hand [data-card-iid="{spy["iid"]}"]')
    box = source.bounding_box()
    assert box
    sx, sy = box['x'] + box['width'] / 2, box['y'] + box['height'] * .48
    page.mouse.move(sx, sy)
    page.mouse.down()
    page.mouse.move(sx + 15, sy - 3, steps=3)
    page.wait_for_function('!!document.querySelector(".dm-drag-proxy")')
    page.evaluate("window.GwentDirectManipulation.cancel('tabletop-ability-precommit-interrupt')")
    page.mouse.up()
    page.evaluate("window.GwentDirectManipulation.cancel('tabletop-ability-post-pointer-cleanup')")
    wait_idle(page)
    assert state_and_save(page) == before_cancel, 'cancelled pickup mutated authoritative match/save'
    cancelled_identity = assert_survivors(page)
    assert_clean(page)
    page.screenshot(path=str(QA / f'{name}-01-cancelled-pickup.png'))

    # Spy normal play crosses ownership, draws two actual deck cards, and keeps
    # the existing body and loaded image rather than recreating survivors.
    capture_nodes(page)
    before_spy = page.evaluate('window.__GWENT_PASS11__.getState()')
    tap_play(page, spy)
    after_spy = page.evaluate('window.__GWENT_PASS11__.getState()')
    spy_identity = assert_survivors(page)
    assert any(item['iid'] == spy['iid'] and item['zone'] == 'board' for item in spy_identity)
    assert any(card['iid'] == spy['iid'] for card in after_spy['players']['p2']['board'][spy['row']]), 'Spy did not land on opponent semantic row'
    assert len(after_spy['players']['p1']['hand']) == len(before_spy['players']['p1']['hand']) + 1
    assert len(after_spy['players']['p1']['deck']) == len(before_spy['players']['p1']['deck']) - 2
    events = after_spy['eventLog'][len(before_spy['eventLog']):]
    draws = [event['data']['iid'] for event in events if event['type'] == 'CARD_DRAWN' and event['data']['playerId'] == 'p1']
    assert len(draws) == 2 and len(set(draws)) == 2, events
    for iid in draws:
        assert page.locator(f'#hand [data-card-iid="{iid}"]').count() == 1, 'drawn iid lacks exactly one hand body'
    spy_evidence = assert_clean(page)
    page.screenshot(path=str(QA / f'{name}-02-spy-and-draw-settled.png'))

    # The real opponent may destroy an early non-Hero. Continue normal legal
    # play until Decoy has a surviving eligible unit, without resurrecting it
    # or disabling any engine effects to simplify this test.
    steps = []
    swap = None
    for index in range(16):
        step = next_step(page)
        assert not step.get('stop'), step
        capture_nodes(page)
        if step.get('bot'):
            page.evaluate('window.__GWENT_PASS11__.botMove()')
            frame(page)
            wait_idle(page)
        else:
            action = step['action']
            if step.get('decoy'):
                page.evaluate("""a=>{window.__qaDecoyBodies={
                  decoy:document.querySelector(`[data-card-iid="${a.iid}"]`),
                  target:document.querySelector(`[data-inspect-board="${a.targetIid}"]`)};}""", action)
                before_swap = page.evaluate('window.__GWENT_PASS11__.getState()')
            tap_play(page, action)
        survivors = assert_survivors(page)
        assert_clean(page)
        steps.append({'index': index, 'step': step, 'survivors': survivors})
        if step.get('decoy'):
            swap = page.evaluate("""a=>{
              const decoy=document.querySelector(`#board [data-inspect-board="${a.iid}"]`);
              const target=document.querySelector(`#hand [data-card-iid="${a.targetIid}"]`);
              return {sameDecoy:decoy===window.__qaDecoyBodies.decoy,sameTarget:target===window.__qaDecoyBodies.target,
                decoyVisible:!!decoy&&getComputedStyle(decoy).visibility==='visible',
                targetVisible:!!target&&getComputedStyle(target).visibility==='visible'};
            }""", step['action'])
            assert all(swap.values()), swap
            after_swap = page.evaluate('window.__GWENT_PASS11__.getState()')
            assert any(card['iid'] == step['action']['targetIid'] for card in after_swap['players']['p1']['hand'])
            assert len(after_swap['players']['p1']['hand']) == len(before_swap['players']['p1']['hand'])
            assert any(event['type'] == 'DECOY_SWAP' for event in after_swap['eventLog'][len(before_swap['eventLog']):])
            page.screenshot(path=str(QA / f'{name}-03-decoy-return-settled.png'))
            break
    assert swap, 'normal sequence did not exercise Decoy within bounded legal setup turns'
    assert not errors, errors
    context.close()
    return {'browser': name, 'cancelledIdentity': cancelled_identity, 'spy': spy, 'drawnIids': draws,
            'spyIdentity': spy_identity, 'spyEvidence': spy_evidence, 'steps': steps, 'swap': swap}


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
        results.append(check_browser(chromium, 'chromium'))
        chromium.close()
        webkit = playwright.webkit.launch()
        results.append(check_browser(webkit, 'webkit'))
        webkit.close()
    (QA / 'tabletop-abilities-results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    print('tabletop-abilities: normal Spy/draw and Decoy retain persistent bodies/images; cancellation preserves engine/save; no hidden survivors or orphan actors')


if __name__ == '__main__':
    main()

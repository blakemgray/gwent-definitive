"""Device-report evidence across actual normal play, including export fallback."""
import json
import math
import os
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

from tabletop_foundation_ui import QA, enter, frame, ordinary_action, state_and_save, tap_play

RECT_KEYS = {'x', 'y', 'width', 'height', 'top', 'right', 'bottom', 'left'}
STYLE_KEYS = {
    'width', 'height', 'min-width', 'max-width', 'padding-left', 'padding-right',
    'border-left-width', 'border-right-width', 'box-sizing', 'overflow', 'overflow-x',
    'overflow-y', 'object-fit', 'object-position', 'transform', 'transform-origin',
    'contain', 'clip-path', 'mask-image', 'border-radius', 'position', 'top', 'right',
    'bottom', 'left', 'display', 'flex', 'grid-template-columns', 'touch-action',
}


def assert_element(element):
    assert element and RECT_KEYS <= element['rect'].keys(), element
    assert all(math.isfinite(element['rect'][key]) for key in RECT_KEYS), element['rect']
    assert STYLE_KEYS <= element['computed'].keys(), element['computed']
    assert isinstance(element['clippingCandidate'], bool)


def assert_card(card):
    assert card['iid'] and card['role'] in ('hand', 'board', 'actor')
    assert_element(card['shell'])
    assert card['image'], 'normal unit diagnostic is missing its image element'
    assert_element(card['image'])
    assert {'naturalWidth', 'naturalHeight', 'currentSrc', 'src', 'complete'} <= card['image'].keys()
    assert card['image']['naturalWidth'] > 0 and card['image']['naturalHeight'] > 0, 'visual diagnostic evidence used unloaded source art'
    assert 'imageAncestors' in card
    for wrapper in card['imageAncestors']:
        assert_element(wrapper)
    assert card['ancestry'], 'card report omitted ancestry'
    for ancestor in card['ancestry']:
        assert_element(ancestor)
    assert any(ancestor['tag'] == 'html' for ancestor in card['ancestry']), 'capture did not reach viewport ancestry'


def check_report(page, enabled):
    before = state_and_save(page)
    report = page.evaluate('window.GwentDiagnostics.collect()')
    assert state_and_save(page) == before, 'diagnostic collection mutated authoritative engine/save state'
    assert report['schemaVersion'] == 1
    identity = report['runtimeIdentity']
    assert identity['releaseId'] and identity['baselineCommit']
    assert identity['sourceCommit'] is None or re.fullmatch(r'[0-9a-f]{40}', identity['sourceCommit']), identity
    if os.environ.get('GITHUB_SHA'):
        assert identity['sourceCommit'] == os.environ['GITHUB_SHA'], 'runtime does not identify the exact checked-out CI candidate'
        assert identity['packaged'] and re.fullmatch(r'[0-9a-f]{64}', identity['sourceFingerprint']), identity
    # A development source without a packaging stamp must report that honestly.
    if not identity['packaged']:
        assert identity['sourceCommit'] is None and identity['sourceFingerprint'] is None, identity
    environment = report['environment']
    assert environment['url'] == page.url
    assert environment['devicePixelRatio'] == 3
    assert environment['viewport']['innerWidth'] == 852 and environment['viewport']['innerHeight'] == 393
    assert environment['visualViewport']['width'] > 0 and environment['visualViewport']['height'] > 0
    assert environment['orientation']['media'] == 'landscape'
    assert isinstance(environment['standalone'], bool) and environment['userAgent'] and environment['platform']
    assert environment['displayModes'] and {'top', 'right', 'bottom', 'left'} <= environment['safeArea'].keys()
    assert report['styles']['scriptSources'] and report['styles']['stylesheets']
    assert any(item['values']['--gwent-diagnostics-generation'] != 'unknown' for item in report['styles']['sentinels'])
    assert any(item['values']['--gwent-tabletop-generation'] != 'unknown' for item in report['styles']['sentinels'])
    assert report['loadedRuntimeVersions']['GwentDiagnostics'] != 'unknown'
    assert report['loadedRuntimeGenerations']['application'] != 'unknown'
    if enabled:
        assert report['presentation']['tabletop']['renderer'] and report['presentation']['tabletop']['scene'], 'new render/scene telemetry is absent'
    assert isinstance(report['retainedHandSnapshots'], int)
    assert 'state' not in report and 'players' not in report, 'diagnostics exported gameplay/hidden state'
    worker = report['serviceWorkers']
    assert {'supported', 'controller', 'registration'} <= worker.keys()
    if page.url.startswith('http'):
        assert worker['supported'] and worker['controller'], 'served test did not acquire a service-worker controller'
        assert worker['controller']['diagnostics']['status'] == 'ok', worker
        observed = worker['controller']['diagnostics']
        assert observed['build'] and observed['coreCache'] in report['caches']['names'], report['caches']
        assert observed['runtimeCache'] and observed['scope']
        assert {'active', 'waiting', 'installing'} <= worker['registration'].keys()
    return report


def check_browser(browser, name, enabled):
    context = browser.new_context(viewport={'width': 852, 'height': 393}, device_scale_factor=3, has_touch=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    enter(page, enabled)
    if page.url.startswith('http'):
        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('!!navigator.serviceWorker.controller')
    action = ordinary_action(page)
    before_capture = state_and_save(page)
    hand = page.evaluate('iid=>window.GwentDiagnostics.captureCard(document.querySelector(`#hand [data-card-iid="${iid}"]`))', action['iid'])
    assert state_and_save(page) == before_capture
    assert_card(hand)
    # captureCard() does not populate history. The real pointer/click path must
    # remember the hand geometry before that same node moves onto the board.
    assert page.evaluate('window.GwentDiagnostics.latest===null')
    tap_play(page, action)
    board_report = check_report(page, enabled)
    board = next(card for card in board_report['cards'] if card['iid'] == action['iid'] and card['role'] == 'board')
    assert_card(board)
    pair = next(pair for pair in board_report['handBoardComparisons'] if pair['iid'] == action['iid'])
    assert pair['hand']['role'] == 'hand' and pair['board']['role'] == 'board'
    assert pair['hand']['image']['src'] == pair['board']['image']['src'], 'control and placed card use different source art'
    if pair['hand']['image']['currentSrc'] and pair['board']['image']['currentSrc']:
        assert pair['sameSource'] is True
    assert any(item['classes'] and 'hand' in item['classes'] for item in pair['hand']['ancestry'])
    assert any(item['classes'] and 'units' in item['classes'] for item in pair['board']['ancestry'])

    before_panel = state_and_save(page)
    page.locator('#match-menu').click()
    page.locator('[data-match-menu="main"] [data-open-diagnostics]').click()
    page.wait_for_function("document.querySelector('#gwent-diagnostics-output')?.value.startsWith('{')")
    panel = page.locator('#gwent-diagnostics')
    assert panel.is_visible() and panel.get_attribute('role') == 'dialog'
    exported = json.loads(page.locator('#gwent-diagnostics-output').input_value())
    assert any(pair['iid'] == action['iid'] for pair in exported['handBoardComparisons'])
    assert 'Active controller build:' in page.locator('[data-diagnostics-summary]').inner_text()

    # Test the successful copy action without depending on desktop clipboard permissions.
    page.evaluate("""()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__qaCopiedDiagnostics=text;}}})""")
    page.locator('[data-diagnostics-copy]').click()
    page.wait_for_function("document.querySelector('[data-diagnostics-status]').textContent==='Report copied.'")
    assert json.loads(page.evaluate('window.__qaCopiedDiagnostics')) == exported
    # An installed browser without automatic clipboard access must offer a usable manual fallback.
    page.evaluate("""()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('qa-unavailable');}}})""")
    page.locator('[data-diagnostics-copy]').click()
    page.wait_for_function("document.querySelector('[data-diagnostics-status]').textContent.startsWith('Report selected.')")
    assert page.locator('#gwent-diagnostics-output').evaluate('el=>el.selectionStart===0&&el.selectionEnd===el.value.length')
    with page.expect_download() as download_info:
        page.locator('[data-diagnostics-download]').click()
    download = download_info.value
    destination = QA / f'{name}-{"tabletop" if enabled else "legacy"}-diagnostics.json'
    download.save_as(str(destination))
    assert json.loads(destination.read_text(encoding='utf-8')) == exported
    assert state_and_save(page) == before_panel, 'opening/exporting diagnostics mutated engine or persistence'
    page.screenshot(path=str(QA / f'{name}-{"tabletop" if enabled else "legacy"}-diagnostics.png'))
    page.locator('[data-diagnostics-close]').click()
    assert page.locator('#gwent-diagnostics').count() == 0
    page.locator('[data-match-menu="main"] [data-match-command="resume"]').click()
    assert state_and_save(page) == before_panel, 'closing device report and resuming mutated engine or persistence'

    # The diagnostics surface itself remains usable in portrait even while the
    # baseline gameplay composition still has its explicit orientation guard.
    page.set_viewport_size({'width': 393, 'height': 852})
    frame(page)
    page.evaluate('window.GwentDiagnostics.open()')
    page.wait_for_function("document.querySelector('#gwent-diagnostics-output')?.value.startsWith('{')")
    portrait = json.loads(page.locator('#gwent-diagnostics-output').input_value())
    assert portrait['environment']['orientation']['media'] == 'portrait'
    assert portrait['environment']['viewport']['innerWidth'] == 393
    assert page.locator('[data-diagnostics-copy]').is_visible()
    assert page.locator('.gd-window').evaluate('el=>el.scrollWidth<=el.clientWidth+1'), 'portrait report panel overflows horizontally'
    page.keyboard.press('Escape')
    assert page.locator('#gwent-diagnostics').count() == 0

    # A fresh normal match reuses deterministic iids. Old hand geometry must
    # never become evidence about a different match merely because ids match.
    page.set_viewport_size({'width': 852, 'height': 393})
    frame(page)
    page.locator('#match-menu').click()
    page.locator('[data-match-command="restart-request"]').click()
    page.locator('[data-match-command="restart-confirm"]').click()
    assert page.evaluate('window.GwentDiagnostics.latest===null'), 'restart retained a stale device report'
    page.locator('#mulligan-screen #finish-mulligan').click()
    frame(page)
    restarted = check_report(page, enabled)
    assert restarted['handBoardComparisons'] == [] and all(card['role'] == 'hand' for card in restarted['cards']), 'restart paired an old-match card with new geometry'
    assert restarted['retainedHandSnapshots'] == len(restarted['cards']), 'restart retained old-match hand snapshots'
    assert not errors, errors
    context.close()
    return {'browser': name, 'tabletop': enabled, 'iid': action['iid'], 'identity': board_report['runtimeIdentity'], 'worker': board_report['serviceWorkers']['controller'], 'pair': pair}


def main():
    import os
    results = []
    with sync_playwright() as playwright:
        options = {}
        executable = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
        if executable:
            options['executable_path'] = executable
        elif Path('/usr/bin/chromium').exists():
            options['executable_path'] = '/usr/bin/chromium'
        chromium = playwright.chromium.launch(**options)
        results.append(check_browser(chromium, 'chromium', False))
        results.append(check_browser(chromium, 'chromium', True))
        chromium.close()
        webkit = playwright.webkit.launch()
        results.append(check_browser(webkit, 'webkit', True))
        webkit.close()
    (QA / 'runtime-diagnostics-results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    print('runtime-diagnostics: normal hand-to-board ancestry/environment/worker capture, observation-only copy/download/fallback, and portrait report panel passed')


if __name__ == '__main__':
    main()

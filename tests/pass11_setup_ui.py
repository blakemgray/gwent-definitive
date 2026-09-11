import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('GWENT_TEST_URL','http://127.0.0.1:4173/')
QA=Path('qa/pass11_setup')
QA.mkdir(parents=True,exist_ok=True)
errors=[]

with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
    if not exe and Path('/usr/bin/chromium').exists():
        exe='/usr/bin/chromium'
    kwargs={'args':['--no-sandbox']}
    if exe:
        kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':393,'height':852})
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle')

    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    assert page.locator('#mulligan-screen.active').count()==1

    prepared=page.evaluate('window.__GWENT_PASS11__.getPreparedState()')
    assert prepared['setupPhase']=='mulligan'
    assert len(prepared['players']['p1']['hand'])==10
    assert len(prepared['players']['p2']['hand'])==10
    assert len(prepared['players']['p1']['deck'])==21
    assert len(prepared['players']['p2']['deck'])==26
    assert page.evaluate("window.__GWENT_PASS11__.engine.legalActions(window.__GWENT_PASS11__.getPreparedState(),'p1').length")==0

    checks=page.evaluate("""()=>{
      const p=window.__GWENT_PASS11__.presets();
      return [
        window.__GWENT_PASS11__.engine.validateDeck({faction:p.player[0].faction,leaderId:p.player[0].leaderId,deckIds:p.player[0].deck}),
        window.__GWENT_PASS11__.engine.validateDeck({faction:p.bot[0].faction,leaderId:p.bot[0].leaderId,deckIds:p.bot[0].deck})
      ];
    }""")
    assert all(x['valid'] for x in checks),checks
    assert checks[0]['summary']=={'faction':'realms','leaderId':'realms_foltest_copper','total':31,'units':25,'specials':6}
    assert checks[1]['summary']=={'faction':'monsters','leaderId':'monsters_eredin_silver','total':36,'units':29,'specials':7}

    page.screenshot(path=str(QA/'01_legal_opening_hand.png'),full_page=True)
    all_before=sorted(x['iid'] for zone in ('hand','deck') for x in prepared['players']['p1'][zone])
    first=page.locator('#mulligan-screen [data-mulligan]').first
    outgoing=first.get_attribute('data-mulligan')
    first.click()
    page.wait_for_timeout(80)

    swapped=page.evaluate('window.__GWENT_PASS11__.getPreparedState()')
    assert page.locator('#mulligan-count').inner_text().strip()=='1 / 2 USED'
    assert swapped['mulliganCounts']['p1']==1
    assert not any(x['iid']==outgoing for x in swapped['players']['p1']['hand'])
    assert any(x['iid']==outgoing for x in swapped['players']['p1']['deck'])
    all_after=sorted(x['iid'] for zone in ('hand','deck') for x in swapped['players']['p1'][zone])
    assert all_after==all_before
    assert swapped['eventLog'][-1]['type']=='CARD_MULLIGANED'

    saved=page.evaluate('window.GwentStorage.readMatch()')
    assert saved['schema']==2 and saved['phase']=='mulligan' and saved['mulliganUsed']==1
    assert saved['state']==swapped

    page.reload(wait_until='networkidle')
    assert page.locator('#main-screen #continue-match').is_visible()
    assert 'MULLIGAN' in page.locator('#main-screen #continue-match').inner_text()
    page.locator('#main-screen #continue-match').click()
    assert page.locator('#mulligan-screen.active').count()==1
    assert page.locator('#mulligan-count').inner_text().strip()=='1 / 2 USED'
    assert page.evaluate('window.__GWENT_PASS11__.getPreparedState()')==swapped
    page.screenshot(path=str(QA/'02_restored_mulligan.png'),full_page=True)

    page.locator('#finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393})
    page.wait_for_timeout(180)
    assert page.locator('#match-screen.active').count()==1
    started=page.evaluate('window.__GWENT_PASS11__.getState()')
    assert started['setupPhase']=='playing'
    assert len(started['players']['p1']['hand'])==10
    assert len(started['players']['p1']['deck'])==21
    assert any(x['type']=='PLAY_CARD' for x in page.evaluate("window.__GWENT_PASS11__.engine.legalActions(window.__GWENT_PASS11__.getState(),'p1')"))
    active=page.evaluate('window.GwentStorage.readMatch()')
    assert active['schema']==2 and active['phase']=='match' and active['state']==started
    page.screenshot(path=str(QA/'03_normal_match_start.png'))

    assert not errors,errors
    (QA/'setup_summary.json').write_text(json.dumps({'player':checks[0]['summary'],'opponent':checks[1]['summary'],'mulliganRestored':True,'pageErrors':errors},indent=2))
    browser.close()

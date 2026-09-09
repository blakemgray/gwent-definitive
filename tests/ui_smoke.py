import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
contract=json.loads((ROOT/'config/battlefield-geometry.json').read_text())
errors=[]
with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
    if not exe and Path('/usr/bin/chromium').exists(): exe='/usr/bin/chromium'
    kwargs={'args':['--no-sandbox']}
    if exe: kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={"width":393,"height":852})
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle')
    assert page.locator('#main-screen.active').count()==1
    dev_entry=page.locator('#main-screen [data-nav="profile-screen"]')
    assert dev_entry.count()==1 and dev_entry.is_hidden(), 'developer entry visible by default'
    page.locator('[data-nav="play-screen"]').click()
    assert page.locator('#play-screen.active').count()==1
    page.locator('#quick-start').click()
    assert page.locator('#mulligan-screen.active').count()==1
    assert page.locator('[data-mulligan]').count()==10
    page.locator('#finish-mulligan').click()
    page.set_viewport_size({"width":852,"height":393})
    page.wait_for_timeout(100)
    assert page.locator('#match-screen.active').count()==1
    lanes=page.locator('.lane')
    assert lanes.count()==6
    got=[(lanes.nth(i).get_attribute('data-pid'),lanes.nth(i).get_attribute('data-row')) for i in range(6)]
    assert got==[('p2','siege'),('p2','ranged'),('p2','close'),('p1','close'),('p1','ranged'),('p1','siege')],got
    for expected in contract['combat_rows']:
        loc=page.locator(f'.lane[data-pid="{expected["player"]}"][data-row="{expected["row"]}"]')
        box=loc.bounding_box(); assert box
        for key,actual,exp in [('x',box['x'],expected['x']),('y',box['y'],expected['y']),('w',box['width'],expected['w']),('h',box['height'],expected['h'])]:
            assert abs(actual-exp)<=contract['geometry_tolerance_px'],f'{expected["player"]}/{expected["row"]} {key}: {actual} vs {exp}'
    saved=page.evaluate("localStorage.getItem('gwent-definitive-match-v1')")
    assert saved and json.loads(saved)['schema']==1
    page.reload(wait_until='domcontentloaded')
    page.set_viewport_size({"width":393,"height":852})
    assert page.locator('#continue-match').is_visible(),'continue match should be visible after reload'
    page.locator('#continue-match').click(); page.set_viewport_size({"width":852,"height":393}); page.wait_for_timeout(50)
    assert page.locator('#match-screen.active').count()==1
    page.evaluate("localStorage.removeItem('gwent-definitive-match-v1')")
    page.locator('#match-menu').click(); page.set_viewport_size({"width":393,"height":852})
    page.locator('[data-nav="settings-screen"]').click(); page.locator('#developer-mode').check()
    page.locator('[data-nav="main-screen"]').click()
    assert dev_entry.is_visible(),'developer entry should appear when enabled'
    assert not errors,errors
    browser.close()
print('ui-smoke: navigation, save/restore, developer gating, 6-row geometry passed')

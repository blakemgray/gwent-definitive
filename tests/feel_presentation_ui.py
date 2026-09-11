import json, os, shutil, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass10_4c';QA.mkdir(parents=True,exist_ok=True)


def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(220)


def wait_idle(page,timeout=6000):
    page.evaluate('t=>window.GwentDirectManipulation.waitForIdle(t)',timeout)
    page.wait_for_timeout(35)


def state(page):
    return page.evaluate('window.__GWENT_PASS10__.getState()')


def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('qa-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s)
    page.wait_for_timeout(70)


def ordinary(page):
    return page.evaluate("""()=>{const a=window.__GWENT_PASS10__,s=a.getState(),G=a.engine;for(const i of s.players.p1.hand){const d=G.CARD_DB[i.cardId];const acts=G.legalActions(s,'p1').filter(x=>x.type==='PLAY_CARD'&&x.iid===i.iid);if(d?.type==='unit'&&!(d.abilities||[]).length&&acts.length)return{iid:i.iid,action:acts[0]};}return null;}""")


def start_point(page,iid):
    return page.evaluate("""iid=>{const el=document.querySelector(`#hand .hand-card[data-card-iid="${iid}"]`),r=el.getBoundingClientRect();return{x:r.x+r.width*.5,y:r.y+r.height*.52};}""",iid)


def target_box(page,action):
    return page.evaluate("""a=>{const d=window.GwentDirectManipulation.normalizeDestination(a);let el;if(d.kind==='row')el=document.querySelector(`#match-screen .lane[data-pid="${d.playerId}"][data-row="${d.row}"]`);else if(d.kind==='special')el=document.querySelector(`#match-screen .lane[data-pid="${d.playerId}"][data-row="${d.row}"] .special-slot-wrap`);else if(d.kind==='target')el=document.querySelector(`#match-screen [data-inspect-board="${d.targetIid}"]`);else el=document.querySelector('#match-screen .weather');if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};}""",action)


def copy_choreography_evidence():
    source=ROOT/'qa'/'pass10_4b'
    dest=QA/'choreography';dest.mkdir(parents=True,exist_ok=True)
    copied=[]
    if source.exists():
        for p in sorted(source.rglob('*.png')):
            out=dest/p.name;shutil.copy2(p,out);copied.append(out.name)
    return copied


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);ctx=browser.new_context(viewport={'width':852,'height':393});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)

    assert page.evaluate("window.GwentMotionTokens?.version==='10.4C.0'&&window.GwentPresentationFeedback?.version==='10.4C.0'&&window.GwentPresentationFeedback.stats.installed")
    assert '10.4C' in page.title()
    page.evaluate("""()=>{const b=document.querySelector('#auto-bot');if(b)b.checked=false;window.__feelHooks=[];window.__audioHooks=[];addEventListener('gwent:feedback-hook',e=>window.__feelHooks.push(e.detail));addEventListener('gwent:audio-hook',e=>window.__audioHooks.push(e.detail));window.GwentPresentationFeedback.updateSettings({effectsVolume:.6,muted:false,haptics:false});}""")
    settings=page.evaluate('window.GwentPresentationFeedback.getSettings()');assert settings['effectsVolume']==.6 and not settings['muted'] and not settings['haptics']
    base=state(page);base['players']['p2']['passed']=True;base['currentPlayerId']='p1';reset(page,base)

    card=ordinary(page);assert card, 'deterministic opening hand needs an ability-free unit for generic feel QA'
    iid,action=card['iid'],card['action'];loc=page.locator(f'#hand .hand-card[data-card-iid="{iid}"]')

    # Pointer-down response is synchronous; press state must appear before a frame is needed.
    sp=start_point(page,iid);page.mouse.move(sp['x'],sp['y']);t0=time.perf_counter();page.mouse.down()
    assert loc.evaluate("e=>e.classList.contains('dm-pressing')")
    press_ms=(time.perf_counter()-t0)*1000;page.mouse.up();page.wait_for_timeout(25)
    assert press_ms<80,press_ms

    # Selection feels lifted but no longer carries the old debug SELECTED pill.
    loc.click();page.wait_for_timeout(35)
    assert page.locator('.dm-selected').count()==1 and page.locator('.dm-legal-target').count()>=1
    pseudo=loc.evaluate("e=>getComputedStyle(e,'::before').content")
    assert 'SELECTED' not in pseudo
    hooks=page.evaluate('window.__feelHooks.map(x=>x.name)');assert 'UI_CARD_SELECT' in hooks
    audio=page.evaluate('window.__audioHooks');assert any(x['name']=='UI_CARD_SELECT' and abs(x['gain']-.6)<.001 for x in audio)
    page.screenshot(path=str(QA/'01_selection_weight.png'))
    page.keyboard.press('Escape');page.wait_for_timeout(30)

    # Active target acquisition is structural + textual and emits alignment feedback.
    sp=start_point(page,iid);tb=target_box(page,action);assert tb
    tx,ty=tb['x']+tb['width']/2,tb['y']+tb['height']/2
    page.mouse.move(sp['x'],sp['y']);page.mouse.down();page.mouse.move(sp['x']+14,sp['y']-2,steps=2);page.wait_for_timeout(25);page.mouse.move(tx,ty,steps=7);page.wait_for_timeout(45)
    assert page.locator('.dm-drag-proxy').count()==1 and page.locator('.dm-active-target').count()==1
    active=page.locator('.dm-active-target');assert active.get_attribute('data-dm-label')
    hooks=page.evaluate('window.__feelHooks.map(x=>x.name)');assert 'VALID_DESTINATION' in hooks
    page.screenshot(path=str(QA/'02_drag_active_target.png'))
    page.mouse.up();wait_idle(page)
    hooks=page.evaluate('window.__feelHooks.map(x=>x.name)');assert any(x.startswith('CARD_COMMIT_') for x in hooks)
    page.screenshot(path=str(QA/'03_ordinary_landing.png'))

    # Restore the exact pre-commit state, then verify invalid return pacing/cleanup.
    reset(page,base);card=ordinary(page);assert card;iid=card['iid'];sp=start_point(page,iid)
    page.mouse.move(sp['x'],sp['y']);page.mouse.down();page.mouse.move(sp['x']+15,sp['y']-2,steps=2);page.wait_for_timeout(25);page.mouse.move(8,45,steps=6);page.wait_for_timeout(35)
    assert page.locator('.dm-drag-proxy').count()==1 and page.locator('.dm-active-target').count()==0
    page.screenshot(path=str(QA/'04_invalid_before_return.png'))
    t0=time.perf_counter();page.mouse.up();wait_idle(page);invalid_ms=(time.perf_counter()-t0)*1000
    assert invalid_ms<500,invalid_ms
    assert state(page)==base
    assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder,.gc-cue,.gc-snapshot-ghost').count()==0

    # Mute suppresses audio dispatch without suppressing semantic feedback.
    page.evaluate("""()=>{window.__feelHooks=[];window.__audioHooks=[];window.GwentPresentationFeedback.updateSettings({muted:true});window.GwentPresentationFeedback.emit('UI_CARD_SELECT',{qa:true});}""")
    assert page.evaluate('window.__feelHooks.length')==1 and page.evaluate('window.__audioHooks.length')==0
    page.evaluate("window.GwentPresentationFeedback.updateSettings({muted:false})")

    # Reduced motion keeps selection/legal information while collapsing travel budgets.
    reset(page,base);page.emulate_media(reduced_motion='reduce');page.evaluate('window.GwentDirectManipulation.reduced(null)');page.wait_for_timeout(25)
    assert page.evaluate("window.GwentMotionTokens.duration('majorNormal')<=100&&window.GwentMotionTokens.duration('routineNormal')<=50")
    card=ordinary(page);assert card;iid=card['iid'];page.locator(f'#hand .hand-card[data-card-iid="{iid}"]').click();page.wait_for_timeout(25)
    assert page.locator('.dm-selected').count()==1 and page.locator('.dm-legal-target').count()>=1
    page.screenshot(path=str(QA/'05_reduced_selection.png'));page.keyboard.press('Escape')

    # Settings surface is real product UI; haptics remain optional/capability-gated.
    page.evaluate("document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.querySelector('#main-screen').classList.add('active')")
    page.locator('#main-screen [data-nav="settings-screen"]').click();page.wait_for_timeout(30)
    assert page.locator('#effects-volume,#mute-effects,#haptic-feedback').count()==3
    h=page.locator('#haptic-feedback');cap=page.evaluate('window.GwentPresentationFeedback.hapticCapable()')
    assert h.is_disabled()==(not cap)
    page.screenshot(path=str(QA/'06_feedback_settings.png'))

    stats=page.evaluate('window.GwentPresentationFeedback.stats')
    assert stats['installed'] and stats['hapticAttempts']==0
    assert not errors,errors
    copied=copy_choreography_evidence()
    manifest={'press_response_ms':press_ms,'invalid_return_ms':invalid_ms,'feedback_stats':stats,'copied_10_4b_frames':copied,'viewport':'852x393'}
    (QA/'feel_metrics.json').write_text(json.dumps(manifest,indent=2))
    browser.close()

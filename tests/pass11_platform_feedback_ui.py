import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass11_platform_feedback';QA.mkdir(parents=True,exist_ok=True)


def wait_running(page,timeout=5000):
    page.wait_for_function("window.GwentPlatformFeedback?.context?.state === 'running'",timeout=timeout)


def status(page):
    return page.evaluate('window.GwentPlatformFeedback.getStatus()')


def feedback_stats(page):
    return page.evaluate('window.GwentPresentationFeedback.stats')


def install_status_collectors(page):
    page.evaluate("""()=>{
      window.__audioStatuses=[];window.__hapticStatuses=[];
      addEventListener('gwent:audio-status',e=>window.__audioStatuses.push(e.detail));
      addEventListener('gwent:haptic-status',e=>window.__hapticStatuses.push(e.detail));
    }""")


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    ctx=browser.new_context(viewport={'width':852,'height':393})
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle');install_status_collectors(page)

    initial=status(page)
    assert initial['installed'] and initial['supported'],initial
    assert not initial['contextCreated'] and initial['contextState']=='uncreated',initial

    # A real trusted pointer interaction must create/resume Web Audio before later semantic cues.
    page.locator('#main-screen [data-nav="play-screen"]').click()
    wait_running(page)
    unlocked=status(page)
    assert unlocked['contextCreated'] and unlocked['unlockSuccesses']>=1,unlocked
    assert unlocked['lastUserActivation'] in ('pointerdown','touchstart','keydown'),unlocked

    # Enter a real match and use a real card selection so semantic feedback reaches actual Web Audio output.
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.wait_for_timeout(150)
    hand=page.locator('#hand .hand-card[data-card-iid]');assert hand.count()>0
    before_played=status(page)['audioPlayed']
    hand.first.click();page.wait_for_timeout(120)
    after=status(page)
    assert after['audioPlayed']>before_played,after
    assert any(x.get('status')=='played' and x.get('name')=='UI_CARD_SELECT' for x in page.evaluate('window.__audioStatuses')),page.evaluate('window.__audioStatuses')

    # Volume is carried all the way to the concrete output layer.
    page.evaluate("window.GwentPresentationFeedback.updateSettings({effectsVolume:.35,muted:false})")
    page.evaluate("window.GwentPresentationFeedback.emit('SCORCH_TRIGGER',{qa:true})")
    page.wait_for_timeout(80)
    scorch=[x for x in page.evaluate('window.__audioStatuses') if x.get('name')=='SCORCH_TRIGGER' and x.get('status')=='played']
    assert scorch and abs(scorch[-1]['gain']-.35)<.001,scorch

    # Mute and zero volume suppress concrete playback, not just UI copy.
    played_before=status(page)['audioPlayed'];requests_before=status(page)['audioRequests']
    page.evaluate("window.GwentPresentationFeedback.updateSettings({muted:true});window.GwentPresentationFeedback.emit('UI_CARD_SELECT',{qa:'muted'})")
    page.wait_for_timeout(40)
    assert status(page)['audioPlayed']==played_before and status(page)['audioRequests']==requests_before
    page.evaluate("window.GwentPresentationFeedback.updateSettings({muted:false,effectsVolume:0});window.GwentPresentationFeedback.emit('UI_CARD_SELECT',{qa:'zero'})")
    page.wait_for_timeout(40)
    assert status(page)['audioPlayed']==played_before and status(page)['audioRequests']==requests_before

    # Settings survive a normal reload/relaunch-style document recreation.
    page.evaluate("window.GwentPresentationFeedback.updateSettings({effectsVolume:.4,muted:true,haptics:false})")
    page.reload(wait_until='networkidle');install_status_collectors(page)
    persisted=page.evaluate('window.GwentPresentationFeedback.getSettings()')
    assert abs(persisted['effectsVolume']-.4)<.001 and persisted['muted'] is True,persisted
    page.evaluate("window.GwentPresentationFeedback.updateSettings({muted:false})")

    # Re-unlock, then prove an explicitly suspended context recovers through the installed-PWA resume path.
    page.locator('#main-screen [data-nav="settings-screen"]').click();wait_running(page)
    page.evaluate('window.GwentPlatformFeedback.context.suspend()')
    page.wait_for_function("window.GwentPlatformFeedback.context.state === 'suspended'")
    life_before=status(page)['lifecycleResumeSuccesses']
    page.evaluate("dispatchEvent(new Event('pageshow'))")
    wait_running(page)
    assert status(page)['lifecycleResumeSuccesses']>life_before,status(page)

    # Current browser capability must be stated honestly in Settings.
    cap=page.evaluate('window.GwentPresentationFeedback.hapticCapable()')
    note=page.locator('#haptic-support-note').inner_text().strip()
    haptic=page.locator('#haptic-feedback')
    assert haptic.is_disabled()==(not cap)
    if not cap:
        assert 'Unavailable' in note,note
        page.evaluate("window.GwentPresentationFeedback.updateSettings({haptics:true});window.GwentPresentationFeedback.emit('UI_CARD_SELECT',{qa:'unsupported-haptic'})")
        page.wait_for_timeout(30)
        hs=page.evaluate('window.__hapticStatuses')
        assert hs and hs[-1]['reason']=='unsupported' and not hs[-1]['success'],hs
        assert feedback_stats(page)['hapticUnsupported']>=1,feedback_stats(page)
    page.screenshot(path=str(QA/'01_platform_feedback_settings.png'))

    # Separate browser page with a capability stub proves one supported vibration request is attempted once.
    page2=ctx.new_page()
    page2.add_init_script("""
      Object.defineProperty(navigator,'vibrate',{configurable:true,value:(pattern)=>{window.__vibrationCalls=(window.__vibrationCalls||[]);window.__vibrationCalls.push(pattern);return true;}});
    """)
    page2.goto(BASE,wait_until='networkidle')
    page2.evaluate("window.__hapticStatuses=[];addEventListener('gwent:haptic-status',e=>window.__hapticStatuses.push(e.detail));window.GwentPresentationFeedback.updateSettings({haptics:true,muted:true})")
    page2.evaluate("window.GwentPresentationFeedback.emit('UI_CARD_SELECT',{qa:'supported-haptic'})")
    page2.wait_for_timeout(30)
    calls=page2.evaluate('window.__vibrationCalls||[]');hs2=page2.evaluate('window.__hapticStatuses')
    assert len(calls)==1,calls
    assert hs2 and hs2[-1]['attempted'] and hs2[-1]['success'] and hs2[-1]['reason']=='played',hs2
    st2=page2.evaluate('window.GwentPresentationFeedback.stats');assert st2['hapticAttempts']==1 and st2['hapticSuccesses']==1,st2

    assert not errors,errors
    manifest={
      'initial':initial,
      'after_real_card_selection':after,
      'scorch_played':scorch[-1],
      'persisted_settings':persisted,
      'browser_haptic_capable':cap,
      'browser_haptic_note':note,
      'final_audio_status':status(page),
      'final_feedback_stats':feedback_stats(page),
      'stub_haptic_status':hs2[-1],
      'stub_vibration_calls':calls,
      'viewport':'852x393'
    }
    (QA/'platform_feedback_matrix.json').write_text(json.dumps(manifest,indent=2))
    browser.close()

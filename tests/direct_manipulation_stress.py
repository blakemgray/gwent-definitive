import json, os, random
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass10_4a';QA.mkdir(parents=True,exist_ok=True)
TRIALS=256
RNG=random.Random(104256)


def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(180)
    page.evaluate('window.GwentDirectManipulation.reduced(true)')


def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('stress-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s)
    page.wait_for_timeout(15)


def wait_idle(page):page.evaluate('window.GwentDirectManipulation.waitForIdle(3000)')

def action_key(page,a):return page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a)

def tap(page,iid,a):
    page.locator(f'#hand [data-card-iid="{iid}"]').click()
    assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid',iid)
    page.locator(f'[data-dm-action-key="{action_key(page,a)}"]').click();wait_idle(page)
    return page.evaluate('window.__GWENT_PASS10__.getState()')

def drag(page,iid,a):
    card=page.locator(f'#hand [data-card-iid="{iid}"]');b=card.bounding_box();assert b
    sx,sy=b['x']+b['width']/2,b['y']+b['height']*.50
    # Legal destination DOM markers are intentionally materialized by the same
    # selection path the player enters when drag crosses the activation threshold.
    page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+10,sy-1,steps=2);page.wait_for_timeout(12)
    assert page.locator('.dm-drag-proxy').count()==1
    assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid',iid)
    target=page.locator(f'[data-dm-action-key="{action_key(page,a)}"]');tb=target.bounding_box();assert tb
    tx,ty=tb['x']+tb['width']/2,tb['y']+tb['height']/2
    page.mouse.move(tx,ty,steps=5);page.wait_for_timeout(15);assert page.locator('.dm-active-target').count()==1
    page.mouse.up();wait_idle(page)
    return page.evaluate('window.__GWENT_PASS10__.getState()')

with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);page=browser.new_page(viewport={'width':852,'height':393});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    initial=page.evaluate('window.__GWENT_PASS10__.getState()')
    pool=page.evaluate("""()=>Object.values(window.__GWENT_PASS10__.engine.CARD_DB)
      .filter(d=>d.type==='unit'&&!d.abilities.some(a=>['spy','medic','muster','scorch','scorch_c','scorch_r','scorch_s'].includes(a)))
      .map(d=>d.id)""")
    assert len(pool)>=40,len(pool)
    records=[]

    for trial in range(TRIALS):
        card_id=pool[(trial*17+RNG.randrange(len(pool)))%len(pool)]
        s=json.loads(json.dumps(initial));Grows=['close','ranged','siege']
        s['currentPlayerId']='p1';s['winner']=None;s['pendingChoice']=None;s['pendingResume']=None
        s['players']['p1']['passed']=False;s['players']['p2']['passed']=True
        s['weather']={'close':False,'ranged':False,'siege':False};s['weatherCards']=[]
        # Keep a second legal card in hand so playing the stress subject cannot
        # trigger canonical empty-hand auto-pass and round cleanup. This isolates
        # interaction/compositor behavior from round-resolution behavior.
        s['players']['p1']['hand']=[
            {'iid':'qa-stress-card','cardId':card_id},
            {'iid':'qa-stress-filler','cardId':'realms_blue_stripes'}
        ]
        # Densities intentionally reach beyond ordinary game rows to stress the compositor.
        densities={}
        for row in Grows:
            n=(trial*7+Grows.index(row)*3+RNG.randrange(0,5))%16;densities[row]=n
            s['players']['p1']['board'][row]=[{'iid':f'qa-p1-{trial}-{row}-{j}','cardId':'realms_keira'} for j in range(n)]
            n2=(trial*5+Grows.index(row)*2)%10
            s['players']['p2']['board'][row]=[{'iid':f'qa-p2-{trial}-{row}-{j}','cardId':'monsters_cockatrice'} for j in range(n2)]
            s['players']['p1']['board']['special'][row]=None;s['players']['p1']['board']['leaderHorn'][row]=False
            s['players']['p2']['board']['special'][row]=None;s['players']['p2']['board']['leaderHorn'][row]=False

        reset(page,s)
        actions=page.evaluate("window.GwentDirectManipulation.actionsFor('qa-stress-card')")
        assert actions,f'trial {trial} no actions for {card_id}'
        a=actions[trial%len(actions)]
        tap_state=tap(page,'qa-stress-card',a)
        reset(page,s);a2=page.evaluate("window.GwentDirectManipulation.actionsFor('qa-stress-card')")[trial%len(actions)]
        drag_state=drag(page,'qa-stress-card',a2)
        assert tap_state==drag_state,f'trial {trial} parity mismatch {card_id} {a}'
        assert page.locator('.dm-drag-proxy,.dm-flight-proxy,.dm-source-placeholder,.dm-legal-target').count()==0,f'trial {trial} leaked presentation DOM'
        records.append({'trial':trial,'cardId':card_id,'row':a.get('row'),'densities':densities,'equal':True})

    stats=page.evaluate('window.GwentDirectManipulation.stats')
    assert stats['tapCommits']>=TRIALS and stats['dragCommits']>=TRIALS,stats
    assert stats['transactions']>=TRIALS*2 and stats['errors']==0,stats
    assert stats['maxPointerLagPx']<=7.0,stats
    assert not errors,errors
    (QA/'stress_256_trials.json').write_text(json.dumps(records,indent=2))
    (QA/'stress_256_stats.json').write_text(json.dumps(stats,indent=2))
    browser.close()

print(f'direct-manipulation-stress: {TRIALS} physical tap/drag parity trials = {TRIALS*2} committed interactions across 0–15-card row densities; 0 mismatches')

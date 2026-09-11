import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass10_4b';QA.mkdir(parents=True,exist_ok=True)


def state(page): return page.evaluate('window.__GWENT_PASS10__.getState()')
def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation?.cancel('10.4b-reset');window.GwentPresentationQueue?.cancel('10.4b-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s)
    page.wait_for_timeout(70)
def wait_idle(page,timeout=7000):
    page.evaluate('t=>window.GwentDirectManipulation.waitForIdle(t)',timeout)
    page.wait_for_function('!window.GwentPresentationQueue.busy',timeout=timeout)
    page.wait_for_timeout(35)
def assert_cues_in_view(page):
    boxes=page.locator('.gc-cue').evaluate_all("els=>els.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,text:e.textContent};})")
    for b in boxes:
        assert b['x']>=-0.75 and b['y']>=-0.75 and b['right']<=b['w']+0.75 and b['bottom']<=b['h']+0.75,b

def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.wait_for_function("window.GwentGameplayChoreography?.version==='10.4B.0'",timeout=5000)
    page.locator('#main-screen [data-nav="play-screen"]').click();page.locator('#quick-start').click();page.locator('#finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(180)

def play_ability(page,ability):
    data=page.evaluate("""ability=>{const api=window.__GWENT_PASS10__,s=api.getState(),G=api.engine;for(const i of s.players.p1.hand){const d=G.CARD_DB[i.cardId];if(d?.abilities?.includes(ability)){const a=G.legalActions(s,'p1').find(x=>x.type==='PLAY_CARD'&&x.iid===i.iid);if(a)return{iid:i.iid,a};}}return null;}""",ability)
    assert data,f'no playable {ability}'
    page.locator(f'#hand .hand-card[data-card-iid="{data["iid"]}"]').click()
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',data['a'])
    page.locator(f'[data-dm-action-key="{key}"]').click();wait_idle(page)
    return data

def synthetic(page,events,name,extra=None,shot=None):
    tx={'kind':'game_action','version':'10.4B.0','inputMethod':'qa','action':{'type':'QA'},'events':events,'engineEvents':[],'beforeBoard':{'p1':{'close':[],'ranged':[],'siege':[]},'p2':{'close':[],'ranged':[],'siege':[]}},'afterBoard':{'p1':{'close':[],'ranged':[],'siege':[]},'p2':{'close':[],'ranged':[],'siege':[]}}}
    if extra: tx.update(extra)
    page.evaluate("tx=>{window.__gcQaPromise=window.GwentPresentationQueue.run(tx,async()=>{});}",tx)
    page.wait_for_function(f"document.body.dataset.gcStage==='{name}'",timeout=3000)
    assert page.locator('.gc-cue').count()>=1 or name in ['muster']
    assert_cues_in_view(page)
    if shot: page.screenshot(path=str(QA/shot))
    page.evaluate('()=>window.__gcQaPromise');page.wait_for_function('!window.GwentPresentationQueue.busy',timeout=5000)
    assert page.locator('.gc-cue,.gc-ghost').count()==0

with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists(): exe='/usr/bin/chromium'
    if exe: kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);ctx=browser.new_context(viewport={'width':852,'height':393});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    assert page.evaluate("window.GwentPresentationEvents.version==='10.4B.0'&&window.GwentGameplayChoreography.runtime.installed")

    # Real engine Spy proves engine log -> semantic adapter -> authored plan; exactly two actual draw events remain grouped under Spy.
    s=state(page);s['players']['p2']['passed']=True;s['currentPlayerId']='p1';reset(page,s)
    before=state(page);spy=play_ability(page,'spy');after=state(page)
    tx=page.evaluate('window.GwentDirectManipulation.lastTransaction');plan=page.evaluate('window.GwentGameplayChoreography.runtime.lastPlan')
    assert any(e['type']=='SPY_TRIGGER' for e in tx['events']),tx['events']
    assert sum(1 for e in tx['events'] if e['type']=='CARD_DRAW')==2
    assert plan and plan[0]['kind']=='spy' and len(plan[0]['draws'])==2,plan
    assert len(after['players']['p1']['hand'])==len(before['players']['p1']['hand'])+1  # played one, drew two
    page.screenshot(path=str(QA/'01_spy_final.png'))

    # Real engine Weather proves persistent central/row state survives presentation.
    base=before;base['players']['p2']['passed']=True;base['currentPlayerId']='p1';reset(page,base);play_ability(page,'frost')
    assert state(page)['weather']['close'] is True
    assert any(x['kind']=='weather' for x in page.evaluate('window.GwentGameplayChoreography.runtime.lastPlan'))
    page.screenshot(path=str(QA/'02_weather_final.png'))

    # Synthetic signature frames make the visual grammar individually inspectable in CI artifacts.
    synthetic(page,[{'type':'MUSTER_SUMMON','playerId':'p1','iid':'m1','row':'close'},{'type':'MUSTER_SUMMON','playerId':'p1','iid':'m2','row':'close'}],'muster',shot='03_muster_signature.png')
    synthetic(page,[{'type':'SCORCH_TRIGGER','playerId':'p1','doomed':[{'iid':'x','playerId':'p2','row':'close'},{'iid':'y','playerId':'p2','row':'close'}]}],'scorch',shot='04_scorch_signature.png')
    synthetic(page,[{'type':'DECOY_SWAP','playerId':'p1','row':'ranged','targetIid':'t'}],'decoy',shot='05_decoy_signature.png')
    synthetic(page,[{'type':'MEDIC_REVIVE','playerId':'p1','row':'close','iid':'r'}],'medic',shot='06_medic_signature.png')
    synthetic(page,[{'type':'HORN_TRIGGER','playerId':'p1','row':'siege','source':'card'}],'horn',shot='07_horn_signature.png')
    synthetic(page,[{'type':'TIGHT_BOND_TRIGGER','playerId':'p1','row':'close'}],'bond',shot='08_bond_signature.png')
    synthetic(page,[{'type':'LEADER_TRIGGER','playerId':'p1'}],'leader',shot='09_leader_signature.png')
    synthetic(page,[{'type':'PASS','playerId':'p1','reason':'manual'}],'pass',shot='10_pass_signature.png')
    round_board={'p1':{'close':[{'iid':'a','cardId':'realms_blue_stripes','power':4}],'ranged':[],'siege':[]},'p2':{'close':[],'ranged':[],'siege':[{'iid':'b','cardId':'monsters_gargoyle','power':6}]}}
    synthetic(page,[{'type':'LIFE_CHANGE','playerId':'p2','from':2,'to':1},{'type':'ROUND_END','round':1,'winnerId':'p1'},{'type':'BOARD_CLEAR','round':1},{'type':'ROUND_START','round':2,'currentPlayerId':'p1'}],'round-end',{'beforeBoard':round_board},'11_round_resolution_signature.png')

    # External app-only Pass is automatically observed and serialized through the same queue.
    # With Auto Bot enabled, the opponent must not mutate engine state until the Pass choreography settles.
    s=state(page);s['players']['p2']['passed']=False;s['players']['p1']['passed']=False;s['currentPlayerId']='p1';reset(page,s)
    page.evaluate("()=>{const t=document.querySelector('#auto-bot');t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));}")
    ext_before=page.evaluate('window.GwentGameplayChoreography.runtime.externalTransactions')
    gate_before=page.evaluate('window.GwentChoreographyExternalGate.stats')
    page.locator('#pass-button').click()
    page.wait_for_function('before=>window.GwentGameplayChoreography.runtime.externalTransactions>before',arg=ext_before,timeout=3000)
    page.wait_for_function('before=>window.GwentChoreographyExternalGate.stats.deferrals>before',arg=gate_before['deferrals'],timeout=3000)
    page.wait_for_function('window.GwentPresentationQueue.busy&&window.GwentChoreographyExternalGate.pending',timeout=3000)
    pass_log_len=len(state(page)['eventLog']);samples=0
    while page.evaluate('window.GwentChoreographyExternalGate.pending'):
        assert len(state(page)['eventLog'])==pass_log_len,'opponent mutated engine state before Pass presentation gate released'
        page.wait_for_timeout(20);samples+=1
        if samples>50: break
    assert samples>=2,samples
    wait_idle(page)
    assert state(page)['players']['p1']['passed'] is True
    gate_after=page.evaluate('window.GwentChoreographyExternalGate.stats')
    assert gate_after['pending'] is False and gate_after['releases']>gate_before['releases'],gate_after
    assert page.evaluate("document.querySelector('#auto-bot').checked") is True

    # Reduced motion preserves the same semantic stage but completes quickly without travel ghosts.
    page.emulate_media(reduced_motion='reduce');page.evaluate('window.GwentDirectManipulation.reduced(null)')
    start=page.evaluate('performance.now()')
    synthetic(page,[{'type':'SCORCH_TRIGGER','playerId':'p1','doomed':[{'iid':'x','playerId':'p2','row':'siege'}]}],'scorch',shot='12_reduced_motion_scorch.png')
    elapsed=page.evaluate('s=>performance.now()-s',start);assert elapsed<1000,elapsed
    assert page.locator('.gc-ghost').count()==0
    page.emulate_media(reduced_motion='no-preference')

    # Interruption is presentation-only: queue cancellation scrubs transient cues and cannot mutate authoritative state.
    frozen=state(page)
    txi={'kind':'game_action','version':'10.4B.0','inputMethod':'qa','action':{'type':'QA'},'events':[{'type':'SCORCH_TRIGGER','playerId':'p1','doomed':[{'iid':'x','playerId':'p2','row':'siege'}]},{'type':'ROUND_END','round':1,'winnerId':'p1'}],'engineEvents':[],'beforeBoard':round_board,'afterBoard':round_board}
    page.evaluate("tx=>{window.__gcInterrupt=window.GwentPresentationQueue.run(tx,async()=>{});}",txi);page.wait_for_function("document.body.dataset.gcStage==='scorch'",timeout=3000);assert_cues_in_view(page);page.screenshot(path=str(QA/'13_interrupt_before_cancel.png'))
    page.evaluate("window.GwentPresentationQueue.cancel('qa-interrupt')");page.evaluate('()=>window.__gcInterrupt');page.wait_for_timeout(50)
    assert state(page)==frozen
    assert page.locator('.gc-cue,.gc-ghost').count()==0
    assert not page.evaluate("document.body.classList.contains('gc-presenting')")

    snap=page.evaluate('window.GwentGameplayChoreography.snapshot()');(QA/'runtime_stats.json').write_text(json.dumps(snap,indent=2))
    assert snap['presented']>=10 and snap['errors']==0,snap
    assert not errors,errors
    ctx.close();browser.close()

print('gameplay-choreography-ui: real Spy/Weather semantics, viewport-safe signatures, externally gated Pass/Auto Bot, reduced motion, and interruption safety passed')

import copy, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass10_4b'/'stress';QA.mkdir(parents=True,exist_ok=True)


def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click();page.locator('#quick-start').click();page.locator('#finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(180)
    page.evaluate("()=>{const t=document.querySelector('#auto-bot');if(t){t.checked=false;t.dispatchEvent(new Event('change',{bubbles:true}));}}")

def state(page): return page.evaluate('window.__GWENT_PASS10__.getState()')
def wait_idle(page,timeout=12000):
    page.evaluate('t=>window.GwentDirectManipulation.waitForIdle(t)',timeout)
    page.wait_for_function('!window.GwentPresentationQueue.busy',timeout=timeout);page.wait_for_timeout(45)
def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('stress-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s);page.wait_for_timeout(110)
    page.evaluate("()=>{const C=window.GwentGameplayChoreography;C.runtime.stableVisual=C.captureVisual();C.runtime.lastObservedState=window.__GWENT_PASS10__.getState();}")
def empty_state(base):
    s=copy.deepcopy(base);s['winner']=None;s['pendingChoice']=None;s['pendingResume']=None;s['roundStartQueue']=[];s['roundHistory']=[];s['eventLog']=[];s['round']=1;s['currentPlayerId']='p1';s['firstPlayerId']='p1';s['roundStarterId']='p1';s['weather']={'close':False,'ranged':False,'siege':False};s['weatherCards']=[]
    for pid in ['p1','p2']:
        p=s['players'][pid];p['hand']=[];p['deck']=[];p['grave']=[];p['health']=2;p['passed']=pid=='p2';p['leaderUsed']=True;p['leaderDisabled']=False;p['retainedIid']=None
        for row in ['close','ranged','siege']:p['board'][row]=[];p['board']['special'][row]=None;p['board']['leaderHorn'][row]=False
    return s
def I(iid,card): return {'iid':iid,'cardId':card}
def shot(page,name): page.screenshot(path=str(QA/name))
def begin(page,iid,choose=None):
    page.locator(f'#hand .hand-card[data-card-iid="{iid}"]').click()
    acts=page.evaluate('iid=>window.GwentDirectManipulation.actionsFor(iid)',iid);assert acts,f'no legal actions for {iid}'
    a=next((x for x in acts if choose is None or choose(x)),None);assert a,(iid,acts)
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',a);target=page.locator(f'[data-dm-action-key="{key}"]');assert target.count()==1,(iid,a,key)
    target.click();return a
def wait_stage(page,name,timeout=6000): page.wait_for_function('name=>document.body.dataset.gcStage===name',arg=name,timeout=timeout)
def clean(page):
    assert page.locator('.gc-cue,.gc-snapshot-ghost,.gc-ghost').count()==0
    assert not page.evaluate("document.body.classList.contains('gc-presenting')")
def visible_count(page,sel): return page.locator(sel).evaluate_all("els=>els.filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0}).length")
def cancel_final(page,final_state,name):
    page.evaluate("window.GwentPresentationQueue.cancel('stress-interrupt')");page.wait_for_timeout(120);assert state(page)==final_state;clean(page);shot(page,name)
def reduced_start(page): page.emulate_media(reduced_motion='reduce');page.evaluate('window.GwentDirectManipulation.reduced(null)')
def reduced_end(page): page.emulate_media(reduced_motion='no-preference');page.evaluate('window.GwentDirectManipulation.reduced(null)')

with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);ctx=browser.new_context(viewport={'width':852,'height':393});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    base=state(page)
    ids=page.evaluate("""()=>{const v=Object.values(window.__GWENT_PASS10__.engine.CARD_DB),find=(fn)=>v.find(fn)?.id;return{
      scorch:find(d=>d.type==='special'&&d.abilities.includes('scorch')),
      muster:find(d=>d.type==='unit'&&d.abilities.includes('muster')&&d.row!=='agile'&&!d.muster),
      spy:find(d=>d.type==='unit'&&d.abilities.includes('spy')&&d.row!=='agile'&&!d.abilities.includes('hero')),
      horn:find(d=>d.type==='special'&&d.abilities.includes('horn')),
      medic:find(d=>d.type==='unit'&&d.abilities.includes('medic')&&d.row!=='agile'),
      decoy:find(d=>d.type==='special'&&d.abilities.includes('decoy')),
      bond:find(d=>d.type==='unit'&&d.abilities.includes('bond')&&d.row==='close'),
      frost:find(d=>d.type==='weather'&&d.abilities.includes('frost')),
      fog:find(d=>d.type==='weather'&&d.abilities.includes('fog')),
      rain:find(d=>d.type==='weather'&&d.abilities.includes('rain')),
      clear:find(d=>d.type==='weather'&&d.abilities.includes('clear')),
      ordinary:find(d=>d.type==='unit'&&d.row==='close'&&d.strength>0&&(!d.abilities||d.abilities.length===0)),
      ordinaryRanged:find(d=>d.type==='unit'&&d.row==='ranged'&&d.strength>0&&(!d.abilities||d.abilities.length===0)),
      ordinarySiege:find(d=>d.type==='unit'&&d.row==='siege'&&d.strength>0&&(!d.abilities||d.abilities.length===0))
    }}""")
    assert all(ids.values()),ids

    # 1. SCORCH — two tied highest targets across separate rows. Old row stays visually pinned until doom identity is clear.
    def scorch_state():
        s=empty_state(base);s['players']['p1']['hand']=[I('scorch',ids['scorch']),I('sf',ids['ordinary'])];s['players']['p2']['board']['close']=[I('doom-c','qa' if False else ids['ordinary'])];s['players']['p2']['board']['siege']=[I('doom-s',ids['ordinary'])];return s
    s=scorch_state();reset(page,s);shot(page,'20_scorch_pre.png');begin(page,'scorch');wait_stage(page,'scorch');page.wait_for_function("document.querySelectorAll('.gc-snapshot-scorch-doomed').length===2",timeout=5000);assert visible_count(page,'.gc-snapshot-scorch-doomed')==2;shot(page,'21_scorch_mid_tied.png');wait_idle(page);final=state(page);assert not final['players']['p2']['board']['close'] and not final['players']['p2']['board']['siege'];clean(page);shot(page,'22_scorch_final.png')
    s=scorch_state();reset(page,s);begin(page,'scorch');wait_stage(page,'scorch');page.wait_for_function("document.querySelectorAll('.gc-snapshot-scorch-doomed').length===2",timeout=5000);frozen=state(page);cancel_final(page,frozen,'23_scorch_interrupted_final.png')
    reduced_start(page);s=scorch_state();reset(page,s);begin(page,'scorch');wait_stage(page,'scorch');shot(page,'24_scorch_reduced.png');wait_idle(page);reduced_end(page)

    # 2. MUSTER — eight summoned units plus initiator; adaptive arrivals originate from deck abstraction.
    def muster_state():
        s=empty_state(base);s['players']['p1']['hand']=[I('muster-root',ids['muster']),I('mf',ids['ordinary'])];s['players']['p1']['deck']=[I(f'muster-{i}',ids['muster']) for i in range(8)];return s
    s=muster_state();reset(page,s);shot(page,'25_muster_pre.png');begin(page,'muster-root');wait_stage(page,'muster');page.wait_for_function("document.querySelectorAll('.gc-snapshot-muster-unit').length>0",timeout=7000);shot(page,'26_muster_mid_8plus.png');wait_idle(page);final=state(page);row=page.evaluate("iid=>{const G=window.__GWENT_PASS10__.engine,s=window.__GWENT_PASS10__.getState(),d=G.CARD_DB[s.players.p1.board.close.find(x=>x.iid===iid)?.cardId||s.players.p1.board.ranged.find(x=>x.iid===iid)?.cardId||s.players.p1.board.siege.find(x=>x.iid===iid)?.cardId];return ['close','ranged','siege'].find(r=>s.players.p1.board[r].some(x=>x.iid===iid));}",'muster-root');assert row and len(final['players']['p1']['board'][row])>=9;clean(page);shot(page,'27_muster_final.png')
    s=muster_state();reset(page,s);begin(page,'muster-root');wait_stage(page,'muster');page.wait_for_function("document.querySelectorAll('.gc-snapshot-muster-unit').length>0",timeout=7000);frozen=state(page);cancel_final(page,frozen,'28_muster_interrupted_final.png')
    reduced_start(page);s=muster_state();reset(page,s);begin(page,'muster-root');wait_stage(page,'muster');shot(page,'29_muster_reduced.png');wait_idle(page);reduced_end(page)

    # 3. SPY — ten-card pre-play hand becomes eleven after crossing the centerline and exactly two deck arrivals.
    def spy_state():
        s=empty_state(base);s['players']['p1']['hand']=[I('spy',ids['spy'])]+[I(f'sh{i}',ids['ordinary']) for i in range(9)];s['players']['p1']['deck']=[I('draw-a',ids['ordinaryRanged']),I('draw-b',ids['ordinarySiege'])];return s
    s=spy_state();reset(page,s);shot(page,'30_spy_pre_10.png');begin(page,'spy');wait_stage(page,'spy');page.wait_for_function("document.querySelectorAll('.gc-snapshot-draw').length>0",timeout=7000);shot(page,'31_spy_mid_draw.png');wait_idle(page);final=state(page);assert len(final['players']['p1']['hand'])==11 and any(c['iid']=='spy' for c in sum([final['players']['p2']['board'][r] for r in ['close','ranged','siege']],[]));assert len([e for e in page.evaluate('window.GwentGameplayChoreography.runtime.lastTransaction.events') if e['type']=='CARD_DRAW'])==2;clean(page);shot(page,'32_spy_final_11.png')
    s=spy_state();reset(page,s);begin(page,'spy');wait_stage(page,'spy');page.wait_for_function("document.querySelectorAll('.gc-snapshot-draw').length>0",timeout=7000);frozen=state(page);cancel_final(page,frozen,'33_spy_interrupted_final.png')
    reduced_start(page);s=spy_state();reset(page,s);begin(page,'spy');wait_stage(page,'spy');shot(page,'34_spy_reduced.png');wait_idle(page);reduced_end(page)

    # 4. HORN over active Tight Bond — row effect must precede score animation.
    def horn_state():
        s=empty_state(base);s['players']['p1']['board']['close']=[I('bond1',ids['bond']),I('bond2',ids['bond'])];s['players']['p1']['hand']=[I('horn',ids['horn']),I('hf',ids['ordinary'])];return s
    s=horn_state();reset(page,s);shot(page,'35_horn_bond_pre.png');begin(page,'horn',lambda a:a.get('row')=='close');wait_stage(page,'horn');shot(page,'36_horn_mid.png');page.wait_for_function("document.body.dataset.gcStage==='score'",timeout=7000);page.wait_for_function("document.querySelectorAll('.gc-snapshot-score').length>0",timeout=3000);assert visible_count(page,'.gc-snapshot-score')>=1;shot(page,'37_horn_score_after_effect.png');wait_idle(page);final=state(page);assert final['players']['p1']['board']['special']['close'];clean(page);shot(page,'38_horn_bond_final.png')
    s=horn_state();reset(page,s);begin(page,'horn',lambda a:a.get('row')=='close');wait_stage(page,'horn');frozen=state(page);cancel_final(page,frozen,'39_horn_interrupted_final.png')
    reduced_start(page);s=horn_state();reset(page,s);begin(page,'horn',lambda a:a.get('row')=='close');wait_stage(page,'horn');shot(page,'40_horn_reduced.png');wait_idle(page);reduced_end(page)

    # 5. CLEAR WEATHER with Frost, Fog and Rain simultaneously active.
    def weather_state():
        s=empty_state(base);s['weather']={'close':True,'ranged':True,'siege':True};s['weatherCards']=[{'inst':I('wf',ids['frost']),'ownerId':'p2'},{'inst':I('wg',ids['fog']),'ownerId':'p2'},{'inst':I('wr',ids['rain']),'ownerId':'p2'}];s['players']['p1']['hand']=[I('clear',ids['clear']),I('wfill',ids['ordinary'])];return s
    s=weather_state();reset(page,s);shot(page,'41_weather_all_pre.png');begin(page,'clear');wait_stage(page,'weather-clear');shot(page,'42_clear_weather_mid.png');wait_idle(page);final=state(page);assert not final['weatherCards'] and not any(final['weather'].values());clean(page);shot(page,'43_clear_weather_final.png')
    s=weather_state();reset(page,s);begin(page,'clear');wait_stage(page,'weather-clear');frozen=state(page);cancel_final(page,frozen,'44_clear_weather_interrupted_final.png')
    reduced_start(page);s=weather_state();reset(page,s);begin(page,'clear');wait_stage(page,'weather-clear');shot(page,'45_clear_weather_reduced.png');wait_idle(page);reduced_end(page)

    # 6. MEDIC revives a Muster unit. Causal planner must show revive before nested pack arrivals.
    def medic_state():
        s=empty_state(base);s['players']['p1']['hand']=[I('medic',ids['medic']),I('medfill',ids['ordinary'])];s['players']['p1']['grave']=[I('revive-muster',ids['muster'])];s['players']['p1']['deck']=[I(f'revive-pack-{i}',ids['muster']) for i in range(4)];return s
    s=medic_state();reset(page,s);shot(page,'46_medic_muster_pre.png');begin(page,'medic');wait_idle(page);assert state(page)['pendingChoice'] and page.locator('[data-medic="revive-muster"]').count()==1;page.locator('[data-medic="revive-muster"]').click();wait_stage(page,'medic');page.wait_for_function("document.querySelectorAll('.gc-snapshot-medic-card').length>0",timeout=7000);shot(page,'47_medic_revive_mid.png');page.wait_for_function("document.body.dataset.gcStage==='muster'",timeout=9000);page.wait_for_function("document.querySelectorAll('.gc-snapshot-muster-unit').length>0",timeout=7000);shot(page,'48_medic_nested_muster_mid.png');wait_idle(page);plan=page.evaluate('window.GwentGameplayChoreography.runtime.lastPlan.map(x=>x.kind)');assert plan.index('medic')<plan.index('muster'),plan;clean(page);shot(page,'49_medic_muster_final.png')
    s=medic_state();reset(page,s);begin(page,'medic');wait_idle(page);page.locator('[data-medic="revive-muster"]').click();wait_stage(page,'medic');page.wait_for_function("document.querySelectorAll('.gc-snapshot-medic-card').length>0",timeout=7000);frozen=state(page);cancel_final(page,frozen,'50_medic_interrupted_final.png')
    reduced_start(page);s=medic_state();reset(page,s);begin(page,'medic');wait_idle(page);page.locator('[data-medic="revive-muster"]').click();wait_stage(page,'medic');shot(page,'51_medic_reduced.png');wait_idle(page);reduced_end(page)

    # 7. DECOY on a Spy currently on the player's board; target visibly returns to hand.
    def decoy_state():
        s=empty_state(base);spyrow=page.evaluate("id=>window.__GWENT_PASS10__.engine.CARD_DB[id].row",ids['spy']);spyrow='close' if spyrow=='agile' else spyrow;s['players']['p1']['board'][spyrow]=[I('captured-spy',ids['spy'])];s['players']['p1']['hand']=[I('decoy',ids['decoy']),I('df',ids['ordinary'])];return s,spyrow
    s,spyrow=decoy_state();reset(page,s);shot(page,'52_decoy_spy_pre.png');begin(page,'decoy',lambda a:a.get('targetIid')=='captured-spy');wait_stage(page,'decoy');page.wait_for_function("document.querySelectorAll('.gc-snapshot-decoy-return').length>0",timeout=7000);shot(page,'53_decoy_spy_mid.png');wait_idle(page);final=state(page);assert any(c['iid']=='captured-spy' for c in final['players']['p1']['hand']);clean(page);shot(page,'54_decoy_spy_final.png')
    s,spyrow=decoy_state();reset(page,s);begin(page,'decoy',lambda a:a.get('targetIid')=='captured-spy');wait_stage(page,'decoy');page.wait_for_function("document.querySelectorAll('.gc-snapshot-decoy-return').length>0",timeout=7000);frozen=state(page);cancel_final(page,frozen,'55_decoy_interrupted_final.png')
    reduced_start(page);s,spyrow=decoy_state();reset(page,s);begin(page,'decoy',lambda a:a.get('targetIid')=='captured-spy');wait_stage(page,'decoy');shot(page,'56_decoy_reduced.png');wait_idle(page);reduced_end(page)

    # 8. ROUND 2 -> 3: Monster retention + two Skellige grave returns in one deterministic transition.
    # Keep one legal Skellige hand card across the Round-2 pass so Round 3 does not
    # immediately auto-pass both exhausted players, clear the revived units, and
    # end the match before this fixture can inspect the post-revival battlefield.
    s=empty_state(base)
    s['round']=2
    s['players']['p1']['faction']='skellige'
    s['players']['p2']['faction']='monsters'
    s['players']['p2']['passed']=True
    s['players']['p1']['passed']=False
    s['currentPlayerId']='p1'
    s['players']['p1']['hand']=[I('round3-buffer',ids['ordinary'])]
    s['players']['p1']['board']['close']=[I(f'win{i}',ids['ordinary']) for i in range(3)]
    s['players']['p2']['board']['close']=[I(f'mon{i}',ids['ordinary']) for i in range(2)]
    s['players']['p1']['grave']=[I('sk-a',ids['ordinaryRanged']),I('sk-b',ids['ordinarySiege'])]
    reset(page,s);shot(page,'57_round23_pre.png')
    page.locator('#pass-button').click();wait_stage(page,'round-end',9000)
    page.wait_for_function("document.querySelectorAll('.gc-snapshot-round-hold').length>=5",timeout=6000);shot(page,'58_round23_hold.png')
    wait_idle(page,15000);final=state(page)
    assert final['round']==3 and final['winner'] is None
    assert final['players']['p2']['retainedIid'] and not final['players']['p1']['passed']
    revived=[c['iid'] for r in ['close','ranged','siege'] for c in final['players']['p1']['board'][r]]
    assert len(revived)==2,revived
    last=page.evaluate('window.GwentGameplayChoreography.runtime.lastPlan');round_stage=next(x for x in last if x['kind']=='round-end')
    assert len(round_stage['factionRevives'])==2 and round_stage['retention']['retained']
    clean(page);shot(page,'59_round23_final.png')

    assert not errors,errors
    (QA/'stress_summary.json').write_text(json.dumps({'cards':ids,'scenarios':['scorch-tied','muster-8plus','spy-10-to-11','horn-bond','all-weather-clear','medic-muster','decoy-spy','round23-monster-skellige'],'pageErrors':errors},indent=2))
    ctx.close();browser.close()

print('gameplay-choreography-stress: 8 adversarial signature/lifecycle scenarios with pre-mid-final, reduced-motion and interruption coverage passed')

import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass11_golden_match'
QA.mkdir(parents=True,exist_ok=True)


def state(page):
    return page.evaluate('window.__GWENT_PASS11__.getState()')


def wait_stage_and_player(page, monitor, timeout=30000):
    deadline=time.time()+timeout/1000
    while time.time()<deadline:
        stage=page.evaluate("document.body.dataset.gcStage || null")
        now=time.perf_counter()*1000
        if stage!=monitor['last']:
            if monitor['last'] is not None and monitor['started'] is not None:
                monitor['durations'].append({'stage':monitor['last'],'durationMs':now-monitor['started']})
            monitor['last']=stage
            monitor['started']=now if stage is not None else None
            if stage=='round-end':
                monitor['roundShots']+=1
                page.screenshot(path=str(QA/f'{10+monitor["roundShots"]:02d}_round_end_{monitor["roundShots"]}.png'))
            elif stage=='match-result':
                monitor['matchShots']+=1
                page.screenshot(path=str(QA/f'{30+monitor["matchShots"]:02d}_match_result_stage.png'))
        ready=page.evaluate("""()=>{
          const s=window.__GWENT_PASS11__.getState();
          if(!s||window.GwentPresentationQueue.busy)return false;
          return !!s.winner || s.pendingChoice?.playerId==='p1' || (!s.pendingChoice&&s.currentPlayerId==='p1');
        }""")
        if ready:
            if monitor['last'] is not None:
                time.sleep(.03)
                continue
            return
        time.sleep(.02)
    raise AssertionError('Golden Match did not return to player/result within timeout')


def choose_player_action(page, force_pass=False):
    return page.evaluate("""forcePass=>{
      const api=window.__GWENT_PASS11__,s=api.getState(),G=api.engine;
      const actions=G.legalActions(s,'p1');
      const pass=actions.find(a=>a.type==='PASS')||null;
      if(forcePass&&pass)return pass;
      const score=pid=>['close','ranged','siege'].reduce((n,row)=>n+G.rowScore(s,pid,row),0);
      if(s.players.p2.passed&&score('p1')>score('p2')&&pass)return pass;
      const ranked=actions.filter(a=>a.type==='PLAY_CARD').map(a=>{
        const inst=s.players.p1.hand.find(c=>c.iid===a.iid),d=inst&&G.CARD_DB[inst.cardId];
        let p=Number(d?.strength)||0;
        const abilities=d?.abilities||[];
        if(abilities.includes('spy'))p+=100;
        if(abilities.includes('medic'))p+=80;
        if(abilities.includes('scorch'))p+=70;
        if(abilities.includes('decoy'))p+=60;
        if(d?.type==='weather')p+=45;
        if(abilities.includes('horn'))p+=40;
        if(abilities.includes('bond'))p+=30;
        return {action:a,cardId:inst?.cardId||null,priority:p,key:JSON.stringify(a)};
      }).sort((x,y)=>y.priority-x.priority||x.key.localeCompare(y.key));
      return ranked[0]?.action||pass||actions[0]||null;
    }""", force_pass)


def action_card_id(page, action):
    if not action or action.get('type')!='PLAY_CARD':
        return None
    return page.evaluate("""a=>{
      const s=window.__GWENT_PASS11__.getState();
      return s.players.p1.hand.find(c=>c.iid===a.iid)?.cardId||null;
    }""", action)


def commit_player_action(page, action):
    if action['type']=='PASS':
        page.locator('#pass-button').click()
        return
    assert action['type']=='PLAY_CARD',action
    iid=action['iid']
    card=page.locator(f'#hand [data-card-iid="{iid}"]')
    assert card.count()==1,f'hand card missing for action {action}'
    card.click()
    page.wait_for_timeout(20)
    assert page.evaluate('iid=>window.GwentDirectManipulation.selectedIid===iid',iid)
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',action)
    target=page.locator(f'[data-dm-action-key="{key}"]')
    assert target.count()==1,f'unique legal target missing for {action}'
    target.click()


def engine_shape_traces(page):
    return page.evaluate("""()=>{
      const api=window.__GWENT_PASS11__,G=api.engine,p=api.presets();
      function run(seed,p1Mode,p2Mode){
        let s=G.createMatch({
          p1Faction:p.player[0].faction,p2Faction:p.bot[0].faction,
          p1LeaderId:p.player[0].leaderId,p2LeaderId:p.bot[0].leaderId,
          p1Deck:p.player[0].deck,p2Deck:p.bot[0].deck,
          handSize:10,seed,firstPlayerId:'p1',
          validateDecks:true,shuffleDecks:true,mulligan:true
        });
        s=G.applyAction(s,{type:'FINISH_MULLIGAN'});
        let steps=0;
        while(!s.winner&&steps<300){
          if(s.pendingChoice){
            const xs=G.legalChoiceActions(s,s.pendingChoice.playerId).slice().sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
            if(!xs.length)throw new Error(`deadlocked choice ${s.pendingChoice.type}`);
            s=G.applyAction(s,xs[0]);steps++;continue;
          }
          const pid=s.currentPlayerId,mode=pid==='p1'?p1Mode:p2Mode;
          const xs=G.legalActions(s,pid);
          if(!xs.length)throw new Error(`deadlocked turn ${pid}`);
          const pass=xs.find(a=>a.type==='PASS');
          const plays=xs.filter(a=>a.type==='PLAY_CARD').slice().sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
          const a=mode==='pass'?(pass||xs[0]):(plays[0]||pass||xs[0]);
          s=a.type==='PASS'?G.pass(s,a):G.applyAction(s,a);
          steps++;
        }
        if(!s.winner)throw new Error(`trace exceeded step bound ${seed}`);
        const counts={};
        for(const e of s.eventLog)counts[e.type]=(counts[e.type]||0)+1;
        return {seed,p1Mode,p2Mode,winner:s.winner,rounds:s.roundHistory.length,steps,classification:s.classification,eventCounts:counts,roundHistory:s.roundHistory};
      }
      return {
        p1Victory:run(111601,'play','pass'),
        p2Victory:run(111602,'pass','play'),
        draw:run(111603,'pass','pass'),
        contested:run(20260910,'play','play')
      };
    }""")


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
    kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    ctx=browser.new_context(viewport={'width':393,'height':852})
    page=ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle')

    shapes=engine_shape_traces(page)
    assert shapes['p1Victory']['winner']=='p1',shapes['p1Victory']
    assert shapes['p2Victory']['winner']=='p2',shapes['p2Victory']
    assert shapes['draw']['winner']=='draw',shapes['draw']
    for name,trace in shapes.items():
        assert trace['classification']=='classic',trace
        assert trace['rounds']>=2,trace
        assert trace['steps']<300,trace
        assert trace['eventCounts'].get('ROUND_END',0)>=2,trace

    # Ordinary product path: no state injection, no developer controls.
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    assert page.locator('#mulligan-screen.active').count()==1
    # Exercise a real player mulligan before entering the battlefield.
    first=page.locator('#mulligan-screen [data-mulligan]').first
    assert first.count()==1
    first.click();page.wait_for_timeout(60)
    assert page.locator('#mulligan-count').inner_text().strip()=='1 / 2 USED'
    page.locator('#finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(120)
    assert page.locator('#match-screen.active').count()==1
    assert page.locator('#auto-bot').is_checked()
    started=state(page)
    assert started['classification']=='classic' and started['setupPhase']=='playing'
    assert len(started['players']['p1']['hand'])==10 and len(started['players']['p2']['hand'])==10
    page.screenshot(path=str(QA/'01_golden_match_start.png'))

    monitor={'last':None,'started':None,'durations':[],'roundShots':0,'matchShots':0}
    actions=[];player_plays_by_round={};choice_count=0;reloaded=False
    wait_stage_and_player(page,monitor)

    for step in range(90):
        s=state(page)
        if s['winner']:
            break
        if s.get('pendingChoice'):
            assert s['pendingChoice']['playerId']=='p1',s['pendingChoice']
            buttons=page.locator('[data-choice-index]')
            assert buttons.count()>0,f"Golden Match exposed unsupported player choice {s['pendingChoice']}"
            choice_type=s['pendingChoice']['type']
            buttons.first.click();choice_count+=1
            actions.append({'step':step,'round':s['round'],'type':'RESOLVE_CHOICE','choiceType':choice_type})
            wait_stage_and_player(page,monitor)
            continue

        assert s['currentPlayerId']=='p1',s['currentPlayerId']
        round_no=s['round']
        plays_this_round=player_plays_by_round.get(str(round_no),0)
        force_pass=(round_no==1 and plays_this_round>=3)
        action=choose_player_action(page,force_pass)
        assert action is not None,f'no player action in live Golden Match at step {step}'
        card_id=action_card_id(page,action)
        actions.append({'step':step,'round':round_no,'type':action['type'],'cardId':card_id,'row':action.get('row'),'targetIid':action.get('targetIid')})
        if action['type']=='PLAY_CARD':
            player_plays_by_round[str(round_no)]=plays_this_round+1
        commit_player_action(page,action)
        page.wait_for_timeout(20)
        wait_stage_and_player(page,monitor)

        # Prove one real ordinary mid-match reload/Continue path without injecting state.
        if not reloaded and len(actions)>=4:
            current=state(page)
            if not current['winner'] and not current.get('pendingChoice') and current['currentPlayerId']=='p1':
                before_reload=current
                page.screenshot(path=str(QA/'02_before_live_reload.png'))
                page.reload(wait_until='networkidle')
                assert page.locator('#continue-match').is_visible()
                page.locator('#continue-match').click()
                page.set_viewport_size({'width':852,'height':393})
                page.wait_for_timeout(100)
                assert state(page)==before_reload
                reloaded=True
                page.screenshot(path=str(QA/'03_after_live_reload.png'))
                wait_stage_and_player(page,monitor)
    else:
        raise AssertionError('Golden Match browser loop exceeded 90 player steps')

    final=state(page)
    assert final['winner'] in ('p1','p2','draw'),final['winner']
    assert len(final['roundHistory'])>=2,final['roundHistory']
    assert any(a['type']=='PASS' for a in actions),'ordinary UI path never exercised explicit player pass'
    assert reloaded,'ordinary match never exercised reload/Continue'
    page.wait_for_function('!window.GwentPresentationQueue.busy',timeout=10000)
    result=page.locator('[data-result]')
    result.wait_for(state='visible',timeout=5000)
    saved=page.evaluate('window.GwentStorage.readMatch()')
    assert saved['phase']=='result' and saved['state']==final
    page.screenshot(path=str(QA/'40_terminal_result.png'))

    # Pacing proof from the same natural match, not injected choreography.
    round_durations=[x['durationMs'] for x in monitor['durations'] if x['stage']=='round-end']
    match_durations=[x['durationMs'] for x in monitor['durations'] if x['stage']=='match-result']
    assert len(round_durations)>=len(final['roundHistory']),monitor['durations']
    assert match_durations,monitor['durations']
    assert min(round_durations)>=450,round_durations
    assert min(match_durations)>=450,match_durations

    prior_seed=saved['setup']['seed']
    page.locator('#result-rematch').click()
    assert page.locator('#mulligan-screen.active').count()==1
    rematch=page.evaluate('window.GwentStorage.readMatch()')
    assert rematch['phase']=='mulligan' and rematch['setup']['seed']==prior_seed+1
    assert rematch['state']['winner'] is None
    page.screenshot(path=str(QA/'50_fresh_rematch_mulligan.png'),full_page=True)

    assert not errors,errors
    summary={
      'engineShapes':shapes,
      'winner':final['winner'],
      'roundHistory':final['roundHistory'],
      'playerActions':actions,
      'playerChoiceCount':choice_count,
      'liveReloadRestoredExactly':reloaded,
      'stageDurations':monitor['durations'],
      'roundEndDurationsMs':round_durations,
      'matchResultDurationsMs':match_durations,
      'savedTerminalPhase':saved['phase'],
      'rematchSeedAdvanced':rematch['setup']['seed']==prior_seed+1,
      'pageErrors':errors,
      'viewport':'852x393'
    }
    (QA/'golden_match_summary.json').write_text(json.dumps(summary,indent=2))
    ctx.close();browser.close()

print('pass11-golden-match: engine victory/defeat/draw traces + ordinary Instant Match start-to-result/rematch gate passed')
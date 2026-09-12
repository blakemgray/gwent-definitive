import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()


def enter(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393});page.wait_for_timeout(180)


def prepare_ordinary(page):
    # This inherited 10.4A gate is about presentation-aware bot scheduling, not
    # authored 10.4B ability duration. Normalize one existing hand instance to
    # the canonical ability-free Redanian Foot Soldier so the deliberately
    # stretched animation cannot accidentally become a multi-stage Bond/etc.
    page.evaluate("""()=>{
      const api=window.__GWENT_PASS10__,s=api.getState();
      if(!s.players.p1.hand.length)throw new Error('QA state has no player card');
      s.players.p1.hand[0].cardId='realms_redania';
      api.setStateForQA(s);window.GwentBattlefieldUX.reconcile();
    }""");page.wait_for_timeout(45)


def ordinary(page):
    return page.evaluate("""()=>{
      const api=window.__GWENT_PASS10__,s=api.getState(),G=api.engine;
      for(const inst of s.players.p1.hand){
        const d=G.CARD_DB[inst.cardId];
        if(d.type==='unit'&&d.abilities.length===0){
          const action=G.legalActions(s,'p1').find(a=>a.type==='PLAY_CARD'&&a.iid===inst.iid);
          if(action)return {iid:inst.iid,action,cardId:inst.cardId,abilities:[...d.abilities]};
        }
      }
      return null;
    }""")


def fingerprint_p2(page):
    return page.evaluate("""()=>{const s=window.__GWENT_PASS10__.getState();return JSON.stringify({turn:s.currentPlayerId,hand:s.players.p2.hand.map(x=>x.iid),board:['close','ranged','siege'].map(r=>s.players.p2.board[r].map(x=>x.iid)),passed:s.players.p2.passed,round:s.round,winner:s.winner});}""")


def p2_hand_count(page):
    return page.evaluate("window.__GWENT_PASS10__.getState().players.p2.hand.length")


def select_and_commit(page,item):
    page.locator(f'#hand [data-card-iid="{item["iid"]}"]').click()
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',item['action'])
    target=page.locator(f'[data-dm-action-key="{key}"]');assert target.count()==1
    target.click()


def wait_player_presentation_released(page,timeout=7000):
    # Wait on the exact contract under test: the player presentation is fully
    # reconciled and its bot gate has released. This avoids conflating the
    # subsequent, legitimately scheduled bot presentation with "player idle".
    page.wait_for_function("!window.GwentPresentationQueue.busy&&!window.GwentInteractionTurnGate.pending",timeout=timeout)


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs);page=browser.new_page(viewport={'width':852,'height':393});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)
    assert page.locator('#auto-bot').is_checked()
    assert page.evaluate("window.GwentInteractionTurnGate?.version==='10.4A.0'")
    prepare_ordinary(page)

    # Stretch presentation deliberately beyond the legacy 220ms bot delay.
    page.evaluate("""()=>{
      window.__qaOriginalAnimate=Element.prototype.animate;
      Element.prototype.animate=function(frames,options){
        let next=options;
        if(options&&typeof options==='object')next={...options,duration:Math.max(720,Number(options.duration)||0)};
        return window.__qaOriginalAnimate.call(this,frames,next);
      };
    }""")
    item=ordinary(page);assert item and item['cardId']=='realms_redania' and item['abilities']==[],item
    select_and_commit(page,item)
    page.wait_for_timeout(60)
    assert page.evaluate('window.GwentPresentationQueue.busy'),'presentation did not become busy'
    assert page.evaluate('window.GwentInteractionTurnGate.pending'),'bot gate was not armed'
    assert page.evaluate("window.__GWENT_PASS10__.getState().currentPlayerId==='p2'"),'player commit should hand turn to bot in engine immediately'
    frozen=fingerprint_p2(page)

    # If the old scheduler escaped, it would mutate at ~220ms. Hold well beyond that.
    page.wait_for_timeout(360)
    assert page.evaluate('window.GwentPresentationQueue.busy'),'stretched presentation ended too early'
    assert page.evaluate('window.GwentInteractionTurnGate.pending'),'bot gate released during presentation'
    assert fingerprint_p2(page)==frozen,'bot mutated authoritative state while player animation was still active'

    wait_player_presentation_released(page)
    just_finished=fingerprint_p2(page)
    assert just_finished==frozen,'bot should not move synchronously at presentation completion'
    page.wait_for_timeout(310)
    after_bot=fingerprint_p2(page)
    assert after_bot!=frozen,'bot did not resume after presentation settled'
    stats=page.evaluate('window.GwentInteractionTurnGate.stats')
    assert stats['deferrals']>=1 and stats['releases']>=1 and not stats['pending'],stats

    # Cancellation is equally safe: committed engine result survives, transient visuals die,
    # then bot is re-armed from the reconciled state rather than running concurrently.
    page.evaluate("""()=>{Element.prototype.animate=window.__qaOriginalAnimate;window.GwentDirectManipulation.reduced(false);}""")
    page.evaluate("""()=>{
      const api=window.__GWENT_PASS10__,s=api.getState();
      // deterministic fresh player-turn slice, no board/hand assumptions from bot's prior move
      s.currentPlayerId='p1';s.players.p1.passed=false;s.players.p2.passed=false;s.winner=null;s.pendingChoice=null;
      if(!s.players.p1.hand.length)throw new Error('QA state has no second player card');
      s.players.p1.hand[0].cardId='realms_redania';
      api.setStateForQA(s);window.GwentBattlefieldUX.reconcile();
    }""");page.wait_for_timeout(60)
    item=ordinary(page);assert item and item['cardId']=='realms_redania' and item['abilities']==[],item
    # Stretch again, then cancel explicitly after engine commit.
    page.evaluate("""()=>{Element.prototype.animate=function(frames,options){let next=options;if(options&&typeof options==='object')next={...options,duration:Math.max(700,Number(options.duration)||0)};return window.__qaOriginalAnimate.call(this,frames,next);};}""")
    select_and_commit(page,item);page.wait_for_timeout(80)
    assert page.evaluate('window.GwentPresentationQueue.busy&&window.GwentInteractionTurnGate.pending')
    frozen2=fingerprint_p2(page)
    page.evaluate("window.GwentPresentationQueue.cancel('qa-interruption')");page.wait_for_timeout(35)
    assert not page.evaluate('window.GwentPresentationQueue.busy')
    assert not page.evaluate('window.GwentInteractionTurnGate.pending')
    assert fingerprint_p2(page)==frozen2,'cancellation itself must not advance bot state'
    page.wait_for_timeout(310)
    assert fingerprint_p2(page)!=frozen2,'bot did not resume after interrupted presentation reconciled'

    # The preceding cancellation scenario intentionally re-arms a bot action and
    # therefore can still own a presentation here. Quiesce that scenario before
    # injecting the independent bot->bot fixture: disable auto-bot, clear its
    # timer, cancel any active presentation, and let the gate cleanup microtask
    # observe the disabled toggle so it cannot schedule another action.
    page.evaluate("""()=>{
      const toggle=document.querySelector('#auto-bot');
      toggle.checked=false;
      window.__GWENT_PASS10__.maybeAutoBot();
      window.GwentPresentationQueue.cancel('qa-reset-before-bot-chain');
    }""")
    page.wait_for_timeout(60)
    assert not page.evaluate('window.GwentPresentationQueue.busy'),'prior scenario presentation did not quiesce'

    # Pass 11 F1 regression: once the player has passed, p2 may legally own several
    # consecutive actions. The bot's own first action must now gate the second and
    # every later action exactly as strictly as player -> bot. This fixture gives p1
    # a durable lead and normalizes the entire p2 hand to low ordinary units so the
    # bot must keep playing instead of immediately passing.
    page.evaluate("""()=>{
      Element.prototype.animate=window.__qaOriginalAnimate;
      const api=window.__GWENT_PASS10__,s=api.getState();
      for(const pid of ['p1','p2'])for(const row of ['close','ranged','siege'])s.players[pid].board[row]=[];
      s.weather={close:false,ranged:false,siege:false};s.weatherCards=[];
      s.pendingChoice=null;s.winner=null;s.currentPlayerId='p2';
      s.players.p1.passed=true;s.players.p2.passed=false;
      if(!s.players.p1.hand.length)throw new Error('QA state has no lead card');
      const lead=s.players.p1.hand.shift();lead.cardId='realms_esterad';s.players.p1.board.close.push(lead);
      while(s.players.p2.hand.length<4&&s.players.p2.deck.length)s.players.p2.hand.push(s.players.p2.deck.shift());
      if(s.players.p2.hand.length<4)throw new Error('QA state cannot provide four bot cards');
      s.players.p2.hand.forEach(c=>c.cardId='realms_redania');
      api.setStateForQA(s);window.GwentBattlefieldUX.reconcile();
      Element.prototype.animate=function(frames,options){
        let next=options;
        if(options&&typeof options==='object')next={...options,duration:Math.max(760,Number(options.duration)||0)};
        return window.__qaOriginalAnimate.call(this,frames,next);
      };
      document.querySelector('#auto-bot').checked=true;
    }""");page.wait_for_timeout(70)
    start_count=p2_hand_count(page)
    assert start_count>=4,start_count
    page.evaluate('window.__GWENT_PASS10__.botMove()')
    page.wait_for_timeout(80)
    assert page.evaluate('window.GwentPresentationQueue.busy'),'first bot presentation did not become busy'
    after_first=p2_hand_count(page)
    assert after_first==start_count-1,(start_count,after_first)
    frozen_bot_chain=fingerprint_p2(page)

    # Current unfixed F1 mutates again at the legacy 220ms timer while this first
    # bot presentation is still unresolved. This assertion is the adversarial repro.
    page.wait_for_timeout(360)
    assert page.evaluate('window.GwentPresentationQueue.busy'),'first bot presentation ended before F1 observation window'
    assert fingerprint_p2(page)==frozen_bot_chain,'F1 reproduced: consecutive bot action mutated while prior bot presentation was still busy'

    # Once presentation cleanup is truly idle, exactly one next bot action may be
    # re-armed. It must not happen synchronously with cleanup.
    page.wait_for_function('!window.GwentPresentationQueue.busy',timeout=7000)
    idle_count=p2_hand_count(page)
    assert idle_count==after_first,(idle_count,after_first)
    page.wait_for_timeout(320)
    second_count=p2_hand_count(page)
    assert second_count==after_first-1,(after_first,second_count)
    assert page.evaluate('window.GwentPresentationQueue.busy'),'second bot presentation did not become busy'
    frozen_second=fingerprint_p2(page)
    page.wait_for_timeout(320)
    assert page.evaluate('window.GwentPresentationQueue.busy'),'second bot presentation ended too early'
    assert fingerprint_p2(page)==frozen_second,'third bot action mutated during second bot presentation'

    # Cancellation is a cleanup boundary too: no immediate mutation, followed by
    # one deferred eligible bot action on the normal delay.
    page.evaluate("window.GwentPresentationQueue.cancel('qa-bot-chain-interruption')");page.wait_for_timeout(45)
    assert not page.evaluate('window.GwentPresentationQueue.busy')
    cancel_count=p2_hand_count(page)
    assert cancel_count==second_count,(cancel_count,second_count)
    page.wait_for_timeout(320)
    assert p2_hand_count(page)==second_count-1,'bot did not re-arm exactly once after bot-presentation cancellation cleanup'

    page.evaluate("""()=>{Element.prototype.animate=window.__qaOriginalAnimate;}""")
    assert not errors,errors
    browser.close()

print('presentation-turn-gate-ui: player->bot and bot->bot mutation remain serialized behind presentation cleanup; completion and interruption re-arm one eligible opponent action')

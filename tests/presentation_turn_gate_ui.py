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

    assert not errors,errors
    browser.close()

print('presentation-turn-gate-ui: bot mutation blocked past legacy 220ms delay during presentation; completion and interruption both re-arm bot only after reconciliation')
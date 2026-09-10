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
    page.set_viewport_size({'width':852,'height':393})
    page.wait_for_timeout(180)
    page.evaluate('window.GwentDirectManipulation.reduced(true)')


def scenario(page,card_id,decoy=False):
    return page.evaluate("""({cardId,decoy})=>{
      const api=window.__GWENT_PASS10__,G=api.engine,s=api.getState();
      for(const pid of ['p1','p2']){
        for(const row of G.ROWS){
          s.players[pid].board[row]=[];
          s.players[pid].board.special[row]=null;
          s.players[pid].board.leaderHorn[row]=false;
        }
        s.players[pid].passed=false;
      }
      s.weather={close:false,ranged:false,siege:false};
      s.weatherCards=[];s.pendingChoice=null;s.pendingResume=null;s.winner=null;
      s.currentPlayerId='p1';s.players.p2.passed=true;
      s.players.p1.hand=[
        {iid:'qa-polish-card',cardId},
        {iid:'qa-polish-filler',cardId:'realms_blue_stripes'}
      ];
      if(decoy)s.players.p1.board.close=[{iid:'qa-polish-target',cardId:'realms_keira'}];
      return s;
    }""",{'cardId':card_id,'decoy':decoy})


def reset(page,s):
    page.evaluate("s=>{window.GwentDirectManipulation.cancel('polish-reset');window.__GWENT_PASS10__.setStateForQA(s);window.GwentBattlefieldUX.reconcile();}",s)
    page.wait_for_timeout(45)


def pick(page,row=None,target=None):
    return page.evaluate("""({row,target})=>window.GwentDirectManipulation.actionsFor('qa-polish-card').find(a=>(row==null||a.row===row)&&(target==null||a.targetIid===target))||null""",{'row':row,'target':target})


def wait_idle(page):
    page.evaluate('window.GwentDirectManipulation.waitForIdle(4000)')
    page.wait_for_timeout(25)


def tap_commit(page,action):
    page.locator('#hand [data-card-iid="qa-polish-card"]').click()
    key=page.evaluate('a=>window.GwentDirectManipulation.actionKey(a)',action)
    target=page.locator(f'[data-dm-action-key="{key}"]')
    assert target.count()==1
    target.click();wait_idle(page)
    return page.evaluate('window.GwentDirectManipulation.lastSettlement')


def center(r):return (r['x']+r['width']/2,r['y']+r['height']/2)


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE');kwargs={'args':['--no-sandbox']}
    if not exe and Path('/usr/bin/chromium').exists():exe='/usr/bin/chromium'
    if exe:kwargs['executable_path']=exe
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':852,'height':393});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));enter(page)

    # A completed-action toast must be truly dismissed, not merely hidden while
    # selection CSS happens to be active. Otherwise it can reappear after Escape.
    base=scenario(page,'realms_keira');reset(page,base)
    page.evaluate("()=>{const t=document.querySelector('#toast');t.textContent='STALE ACTION';t.classList.add('show');}")
    page.locator('#hand [data-card-iid="qa-polish-card"]').click()
    assert not page.locator('#toast').evaluate("e=>e.classList.contains('show')"),'stale toast class survived fresh selection'
    page.keyboard.press('Escape');page.wait_for_timeout(45)
    assert not page.locator('#toast').evaluate("e=>e.classList.contains('show')"),'stale toast reappeared after selection cancellation'
    assert page.evaluate('window.GwentDirectManipulation.stats.toastDismissals')>=1

    cases=[]
    for name,card_id,row,target,decoy,expected_kind,expected_resolution in [
        ('ordinary','realms_keira','ranged',None,False,'row','final-card'),
        ('spy','realms_thaler','siege',None,False,'row','final-card'),
        ('weather','weather_frost',None,None,False,'weather','semantic-destination'),
        ('scorch','special_scorch',None,None,False,'global','semantic-destination'),
        ('horn','special_horn','close',None,False,'special','semantic-destination'),
        # Decoy itself persists on the board where the swapped unit stood. That
        # rendered card is therefore the strongest post-commit landing authority;
        # the continuity assertion below separately proves its final center still
        # matches the exact target unit center captured before the swap.
        ('decoy','special_decoy',None,'qa-polish-target',True,'target','final-card'),
    ]:
        base=scenario(page,card_id,decoy);reset(page,base)
        action=pick(page,row,target);assert action,f'{name}: missing action'
        # Capture the player's semantic destination before commit for continuity checks.
        dest_box=page.evaluate("""a=>{
          const dm=window.GwentDirectManipulation,d=dm.normalizeDestination(a);let el=null;
          if(d.kind==='row')el=document.querySelector(`#match-screen .lane[data-pid="${d.playerId}"][data-row="${d.row}"] .units`);
          else if(d.kind==='special')el=document.querySelector(`#match-screen .lane[data-pid="${d.playerId}"][data-row="${d.row}"] .special-slot-wrap`);
          else if(d.kind==='target')el=document.querySelector(`#match-screen [data-inspect-board="${d.targetIid}"]`);
          else el=document.querySelector('#match-screen .weather');
          if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};
        }""",action)
        assert dest_box,f'{name}: no precommit destination box'
        settlement=tap_commit(page,action);assert settlement,f'{name}: no settlement diagnostic'
        assert settlement['destination']['kind']==expected_kind,(name,settlement)
        assert settlement['resolvedBy']==expected_resolution,(name,settlement)
        assert settlement['resolvedBy']!='board-fallback',(name,settlement)
        sr=settlement['rect'];assert sr and sr['width']>0 and sr['height']>0,(name,settlement)
        sx,sy=center(sr);dx,dy=center(dest_box)
        # Persistent zone anchors are centered inside their semantic destination;
        # Decoy's surviving board card must occupy the exact center vacated by the
        # returned target unit, preserving source-to-destination continuity.
        if name=='decoy':
            assert abs(sx-dx)<=1.25 and abs(sy-dy)<=1.25,(name,sr,dest_box)
        elif name in ('weather','scorch'):
            assert dest_box['x']-1<=sx<=dest_box['x']+dest_box['width']+1,(name,sr,dest_box)
            assert abs(sx-dx)<=1.25,(name,sr,dest_box)
            assert sr['width']<=42.5,'zone flight expanded card to full weather-band width'
        elif name=='horn':
            assert abs(sx-dx)<=1.25 and abs(sy-dy)<=1.25,(name,sr,dest_box)
        cases.append((name,settlement['resolvedBy']))

    # Special/weather cards remain name-resolvable after commit for live-region feedback.
    base=scenario(page,'special_horn');reset(page,base);a=pick(page,'close');tap_commit(page,a)
    live=page.locator('#dm-live').text_content() or ''
    assert 'Card played.'!=live.strip(),live

    assert not errors,errors
    browser.close()

print('interaction-polish-ui: durable stale-feedback dismissal + semantic landing continuity passed for ordinary, Spy, Weather, Scorch, Horn, and Decoy; 0 board-center fallbacks')

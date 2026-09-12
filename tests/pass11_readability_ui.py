import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GWENT_TEST_URL') or (ROOT/'index.html').as_uri()
QA=ROOT/'qa'/'pass11_readability'
QA.mkdir(parents=True,exist_ok=True)
errors=[]


def enter_match(page):
    page.goto(BASE,wait_until='networkidle')
    page.locator('#main-screen [data-nav="play-screen"]').click()
    page.locator('#play-screen #quick-start').click()
    assert page.locator('#mulligan-screen.active').count()==1
    page.locator('#mulligan-screen #finish-mulligan').click()
    page.set_viewport_size({'width':852,'height':393})
    page.wait_for_timeout(160)
    assert page.locator('#match-screen.active').count()==1


def set_readability_state(page,count,weather=False):
    page.evaluate("""({count,weather})=>{
      const api=window.__GWENT_PASS10__, G=api.engine;
      const s=api.getState(), p=s.players.p1;
      const pool=[...p.hand,...p.deck,...p.grave,...p.board.close,...p.board.ranged,...p.board.siege];
      const source=pool.find(inst=>{
        const d=G.CARD_DB[inst.cardId];
        return d?.type==='unit' && Number(d.strength||0)>1 && !(d.abilities||[]).includes('hero') && (d.abilities||[]).length===0;
      }) || pool.find(inst=>{
        const d=G.CARD_DB[inst.cardId];
        return d?.type==='unit' && Number(d.strength||0)>1 && !(d.abilities||[]).includes('hero');
      });
      if(!source)throw new Error('No suitable readability QA unit found');
      p.board.close=Array.from({length:count},(_,i)=>({...source,iid:`qa-readable-${count}-${i}`}));
      p.board.ranged=[];p.board.siege=[];
      s.weather={...s.weather,close:!!weather};
      api.setStateForQA(s);
      window.GwentBattlefieldUX?.reconcile?.();
      window.GwentBattlefieldReadability?.refresh?.();
    }""",{'count':count,'weather':weather})
    page.wait_for_timeout(100)


def set_all_rows_card_fit_state(page):
    page.evaluate("""()=>{
      const api=window.__GWENT_PASS10__, G=api.engine, s=api.getState();
      for(const pid of ['p1','p2']){
        const p=s.players[pid];
        const pool=[...p.hand,...p.deck,...p.grave,...p.board.close,...p.board.ranged,...p.board.siege];
        const source=pool.find(inst=>G.CARD_DB[inst.cardId]?.type==='unit');
        if(!source)throw new Error(`No ${pid} unit available for battlefield card-fit QA`);
        for(const row of G.ROWS){
          p.board[row]=[{...source,iid:`qa-fit-${pid}-${row}`}];
        }
      }
      s.weather={close:false,ranged:false,siege:false};
      api.setStateForQA(s);
      window.GwentBattlefieldUX?.reconcile?.();
      window.GwentBattlefieldReadability?.refresh?.();
    }""")
    page.wait_for_timeout(120)


def expected_power(page,iid):
    return page.evaluate("""iid=>{
      const api=window.__GWENT_PASS10__,G=api.engine,s=api.getState();
      const inst=s.players.p1.board.close.find(c=>c.iid===iid);
      return G.helpers.effectiveCardPower(s,'p1','close',inst);
    }""",iid)


with sync_playwright() as p:
    exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
    kwargs={'args':['--no-sandbox']}
    if exe: kwargs['executable_path']=exe
    elif Path('/usr/bin/chromium').exists(): kwargs['executable_path']='/usr/bin/chromium'
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':852,'height':393})
    page.on('pageerror',lambda e: errors.append(str(e)))
    enter_match(page)

    assert page.evaluate("window.GwentBattlefieldReadability?.version==='11.2A.0'")

    for idx,count in enumerate([1,2,4,8,12],start=1):
        set_readability_state(page,count,False)
        cards=page.locator('#match-screen .lane[data-pid="p1"][data-row="close"] .unit[data-inspect-board]')
        assert cards.count()==count
        assert cards.locator('.u-score').count()==count
        for i in range(cards.count()):
            card=cards.nth(i)
            iid=card.get_attribute('data-inspect-board')
            exp=expected_power(page,iid)
            assert card.get_attribute('data-current-power')==str(exp)
            assert card.locator('.u-score').inner_text().strip()==str(exp)
            aria=card.get_attribute('aria-label') or ''
            assert 'current power' in aria.lower() and 'row' in aria.lower(),aria
            assert card.locator('img').count()==1
        page.screenshot(path=str(QA/f'{idx:02d}_density_{count:02d}.png'))

    set_readability_state(page,1,False)
    card=page.locator('#match-screen .lane[data-pid="p1"][data-row="close"] .unit[data-inspect-board]').first
    base=int(card.get_attribute('data-current-power'))
    assert card.get_attribute('data-power-modified') in ('false','true')
    page.screenshot(path=str(QA/'06_base_power.png'))

    set_readability_state(page,1,True)
    card=page.locator('#match-screen .lane[data-pid="p1"][data-row="close"] .unit[data-inspect-board]').first
    weathered=int(card.get_attribute('data-current-power'))
    assert weathered<=base
    assert card.get_attribute('data-power-modified')=='true'
    assert card.get_attribute('data-power-direction')=='down'
    assert card.locator('.u-score.modified-power').count()==1
    page.screenshot(path=str(QA/'07_weather_modified_power.png'))

    # Real-device regression: every placed card, on both sides and all rows,
    # must preserve the full card face instead of cover-cropping its left/right edges.
    # Geometry stays owned by Pass 10.3; this only locks the image fitting behavior.
    set_all_rows_card_fit_state(page)
    fit_cards=page.locator('#match-screen .lane .unit[data-inspect-board]')
    assert fit_cards.count()==6, fit_cards.count()
    for pid in ('p1','p2'):
        for row in ('close','ranged','siege'):
            card=page.locator(f'#match-screen .lane[data-pid="{pid}"][data-row="{row}"] .unit[data-inspect-board]').first
            assert card.count()==1,(pid,row)
            img=card.locator('img')
            assert img.count()==1,(pid,row)
            fit=img.evaluate("el=>getComputedStyle(el).objectFit")
            pos=img.evaluate("el=>getComputedStyle(el).objectPosition")
            natural=img.evaluate("el=>({w:el.naturalWidth,h:el.naturalHeight,complete:el.complete})")
            rect=card.bounding_box();assert rect
            assert fit=='contain',(pid,row,fit)
            assert pos in ('50% 50%','center'),(pid,row,pos)
            assert natural['complete'] and natural['w']>0 and natural['h']>0,(pid,row,natural)
            assert abs((rect['width']/rect['height'])-0.696)<0.03,(pid,row,rect)
    page.screenshot(path=str(QA/'08_full_card_face_all_rows_both_sides.png'))

    # Existing 10.3 geometry remains the final authority; the readability layer
    # must not write inline final-slot geometry.
    geometry_writes=page.evaluate("""()=>[...document.querySelectorAll('#match-screen .unit[data-inspect-board]')].some(el=>el.style.getPropertyValue('--readability-left')||el.style.getPropertyValue('--readability-top'))""")
    assert not geometry_writes
    assert not errors,errors
    browser.close()

print('pass11-readability-ui: power/readability plus full battlefield card-face fitting passed')

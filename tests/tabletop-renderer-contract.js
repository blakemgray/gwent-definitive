'use strict';

// Real DOM coverage: run with a Playwright installation, or point
// GWENT_PLAYWRIGHT_MODULE at the bundled runtime's Playwright package.
const fs=require('fs'),path=require('path'),assert=require('assert');
const Renderer=require('../src/tabletop-renderer.js');
const source=fs.readFileSync(path.resolve(__dirname,'../src/tabletop-renderer.js'),'utf8');

async function main(){
  const disabled=Renderer.create({location:{search:'?tabletop=0'}});
  assert.strictEqual(disabled.enabled,false);
  assert.strictEqual(disabled.reconcile({}),false,'baseline mode must not touch the DOM');
  assert.strictEqual(disabled.snapshot().reconciliations,0);

  let playwright;
  try{playwright=require(process.env.GWENT_PLAYWRIGHT_MODULE||'playwright');}
  catch(error){throw new Error('Tabletop renderer DOM contract requires Playwright; set GWENT_PLAYWRIGHT_MODULE to an available package. No DOM test was run.',{cause:error});}
  const options={headless:true};
  if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if(process.env.GWENT_BROWSER_CHANNEL)options.channel=process.env.GWENT_BROWSER_CHANNEL;
  let browser;
  try{browser=await playwright.chromium.launch(options);}
  catch(error){
    if(options.channel||options.executablePath||process.platform!=='win32')throw error;
    browser=await playwright.chromium.launch({headless:true,channel:'msedge'});
  }
  try{
    const page=await browser.newPage();
    await page.route('https://tabletop.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="board-geometry"></div><div id="board"></div><div id="hand"></div>'}));
    await page.goto('https://tabletop.test/?tabletop=1');
    await page.addScriptTag({content:source});
    const result=await page.evaluate(()=>{
      const renderer=window.GwentTabletopRenderer;
      let checks=0;
      const check=(value,message)=>{if(!value)throw new Error(message);checks++;};
      const card=(iid,board=false,power=4,src='art.svg')=>`<button class="${board?'unit':'hand-card'}" ${board?'data-inspect-board':'data-card-iid'}="${iid}" title="Card ${iid}"><img src="${src}" alt="Card ${iid}">${board?`<span class="u-score">${power}</span><span class="u-mark"></span>`:`<span class="hc-name">Card ${iid}</span>`}</button>`;
      const lane=(pid,row,html,score)=>`<div class="lane" data-pid="${pid}" data-row="${row}"><div class="rlabel">${row}</div><div class="special-slot-wrap"><div class="special-slot"></div></div><div class="units">${html}</div><div class="rscore">${score}</div></div>`;
      const reconcile=(boardHTML,handHTML)=>renderer.reconcile({boardHTML,handHTML,geometryHTML:'<div class="geometry-weather"></div>'});
      check(renderer.enabled,'query opts into tabletop mode');
      check(reconcile(lane('p1','close',card('placed',true),4),card('played')+card('stays')),'initial reconciliation succeeds');
      const placed=document.querySelector('[data-inspect-board="placed"]');
      const placedImage=placed.querySelector('img');
      const played=document.querySelector('[data-card-iid="played"]');
      const playedImage=played.querySelector('img');
      const stays=document.querySelector('[data-card-iid="stays"]');
      const units=placed.parentElement;
      placed.style.cssText='left: 33px; top: 9px; width: 64px; height: 121px; transform: rotate(3deg); visibility: hidden';
      placed.classList.add('gc-held');placed.dataset.continuityGuardIid='placed';
      played.style.transform='rotate(-2deg)';
      const pose=placed.style.cssText;

      check(reconcile(lane('p1','close',card('placed',true,9)+card('played',true,7),16),card('stays')),'normal semantic move reconciles');
      check(document.querySelector('[data-inspect-board="placed"]')===placed,'unrelated commit keeps settled card node');
      check(placed.querySelector('img')===placedImage,'unrelated commit keeps loaded image node');
      check(placed.parentElement===units,'semantic rail remains stable');
      check(placed.style.cssText===pose,'presentation pose and active visibility lease survive');
      check(placed.classList.contains('gc-held')&&placed.dataset.continuityGuardIid==='placed','active actor marks survive');
      check(placed.querySelector('.u-score').textContent==='9','effective power markup refreshes');
      check(document.querySelector('.rscore').textContent==='16','row score markup refreshes');
      check(document.querySelector('[data-inspect-board="played"]')===played,'hand to board retains the same card body');
      check(played.querySelector('img')===playedImage,'hand to board retains the same loaded image');
      check(!played.hasAttribute('data-card-iid')&&played.classList.contains('unit')&&!played.classList.contains('hand-card'),'hand to board changes semantic attributes and classes');
      check(!played.querySelector('.hc-name')&&!!played.querySelector('.u-score'),'hand-only copy retires and board annotations appear');
      check(played.style.transform==='rotate(-2deg)','hand to board keeps scene-owned pose');
      check(document.querySelector('[data-card-iid="stays"]')===stays,'other hand cards survive');
      check(renderer.snapshot().moved===1&&renderer.snapshot().liveCount===3,'identity snapshot records semantic move');

      check(reconcile(lane('p1','close',card('placed',true,9),9),card('played')+card('stays')),'Decoy-like return reconciles');
      check(document.querySelector('[data-card-iid="played"]')===played&&played.querySelector('img')===playedImage,'board to hand retains body and image');
      check(!played.hasAttribute('data-inspect-board')&&!played.querySelector('.u-score'),'return removes board semantics');
      check(reconcile(lane('p1','close',card('placed',true,9,'changed.svg'),9),card('played')),'content change and retirement reconcile');
      check(placed.querySelector('img')===placedImage&&placedImage.getAttribute('src')==='changed.svg','same-iid art transformation updates source without replacing image');
      check(!stays.isConnected&&renderer.snapshot().liveCount===2,'retired body disappears from DOM and registry');

      let resetEvent=null;
      window.addEventListener('gwent:tabletop-reset',event=>{resetEvent=event.detail;});
      renderer.reset('test-new-match');
      check(resetEvent?.reason==='test-new-match'&&renderer.snapshot().liveCount===0,'lifecycle reset invalidates prior body registry and notifies scene');
      check(reconcile(lane('p1','close',card('placed',true),4),card('played')),'new match reconciles');
      const fresh=document.querySelector('[data-inspect-board="placed"]');
      check(fresh!==placed&&fresh.querySelector('img')!==placedImage,'reused deterministic iid in a new match creates a fresh body');
      check(!fresh.style.transform&&!fresh.dataset.continuityGuardIid&&!fresh.classList.contains('gc-held'),'new match carries no prior pose or actor lease');

      const before=document.querySelector('#board').innerHTML;
      check(!reconcile(lane('p1','close',card('duplicate',true)+card('duplicate',true),8),''),'duplicate semantic identity is rejected');
      check(document.querySelector('#board').innerHTML===before,'validation failure does not partially rewrite DOM');
      check(renderer.snapshot().errors===1,'failure is visible in diagnostics');
      return {checks,snapshot:renderer.snapshot()};
    });
    // Diagnostics also run in baseline mode. A new match must invalidate its
    // prior-session evidence even when persistent rendering is disabled.
    await page.goto('https://tabletop.test/?tabletop=0');
    await page.addScriptTag({content:source});
    const baseline=await page.evaluate(()=>{
      const before=document.body.innerHTML;
      let detail=null;
      window.addEventListener('gwent:tabletop-reset',event=>{detail=event.detail;});
      window.GwentTabletopRenderer.reset('baseline-new-match');
      return {enabled:window.GwentTabletopRenderer.enabled,reason:detail?.reason,generation:detail?.generation,
        untouched:document.body.innerHTML===before};
    });
    assert.strictEqual(baseline.enabled,false);
    assert.strictEqual(baseline.reason,'baseline-new-match','baseline lifecycle reset must notify diagnostics');
    assert.strictEqual(baseline.generation,1);
    assert.strictEqual(baseline.untouched,true,'baseline reset notification must not alter existing DOM');
    console.log(`tabletop-renderer-contract: ${result.checks+7} assertions passed in a real browser DOM`);
  }finally{await browser.close();}
}

main().catch(error=>{console.error(error);process.exitCode=1;});

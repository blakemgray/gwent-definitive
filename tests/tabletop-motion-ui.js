'use strict';
// Normal pointer paths prove authority and contact. State injection is used only
// in the separately labelled crowded-layout/inspection fixture.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const PW=require(process.env.GWENT_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.GWENT_TEST_URL||'http://127.0.0.1:4173/';
const out=path.resolve(process.env.GWENT_QA_DIR||'qa/tabletop_motion');fs.mkdirSync(out,{recursive:true});
async function makeContext(browser,options){const context=await browser.newContext(options);context.setDefaultTimeout(15000);context.setDefaultNavigationTimeout(30000);return context;}
const frame=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function idle(page){await page.evaluate(()=>window.GwentDirectManipulation.waitForIdle(12000));try{await page.waitForFunction(()=>!window.GwentPresentationQueue.busy&&!document.body.dataset.gcStage&&!window.GwentTabletopScene.metrics().animating,{},{timeout:12000});}catch(error){console.error('Idle failure:',await page.evaluate(()=>({input:window.GwentDirectManipulation.tableInteraction,phase:window.GwentDirectManipulation.phase,queue:window.GwentPresentationQueue.busy,stage:document.body.dataset.gcStage,scene:window.GwentTabletopScene.metrics()})));throw error;}await frame(page);}
const state=page=>page.evaluate(()=>({state:window.__GWENT_PASS11__.getState(),save:window.GwentStorage.readMatch()}));
async function enter(page,enabled){
  const url=new URL(base);if(enabled)url.searchParams.set('tabletop','1');else url.searchParams.delete('tabletop');
  await page.goto(url.href,{waitUntil:'networkidle'});await page.evaluate(()=>document.querySelector('#auto-bot').checked=false);
  await page.locator('#main-screen [data-nav="play-screen"]').click();await page.locator('#quick-start').click();await page.locator('#finish-mulligan').click();
  await page.evaluate(()=>window.GwentBattlefieldUX.reconcile());await frame(page);
}
async function choose(page,kind='hero'){
  return page.evaluate(kind=>{const A=window.__GWENT_PASS11__,s=A.getState(),G=A.engine;return G.legalActions(s,'p1').find(a=>{const i=s.players.p1.hand.find(i=>i.iid===a.iid),d=i&&G.CARD_DB[i.cardId];return a.type==='PLAY_CARD'&&d?.type==='unit'&&(kind==='spy'?d.abilities.includes('spy'):d.abilities.includes('hero')&&a.row==='close');});},kind);
}
async function play(page,a){
  assert(a,'ordinary opening hand lacks required normal action');const hand=page.locator(`#hand [data-card-iid="${a.iid}"]`),box=await hand.boundingBox();assert(box);await hand.click({position:{x:5,y:box.height*.4}});
  const key=await page.evaluate(a=>window.GwentDirectManipulation.actionKey(a),a);await page.locator(`[data-dm-action-key="${key}"]`).click();await idle(page);
}
async function bot(page){await page.evaluate(()=>window.__GWENT_PASS11__.botMove());await idle(page);}
const pose=(page,iid)=>page.evaluate(iid=>window.GwentTabletopScene.getPose(iid),iid);
async function point(page,iid){
  return page.evaluate(iid=>{const el=[...document.querySelectorAll('#board [data-inspect-board]')].find(e=>e.dataset.inspectBoard===iid),r=el.getBoundingClientRect();for(const fy of [.45,.25,.75,.08])for(const fx of [.5,.1,.9,.03,.97]){const p={x:r.x+r.width*fx,y:r.y+r.height*fy};if(document.elementFromPoint(p.x,p.y)?.closest('[data-inspect-board]')===el&&(!window.GwentTabletopScene.enabled||window.GwentTabletopScene.exposedAt(p)===iid))return p;}return null;},iid);
}
async function beginMove(page,iid,dx,dy){
  const p=await point(page,iid);assert(p,'card has no exposed pickup region '+JSON.stringify(await page.evaluate(()=>({scene:window.GwentTabletopScene.metrics(),input:window.GwentDirectManipulation.tableInteraction,overlay:document.querySelector('#overlay-root').innerHTML}))));await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+dx,p.y+dy,{steps:10});await frame(page);return{x:p.x+dx,y:p.y+dy};
}
async function loadedArt(page){try{await page.waitForFunction(()=>[...document.querySelectorAll('#board [data-inspect-board] img')].every(i=>i.complete&&i.naturalWidth>0),{},{timeout:15000});}catch(error){console.error('Artwork failure:',await page.locator('#board [data-inspect-board] img').evaluateAll(images=>images.map(i=>({source:i.currentSrc,complete:i.complete,width:i.naturalWidth}))));throw error;}}
async function capture(page,name){await loadedArt(page);await page.screenshot({path:path.join(out,name+'.png')});}
async function normal(browser,name,viewport){
  const context=await makeContext(browser,{viewport,deviceScaleFactor:3,hasTouch:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(String(e));console.error(name,'pageerror:',String(e));});console.log(name,'normal begin');
  await enter(page,true);assert.equal(await page.locator('.rotate-guard').isVisible(),false);
  const first=await choose(page);await play(page,first);await bot(page);const second=await choose(page);await play(page,second);await bot(page);
  const before=await state(page),a=await pose(page,first.iid),b=await pose(page,second.iid);assert(a.height>=60&&a.height>40,'sparse candidate must be substantially larger than production');
  await page.evaluate(()=>{window.__motionNodes=new Map([...document.querySelectorAll('#board [data-inspect-board],#hand [data-card-iid]')].map(e=>[e.dataset.inspectBoard||e.dataset.cardIid,{e,img:e.querySelector('img')}]));});
  await capture(page,`${name}-01-before`);console.log(name,'normal plays settled');
  const startFrames=await page.evaluate(()=>window.GwentTabletopScene.metrics().frameCount);
  const end=await beginMove(page,first.iid,b.x-a.x,b.y-a.y);assert.equal(await page.evaluate(()=>window.GwentDirectManipulation.phase),'table_dragging',JSON.stringify({a,b,end,input:await page.evaluate(()=>window.GwentDirectManipulation.tableInteraction),scene:await page.evaluate(()=>window.GwentTabletopScene.metrics())}));
  const held=await pose(page,first.iid),neighbor=await pose(page,second.iid);assert(Math.hypot(neighbor.x-b.x,neighbor.y-b.y)>1,'actual contact must displace the neighbor '+JSON.stringify({viewport,a,b,held,neighbor,input:await page.evaluate(()=>window.GwentDirectManipulation.tableInteraction)}));assert.equal(await page.locator('[data-tabletop-held]').count(),1);
  await capture(page,`${name}-02-held-contact`);await page.mouse.up();await idle(page);
  assert.deepEqual(await state(page),before,'board gesture changed authoritative state/save');assert.equal(await page.locator('.tabletop-focus').count(),0,'drag produced a synthetic inspector click');
  const settled=await pose(page,first.iid);assert(settled.userPlaced);assert(Math.hypot(settled.x-a.x,settled.y-a.y)>1);
  assert.equal(await page.locator('[data-tabletop-held],.dm-drag-proxy,.dm-flight-proxy').count(),0);await capture(page,`${name}-03-settled`);
  const frames=await page.evaluate(()=>window.GwentTabletopScene.metrics().frameCount);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.GwentTabletopScene.metrics().frameCount),frames,'settled scene continued idle-frame work');
  await page.evaluate(()=>{for(let i=0;i<3;i++)window.GwentBattlefieldUX.reconcile();});assert(Math.abs((await pose(page,first.iid)).x-settled.x)<.1,'reconcile repacked user arrangement');
  // Escape rolls back the whole locally contacted group, not just held card.
  const rollback=await page.evaluate(()=>window.GwentTabletopScene.metrics().poses.filter(p=>p.zoneKey!=='p1:hand'));
  await beginMove(page,first.iid,-24,0);await page.keyboard.press('Escape');await page.mouse.up();await idle(page);
  const afterCancel=await page.evaluate(()=>window.GwentTabletopScene.metrics().poses.filter(p=>p.zoneKey!=='p1:hand'));
  for(const old of rollback){const now=afterCancel.find(p=>p.iid===old.iid);assert(Math.abs(now.x-old.x)<.1&&Math.abs(now.y-old.y)<.1,'cancel failed to restore contacted arrangement');}
  assert.deepEqual(await state(page),before);
  // Pointer cancellation and pagehide release the same captured body without a commit.
  for(const reason of ['pointercancel','pagehide']){
    await beginMove(page,first.iid,12,0);
    await page.evaluate(reason=>{if(reason==='pagehide')window.dispatchEvent(new Event('pagehide'));else{const el=document.querySelector('[data-tabletop-held]');el.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1,pointerType:'mouse',isPrimary:true}));}},reason);
    await page.mouse.up();await idle(page);assert.equal(await page.locator('[data-tabletop-held]').count(),0);assert.equal(await page.evaluate(()=>window.GwentDirectManipulation.tableInteraction.active),false);assert.deepEqual(await state(page),before);
  }
  // Stationary click opens anchored context; close restores the physical body.
  const p=await point(page,first.iid);await page.mouse.click(p.x,p.y);await page.waitForSelector('.tabletop-focus');assert(await page.locator('.tabletop-focus').innerText().then(t=>t.includes('POWER')));
  const panel=await page.locator('.tabletop-focus').boundingBox();assert(panel.x>=0&&panel.y>=0&&panel.x+panel.width<=viewport.width+.1&&panel.y+panel.height<=viewport.height+.1);
  await capture(page,`${name}-04-local-focus`);await page.keyboard.press('Escape');assert.equal(await page.locator('.tabletop-focus').count(),0);assert.deepEqual(await state(page),before);
  // Normal Spy creation gives an opponent body to rearrange without ownership change.
  const spy=await choose(page,'spy');assert(spy);await play(page,spy);
  // A real opponent commit during physical pickup cancels only presentation.
  const expectedBot=await page.evaluate(()=>{const A=window.__GWENT_PASS11__,s=A.getState();return {turn:s.currentPlayerId,events:s.eventLog.length};});
  await beginMove(page,first.iid,12,0);await bot(page);await page.mouse.up();await idle(page);
  assert.equal(expectedBot.turn,'p2');assert.equal(await page.locator('[data-tabletop-held]').count(),0);assert.equal(await page.evaluate(()=>window.GwentDirectManipulation.tableInteraction.active),false);
  assert(await page.evaluate(n=>window.__GWENT_PASS11__.getState().eventLog.length>n,expectedBot.events));
  const enemy=await pose(page,spy.iid);assert(enemy.zoneKey.startsWith('p2:'));
  const enemyBefore=await state(page);await beginMove(page,spy.iid,18,0);await page.mouse.up();await idle(page);assert.deepEqual(await state(page),enemyBefore);assert((await pose(page,spy.iid)).userPlaced);
  const ids=await page.evaluate(()=>[...window.__motionNodes].filter(([iid])=>[...document.querySelectorAll('#board [data-inspect-board],#hand [data-card-iid]')].some(e=>(e.dataset.inspectBoard||e.dataset.cardIid)===iid)).every(([iid,old])=>{const now=[...document.querySelectorAll('#board [data-inspect-board],#hand [data-card-iid]')].find(e=>(e.dataset.inspectBoard||e.dataset.cardIid)===iid);return now===old.e&&now.querySelector('img')===old.img;}));assert(ids);
  // Rotate during actual hold. Viewport interruption must release capture and preserve truth.
  const rotated=viewport.width>viewport.height?{width:393,height:852}:{width:852,height:393};const rotationBefore=await state(page);
  await beginMove(page,first.iid,-15,0);await page.setViewportSize(rotated);await page.mouse.up();await idle(page);assert.equal(await page.locator('[data-tabletop-held]').count(),0);assert.deepEqual(await state(page),rotationBefore);
  for(const body of (await page.evaluate(()=>window.GwentTabletopScene.metrics().poses)).filter(p=>p.zoneKey!=='p1:hand'))assert(body.x>=0&&body.y>=0&&body.x+body.width<=body.railWidth+.1&&body.y+body.height<=body.railHeight+.1);
  await capture(page,`${name}-05-rotated`);assert.deepEqual(errors,[]);
  const result={browser:name,viewport,runtimeIdentity:await page.evaluate(()=>window.GwentBuildIdentity),normalPath:true,authorityPreserved:true,neighborDisplacement:Math.hypot(neighbor.x-b.x,neighbor.y-b.y),sparseHeight:a.height,held,settled,frames:frames-startFrames,opponentGesture:true,identityStable:ids,rotationCancelled:true};await context.close();return result;
}
async function dense(browser,name,viewport){
  const context=await makeContext(browser,{viewport,deviceScaleFactor:3,hasTouch:true}),page=await context.newPage();console.log(name,'dense begin');await enter(page,true);
  await page.evaluate(()=>{const A=window.__GWENT_PASS11__,s=A.getState(),G=A.engine,cardId=s.players.p1.hand.find(i=>G.CARD_DB[i.cardId].type==='unit'&&G.CARD_DB[i.cardId].row==='close').cardId;for(const pid of ['p1','p2'])for(const row of G.ROWS)s.players[pid].board[row]=Array.from({length:pid==='p1'&&row==='close'?12:2},(_,i)=>({iid:`density-${pid}-${row}-${i}`,cardId}));A.setStateForQA(s);window.GwentBattlefieldUX.reconcile();});await frame(page);await loadedArt(page);
  const before=await state(page),cards=await page.locator('#board [data-inspect-board]').count();assert.equal(cards,22);
  const zones=await page.locator('.lane').evaluateAll(lanes=>lanes.map(l=>({pid:l.dataset.pid,row:l.dataset.row,rect:JSON.parse(JSON.stringify(l.getBoundingClientRect()))})));assert.equal(zones.length,6);
  for(const z of zones)assert(z.rect.width>60&&z.rect.height>50&&z.rect.left>=0&&z.rect.right<=viewport.width&&z.rect.bottom<=viewport.height);
  await capture(page,`${name}-06-dense-table`);
  // Pick the actually exposed body; focus navigation makes all 12 reachable.
  const iid=await page.evaluate(()=>window.GwentTabletopScene.metrics().poses.filter(p=>p.zoneKey==='p1:close').sort((a,b)=>b.z-a.z)[0].iid),p=await point(page,iid);assert(p);await page.mouse.click(p.x,p.y);await page.waitForSelector('.tabletop-focus');
  const visited=new Set();for(let i=0;i<12;i++){visited.add(await page.locator('.tabletop-focus').getAttribute('data-focus-iid'));await page.locator('[data-focus-step="1"]').click();}assert.equal(visited.size,12);assert.deepEqual(await state(page),before);await capture(page,`${name}-07-dense-focus`);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.tabletop-focus').count(),0);await context.close();return{browser:name,fixture:'dense-layout-only',cards,zones,all12Inspectable:visited.size===12,authorityPreserved:true};
}
async function baseline(browser){
  const context=await makeContext(browser,{viewport:{width:852,height:393}}),page=await context.newPage();console.log('baseline begin');await enter(page,false);const a=await choose(page);await play(page,a);const h=await page.locator(`[data-inspect-board="${a.iid}"]`).evaluate(e=>e.getBoundingClientRect().height);assert(h<=40);
  await capture(page,'legacy-small-card-control');await page.setViewportSize({width:393,height:852});assert(await page.locator('.rotate-guard').isVisible(),'known-bad portrait control no longer demonstrates the old guard');await context.close();return{mode:'legacy-control',height:h,portraitGuard:true};
}
async function decoyOverlap(browser,name){
  const context=await makeContext(browser,{viewport:{width:852,height:393},deviceScaleFactor:3,hasTouch:true}),page=await context.newPage();console.log(name,'Decoy overlap begin');await enter(page,true);
  const hero=await choose(page);await play(page,hero);await bot(page);
  let action=null;
  for(let i=0;i<16&&!action;i++){
    const step=await page.evaluate(()=>{const A=window.__GWENT_PASS11__,s=A.getState(),G=A.engine,legal=G.legalActions(s,'p1'),definition=a=>G.CARD_DB[s.players.p1.hand.find(c=>c.iid===a.iid)?.cardId];if(s.currentPlayerId==='p2')return {bot:true};const decoy=legal.find(a=>a.targetIid&&s.players.p1.board.close.some(c=>c.iid===a.targetIid));if(decoy)return {decoy};return {action:legal.find(a=>a.type==='PLAY_CARD'&&definition(a)?.type==='unit'&&!definition(a).abilities.includes('medic'))};});
    if(step.decoy)action=step.decoy;else if(step.bot)await bot(page);else{assert(step.action,'normal deck exhausted before overlap Decoy coverage');await play(page,step.action);}
  }
  assert(action,'normal play provided no eligible close-row Decoy target');
  const h=await pose(page,hero.iid),target=await pose(page,action.targetIid);assert(h&&target);
  await beginMove(page,hero.iid,target.x-h.x,target.y-h.y);await page.mouse.up();await idle(page);
  const overlap=await page.evaluate(({hero,target})=>{const els=[...document.querySelectorAll('#board [data-inspect-board]')],a=els.find(e=>e.dataset.inspectBoard===hero).getBoundingClientRect(),b=els.find(e=>e.dataset.inspectBoard===target).getBoundingClientRect();for(let y=Math.max(a.top,b.top)+2;y<Math.min(a.bottom,b.bottom)-2;y+=2)for(let x=Math.max(a.left,b.left)+2;x<Math.min(a.right,b.right)-2;x+=2){const p={x,y};if(window.GwentTabletopScene.exposedAt(p)===hero&&document.elementFromPoint(x,y)?.closest('[data-inspect-board]')?.dataset.inspectBoard===hero)return p;}return null;},{hero:hero.iid,target:action.targetIid});assert(overlap,'normal physical placement produced no occluded target region');
  const before=await state(page),source=await page.locator(`#hand [data-card-iid="${action.iid}"]`).boundingBox();assert(source);
  await page.mouse.move(source.x+5,source.y+source.height*.4);await page.mouse.down();await page.mouse.move(source.x+19,source.y+source.height*.4-3,{steps:3});await page.waitForSelector('.dm-drag-proxy');
  await page.mouse.move(overlap.x,overlap.y,{steps:8});await frame(page);assert.equal(await page.evaluate(()=>window.GwentDirectManipulation.lastIntent?.candidate??null),null);
  await capture(page,`${name}-08-occluded-decoy`);await page.mouse.up();await idle(page);assert.deepEqual(await state(page),before,'Decoy committed through a noneligible front card');
  await page.evaluate(()=>window.GwentDirectManipulation.cancel('overlap-invalid-drop-cleanup'));
  const exposed=await point(page,action.targetIid);assert(exposed,'eligible target lacks exposed surface');
  const hand=page.locator(`#hand [data-card-iid="${action.iid}"]`),box=await hand.boundingBox();await hand.click({position:{x:5,y:box.height*.4}});await page.mouse.click(exposed.x,exposed.y);await idle(page);
  const after=await state(page);assert(after.state.players.p1.hand.some(c=>c.iid===action.targetIid));assert(after.state.players.p1.board.close.some(c=>c.iid===action.iid));assert(after.state.eventLog.slice(before.state.eventLog.length).some(e=>e.type==='DECOY_SWAP'&&e.data.targetIid===action.targetIid));
  await capture(page,`${name}-09-visible-decoy-return`);await context.close();return{browser:name,normalPath:true,occludedDecoyRejected:true,visibleDecoyTarget:action.targetIid};
}
async function reducedMotion(browser,name){
  const context=await makeContext(browser,{viewport:{width:393,height:852},reducedMotion:'reduce'}),page=await context.newPage();console.log(name,'reduced motion begin');await enter(page,true);
  const first=await choose(page);await play(page,first);await bot(page);const second=await choose(page);await play(page,second);await bot(page);
  const before=await state(page),a=await pose(page,first.iid),b=await pose(page,second.iid);await beginMove(page,first.iid,b.x-a.x,b.y-a.y);
  assert((await page.evaluate(()=>window.GwentTabletopScene.metrics().poses)).every(p=>!p.lift),'reduced motion still emitted contact lift');await page.mouse.up();await idle(page);assert.deepEqual(await state(page),before);
  const frames=await page.evaluate(()=>window.GwentTabletopScene.metrics().frameCount);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.GwentTabletopScene.metrics().frameCount),frames);await context.close();return{browser:name,reducedMotion:true,noLift:true,authorityPreserved:true};
}
async function installedEntry(browser,name){
  const context=await makeContext(browser,{viewport:{width:393,height:852}}),page=await context.newPage();
  await page.goto(base,{waitUntil:'networkidle'});const baselineManifest=await page.locator('link[rel="manifest"]').getAttribute('href');assert.equal(baselineManifest,'manifest.webmanifest');
  const legacy=await page.evaluate(async()=>{const url=document.querySelector('link[rel="manifest"]').href;const manifest=await fetch(url).then(r=>r.json());return new URL(manifest.start_url,url).href;});
  await page.goto(legacy,{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>window.GwentTabletopRenderer.enabled),false,'baseline manifest control unexpectedly preserves opt-in');
  const opt=new URL(base);opt.searchParams.set('tabletop','1');await page.goto(opt.href,{waitUntil:'networkidle'});
  const manifestURL=await page.locator('link[rel="manifest"]').getAttribute('href');assert.equal(manifestURL,'manifest-tabletop.webmanifest','prototype still selects a manifest that drops its launch mode');
  const launch=await page.evaluate(async()=>{const url=document.querySelector('link[rel="manifest"]').href,manifest=await fetch(url).then(r=>r.json());return {url:new URL(manifest.start_url,url).href,id:new URL(manifest.id,url).href,scope:new URL(manifest.scope,url).href,display:manifest.display,orientation:manifest.orientation};});
  assert.equal(launch.display,'standalone');assert.equal(launch.orientation,'any');assert.equal(new URL(launch.url).searchParams.get('tabletop'),'1');assert.equal(launch.id,launch.url);assert(launch.url.startsWith(launch.scope));
  await page.goto(launch.url,{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>window.GwentTabletopRenderer.enabled),true,'manifest launch lost the physical renderer');
  await page.evaluate(()=>document.querySelector('#auto-bot').checked=false);await page.locator('#main-screen [data-nav="play-screen"]').click();await page.locator('#quick-start').click();await page.locator('#finish-mulligan').click();await frame(page);assert.equal(await page.locator('.rotate-guard').isVisible(),false);
  await capture(page,`${name}-10-manifest-launch`);await context.close();return {browser:name,manifestLaunchPreservesMode:true,baselineLaunchDiscriminates:true,launch,realInstallation:false};
}
async function main(){
  const results=[];for(const name of process.env.GWENT_BROWSERS?.split(',')||['chromium','webkit']){
    const options={headless:true};if(name==='chromium'&&process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
    const browser=await PW[name].launch(options);try{if(process.env.GWENT_TEST_FOCUS==='install'){results.push(await installedEntry(browser,name));continue;}if(name==='chromium')results.push(await baseline(browser));for(const [label,viewport] of [['landscape',{width:852,height:393}],['portrait',{width:393,height:852}]]){results.push(await normal(browser,`${name}-${label}`,viewport));results.push(await dense(browser,`${name}-${label}`,viewport));}results.push(await decoyOverlap(browser,name));results.push(await reducedMotion(browser,name));results.push(await installedEntry(browser,name));}finally{await browser.close();}
  }
  fs.writeFileSync(path.join(out,'tabletop-motion-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({browser:r.browser,mode:r.mode,normalPath:r.normalPath,neighborDisplacement:r.neighborDisplacement,sparseHeight:r.sparseHeight,all12Inspectable:r.all12Inspectable,authorityPreserved:r.authorityPreserved})),null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});

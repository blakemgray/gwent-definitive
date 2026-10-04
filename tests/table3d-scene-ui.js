'use strict';
// Real normal actions exercise the 3D bridge. Only the independently labelled
// density fixture replaces state; no ability or shadow is manufactured by CSS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const PW=require(process.env.GWENT_PLAYWRIGHT_MODULE||'playwright');
const {decodePNG,pixelSummary,assertPainted,assertChangedPixels}=require('./table3d-scene-contract.js');
const base=process.env.GWENT_TEST_URL||'http://127.0.0.1:4173/';
const out=path.resolve(process.env.GWENT_QA_DIR||'qa/table3d_scene');fs.mkdirSync(out,{recursive:true});
const canvasSelector='#table3d-canvas';
const frame=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const truth=page=>page.evaluate(()=>({state:window.__GWENT_PASS11__.getState(),save:window.GwentStorage.readMatch()}));
const metrics=page=>page.evaluate(()=>window.GwentTable3D.metrics());
const pose=(page,iid)=>page.evaluate(iid=>window.GwentTabletopScene.getPose(iid),iid);
function activeEffects(m){return Array.isArray(m.activeEffects)?m.activeEffects.length:Number(m.activeEffects)||0;}
function assetLoaded(asset){return asset===true||asset==='loaded'||asset==='ready'||asset?.loaded===true||asset?.status==='loaded'||asset?.status==='ready';}

async function context(browser,viewport,options={}){const c=await browser.newContext({viewport,deviceScaleFactor:3,hasTouch:true,...options});c.setDefaultTimeout(20000);c.setDefaultNavigationTimeout(40000);return c;}
async function idle(page){
  await page.evaluate(()=>window.GwentDirectManipulation.waitForIdle(15000));
  await page.waitForFunction(()=>!window.GwentPresentationQueue.busy&&!document.body.dataset.gcStage&&!window.GwentTabletopScene.metrics().animating&&!(Array.isArray(window.GwentTable3D?.metrics().activeEffects)?window.GwentTable3D.metrics().activeEffects.length:window.GwentTable3D?.metrics().activeEffects),{},{timeout:20000});await frame(page);
}
async function loaded(page){
  await page.waitForFunction(()=>{const m=window.GwentTable3D?.metrics();return m?.ready&&m.assets.table.loaded&&m.assets.wood.loaded&&m.cards.length>0&&m.cards.filter(c=>c.active).every(c=>c.loaded&&c.visible);},{},{timeout:25000});
  const m=await metrics(page);assert(assetLoaded(m.assets.table),'actual table model not loaded: '+JSON.stringify(m.assets));assert(assetLoaded(m.assets.wood),'actual wood material not loaded: '+JSON.stringify(m.assets));
  assert.equal(m.fallback,false,'GPU readiness silently accepted fallback DOM');assert.equal(m.contextLost,false);assert(m.renderCalls>0&&m.triangles>0,'ready canvas has no rendered geometry');assert(m.cards.every(c=>c.source&&c.loaded),'paint evidence contains missing card textures');return m;
}
async function enter(page,mode='three'){
  const url=new URL(base);url.searchParams.delete('tabletop');url.searchParams.delete('table3d');if(mode==='three')url.searchParams.set('table3d','1');else url.searchParams.set('tabletop','1');
  await page.goto(url.href,{waitUntil:'networkidle'});await page.evaluate(()=>document.querySelector('#auto-bot').checked=false);
  if(mode==='three'){const before=await metrics(page);assert.equal(before.status,'awaiting-match');assert.equal(before.ready,false);assert.equal(await page.locator(canvasSelector).count(),0,'hidden menu entry allocated a GPU surface before gameplay');}
  await page.locator('#main-screen [data-nav="play-screen"]').click();await page.locator('#quick-start').click();await page.locator('#finish-mulligan').click();
  await page.evaluate(()=>window.GwentBattlefieldUX.reconcile());await frame(page);
  if(mode==='three'){
    await page.waitForFunction(()=>window.GwentTable3D?.enabled);await page.evaluate(()=>window.GwentTable3D.ready);await loaded(page);
    assert.equal(await page.locator('.rotate-guard').isVisible(),false,'3D portrait still requires rotation');
  }
}
async function choose(page,kind='hero'){
  return page.evaluate(kind=>{const A=window.__GWENT_PASS11__,s=A.getState(),G=A.engine;return G.legalActions(s,'p1').find(a=>{const i=s.players.p1.hand.find(i=>i.iid===a.iid),d=i&&G.CARD_DB[i.cardId];return a.type==='PLAY_CARD'&&(kind==='horn'?d?.abilities.includes('horn'):d?.type==='unit'&&(kind==='spy'?d.abilities.includes('spy'):d.abilities.includes('hero')&&a.row==='close'));})||null;},kind);
}
async function expectedAction(page,a){return page.evaluate(a=>{const A=window.__GWENT_PASS11__;return A.engine.playCard(A.getState(),a);},a);}
async function handPoint(page,iid){
  return page.evaluate(iid=>{const el=document.querySelector(`#hand [data-card-iid="${iid}"]`),r=el?.getBoundingClientRect();if(!r)return null;for(const fy of [.45,.25,.75,.08])for(const fx of [.25,.1,.4,.03,.7,.9]){const point={x:r.x+r.width*fx,y:r.y+r.height*fy};if(document.elementFromPoint(point.x,point.y)?.closest('[data-card-iid]')===el)return point;}return null;},iid);
}
async function startPaintProbe(page,iid){
  return page.evaluate(iid=>{
    if(!window.GwentTable3D?.enabled)return false;
    const probe={iid,samples:[],raf:0,stopped:false};window.__table3dPaintProbe=probe;
    function sample(time){
      const metrics=window.GwentTable3D.metrics(),cards=metrics.cards.filter(c=>c.iid===iid);
      const elements=[...document.querySelectorAll('#hand [data-card-iid],#board [data-inspect-board],.dm-drag-proxy,.dm-flight-proxy,.te-target-actor,.gc-snapshot-ghost')].filter(el=>(el.dataset.presentationIid||el.dataset.teActorFor||el.dataset.gcIid||el.dataset.inspectBoard||el.dataset.cardIid)===iid);
      const paintedDOM=elements.filter(el=>{
        const img=el.querySelector('img'),r=img?.getBoundingClientRect(),s=img&&getComputedStyle(img);if(!img||!r.width||!r.height||!img.complete||!img.naturalWidth||s.visibility==='hidden'||s.display==='none')return false;
        let opacity=Number(s.opacity);for(let parent=img.parentElement;parent;parent=parent.parentElement){const style=getComputedStyle(parent);if(style.display==='none')return false;opacity*=Number(style.opacity);}
        return opacity>=.025;
      }).length;
      const gpu=metrics.ready?cards.filter(c=>c.visible&&c.loaded).length:0;
      probe.samples.push({time,phase:window.GwentDirectManipulation.phase,stage:document.body.dataset.gcStage||null,queue:window.GwentPresentationQueue.busy,paintedDOM,gpu,bodyCount:cards.length,meshToken:cards[0]?.meshToken||null,role:cards[0]?.role||null});
      if(!probe.stopped)probe.raf=requestAnimationFrame(sample);
    }
    probe.raf=requestAnimationFrame(sample);return true;
  },iid);
}
async function finishPaintProbe(page,iid,method){
  const result=await page.evaluate(()=>{const p=window.__table3dPaintProbe;if(!p)return null;p.stopped=true;cancelAnimationFrame(p.raf);return {iid:p.iid,samples:p.samples};});if(!result)return null;
  const label=page.__table3dLabel||'3d',file=path.join(out,`${label}-${method}-${iid}-embodiment.json`);fs.writeFileSync(file,JSON.stringify(result,null,2));
  assert(result.samples.length>3,'normal play produced no temporal painted-body evidence');
  for(const s of result.samples){assert.equal(s.bodyCount,1,'persistent mesh absent/duplicated during actual normal play: '+JSON.stringify(s));assert.equal(s.gpu+s.paintedDOM,1,'normal play painted duplicate/missing iid embodiment: '+JSON.stringify(s));}
  assert.equal(new Set(result.samples.map(s=>s.meshToken)).size,1,'normal hand/flight/board path retired and recreated its GPU body');
  const roles=new Set(result.samples.map(s=>s.role));assert(roles.has('hand')&&roles.has('board'),'temporal evidence missed hand/board ownership');
  if(method==='drag')assert(roles.has('drag'),'actual hand drag was not painted by the persistent body');
  // A normal drag reuses its drag proxy throughout animateFlight; tap creates
  // a flight proxy. Require the actual committed travel stage for either path.
  assert(result.samples.some(s=>s.phase==='committing'&&['flight','choreography',...(method==='drag'?['drag']:[])].includes(s.role)),'normal play lacks a sampled committed travel embodiment');return {iid,samples:result.samples.length,roles:[...roles],meshToken:result.samples[0].meshToken,file};
}
async function play(page,a,method='tap',wait=true){
  assert(a,'seeded normal opening hand lacks the required legal action');const expected=await expectedAction(page,a);
  const source=await handPoint(page,a.iid);assert(source,'normal hand card has no actually exposed input surface');
  const probing=await startPaintProbe(page,a.iid);if(probing)await frame(page);
  if(method==='tap'){
    await page.touchscreen.tap(source.x,source.y);const key=await page.evaluate(a=>window.GwentDirectManipulation.actionKey(a),a);await page.locator(`[data-dm-action-key="${key}"]`).tap();
  }else{
    await page.mouse.move(source.x,source.y);await page.mouse.down();await page.mouse.move(source.x+14,source.y-3,{steps:3});await page.waitForSelector('.dm-drag-proxy');
    const destination=await page.evaluate(a=>{const d=window.GwentDirectManipulation.normalizeDestination(a),el=document.querySelector(`.lane[data-pid="${d.playerId}"][data-row="${d.row}"] .units`),r=el?.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null;},a);assert(destination,'normal drag lacks canonical semantic row');
    await page.mouse.move(destination.x,destination.y,{steps:10});await frame(page);assert(await page.evaluate(()=>!!window.GwentDirectManipulation.lastIntent?.candidate),'normal drag did not resolve a legal row');await page.mouse.up();
  }
  assert.deepEqual((await truth(page)).state,expected,'render/input bridge diverged from canonical engine action');if(wait){await idle(page);await loaded(page);if(probing)await finishPaintProbe(page,a.iid,method);}return expected;
}
async function bot(page){await page.evaluate(()=>window.__GWENT_PASS11__.botMove());await idle(page);await loaded(page);}
function pickedIid(pick){return typeof pick==='string'?pick:pick?.iid||null;}
async function pickupPoint(page,iid){
  return page.evaluate(iid=>{const R=window.GwentTable3D,el=[...document.querySelectorAll('#board [data-inspect-board]')].find(e=>e.dataset.inspectBoard===iid),r=R.projectCard(iid);if(!r||!el)return null;for(const fy of [.45,.25,.75,.08])for(const fx of [.5,.1,.9,.03,.97]){const p={x:r.x+r.width*fx,y:r.y+r.height*fy},hit=R.pick(p),picked=typeof hit==='string'?hit:hit?.iid;if(picked===iid&&document.elementFromPoint(p.x,p.y)?.closest('[data-inspect-board]')===el)return p;}return null;},iid);
}
async function beginMove(page,iid,dx,dy){
  const p=await pickupPoint(page,iid);assert(p,'GPU projection/native touch/raycast have no agreed exposed surface for '+iid);
  const pick=await page.evaluate(p=>window.GwentTable3D.pick(p),p);assert.equal(pickedIid(pick),iid);
  const local=await page.evaluate(({iid,p})=>window.GwentTable3D.toLocal(iid,p),{iid,p});assert(local&&Number.isFinite(local.x)&&Number.isFinite(local.y),'camera bridge returned nonfinite local coordinates');
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+dx,p.y+dy,{steps:10});await frame(page);
  assert.equal(await page.evaluate(()=>window.GwentDirectManipulation.phase),'table_dragging','sole canonical gesture controller did not own board pickup');return {start:p,end:{x:p.x+dx,y:p.y+dy},local};
}
async function snapshot(page,label){
  const m=await loaded(page),canvas=page.locator(canvasSelector),box=await canvas.boundingBox();assert(box&&box.width>100&&box.height>100);
  const viewport=page.viewportSize(),scale=await page.evaluate(()=>devicePixelRatio);assert(viewport&&box.x>=-.5&&box.y>=-.5&&box.x+box.width<=viewport.width+.5&&box.y+box.height<=viewport.height+.5,'canvas capture bounds leave the actual viewport');
  await page.waitForFunction(()=>[...document.querySelectorAll('#hand [data-card-iid] img,#board [data-inspect-board] img,.tabletop-focus .inspect-art')].every(i=>i.complete&&i.naturalWidth>0),{},{timeout:20000});
  await page.locator('.tabletop-focus .inspect-art').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));await frame(page);
  // Capture the actual composite at the known canvas bounds. An element
  // screenshot first scrolls/waits for actionability, which can consume the
  // held/effect frame on a software GPU; that is not the interaction under test.
  const buffer=await page.screenshot({clip:box,path:path.join(out,label+'-canvas.png')}),image=decodePNG(buffer),paint=assertPainted(image);await page.screenshot({path:path.join(out,label+'.png')});
  assert(Math.abs(image.width-box.width*scale)<=1&&Math.abs(image.height-box.height*scale)<=1,'capture dimensions do not preserve the canvas-to-pixel mapping');
  const tablePaint=pixelSummary(image,{x:image.width*.2,y:image.height*.3,width:image.width*.6,height:image.height*.35});
  assert(tablePaint.mean>10&&tablePaint.variance>8,'scene reports GPU readiness but its central table is absent from the actual page capture: '+JSON.stringify(tablePaint));
  fs.writeFileSync(path.join(out,label+'-metrics.json'),JSON.stringify(m,null,2));return {image,paint,box,m};
}
function imageRect(capture,rect,pad=0){const sx=capture.image.width/capture.box.width,sy=capture.image.height/capture.box.height;return{x:(rect.x-capture.box.x-pad)*sx,y:(rect.y-capture.box.y-pad)*sy,width:(rect.width+pad*2)*sx,height:(rect.height+pad*2)*sy};}
function faceMasks(capture){return capture.m.cards.map(c=>imageRect(capture,c.projected,.5));}
async function meshes(page){
  const m=await loaded(page),iids=await page.locator('#board [data-inspect-board]').evaluateAll(es=>es.map(e=>e.dataset.inspectBoard));
  const board=m.cards.filter(c=>c.role==='board');assert.equal(board.length,iids.length,'settled board does not have one GPU body per semantic card');assert.equal(new Set(board.map(c=>c.iid)).size,board.length,'duplicate iid GPU mesh');
  for(const iid of iids)assert(board.some(c=>c.iid===iid&&c.loaded&&c.visible),'canonical board iid has no visible loaded mesh');
  for(const card of m.cards)assert(Number.isInteger(card.meshToken)&&card.meshToken>0,'GPU mesh lacks stable identity evidence');
  assert.equal(new Set(m.cards.map(c=>c.meshToken)).size,m.cards.length,'two iids share one GPU body');
  assert(m.cards.every(c=>!c.fallbackIcon),'normal paint evidence substituted an icon for source artwork');assert.equal(m.textureFailures,0);assert.deepEqual(m.errors,[]);
  return {cards:board.map(c=>({iid:c.iid,token:c.meshToken,worldHeight:c.worldHeight,source:c.source})),renderer:m};
}
async function captureNodes(page){await page.evaluate(()=>{window.__table3dNodes=new Map([...document.querySelectorAll('#board [data-inspect-board],#hand [data-card-iid]')].map(el=>[el.dataset.inspectBoard||el.dataset.cardIid,{el,img:el.querySelector('img')}]));});}
async function assertNodes(page){assert(await page.evaluate(()=>[...window.__table3dNodes].every(([iid,old])=>{const now=[...document.querySelectorAll('#board [data-inspect-board],#hand [data-card-iid]')].find(el=>(el.dataset.inspectBoard||el.dataset.cardIid)===iid);return !now||(now===old.el&&now.querySelector('img')===old.img);})), 'normal GPU commits recreated surviving semantic bodies');}
async function assertClean(page){
  const r=await page.evaluate(()=>({actors:document.querySelectorAll('[data-tabletop-held],.dm-drag-proxy,.dm-flight-proxy,.te-target-actor,.gc-snapshot-ghost').length,guarded:window.GwentCardContinuity.guardedIids(),valid:window.GwentStorage.validateState(window.__GWENT_PASS11__.getState()),phase:window.GwentDirectManipulation.phase}));
  assert.equal(r.actors,0,'settle retained an orphan actor/held card');assert.equal(r.guarded.length,0,'settle retained a hidden-card lease');assert(r.valid);assert.notEqual(r.phase,'table_dragging');await meshes(page);return r;
}

async function shadow(page,name,iid){
  const authoritative=await truth(page),original=await pose(page,iid),rest=await snapshot(page,name+'-01-shadow-rest');
  const restingShadows=await page.evaluate(()=>window.GwentTable3D.readbackPair({kind:'shadow',floorOnly:true}));
  const move=await beginMove(page,iid,12,0);await page.mouse.move(move.start.x,move.start.y,{steps:6});await frame(page);
  const heldPose=await pose(page,iid);assert(Math.abs(heldPose.x-original.x)<.5&&Math.abs(heldPose.y-original.y)<.5,'shadow pair accidentally moved the planar card');assert(heldPose.lift>0,'held card lacks physical lift');
  await page.waitForTimeout(250);
  const held=await snapshot(page,name+'-02-shadow-held'),restMesh=rest.m.cards.find(c=>c.iid===iid),heldMesh=held.m.cards.find(c=>c.iid===iid);assert(heldMesh.worldHeight-restMesh.worldHeight>=15,'GPU held-body height decayed while the pointer still held it');
  const causal=await page.evaluate(()=>window.GwentTable3D.readbackPair({kind:'shadow',floorOnly:true}));
  fs.writeFileSync(path.join(out,name+'-shadow-readbacks.json'),JSON.stringify({restingShadows,causalHeldShadows:causal},null,2));
  assert.equal(causal.available,true);assert.equal(causal.kind,'shadow');assert.equal(causal.floorOnly,true);assert(causal.sampledPixels>0&&causal.excludedCardPixels>0,'shadow readback did not isolate table floor');
  assert(causal.changedPixels>=8&&causal.meanAbsoluteDifference>.005,'turning actual card shadows off did not change rendered floor pixels: '+JSON.stringify(causal));assert(causal.withShadows.meanLuminance<causal.withoutShadows.meanLuminance,'actual card shadows did not darken table floor: '+JSON.stringify(causal));
  const localFloor=imageRect(rest,restMesh.projected,22),delta=assertChangedPixels(rest.image,held.image,localFloor,{exclude:[...faceMasks(rest),...faceMasks(held)],minimumPixels:16,minimumMeanDelta:.01});assert(delta.darkened>8&&delta.brightened>8,'lift must move nearby painted floor shadow, not merely brighten a card face/HUD: '+JSON.stringify(delta));
  await page.mouse.up();await idle(page);assert.deepEqual(await truth(page),authoritative,'physical lift changed engine/save');await assertClean(page);return {samePlanarPose:true,worldHeightBefore:restMesh.worldHeight,worldHeightHeld:heldMesh.worldHeight,floorPixels:delta,restingShadows,causalHeldShadows:causal};
}
async function ability(page,name){
  // Foltest's normal leader action guarantees a real LEADER_HORN event without
  // replacing state or directly calling the renderer's effect method.
  const before=await truth(page),beforeEffects=(await metrics(page)).effectsTriggered,expected=await page.evaluate(()=>{const A=window.__GWENT_PASS11__;return A.engine.activateLeader(A.getState(),{playerId:'p1'});});await page.locator('#leader-button').click();await page.locator('#activate-leader').click();await page.evaluate(()=>window.__GWENT_PASS11__.closeOverlay());
  await page.waitForFunction(()=>window.GwentTable3D.metrics().activeEffects.some(e=>e.type.includes('HORN')&&e.intensity>=e.maxIntensity*.75),{},{timeout:10000});
  const active=await metrics(page),pair=await page.evaluate(()=>window.GwentTable3D.readbackPair({kind:'effect',floorOnly:true}));assert.equal(active.effectsTriggered-beforeEffects,1,'one authoritative Horn event emitted duplicate/missing ability light');
  assert(pair,'active canonical effect produced no GPU light readback');
  assert.equal(pair.available,true,'GPU effect readback is unavailable');assert.equal(pair.kind,'effect');assert.equal(pair.floorOnly,true);assert(pair.sampledPixels>0&&pair.excludedCardPixels>0,'ability readback failed to exclude all card faces');assert(pair.activeEffects.some(e=>e.type.includes('HORN')),'light pair lacks the confirmed Horn effect');
  assert(Number.isFinite(pair.changedPixels)&&pair.changedPixels>=24&&Number.isFinite(pair.meanAbsoluteDifference)&&pair.meanAbsoluteDifference>.02,'ability light readback did not change painted pixels: '+JSON.stringify(pair));
  assert(pair.withEffects.meanLuminance>pair.withoutEffects.meanLuminance,'ability light did not brighten the rendered scene');const evidence=pair;
  await snapshot(page,name+'-06-engine-ability-light');
  const after=await truth(page),events=after.state.eventLog.slice(before.state.eventLog.length);assert.deepEqual(after.state,expected,'ability rendering changed canonical leader result');assert(events.some(e=>e.type==='LEADER_HORN'&&e.data.playerId==='p1'&&e.data.row==='siege'),'illumination lacks corresponding confirmed engine event');assert.equal(after.state.players.p1.board.leaderHorn.siege,true);
  await page.evaluate(()=>window.__GWENT_PASS11__.closeOverlay());await idle(page);assert.equal(activeEffects(await metrics(page)),0,'ability light failed to retire');await assertClean(page);return {event:'LEADER_HORN',row:'siege',normalUI:true,active,pixels:evidence};
}
async function contextRecovery(page,name){
  const before=await truth(page),supported=await page.evaluate(()=>{const gl=document.querySelector('#table3d-canvas').getContext('webgl2');window.__table3dLoss=gl?.getExtension('WEBGL_lose_context');return !!window.__table3dLoss;});assert(supported,'GPU test environment lacks controllable context loss');
  await page.evaluate(()=>window.__table3dLoss.loseContext());await page.waitForFunction(()=>window.GwentTable3D.metrics().contextLost&&window.GwentTable3D.metrics().fallback);await frame(page);
  assert(await page.locator('#board [data-inspect-board] img').evaluateAll(images=>images.length>0&&images.every(i=>getComputedStyle(i).opacity!=='0'&&getComputedStyle(i).visibility!=='hidden')),'context loss kept semantic art suppressed');
  const lost=await metrics(page);assert.deepEqual(await truth(page),before,'context loss changed engine/save');await page.screenshot({path:path.join(out,name+'-08-context-fallback.png')});
  await page.waitForTimeout(100);await page.evaluate(()=>window.__table3dLoss.restoreContext());await page.waitForFunction(()=>window.GwentTable3D.metrics().ready&&!window.GwentTable3D.metrics().contextLost&&!window.GwentTable3D.metrics().fallback,{},{timeout:20000});await loaded(page);await idle(page);
  assert.deepEqual(await truth(page),before,'context restore changed engine/save');const recovered=await snapshot(page,name+'-09-context-recovered');await assertClean(page);return {lost,recovered:recovered.m,authorityPreserved:true};
}
async function identityAndWorker(page){
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const report=await page.evaluate(()=>window.GwentDiagnostics.collect()),identity=report.runtimeIdentity,worker=report.serviceWorkers.controller;
  assert.equal(worker.diagnostics.status,'ok');assert.equal(worker.diagnostics.build,identity.releaseId,'3D runtime and active worker shell generations disagree');
  if(process.env.GITHUB_SHA){assert.equal(identity.sourceCommit,process.env.GITHUB_SHA);assert(identity.packaged&&/^[0-9a-f]{64}$/.test(identity.sourceFingerprint));}
  return {identity,worker};
}
async function normal(browser,name,viewport,extra){
  const c=await context(browser,viewport),page=await c.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>requests.push({url:r.url(),error:r.failure()?.errorText}));
  page.__table3dLabel=name;
  try{
    await enter(page);await captureNodes(page);const first=await choose(page);await play(page,first);await assertNodes(page);await bot(page);const shadowEvidence=await shadow(page,name,first.iid);
    const second=await choose(page);await play(page,second,'drag');await assertNodes(page);await bot(page);const initial=await meshes(page),before=await truth(page),a=await pose(page,first.iid),b=await pose(page,second.iid);
    await beginMove(page,first.iid,b.x-a.x,b.y-a.y);const neighbor=await pose(page,second.iid);assert(Math.hypot(neighbor.x-b.x,neighbor.y-b.y)>1,'actual contact did not move adjacent GPU body');await snapshot(page,name+'-03-contact-held');await page.mouse.up();await idle(page);assert.deepEqual(await truth(page),before);await assertClean(page);await snapshot(page,name+'-04-contact-settled');
    const p=await pickupPoint(page,first.iid);assert(p);await page.mouse.click(p.x,p.y);await page.waitForSelector('.tabletop-focus');const panel=await page.locator('.tabletop-focus').boundingBox();assert(panel.x>=0&&panel.y>=0&&panel.x+panel.width<=viewport.width+.1&&panel.y+panel.height<=viewport.height+.1);await snapshot(page,name+'-05-local-focus');await page.keyboard.press('Escape');assert.deepEqual(await truth(page),before);
    const abilityEvidence=extra?await ability(page,name):null;if(extra)await bot(page);
    const spy=await choose(page,'spy');assert(spy);const beforeSpy=(await truth(page)).state;await play(page,spy);const afterSpy=(await truth(page)).state;assert(afterSpy.players.p2.board[spy.row].some(i=>i.iid===spy.iid));assert.equal(afterSpy.players.p1.deck.length,beforeSpy.players.p1.deck.length-2);await bot(page);
    // Actual Muster may cover the Spy completely. Pick a genuinely exposed
    // opponent body rather than manufacture space or click through that stack.
    const enemyIids=await page.evaluate(()=>window.GwentTabletopScene.metrics().poses.filter(p=>p.zoneKey.startsWith('p2:')).sort((a,b)=>b.z-a.z).map(p=>p.iid));let enemy=null;
    for(const iid of enemyIids)if(await pickupPoint(page,iid)){enemy=iid;break;}assert(enemy,'normal opponent formation has no exposed movable body');
    const enemyBefore=await truth(page);await beginMove(page,enemy,18,0);await page.mouse.up();await idle(page);assert.deepEqual(await truth(page),enemyBefore,'opponent physical gesture changed semantic ownership/game');assert((await pose(page,enemy)).userPlaced);
    // Engine and background interruptions roll back grabbed geometry, even if
    // a delayed native pointer release occurs after the interruption.
    for(const reason of ['Escape','pagehide']){const check=await truth(page),old=await pose(page,first.iid);await beginMove(page,first.iid,12,0);if(reason==='Escape')await page.keyboard.press('Escape');else await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.mouse.up();await idle(page);const next=await pose(page,first.iid);assert(Math.abs(next.x-old.x)<.1&&Math.abs(next.y-old.y)<.1);assert.deepEqual(await truth(page),check);await assertClean(page);}
    const rotated=viewport.width>viewport.height?{width:393,height:852}:{width:852,height:393},rotateBefore=await truth(page);await beginMove(page,first.iid,-15,0);await page.setViewportSize(rotated);await page.mouse.up();await idle(page);assert.deepEqual(await truth(page),rotateBefore);await assertClean(page);await snapshot(page,name+'-07-rotated');await page.setViewportSize(viewport);await idle(page);
    const final=await meshes(page);for(const old of initial.cards){const now=final.cards.find(c=>c.iid===old.iid);if(now&&old.token)assert.equal(now.token,old.token,'surviving mesh recreated across unrelated actions');}
    const recovery=extra?await contextRecovery(page,name):null;await idle(page);const settled=await metrics(page);await page.waitForTimeout(220);assert.equal((await metrics(page)).frameCount,settled.frameCount,'GPU renderer kept drawing idle frames');
    await assertNodes(page);const build=await identityAndWorker(page);assert.deepEqual(errors,[],'runtime errors: '+JSON.stringify(errors));
    return {browser:name,viewport,normalPath:true,build,shadow:shadowEvidence,neighborDisplacement:Math.hypot(neighbor.x-b.x,neighbor.y-b.y),ability:abilityEvidence,contextRecovery:recovery,opponentGesture:{iid:enemy,normalSpy:spy.iid},rotated:true,authorityPreserved:true,initial:initial.cards,final:final.cards,networkFailures:requests};
  }catch(error){
    const failure={error:String(error),errors,requests,runtime:await page.evaluate(()=>({identity:window.GwentBuildIdentity,renderer:window.GwentTable3D?.metrics(),scene:window.GwentTabletopScene?.metrics(),input:window.GwentDirectManipulation?.tableInteraction})).catch(()=>null)};
    const failurePath=path.join(out,name+'-failure.json');fs.writeFileSync(failurePath,JSON.stringify(failure,null,2));await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});console.error(name+' failure diagnostics:',JSON.stringify({path:failurePath,error:failure.error,errors,requests,rendererStatus:failure.runtime?.renderer?.status,rendererErrors:failure.runtime?.renderer?.errors}));throw error;
  }finally{await c.close();}
}
async function density(browser,name,viewport){
  const c=await context(browser,viewport),page=await c.newPage();try{
    await enter(page);await page.evaluate(()=>{const A=window.__GWENT_PASS11__,s=A.getState(),G=A.engine,cardId=s.players.p1.hand.find(i=>G.CARD_DB[i.cardId].type==='unit'&&G.CARD_DB[i.cardId].row==='close').cardId;for(const pid of ['p1','p2'])for(const row of G.ROWS)s.players[pid].board[row]=Array.from({length:pid==='p1'&&row==='close'?12:2},(_,i)=>({iid:`gpu-density-${pid}-${row}-${i}`,cardId}));A.setStateForQA(s);window.GwentBattlefieldUX.reconcile();});await frame(page);await loaded(page);await idle(page);
    const before=await truth(page),m=await meshes(page);assert.equal(m.cards.length,22);const capture=await snapshot(page,name+'-10-dense-table');
    const zones=await page.locator('.lane').evaluateAll(ls=>ls.map(l=>({key:`${l.dataset.pid}:${l.dataset.row}`,rect:JSON.parse(JSON.stringify(l.getBoundingClientRect()))})));assert.equal(zones.length,6);for(const z of zones)assert(z.rect.width>60&&z.rect.height>15&&z.rect.left>=0&&z.rect.right<=viewport.width+.1&&z.rect.bottom<=viewport.height+.1,'whole semantic table is outside viewport');
    const iid=await page.evaluate(()=>window.GwentTabletopScene.metrics().poses.filter(p=>p.zoneKey==='p1:close').sort((a,b)=>b.z-a.z)[0].iid),p=await pickupPoint(page,iid);assert(p);await page.mouse.click(p.x,p.y);await page.waitForSelector('.tabletop-focus');
    const visited=new Set();for(let i=0;i<12;i++){visited.add(await page.locator('.tabletop-focus').getAttribute('data-focus-iid'));await page.locator('[data-focus-step="1"]').click();}assert.equal(visited.size,12,'covered cards are inaccessible through local context');assert.deepEqual(await truth(page),before);await snapshot(page,name+'-11-dense-focus');await page.keyboard.press('Escape');await assertClean(page);
    return {browser:name,viewport,fixture:'density-layout-only',cards:22,zones,all12Inspectable:true,paint:capture.paint,authorityPreserved:true};
  }finally{await c.close();}
}
async function installedEntry(browser,name){
  const c=await context(browser,{width:393,height:852}),page=await c.newPage();try{
    const url=new URL(base);url.searchParams.set('table3d','1');await page.goto(url.href,{waitUntil:'networkidle'});
    const launch=await page.evaluate(async()=>{const u=document.querySelector('link[rel="manifest"]').href,m=await fetch(u).then(r=>r.json());return{manifest:u,url:new URL(m.start_url,u).href,id:new URL(m.id,u).href,scope:new URL(m.scope,u).href,display:m.display,orientation:m.orientation};});
    assert.equal(new URL(launch.url).searchParams.get('table3d'),'1','installed manifest dropped 3D opt-in');assert.equal(launch.id,launch.url);assert.equal(launch.display,'standalone');assert.equal(launch.orientation,'any');assert(launch.url.startsWith(launch.scope));
    await page.goto(launch.url,{waitUntil:'networkidle'});await page.evaluate(()=>document.querySelector('#auto-bot').checked=false);await page.locator('#main-screen [data-nav="play-screen"]').click();await page.locator('#quick-start').click();await page.locator('#finish-mulligan').click();await loaded(page);assert.equal(await page.locator('.rotate-guard').isVisible(),false);await snapshot(page,name+'-12-manifest-launch');return {browser:name,launch,manifestPreserves3D:true,realInstallation:false};
  }finally{await c.close();}
}
async function offlineReopen(browser,name){
  const c=await context(browser,{width:852,height:393}),page=await c.newPage();try{
    await enter(page);await play(page,await choose(page));await bot(page);const expected=await truth(page),online=await identityAndWorker(page);
    const sources=[...new Set((await metrics(page)).cards.map(card=>card.source))];
    await page.waitForFunction(async sources=>{const keys=await caches.keys(),key=keys.find(k=>k.startsWith('gwent-definitive-runtime-')),cache=key&&await caches.open(key);return !!cache&&(await Promise.all(sources.map(s=>cache.match(s)))).every(r=>r&&r.type!=='opaque'&&r.ok);},sources,{timeout:10000});
    // A controlled online reload must upload from the actual runtime cache.
    await page.reload({waitUntil:'networkidle'});await page.locator('#continue-match').click();await loaded(page);await idle(page);assert.deepEqual(await truth(page),expected,'controlled reload altered the saved match');
    await c.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue-match').click();await loaded(page);await idle(page);
    assert.deepEqual(await truth(page),expected,'offline 3D reopen altered the saved match');const build=await identityAndWorker(page),capture=await snapshot(page,name+'-13-offline-reopened');await meshes(page);
    assert.equal(new URL(await page.url()).searchParams.get('table3d'),'1');assert.deepEqual(build.identity,online.identity);return {browser:name,mode:'controlled-online-and-offline-reopen',savedMatchPreserved:true,cachedSourceArt:sources.length,assets:capture.m.assets,build,realInstallation:false};
  }finally{await c.setOffline(false);await c.close();}
}
async function missingUpload(browser,name){
  // Disable SW only for this fault-injection test so routes can discriminate
  // the GPU's CORS upload from the readable native image request.
  const c=await context(browser,{width:852,height:393},{serviceWorkers:'block'}),page=await c.newPage(),blocked=[];try{
    await enter(page);await play(page,await choose(page));
    await page.route('https://raw.githubusercontent.com/asundr/gwent-classic/**',async route=>{
      const headers=await route.request().allHeaders();
      if(headers['sec-fetch-mode']==='cors'||headers.origin){blocked.push(route.request().url());await route.abort('failed');}else await route.continue();
    });
    for(let turn=0;turn<3;turn++){
      await page.evaluate(()=>window.__GWENT_PASS11__.botMove());await idle(page);
      if((await metrics(page)).cards.some(card=>card.role==='board'&&card.domFallback))break;
      assert(turn<2,'normal opponent opening never reached a new board texture');await play(page,await choose(page));
    }
    await page.waitForFunction(()=>window.GwentTable3D.metrics().cards.some(c=>c.role==='board'&&c.active&&c.domFallback),{},{timeout:10000});
    const m=await metrics(page);assert(blocked.length>0&&m.textureFailures>0,'fault injection failed to reach a new actual opponent texture upload');assert(m.ready&&!m.fallback,'one failed upload disabled the whole scene');
    const candidates=m.cards.filter(c=>c.role==='board'&&c.active&&c.domFallback);let iid=null;for(const card of candidates)if(await pickupPoint(page,card.iid)){iid=card.iid;break;}assert(iid,'failed-upload native body has no interactive exposed surface');
    const source=await page.locator(`#board [data-inspect-board="${iid}"] img`).evaluate(i=>({loaded:i.complete&&i.naturalWidth>0,source:i.currentSrc,opacity:getComputedStyle(i).opacity}));assert(source.loaded&&source.opacity!=='0');assert(!/\/icon\.svg/.test(source.source),'missing upload fallback used an icon');
    const expected=await truth(page);await beginMove(page,iid,14,0);await page.mouse.up();await idle(page);assert.deepEqual(await truth(page),expected,'fallback body gesture changed game/save');
    const p=await pickupPoint(page,iid);assert(p);await page.mouse.click(p.x,p.y);await page.waitForSelector('.tabletop-focus');await page.waitForFunction(()=>document.querySelector('.tabletop-focus .inspect-art')?.naturalWidth>0);assert.equal(await page.locator('.tabletop-focus').getAttribute('data-focus-iid'),iid);assert.deepEqual(await truth(page),expected);await page.screenshot({path:path.join(out,name+'-14-missing-upload-focus.png')});await page.keyboard.press('Escape');
    return {browser:name,mode:'CORS-upload-only-failure',blocked,iid,source,interactiveFallback:true,authorityPreserved:true,renderer:await metrics(page)};
  }catch(error){fs.writeFileSync(path.join(out,name+'-missing-upload-failure.json'),JSON.stringify({error:String(error),blocked,renderer:await metrics(page)},null,2));throw error;}finally{await c.close();}
}
async function knownBad(browser){
  const c=await context(browser,{width:852,height:393}),page=await c.newPage();try{
    await enter(page,'dom');const a=await choose(page);await play(page,a,'tap',false);await page.evaluate(()=>window.GwentDirectManipulation.waitForIdle(12000));await frame(page);
    const control=await page.evaluate(()=>({enabled:!!window.GwentTable3D?.enabled,canvas:!!document.querySelector('#table3d-canvas'),painted:document.querySelectorAll('[data-table3d-paint="mesh"]').length}));assert.equal(control.enabled,false);assert.equal(control.painted,0);await page.screenshot({path:path.join(out,'known-bad-dom-control.png')});return {mode:'same-runtime-DOM-control',...control,discriminator:'no loaded GPU mesh/shadow/light paint'};
  }finally{await c.close();}
}
async function main(){
  const results=[],focus=process.env.GWENT_TEST_FOCUS;
  const record=result=>{results.push(result);fs.writeFileSync(path.join(out,'table3d-scene-partial-results.json'),JSON.stringify(results,null,2));console.log('table3d-scene:',result.browser||result.mode,'passed',result.normalPath?'normal-path':result.fixture||result.discriminator||'manifest');};
  for(const name of process.env.GWENT_BROWSERS?.split(',')||['chromium','webkit']){
    const options={headless:true};if(name==='chromium'&&process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
    const browser=await PW[name].launch(options);try{
      if(!focus&&name==='chromium'||focus==='control')record(await knownBad(browser));
      if(!focus||focus==='normal')for(const [label,v] of [['landscape',{width:852,height:393}],['portrait',{width:393,height:852}]])record(await normal(browser,`${name}-${label}`,v,label==='landscape'));
      if(!focus||focus==='dense')for(const [label,v] of [['landscape',{width:852,height:393}],['portrait',{width:393,height:852}]])record(await density(browser,`${name}-${label}`,v));
      if(!focus||focus==='install')record(await installedEntry(browser,name));
      if(!focus||focus==='offline')record(await offlineReopen(browser,name));
      // sec-fetch-mode is a Chromium header; WebKit's lifecycle is covered by
      // the offline/context gates, and this targeted transport fault by Chrome.
      if(name==='chromium'&&(!focus||focus==='fallback'))record(await missingUpload(browser,name));
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(out,'table3d-scene-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({browser:r.browser,mode:r.mode,normalPath:r.normalPath,shadow:r.shadow?.floorPixels,ability:r.ability?.event,authorityPreserved:r.authorityPreserved,all12Inspectable:r.all12Inspectable,manifestPreserves3D:r.manifestPreserves3D})),null,2));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});

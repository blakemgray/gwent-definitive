(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports={version:'11.tabletop.diagnostics.1',createDiagnostics:factory};
  else {root.GwentDiagnostics=factory(root);root.GwentDiagnostics.install();}
})(typeof window!=='undefined'?window:globalThis,function(env){
  'use strict';

  const VERSION='11.tabletop.diagnostics.1';
  const STYLE_KEYS=['--gwent-diagnostics-generation','--gwent-tabletop-generation','--gwent-style-generation','--gwent-physical-card-generation'];
  const STYLE_PROPERTIES=[
    'width','height','min-width','max-width','min-height','max-height','padding-top','padding-right','padding-bottom','padding-left',
    'border-top-width','border-right-width','border-bottom-width','border-left-width','box-sizing','overflow','overflow-x','overflow-y',
    'object-fit','object-position','transform','transform-origin','translate','rotate','scale','contain','content-visibility','clip','clip-path',
    'mask','mask-image','-webkit-mask','-webkit-mask-image','border-radius','position','top','right','bottom','left','inset',
    'display','flex','flex-grow','flex-shrink','flex-basis','flex-direction','flex-wrap','align-items','align-self','justify-content',
    'grid-template-columns','grid-template-rows','grid-auto-flow','grid-column','grid-row','gap','z-index','opacity','visibility','filter',
    'perspective','backface-visibility','appearance','-webkit-appearance','zoom','touch-action','pointer-events'
  ];
  const SUBSYSTEMS=['GwentBattlefieldUX','GwentBattlefieldReadability','GwentMotionTokens','GwentPresentationQueue',
    'GwentDirectManipulation','GwentCardContinuity','GwentTargetExposure','GwentGameplayChoreography','GwentPresentationFeedback',
    'GwentPlatformFeedback','GwentTabletopRenderer','GwentTabletopPhysics','GwentTabletopScene','GwentDiagnostics'];
  const handHistory=new Map();
  const MAX_HAND_HISTORY=192;
  let installed=false,panel=null,previousFocus=null,requestSequence=0,latestReport=null,refreshSequence=0,lastInputCapture=null,matchEpoch=0;
  const doc=env.document;
  const now=()=>new Date().toISOString();
  const all=(selector,host=doc)=>Array.from(host?.querySelectorAll?.(selector)||[]);
  const one=(selector,host=doc)=>host?.querySelector?.(selector)||null;
  const safe=(read,fallback=null)=>{try{return read();}catch(_){return fallback;}};
  const stringError=error=>String(error?.message||error);
  const clean=value=>safe(()=>JSON.parse(JSON.stringify(value)),null);

  function rect(el){
    const box=safe(()=>el.getBoundingClientRect());
    if(!box)return null;
    return Object.fromEntries(['x','y','width','height','top','right','bottom','left'].map(key=>[key,Number(box[key])]));
  }
  function computed(el){
    const style=safe(()=>env.getComputedStyle(el));
    if(!style)return null;
    return Object.fromEntries(STYLE_PROPERTIES.map(key=>[key,style.getPropertyValue(key)]));
  }
  function identify(el){
    return {tag:el.tagName?.toLowerCase()||null,id:el.id||null,classes:typeof el.className==='string'?el.className:null,
      iid:el.dataset?.cardIid||el.dataset?.inspectBoard||el.dataset?.presentationIid||el.dataset?.gcIid||el.dataset?.teActorFor||el.dataset?.tabletopIid||null,
      pid:el.dataset?.pid||null,row:el.dataset?.row||null,presentationRole:el.dataset?.presentationRole||null};
  }
  function elementSnapshot(el){
    if(!el)return null;
    const style=computed(el);
    return {...identify(el),rect:rect(el),client:{width:el.clientWidth,height:el.clientHeight},
      offset:{width:el.offsetWidth,height:el.offsetHeight},inlineStyle:el.getAttribute?.('style')||'',computed:style,
      clippingCandidate:!!style&&(['hidden','clip','scroll','auto'].some(value=>[style.overflow,style['overflow-x'],style['overflow-y']].includes(value))
        ||/(paint|strict|content)/.test(style.contain)||!['','none',undefined].includes(style['clip-path'])
        ||!['','none',undefined].includes(style['mask-image'])||!['','none',undefined].includes(style['-webkit-mask-image']))};
  }
  function captureCard(el){
    if(!el)return null;
    const image=el.tagName==='IMG'?el:one('img',el);
    const ancestry=[],imageAncestors=[];
    let parent=el.parentElement;
    for(let depth=0;parent&&depth<24;depth++,parent=parent.parentElement)ancestry.push(elementSnapshot(parent));
    parent=image?.parentElement;
    for(let depth=0;parent&&parent!==el&&depth<12;depth++,parent=parent.parentElement)imageAncestors.push(elementSnapshot(parent));
    const shell=elementSnapshot(el);
    return {capturedAt:now(),iid:shell.iid,role:el.matches?.('.hand-card')?'hand':el.matches?.('.unit[data-inspect-board]')?'board':'actor',
      connected:!!el.isConnected,shell,image:image?{...elementSnapshot(image),naturalWidth:image.naturalWidth,
        naturalHeight:image.naturalHeight,currentSrc:image.currentSrc||null,src:image.src||null,complete:!!image.complete}:null,
      imageAncestors,annotations:all('.u-score,.u-mark,.hc-name',el).map(elementSnapshot),ancestry};
  }
  function rememberHand(el){
    const iid=el?.dataset?.cardIid;
    if(!iid)return;
    const snapshot=captureCard(el);
    if(!snapshot)return;
    handHistory.delete(iid);
    handHistory.set(iid,snapshot);
    while(handHistory.size>MAX_HAND_HISTORY)handHistory.delete(handHistory.keys().next().value);
  }
  function snapshotHand(){
    const cards=all('#match-screen.active .hand-card[data-card-iid]');
    cards.forEach(rememberHand);
    return cards.length;
  }
  function environment(){
    const media=query=>safe(()=>!!env.matchMedia(query).matches,false);
    const modes=['fullscreen','standalone','minimal-ui','browser'];
    const displayModes=modes.filter(mode=>media(`(display-mode: ${mode})`));
    const viewport=env.visualViewport;
    const orientation=env.screen?.orientation;
    const rootStyle=safe(()=>env.getComputedStyle(doc.documentElement));
    return {url:env.location?.href||null,userAgent:env.navigator?.userAgent||null,platform:env.navigator?.platform||null,
      maxTouchPoints:env.navigator?.maxTouchPoints??null,standalone:env.navigator?.standalone===true||displayModes.includes('standalone'),
      navigatorStandalone:env.navigator?.standalone??null,displayModes,orientation:{type:orientation?.type||null,angle:orientation?.angle??env.orientation??null,
        media:media('(orientation: portrait)')?'portrait':'landscape'},devicePixelRatio:env.devicePixelRatio??null,
      viewport:{innerWidth:env.innerWidth??null,innerHeight:env.innerHeight??null,documentWidth:doc?.documentElement?.clientWidth??null,
        documentHeight:doc?.documentElement?.clientHeight??null,screenWidth:env.screen?.width??null,screenHeight:env.screen?.height??null},
      visualViewport:viewport?Object.fromEntries(['width','height','offsetLeft','offsetTop','pageLeft','pageTop','scale'].map(key=>[key,viewport[key]])):null,
      safeArea:Object.fromEntries(['top','right','bottom','left'].map(side=>[side,rootStyle?.getPropertyValue(`--gwent-diagnostics-safe-${side}`).trim()||'unknown'])),
      visibility:doc?.visibilityState||null,reducedMotion:media('(prefers-reduced-motion: reduce)'),capturedAt:now()};
  }
  function styles(){
    const candidates=[doc?.documentElement,one('#match-screen'),one('#match-screen .unit[data-inspect-board]')].filter(Boolean);
    return {sentinels:candidates.map(el=>({element:identify(el),values:Object.fromEntries(STYLE_KEYS.map(key=>[key,
      safe(()=>env.getComputedStyle(el).getPropertyValue(key).trim(),'')||'unknown']))})),
      stylesheets:Array.from(doc?.styleSheets||[]).map(sheet=>({href:sheet.href||null,disabled:!!sheet.disabled,
        rulesAccessible:safe(()=>{void sheet.cssRules.length;return true;},false)})),
      scriptSources:all('script[src]').map(script=>script.src)};
  }
  function workerInfo(worker){
    return worker?{scriptURL:worker.scriptURL||null,state:worker.state||null}:null;
  }
  function queryWorker(worker,{timeoutMs=1500}={}){
    const info=workerInfo(worker);
    if(!worker)return Promise.resolve(null);
    if(typeof env.MessageChannel!=='function')return Promise.resolve({...info,diagnostics:{status:'unsupported',build:'unknown'}});
    const requestId=`diagnostics-${++requestSequence}`;
    return new Promise(resolve=>{
      let channel,timer,finished=false;
      const finish=diagnostics=>{
        if(finished)return;
        finished=true;
        if(timer!==undefined)env.clearTimeout(timer);
        safe(()=>channel?.port1.close());safe(()=>channel?.port2.close());
        resolve({...info,diagnostics});
      };
      try{
        channel=new env.MessageChannel();
        channel.port1.onmessage=event=>{
          const data=event.data;
          if(data?.type!=='GWENT_DIAGNOSTICS_RESULT'||data.requestId!==requestId||typeof data.build!=='string')return;
          finish({status:'ok',build:data.build,coreCache:data.coreCache||null,runtimeCache:data.runtimeCache||null,
            scope:data.scope||null,protocolVersion:data.protocolVersion??null});
        };
        channel.port1.start?.();
        timer=env.setTimeout(()=>finish({status:'timeout',build:'unknown',note:'Worker did not answer; its build is unknown.'}),timeoutMs);
        worker.postMessage({type:'GWENT_DIAGNOSTICS',requestId},[channel.port2]);
      }catch(error){finish({status:'error',build:'unknown',error:stringError(error)});}
    });
  }
  async function serviceWorkers(){
    const sw=env.navigator?.serviceWorker;
    if(!sw)return {supported:false,controller:null,registration:null};
    let registration=null,error=null;
    try{registration=await sw.getRegistration();}catch(failure){error=stringError(failure);}
    const workers=[sw.controller,registration?.active,registration?.waiting,registration?.installing];
    const unique=new Map();
    for(const worker of workers)if(worker&&!unique.has(worker))unique.set(worker,queryWorker(worker));
    await Promise.all(unique.values());
    const results=new Map(await Promise.all(Array.from(unique,async([worker,promise])=>[worker,await promise])));
    return {supported:true,controller:results.get(sw.controller)||null,error,
      registration:registration?{scope:registration.scope||null,updateViaCache:registration.updateViaCache||null,
        active:results.get(registration.active)||null,waiting:results.get(registration.waiting)||null,
        installing:results.get(registration.installing)||null}:null};
  }
  async function cacheMetadata(){
    if(!env.caches?.keys)return {supported:false,names:null};
    try{return {supported:true,names:(await env.caches.keys()).sort()};}
    catch(error){return {supported:true,names:null,error:stringError(error)};}
  }
  function sceneObservation(){
    // Only declared observation APIs are read. No gameplay state, hidden hand, or solver mutation is requested.
    const readStatus=(name,method)=>safe(()=>clean(env[name]?.[method]?.()??null));
    return {directManipulation:{phase:env.GwentDirectManipulation?.phase||null,selectedIid:env.GwentDirectManipulation?.selectedIid||null,table:clean(env.GwentDirectManipulation?.tableInteraction)||null},
      presentation:{busy:env.GwentPresentationQueue?.busy??null,bodyStage:doc?.body?.dataset?.gcStage||null},
      continuity:{guardedIids:safe(()=>env.GwentCardContinuity?.guardedIids?.(),[])},
      tabletop:{renderer:readStatus('GwentTabletopRenderer','snapshot'),scene:readStatus('GwentTabletopScene','metrics')}};
  }
  async function collect(){
    const epoch=matchEpoch;
    snapshotHand();
    const liveCards=all('#match-screen.active .hand-card[data-card-iid],#match-screen.active .unit[data-inspect-board]');
    const actors=all('.dm-drag-proxy,.dm-flight-proxy,.gc-snapshot-ghost,.te-target-actor,[data-presentation-role]')
      .filter(el=>!liveCards.includes(el));
    const cards=liveCards.map(captureCard),bodyActors=actors.map(captureCard);
    const comparisons=cards.filter(card=>card.role==='board'&&handHistory.has(card.iid)).map(card=>({iid:card.iid,
      hand:handHistory.get(card.iid),board:card,sameSource:handHistory.get(card.iid).image?.currentSrc&&card.image?.currentSrc?
        handHistory.get(card.iid).image.currentSrc===card.image.currentSrc:null,
      note:'Both ancestry chains are captured; computed properties alone do not prove painted pixels.'}));
    const report={schemaVersion:1,diagnosticsVersion:VERSION,capturedAt:now(),runtimeIdentity:clean(env.GwentBuildIdentity)||{release:'unknown',commit:'unknown'},
      environment:environment(),loadedRuntimeVersions:Object.fromEntries(SUBSYSTEMS.map(name=>[name,env[name]?.version||'unknown'])),
      loadedRuntimeGenerations:{application:env.__GWENT_PASS11__?.generation||'unknown',
        battlefield:env.GwentBattlefieldUX?.generation||'unknown',input:env.GwentDirectManipulation?.generation||'unknown'},
      styles:styles(),presentation:sceneObservation(),cards,actors:bodyActors,handBoardComparisons:comparisons,
      retainedHandSnapshots:handHistory.size,notes:['Observation only; no application state is included.',
        'Service-worker build comes only from that worker. Unknown means unobservable, not up to date.',
        'Bounding rectangles include transforms. They do not by themselves identify the painted clipping stage.']};
    const [workers,caches]=await Promise.all([serviceWorkers(),cacheMetadata()]);
    report.serviceWorkers=workers;report.caches=caches;
    if(epoch===matchEpoch)latestReport=report;
    return report;
  }
  function summary(report){
    const identity=report.runtimeIdentity;
    const runtime=identity.release||identity.releaseId||identity.build||identity.generation||'unknown';
    const commit=identity.sourceCommit||identity.commit||identity.sha||identity.commitSha||'unknown (unstamped local source)';
    const active=report.serviceWorkers.controller?.diagnostics?.build||'unknown';
    const waiting=report.serviceWorkers.registration?.waiting;
    const viewport=report.environment.viewport;
    return `Runtime: ${runtime}\nCommit: ${commit}\nActive controller build: ${active}\nWaiting worker: ${waiting?(waiting.diagnostics?.build||'unknown'):'none observed'}\n`+
      `Mode: ${report.environment.standalone?'Standalone PWA':'Browser'} · ${report.environment.orientation.media}\n`+
      `Viewport: ${viewport.innerWidth} × ${viewport.innerHeight} · DPR ${report.environment.devicePixelRatio}\n`+
      `Cards: ${report.cards.length} · Actors: ${report.actors.length} · Hand/board pairs: ${report.handBoardComparisons.length}\n`+
      `Cache generations: ${report.caches.names?.join(', ')||'unknown'}`;
  }
  async function refresh(){
    if(!panel)return;
    const seq=++refreshSequence;
    panel.querySelector('[data-diagnostics-status]').textContent='Reading device and worker metadata…';
    try{
      const report=await collect();
      if(!panel||seq!==refreshSequence)return;
      panel.querySelector('[data-diagnostics-summary]').textContent=summary(report);
      panel.querySelector('textarea').value=JSON.stringify(report,null,2);
      panel.querySelector('[data-diagnostics-status]').textContent=`Captured ${report.capturedAt}. Copy or download this report.`;
    }catch(error){if(panel&&seq===refreshSequence)panel.querySelector('[data-diagnostics-status]').textContent=`Unable to collect: ${stringError(error)}`;}
  }
  function open(){
    if(!doc?.body)return false;
    if(panel){panel.querySelector('[data-diagnostics-close]').focus();return true;}
    previousFocus=doc.activeElement;
    panel=doc.createElement('section');
    panel.id='gwent-diagnostics';panel.className='gwent-diagnostics';
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','gwent-diagnostics-title');
    panel.innerHTML='<div class="gd-window"><header><h2 id="gwent-diagnostics-title">Device diagnostics</h2><button type="button" data-diagnostics-close aria-label="Close device diagnostics">Close</button></header>'+
      '<p class="gd-help">Play a card first to capture its hand and table geometry in this session. Send this report with a screenshot of the affected card.</p>'+
      '<pre data-diagnostics-summary></pre><div class="gd-actions"><button type="button" data-diagnostics-refresh>Refresh</button><button type="button" data-diagnostics-copy>Copy report</button>'+ 
      '<button type="button" data-diagnostics-download>Download JSON</button><button type="button" data-diagnostics-select>Select text</button></div>'+ 
      '<p role="status" data-diagnostics-status></p><label for="gwent-diagnostics-output">Diagnostic report (selectable)</label><textarea id="gwent-diagnostics-output" readonly spellcheck="false"></textarea></div>';
    doc.body.appendChild(panel);
    panel.addEventListener('click',event=>{
      const target=event.target.closest?.('button');
      if(!target)return;
      if(target.hasAttribute('data-diagnostics-close'))close();
      if(target.hasAttribute('data-diagnostics-refresh'))refresh();
      if(target.hasAttribute('data-diagnostics-copy'))copy();
      if(target.hasAttribute('data-diagnostics-download'))download();
      if(target.hasAttribute('data-diagnostics-select'))selectText();
    });
    panel.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
      if(event.key==='Tab'){
        const controls=all('button,textarea',panel),first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    panel.querySelector('[data-diagnostics-close]').focus();refresh();return true;
  }
  function close(){
    if(!panel)return;
    refreshSequence++;
    panel.remove();panel=null;
    if(previousFocus?.isConnected)previousFocus.focus();previousFocus=null;
  }
  function selectText(){
    const output=panel?.querySelector('textarea');
    output?.focus();output?.select();
    if(panel)panel.querySelector('[data-diagnostics-status]').textContent='Report selected. Use the browser’s Copy command if automatic copying is unavailable.';
  }
  async function copy(){
    const output=panel?.querySelector('textarea');
    if(!output?.value){if(panel)panel.querySelector('[data-diagnostics-status]').textContent='Wait for the report, then copy it.';return;}
    try{
      if(!env.navigator?.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await env.navigator.clipboard.writeText(output.value);
      if(panel)panel.querySelector('[data-diagnostics-status]').textContent='Report copied.';
    }catch(_){selectText();}
  }
  function download(){
    const output=panel?.querySelector('textarea');
    if(!output?.value)return;
    try{
      const url=env.URL.createObjectURL(new env.Blob([output.value],{type:'application/json'}));
      const link=doc.createElement('a');link.href=url;link.download=`gwent-device-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
      panel.appendChild(link);link.click();link.remove();env.setTimeout(()=>env.URL.revokeObjectURL(url),1000);
      panel.querySelector('[data-diagnostics-status]').textContent='Download requested. If your browser does not save it, use Copy report.';
    }catch(_){selectText();}
  }
  function install(){
    if(installed||!doc)return false;
    installed=true;
    const rememberTarget=event=>{
      const card=event.target?.closest?.('#match-screen.active .hand-card[data-card-iid]');
      if(!card)return;
      const timestamp=Date.now();
      // Touch can emit both pointerdown and touchstart. Read one card once rather
      // than taking repeated full-hand geometry snapshots during ordinary play.
      if(lastInputCapture?.card===card&&timestamp-lastInputCapture.at<80)return;
      rememberHand(card);lastInputCapture={card,at:timestamp};
    };
    doc.addEventListener('pointerdown',rememberTarget,{capture:true,passive:true});
    doc.addEventListener('touchstart',rememberTarget,{capture:true,passive:true});
    doc.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')rememberTarget(event);},true);
    doc.addEventListener('click',event=>{
      if(event.target?.closest?.('[data-open-diagnostics]')){event.preventDefault();open();}
    });
    env.addEventListener?.('gwent:tabletop-reset',()=>{
      matchEpoch++;refreshSequence++;handHistory.clear();lastInputCapture=null;latestReport=null;
      if(panel){
        panel.querySelector('textarea').value='';
        panel.querySelector('[data-diagnostics-summary]').textContent='';
        panel.querySelector('[data-diagnostics-status]').textContent='Match changed. Refresh to capture the current session.';
      }
    });
    const begin=()=>{
      if(safe(()=>new env.URL(env.location.href).searchParams.get('diagnostics'))==='1')open();
    };
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
    return true;
  }
  return Object.freeze({version:VERSION,install,open,close,collect,captureCard,snapshotHand,queryWorker,
    get latest(){return clean(latestReport);},constants:Object.freeze({STYLE_PROPERTIES,STYLE_KEYS,MAX_HAND_HISTORY})});
});

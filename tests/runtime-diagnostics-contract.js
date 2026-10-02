'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {createDiagnostics}=require('../src/runtime-diagnostics.js');
let assertions=0;
const eq=(actual,expected,message)=>{assert.deepStrictEqual(actual,expected,message);assertions++;};
const ok=(value,message)=>{assert.ok(value,message);assertions++;};

function harness(){
  const channels=[];
  class Channel{
    constructor(){
      this.port1={onmessage:null,closed:false,started:false,start(){this.started=true;},close(){this.closed=true;}};
      this.port2={closed:false,close(){this.closed=true;},postMessage:data=>queueMicrotask(()=>{
        if(!this.port1.closed)this.port1.onmessage?.({data});
      })};
      channels.push(this);
    }
  }
  const doc={documentElement:{clientWidth:852,clientHeight:393,tagName:'HTML',id:'',className:'',dataset:{},parentElement:null},
    visibilityState:'visible',styleSheets:[],body:{dataset:{}},cards:[],scripts:[],matchActive:true,
    querySelector(selector){if(selector==='#match-screen')return this.match;return null;},
    querySelectorAll(selector){
      if(selector==='#match-screen.active .hand-card[data-card-iid]')return this.matchActive?this.cards.filter(card=>card.role==='hand'):[];
      if(selector==='#match-screen.active .hand-card[data-card-iid],#match-screen.active .unit[data-inspect-board]')return this.matchActive?this.cards:[];
      if(selector==='script[src]')return this.scripts;
      return [];
    }};
  const env={document:doc,MessageChannel:Channel,setTimeout,clearTimeout,URL,screen:{width:852,height:393,orientation:{type:'landscape-primary',angle:90}},
    innerWidth:852,innerHeight:393,devicePixelRatio:3,location:{href:'https://example.test/gwent/?tabletop=1'},
    navigator:{userAgent:'iPhone test',platform:'iPhone',standalone:true,maxTouchPoints:5},
    visualViewport:{width:852,height:393,offsetLeft:0,offsetTop:0,pageLeft:0,pageTop:0,scale:1},
    matchMedia:query=>({matches:query.includes('standalone')||query.includes('landscape')}),
    getComputedStyle:el=>({getPropertyValue:key=>el?.styles?.[key]||({'overflow':'visible','overflow-x':'visible','overflow-y':'visible',
      'clip-path':'none','mask-image':'none','-webkit-mask-image':'none','contain':'none','display':'block','box-sizing':'border-box','object-fit':'contain'})[key]||''})};
  return {env,doc,channels};
}
function node(tag,extras={}){
  return {tagName:tag,className:'',id:'',dataset:{},styles:{},isConnected:true,clientWidth:34,clientHeight:64,offsetWidth:34,offsetHeight:64,
    parentElement:null,getAttribute:()=>null,getBoundingClientRect:()=>({x:10,y:20,width:34,height:64,top:20,right:44,bottom:84,left:10}),
    querySelector:()=>null,matches:()=>false,...extras};
}

async function main(){
  // Execute the real worker script and answer over the real diagnostics protocol.
  const listeners=new Map(),effects=[];
  const swSource=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
  const swEnv={registration:{scope:'https://example.test/gwent/'},location:{origin:'https://example.test'},
    addEventListener:(name,listener)=>listeners.set(name,listener),clients:{claim:()=>effects.push('claim')},skipWaiting:()=>effects.push('skipWaiting')};
  vm.runInNewContext(swSource,{self:swEnv,caches:{open:()=>effects.push('open'),keys:()=>effects.push('keys'),delete:()=>effects.push('delete')},URL,fetch:()=>effects.push('fetch')});
  const first=harness();
  const worker={scriptURL:'https://example.test/gwent/sw.js',state:'activated',postMessage:(data,ports)=>listeners.get('message')({data,ports})};
  const api=createDiagnostics(first.env);
  const response=await api.queryWorker(worker,{timeoutMs:40});
  eq(response.diagnostics.status,'ok','actual worker responds through channel');
  eq(response.diagnostics.build,'11.tabletop.foundation.1','active build is provided by queried worker');
  eq(response.diagnostics.coreCache,'gwent-definitive-core-11.tabletop.foundation.1','actual worker reports its coherent core cache');
  eq(response.diagnostics.runtimeCache,'gwent-definitive-runtime-11.tabletop.foundation.1','actual worker reports its runtime generation');
  eq(effects,[],'diagnostics protocol makes no network/cache/lifecycle mutations');
  ok(first.channels[0].port1.closed&&first.channels[0].port2.closed,'completed queries close both ports');
  let invalidMessages=0;
  listeners.get('message')({data:{type:'OTHER'},ports:[{postMessage:()=>invalidMessages++}]});
  listeners.get('message')({data:{type:'GWENT_DIAGNOSTICS'},ports:[]});
  eq(invalidMessages,0,'unrelated and portless messages do not respond or throw');

  // A legacy worker cannot be labeled current from its script URL or fetched source.
  let legacyPosts=0;
  const legacy={scriptURL:worker.scriptURL,state:'activated',postMessage:()=>legacyPosts++};
  const began=Date.now();
  const legacyResponse=await api.queryWorker(legacy,{timeoutMs:12});
  eq(legacyResponse.diagnostics.status,'timeout','legacy worker query has bounded lifetime');
  eq(legacyResponse.diagnostics.build,'unknown','same worker script URL never implies current generation');
  eq(legacyPosts,1,'legacy metadata sends exactly one request without triggering update');
  ok(Date.now()-began>=8&&Date.now()-began<1000,'worker timeout yields promptly without hanging collection');
  ok(first.channels[1].port1.closed&&first.channels[1].port2.closed,'timed-out queries release both ports');
  const broken={scriptURL:worker.scriptURL,state:'redundant',postMessage:()=>{throw new Error('Redundant');}};
  eq((await api.queryWorker(broken,{timeoutMs:12})).diagnostics.status,'error','posting failure is reported and does not hang');
  const noChannel=harness();delete noChannel.env.MessageChannel;
  eq((await createDiagnostics(noChannel.env).queryWorker(worker)).diagnostics.status,'unsupported','unsupported channel remains unknown');
  let wrongRequest;
  const mismatch={scriptURL:worker.scriptURL,state:'activated',postMessage:(data,ports)=>{
    wrongRequest=data.requestId;ports[0].postMessage({type:'GWENT_DIAGNOSTICS_RESULT',requestId:'wrong',build:'fabricated'});
  }};
  const wrongResponse=await api.queryWorker(mismatch,{timeoutMs:10});
  ok(wrongRequest,'requests include a correlation ID');
  eq(wrongResponse.diagnostics.status,'timeout','an unrelated response cannot fabricate worker build');

  // The same card changes semantic location; its preplay control is retained with its full ancestry.
  const fixture=harness();
  fixture.doc.match=node('SECTION',{id:'match-screen',styles:{'--gwent-tabletop-generation':'11.tabletop.foundation.1'}});
  const rail=node('DIV',{className:'hand',styles:{'overflow':'hidden','overflow-x':'hidden'}});
  rail.parentElement=fixture.doc.match;fixture.doc.match.parentElement=fixture.doc.documentElement;
  const image=node('IMG',{naturalWidth:410,naturalHeight:775,currentSrc:'https://art.test/same-card.jpg',src:'https://art.test/same-card.jpg',complete:true});
  const card=node('BUTTON',{role:'hand',className:'hand-card',dataset:{cardIid:'match-1-card-7'},parentElement:rail,
    matches(selector){return selector==='.hand-card'?this.role==='hand':selector==='.unit[data-inspect-board]'&&this.role==='board';},
    querySelector:selector=>selector==='img'?image:null});
  image.parentElement=card;fixture.doc.cards.push(card);
  fixture.env.GwentBuildIdentity={releaseId:'11.tabletop.foundation.1',sourceCommit:null,packaged:false};
  fixture.env.GwentTabletopRenderer={version:'tabletop.foundation.1',snapshot:()=>({enabled:true,liveCount:1})};
  fixture.env.GwentTabletopScene={version:'tabletop.foundation.1',metrics:()=>({enabled:true,poses:[{iid:'match-1-card-7',x:12,y:0}]})};
  const cardApi=createDiagnostics(fixture.env);fixture.env.GwentDiagnostics=cardApi;
  eq(cardApi.snapshotHand(),1,'the preplay hand control is observed');
  const boardRail=node('DIV',{className:'units',styles:{'overflow':'visible'}});boardRail.parentElement=fixture.doc.match;
  card.role='board';card.className='unit';card.dataset.inspectBoard=card.dataset.cardIid;card.parentElement=boardRail;
  card.styles={'padding-left':'0px','padding-right':'0px','transform':'matrix(1, 0, 0, 1, 12, 0)'};
  fixture.env.navigator.serviceWorker={controller:worker,getRegistration:async()=>({scope:'https://example.test/gwent/',active:worker,waiting:legacy,installing:null})};
  const cacheEffects=[];
  fixture.env.caches={keys:async()=>['gwent-definitive-core-11.golden.5','gwent-definitive-core-11.tabletop.foundation.1'],
    open:()=>cacheEffects.push('open'),delete:()=>cacheEffects.push('delete')};
  // Legacy timeout still resolves collect; the geometry snapshot precedes asynchronous metadata collection.
  const collecting=cardApi.collect();
  card.styles['padding-left']='99px';
  const report=await collecting;
  eq(report.runtimeIdentity.sourceCommit,null,'unstamped local source is not given a fabricated commit');
  eq(report.serviceWorkers.controller.diagnostics.build,'11.tabletop.foundation.1','collection exposes actual controller build');
  eq(report.serviceWorkers.registration.waiting.diagnostics.build,'unknown','legacy waiting worker remains unknown');
  eq(report.caches.names,['gwent-definitive-core-11.golden.5','gwent-definitive-core-11.tabletop.foundation.1'],'cache names preserve evidence of multiple generations');
  eq(cacheEffects,[],'collection never reads cache content or alters caches');
  eq(report.handBoardComparisons.length,1,'normal identity relocation retains a hand/board comparison');
  const comparison=report.handBoardComparisons[0];
  eq(comparison.iid,'match-1-card-7','comparison identity is the authoritative iid');
  eq(comparison.sameSource,true,'comparison identifies the same loaded art');
  eq(comparison.hand.role,'hand','preplay snapshot preserves original semantic role');
  eq(comparison.board.role,'board','current snapshot reflects played role');
  eq(comparison.hand.ancestry[0].classes,'hand','hand ancestry is not replaced by new board ancestry');
  eq(comparison.board.ancestry[0].classes,'units','board ancestry includes the actual unit rail');
  eq(comparison.hand.ancestry[0].clippingCandidate,true,'hand clipping ancestor is recorded');
  eq(comparison.board.shell.computed['padding-left'],'0px','geometry captured at collection start, before asynchronous worker delay');
  eq(comparison.board.image.naturalWidth,410,'image intrinsic width captured');
  eq(comparison.board.image.naturalHeight,775,'image intrinsic height captured');
  eq(comparison.board.shell.rect,{x:10,y:20,width:34,height:64,top:20,right:44,bottom:84,left:10},'complete transformed rectangle captured');
  ok(Object.hasOwn(comparison.board.shell.computed,'-webkit-mask-image'),'WebKit clipping styles are observed');
  ok(Object.hasOwn(comparison.board.shell.computed,'flex-shrink'),'layout compression styles are observed');
  eq(report.environment.standalone,true,'iOS standalone observation is explicit');
  eq(report.environment.devicePixelRatio,3,'device pixel ratio is observed');
  eq(report.environment.visualViewport.width,852,'visual viewport is distinct from layout viewport');
  eq(report.loadedRuntimeVersions.GwentDiagnostics,'11.tabletop.diagnostics.1','loaded diagnostics generation is explicit');
  eq(report.presentation.tabletop.renderer.liveCount,1,'renderer exposes observation of persistent card registry');
  eq(report.presentation.tabletop.scene.poses[0].x,12,'scene exposes observed physical pose without changing it');
  eq(report.notes.length,3,'observation limits are retained in exported evidence');
  const detached=cardApi.latest;detached.cards[0].iid='changed';
  eq(cardApi.latest.cards[0].iid,'match-1-card-7','external consumers cannot alter retained report');
  eq(effects,[],'complete collection remains read-only to worker/cache lifecycle');
  const inner=node('DIV',{className:'card-face',parentElement:card,styles:{'overflow':'hidden'}});image.parentElement=inner;
  const wrapped=cardApi.captureCard(card);
  eq(wrapped.imageAncestors[0].classes,'card-face','inner face wrapper between image and shell is included');
  eq(wrapped.imageAncestors[0].clippingCandidate,true,'inner wrapper clipping can be distinguished from shell clipping');

  // Installed instrumentation does no full-hand reads on startup or mutation.
  // The selected card is captured before real input commits it, and duplicate
  // pointer/touch activation does not read the whole style chain twice.
  const inputFixture=harness(),inputHandlers=new Map(),windowHandlers=new Map();
  inputFixture.doc.addEventListener=(name,listener)=>inputHandlers.set(name,listener);
  inputFixture.env.addEventListener=(name,listener)=>windowHandlers.set(name,listener);
  let styleReads=0,observerCreations=0;
  const baseComputed=inputFixture.env.getComputedStyle;
  inputFixture.env.getComputedStyle=el=>{styleReads++;return baseComputed(el);};
  inputFixture.env.MutationObserver=class{constructor(){observerCreations++;}observe(){}};
  const touchImage=node('IMG',{naturalWidth:410,naturalHeight:775,currentSrc:'https://art.test/same-card.jpg',complete:true});
  const touchCard=node('BUTTON',{role:'hand',className:'hand-card',dataset:{cardIid:'touch-card'},
    matches(selector){return selector==='.hand-card'?this.role==='hand':selector==='.unit[data-inspect-board]'&&this.role==='board';},
    querySelector:()=>touchImage});
  touchImage.parentElement=touchCard;inputFixture.doc.cards.push(touchCard);
  const inputApi=createDiagnostics(inputFixture.env);
  eq(inputApi.install(),true,'instrumentation installs passive input capture');
  eq(styleReads,0,'startup does not read card styles');
  eq(observerCreations,0,'normal render mutations cannot trigger full-hand capture');
  const inputEvent={target:{closest:()=>touchCard}};
  inputHandlers.get('pointerdown')(inputEvent);
  const once=styleReads;
  ok(once>0,'pointer action captures preplay geometry');
  inputHandlers.get('touchstart')(inputEvent);
  eq(styleReads,once,'paired touch event does not repeat geometry reads');
  touchCard.role='board';touchCard.className='unit';touchCard.dataset.inspectBoard=touchCard.dataset.cardIid;
  const beforeReset=await inputApi.collect();
  eq(beforeReset.handBoardComparisons.length,1,'real input captures hand control before play');
  windowHandlers.get('gwent:tabletop-reset')({detail:{reason:'new-match'}});
  eq(inputApi.latest,null,'match reset discards prior report');
  eq((await inputApi.collect()).handBoardComparisons.length,0,'reused iid cannot pair with a prior match control');
  inputFixture.doc.matchActive=false;touchCard.role='hand';touchCard.className='hand-card';
  windowHandlers.get('gwent:tabletop-reset')({detail:{reason:'new-match'}});
  const inactive=await inputApi.collect();
  eq(inactive.cards.length,0,'inactive stale match DOM is not captured as live cards');
  eq(inactive.retainedHandSnapshots,0,'inactive stale hand cannot resurrect previous-match history');
  inputFixture.env.navigator.serviceWorker={controller:legacy,getRegistration:async()=>null};
  const pending=inputApi.collect();
  windowHandlers.get('gwent:tabletop-reset')({detail:{reason:'new-match'}});
  await pending;
  eq(inputApi.latest,null,'an asynchronous old-session report cannot repopulate reset history');
  console.log(`runtime-diagnostics-contract: ${assertions} assertions passed`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});

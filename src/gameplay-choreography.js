(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else {root.GwentGameplayChoreography=api;api.install();}
})(typeof self!=='undefined'?self:globalThis,function(root){
  'use strict';

  const VERSION='10.4B.0';
  const ROWS=['close','ranged','siege'];
  const runtime={installed:false,stage:null,lastPlan:[],lastTransaction:null,presented:0,cancelled:0,errors:0,externalTransactions:0,lastObservedState:null,stableVisual:null,observer:null,scheduled:false};
  const $=(s,r=root.document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=root.document)=>[...(r?.querySelectorAll?.(s)||[])];
  const wait=ms=>new Promise(resolve=>root.setTimeout(resolve,Math.max(0,ms||0)));
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const rowKey=(pid,row)=>`${pid}:${row}`;

  function plan(tx){
    if(!tx||tx.kind!=='game_action')return [];
    const e=tx.events||[],stages=[];
    const all=t=>e.filter(x=>x.type===t),one=t=>e.find(x=>x.type===t);
    const scores=[...all('ROW_SCORE_CHANGE'),...all('TOTAL_SCORE_CHANGE')];
    const roundEnd=one('ROUND_END'),roundIndex=roundEnd?.engineIndex;
    const beforeRound=ev=>roundIndex==null||ev.engineIndex==null||ev.engineIndex<roundIndex;
    const afterRound=ev=>roundIndex!=null&&ev.engineIndex!=null&&ev.engineIndex>roundIndex;
    const draws=all('CARD_DRAW'),preDraws=draws.filter(beforeRound),postDraws=draws.filter(afterRound);
    const revives=all('FACTION_REVIVE'),preFactionRevives=revives.filter(beforeRound),postFactionRevives=revives.filter(afterRound);
    const spy=one('SPY_TRIGGER'),medics=all('MEDIC_REVIVE'),muster=all('MUSTER_SUMMON'),scorch=all('SCORCH_TRIGGER');

    // Causal correction: leader origin and revived unit establish before their nested consequences,
    // even where the engine log records nested effects during placement before its summary event.
    for(const l of all('LEADER_TRIGGER'))stages.push({kind:'leader',event:l});
    for(const m of medics)stages.push({kind:'medic',event:m});
    if(spy){const spyDraws=preDraws.filter(d=>d.engineIndex==null||spy.engineIndex==null||d.engineIndex<spy.engineIndex).slice(-Math.max(0,spy.drawCount||2));stages.push({kind:'spy',event:spy,draws:spyDraws,scores});}
    else if(!roundEnd)for(const d of preDraws)stages.push({kind:'draw',event:d});
    if(muster.length)stages.push({kind:'muster',events:muster});
    if(scorch.length)stages.push({kind:'scorch',events:scorch});
    for(const d of all('DECOY_SWAP'))stages.push({kind:'decoy',event:d});
    for(const w of all('WEATHER_APPLY'))stages.push({kind:'weather',event:w});
    for(const w of all('WEATHER_CLEAR'))stages.push({kind:'weather-clear',event:w});
    for(const h of all('HORN_TRIGGER'))stages.push({kind:'horn',event:h});
    for(const m of all('MARDROEME_TRIGGER'))stages.push({kind:'mardroeme',event:m});
    const transforms=all('BERSERKER_TRANSFORM');if(transforms.length)stages.push({kind:'transform',events:transforms});
    for(const a of all('AVENGER_SUMMON'))stages.push({kind:'avenger',event:a});
    for(const b of all('TIGHT_BOND_TRIGGER'))stages.push({kind:'bond',event:b});
    for(const m of all('MORALE_TRIGGER'))stages.push({kind:'morale',event:m});
    for(const h of all('HERO_LAND'))stages.push({kind:'hero',event:h});
    if(scores.length&&!spy&&!roundEnd)stages.push({kind:'score',events:scores});
    for(const p of all('PASS'))stages.push({kind:'pass',event:p});

    if(roundEnd){
      stages.push({kind:'round-end',event:roundEnd,life:all('LIFE_CHANGE'),clear:one('BOARD_CLEAR'),roundStart:one('ROUND_START'),bonusDraws:postDraws,factionRevives:postFactionRevives,retention:one('MONSTER_RETAIN'),match:one('MATCH_END')});
      const match=one('MATCH_END');if(match)stages.push({kind:'match-result',event:match});
    }else{
      for(const l of all('LIFE_CHANGE'))stages.push({kind:'life',event:l});
      if(one('BOARD_CLEAR'))stages.push({kind:'board-clear',event:one('BOARD_CLEAR')});
      if(one('ROUND_START'))stages.push({kind:'round-start',event:one('ROUND_START')});
      for(const r of preFactionRevives)stages.push({kind:'faction-revive',event:r});
      const match=one('MATCH_END');if(match)stages.push({kind:'match-result',event:match});
      const turn=one('TURN_CHANGE');if(turn)stages.push({kind:'turn',event:turn});
    }
    return stages;
  }

  function queue(){return root.GwentPresentationQueue;}
  function motion(){return root.GwentMotionTokens;}
  function duration(name='abilityFast'){return motion()?.duration?.(name)??220;}
  function reduced(){return !!motion()?.reduced?.();}
  function register(anim){queue()?.registerAnimation?.(anim);return anim;}
  function done(anim){return anim?.finished?.catch?.(()=>{})||Promise.resolve();}
  function abortCheck(signal){if(signal?.aborted){const e=new Error('presentation cancelled');e.name='AbortError';throw e;}}
  function plainRect(r){return r&&r.width&&r.height?{x:r.x,y:r.y,width:r.width,height:r.height}:null;}
  function rectOf(el){return el?plainRect(el.getBoundingClientRect()):null;}
  function rowEl(pid,row){return $(`#match-screen .lane[data-pid="${pid}"][data-row="${row}"]`);}
  function scoreEl(pid,row=null){return row?rowEl(pid,row)?.querySelector('.rscore'):(pid==='p1'?$('#player-total'):$('#opp-total'));}
  function handCard(iid){return iid?$(`#match-screen .hand-card[data-card-iid="${iid}"]`):null;}
  function boardCard(iid){return iid?$(`#match-screen [data-inspect-board="${iid}"]`):null;}
  function weatherEl(){return $('#match-screen .weather');}
  function leaderEl(){return $('#leader-button');}

  function visualItem(el,extra={}){const rect=rectOf(el);return rect?{rect,html:el.outerHTML,...extra}:null;}
  function captureVisual(){
    const out={cards:{},hand:{},rows:{},anchors:{},scores:{}};
    for(const lane of $$('#match-screen .lane[data-pid][data-row]')){
      const pid=lane.dataset.pid,row=lane.dataset.row,key=rowKey(pid,row),score=lane.querySelector('.rscore');
      out.rows[key]={rect:rectOf(lane),unitsRect:rectOf(lane.querySelector('.units')),score:score?{rect:rectOf(score),text:score.textContent}:null,cards:[]};
      for(const el of lane.querySelectorAll('.unit[data-inspect-board]')){const iid=el.dataset.inspectBoard,item=visualItem(el,{iid,pid,row,zone:'board'});if(item){out.cards[iid]=item;out.rows[key].cards.push(iid);}}
      if(score)out.scores[`row:${key}`]={rect:rectOf(score),text:score.textContent,pid,row};
    }
    for(const el of $$('#match-screen .hand-card[data-card-iid]')){const iid=el.dataset.cardIid,item=visualItem(el,{iid,zone:'hand',pid:'p1'});if(item)out.hand[iid]=item;}
    const countSpans=$$('#counts > span');
    out.anchors={board:rectOf($('#board')),counts:rectOf($('#counts')),deck:rectOf(countSpans[0]),grave:rectOf(countSpans[1]),hand:rectOf($('#hand')),weather:rectOf(weatherEl()),leader:rectOf(leaderEl()),matchline:rectOf($('#matchline'))};
    const p1=scoreEl('p1'),p2=scoreEl('p2');if(p1)out.scores['total:p1']={rect:rectOf(p1),text:p1.textContent,pid:'p1'};if(p2)out.scores['total:p2']={rect:rectOf(p2),text:p2.textContent,pid:'p2'};
    return out;
  }
  function itemFrom(vis,iid){return vis?.cards?.[iid]||vis?.hand?.[iid]||null;}
  function actualFor(item){if(!item?.iid)return null;return item.zone==='hand'?handCard(item.iid):boardCard(item.iid);}
  function overlayRoot(){
    let el=$('#gc-overlay');if(el)return el;
    el=root.document.createElement('div');el.id='gc-overlay';el.className='gc-overlay';el.setAttribute('aria-hidden','true');root.document.body.appendChild(el);
    queue()?.registerCleanup?.(()=>{try{el.replaceChildren();delete el.dataset.stage;}catch(_){}});return el;
  }
  function transientClass(el,cls){if(!el)return()=>{};el.classList.add(cls);const off=()=>el.classList.remove(cls);queue()?.registerCleanup?.(off);return off;}
  function hideTransient(el){if(!el)return()=>{};const prior=el.style.visibility;el.style.visibility='hidden';const restore=()=>{el.style.visibility=prior;};queue()?.registerCleanup?.(restore);return restore;}
  function cleanGhost(node){if(!node)return node;for(const c of [...node.classList])if(c.startsWith('dm-')||c.startsWith('gc-'))node.classList.remove(c);node.classList.add('gc-snapshot-ghost');node.removeAttribute('id');node.disabled=true;return node;}
  function createGhost(item,kind='card',rectOverride=null,htmlOverride=null){
    const rect=rectOverride||item?.rect;if(!rect)return null;const wrap=root.document.createElement('div');wrap.innerHTML=htmlOverride||item?.html||'<div></div>';const node=cleanGhost(wrap.firstElementChild||root.document.createElement('div'));node.classList.add(`gc-snapshot-${kind}`);node.style.position='fixed';node.style.left=`${rect.x}px`;node.style.top=`${rect.y}px`;node.style.width=`${rect.width}px`;node.style.height=`${rect.height}px`;node.style.margin='0';node.style.pointerEvents='none';overlayRoot().appendChild(node);const cleanup=()=>{try{node.remove();}catch(_){}};queue()?.registerCleanup?.(cleanup);return {node,rect,cleanup};
  }
  function centeredRect(anchor,width,height){if(!anchor)return null;return{x:anchor.x+anchor.width/2-width/2,y:anchor.y+anchor.height/2-height/2,width,height};}
  async function travelVisual(source,target,kind,signal,opts={}){
    abortCheck(signal);if(!target?.rect)return;
    const targetEl=actualFor(target),restore=opts.hideTarget===false?()=>{}:hideTransient(targetEl);
    const startAnchor=source?.rect||opts.startRect||centeredRect(opts.anchor||null,target.rect.width,target.rect.height)||target.rect;
    const start=centeredRect(startAnchor,target.rect.width,target.rect.height)||target.rect;
    if(reduced()){restore();await pulse(targetEl,kind,'microNormal',signal);return;}
    const ghost=createGhost(target,kind,start,opts.html||target.html);if(!ghost){restore();return;}
    const dx=target.rect.x-start.x,dy=target.rect.y-start.y,sx=target.rect.width/Math.max(1,start.width),sy=target.rect.height/Math.max(1,start.height);
    const a=register(ghost.node.animate([{opacity:.35,transform:'translate3d(0,0,0) scale(.88)',filter:'brightness(.92)'},{offset:.22,opacity:1,transform:`translate3d(${dx*.18}px,${dy*.18-5}px,0) scale(.94)`,filter:'brightness(1.08)'},{opacity:1,transform:`translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`,filter:'brightness(1)'}],{duration:duration(opts.durationName||'routineFast'),easing:motion()?.EASING?.direct||'ease-out',fill:'forwards'}));
    await done(a);ghost.cleanup();restore();abortCheck(signal);
  }
  async function pulse(el,kind='impact',name='abilityFast',signal){
    abortCheck(signal);if(!el)return;const ms=duration(reduced()?'microNormal':name);transientClass(el,`gc-${kind}`);
    const frames=reduced()?[{opacity:.72},{opacity:1}]:[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.035)',filter:'brightness(1.2)'},{transform:'scale(1)',filter:'brightness(1)'}];
    const a=register(el.animate(frames,{duration:ms,easing:motion()?.EASING?.impact||'ease-out'}));await done(a);abortCheck(signal);
  }
  async function cue(text,kind,target,signal,name='abilityFast'){
    abortCheck(signal);const host=overlayRoot(),el=root.document.createElement('div');el.className=`gc-cue gc-cue-${kind}`;el.textContent=text;const r=rectOf(target);if(!r)el.classList.add('gc-center');host.appendChild(el);
    if(r){const er=el.getBoundingClientRect(),margin=8,halfW=er.width/2,halfH=er.height/2,minX=margin+halfW,maxX=Math.max(minX,(root.innerWidth||0)-margin-halfW),minY=margin+halfH,maxY=Math.max(minY,(root.innerHeight||0)-margin-halfH),cx=Math.min(maxX,Math.max(minX,r.x+r.width/2)),cy=Math.min(maxY,Math.max(minY,r.y+r.height/2));el.style.left=`${cx}px`;el.style.top=`${cy}px`;}
    const cleanup=()=>{try{el.remove();}catch(_){}};queue()?.registerCleanup?.(cleanup);const ms=duration(reduced()?'microNormal':name),frames=reduced()?[{opacity:0},{opacity:1},{opacity:0}]:[{opacity:0,transform:'translate(-50%,-35%) scale(.88)'},{offset:.25,opacity:1,transform:'translate(-50%,-50%) scale(1.04)'},{offset:.72,opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-68%) scale(.98)'}];const a=register(el.animate(frames,{duration:ms,easing:motion()?.EASING?.direct||'ease-out'}));await done(a);cleanup();abortCheck(signal);
  }

  async function oneScore(ev,signal){
    const el=ev.type==='ROW_SCORE_CHANGE'?scoreEl(ev.playerId,ev.row):scoreEl(ev.playerId);if(!el||ev.from===ev.to)return;const rect=rectOf(el);if(!rect)return;const restore=hideTransient(el),ghost=createGhost({rect,html:`<div class="gc-score-float">${ev.from}</div>`},'score',rect);if(!ghost){restore();return;}
    const first=register(ghost.node.animate([{opacity:1,transform:'scale(1)'},{opacity:.55,transform:'scale(.88)'}],{duration:duration('microFast'),easing:motion()?.EASING?.fade||'ease-out'}));await done(first);ghost.node.textContent=String(ev.to);const second=register(ghost.node.animate([{opacity:.65,transform:'scale(.92)'},{opacity:1,transform:'scale(1.12)'},{opacity:1,transform:'scale(1)'}],{duration:duration('routineFast'),easing:motion()?.EASING?.impact||'ease-out'}));await done(second);ghost.cleanup();restore();abortCheck(signal);
  }
  async function scoreSequence(events,signal){
    const rows=(events||[]).filter(e=>e.type==='ROW_SCORE_CHANGE'),totals=(events||[]).filter(e=>e.type==='TOTAL_SCORE_CHANGE');if(rows.length)await Promise.all(rows.map(e=>oneScore(e,signal)));if(totals.length)await Promise.all(totals.map(e=>oneScore(e,signal)));
  }
  async function drawCard(ev,signal,visuals){
    const target=visuals?.after?.hand?.[ev.iid]||null;if(target)await travelVisual(null,target,'draw',signal,{anchor:visuals?.after?.anchors?.deck||visuals?.after?.anchors?.counts,durationName:'routineFast'});else await cue('DRAW','draw',ev.playerId==='p1'?$('#counts'):$('#matchline'),signal,'routineFast');
  }
  async function presentMuster(stage,signal,visuals){
    const evs=stage.events||[];if(!evs.length)return;const row=rowEl(evs[0].playerId,evs[0].row);await cue('MUSTER','muster',row,signal,'abilityFast');
    const restores=[];for(const ev of evs){const target=visuals?.after?.cards?.[ev.iid];if(target)restores.push(hideTransient(actualFor(target)));}
    queue()?.registerCleanup?.(()=>restores.forEach(fn=>fn()));
    for(let i=0;i<evs.length;i++){const ev=evs[i],target=visuals?.after?.cards?.[ev.iid];if(!target)continue;const source=visuals?.before?.hand?.[ev.iid]||null,large=evs.length>=5,middle=large&&i>1&&i<evs.length-1;await travelVisual(source,target,'muster-unit',signal,{anchor:visuals?.before?.anchors?.deck||visuals?.before?.anchors?.counts,durationName:middle?'microNormal':'routineFast',hideTarget:false});restores[i]?.();if(i<evs.length-1)await wait(reduced()?5:(large?20:55));}
    await pulse(row,'muster-row','abilityFast',signal);
  }
  async function presentScorch(stage,signal,visuals){
    const doomed=(stage.events||[]).flatMap(e=>e.doomed||[]),ids=[...new Set(doomed.map(d=>d.iid).filter(Boolean))];if(!ids.length){await cue('SCORCH','scorch',$('#board'),signal,'majorNormal');return;}
    const keys=[...new Set(doomed.filter(d=>d.playerId&&d.row).map(d=>rowKey(d.playerId,d.row)))],hidden=[],ghosts=new Map();
    for(const key of keys){const [pid,row]=key.split(':'),lane=rowEl(pid,row),units=lane?.querySelector('.units'),score=lane?.querySelector('.rscore');if(units)hidden.push(hideTransient(units));if(score)hidden.push(hideTransient(score));const rowSnap=visuals?.before?.rows?.[key];for(const iid of rowSnap?.cards||[]){const item=visuals?.before?.cards?.[iid],g=item?createGhost(item,ids.includes(iid)?'scorch-doomed':'scorch-survivor'):null;if(g)ghosts.set(iid,g);}}
    await cue(ids.length===1?'SCORCH':`SCORCH ×${ids.length}`,'scorch',$('#board'),signal,'abilityNormal');
    const grave=visuals?.after?.anchors?.grave||visuals?.after?.anchors?.counts;
    await Promise.all(ids.map(async iid=>{const g=ghosts.get(iid);if(!g)return;transientClass(g.node,'gc-doomed');const start=g.rect,end=centeredRect(grave,start.width*.72,start.height*.72)||{x:start.x,y:start.y+18,width:start.width*.72,height:start.height*.72},dx=end.x-start.x,dy=end.y-start.y;const frames=reduced()?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'},{offset:.22,opacity:1,transform:'translate3d(0,-2px,0) scale(1.04)',filter:'brightness(1.65) sepia(.65)'},{offset:.48,opacity:.72,transform:`translate3d(${dx*.10}px,${dy*.10}px,0) scale(.94)`,filter:'brightness(.8) sepia(1) contrast(1.35)'},{opacity:0,transform:`translate3d(${dx*.42}px,${dy*.42}px,0) scale(.68)`,filter:'brightness(.25) sepia(1) blur(1px)'}];const a=register(g.node.animate(frames,{duration:duration('majorNormal'),easing:motion()?.EASING?.impact||'ease-out',fill:'forwards'}));await done(a);g.cleanup();}));
    const survivors=[...ghosts.entries()].filter(([iid])=>!ids.includes(iid)).map(([,g])=>g);await Promise.all(survivors.map(async g=>{const a=register(g.node.animate([{opacity:1},{opacity:.25}],{duration:duration('microNormal'),easing:'ease-out'}));await done(a);g.cleanup();}));hidden.forEach(fn=>fn());abortCheck(signal);
  }
  async function presentDecoy(stage,signal,visuals,tx){
    const targetIid=stage.event.targetIid,beforeTarget=visuals?.before?.cards?.[targetIid],afterTarget=visuals?.after?.hand?.[targetIid];await cue('DECOY · SWAP','decoy',rowEl(stage.event.playerId,stage.event.row),signal,'abilityFast');if(beforeTarget&&afterTarget)await travelVisual(beforeTarget,afterTarget,'decoy-return',signal,{durationName:'abilityFast'});await pulse(rowEl(stage.event.playerId,stage.event.row),'decoy-row','routineFast',signal);
  }
  async function presentMedic(stage,signal,visuals){
    const target=visuals?.after?.cards?.[stage.event.iid];await cue('REVIVE','medic',rowEl(stage.event.playerId,stage.event.row),signal,'abilityFast');if(target)await travelVisual(null,target,'medic-card',signal,{anchor:visuals?.before?.anchors?.grave||visuals?.before?.anchors?.counts,durationName:'abilityNormal'});else await pulse(rowEl(stage.event.playerId,stage.event.row),'medic-card','abilityFast',signal);
  }
  async function presentTransform(stage,signal,visuals){
    for(const ev of stage.events||[]){const before=visuals?.before?.cards?.[ev.iid],after=visuals?.after?.cards?.[ev.iid],el=actualFor(after);if(!after)continue;const restore=hideTransient(el),ghostBefore=before?createGhost(before,'transform-before'):null,ghostAfter=createGhost(after,'transform-after');if(ghostAfter)ghostAfter.node.style.opacity='0';if(reduced()){ghostBefore?.cleanup();if(ghostAfter){ghostAfter.node.style.opacity='1';await pulse(ghostAfter.node,'transform','microNormal',signal);ghostAfter.cleanup();}restore();continue;}const a1=ghostBefore?register(ghostBefore.node.animate([{opacity:1,filter:'brightness(1)'},{opacity:0,filter:'brightness(1.7) saturate(.3)',transform:'scale(.9)'}],{duration:duration('routineFast'),easing:'ease-out',fill:'forwards'})):null;const a2=ghostAfter?register(ghostAfter.node.animate([{opacity:0,filter:'brightness(1.6)'},{opacity:1,filter:'brightness(1)',transform:'scale(1)'}],{duration:duration('abilityFast'),delay:Math.max(0,duration('routineFast')-30),easing:'ease-out',fill:'forwards'})):null;await Promise.all([done(a1),done(a2)]);ghostBefore?.cleanup();ghostAfter?.cleanup();restore();}
  }
  function freezeBoardBefore(visuals){
    const hidden=[],ghosts=[];for(const pid of ['p1','p2'])for(const row of ROWS){const lane=rowEl(pid,row),units=lane?.querySelector('.units'),score=lane?.querySelector('.rscore');if(units)hidden.push(hideTransient(units));if(score)hidden.push(hideTransient(score));const snap=visuals?.before?.rows?.[rowKey(pid,row)];for(const iid of snap?.cards||[]){const g=createGhost(visuals.before.cards[iid],'round-hold');if(g)ghosts.push(g);}if(snap?.score?.rect){const sg=createGhost({rect:snap.score.rect,html:`<div class="gc-score-float">${snap.score.text}</div>`},'round-score');if(sg)ghosts.push(sg);}}
    return()=>{ghosts.forEach(g=>g.cleanup());hidden.forEach(fn=>fn());};
  }
  async function presentRound(stage,signal,visuals){
    const revived=(stage.factionRevives||[]).map(e=>visuals?.after?.cards?.[e.iid]).filter(Boolean),drawn=(stage.bonusDraws||[]).map(e=>visuals?.after?.hand?.[e.iid]).filter(Boolean),restoreRevived=revived.map(item=>hideTransient(actualFor(item))),restoreDrawn=drawn.map(item=>hideTransient(actualFor(item))),releaseFreeze=freezeBoardBefore(visuals);
    const text=stage.event.winnerId==='p1'?'ROUND WON':stage.event.winnerId==='p2'?'ROUND LOST':'ROUND DRAW';await cue(text,'round',$('#board'),signal,'majorNormal');for(const l of stage.life||[])await pulse(l.playerId==='p1'?$('#player-total'):$('#opp-total'),'life','routineFast',signal);releaseFreeze();
    for(const r of stage.retention?.retained||[]){const el=boardCard(r.iid);if(el)await pulse(el,'retained','abilityFast',signal);}
    if(stage.roundStart)await cue(`ROUND ${stage.roundStart.round}`,'round-start',$('#matchline'),signal,'abilityFast');
    for(let i=0;i<(stage.bonusDraws||[]).length;i++){const ev=stage.bonusDraws[i],target=visuals?.after?.hand?.[ev.iid];if(target){await travelVisual(null,target,'draw',signal,{anchor:visuals?.after?.anchors?.deck||visuals?.after?.anchors?.counts,durationName:'routineFast',hideTarget:false});restoreDrawn[i]?.();}}
    for(let i=0;i<(stage.factionRevives||[]).length;i++){const ev=stage.factionRevives[i],target=visuals?.after?.cards?.[ev.iid];if(target){await travelVisual(null,target,'faction-revive',signal,{anchor:visuals?.before?.anchors?.grave||visuals?.before?.anchors?.counts,durationName:'abilityNormal',hideTarget:false});restoreRevived[i]?.();}}
  }
  async function presentStage(stage,tx,signal,visuals){
    runtime.stage=stage.kind;root.document.body.dataset.gcStage=stage.kind;abortCheck(signal);
    switch(stage.kind){
      case 'leader':await cue('LEADER','leader',leaderEl(),signal,'abilityFast');await pulse(leaderEl(),'leader-card','routineFast',signal);break;
      case 'medic':await presentMedic(stage,signal,visuals);break;
      case 'spy':{const loc=tx.afterLocation;await cue('SPY','spy',loc?.row?rowEl(loc.playerId,loc.row):$('#board'),signal,'abilityFast');if(loc?.row)await pulse(rowEl(loc.playerId,loc.row),'spy-row','routineFast',signal);await scoreSequence(stage.scores,signal);for(const d of stage.draws||[])await drawCard(d,signal,visuals);break;}
      case 'draw':await drawCard(stage.event,signal,visuals);break;
      case 'muster':await presentMuster(stage,signal,visuals);break;
      case 'scorch':await presentScorch(stage,signal,visuals);break;
      case 'decoy':await presentDecoy(stage,signal,visuals,tx);break;
      case 'weather':{await cue('WEATHER','weather',weatherEl(),signal,'abilityFast');await pulse(weatherEl(),'weather-core','routineFast',signal);const map={frost:'close',fog:'ranged',rain:'siege'};for(const a of stage.event.abilities||[]){const row=map[a];if(row)await Promise.all([pulse(rowEl('p1',row),'weather-row','routineFast',signal),pulse(rowEl('p2',row),'weather-row','routineFast',signal)]);}break;}
      case 'weather-clear':await cue('CLEAR WEATHER','weather-clear',weatherEl(),signal,'abilityFast');for(const pid of ['p1','p2'])for(const row of ROWS)await pulse(rowEl(pid,row),'weather-clear-row','microNormal',signal);break;
      case 'horn':{const row=rowEl(stage.event.playerId,stage.event.row),origin=stage.event.source==='leader'?leaderEl():row?.querySelector('.special-slot-wrap');await cue('COMMANDER’S HORN','horn',origin,signal,'abilityFast');await pulse(row,'horn-row','abilityNormal',signal);break;}
      case 'mardroeme':await cue('MARDROEME','weather',rowEl(stage.event.playerId,stage.event.row),signal,'abilityFast');await pulse(rowEl(stage.event.playerId,stage.event.row),'morale-row','abilityFast',signal);break;
      case 'transform':await presentTransform(stage,signal,visuals);break;
      case 'avenger':{const target=visuals?.after?.cards?.[stage.event.iid];if(target)await travelVisual(null,target,'avenger',signal,{anchor:visuals?.before?.anchors?.grave||visuals?.before?.anchors?.counts,durationName:'abilityFast'});break;}
      case 'bond':await cue('TIGHT BOND','bond',rowEl(stage.event.playerId,stage.event.row),signal,'abilityFast');await pulse(rowEl(stage.event.playerId,stage.event.row),'bond-row','abilityNormal',signal);break;
      case 'morale':await cue('MORALE BOOST','morale',rowEl(stage.event.playerId,stage.event.row),signal,'abilityFast');await pulse(rowEl(stage.event.playerId,stage.event.row),'morale-row','abilityFast',signal);break;
      case 'hero':await cue('HERO','hero',boardCard(stage.event.iid)||rowEl(stage.event.playerId,stage.event.row),signal,'routineFast');break;
      case 'score':await scoreSequence(stage.events,signal);break;
      case 'pass':await cue(stage.event.reason==='manual'?'PASS':'HAND EXHAUSTED · PASS','pass',stage.event.playerId==='p1'?$('#pass-button'):$('#matchline'),signal,'abilityFast');break;
      case 'life':await pulse(stage.event.playerId==='p1'?$('#player-total'):$('#opp-total'),'life','abilityFast',signal);break;
      case 'board-clear':await cue('CLEARING FIELD','round',$('#board'),signal,'abilityFast');break;
      case 'round-start':await cue(`ROUND ${stage.event.round}`,'round-start',$('#matchline'),signal,'abilityNormal');break;
      case 'round-end':await presentRound(stage,signal,visuals);break;
      case 'match-result':await cue(stage.event.winner==='p1'?'VICTORY':stage.event.winner==='p2'?'DEFEAT':'DRAW','match',$('#board'),signal,'majorNormal');break;
      case 'faction-revive':{const target=visuals?.after?.cards?.[stage.event.iid];await cue('SKELLIGE · RETURN','medic',target?boardCard(stage.event.iid):$('#board'),signal,'abilityFast');if(target)await travelVisual(null,target,'faction-revive',signal,{anchor:visuals?.before?.anchors?.grave||visuals?.before?.anchors?.counts,durationName:'abilityNormal'});break;}
      case 'turn':await pulse($('#matchline'),'turn','routineFast',signal);break;
    }
    delete root.document.body.dataset.gcStage;runtime.stage=null;
  }
  async function present(tx,signal,visuals){
    const stages=plan(tx);runtime.lastPlan=clone(stages);runtime.lastTransaction=clone(tx);if(!stages.length)return;root.document.body.classList.add('gc-presenting');queue()?.registerCleanup?.(()=>{root.document.body.classList.remove('gc-presenting');delete root.document.body.dataset.gcStage;runtime.stage=null;});for(const stage of stages){abortCheck(signal);await presentStage(stage,tx,signal,visuals);}runtime.presented++;
  }

  function inferAction(before,after){
    const added=(after?.eventLog||[]).slice(before?.eventLog?.length||0);const unit=added.find(e=>e.type==='UNIT_PLAYED');if(unit)return {type:'PLAY_CARD',playerId:unit.data?.playerId||after.currentPlayerId,iid:unit.data?.iid||null,row:unit.data?.row||null};const pass=added.find(e=>e.type==='PLAYER_PASSED'||e.type==='AUTO_PASS');if(pass)return {type:'PASS',playerId:pass.data?.playerId||null};const leader=added.find(e=>e.type==='LEADER_USED');if(leader)return {type:'ACTIVATE_LEADER',playerId:leader.data?.playerId||null};const revive=added.find(e=>e.type==='UNIT_REVIVED');if(revive)return {type:'RESOLVE_CHOICE',playerId:revive.data?.playerId||null,targetIid:revive.data?.iid||null};return {type:'STATE_ACTION',playerId:before?.currentPlayerId||null};
  }
  function observeExternal(){
    const app=root.__GWENT_PASS10__,Events=root.GwentPresentationEvents,Queue=root.GwentPresentationQueue;if(!app||!Events||!Queue||!root.MutationObserver)return;
    const sync=()=>{runtime.scheduled=false;const after=app.getState?.(),visualNow=captureVisual();if(!after){runtime.lastObservedState=null;runtime.stableVisual=visualNow;return;}const before=runtime.lastObservedState;if(!before){runtime.lastObservedState=after;runtime.stableVisual=visualNow;return;}const beforeN=before.eventLog?.length||0,afterN=after.eventLog?.length||0;runtime.lastObservedState=after;if(afterN<=beforeN){if(!Queue.busy)runtime.stableVisual=visualNow;return;}if(Queue.busy)return;const tx=Events.build(app.engine,before,after,inferAction(before,after),{inputMethod:'external'});runtime.externalTransactions++;Queue.run(tx,async()=>{}).catch?.(()=>{});};
    runtime.lastObservedState=app.getState?.()||null;runtime.stableVisual=captureVisual();runtime.observer=new root.MutationObserver(()=>{if(runtime.scheduled)return;runtime.scheduled=true;root.queueMicrotask?root.queueMicrotask(sync):Promise.resolve().then(sync);});const target=$('#match-screen');if(target)runtime.observer.observe(target,{subtree:true,childList:true,characterData:true,attributes:true});
  }
  function install(){
    if(runtime.installed||!root.document)return false;const Queue=root.GwentPresentationQueue;if(!Queue?.run)return false;const baseRun=Queue.run.bind(Queue);
    Queue.run=async function(meta,executor){
      if(meta?.kind!=='game_action')return baseRun(meta,executor);
      const beforeVisual=runtime.stableVisual||captureVisual();
      try{return await baseRun(meta,async(signal,token)=>{const result=await executor(signal,token);const afterVisual=captureVisual();await present(meta,signal,{before:beforeVisual,after:afterVisual});return result;});}
      finally{runtime.stableVisual=captureVisual();}
    };
    runtime.installed=true;observeExternal();return true;
  }
  function snapshot(){return clone({installed:runtime.installed,stage:runtime.stage,lastPlan:runtime.lastPlan,lastTransaction:runtime.lastTransaction,presented:runtime.presented,cancelled:runtime.cancelled,errors:runtime.errors,externalTransactions:runtime.externalTransactions,visual:{cards:Object.keys(runtime.stableVisual?.cards||{}).length,hand:Object.keys(runtime.stableVisual?.hand||{}).length}});}
  return {version:VERSION,plan,present,install,captureVisual,snapshot,runtime};
});
(function(root,factory){
  const api=factory(root,typeof module==='object'&&module.exports?require('./tabletop-physics.js'):root.GwentTabletopPhysics);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GwentTabletopScene=api;
})(typeof window!=='undefined'?window:globalThis,function(root,Physics){
  'use strict';
  const VERSION='tabletop.motion.1',poses=new Map();
  let reconciliations=0,grab=null,raf=0,lastFrame=0,settleUntil=0,frameCount=0,contacts=0,impacts=0,zOrder=20;
  const finite=v=>typeof v==='number'&&Number.isFinite(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const enabled=()=>!!root.GwentTabletopRenderer?.enabled;
  const all=selector=>[...(root.document?.querySelectorAll(selector)||[])];
  const identity=card=>card.dataset.inspectBoard||card.dataset.cardIid||null;
  function constrainPose(pose,bounds){
    if(!finite(pose?.x)||!finite(pose?.y))return null;
    return {x:clamp(pose.x,0,Math.max(0,(Number(bounds.width)||0)-(Number(bounds.cardWidth)||0))),y:clamp(pose.y,0,Math.max(0,(Number(bounds.height)||0)-(Number(bounds.cardHeight)||0)))};
  }
  function write(card,pose){
    const set=(key,value)=>{if(card.style[key]!==value)card.style[key]=value;};
    set('left',`${pose.x.toFixed(2)}px`);set('top',`${pose.y.toFixed(2)}px`);
    if(pose.zoneKey!=='p1:hand'){
      set('width',`${pose.width.toFixed(2)}px`);set('height',`${pose.height.toFixed(2)}px`);set('zIndex',String(pose.z||20));
      for(const [key,value] of [['--tabletop-angle',(pose.angle||0).toFixed(2)+'deg'],['--tabletop-lift',(pose.lift||0).toFixed(2)+'px'],['--tabletop-z',String(pose.z||20)]])if(card.style.getPropertyValue(key)!==value)card.style.setProperty(key,value);
    }
    if(card.dataset.tabletopBody!=='true')card.dataset.tabletopBody='true';
  }
  function remember(p){p.u=p.railWidth>p.width?p.x/(p.railWidth-p.width):.5;p.v=p.railHeight>p.height?p.y/(p.railHeight-p.height):.5;}
  function boardPoses(){return [...poses.values()].filter(p=>p.zoneKey!=='p1:hand'&&p.element.isConnected);}
  function reduced(){return !!root.GwentMotionTokens?.reduced?.()||!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;}
  function applyFrame(time){
    raf=0;
    if(!enabled()||!root.document?.querySelector('#match-screen.active')||root.document.hidden){pause('inactive');return;}
    const dt=lastFrame?Math.min(.032,(time-lastFrame)/1000):1/60;lastFrame=time;
    const bodies=boardPoses(),result=Physics.step(bodies,dt,grab?.iid);contacts+=result.contacts;frameCount++;
    if(reduced())bodies.forEach(p=>p.lift=0);
    bodies.forEach(p=>{if(p.userPlaced)remember(p);write(p.element,p);});
    if(grab||(!reduced()&&result.energy>.3&&time<settleUntil))raf=root.requestAnimationFrame(applyFrame);
    else{bodies.forEach(p=>{p.vx=0;p.vy=0;p.lift=0;write(p.element,p);});lastFrame=0;}
  }
  function wake(){if(!raf){lastFrame=0;raf=root.requestAnimationFrame?.(applyFrame)||0;}}
  function pause(reason='pause'){
    cancelGrab(reason);if(raf)root.cancelAnimationFrame?.(raf);raf=0;lastFrame=0;
    boardPoses().forEach(p=>{p.vx=0;p.vy=0;p.lift=0;write(p.element,p);});
  }
  function layoutTerritories(){
    const board=root.document.querySelector('#match-screen #board');if(!board)return;
    const lanes=all('#match-screen .lane'),counts={};lanes.forEach(l=>counts[`${l.dataset.pid}:${l.dataset.row}`]=l.querySelectorAll('.unit[data-inspect-board]').length);
    for(const r of Physics.territories(board.clientWidth,board.clientHeight,counts)){
      const lane=lanes.find(l=>l.dataset.pid===r.pid&&l.dataset.row===r.row);if(!lane)continue;
      for(const [key,val] of Object.entries({left:r.x,top:r.y,width:r.width,height:r.height})){const text=val.toFixed(2)+'px';if(lane.style[key]!==text)lane.style[key]=text;}
    }
    const weather=board.querySelector('.weather');if(weather)weather.style.top=`${(board.clientHeight-18)/2}px`;
  }
  function reconcile(seed){
    if(!enabled()||!root.document?.querySelector('#match-screen.active'))return false;
    if(typeof seed?.layoutHandRail!=='function')return false;
    root.document.documentElement.dataset.tabletopMode='physical';layoutTerritories();const seen=new Set();
    for(const rail of all('#match-screen .units')){
      const lane=rail.closest('.lane'),zoneKey=`${lane.dataset.pid}:${lane.dataset.row}`;
      const cards=[...rail.children].filter(el=>el.matches('.unit[data-inspect-board]')),pack=Physics.pack(cards.length,rail.clientWidth,rail.clientHeight);
      if(cards.length&&pack.positions.length!==cards.length){cards.forEach(card=>seen.add(identity(card)));continue;}
      rail.dataset.packWidth=String(rail.clientWidth);rail.dataset.cardWidth=pack.width.toFixed(2);
      cards.forEach((card,i)=>{
        const iid=identity(card);seen.add(iid);const old=poses.get(iid),same=old?.zoneKey===zoneKey;
        const resized=same&&(Math.abs(old.railWidth-rail.clientWidth)>.5||Math.abs(old.railHeight-rail.clientHeight)>.5||Math.abs(old.width-pack.width)>.5||Math.abs(old.height-pack.height)>.5);
        const position=same?(resized?{x:old.u*Math.max(0,rail.clientWidth-pack.width),y:old.v*Math.max(0,rail.clientHeight-pack.height)}:{x:old.x,y:old.y}):pack.positions[i];
        const bounded=constrainPose(position,{width:rail.clientWidth,height:rail.clientHeight,cardWidth:pack.width,cardHeight:pack.height});
        const pose={iid,zoneKey,...bounded,width:pack.width,height:pack.height,railWidth:rail.clientWidth,railHeight:rail.clientHeight,angle:same?old.angle:pack.positions[i].angle,z:same?old.z:++zOrder,
          userPlaced:same?old.userPlaced:false,vx:same&&!resized?old.vx||0:0,vy:same&&!resized?old.vy||0:0,lift:same?old.lift||0:0,
          minX:Math.min(pack.width*.44,Math.max(8,pack.step*.85)),minY:Math.min(pack.height*.38,Math.max(12,pack.rowStep*.85||pack.height*.38)),element:card,rail};
        remember(pose);poses.set(iid,pose);write(card,pose);
      });
    }
    const hand=root.document.querySelector('#match-screen #hand');
    if(hand){seed.layoutHandRail(hand);for(const card of [...hand.children].filter(el=>el.matches('.hand-card[data-card-iid]'))){
      const iid=identity(card);seen.add(iid);const p={iid,zoneKey:'p1:hand',x:parseFloat(card.style.left)||0,y:parseFloat(card.style.top)||0,width:parseFloat(card.style.width)||0,height:parseFloat(card.style.height)||0,railWidth:hand.clientWidth,railHeight:hand.clientHeight,userPlaced:false,element:card,rail:hand};remember(p);poses.set(iid,p);write(card,p);
    }}
    for(const iid of poses.keys())if(!seen.has(iid)){if(grab?.iid===iid)cancelGrab('retired');poses.delete(iid);}
    reconciliations++;positionFocus();return true;
  }
  function serializable(p){if(!p)return null;const {element,rail,...data}=p;return {...data};}
  function setPose(iid,position){
    const p=poses.get(iid);if(!enabled()||!p?.element.isConnected||p.zoneKey==='p1:hand')return false;
    const next=constrainPose(position,{width:p.railWidth,height:p.railHeight,cardWidth:p.width,cardHeight:p.height});if(!next)return false;
    Object.assign(p,next,{userPlaced:true,vx:0,vy:0});remember(p);write(p.element,p);return true;
  }
  function beginGrab(iid){
    const p=poses.get(iid);if(!enabled()||grab||!p?.element.isConnected||p.zoneKey==='p1:hand')return false;
    pause('pickup');grab={iid,original:new Map(boardPoses().filter(b=>b.zoneKey===p.zoneKey).map(b=>[b.iid,serializable(b)]))};
    p.z=++zOrder;p.lift=reduced()?0:5;p.element.dataset.tabletopHeld='true';wake();return true;
  }
  function moveGrab(point){
    if(!grab||!finite(point?.x)||!finite(point?.y))return false;const p=poses.get(grab.iid);if(!p)return false;
    setPose(p.iid,point);p.lift=reduced()?0:5;wake();return true;
  }
  function endGrab(velocity={vx:0,vy:0}){
    if(!grab)return false;const p=poses.get(grab.iid);if(p)delete p.element.dataset.tabletopHeld;
    if(p){p.userPlaced=true;p.vx=reduced()?0:clamp(Number(velocity.vx)||0,-500,500)*.22;p.vy=reduced()?0:clamp(Number(velocity.vy)||0,-500,500)*.22;remember(p);}
    grab=null;settleUntil=(root.performance?.now?.()||0)+1000;wake();return true;
  }
  function cancelGrab(){
    if(!grab)return false;for(const [iid,original] of grab.original){const p=poses.get(iid);if(p?.element.isConnected){Object.assign(p,original);delete p.element.dataset.tabletopHeld;write(p.element,p);}}
    grab=null;if(raf)root.cancelAnimationFrame?.(raf);raf=0;lastFrame=0;return true;
  }
  function exposedAt(point,eligible=null){
    for(const p of boardPoses().sort((a,b)=>(b.z||0)-(a.z||0))){const r=p.rail.getBoundingClientRect();if(Physics.pointInside({x:point.x-r.left,y:point.y-r.top},{...p,y:p.y-(p.lift||0)}))return !eligible||eligible.has(p.iid)?p.iid:null;}
    return null;
  }
  function impact(iid){
    const p=poses.get(iid);if(!enabled()||!p||reduced())return;
    impacts++;for(const n of boardPoses().filter(n=>n.zoneKey===p.zoneKey&&n.iid!==iid)){const dx=(n.x+n.width/2)-(p.x+p.width/2),dy=(n.y+n.height/2)-(p.y+p.height/2),d=Math.hypot(dx,dy);if(d<140){n.vx+=(dx/(d||1))*18*(1-d/140);n.vy+=(dy/(d||1))*10*(1-d/140);n.lift=Math.max(n.lift,2*(1-d/140));}}
    settleUntil=(root.performance?.now?.()||0)+700;wake();
  }
  function positionFocus(panel=root.document?.querySelector('.tabletop-focus'),iid=panel?.dataset.focusIid){
    const p=poses.get(iid);if(!panel||!p)return;
    const card=p.element.getBoundingClientRect(),screen=root.document.querySelector('#match-screen').getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight;
    const x=clamp(card.left+card.width/2-w/2-screen.left,8,Math.max(8,screen.width-w-8)),above=card.top-h-8-screen.top,below=card.bottom+8-screen.top;
    const y=clamp(above>=8?above:below,8,Math.max(8,screen.height-h-8));panel.style.left=`${x}px`;panel.style.top=`${y}px`;
  }
  function reset(){pause('reset');poses.clear();contacts=0;impacts=0;zOrder=20;}
  root.addEventListener?.('gwent:tabletop-reset',reset);
  root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden)pause('hidden');});
  root.addEventListener?.('resize',()=>pause('resize'));
  return Object.freeze({version:VERSION,get enabled(){return enabled();},constrainPose,reconcile,setPose,beginGrab,moveGrab,endGrab,cancelGrab,pause,exposedAt,impact,positionFocus,
    getPose:iid=>serializable(poses.get(iid)),reset,
    metrics:()=>({version:VERSION,enabled:enabled(),reconciliations,frameCount,contacts,impacts,animating:!!raf,heldIid:grab?.iid||null,poses:[...poses.values()].map(serializable)})});
});

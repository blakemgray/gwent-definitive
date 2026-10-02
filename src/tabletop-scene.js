(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.GwentTabletopScene=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const VERSION='tabletop.foundation.1';
  const poses=new Map();
  let reconciliations=0;
  const finite=value=>typeof value==='number'&&Number.isFinite(value);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

  // This foundation uses the baseline compositor as a seed. Manual placement
  // belongs to this scene and survives later seeds. Contact/layout physics can
  // replace the seed without giving another subsystem write access to poses.
  function constrainPose(pose,bounds){
    if(!finite(pose?.x)||!finite(pose?.y))return null;
    const width=Math.max(0,Number(bounds.width)||0);
    const height=Math.max(0,Number(bounds.height)||0);
    const cardWidth=Math.max(0,Number(bounds.cardWidth)||0);
    const cardHeight=Math.max(0,Number(bounds.cardHeight)||0);
    return {x:clamp(pose.x,0,Math.max(0,width-cardWidth)),y:clamp(pose.y,0,Math.max(0,height-cardHeight))};
  }
  function enabled(){return !!root.GwentTabletopRenderer?.enabled;}
  function all(selector){return [...(root.document?.querySelectorAll(selector)||[])];}
  function identity(card){return card.dataset.inspectBoard||card.dataset.cardIid||null;}
  function zoneFor(rail){
    const lane=rail.closest?.('.lane');
    return lane?`${lane.dataset.pid}:${lane.dataset.row}`:'p1:hand';
  }
  function dimensions(card,rail){
    return {width:rail.clientWidth,height:rail.clientHeight,cardWidth:parseFloat(card.style.width)||card.offsetWidth,cardHeight:parseFloat(card.style.height)||card.offsetHeight};
  }
  function write(card,pose){
    card.style.left=`${pose.x.toFixed(2)}px`;
    card.style.top=`${pose.y.toFixed(2)}px`;
    card.dataset.tabletopBody='true';
  }
  function layoutRail(rail,seed,seen){
    seed(rail);
    const zoneKey=zoneFor(rail);
    for(const card of [...rail.children].filter(el=>el.matches('.unit[data-inspect-board],.hand-card[data-card-iid]'))){
      const iid=identity(card);if(!iid)continue;
      seen.add(iid);
      const bounds=dimensions(card,rail);
      if(!bounds.width||!bounds.height)continue;
      const old=poses.get(iid);
      const keepsPose=old?.userPlaced&&old.zoneKey===zoneKey;
      let position={x:parseFloat(card.style.left)||0,y:parseFloat(card.style.top)||0};
      if(keepsPose){
        const resized=Math.abs(bounds.width-old.railWidth)>.5||Math.abs(bounds.height-old.railHeight)>.5;
        position=constrainPose(resized?{
          x:old.u*Math.max(0,bounds.width-bounds.cardWidth),
          y:old.v*Math.max(0,bounds.height-bounds.cardHeight)
        }:old,bounds);
      }
      const rangeX=Math.max(0,bounds.width-bounds.cardWidth),rangeY=Math.max(0,bounds.height-bounds.cardHeight);
      const pose={iid,zoneKey,x:position.x,y:position.y,width:bounds.cardWidth,height:bounds.cardHeight,
        u:rangeX?position.x/rangeX:.5,v:rangeY?position.y/rangeY:.5,
        railWidth:bounds.width,railHeight:bounds.height,userPlaced:!!keepsPose,element:card,rail};
      poses.set(iid,pose);write(card,pose);
    }
  }
  function reconcile(seed){
    if(!enabled()||!root.document?.querySelector('#match-screen.active'))return false;
    if(typeof seed?.layoutBoardRail!=='function'||typeof seed?.layoutHandRail!=='function')return false;
    const seen=new Set();
    all('#match-screen .units').forEach(rail=>layoutRail(rail,seed.layoutBoardRail,seen));
    const hand=root.document.querySelector('#match-screen #hand');
    if(hand)layoutRail(hand,seed.layoutHandRail,seen);
    for(const iid of poses.keys())if(!seen.has(iid))poses.delete(iid);
    reconciliations++;
    root.document.documentElement.dataset.tabletopMode='foundation';
    return true;
  }
  function serializable(pose){
    if(!pose)return null;
    const {element,rail,...value}=pose;return {...value};
  }
  function setPose(iid,position){
    if(!enabled())return false;
    const pose=poses.get(iid);
    if(!pose?.element.isConnected||pose.zoneKey==='p1:hand')return false;
    const bounds=dimensions(pose.element,pose.rail);
    const next=constrainPose(position,bounds);if(!next)return false;
    Object.assign(pose,next,{userPlaced:true,u:bounds.width>bounds.cardWidth?next.x/(bounds.width-bounds.cardWidth):.5,
      v:bounds.height>bounds.cardHeight?next.y/(bounds.height-bounds.cardHeight):.5});
    write(pose.element,pose);
    return true;
  }
  function reset(){poses.clear();}
  root.addEventListener?.('gwent:tabletop-reset',reset);
  return Object.freeze({version:VERSION,get enabled(){return enabled();},constrainPose,reconcile,setPose,
    getPose:iid=>serializable(poses.get(iid)),reset,
    metrics:()=>({version:VERSION,enabled:enabled(),reconciliations,poses:[...poses.values()].map(serializable)})});
});

(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GwentFlipLayout=api;
})(typeof self!=='undefined'?self:this,function(root){
  'use strict';

  let animationErrors=0;
  function keyFor(el){
    if(!el)return null;
    if(el.dataset?.cardIid)return `iid:${el.dataset.cardIid}`;
    if(el.dataset?.inspectBoard)return `iid:${el.dataset.inspectBoard}`;
    return null;
  }
  function box(el){
    const r=el.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};
  }
  function capture(rootNode=root?.document){
    const out={};
    if(!rootNode?.querySelectorAll)return out;
    rootNode.querySelectorAll('#match-screen .hand-card[data-card-iid],#match-screen .unit[data-inspect-board]').forEach(el=>{
      const key=keyFor(el); if(key)out[key]=box(el);
    });
    return out;
  }
  function currentElements(rootNode=root?.document){
    const out={};
    if(!rootNode?.querySelectorAll)return out;
    rootNode.querySelectorAll('#match-screen .hand-card[data-card-iid],#match-screen .unit[data-inspect-board]').forEach(el=>{
      const key=keyFor(el);if(key)out[key]=el;
    });
    return out;
  }
  function trackAnimation(el,frames,options,Queue,animations){
    try{
      const anim=el.animate(frames,options);
      Queue?.registerAnimation?.(anim);
      animations.push(anim.finished.catch(()=>{}));
      return anim;
    }catch(err){
      animationErrors++;
      console.error('FLIP animation skipped; final compositor geometry retained.',err);
      return null;
    }
  }
  function animate(before,opts={}){
    const Motion=root.GwentMotionTokens;
    const Queue=root.GwentPresentationQueue;
    const reduced=Motion?.reduced?.()??false;
    const duration=opts.duration??Motion?.duration?.('routineNormal')??240;
    const easing=opts.easing??Motion?.EASING?.direct??'ease-out';
    const excludes=new Set((opts.exclude||[]).map(x=>x.startsWith('iid:')?x:`iid:${x}`));
    const now=currentElements(opts.root||root.document);
    const animations=[];
    for(const [key,el] of Object.entries(now)){
      if(excludes.has(key)||!before[key])continue;
      const first=before[key],last=box(el);
      const dx=first.x-last.x,dy=first.y-last.y;
      const sx=last.width?first.width/last.width:1,sy=last.height?first.height/last.height:1;
      if(Math.abs(dx)<.35&&Math.abs(dy)<.35&&Math.abs(sx-1)<.01&&Math.abs(sy-1)<.01)continue;
      if(reduced){
        trackAnimation(el,[{opacity:.84},{opacity:1}],{duration:Math.min(duration,90),easing:'ease-out'},Queue,animations);
      }else{
        trackAnimation(el,[
          {transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`},
          {transform:'translate(0px,0px) scale(1,1)'}
        ],{duration,easing,fill:'both'},Queue,animations);
      }
    }
    return Promise.all(animations);
  }

  return Object.freeze({version:'10.4A.0',keyFor,box,capture,animate,get animationErrors(){return animationErrors;}});
});
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GwentInteractionIntent=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';

  const VERSION='11.2B.0';
  const TRAJECTORY_KINDS=new Set(['row','weather','global']);
  const FORGIVING_KINDS=new Set(['row','weather','global','special']);
  const TARGET_KIND='target';
  const MIN_SPEED=420;

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function finite(v){return Number.isFinite(Number(v));}
  function point(p){return p&&finite(p.x)&&finite(p.y)?{x:Number(p.x),y:Number(p.y)}:null;}
  function rect(r){
    if(!r||!finite(r.x)||!finite(r.y)||!finite(r.width)||!finite(r.height))return null;
    const width=Number(r.width),height=Number(r.height);
    if(width<=0||height<=0)return null;
    return {x:Number(r.x),y:Number(r.y),width,height,right:Number(r.x)+width,bottom:Number(r.y)+height};
  }
  function inside(r,p){return p.x>=r.x&&p.x<=r.right&&p.y>=r.y&&p.y<=r.bottom;}
  function outsideDistance(r,p){
    const dx=p.x<r.x?r.x-p.x:p.x>r.right?p.x-r.right:0;
    const dy=p.y<r.y?r.y-p.y:p.y>r.bottom?p.y-r.bottom:0;
    return Math.hypot(dx,dy);
  }
  function centerDistance(r,p){
    const cx=r.x+r.width/2,cy=r.y+r.height/2;
    return Math.hypot((p.x-cx)/Math.max(1,r.width/2),(p.y-cy)/Math.max(1,r.height/2));
  }
  function padFor(kind,r){
    const m=Math.min(r.width,r.height);
    if(kind==='row')return clamp(m*.35,8,22);
    if(kind==='weather'||kind==='global')return clamp(m*.40,7,20);
    if(kind==='special')return clamp(m*.18,3,7);
    if(kind===TARGET_KIND)return clamp(m*.06,1,2);
    return 0;
  }
  function expanded(r,pad){return {x:r.x-pad,y:r.y-pad,width:r.width+pad*2,height:r.height+pad*2,right:r.right+pad,bottom:r.bottom+pad};}
  function segmentIntersectsRect(a,b,r){
    if(!a||!b||!r)return false;
    let t0=0,t1=1;
    const dx=b.x-a.x,dy=b.y-a.y;
    const checks=[[-dx,a.x-r.x],[dx,r.right-a.x],[-dy,a.y-r.y],[dy,r.bottom-a.y]];
    for(const [p,q] of checks){
      if(Math.abs(p)<1e-9){if(q<0)return false;continue;}
      const t=q/p;
      if(p<0){if(t>t1)return false;if(t>t0)t0=t;}
      else{if(t<t0)return false;if(t<t1)t1=t;}
    }
    return true;
  }
  function scoreOne(candidate,p){
    const r=rect(candidate?.rect);if(!r)return null;
    const kind=String(candidate?.kind||'');
    const exact=inside(r,p);
    const pad=padFor(kind,r);
    const dist=outsideDistance(r,p);
    const cdist=centerDistance(r,p);
    if(exact){
      const score=clamp(1-cdist*.22,.72,1);
      return {candidate,kind,rect:r,pad,exact:true,zone:'inside',distance:0,centerDistance:cdist,score};
    }
    if(pad>0&&dist<=pad){
      const score=clamp(.72-.22*(dist/Math.max(1,pad)),.50,.72);
      return {candidate,kind,rect:r,pad,exact:false,zone:'forgiveness',distance:dist,centerDistance:cdist,score};
    }
    return {candidate,kind,rect:r,pad,exact:false,zone:'outside',distance:dist,centerDistance:cdist,score:0};
  }
  function trajectoryAssist(entry,p,previousPoint,velocity){
    if(!entry||!TRAJECTORY_KINDS.has(entry.kind))return null;
    const prev=point(previousPoint);if(!prev)return null;
    const vx=Number(velocity?.vx),vy=Number(velocity?.vy);
    if(!Number.isFinite(vx)||!Number.isFinite(vy))return null;
    const speed=Math.hypot(vx,vy);if(speed<MIN_SPEED)return null;
    const minDim=Math.min(entry.rect.width,entry.rect.height);
    const overshootLimit=clamp(minDim*.90,18,42);
    const dist=outsideDistance(entry.rect,p);
    if(dist<=entry.pad||dist>overshootLimit)return null;
    const corridor=expanded(entry.rect,Math.min(4,Math.max(1,entry.pad*.25)));
    if(!segmentIntersectsRect(prev,p,corridor))return null;
    const confidence=clamp(.66-.16*(dist/overshootLimit),.50,.66);
    return {confidence,speed,distance:dist,overshootLimit};
  }
  function empty(reason,extra={}){
    return {candidate:null,confidence:0,margin:0,classification:'reject',reason,trajectoryConsidered:false,scores:[],...extra};
  }

  function resolve(input={}){
    const p=point(input.point);if(!p)return empty('no_candidate');
    const candidates=Array.isArray(input.candidates)?input.candidates:[];
    const scored=candidates.map(c=>scoreOne(c,p)).filter(Boolean);
    if(!scored.length)return empty('no_candidate');
    scored.sort((a,b)=>b.score-a.score||a.centerDistance-b.centerDistance||a.rect.width*a.rect.height-b.rect.width*b.rect.height);
    const compactScores=scored.map(s=>({key:s.candidate?.key??null,kind:s.kind,score:s.score,zone:s.zone,distance:s.distance,centerDistance:s.centerDistance}));
    const live=scored.filter(s=>s.score>0);

    if(candidates.length===1){
      const top=scored[0];
      if(top.exact){
        return {candidate:top.candidate,confidence:top.score,margin:1,classification:'inside',reason:'direct_hit',trajectoryConsidered:false,scores:compactScores};
      }
      if(top.zone==='forgiveness'&&FORGIVING_KINDS.has(top.kind)&&top.kind!==TARGET_KIND){
        return {candidate:top.candidate,confidence:top.score,margin:1,classification:'forgiveness',reason:'forgiven_singular',trajectoryConsidered:false,scores:compactScores};
      }
      const assisted=trajectoryAssist(top,p,input.previousPoint,input.velocity);
      if(assisted){
        return {candidate:top.candidate,confidence:assisted.confidence,margin:1,classification:'trajectory',reason:'trajectory_singular',trajectoryConsidered:true,scores:compactScores};
      }
      const nearTarget=top.kind===TARGET_KIND&&top.zone==='forgiveness';
      return empty(nearTarget?'low_confidence':'outside',{trajectoryConsidered:TRAJECTORY_KINDS.has(top.kind),scores:compactScores});
    }

    if(!live.length)return empty('outside',{scores:compactScores});
    const top=live[0],second=live[1]||null;
    const margin=second?top.score-second.score:top.score;
    const targetSpecific=top.kind===TARGET_KIND;
    const requiredMargin=targetSpecific?.14:.10;
    const minimum=targetSpecific?.74:.54;

    if(targetSpecific&&!top.exact){
      return empty('low_confidence',{confidence:top.score,margin,classification:top.zone,trajectoryConsidered:false,scores:compactScores});
    }
    if(second&&margin<requiredMargin){
      return empty('ambiguous',{confidence:top.score,margin,classification:top.zone,trajectoryConsidered:false,scores:compactScores});
    }
    if(top.score<minimum){
      return empty('low_confidence',{confidence:top.score,margin,classification:top.zone,trajectoryConsidered:false,scores:compactScores});
    }
    return {
      candidate:top.candidate,
      confidence:top.score,
      margin,
      classification:top.exact?'inside':'forgiveness',
      reason:top.exact?'direct_hit':'forgiven_dominant',
      trajectoryConsidered:false,
      scores:compactScores
    };
  }

  return Object.freeze({VERSION,version:VERSION,resolve,padFor,segmentIntersectsRect,constants:Object.freeze({MIN_SPEED})});
});

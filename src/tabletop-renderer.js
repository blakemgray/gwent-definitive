(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports={create:factory};
  else root.GwentTabletopRenderer=factory(root);
})(typeof window!=='undefined'?window:null,function(root){
  'use strict';

  const enabled=!!root&&new URLSearchParams(root.location?.search||'').get('tabletop')==='1';
  const bodies=new Map();
  const stats={generation:0,reconciliations:0,created:0,reused:0,moved:0,retired:0,errors:0,lastReset:null};
  let nextToken=0;

  function iidOf(node){
    if(node?.nodeType!==1||node.tagName!=='BUTTON')return null;
    return node.getAttribute('data-card-iid')||node.getAttribute('data-inspect-board')||null;
  }
  function keyOf(node){
    if(node.nodeType!==1)return null;
    const iid=iidOf(node);if(iid)return `card:${iid}`;
    if(node.id)return `id:${node.id}`;
    if(node.matches('.lane[data-pid][data-row]'))return `lane:${node.dataset.pid}:${node.dataset.row}`;
    if(node.matches('.geometry-lane[data-geometry-pid][data-geometry-row]'))return `geometry:${node.dataset.geometryPid}:${node.dataset.geometryRow}`;
    const stableClass=[...node.classList].find(name=>!isTransientClass(name));
    return `${node.tagName}:${stableClass||''}`;
  }
  function isTransientClass(name){return /^(dm-|te-|gc-)/.test(name);}
  function isRuntimeAttribute(name){
    return name==='style'||/^data-(tabletop-|continuity-|presentation-)/.test(name);
  }
  function zoneOf(node,context){
    const lane=node.closest('.lane[data-pid][data-row]');
    return lane?`board:${lane.dataset.pid}:${lane.dataset.row}`:context;
  }

  // The authoritative markup owns content and semantic attributes. Presentation
  // owns inline pose and live actor marks, so unrelated commits cannot repack a
  // card or reveal an actor which an active transaction has leased.
  function syncAttributes(node,desired){
    for(const attr of [...node.attributes]){
      if(attr.name==='class'||isRuntimeAttribute(attr.name))continue;
      if(!desired.hasAttribute(attr.name))node.removeAttribute(attr.name);
    }
    for(const attr of [...desired.attributes]){
      if(attr.name==='class'||attr.name==='style')continue;
      if(node.getAttribute(attr.name)!==attr.value)node.setAttribute(attr.name,attr.value);
    }
    const classes=[...desired.classList,...[...node.classList].filter(isTransientClass)];
    const className=[...new Set(classes)].join(' ');
    if(node.className!==className)node.className=className;
  }

  function syncChildren(parent,desiredParent,context){
    const unused=new Set([...parent.childNodes]);
    let cursor=parent.firstChild;
    for(const desired of [...desiredParent.childNodes]){
      let node=null;
      const iid=iidOf(desired),key=keyOf(desired);
      if(iid){
        const zone=zoneOf(desired,context);
        let body=bodies.get(iid);
        if(body){
          node=body.node;stats.reused++;
          if(body.zone!==zone){stats.moved++;body.zone=zone;}
        }else{
          node=desired.cloneNode(false);
          body={node,zone,token:++nextToken};
          bodies.set(iid,body);stats.created++;
          node.dataset.tabletopToken=String(body.token);
        }
      }else{
        node=[...unused].find(candidate=>candidate.nodeType===desired.nodeType&&
          (key?keyOf(candidate)===key:!keyOf(candidate)))||null;
        if(!node)node=desired.cloneNode(false);
      }
      unused.delete(node);
      if(desired.nodeType===1){
        syncAttributes(node,desired);
        syncChildren(node,desired,context);
      }else if(node.nodeValue!==desired.nodeValue)node.nodeValue=desired.nodeValue;
      if(node!==cursor)parent.insertBefore(node,cursor);
      cursor=node.nextSibling;
    }
    for(const node of unused)if(node.parentNode===parent)node.remove();
  }

  function reset(reason='reset'){
    stats.retired+=bodies.size;bodies.clear();
    stats.generation++;stats.lastReset=String(reason);
    // Match identity boundaries also clear observation history in baseline mode.
    if(root?.dispatchEvent&&root.CustomEvent){
      root.dispatchEvent(new root.CustomEvent('gwent:tabletop-reset',{detail:{reason:stats.lastReset,generation:stats.generation}}));
    }
  }
  function reconcile({boardHTML,geometryHTML,handHTML}={}){
    if(!enabled)return false;
    const doc=root.document;
    const targets=[['#board',boardHTML,'board'],['#board-geometry',geometryHTML,'geometry'],['#hand',handHTML,'hand:p1']];
    const live=new Set();
    try{
      const prepared=targets.map(([selector,html,context])=>{
        const node=doc.querySelector(selector);
        if(!node||typeof html!=='string')throw new Error(`Missing tabletop render input: ${selector}`);
        const template=doc.createElement('template');template.innerHTML=html;
        for(const card of template.content.querySelectorAll('button[data-card-iid],button[data-inspect-board]')){
          const iid=iidOf(card);
          if(!iid||live.has(iid))throw new Error('Duplicate or empty tabletop card identity');
          live.add(iid);
        }
        return {node,desired:template.content,context};
      });
      // Parse and validate every region before moving any surviving body.
      for(const {node,desired,context} of prepared)syncChildren(node,desired,context);
      for(const [iid,body] of bodies)if(!live.has(iid)){
        body.node.remove();bodies.delete(iid);stats.retired++;
      }
      stats.reconciliations++;
      return true;
    }catch(error){
      stats.errors++;reset('reconcile-error');
      root.console?.error?.('Tabletop reconciliation failed; rebuilding authoritative markup.',error);
      return false;
    }
  }
  function snapshot(){
    return {enabled,...stats,liveCount:bodies.size,live:[...bodies].map(([iid,body])=>({iid,zone:body.zone,token:body.token}))};
  }
  return Object.freeze({version:'tabletop.foundation.1',enabled,reconcile,reset,snapshot});
});

(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GwentPresentationQueue=api;
})(typeof self!=='undefined'?self:this,function(root){
  'use strict';

  class PresentationQueue{
    constructor(){
      this.serial=0;
      this.active=null;
      this.lastCompleted=null;
      this.errorCount=0;
      this.listeners=new Set();
      this._boundCancel=(reason)=>this.cancel(reason);
      if(root?.document){
        root.addEventListener?.('orientationchange',()=>this._boundCancel('orientationchange'),{passive:true});
        root.addEventListener?.('pagehide',()=>this._boundCancel('pagehide'),{passive:true});
        root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)this._boundCancel('visibilitychange');});
      }
    }
    get busy(){return !!this.active;}
    subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
    emit(type,payload){for(const fn of this.listeners){try{fn(type,payload);}catch(err){console.error(err);}}}
    registerAnimation(animation){
      if(!animation||!this.active)return animation;
      this.active.animations.add(animation);
      const token=this.active;
      const done=()=>token.animations.delete(animation);
      try{animation.finished?.then(done,done);}catch(_){/* disposable presentation */}
      return animation;
    }
    registerCleanup(fn){if(this.active&&typeof fn==='function')this.active.cleanups.add(fn);return fn;}
    async run(meta,executor){
      this.cancel('superseded');
      const id=++this.serial;
      const controller=new AbortController();
      const token={id,meta:meta||{},controller,animations:new Set(),cleanups:new Set(),startedAt:performance?.now?.()||Date.now()};
      this.active=token;
      root?.document?.body?.classList.add('presentation-busy');
      this.emit('start',token);
      try{
        const result=await executor(controller.signal,token);
        if(this.active?.id===id){
          this.lastCompleted={id,meta:token.meta,durationMs:(performance?.now?.()||Date.now())-token.startedAt,cancelled:false};
          this.emit('complete',this.lastCompleted);
        }
        return result;
      }catch(err){
        if(err?.name==='AbortError')return undefined;
        this.errorCount++;
        try{controller.abort('presentation_error');}catch(_){controller.abort();}
        for(const anim of token.animations){try{anim.cancel();}catch(_){}}
        const error={name:String(err?.name||'Error'),message:String(err?.message||err||'Presentation failure')};
        this.lastCompleted={id,meta:token.meta,durationMs:(performance?.now?.()||Date.now())-token.startedAt,cancelled:true,reason:'presentation_error',error};
        this.emit('error',this.lastCompleted);
        console.error('Presentation transaction failed; authoritative game state retained.',err);
        return undefined;
      }finally{
        if(this.active?.id===id){
          for(const fn of token.cleanups){try{fn();}catch(_){}}
          this.active=null;
          root?.document?.body?.classList.remove('presentation-busy');
        }
      }
    }
    cancel(reason='cancelled'){
      const token=this.active;
      if(!token)return false;
      try{token.controller.abort(reason);}catch(_){token.controller.abort();}
      for(const anim of token.animations){try{anim.cancel();}catch(_){}}
      for(const fn of token.cleanups){try{fn();}catch(_){}}
      this.lastCompleted={id:token.id,meta:token.meta,durationMs:(performance?.now?.()||Date.now())-token.startedAt,cancelled:true,reason};
      this.emit('cancel',this.lastCompleted);
      this.active=null;
      root?.document?.body?.classList.remove('presentation-busy');
      return true;
    }
  }

  const singleton=new PresentationQueue();
  return Object.assign(singleton,{PresentationQueue,version:'10.4A.0'});
});
(function(root){
  'use strict';
  const CARD_BASE='https://raw.githubusercontent.com/asundr/gwent-classic/main/img/lg/';
  const FALLBACK='./icon.svg';
  function canonicalId(cardId, engine){
    try { return engine && engine.CARD_DB && engine.CARD_DB[cardId] && engine.CARD_DB[cardId].id || cardId; }
    catch { return cardId; }
  }
  function cardArt(cardId, engine){
    const id=canonicalId(cardId, engine);
    return id ? `${CARD_BASE}${encodeURIComponent(id)}.jpg` : FALLBACK;
  }
  function attachFallback(img){
    if(!img) return;
    img.addEventListener('error',()=>{ if(img.src.endsWith('icon.svg')) return; img.src=FALLBACK; },{once:true});
  }
  root.GwentAssetResolver={CARD_BASE,FALLBACK,canonicalId,cardArt,attachFallback};
})(typeof self!=='undefined'?self:this);

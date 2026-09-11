(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GwentMotionTokens=api;
})(typeof self!=='undefined'?self:this,function(root){
  'use strict';

  // Pass 10.4C tuning: routine interactions regain control sooner while
  // signature mechanics retain enough dwell to read cause → effect.
  const TOKENS=Object.freeze({
    microFast:70,
    microNormal:105,
    routineFast:150,
    routineNormal:205,
    routineSlow:275,
    abilityFast:300,
    abilityNormal:400,
    abilitySlow:520,
    majorNormal:700,
    majorSlow:920,
    invalidReturn:170,
    selectionLift:95,
    destinationPulse:130
  });

  // Reduced motion keeps mechanic identity but makes travel, score counting,
  // reflow, and settle interpolation effectively immediate.
  const REDUCED_TOKENS=Object.freeze({
    microFast:8,
    microNormal:55,
    routineFast:8,
    routineNormal:40,
    routineSlow:50,
    abilityFast:60,
    abilityNormal:70,
    abilitySlow:80,
    majorNormal:90,
    majorSlow:100,
    invalidReturn:40,
    selectionLift:55,
    destinationPulse:45
  });

  const EASING=Object.freeze({
    direct:'cubic-bezier(.18,.78,.22,1)',
    settle:'cubic-bezier(.18,.92,.24,1.04)',
    return:'cubic-bezier(.20,.90,.25,1.03)',
    impact:'cubic-bezier(.12,.86,.22,1)',
    fade:'cubic-bezier(.16,.72,.24,1)',
    press:'cubic-bezier(.20,.75,.25,1)',
    magnetic:'cubic-bezier(.16,.88,.24,1.02)'
  });

  const FEEL=Object.freeze({
    selectedLiftPx:10,
    selectedScale:1.07,
    pressScale:.992,
    activeTargetScale:1.025,
    dragTiltMaxDegrees:4,
    targetSafeMarginPx:8
  });

  let reducedOverride=null;
  function systemReduced(){
    try{return !!root?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}catch(_){return false;}
  }
  function reduced(){return reducedOverride===null?systemReduced():!!reducedOverride;}
  function duration(name){
    const base=TOKENS[name]??TOKENS.routineNormal;
    if(!reduced()) return base;
    if(Object.prototype.hasOwnProperty.call(REDUCED_TOKENS,name)) return REDUCED_TOKENS[name];
    return Math.min(70,Math.max(8,Math.round(base*.16)));
  }
  function setReducedOverride(value){reducedOverride=value===null?null:!!value;}
  function media(){return {reduced:reduced(),systemReduced:systemReduced(),override:reducedOverride};}

  return Object.freeze({version:'10.4C.0',TOKENS,REDUCED_TOKENS,EASING,FEEL,duration,reduced,setReducedOverride,media});
});
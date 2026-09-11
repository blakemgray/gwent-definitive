(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GwentMotionTokens=api;
})(typeof self!=='undefined'?self:this,function(root){
  'use strict';

  const TOKENS=Object.freeze({
    microFast:80,
    microNormal:120,
    routineFast:180,
    routineNormal:240,
    routineSlow:320,
    abilityFast:360,
    abilityNormal:480,
    abilitySlow:650,
    majorNormal:800,
    majorSlow:1100,
    invalidReturn:210,
    selectionLift:120,
    destinationPulse:160
  });

  // Reduced motion keeps semantic cues readable while collapsing secondary
  // interpolation (score counting, reflow, and settle travel) aggressively.
  // Nominal Pass 10.4A timings remain unchanged for normal-motion users.
  const REDUCED_TOKENS=Object.freeze({
    microFast:20,
    microNormal:70,
    routineFast:25,
    routineNormal:50,
    routineSlow:60,
    abilityFast:70,
    abilityNormal:80,
    abilitySlow:90,
    majorNormal:100,
    majorSlow:110,
    invalidReturn:50,
    selectionLift:70,
    destinationPulse:60
  });

  const EASING=Object.freeze({
    direct:'cubic-bezier(.2,.8,.2,1)',
    settle:'cubic-bezier(.18,.89,.32,1.18)',
    return:'cubic-bezier(.22,.85,.22,1)',
    impact:'cubic-bezier(.16,.84,.24,1)',
    fade:'ease-out'
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
    return Math.min(80,Math.max(20,Math.round(base*.2)));
  }
  function setReducedOverride(value){reducedOverride=value===null?null:!!value;}
  function media(){return {reduced:reduced(),systemReduced:systemReduced(),override:reducedOverride};}

  return Object.freeze({version:'10.4A.0',TOKENS,REDUCED_TOKENS,EASING,duration,reduced,setReducedOverride,media});
});
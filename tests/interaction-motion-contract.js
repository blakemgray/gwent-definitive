'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const spec=JSON.parse(fs.readFileSync(path.join(root,'config/interaction-motion-contract.json'),'utf8'));
assert.equal(spec.contract_version,'1.0');
assert.equal(spec.research_pass,'10.4R');
assert.equal(spec.runtime_baseline,'10.3');
assert.equal(spec.input.default_mode,'hybrid');
assert.equal(spec.input.primary_primitive,'Pointer Events');
assert.equal(spec.input.native_html_drag_drop,false);
assert.equal(spec.input.pointer_capture,true);
assert(spec.motion_tokens_ms.micro_fast < spec.motion_tokens_ms.routine_normal);
assert(spec.motion_tokens_ms.routine_normal < spec.motion_tokens_ms.ability_normal);
assert(spec.motion_tokens_ms.ability_normal < spec.motion_tokens_ms.major_normal);
for(const key of ['ordinary_unit','spy','horn','tight_bond','muster','scorch','weather','medic','decoy','morale','hero','leader','pass','round_resolution','match_result']){
  assert(spec.effects[key],`missing effect choreography: ${key}`);
}
for(const hook of ['SPY_TRIGGER','HORN_TRIGGER','MUSTER_TRIGGER','SCORCH_TRIGGER','PASS','ROUND_WIN','GAME_WIN']){
  assert(spec.audio_hooks.includes(hook),`missing audio hook ${hook}`);
}
assert(spec.reduced_motion && spec.reduced_motion.scorch && spec.reduced_motion.muster,'reduced-motion substitutions incomplete');
assert(Array.isArray(spec.qa_requirements.release_blockers) && spec.qa_requirements.release_blockers.length>=6,'release blockers incomplete');
assert(spec.qa_requirements.release_blockers.some(x=>x.includes('engine outcome depends on animation completion')),'engine/presentation separation not protected');
assert(spec.qa_requirements.release_blockers.some(x=>x.includes('drag and tap produce different rules outcomes')),'input parity not protected');
console.log('interaction-motion-contract: Pass 10.4R research contract valid');

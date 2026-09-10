const fs=require('fs');
const path=require('path');
const assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'config/interaction-motion-contract.json'),'utf8'));
const gesture=fs.readFileSync(path.join(ROOT,'src/gesture-controller.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'direct-manipulation.css'),'utf8');
const sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
const Motion=require('../src/motion-tokens.js');
const Events=require('../src/presentation-events.js');
const Flip=require('../src/flip-layout.js');
const Queue=require('../src/presentation-queue.js');

let n=0;
function ok(condition,msg){assert.ok(condition,msg);n++;}
function eq(a,b,msg){assert.deepStrictEqual(a,b,msg);n++;}

// 10.4R contract remains authoritative.
eq(contract.input.default_mode,'hybrid','hybrid must remain default');
eq(contract.input.primary_primitive,'Pointer Events','Pointer Events required');
eq(contract.input.pointer_capture,true,'pointer capture required');
eq(contract.input.native_html_drag_drop,false,'native drag/drop prohibited');
ok(contract.qa_requirements.release_blockers.includes('drag and tap produce different rules outcomes'),'tap/drag parity must remain release blocker');
ok(contract.qa_requirements.release_blockers.includes('animation leaves DOM inconsistent with engine state'),'reconciliation must remain release blocker');
ok(contract.qa_requirements.release_blockers.includes('reduced-motion path omits gameplay information'),'reduced motion parity must remain release blocker');

// Runtime module boundaries.
ok(/G\.legalActions\(state,'p1'\)/.test(gesture),'gesture layer must source legality from engine');
ok(/api\.playAction\(action\)/.test(gesture),'all UI commits must return through app match controller');
ok(/commitAction\(legal\.__gwentDmAction,'tap'/.test(gesture),'tap must use shared commitAction');
ok(/commitAction\(target\.action,'drag'/.test(gesture),'drag must use shared commitAction');
ok(/setPointerCapture/.test(gesture),'drag must use pointer capture');
ok(/pointercancel/.test(gesture),'pointer cancellation must be handled');
ok(!/dragstart|draggable\s*=/.test(gesture),'native HTML drag/drop must not enter runtime');
ok(/touch-action:none/.test(css),'touch ownership must be scoped to cards');
ok(!/body\s*\{[^}]*touch-action\s*:\s*none/s.test(css),'touch-action none must not be global');
ok(/dm-source-placeholder/.test(css),'source placeholder visual state required');
ok(/dm-legal-target::after/.test(css),'legal destinations require non-color text/shape cue');

// Motion tokens and reduced-motion scaling.
eq(Motion.duration('routineNormal'),240,'routine motion baseline');
Motion.setReducedOverride(true);
ok(Motion.duration('routineNormal')<=110,'reduced routine motion must be concise');
ok(Motion.duration('majorNormal')<=110,'reduced major motion must be concise');
Motion.setReducedOverride(false);
eq(Motion.duration('routineNormal'),240,'full motion restored');
Motion.setReducedOverride(null);

// Presentation modules load and expose their intended boundaries.
eq(Events.version,'10.4A.0','presentation event adapter version');
eq(Flip.version,'10.4A.0','FLIP helper version');
eq(Queue.version,'10.4A.0','queue version');
ok(typeof Queue.cancel==='function'&&typeof Queue.run==='function','queue must support interruption');

// PWA must cache the entire direct-manipulation layer.
for(const file of ['direct-manipulation.css','motion-tokens.js','presentation-queue.js','presentation-events.js','flip-layout.js','gesture-controller.js']){
  ok(sw.includes(file),`service worker must precache ${file}`);
}

console.log(`direct-manipulation-contract: ${n} assertions passed`);

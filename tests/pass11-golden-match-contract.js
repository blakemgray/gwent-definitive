'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const py=fs.readFileSync(path.join(ROOT,'tests/pass11_golden_match_ui.py'),'utf8');
const workflow=fs.readFileSync(path.join(ROOT,'.github/workflows/deploy-pages.yml'),'utf8');
let n=0;const ok=(v,m)=>{assert.ok(v,m);n++;};

for(const token of [
  '#main-screen [data-nav="play-screen"]',
  '#play-screen #quick-start',
  '#finish-mulligan',
  '#pass-button',
  '[data-choice-index]',
  'data-dm-action-key',
  '#continue-match',
  '[data-result]',
  '#result-rematch'
]) ok(py.includes(token),`Golden Match UI gate missing ordinary player surface ${token}`);

ok(!/setStateForQA|sandboxSetTurn|writeMatch\s*\(\s*\{\s*state/.test(py),'Golden Match UI gate must not inject authoritative match state');
ok(/engine_shape_traces/.test(py)&&/p1Victory/.test(py)&&/p2Victory/.test(py)&&/draw/.test(py)&&/contested/.test(py),'Golden Match gate must keep deterministic completion shapes');
ok(/page\.reload/.test(py)&&/liveReloadRestoredExactly/.test(py),'Golden Match gate must prove ordinary mid-match reload/Continue');
ok(/round-end/.test(py)&&/match-result/.test(py)&&/durationMs/.test(py),'Golden Match gate must measure natural round/result pacing');
ok(/golden_match_summary\.json/.test(py),'Golden Match gate must archive machine-readable summary');
ok(workflow.includes('python tests/pass11_golden_match_ui.py'),'CI must run the Golden Match end-to-end gate');
ok(workflow.includes('pass11-golden-match-e2e-qa'),'CI must archive Golden Match end-to-end evidence');

console.log(`pass11-golden-match-contract: ${n} assertions passed`);
'use strict';
const assert=require('assert');
const fs=require('fs'),path=require('path');
const Intent=require('../src/interaction-intent.js');
const ROOT=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'src/interaction-intent.js'),'utf8');
let n=0;const ok=(v,m)=>{assert.ok(v,m);n++;},eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++;};
const c=(key,kind,x,y,width,height)=>({key,kind,rect:{x,y,width,height}});
const resolve=(point,candidates,extra={})=>Intent.resolve({point,candidates,...extra});

// Pure-module / authority boundary.
eq(Intent.version,'11.2B.0','resolver version');
ok(!/document\.|querySelector|legalActions|playAction\(|localStorage/.test(src),'resolver must remain DOM/rules/state free');

const row=c('row','row',100,100,300,40);
let r=resolve({x:250,y:120},[row]);
eq(r.candidate,row,'direct row interior resolves');eq(r.reason,'direct_hit','direct row reason');

r=resolve({x:405,y:120},[row]);
eq(r.candidate,row,'small singular row miss is forgiven');eq(r.reason,'forgiven_singular','singular forgiveness reason');

const target=c('t1','target',100,100,40,60);
r=resolve({x:142.5,y:130},[target]);
eq(r.candidate,null,'equivalent Decoy-style near miss does not auto-target');ok(['outside','low_confidence'].includes(r.reason),'target near miss rejects conservatively');

r=resolve({x:430,y:120},[row],{previousPoint:{x:390,y:120},velocity:{vx:800,vy:0}});
eq(r.candidate,row,'immediate fast singular overshoot resolves');eq(r.reason,'trajectory_singular','trajectory reason');ok(r.trajectoryConsidered,'trajectory marked as considered');

r=resolve({x:470,y:120},[row],{previousPoint:{x:390,y:120},velocity:{vx:1100,vy:0}});
eq(r.candidate,null,'crossing then releasing far away does not commit');eq(r.reason,'outside','far overshoot rejects');

r=resolve({x:430,y:120},[row],{previousPoint:{x:390,y:120},velocity:{vx:200,vy:0}});
eq(r.candidate,null,'slow crossing outside forgiveness does not trajectory-commit');

const rowA=c('a','row',100,100,300,40),rowB=c('b','row',100,150,300,40);
r=resolve({x:250,y:145},[rowA,rowB]);
eq(r.candidate,null,'equal boundary between legal rows rejects');eq(r.reason,'ambiguous','row boundary reports ambiguity');

r=resolve({x:250,y:120},[rowA,rowB]);
eq(r.candidate,rowA,'clear multiple-row interior chooses dominant destination');eq(r.reason,'direct_hit','dominant row direct reason');

const tA=c('ta','target',100,100,40,60),tB=c('tb','target',130,100,40,60);
r=resolve({x:135,y:130},[tA,tB]);
eq(r.candidate,null,'overlapping Decoy targets reject when neither dominates');eq(r.reason,'ambiguous','overlapping card targets report ambiguity');

r=resolve({x:112,y:130},[tA,tB],{previousPoint:{x:80,y:130},velocity:{vx:1200,vy:0}});
eq(r.candidate,tA,'clear direct card target resolves by precision');eq(r.reason,'direct_hit','card target remains direct-hit based');ok(!r.trajectoryConsidered,'card-specific targeting never uses velocity');

const special=c('sp','special',200,200,24,24);
r=resolve({x:226,y:212},[special]);
eq(r.candidate,special,'small singular special-slot miss is forgiven');eq(r.reason,'forgiven_singular','special forgiveness reason');

r=resolve({x:0,y:0},[]);eq(r.candidate,null,'empty candidate set rejects');eq(r.reason,'no_candidate','empty set reason');
r=Intent.resolve({point:{x:10,y:10},candidates:[{key:'bad',kind:'row',rect:{x:0,y:0,width:0,height:20}}]});eq(r.candidate,null,'invalid rectangle cannot resolve');

// Recent intent only: stale earlier crossing is not an input, so reversal follows the final segment.
r=resolve({x:70,y:120},[row],{previousPoint:{x:50,y:120},velocity:{vx:650,vy:0}});
eq(r.candidate,null,'release before target after reversal/history reset does not use stale crossing');

// Randomized invariants: resolver may only choose supplied candidates and never trajectory-select a target.
let seed=0x11_2B_2026>>>0;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
const kinds=['row','weather','global','special','target'];
for(let i=0;i<2500;i++){
  const count=1+Math.floor(rand()*4),candidates=[];
  for(let j=0;j<count;j++){
    const kind=kinds[Math.floor(rand()*kinds.length)];
    candidates.push(c(`f${i}-${j}`,kind,20+rand()*700,20+rand()*300,18+rand()*260,18+rand()*70));
  }
  const p={x:-80+rand()*1000,y:-80+rand()*560};
  const prev={x:p.x-40+rand()*80,y:p.y-40+rand()*80};
  const velocity={vx:-1400+rand()*2800,vy:-1400+rand()*2800};
  const out=resolve(p,candidates,{previousPoint:prev,velocity});
  if(out.candidate){
    ok(candidates.includes(out.candidate),`fuzz ${i}: winner must be supplied candidate`);
    if(out.candidate.kind==='target'){
      eq(out.reason,'direct_hit',`fuzz ${i}: target commit must be direct`);
      ok(!out.trajectoryConsidered,`fuzz ${i}: target commit cannot use trajectory`);
    }
    if(out.reason==='trajectory_singular'){
      eq(candidates.length,1,`fuzz ${i}: trajectory commit must be singular`);
      ok(['row','weather','global'].includes(out.candidate.kind),`fuzz ${i}: trajectory kind must be unambiguous family`);
    }
  }
  ok(Number.isFinite(out.confidence)&&Number.isFinite(out.margin),`fuzz ${i}: finite confidence/margin`);
  const far=resolve({x:5000,y:5000},candidates,{previousPoint:{x:4900,y:4900},velocity:{vx:2000,vy:2000}});
  eq(far.candidate,null,`fuzz ${i}: remote release rejects`);
}

console.log(`pass11-intent-contract: ${n} assertions passed across deterministic matrix + 2500 randomized trials`);

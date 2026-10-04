'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
async function exercise(code,mode,type){
  const hit={type,ok:type!=='opaque'},network={type:'cors',ok:true,clone(){return this;}},writes=[];let fetches=0;
  const cache={match:async()=>hit,put:async(request,response)=>writes.push({request,response})};
  const context=vm.createContext({self:{addEventListener(){}},caches:{open:async()=>cache},fetch:async()=>{fetches++;return network;},URL,request:{mode}});
  vm.runInContext(code,context);
  const response=await vm.runInContext('cacheFirstRuntime(request)',context);
  return {response,fetches,writes,hit,network};
}
(async()=>{
  const corsOpaque=await exercise(source,'cors','opaque');
  assert.equal(corsOpaque.response,corsOpaque.network,'GPU art fetch received an opaque legacy image response');assert.equal(corsOpaque.fetches,1);assert.equal(corsOpaque.writes.length,1);
  const ordinary=await exercise(source,'no-cors','opaque');assert.equal(ordinary.response,ordinary.hit);assert.equal(ordinary.fetches,0,'ordinary fallback image unnecessarily discarded its usable cache');
  for(const mode of ['cors','no-cors']){const valid=await exercise(source,mode,'cors');assert.equal(valid.response,valid.hit,'valid cached art was not reused by both image modes');assert.equal(valid.fetches,0);}
  const old=source.replace("if(hit&&(request.mode!=='cors'||hit.type!=='opaque'))return hit;",'if(hit)return hit;');assert.notEqual(old,source);
  const bad=await exercise(old,'cors','opaque');assert.equal(bad.response.type,'opaque','historical unguarded cache control no longer represents the failing case');
  console.log('table3d-runtime-cache-contract: real worker rejects opaque CORS hit, preserves DOM fallback and reuses valid art across request modes; old handler fails the GPU requirement');
})().catch(error=>{console.error(error);process.exitCode=1;});

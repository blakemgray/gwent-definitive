'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.display,'standalone');
assert(Array.isArray(manifest.icons)&&manifest.icons.some(i=>i.sizes==='192x192')&&manifest.icons.some(i=>i.sizes==='512x512'),'PNG PWA icons missing');
for(const icon of manifest.icons){const p=path.join(root,icon.src.replace(/^\.\//,''));assert(fs.existsSync(p),`missing manifest icon ${icon.src}`);}
assert(fs.existsSync(path.join(root,'icons/apple-touch-icon.png')),'Apple touch icon missing');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const precache=[...sw.matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]).filter(Boolean);
for(const rel of precache){if(rel==='')continue;assert(fs.existsSync(path.join(root,rel)),`service worker precache target missing: ${rel}`);}
assert(sw.includes("const BUILD='11.golden.3'"),'cache build version not pinned to the Pass 11 release-identity shell generation');
assert(sw.includes('cacheFirstCore')&&sw.includes('ignoreSearch:true'),'versioned core shell must be served coherently from one cache');
assert(!sw.includes('skipWaiting'),'new service worker must not force mid-match activation');
assert(sw.includes('raw.githubusercontent.com'),'card-art runtime caching missing');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('<title>Gwent Classic — Definitive Edition · Pass 11</title>'),'Pass 11 release identity missing from document title');
assert(html.includes('PASS 11 · GOLDEN MATCH · CI-GATED'),'Pass 11 release identity missing from developer buildline');
assert(html.includes('apple-touch-icon'),'apple-touch-icon link missing');
assert(html.includes('src/storage.js')&&html.includes('src/asset-resolver.js'),'hardening modules not loaded');
assert(html.includes('battlefield-ux.css')&&html.includes('src/battlefield-ux.js'),'Pass 10.3 battlefield modules not loaded');
for(const rel of ['direct-manipulation.css','src/motion-tokens.js','src/presentation-queue.js','src/interaction-turn-gate.js','src/presentation-events.js','src/flip-layout.js','src/gesture-controller.js']){
  assert(html.includes(rel),`Pass 10.4A runtime not loaded: ${rel}`);
  assert(sw.includes(rel.replace(/^src\//,''))||sw.includes(rel),`Pass 10.4A runtime not precached: ${rel}`);
}
for(const rel of ['gameplay-choreography.css','src/gameplay-choreography.js','src/choreography-external-gate.js']){
  assert(html.includes(rel),`Pass 10.4B runtime not explicitly loaded: ${rel}`);
  assert(sw.includes(rel),`Pass 10.4B runtime not precached: ${rel}`);
}
for(const rel of ['feel-polish.css','src/presentation-feedback.js']){
  assert(html.includes(rel),`Pass 10.4C runtime not explicitly loaded: ${rel}`);
  assert(sw.includes(rel),`Pass 10.4C runtime not precached: ${rel}`);
}
for(const rel of ['physical-card.css','src/battlefield-readability.js']){
  assert(html.includes(rel),`Pass 11.2A readability runtime not explicitly loaded: ${rel}`);
  assert(sw.includes(rel),`Pass 11.2A readability runtime not precached: ${rel}`);
}
for(const rel of ['src/interaction-intent.js']){
  assert(html.includes(rel),`Pass 11.2B intent runtime not explicitly loaded: ${rel}`);
  assert(sw.includes(rel),`Pass 11.2B intent runtime not precached: ${rel}`);
}
for(const rel of ['src/target-exposure.js']){
  assert(html.includes(rel),`Pass 11.2C target exposure runtime not explicitly loaded: ${rel}`);
  assert(sw.includes(rel),`Pass 11.2C target exposure runtime not precached: ${rel}`);
}
for(const rel of ['src/card-continuity.js']){
  assert(html.includes(rel),`Pass 11.2D continuity runtime not explicitly loaded: ${rel}`);
  assert(sw.includes(rel),`Pass 11.2D continuity runtime not precached: ${rel}`);
}
for(const rel of ['src/platform-feedback.js']){
  assert(html.includes(rel),`Pass 11 platform feedback runtime not explicitly loaded: ${rel}`);
  assert(sw.includes(rel),`Pass 11 platform feedback runtime not precached: ${rel}`);
}
const eventsIdx=html.indexOf('src/presentation-events.js'),choreoIdx=html.indexOf('src/gameplay-choreography.js'),intentIdx=html.indexOf('src/interaction-intent.js'),gestureIdx=html.indexOf('src/gesture-controller.js'),continuityIdx=html.indexOf('src/card-continuity.js'),exposureIdx=html.indexOf('src/target-exposure.js'),externalIdx=html.indexOf('src/choreography-external-gate.js'),feedbackIdx=html.indexOf('src/presentation-feedback.js'),platformIdx=html.indexOf('src/platform-feedback.js');
assert(eventsIdx>=0&&choreoIdx>eventsIdx&&intentIdx>choreoIdx&&gestureIdx>intentIdx&&continuityIdx>gestureIdx&&exposureIdx>continuityIdx&&externalIdx>exposureIdx&&feedbackIdx>externalIdx&&platformIdx>feedbackIdx,'10.4B/11.2B/11.2D/11.2C/10.4C/platform runtime load order must be explicit and deterministic');
const battlefieldIdx=html.indexOf('src/battlefield-ux.js'),readabilityIdx=html.indexOf('src/battlefield-readability.js'),motionIdx=html.indexOf('src/motion-tokens.js');
assert(battlefieldIdx>=0&&readabilityIdx>battlefieldIdx&&motionIdx>readabilityIdx,'11.2A readability must load after battlefield rendering and before interaction presentation stack');
const choreoCss=html.indexOf('gameplay-choreography.css'),feelCss=html.indexOf('feel-polish.css'),physicalCss=html.indexOf('physical-card.css');
assert(choreoCss>=0&&feelCss>choreoCss&&physicalCss>feelCss,'11.2 physical-card presentation overrides must load after 10.4C feel CSS');
console.log(`pwa-validation: ${precache.length} precache paths valid with coherent Pass 11 Golden Match core shell generation 11.golden.3`);

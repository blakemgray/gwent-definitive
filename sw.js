const BUILD='11.table3d.scene.2';
const CORE=`gwent-definitive-core-${BUILD}`;
const RUNTIME=`gwent-definitive-runtime-${BUILD}`;
const PRECACHE=[
  './','./index.html','./app.js','./styles.css','./battlefield-ux.css','./direct-manipulation.css','./gameplay-choreography.css','./feel-polish.css','./physical-card.css','./runtime-diagnostics.css','./tabletop-foundation.css','./manifest.webmanifest','./manifest-tabletop.webmanifest','./icon.svg',
  './icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png',
  './src/cards-catalog.js','./src/gwent-engine.js','./src/asset-resolver.js','./src/storage.js','./src/battlefield-ux.js','./src/battlefield-readability.js',
  './src/motion-tokens.js','./src/presentation-queue.js','./src/interaction-turn-gate.js','./src/presentation-events.js','./src/gameplay-choreography.js','./src/choreography-external-gate.js','./src/flip-layout.js','./src/interaction-intent.js','./src/gesture-controller.js','./src/card-continuity.js','./src/target-exposure.js','./src/presentation-feedback.js','./src/platform-feedback.js',
  './src/build-identity.js','./src/tabletop-renderer.js','./src/tabletop-scene.js','./src/tabletop-physics.js','./src/runtime-diagnostics.js',
  './table3d.css','./manifest-table3d.webmanifest','./src/table3d-renderer.js','./src/table3d-math.js',
  './vendor/three/three.module.js','./vendor/three/three.core.js','./vendor/three/addons/loaders/GLTFLoader.js','./vendor/three/addons/utils/BufferGeometryUtils.js','./vendor/three/addons/utils/SkeletonUtils.js',
  './assets/table3d/tavern-table.glb','./assets/table3d/oak-refined.png'
];

// Report the build of this actual worker. Observation must never advance its lifecycle.
self.addEventListener('message',event=>{
  if(event.data?.type!=='GWENT_DIAGNOSTICS'||!event.ports?.[0])return;
  try{event.ports[0].postMessage({type:'GWENT_DIAGNOSTICS_RESULT',protocolVersion:1,requestId:event.data.requestId,
    build:BUILD,coreCache:CORE,runtimeCache:RUNTIME,scope:self.registration?.scope||null});}catch(_){}
});

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CORE).then(cache=>cache.addAll(PRECACHE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CORE&&k!==RUNTIME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

async function cacheFirstCore(request){
  const cache=await caches.open(CORE);
  const hit=await cache.match(request,{ignoreSearch:true});
  if(hit)return hit;
  if(request.mode==='navigate'){
    const shell=await cache.match('./index.html')||await cache.match('./');
    if(shell)return shell;
  }
  throw new Error(`Core shell cache miss for ${new URL(request.url).pathname}`);
}

async function cacheFirstRuntime(request){
  const cache=await caches.open(RUNTIME);
  const hit=await cache.match(request);
  // A legacy opaque image entry can paint an <img>, but cannot satisfy the
  // CORS fetch used by a GPU texture. Keep its fallback without poisoning art
  // upload. Successful CORS responses remain reusable for either image mode.
  if(hit&&(request.mode!=='cors'||hit.type!=='opaque'))return hit;
  const res=await fetch(request);
  if(res&&res.ok)cache.put(request,res.clone()).catch(()=>{});
  return res;
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);

  if(url.hostname==='raw.githubusercontent.com'&&url.pathname.includes('/asundr/gwent-classic/')){
    event.respondWith(cacheFirstRuntime(req));
    return;
  }

  if(url.origin===self.location.origin){
    if(req.mode==='navigate'||['script','style','manifest'].includes(req.destination)){
      event.respondWith(cacheFirstCore(req));
      return;
    }
    event.respondWith(
      caches.open(CORE)
        .then(cache=>cache.match(req,{ignoreSearch:true}))
        .then(hit=>hit||fetch(req))
    );
  }
});

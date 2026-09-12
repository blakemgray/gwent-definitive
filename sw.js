const BUILD='11.golden.2';
const CORE=`gwent-definitive-core-${BUILD}`;
const RUNTIME=`gwent-definitive-runtime-${BUILD}`;
const PRECACHE=[
  './','./index.html','./app.js','./styles.css','./battlefield-ux.css','./direct-manipulation.css','./gameplay-choreography.css','./feel-polish.css','./physical-card.css','./manifest.webmanifest','./icon.svg',
  './icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png',
  './src/cards-catalog.js','./src/gwent-engine.js','./src/asset-resolver.js','./src/storage.js','./src/battlefield-ux.js','./src/battlefield-readability.js',
  './src/motion-tokens.js','./src/presentation-queue.js','./src/interaction-turn-gate.js','./src/presentation-events.js','./src/gameplay-choreography.js','./src/choreography-external-gate.js','./src/flip-layout.js','./src/interaction-intent.js','./src/gesture-controller.js','./src/card-continuity.js','./src/target-exposure.js','./src/presentation-feedback.js','./src/platform-feedback.js'
];

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
  if(hit)return hit;
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

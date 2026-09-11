const BUILD='11.1B.0';
const CORE=`gwent-definitive-core-${BUILD}`;
const RUNTIME=`gwent-definitive-runtime-${BUILD}`;
const PRECACHE=[
  './','./index.html','./app.js','./styles.css','./battlefield-ux.css','./direct-manipulation.css','./gameplay-choreography.css','./feel-polish.css','./manifest.webmanifest','./icon.svg',
  './icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png',
  './src/cards-catalog.js','./src/gwent-engine.js','./src/asset-resolver.js','./src/storage.js','./src/battlefield-ux.js',
  './src/motion-tokens.js','./src/presentation-queue.js','./src/interaction-turn-gate.js','./src/presentation-events.js','./src/gameplay-choreography.js','./src/choreography-external-gate.js','./src/flip-layout.js','./src/gesture-controller.js','./src/presentation-feedback.js'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CORE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CORE&&k!==RUNTIME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function networkFirst(request){try{const res=await fetch(request);if(res&&res.ok){const cache=await caches.open(CORE);cache.put(request,res.clone()).catch(()=>{});}return res;}catch(err){const hit=await caches.match(request);if(hit)return hit;if(request.mode==='navigate')return caches.match('./index.html');throw err;}}
async function cacheFirstRuntime(request){const hit=await caches.match(request);if(hit)return hit;const res=await fetch(request);const cache=await caches.open(RUNTIME);cache.put(request,res.clone()).catch(()=>{});return res;}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.hostname==='raw.githubusercontent.com'&&url.pathname.includes('/asundr/gwent-classic/')){event.respondWith(cacheFirstRuntime(req));return;}if(url.origin===self.location.origin){if(req.mode==='navigate'||['script','style','manifest'].includes(req.destination))event.respondWith(networkFirst(req));else event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));}});

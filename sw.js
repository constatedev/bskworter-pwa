/* Build-generated cache version. Do not reuse a version after changing files. */
const PREFIX='wortgarten-pwa:'+self.registration.scope+':';
const CACHE=PREFIX+'3d9af3b9f4e20480';
const FILES=["./index.html", "./grammar.html", "./style.css", "./app.js", "./core.js", "./i18n.js", "./icons.js", "./manifest.webmanifest", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon.svg", "./assets/maskable-512.png", "./content/catalog.json", "./content/grammar.json", "./content/vocabulary.json"];
const resolve=path=>new URL(path,self.registration.scope).href;
const ASSETS=new Set(FILES.map(path=>new URL(resolve(path)).pathname));
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);try{await cache.addAll(FILES.map(resolve));}catch(error){await caches.delete(CACHE);throw error;}})());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(name=>name.startsWith(PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));await self.clients.claim();})());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{const cache=await caches.open(CACHE),stored=await cache.match(request,{ignoreSearch:true})||await cache.match(resolve('./index.html'));if(stored)return stored;try{const response=await fetch(request);if(response.ok)return response;}catch{}
   return new Response('Offline files are not ready. Please reconnect.',{status:503,headers:{'Content-Type':'text/plain'}});
  })());return;
 }
 if(ASSETS.has(url.pathname))event.respondWith((async()=>{const cache=await caches.open(CACHE),stored=await cache.match(request,{ignoreSearch:true});return stored||fetch(request);})());
});

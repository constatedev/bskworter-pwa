/* Versioned, integrity-checked offline releases. Never precache stale HTTP responses. */
const PREFIX='wortgarten-pwa:'+self.registration.scope+':';
const BUILD='55e5df9d2ad588d6';
const CACHE=PREFIX+BUILD;
const FILES=["./index.html", "./grammar.html", "./style.css", "./app.js", "./core.js", "./i18n.js", "./icons.js", "./reading.js", "./verbs.js", "./manifest.webmanifest", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon.svg", "./assets/maskable-512.png", "./content/catalog.json", "./content/grammar.json", "./content/reading.json", "./content/verbs.json", "./content/vocabulary.json"];
const HASHES={"./index.html": "7431f1372289e0d5a46f7aeaa727ef3b7547c3b243628b62af76329dd81b4d30", "./grammar.html": "f05c67723f1c2b9edde8bb0134b7965b3eaf561d8350029f2abdfb7b942f5ee4", "./style.css": "95c5c3958b62f17a8c3ac7b838dbb919ba965dc1f3ab52302cccb77926df035b", "./app.js": "9bdd0f889fcdd1a371ae40077638cdb0ec8e436bf74e0d77fbcc343c1ad94458", "./core.js": "93bf21495cdc29352c3f0a8f8d4cc0a78a6597be7aefd67add6642875cfb0e7f", "./i18n.js": "718788492c74bb6a77451ff84914cf31a4bd1be270d3b24aa2e4b20a83492310", "./icons.js": "80ee35b330b3b9fff900129cc44fdfef6908659bd010a70a0b2463d0770bf17a", "./reading.js": "7108f79a56d339a94f868ff5b132ed4f1c048e069020b2dc987a249bc8bdfdf6", "./verbs.js": "a61773ba76cc9ed18bfe2c0d46413aafe642bd93353e4df4b36f955533caf16e", "./manifest.webmanifest": "a8873ea5d8760ca8e9cb75ffb1c3434122890afadb122edd330b201914a11522", "./assets/icon-192.png": "15996a62306a60c8cec2185bc1bf07b77bd47615190c2cb798c31c2fa7fb675b", "./assets/icon-512.png": "5060d242aab5cb810fd2445074fc4b354e9aa54ce173ee74053277f96eb9d911", "./assets/icon.svg": "275eecd95d3a0e8eb53bd4dea7df1ad829779608703529810d453b24589c6fec", "./assets/maskable-512.png": "5060d242aab5cb810fd2445074fc4b354e9aa54ce173ee74053277f96eb9d911", "./content/catalog.json": "aba9b7dbbcbcf521667121d99d1f94b75dfd355569b91316a190fcc3b55df439", "./content/grammar.json": "20bb8a58bb847c855f7448e6b9bd633b9d4e00978d5580026bea4757b4df44df", "./content/reading.json": "3055ac03786d756fb0ada683d7cf4fd87e1caa756518e04eca3c76f32fe090ce", "./content/verbs.json": "bb03a070b540828fb2d317ae832ae1ebaafdb1db25a4a4cbddadf09ea4f7dda2", "./content/vocabulary.json": "f37adb69d2fd8e37025f4fe64e002a225d35ec41b4bfe8119ced73b059f390e8"};
const resolve=path=>new URL(path,self.registration.scope).href;
const ASSETS=new Set(FILES.map(path=>new URL(resolve(path)).pathname));
async function verifiedResponse(path){
 const url=new URL(resolve(path));url.searchParams.set('__wg_build',BUILD);
 const response=await fetch(new Request(url.href,{cache:'reload',credentials:'same-origin'}));
 if(!response.ok)throw Error('Offline file unavailable: '+path);
 const bytes=await response.clone().arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==HASHES[path])throw Error('Offline file does not match release: '+path);
 return response;
}
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try{await Promise.all(FILES.map(async path=>cache.put(resolve(path),await verifiedResponse(path))));}
  catch(error){await caches.delete(CACHE);throw error;}
 })());
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

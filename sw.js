/* Versioned, integrity-checked offline releases. Never precache stale HTTP responses. */
const PREFIX='wortgarten-pwa:'+self.registration.scope+':';
const BUILD='59f904de2f142cc2';
const CACHE=PREFIX+BUILD;
const FILES=["./index.html", "./grammar.html", "./style.css", "./app.js", "./core.js", "./i18n.js", "./icons.js", "./manifest.webmanifest", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon.svg", "./assets/maskable-512.png", "./content/catalog.json", "./content/grammar.json", "./content/vocabulary.json"];
const HASHES={"./index.html": "63ea252d183712da8eefe344086a2bc979da9bd8255aad589e99c980a730b366", "./grammar.html": "f05c67723f1c2b9edde8bb0134b7965b3eaf561d8350029f2abdfb7b942f5ee4", "./style.css": "25e01e90fc996fbf0fb4ec83e23f7a11e8a7981a516a95fdb0b35da016efa9c7", "./app.js": "f14843bf0dca5b95b66a71dccf59c85b703f88c4f4d8cd532c4d04ac6a9692ce", "./core.js": "26e05fe9273b757de4f0ef71ba1babdf8735fc3f2d23f54ab22b7f67b9f5b10f", "./i18n.js": "be37e6d022a6cdb84ed654aa6aa953f24f10a4207a0cdd909d2e7d331ef3fc3d", "./icons.js": "80ee35b330b3b9fff900129cc44fdfef6908659bd010a70a0b2463d0770bf17a", "./manifest.webmanifest": "de635f44ff283bae3054ef6910280c1d4a08fcc58a86ca0d0d9b1eb7b3db26e0", "./assets/icon-192.png": "15996a62306a60c8cec2185bc1bf07b77bd47615190c2cb798c31c2fa7fb675b", "./assets/icon-512.png": "5060d242aab5cb810fd2445074fc4b354e9aa54ce173ee74053277f96eb9d911", "./assets/icon.svg": "275eecd95d3a0e8eb53bd4dea7df1ad829779608703529810d453b24589c6fec", "./assets/maskable-512.png": "5060d242aab5cb810fd2445074fc4b354e9aa54ce173ee74053277f96eb9d911", "./content/catalog.json": "f64ae282c93e6a3387dd7cfe594823b0190e6f735f46119cc9fb218e21c1fa43", "./content/grammar.json": "20bb8a58bb847c855f7448e6b9bd633b9d4e00978d5580026bea4757b4df44df", "./content/vocabulary.json": "cd8d5548d83a4fc6dae5da154c30f32d8a7dfa0b26d5f094c076b0fa46dbbceb"};
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

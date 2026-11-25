/* Mon Budget : fonctionne hors ligne et se met à jour seul.
   Pages : toujours le réseau d'abord, sans cache HTTP (sinon l'appli installée gardait une ancienne version).
   Images : réseau d'abord, cache en secours. */
const CACHE='mon-budget-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./mb-icon-192.png','./mb-icon-512.png','./mb-icon-maskable-512.png','./mb-apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  const isPage=req.mode==='navigate'||/\/(index\.html)?$/.test(url.pathname)||url.pathname.endsWith('.webmanifest');
  const net=isPage?fetch(url.href,{cache:'no-store',credentials:'same-origin'}):fetch(req);
  e.respondWith(net.then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(isPage&&req.mode==='navigate'?'./index.html':req,copy));}
    return res;
  }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
});

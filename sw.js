// EVN‑SPC | MBA Tracker — Service Worker (sw.js)
const VERSION = 'v1.0.0';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  // API: network-first
  if (url.searchParams.get('p')==='api'){
    e.respondWith((async()=>{
      try {
        const r = await fetch(e.request);
        const clone = r.clone();
        return r;
      } catch(err){
        // API offline: trả lỗi JSON
        return new Response(JSON.stringify({ok:false,error:"offline"}), {headers:{'Content-Type':'application/json'}});
      }
    })());
    return;
  }
  // Static: cache-first, fallback to network
  e.respondWith((async()=>{
    const cache = await caches.open(VERSION);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    try {
      const r = await fetch(e.request);
      if (r && r.ok && (e.request.method==='GET')) cache.put(e.request, r.clone());
      return r;
    } catch(err) {
      // Offline fallback: index
      const fallback = await cache.match('./index.html');
      return fallback || new Response('Offline', {status:503});
    }
  })());
});

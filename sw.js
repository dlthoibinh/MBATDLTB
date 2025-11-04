<script>
/* EVN-SPC | MBA Tracker PRO — Service Worker */
const VERSION = 'v1.1.0-pro';
const APP_SHELL = [
  './', './?p=manifest',
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
      try{
        const r = await fetch(e.request);
        return r;
      }catch(err){
        return new Response(JSON.stringify({ok:false,error:"offline"}), {headers:{'Content-Type':'application/json'}});
      }
    })());
    return;
  }
  // Static: cache-first
  e.respondWith((async()=>{
    const cache = await caches.open(VERSION);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    try{
      const r = await fetch(e.request);
      if (r && r.ok && e.request.method==='GET') cache.put(e.request, r.clone());
      return r;
    }catch(err){
      return cached || new Response('Offline', {status:503});
    }
  })());
});
</script>

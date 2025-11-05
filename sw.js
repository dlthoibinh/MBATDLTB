/* EVN-SPC | MBA Tracker PRO — Service Worker */
const VERSION = "v1.3.1";
const APP_SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e=>{
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", e=>{
  const url = new URL(e.request.url);

  // API (script.google.com) → network-first
  if (url.hostname.includes("script.google.com") || url.hostname.includes("script.googleusercontent.com")) {
    e.respondWith((async()=>{
      try { return await fetch(e.request); }
      catch { return new Response(JSON.stringify({ok:false,error:"offline"}), {headers:{'Content-Type':'application/json'}}); }
    })());
    return;
  }

  // Tệp tĩnh → cache-first
  e.respondWith((async()=>{
    const cache = await caches.open(VERSION);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    try {
      const r = await fetch(e.request);
      if (r && r.ok && e.request.method === "GET") cache.put(e.request, r.clone());
      return r;
    } catch {
      return cached || new Response("Offline", {status:503});
    }
  })());
});

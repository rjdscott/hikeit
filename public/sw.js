// hikeit service worker: cache-first for the app shell + assets, network-first for navigation. Version bumps with each build hash.
const CACHE = 'hikeit-v1'
self.addEventListener('install', (e) => { self.skipWaiting() })
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put(req, c)); return r }).catch(() => caches.match(req).then((r) => r || caches.match('/hikeit/'))))
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((k) => k.put(req, c)) } return r })))
})

// hikeit service worker (template — vite.config.ts fills __CACHE__ and __ASSETS__ at build time).
// - install: precache the app shell + this build's hashed assets so the app works offline after one visit
// - /hikeit/assets/* are content-hashed and immutable → cache-first
// - everything else (index.html, manifest, icons) → network-first with cache fallback, so a deploy is picked up on the next online load
// - activate: drop caches from previous builds
const CACHE = '__CACHE__'
const ASSETS = __ASSETS__
const SHELL = ['/hikeit/', '/hikeit/manifest.webmanifest', '/hikeit/icon.svg', '/hikeit/icon-192.png']
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([...SHELL, ...ASSETS])).catch(() => {}).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return
  if (url.pathname.startsWith('/hikeit/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((k) => k.put(req, c)) } return r })))
    return
  }
  e.respondWith(
    fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((k) => k.put(req, c)) } return r })
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('/hikeit/') : undefined))),
  )
})

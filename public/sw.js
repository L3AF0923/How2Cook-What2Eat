const CACHE_NAME = 'how2cook-what2eat-v0.3.1'
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)
  if (requestUrl.origin !== self.location.origin) return

  const networkAndCache = () => fetch(event.request, { cache: 'no-store' }).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()))
    return response
  })

  if (event.request.mode === 'navigate') {
    event.respondWith(networkAndCache().catch(() => caches.match('./index.html')))
    return
  }

  if (['script', 'style', 'worker'].includes(event.request.destination)) {
    event.respondWith(networkAndCache().catch(() => caches.match(event.request)))
    return
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || networkAndCache()))
})

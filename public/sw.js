// Bill Snap Service Worker (Hand-written PWA cache)
const VERSION = 'billsnap-v1'
const CACHE_NAME = `billsnap-cache-${VERSION}`

// Static assets precached on install
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon-180.png',
]

// 1. Install event: precache shell and take control immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// 2. Activate event: purge old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  )
})

// 3. Fetch event: routing & caching strategy
self.addEventListener('fetch', (event) => {
  const req = event.request

  // Ignore non-GET requests entirely
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // NEVER intercept or cache anything under /api/ (network only)
  // Ensures bill analysis requests and sensitive data are never stored in cache
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Page navigations (HTML): Network first, fall back to cached shell "/" when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy))
          }
          return networkRes
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  // Same-origin static assets (/assets/*, fonts, icons, manifest): Cache first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached

        return fetch(req).then((networkRes) => {
          // Cache successful static responses
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
          }
          return networkRes
        })
      })
    )
  }
})


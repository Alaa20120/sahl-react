const CACHE_NAME = 'sahl-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch: network-first strategy for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // For HTML pages: network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match('/')
        })
    )
    return
  }

  // For static assets: cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})

const CACHE = 'sahl-v2'
const BASE = '/sahl-react'
const OFFLINE_PAGE = BASE + '/'

const PRECACHE = [
  BASE + '/',
  BASE + '/favicon.svg',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Skip Supabase API calls — always network
  if (url.hostname.includes('supabase.co')) return

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(OFFLINE_PAGE))
    )
    return
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (/\.(js|css|woff2?|png|svg|ico|jpg)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // Network-first for everything else
  e.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// Service Worker for SmartHotel PWA
// Provides offline functionality and caching

const CACHE_NAME = 'smarthotel-v1.0.0'
const STATIC_CACHE = 'smarthotel-static-v1.0.0'
const DYNAMIC_CACHE = 'smarthotel-dynamic-v1.0.0'

// Assets to cache on install (only essential ones to avoid failures)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API routes to cache with different strategies
const API_CACHE_ROUTES = [
  '/api/health',
  '/api/rooms',
  '/api/bookings',
  '/api/restaurant/menu'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets')
        // Cache only essential assets, ignore failures for optional ones
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err)
              return null
            })
          )
        )
      })
      .then(() => {
        console.log('Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error)
        // Still skip waiting even if caching fails
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip Chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  event.respondWith(
    handleFetch(request).catch((error) => {
      console.error('Fetch handler error:', error)
      // Return a basic offline response
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
      })
    })
  )
})

async function handleFetch(request) {
  const url = new URL(request.url)
  
  try {
    // Strategy 1: Cache First for static assets
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request, STATIC_CACHE)
    }
    
    // Strategy 2: Network First for API routes
    if (isApiRoute(url.pathname)) {
      return await networkFirst(request, DYNAMIC_CACHE)
    }
    
    // Strategy 3: Stale While Revalidate for pages
    if (isPageRequest(request)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE)
    }
    
    // Strategy 4: Network First for everything else
    return await networkFirst(request, DYNAMIC_CACHE)
    
  } catch (error) {
    console.error('Fetch failed:', error)
    
    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return a generic offline response for navigation requests
    if (isPageRequest(request)) {
      const offlineResponse = await caches.match('/offline.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    // Return a generic offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone()).catch(err => {
        console.warn('Failed to cache response:', err)
      })
    }
    
    return networkResponse
  } catch (error) {
    console.error('Network fetch failed:', error)
    throw error
  }
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone()).catch(err => {
        console.warn('Failed to cache response:', err)
      })
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(cacheName)
        cache.then((cache) => {
          cache.put(request, networkResponse.clone()).catch(err => {
            console.warn('Failed to cache response:', err)
          })
        }).catch(err => {
          console.warn('Failed to open cache:', err)
        })
      }
      return networkResponse
    })
    .catch(() => {
      // Return cached response if network fails
      return cachedResponse || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
      })
    })
  
  return cachedResponse || fetchPromise
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/static/') ||
         pathname.startsWith('/icons/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.webp') ||
         pathname.endsWith('.avif')
}

function isApiRoute(pathname) {
  return pathname.startsWith('/api/') && 
         API_CACHE_ROUTES.some(route => pathname.startsWith(route))
}

function isPageRequest(request) {
  return request.headers.get('accept')?.includes('text/html') ||
         request.destination === 'document'
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received')
  
  const options = {
    body: 'You have a new notification from SmartHotel',
    icon: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }
  
  if (event.data) {
    try {
      const data = event.data.json()
      options.body = data.body || options.body
      options.title = data.title || 'SmartHotel'
      options.data = { ...options.data, ...data }
    } catch (error) {
      console.error('Failed to parse push data:', error)
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('SmartHotel', options).catch(err => {
      console.error('Failed to show notification:', err)
    })
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action)
  
  event.notification.close()
  
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return clients.openWindow('/')
    }).catch(err => {
      console.error('Failed to handle notification click:', err)
    })
  )
})

// Update available notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting().catch(err => {
      console.error('Failed to skip waiting:', err)
    })
  }
})

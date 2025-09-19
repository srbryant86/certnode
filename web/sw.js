// CertNode Service Worker for Performance and Offline Support
const CACHE_NAME = 'certnode-v1';
const STATIC_ASSETS = [
  '/',
  '/assets/site.css',
  '/assets/pricing.css',
  '/js/lead-capture.js',
  '/verify',
  '/pricing',
  '/openapi'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Don't cache non-successful responses
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Cache successful responses for static assets
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          });
      })
      .catch(() => {
        // Provide offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Background sync for form submissions when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'lead-sync') {
    event.waitUntil(syncLeadData());
  }
});

async function syncLeadData() {
  // Handle offline form submissions when connection is restored
  try {
    const db = await openDB();
    const tx = db.transaction(['leads'], 'readonly');
    const store = tx.objectStore('leads');
    const leads = await store.getAll();

    for (const lead of leads) {
      try {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead.data)
        });

        // Remove from local storage after successful sync
        const deleteTx = db.transaction(['leads'], 'readwrite');
        const deleteStore = deleteTx.objectStore('leads');
        await deleteStore.delete(lead.id);
      } catch (error) {
        console.error('Failed to sync lead:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync lead data:', error);
  }
}

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CertNodeDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('leads')) {
        db.createObjectStore('leads', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
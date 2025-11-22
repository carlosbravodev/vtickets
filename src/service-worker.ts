/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `vtickets-cache-${version}`;
const ASSETS = [...build, ...files];

// Instalación del service worker
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS);
    })
  );
  
  // Activar inmediatamente
  self.skipWaiting();
});

// Activación del service worker
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Tomar control de todas las páginas inmediatamente
  self.clients.claim();
});

// Estrategia de fetch: Network First con fallback a Cache
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear requests del mismo origen
  if (url.origin !== location.origin) return;

  // No cachear API requests - siempre ir a la red
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Estrategia Network First para el resto
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clonar la respuesta para guardar en cache
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar con cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si no hay cache y es una navegación, devolver página offline
          if (request.mode === 'navigate') {
            return caches.match('/').then(r => r || new Response('Offline', { status: 503 }));
          }
          
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * ZenLove Wedding - Service Worker (Offline Support for Wedding Venues)
 * Cho phép khách mời mở thiệp cưới, xem lịch trình, bản đồ chỉ đường ngay cả khi mất sóng 4G/Wifi trong sảnh tiệc
 */

const CACHE_NAME = "zenlove-wedding-v1";
const STATIC_ASSETS = [
  "/",
  "/templates",
  "/chinh-sach",
  "/doi-tac-cuoi",
  "/assets/logo/logo-6.svg",
  "/assets/logo/text-logo-dark.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("ServiceWorker pre-cache failed:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Không cache API calls hoặc Next.js HMR/Dev server internals
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  // Network-first với Cache Fallback cho trang thiệp mời (/show/...)
  if (url.pathname.startsWith("/show/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stale-while-revalidate cho tài nguyên tĩnh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

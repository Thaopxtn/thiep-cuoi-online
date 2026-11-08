/**
 * Cache only public, same-origin static files. Pages and invitation data always
 * use the network so a signed-out session or unpublished card cannot be replayed.
 */
const CACHE_PREFIX = "zenlove-wedding-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const STATIC_ASSETS = [
  "/assets/logo/logo-6.svg",
  "/assets/logo/text-logo-dark.svg",
];
const STATIC_PATH = /^(?:\/_next\/static\/|\/fonts\/|\/assets\/).+\.(?:css|js|woff2?|ttf|otf|svg|png|jpe?g|webp|avif|gif|ico|mp3|ogg|wav)$/i;
const REVALIDATION_REQUIRED = /(?:^|,)\s*(?:private|no-store|no-cache|must-revalidate|max-age\s*=\s*0)(?:\s*(?:=|,|$))/i;

function canCacheRequest(request) {
  const url = new URL(request.url);
  return request.method === "GET"
    && url.origin === self.location.origin
    && request.mode !== "navigate"
    && request.cache !== "no-store"
    && request.cache !== "reload"
    && request.cache !== "no-cache"
    && !request.headers.has("authorization")
    && !request.headers.has("range")
    && !request.headers.has("rsc")
    && !request.headers.has("next-router-prefetch")
    && !url.searchParams.has("_rsc")
    && !REVALIDATION_REQUIRED.test(request.headers.get("cache-control") || "")
    && STATIC_PATH.test(url.pathname);
}

async function fetchStatic(request) {
  let cache;
  try {
    cache = await caches.open(CACHE_NAME);
  } catch {
    return fetch(request);
  }
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    try {
      const cached = await cache.match(request);
      if (cached) return cached;
    } catch {
      // Preserve the original network failure when storage is unavailable.
    }
    throw error;
  }

  const cacheable = response.status === 200
    && !response.redirected
    && response.type !== "opaque"
    && !REVALIDATION_REQUIRED.test(response.headers.get("cache-control") || "")
    && !/text\/html|text\/x-component/i.test(response.headers.get("content-type") || "")
    && response.headers.get("vary") !== "*";

  // CacheStorage failures (for example, storage quota) must not hide a valid response.
  try {
    if (cacheable) await cache.put(request, response.clone());
    else await cache.delete(request);
  } catch {
    // The network response remains usable when storage is unavailable.
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all(STATIC_ASSETS.map((asset) =>
      fetchStatic(new Request(new URL(asset, self.location.origin))).catch(() => undefined)
    )).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (canCacheRequest(event.request)) {
    event.respondWith(fetchStatic(event.request));
  }
});

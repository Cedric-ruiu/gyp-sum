// GypSum service worker — hand-rolled, dependency-free (no Workbox).
// Strategy: navigations are network-first (always fresh online, cached
// fallback offline); content-hashed static assets are stale-while-revalidate.
// This guarantees an online launch is never a stale "frozen" copy: it fetches
// the current HTML, which references the current hashed assets.

const CACHE = "gypsum-v1";

// Scope path, e.g. "/gyp-sum/". Derived from the registration so the SW does
// not hardcode the GitHub Pages base.
const BASE = new URL(self.registration.scope).pathname;

// Stable-named shell to precache so the app works offline on the first launch
// after install. Hashed JS/CSS are unknown here and get cached at runtime.
const PRECACHE = [
  BASE,
  `${BASE}en/`,
  `${BASE}site.webmanifest`,
  `${BASE}favicon.svg`,
  `${BASE}favicon-96x96.png`,
  `${BASE}favicon.ico`,
  `${BASE}apple-touch-icon.png`,
  `${BASE}web-app-manifest-192x192.png`,
  `${BASE}web-app-manifest-512x512.png`,
  `${BASE}fonts/inter-latin-300-normal.woff2`,
  `${BASE}fonts/inter-latin-400-normal.woff2`,
  `${BASE}fonts/inter-latin-500-normal.woff2`,
  `${BASE}fonts/jetbrains-mono-latin-300-normal.woff2`,
  `${BASE}fonts/jetbrains-mono-latin-400-normal.woff2`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Tolerant precache: a single failed request must not abort install.
      await Promise.allSettled(
        PRECACHE.map((url) =>
          fetch(url, { cache: "reload" }).then((res) => {
            if (res.ok) return cache.put(url, res);
            return undefined;
          }),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fall back to the cached app shell for unseen in-app routes.
    const shell = await cache.match(BASE);
    return shell ?? Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached ?? network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (!url.pathname.startsWith(BASE)) return;
  event.respondWith(staleWhileRevalidate(request));
});

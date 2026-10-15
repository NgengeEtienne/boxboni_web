// Waypoint service worker: makes the app installable and lets the app shell
// open without a connection.
//
// - Precaches an offline fallback page, the manifest, the icons and the
//   prerendered app pages.
// - Page navigations: network first, falling back to the last good copy of
//   that page, then to /offline.html.
// - /_next/static/* (content-hashed, immutable): cache first.
// - Other same-origin static files (icons, fonts, images): stale-while-revalidate.
// - Never touched: non-GET requests, other origins (the backend API lives on
//   its own origin), /api/*, anything carrying an Authorization header, and
//   RSC/prefetch payloads. Auth and data always come straight from the network.
//
// Bump VERSION to drop every old cache on the next activation.
const VERSION = "v3";
const SHELL_CACHE = `waypoint-shell-${VERSION}`;
const PAGES_CACHE = `waypoint-pages-${VERSION}`;
const ASSETS_CACHE = `waypoint-assets-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, PAGES_CACHE, ASSETS_CACHE];

const OFFLINE_URL = "/offline.html";
// Statically prerendered routes. "/" (the start_url) client-redirects to
// /login or /dashboard, so those must be available offline too.
const APP_PAGES = ["/", "/login", "/dashboard", "/register"];
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/favicon-32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => cacheUrls(PAGES_CACHE, APP_PAGES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.registration.navigationPreload && self.registration.navigationPreload.enable())
      .then(() => self.clients.claim())
  );
});

// The page that registered us was loaded before we controlled it, so its
// pages/chunks never went through the fetch handler. It sends us their URLs
// once we're active so the very first visit already works offline.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "CACHE_URLS" || !Array.isArray(data.pages) || !Array.isArray(data.assets)) return;
  event.waitUntil(
    Promise.all([
      cacheUrls(PAGES_CACHE, data.pages.filter(isSameOriginPath)),
      cacheUrls(ASSETS_CACHE, data.assets.filter(isSameOriginPath)),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch the backend API origin
  if (url.pathname.startsWith("/api/")) return;
  if (request.headers.has("Authorization")) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
    return;
  }

  // Client-side navigation payloads; let Next handle these itself.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event));
});

async function networkFirstPage(event) {
  const { request } = event;
  const cache = await caches.open(PAGES_CACHE);
  try {
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(request));
    if (isCacheable(response)) event.waitUntil(cache.put(stripSearch(request.url), response.clone()));
    return response;
  } catch {
    const cached = await cache.match(stripSearch(request.url));
    return cached || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cached = await caches.match(request);
  const network = fetch(request).then(async (response) => {
    if (isCacheable(response)) {
      const cache = await caches.open(ASSETS_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}

async function cacheUrls(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urls.map(async (url) => {
      if (await cache.match(url)) return;
      try {
        const response = await fetch(url, { credentials: "same-origin" });
        if (isCacheable(response)) await cache.put(url, response);
      } catch {
        // Offline or gone; it'll be picked up on a later visit.
      }
    })
  );
}

function isCacheable(response) {
  if (!response || !response.ok || response.type !== "basic") return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  return !/no-store|private/i.test(cacheControl);
}

function isSameOriginPath(url) {
  try {
    const parsed = new URL(url, self.location.origin);
    return parsed.origin === self.location.origin && !parsed.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

function stripSearch(url) {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  return parsed.href;
}

// Service worker: keeps opened lessons available offline (US-04).
//
// Caches:
// - pages: the HTML of pages the learner has opened (up to MAX_PAGES; the
//   least recently saved goes first)
// - static: Next.js build files (/_next/static, content-hashed) plus the icon
//   and manifest (up to MAX_STATIC; the least recently used goes first)
// - meta: for each saved page, the build files it uses. Those files are never
//   dropped while the page is saved, so a saved lesson always works offline.
//   This can take the static cache past MAX_STATIC; it is still bounded by
//   MAX_PAGES x MAX_ASSETS_PER_MESSAGE.
// Bump VERSION when this file's caching rules change; the old caches are
// moved across on activate so learners keep their offline lessons.

const VERSION = "v2";
const PAGES_CACHE = `lwa-pages-${VERSION}`;
const STATIC_CACHE = `lwa-static-${VERSION}`;
const META_CACHE = `lwa-meta-${VERSION}`;
const LEGACY_CACHE = "learn-with-asejik-v1";
const MAX_PAGES = 50;
const MAX_STATIC = 150;
const NETWORK_TIMEOUT_MS = 4000;
const BACKGROUND_FETCH_TIMEOUT_MS = 15000;
const MAX_ASSETS_PER_MESSAGE = 200;
const OFFLINE_PATH = "/offline";
const PRECACHE_PAGES = ["/", OFFLINE_PATH];
const PRECACHE_STATIC = ["/manifest.json", "/icon.svg"];

// ---------- helpers ----------

function logCacheError(error) {
  console.warn("[SW] Offline cache update failed:", error);
}

// A failed network request just means offline; anything else is logged.
function logCacheErrorUnlessOffline(error) {
  if (error instanceof TypeError) return;
  logCacheError(error);
}

function pageKey(url) {
  return url.origin + url.pathname;
}

function isBuildFile(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isStaticFile(url) {
  return isBuildFile(url) || PRECACHE_STATIC.includes(url.pathname);
}

function isRscRequest(request, url) {
  return request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

function isHtml(response) {
  return (response.headers.get("Content-Type") || "").includes("text/html");
}

function isCacheablePage(response) {
  return response.ok && response.type === "basic" && !response.redirected && isHtml(response);
}

function isProtected(url) {
  return PRECACHE_PAGES.includes(url.pathname) || PRECACHE_STATIC.includes(url.pathname);
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Network timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// Background fetches (nobody is waiting on them) give up after a while.
function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { credentials: "same-origin", signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// ---------- cache writes (one at a time, so limits apply cleanly) ----------

let writeQueue = Promise.resolve();

function queued(task) {
  const run = writeQueue.then(task);
  writeQueue = run.catch(() => undefined);
  return run;
}

// Files used by any saved page.
async function filesInUse() {
  const pages = await caches.open(PAGES_CACHE);
  const meta = await caches.open(META_CACHE);
  const inUse = new Set();
  for (const request of await meta.keys()) {
    if (!(await pages.match(request.url))) continue;
    const response = await meta.match(request);
    // A damaged entry protects nothing; it is replaced on the next visit.
    const list = response ? await response.json().catch(() => null) : null;
    if (!Array.isArray(list)) continue;
    for (const url of list) {
      if (typeof url === "string") inUse.add(url);
    }
  }
  return inUse;
}

async function trimPages() {
  const pages = await caches.open(PAGES_CACHE);
  const meta = await caches.open(META_CACHE);
  const keys = await pages.keys();
  let excess = keys.length - MAX_PAGES;
  for (const request of keys) {
    if (excess <= 0) break;
    if (isProtected(new URL(request.url))) continue;
    await pages.delete(request);
    await meta.delete(request.url);
    excess -= 1;
  }
}

async function trimStatic() {
  const statics = await caches.open(STATIC_CACHE);
  const keys = await statics.keys();
  if (keys.length <= MAX_STATIC) return;
  const inUse = await filesInUse();
  let excess = keys.length - MAX_STATIC;
  for (const request of keys) {
    if (excess <= 0) break;
    if (isProtected(new URL(request.url)) || inUse.has(request.url)) continue;
    await statics.delete(request);
    excess -= 1;
  }
}

function savePageResponse(key, response) {
  return queued(async () => {
    const pages = await caches.open(PAGES_CACHE);
    // put() replaces any old copy and moves it to the end (most recent).
    await pages.put(key, response);
    await trimPages();
  });
}

function saveFileResponse(url, response) {
  return queued(async () => {
    const statics = await caches.open(STATIC_CACHE);
    await statics.put(url, response);
    await trimStatic();
  });
}

// Mark a saved file as recently used, at most once while this worker runs.
const touchedFiles = new Set();

function touchFile(url, cachedResponse) {
  if (touchedFiles.has(url)) return Promise.resolve();
  touchedFiles.add(url);
  return queued(async () => {
    const statics = await caches.open(STATIC_CACHE);
    await statics.put(url, cachedResponse);
  });
}

function saveFilesInUse(key, files) {
  return queued(async () => {
    const meta = await caches.open(META_CACHE);
    await meta.put(
      key,
      new Response(JSON.stringify(files), { headers: { "Content-Type": "application/json" } })
    );
  });
}

async function offlineResponse() {
  const cached = await caches.match(self.location.origin + OFFLINE_PATH, {
    cacheName: PAGES_CACHE,
  });
  return (
    cached ||
    new Response("You are offline and this page is not saved on this device yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

// ---------- install and activate ----------

async function precache() {
  const pages = await caches.open(PAGES_CACHE);
  for (const path of PRECACHE_PAGES) {
    const response = await fetch(path, { credentials: "same-origin" });
    if (!isCacheablePage(response)) {
      throw new Error(`Precache failed for ${path} (status ${response.status})`);
    }
    await pages.put(self.location.origin + path, response);
  }
  const statics = await caches.open(STATIC_CACHE);
  await statics.addAll(PRECACHE_STATIC);
}

// Move pages and build files from the v1 cache so learners keep their
// offline lessons. If it fails, the v1 cache is kept for the next version.
async function migrateLegacyCache() {
  if (!(await caches.has(LEGACY_CACHE))) return;
  try {
    const legacy = await caches.open(LEGACY_CACHE);
    const pages = await caches.open(PAGES_CACHE);
    const statics = await caches.open(STATIC_CACHE);
    for (const request of await legacy.keys()) {
      const url = new URL(request.url);
      if (url.origin !== self.location.origin || url.searchParams.has("_rsc")) continue;
      const response = await legacy.match(request);
      if (!response || !response.ok) continue;
      if (isStaticFile(url)) {
        if (!(await statics.match(request.url))) await statics.put(request.url, response);
      } else if (isHtml(response)) {
        const key = pageKey(url);
        if (!(await pages.match(key))) await pages.put(key, response);
      }
    }
    await trimPages();
    await trimStatic();
    await caches.delete(LEGACY_CACHE);
  } catch (error) {
    logCacheError(error);
  }
}

async function activate() {
  await migrateLegacyCache();
  const keep = [PAGES_CACHE, STATIC_CACHE, META_CACHE, LEGACY_CACHE];
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key)));
  await self.clients.claim();
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(activate());
});

// ---------- requests ----------

// Pages being saved from a full page load, so a save request for the same
// page does not download it a second time.
const pagesBeingSaved = new Set();

// Pages: network first. With a saved copy, a slow network falls back to it
// after NETWORK_TIMEOUT_MS. Without one, wait for the network, and show the
// offline page if it fails.
function handleNavigation(event) {
  const request = event.request;
  const key = pageKey(new URL(request.url));
  const network = fetch(request);
  pagesBeingSaved.add(key);
  event.waitUntil(
    network
      .then((response) =>
        isCacheablePage(response) ? savePageResponse(key, response.clone()) : undefined
      )
      .catch(logCacheErrorUnlessOffline)
      .finally(() => pagesBeingSaved.delete(key))
  );

  return (async () => {
    const cached = await caches.match(key, { cacheName: PAGES_CACHE });
    if (!cached) {
      try {
        return await network;
      } catch {
        return offlineResponse();
      }
    }
    try {
      const response = await withTimeout(network, NETWORK_TIMEOUT_MS);
      return response.status >= 500 ? cached : response;
    } catch {
      return cached;
    }
  })();
}

// Build files never change once built, so the saved copy is used without
// re-downloading.
function handleBuildFile(event) {
  const request = event.request;
  return (async () => {
    const cached = await caches.match(request.url, { cacheName: STATIC_CACHE });
    if (cached) {
      event.waitUntil(touchFile(request.url, cached.clone()).catch(logCacheError));
      return cached;
    }
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      event.waitUntil(saveFileResponse(request.url, response.clone()).catch(logCacheError));
    }
    return response;
  })();
}

// Icon and manifest: saved copy first, refreshed in the background.
function handleStaticFile(event) {
  const request = event.request;
  const network = fetch(request);
  event.waitUntil(
    network
      .then((response) =>
        response.ok ? saveFileResponse(request.url, response.clone()) : undefined
      )
      .catch(logCacheErrorUnlessOffline)
  );
  return (async () => {
    const cached = await caches.match(request.url, { cacheName: STATIC_CACHE });
    return cached || network;
  })();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }
  // In-app page data (React Server Components): network only. When offline,
  // Next.js falls back to a full page load, which the pages cache serves.
  if (isRscRequest(request, url)) return;

  if (isBuildFile(url)) {
    event.respondWith(handleBuildFile(event));
    return;
  }
  if (PRECACHE_STATIC.includes(url.pathname)) {
    event.respondWith(handleStaticFile(event));
  }
});

// ---------- save the page the learner is on ----------

function toSameOriginUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value, self.location.origin);
    return url.origin === self.location.origin ? url : null;
  } catch {
    return null;
  }
}

// In-app navigation never makes a page request, so the page asks to be saved,
// with the build files it has loaded (including those loaded before this
// worker was in control).
async function savePage(message) {
  const pageUrl = toSameOriginUrl(message.page);
  const isPage =
    pageUrl && !pageUrl.pathname.startsWith("/api/") && !pageUrl.pathname.startsWith("/_next/");

  const files = [];
  const assets = Array.isArray(message.assets)
    ? message.assets.slice(0, MAX_ASSETS_PER_MESSAGE)
    : [];
  for (const value of assets) {
    const url = toSameOriginUrl(value);
    if (url && isBuildFile(url) && !files.includes(url.href)) files.push(url.href);
  }

  if (isPage) {
    const key = pageKey(pageUrl);
    await saveFilesInUse(key, files);
    const saved = await caches.match(key, { cacheName: PAGES_CACHE });
    if (!saved && !pagesBeingSaved.has(key)) {
      const response = await fetchWithTimeout(key, BACKGROUND_FETCH_TIMEOUT_MS);
      if (isCacheablePage(response)) await savePageResponse(key, response);
    }
  }

  for (const url of files) {
    if (await caches.match(url, { cacheName: STATIC_CACHE })) continue;
    const response = await fetchWithTimeout(url, BACKGROUND_FETCH_TIMEOUT_MS);
    if (response.ok && response.type === "basic") await saveFileResponse(url, response);
  }
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object" || data.type !== "SAVE_PAGE") return;
  event.waitUntil(savePage(data).catch(logCacheErrorUnlessOffline));
});

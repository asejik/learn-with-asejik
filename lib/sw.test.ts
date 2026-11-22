import fs from "fs";
import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";

// Runs public/sw.js against an in-memory Cache Storage and a mock network.

const ORIGIN = "https://app.test";
const SW_SOURCE = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf-8");
const PAGES = "lwa-pages-v2";
const STATIC = "lwa-static-v2";
const LEGACY = "learn-with-asejik-v1";

type FakeRequest = { url: string; method: string; mode: string; headers: Headers };
type Listener = (event: FakeEvent) => void;

function full(url: string) {
  return new URL(url, ORIGIN).href;
}

function keyOf(input: string | { url: string }) {
  return typeof input === "string" ? full(input) : input.url;
}

class FakeCache {
  entries = new Map<string, Response>();
  failPut = false;
  putCount = 0;
  constructor(private fetcher: (url: string) => Promise<Response>) {}
  async match(input: string | { url: string }) {
    return this.entries.get(keyOf(input))?.clone();
  }
  async put(input: string | { url: string }, response: Response) {
    if (this.failPut) throw new Error("QuotaExceededError");
    this.putCount += 1;
    // Like the real Cache API, put() moves the entry to the end.
    this.entries.delete(keyOf(input));
    this.entries.set(keyOf(input), response);
  }
  async delete(input: string | { url: string }) {
    return this.entries.delete(keyOf(input));
  }
  async keys() {
    return Array.from(this.entries.keys()).map((url) => ({ url }));
  }
  async addAll(urls: string[]) {
    for (const url of urls) {
      const response = await this.fetcher(full(url));
      if (!response.ok) throw new Error(`addAll failed for ${url}`);
      await this.put(url, response);
    }
  }
  paths() {
    return Array.from(this.entries.keys()).map((url) => url.replace(ORIGIN, ""));
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>();
  constructor(private fetcher: (url: string) => Promise<Response>) {}
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache(this.fetcher));
    return this.stores.get(name)!;
  }
  async has(name: string) {
    return this.stores.has(name);
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async keys() {
    return Array.from(this.stores.keys());
  }
  async match(input: string | { url: string }, options?: { cacheName?: string }) {
    const names = options?.cacheName ? [options.cacheName] : Array.from(this.stores.keys());
    for (const name of names) {
      const found = await this.stores.get(name)?.match(input);
      if (found) return found;
    }
    return undefined;
  }
}

class FakeEvent {
  pending: Promise<unknown>[] = [];
  response: Promise<Response> | undefined;
  constructor(public request?: FakeRequest, public data?: unknown) {}
  waitUntil(promise: Promise<unknown>) {
    this.pending.push(promise);
  }
  respondWith(promise: Promise<Response>) {
    this.response = promise;
  }
  // waitUntil can be called again while earlier work runs, so loop until quiet.
  async settle() {
    let seen = -1;
    while (seen !== this.pending.length) {
      seen = this.pending.length;
      await Promise.all(this.pending);
    }
  }
}

function basic(response: Response) {
  Object.defineProperty(response, "type", { value: "basic", configurable: true });
  return response;
}

function html(body: string, status = 200) {
  return basic(new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } }));
}

function file(body: string) {
  return basic(new Response(body, { status: 200, headers: { "Content-Type": "text/javascript" } }));
}

function offlineError() {
  return new TypeError("Failed to fetch");
}

function request(url: string, mode = "no-cors", headers: Record<string, string> = {}): FakeRequest {
  return { url: full(url), method: "GET", mode, headers: new Headers(headers) };
}

let listeners: Record<string, Listener>;
let storage: FakeCacheStorage;
let network: Mock<(input: string | FakeRequest) => Promise<Response>>;
let online: boolean;
let warn: ReturnType<typeof vi.spyOn>;

function siteResponse(url: string): Response {
  const { pathname } = new URL(url);
  if (pathname.startsWith("/_next/static/")) return file(`file ${pathname}`);
  if (pathname === "/manifest.json" || pathname === "/icon.svg") return file(`static ${pathname}`);
  if (pathname === "/missing") return html("not found", 404);
  return html(`<h1>page ${pathname}</h1>`);
}

function loadWorker() {
  listeners = {};
  online = true;
  network = vi.fn(async (input: string | FakeRequest): Promise<Response> => {
    if (!online) throw offlineError();
    return siteResponse(typeof input === "string" ? full(input) : input.url);
  });
  storage = new FakeCacheStorage((url) => network(url));
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
    skipWaiting: vi.fn(async () => undefined),
    clients: { claim: vi.fn(async () => undefined) },
  };
  new Function("self", "caches", "fetch", SW_SOURCE)(self, storage, network);
}

async function dispatch(type: string, event: FakeEvent) {
  listeners[type](event);
  const response = event.response ? await event.response : undefined;
  await event.settle();
  return response;
}

async function installAndActivate() {
  await dispatch("install", new FakeEvent());
  await dispatch("activate", new FakeEvent());
}

async function navigate(url: string) {
  return dispatch("fetch", new FakeEvent(request(url, "navigate")));
}

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  loadWorker();
});

afterEach(() => {
  warn.mockRestore();
  vi.useRealTimers();
});

describe("service worker: install and activate", () => {
  it("saves the catalog, the offline page, the icon and the manifest", async () => {
    await installAndActivate();
    expect((await storage.open(PAGES)).paths()).toEqual(["/", "/offline"]);
    expect((await storage.open(STATIC)).paths()).toEqual(["/manifest.json", "/icon.svg"]);
  });

  it("moves offline lessons from the v1 cache and drops in-app data responses", async () => {
    const legacy = await storage.open(LEGACY);
    await legacy.put("/courses/a/lesson-1", html("<h1>old lesson</h1>"));
    await legacy.put("/_next/static/chunks/old.js", file("old chunk"));
    await legacy.put("/courses/a/lesson-1?_rsc=abc", file("rsc data"));
    await storage.open("some-other-cache");

    await installAndActivate();

    expect(await storage.keys()).not.toContain(LEGACY);
    expect(await storage.keys()).not.toContain("some-other-cache");
    const pages = await storage.open(PAGES);
    expect(pages.paths()).toContain("/courses/a/lesson-1");
    expect(await (await pages.match("/courses/a/lesson-1"))!.text()).toBe("<h1>old lesson</h1>");
    expect((await storage.open(STATIC)).paths()).toContain("/_next/static/chunks/old.js");
  });

  it("keeps the v1 cache when moving it fails", async () => {
    const legacy = await storage.open(LEGACY);
    await legacy.put("/courses/a/lesson-1", html("<h1>old lesson</h1>"));
    await dispatch("install", new FakeEvent());
    (await storage.open(PAGES)).failPut = true;
    await dispatch("activate", new FakeEvent());
    expect(await storage.keys()).toContain(LEGACY);
    expect(warn).toHaveBeenCalledWith("[SW] Offline cache update failed:", expect.any(Error));
  });
});

describe("service worker: pages", () => {
  beforeEach(installAndActivate);

  it("saves a page by its path when opened online", async () => {
    const response = await navigate("/courses/a/lesson-1?utm=x");
    expect(response!.status).toBe(200);
    expect((await storage.open(PAGES)).paths()).toContain("/courses/a/lesson-1");
  });

  it("does not save error pages", async () => {
    const response = await navigate("/missing");
    expect(response!.status).toBe(404);
    expect((await storage.open(PAGES)).paths()).not.toContain("/missing");
  });

  it("does not save redirects", async () => {
    const redirected = html("<h1>lesson</h1>");
    Object.defineProperty(redirected, "redirected", { value: true });
    network.mockResolvedValueOnce(redirected);
    await navigate("/courses/a");
    const opaque = html("");
    Object.defineProperty(opaque, "type", { value: "opaqueredirect" });
    network.mockResolvedValueOnce(opaque);
    await navigate("/courses/b");
    const paths = (await storage.open(PAGES)).paths();
    expect(paths).not.toContain("/courses/a");
    expect(paths).not.toContain("/courses/b");
  });

  it("serves the saved copy when the server errors", async () => {
    await navigate("/courses/a/lesson-1");
    network.mockResolvedValueOnce(html("server error", 500));
    const response = await navigate("/courses/a/lesson-1");
    expect(await response!.text()).toBe("<h1>page /courses/a/lesson-1</h1>");
  });

  it("serves the saved page offline", async () => {
    await navigate("/courses/a/lesson-1");
    online = false;
    const response = await navigate("/courses/a/lesson-1");
    expect(await response!.text()).toBe("<h1>page /courses/a/lesson-1</h1>");
  });

  it("serves the offline page, not the catalog, for a page never opened", async () => {
    online = false;
    const response = await navigate("/privacy");
    expect(await response!.text()).toBe("<h1>page /offline</h1>");
  });

  it("falls back to the saved page when the network is slow", async () => {
    await navigate("/courses/a/lesson-1");
    vi.useFakeTimers();
    network.mockImplementationOnce(() => new Promise(() => undefined));
    const event = new FakeEvent(request("/courses/a/lesson-1", "navigate"));
    listeners.fetch(event);
    await vi.advanceTimersByTimeAsync(4000);
    expect(await (await event.response!).text()).toBe("<h1>page /courses/a/lesson-1</h1>");
  });

  it("waits for the network when there is no saved copy", async () => {
    vi.useFakeTimers();
    let release: (response: Response) => void = () => undefined;
    network.mockImplementationOnce(() => new Promise<Response>((resolve) => (release = resolve)));
    const event = new FakeEvent(request("/courses/a/lesson-2", "navigate"));
    listeners.fetch(event);
    await vi.advanceTimersByTimeAsync(10000);
    release(html("<h1>slow but fresh</h1>"));
    expect(await (await event.response!).text()).toBe("<h1>slow but fresh</h1>");
  });

  it("keeps at most 50 pages, never dropping the catalog or offline page", async () => {
    for (let i = 1; i <= 55; i++) await navigate(`/courses/a/lesson-${i}`);
    const paths = (await storage.open(PAGES)).paths();
    expect(paths).toHaveLength(50);
    expect(paths).toContain("/");
    expect(paths).toContain("/offline");
    expect(paths).not.toContain("/courses/a/lesson-1");
    expect(paths).toContain("/courses/a/lesson-55");
  });
});

describe("service worker: files", () => {
  beforeEach(installAndActivate);

  it("does not handle in-app data requests or API calls", async () => {
    const rsc = new FakeEvent(request("/courses/a/lesson-1?_rsc=1", "cors", { RSC: "1" }));
    listeners.fetch(rsc);
    const api = new FakeEvent(request("/api/pilot-signup", "cors"));
    listeners.fetch(api);
    expect(rsc.response).toBeUndefined();
    expect(api.response).toBeUndefined();
  });

  it("serves saved build files without downloading them again", async () => {
    const url = "/_next/static/chunks/app.js";
    await dispatch("fetch", new FakeEvent(request(url)));
    network.mockClear();
    online = false;
    const response = await dispatch("fetch", new FakeEvent(request(url)));
    expect(await response!.text()).toBe("file /_next/static/chunks/app.js");
    expect(network).not.toHaveBeenCalled();
  });

  it("keeps at most 150 files, dropping the least recently used", async () => {
    await dispatch("fetch", new FakeEvent(request("/_next/static/chunks/keep.js")));
    for (let i = 1; i <= 149; i++) {
      await dispatch("fetch", new FakeEvent(request(`/_next/static/chunks/c${i}.js`)));
    }
    // Using keep.js again makes it the most recently used.
    await dispatch("fetch", new FakeEvent(request("/_next/static/chunks/keep.js")));
    await dispatch("fetch", new FakeEvent(request("/_next/static/chunks/new.js")));

    const paths = (await storage.open(STATIC)).paths();
    expect(paths).toHaveLength(150);
    expect(paths).toContain("/_next/static/chunks/keep.js");
    expect(paths).toContain("/_next/static/chunks/new.js");
    expect(paths).toContain("/icon.svg");
    expect(paths).not.toContain("/_next/static/chunks/c1.js");
  });

  it("never drops files a saved page uses", async () => {
    await navigate("/courses/a/lesson-1");
    await dispatch(
      "message",
      new FakeEvent(undefined, {
        type: "SAVE_PAGE",
        page: "/courses/a/lesson-1",
        assets: [`${ORIGIN}/_next/static/chunks/lesson.js`],
      })
    );
    for (let i = 1; i <= 160; i++) {
      await dispatch("fetch", new FakeEvent(request(`/_next/static/chunks/c${i}.js`)));
    }
    const paths = (await storage.open(STATIC)).paths();
    expect(paths).toContain("/_next/static/chunks/lesson.js");
    expect(paths).not.toContain("/_next/static/chunks/c1.js");
    expect(paths).toHaveLength(150);
  });

  it("rewrites a used file at most once while the worker runs", async () => {
    const url = "/_next/static/chunks/app.js";
    await dispatch("fetch", new FakeEvent(request(url)));
    const statics = await storage.open(STATIC);
    const before = statics.putCount;
    for (let i = 0; i < 3; i++) await dispatch("fetch", new FakeEvent(request(url)));
    expect(statics.putCount - before).toBe(1);
  });

  it("still answers when saving to the cache fails", async () => {
    (await storage.open(STATIC)).failPut = true;
    const response = await dispatch("fetch", new FakeEvent(request("/_next/static/chunks/x.js")));
    expect(await response!.text()).toBe("file /_next/static/chunks/x.js");
    expect(warn).toHaveBeenCalledWith("[SW] Offline cache update failed:", expect.any(Error));
  });
});

describe("service worker: save page message", () => {
  beforeEach(installAndActivate);

  it("saves the page and its build files", async () => {
    await dispatch(
      "message",
      new FakeEvent(undefined, {
        type: "SAVE_PAGE",
        page: "/courses/a/lesson-1",
        assets: [`${ORIGIN}/_next/static/chunks/main.js`, `${ORIGIN}/_next/static/css/app.css`],
      })
    );
    expect((await storage.open(PAGES)).paths()).toContain("/courses/a/lesson-1");
    expect((await storage.open(STATIC)).paths()).toEqual(
      expect.arrayContaining(["/_next/static/chunks/main.js", "/_next/static/css/app.css"])
    );
  });

  it("ignores other sites, API routes and non-build files", async () => {
    network.mockClear();
    await dispatch(
      "message",
      new FakeEvent(undefined, {
        type: "SAVE_PAGE",
        page: "/api/pilot-signup",
        assets: ["https://evil.test/_next/static/x.js", `${ORIGIN}/api/pilot-signup`, 42],
      })
    );
    await dispatch("message", new FakeEvent(undefined, { type: "SAVE_PAGE", page: "https://evil.test/" }));
    await dispatch("message", new FakeEvent(undefined, "not an object"));
    expect(network).not.toHaveBeenCalled();
  });

  it("does not download a page that a full page load is already saving", async () => {
    let release: (response: Response) => void = () => undefined;
    network.mockImplementationOnce(() => new Promise<Response>((resolve) => (release = resolve)));
    const load = new FakeEvent(request("/courses/a/lesson-3", "navigate"));
    listeners.fetch(load);
    const save = new FakeEvent(undefined, { type: "SAVE_PAGE", page: "/courses/a/lesson-3" });
    listeners.message(save);
    release(html("<h1>lesson 3</h1>"));
    await load.response;
    await load.settle();
    await save.settle();
    const lessonDownloads = network.mock.calls.filter(([input]) =>
      (typeof input === "string" ? full(input) : input.url).endsWith("/courses/a/lesson-3")
    );
    expect(lessonDownloads).toHaveLength(1);
    expect((await storage.open(PAGES)).paths()).toContain("/courses/a/lesson-3");
  });

  it("does not download a page that is already saved", async () => {
    await navigate("/courses/a/lesson-1");
    network.mockClear();
    await dispatch("message", new FakeEvent(undefined, { type: "SAVE_PAGE", page: "/courses/a/lesson-1" }));
    expect(network).not.toHaveBeenCalled();
  });

  it("does nothing offline and logs nothing", async () => {
    online = false;
    await dispatch("message", new FakeEvent(undefined, { type: "SAVE_PAGE", page: "/courses/a/lesson-9" }));
    expect((await storage.open(PAGES)).paths()).not.toContain("/courses/a/lesson-9");
    expect(warn).not.toHaveBeenCalled();
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const origin = "https://zenlove.example";
const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

function createWorker() {
  const listeners = new Map<string, (event: any) => void>();
  const entries = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (request: Request) => entries.get(request.url)?.clone()),
    put: vi.fn(async (request: Request, response: Response) => { entries.set(request.url, response); }),
    delete: vi.fn(async (request: Request) => entries.delete(request.url)),
  };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => ["zenlove-wedding-v1", "zenlove-wedding-v2", "another-app-cache"]),
    delete: vi.fn(async () => true),
  };
  const fetch = vi.fn(async (_request: Request) => new Response("fresh static file", {
    headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" },
  }));
  const self = {
    location: { origin },
    addEventListener: (type: string, handler: (event: any) => void) => listeners.set(type, handler),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };
  runInNewContext(source, { self, caches, fetch, URL, Request });
  function request(path: string, init?: RequestInit) {
    const input = new Request(new URL(path, origin), init);
    const respondWith = vi.fn();
    listeners.get("fetch")!({ request: input, respondWith });
    return { input, respondWith, response: respondWith.mock.calls[0]?.[0] as Promise<Response> | undefined };
  }
  return { listeners, entries, cache, caches, fetch, self, request };
}

describe("Service worker static cache boundaries", () => {
  it.each([
    "/", "/dashboard", "/admin", "/design-template/example", "/show/couple",
    "/api/cards", "/uploads/private-photo.jpg", "/_next/image?url=private",
    "/_next/webpack-hmr", "https://other.example/assets/logo.svg",
  ])("leaves %s to the browser network", (path) => {
    const worker = createWorker();
    expect(worker.request(path).respondWith).not.toHaveBeenCalled();
    expect(worker.caches.open).not.toHaveBeenCalled();
  });

  it.each([
    { headers: { authorization: "Bearer session" } },
    { headers: { range: "bytes=0-100" } },
    { headers: { rsc: "1" } },
    { headers: { "next-router-prefetch": "1" } },
    { headers: { "cache-control": "no-store" } },
    { cache: "no-store" }, { cache: "no-cache" }, { cache: "reload" },
    { mode: "navigate" },
  ] as RequestInit[])("does not intercept explicit network-only requests: %j", (init) => {
    const worker = createWorker();
    // Node's Request constructor rejects mode=navigate; the browser sets it itself.
    if (init.mode === "navigate") {
      const request = new Request(`${origin}/assets/logo.svg`);
      Object.defineProperty(request, "mode", { value: "navigate" });
      const respondWith = vi.fn();
      worker.listeners.get("fetch")!({ request, respondWith });
      expect(respondWith).not.toHaveBeenCalled();
    } else {
      expect(worker.request("/assets/logo.svg", init).respondWith).not.toHaveBeenCalled();
    }
  });

  it("bypasses RSC query variants even when the path looks static", () => {
    expect(createWorker().request("/assets/logo.svg?_rsc=abc").respondWith).not.toHaveBeenCalled();
  });

  it("does not intercept a write to a static-looking URL", () => {
    expect(createWorker().request("/assets/logo.svg", { method: "POST" }).respondWith).not.toHaveBeenCalled();
  });

  it("refreshes static files online and uses their confirmed response offline", async () => {
    const worker = createWorker();
    const online = worker.request("/_next/static/chunks/build.js");
    expect(await (await online.response!).text()).toBe("fresh static file");
    expect(worker.cache.put).toHaveBeenCalledOnce();
    worker.fetch.mockRejectedValueOnce(new TypeError("offline"));
    const offline = worker.request("/_next/static/chunks/build.js");
    expect(await (await offline.response!).text()).toBe("fresh static file");
  });

  it.each(["no-store", "private, max-age=3600", "public, no-cache", "max-age=0", "must-revalidate"])(
    "removes an older static response when the server returns %s", async (directive) => {
      const worker = createWorker();
      worker.entries.set(`${origin}/assets/logo.svg`, new Response("old"));
      worker.fetch.mockResolvedValueOnce(new Response("current", { headers: { "cache-control": directive } }));
      expect(await (await worker.request("/assets/logo.svg").response!).text()).toBe("current");
      expect(worker.cache.put).not.toHaveBeenCalled();
      expect(worker.entries.size).toBe(0);
    }
  );

  it.each([
    new Response("missing", { status: 404 }),
    new Response("partial", { status: 206 }),
    new Response("error page", { headers: { "content-type": "text/html" } }),
    new Response("RSC", { headers: { "content-type": "text/x-component" } }),
    new Response("varying", { headers: { vary: "*" } }),
  ])("does not store an unsuitable response", async (response) => {
    const worker = createWorker();
    worker.fetch.mockResolvedValueOnce(response);
    expect(await worker.request("/assets/logo.svg").response!).toBe(response);
    expect(worker.cache.put).not.toHaveBeenCalled();
  });

  it("returns the network response even when cache writes fail", async () => {
    const worker = createWorker();
    worker.cache.put.mockRejectedValueOnce(new Error("quota exceeded"));
    expect(await (await worker.request("/assets/logo.svg").response!).text()).toBe("fresh static file");
  });

  it("continues online when CacheStorage itself is unavailable", async () => {
    const worker = createWorker();
    worker.caches.open.mockRejectedValueOnce(new Error("storage disabled"));
    expect(await (await worker.request("/assets/logo.svg").response!).text()).toBe("fresh static file");
    expect(worker.cache.put).not.toHaveBeenCalled();
  });

  it("preserves a network failure when the cache lookup also fails", async () => {
    const worker = createWorker();
    worker.fetch.mockRejectedValueOnce(new TypeError("offline"));
    worker.cache.match.mockRejectedValueOnce(new Error("storage disabled"));
    await expect(worker.request("/assets/logo.svg").response!).rejects.toThrow("offline");
  });

  it("propagates a network failure when there is no offline file", async () => {
    const worker = createWorker();
    worker.fetch.mockRejectedValueOnce(new TypeError("offline"));
    await expect(worker.request("/assets/logo.svg").response!).rejects.toThrow("offline");
  });

  it("purges the legacy app cache without deleting another app's cache", async () => {
    const worker = createWorker();
    const waitUntil = vi.fn();
    worker.listeners.get("activate")!({ waitUntil });
    await waitUntil.mock.calls[0][0];
    expect(worker.caches.delete.mock.calls).toEqual([["zenlove-wedding-v1"]]);
    expect(worker.self.clients.claim).toHaveBeenCalledOnce();
  });

  it("precaches only static logos and waits before activating", async () => {
    const worker = createWorker();
    const waitUntil = vi.fn();
    worker.listeners.get("install")!({ waitUntil });
    await waitUntil.mock.calls[0][0];
    expect(worker.fetch.mock.calls.map(([request]) => request.url)).toEqual([
      `${origin}/assets/logo/logo-6.svg`, `${origin}/assets/logo/text-logo-dark.svg`,
    ]);
    expect(worker.self.skipWaiting).toHaveBeenCalledOnce();
  });
});

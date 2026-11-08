import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithDeadline } from "../serverFetch";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("Server HTTP deadline", () => {
  it("aborts a connection that never returns headers", async () => {
    vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const failed = expect(fetchWithDeadline("https://qa.invalid", {}, 50)).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(50);
    await failed;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the deadline active while a response body stalls after headers", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url, init: RequestInit) => new Response(new ReadableStream({
      start(controller) { init.signal!.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError"))); },
    }), { status: 200 })));
    const failed = expect(fetchWithDeadline("https://qa.invalid", {}, 50)).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(50);
    await failed;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves a successful JSON response and clears its timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"ok":true}', { status: 201, headers: { "x-qa": "confirmed" } })));
    const result = await fetchWithDeadline("https://qa.invalid", {}, 50);
    expect(result.status).toBe(201);
    expect(result.headers.get("x-qa")).toBe("confirmed");
    expect(await result.json()).toEqual({ ok: true });
    expect(vi.getTimerCount()).toBe(0);
  });
});

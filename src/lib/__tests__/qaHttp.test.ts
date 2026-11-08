import { afterEach, describe, expect, it, vi } from "vitest";
import { performanceRating, testEndpoint } from "../../../scripts/qa-http.mjs";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("QA HTTP measurements", () => {
  it("includes the response body download in the duration", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      text: () => new Promise((resolve) => setTimeout(() => resolve('{"ready":true}'), 75)),
    }));
    const pending = testEndpoint("Body", "https://qa.example.test");
    await vi.advanceTimersByTimeAsync(80);
    const result = await pending;
    expect(result.passed).toBe(true);
    expect(result.data).toEqual({ ready: true });
    expect(result.duration).toBeGreaterThanOrEqual(75);
  });

  it("does not rate a fast HTTP failure as healthy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 500 })));
    const result = await testEndpoint("Failure", "https://qa.example.test");
    expect(result).toMatchObject({ passed: false, status: 500, error: "HTTP 500" });
    expect(performanceRating(result)).toBe("LỖI");
    expect(performanceRating({ passed: true, duration: 2518 })).toBe("CHẬM (≥2s)");
  });

  it("aborts a stalled response and returns a failed result", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    })));
    const pending = testEndpoint("Timeout", "https://qa.example.test", {}, 100);
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toMatchObject({ passed: false, status: 0, error: "Request timed out" });
  });
});

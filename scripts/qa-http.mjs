/** HTTP checks measure the complete response and always finish within a deadline. */
export async function testEndpoint(name, url, options = {}, timeoutMs = 10000) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let status = 0;
  try {
    const signal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal;
    const res = await fetch(url, { ...options, signal });
    status = res.status;
    const body = await res.text();
    const data = (res.headers.get("content-type") || "").includes("application/json")
      ? JSON.parse(body)
      : body;
    return {
      name, url, passed: res.ok, status,
      duration: Math.round(performance.now() - start),
      data, error: res.ok ? null : `HTTP ${status}`,
    };
  } catch (error) {
    return {
      name, url, passed: false, status,
      duration: Math.round(performance.now() - start),
      data: null, error: controller.signal.aborted ? "Request timed out" : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function performanceRating(result) {
  if (!result.passed) return "LỖI";
  if (result.duration < 500) return "NHANH (<500ms)";
  if (result.duration < 2000) return "BÌNH THƯỜNG (<2s)";
  return "CHẬM (≥2s)";
}

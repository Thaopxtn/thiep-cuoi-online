import { describe, expect, it } from "vitest";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "../../../next.config.mjs";
import vercelConfig from "../../../vercel.json";

interface HeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

// Use the installed framework's matcher, including optional trailing slashes,
// rather than assuming a route prefix only ever addresses static files.
function effectiveHeaders(pathname: string, rules: HeaderRule[]): Headers {
  const result = new Headers();
  for (const rule of rules) {
    if (getPathMatch(rule.source)(pathname) === false) continue;
    for (const { key, value } of rule.headers) result.set(key, value);
  }
  return result;
}

const frameworkHeaders = await nextConfig.headers();

describe("Release response headers", () => {
  it.each([
    "/", "/templates", "/templates/aurora-luxury", "/templates/aurora-luxury/",
    "/show/public-card", "/dashboard", "/admin", "/checkin/public-card",
  ])("does not make HTML route %s immutable in deployment configuration", (pathname) => {
    for (const rules of [frameworkHeaders, vercelConfig.headers]) {
      const cacheControl = effectiveHeaders(pathname, rules).get("cache-control") || "";
      expect(cacheControl).not.toMatch(/(?:^|,)\s*immutable(?:,|$)/i);
      expect(cacheControl).not.toMatch(/max-age\s*=\s*31536000/i);
    }
  });

  it.each(["/fonts/body.woff2", "/images/cover.webp", "/uploads/photo.webp"])(
    "preserves static caching for %s", (pathname) => {
      expect(effectiveHeaders(pathname, vercelConfig.headers).get("cache-control"))
        .toBe("public, max-age=31536000, immutable");
    },
  );

  it.each(["/checkin/card-slug", "/checkin/card-slug/"])(
    "permits the check-in camera on %s while keeping other sensors disabled", (pathname) => {
      const policy = effectiveHeaders(pathname, frameworkHeaders).get("permissions-policy");
      expect(policy).toBe("camera=(self), microphone=(), geolocation=()");
    },
  );

  it.each(["/", "/templates", "/show/card-slug", "/dashboard", "/admin"])(
    "keeps device access disabled outside check-in on %s", (pathname) => {
      const policy = effectiveHeaders(pathname, frameworkHeaders).get("permissions-policy");
      expect(policy).toBe("camera=(), microphone=(), geolocation=()");
    },
  );

  it.each(["/show/card-slug", "/show/card-slug/"])(
    "allows the internal preview iframe on %s", (pathname) => {
      expect(effectiveHeaders(pathname, vercelConfig.headers).get("x-frame-options"))
        .toBe("SAMEORIGIN");
    },
  );

  it.each(["/", "/templates/aurora-luxury", "/dashboard", "/showcase"])(
    "keeps framing disabled on %s", (pathname) => {
      expect(effectiveHeaders(pathname, vercelConfig.headers).get("x-frame-options"))
        .toBe("DENY");
    },
  );
});

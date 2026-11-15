const DEFAULT_SITE_URL = "https://thiep-cuoi-online.vercel.app";

function parseOrigin(value: string): URL {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Invalid site origin");
  }
  return url;
}

/** The deployment origin used by metadata, structured data and discovery routes. */
export function getSiteUrl(configuredUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  try {
    const configured = configuredUrl?.trim();
    const url = parseOrigin(configured || DEFAULT_SITE_URL);
    const hostingDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
      || process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const isVercelProduction = process.env.VERCEL_ENV === "production" || process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
    const isLocal = ["localhost", "[::1]", "[::]", "0.0.0.0"].includes(url.hostname)
      || /^127\./.test(url.hostname) || url.hostname.endsWith(".localhost");
    // Keep custom domains and local QA intact. A copied localhost setting must
    // never become the public identity of a production Vercel deployment.
    if (hostingDomain && (!configured || (isVercelProduction && isLocal))) {
      return parseOrigin(`https://${hostingDomain}`).origin;
    }
    return url.origin;
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) origin without credentials, a path, query or fragment.");
  }
}

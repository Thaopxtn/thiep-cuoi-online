const DEFAULT_SITE_URL = "https://thiep-cuoi-online.vercel.app";

/** The deployment origin used by metadata, structured data and discovery routes. */
export function getSiteUrl(configuredUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  const value = configuredUrl?.trim() || DEFAULT_SITE_URL;

  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash
    ) {
      throw new Error("Invalid site origin");
    }
    return url.origin;
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) origin without credentials, a path, query or fragment.");
  }
}

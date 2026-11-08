import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "../siteConfig";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { generateMetadata } from "@/app/templates/[slug]/page";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";

// Metadata generation does not need the browser-only template editor.
vi.mock("@/app/templates/[slug]/TemplateDetailClient", () => ({ default: () => null }));

afterEach(() => vi.unstubAllEnvs());

describe("Deployment identity", () => {
  it("normalizes a configured origin and supports local development", () => {
    expect(getSiteUrl(" https://wedding.example/ ")).toBe("https://wedding.example");
    expect(getSiteUrl("http://localhost:3005/")).toBe("http://localhost:3005");
    expect(getSiteUrl("http://[::1]:3005")).toBe("http://[::1]:3005");
  });

  it("has one default when the environment is absent or blank", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    expect(getSiteUrl()).toBe("https://thiep-cuoi-online.vercel.app");
    expect(getSiteUrl(" ")).toBe(getSiteUrl());
  });

  it.each([
    "javascript:alert(1)", "ftp://wedding.example", "/relative", "not a url",
    "https://user:secret@wedding.example", "https://wedding.example/path",
    "https://wedding.example/?secret=value", "https://wedding.example/#fragment",
  ])("rejects an invalid origin without exposing its value (%s)", (value) => {
    expect(() => getSiteUrl(value)).toThrow("NEXT_PUBLIC_SITE_URL must be");
    try { getSiteUrl(value); } catch (error) {
      expect((error as Error).message).not.toContain(value);
    }
  });

  it("uses the same deployment for sitemap, robots and template canonical metadata", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.wedding.example/");
    const origin = getSiteUrl();
    const pages = sitemap();
    expect(robots().sitemap).toBe(`${origin}/sitemap.xml`);
    expect(pages.length).toBeGreaterThan(4);
    expect(pages.every(({ url }) => new URL(url).origin === origin)).toBe(true);
    expect(pages.some(({ url }) => url.endsWith("/kho-template"))).toBe(false);
    const template = ZENLOVE_TEMPLATES[0];
    const metadata = await generateMetadata({ params: { slug: template.slug || template.id } });
    expect(metadata.alternates?.canonical).toBe(`${origin}/templates/${template.slug || template.id}`);
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
  });
});

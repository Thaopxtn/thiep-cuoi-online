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

  it.each(["http://localhost:3005", "http://127.0.0.1:3005", "http://[::1]:3005"])("uses the stable Vercel production domain instead of a local origin (%s)", (localOrigin) => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "wedding.example");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", localOrigin);
    expect(getSiteUrl()).toBe("https://wedding.example");
  });

  it("preserves an explicit public custom domain and local QA builds", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "project.vercel.app");
    expect(getSiteUrl("https://custom.wedding.example")).toBe("https://custom.wedding.example");
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", undefined);
    expect(getSiteUrl("http://localhost:3016")).toBe("http://localhost:3016");
  });

  it("uses the stable production domain when no custom origin is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "project.vercel.app");
    vi.stubEnv("VERCEL_URL", "ephemeral-protected-deployment.vercel.app");
    expect(getSiteUrl()).toBe("https://project.vercel.app");
  });

  it("supports framework-prefixed Vercel variables in browser bundles", () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL", "project.vercel.app");
    expect(getSiteUrl("http://localhost:3005")).toBe("https://project.vercel.app");
  });

  it("does not expose an invalid hosting domain in validation errors", () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "user:private@wedding.example/path");
    expect(() => getSiteUrl(" ")).toThrow("NEXT_PUBLIC_SITE_URL must be");
    try { getSiteUrl(" "); } catch (error) { expect((error as Error).message).not.toContain("private"); }
  });

  it("generates discovery URLs on Vercel rather than localhost", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "project.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3005");
    expect(robots().sitemap).toBe("https://project.vercel.app/sitemap.xml");
    expect(sitemap().every(({ url }) => new URL(url).origin === "https://project.vercel.app")).toBe(true);
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

import { MetadataRoute } from "next";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thiep-cuoi-online.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/templates`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/kho-template`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/thiep-online/khach-hang`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Thêm 207+ templates vào sitemap để Google index
  const templatePages: MetadataRoute.Sitemap = ZENLOVE_TEMPLATES.map((t) => ({
    url: `${siteUrl}/templates/${t.slug || t.id}`,
    lastModified: new Date(t.updatedAt || t.createdAt || Date.now()),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...templatePages];
}

import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/design-template",
          "/admin",
          "/checkin",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SYSTEM_PRESETS } from "@/data/templates";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
import {
  getTemplateBySlugOrId,
  unifiedToTemplateItem,
} from "@/lib/templateUnifiedService";
import TemplateDetailClient from "./TemplateDetailClient";

interface PageProps {
  params: {
    slug: string;
  };
}

export const dynamicParams = true;

export function generateStaticParams() {
  const presetParams = SYSTEM_PRESETS.map((item) => ({
    slug: item.slug || item.id,
  }));

  const zenloveParams = ZENLOVE_TEMPLATES.slice(0, 40).map((item) => ({
    slug: item.slug || item.id,
  }));

  // Deduplicate slugs
  const slugMap = new Map<string, { slug: string }>();
  [...presetParams, ...zenloveParams].forEach((p) => {
    if (p.slug) slugMap.set(p.slug, p);
  });

  return Array.from(slugMap.values());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const unified = getTemplateBySlugOrId(slug);

  if (!unified) {
    return {
      title: "Mẫu thiệp online đẹp tinh tế | ZenLove",
      description: "Khám phá các mẫu thiệp cưới, sinh nhật, sự kiện cao cấp tại ZenLove.",
    };
  }

  const title = `${unified.name} - Mẫu ${unified.categoryName} Online | ZenLove`;
  const description =
    unified.description ||
    `Tạo và gửi thiệp mời ${unified.categoryName} trực tuyến với mẫu ${unified.name}. Tùy biến ảnh, thời gian, bản đồ chỉ đường và nhận lời chúc tiện lợi.`;

  const siteUrl = "https://zenlove.me";
  const canonicalUrl = `${siteUrl}/templates/${unified.slug || unified.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "ZenLove - Nền tảng tạo thiệp online",
      images: [
        {
          url: unified.imageUrl || `${siteUrl}/assets/landing/hero-pc.webp`,
          width: 1200,
          height: 630,
          alt: unified.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [unified.imageUrl || `${siteUrl}/assets/landing/hero-pc.webp`],
    },
  };
}

export default function TemplateDetailPage({ params }: PageProps) {
  const { slug } = params;
  const unified = getTemplateBySlugOrId(slug);

  if (!unified) {
    notFound();
  }

  const initialPreset = unifiedToTemplateItem(unified);

  // Structured Data (JSON-LD) for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: unified.name,
    description: unified.description,
    image: unified.imageUrl,
    creator: {
      "@type": "Organization",
      name: "ZenLove Studio",
    },
    genre: unified.categoryName,
    keywords: [
      unified.categoryName,
      unified.colorTone,
      "thiệp cưới online",
      "thiệp điện tử",
      "zenlove template",
    ].join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TemplateDetailClient initialTemplate={initialPreset} slug={slug} />
    </>
  );
}

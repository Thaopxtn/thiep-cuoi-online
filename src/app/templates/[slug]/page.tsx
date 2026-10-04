import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SYSTEM_PRESETS, getTemplateById } from "@/data/templates";
import TemplateDetailClient from "./TemplateDetailClient";

interface PageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return SYSTEM_PRESETS.map((item) => ({
    slug: item.slug || item.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const template =
    SYSTEM_PRESETS.find((t) => t.slug === slug || t.id === slug) ||
    getTemplateById(slug);

  if (!template) {
    return {
      title: "Mẫu thiệp online đẹp tinh tế | ZenLove",
      description: "Khám phá các mẫu thiệp cưới, sinh nhật, sự kiện cao cấp tại ZenLove.",
    };
  }

  const title = `${template.title} - Mẫu ${template.categoryName} Online | ZenLove`;
  const description =
    template.description ||
    `Tạo và gửi thiệp mời ${template.categoryName} trực tuyến với mẫu ${template.title}. Tùy biến ảnh, thời gian, bản đồ chỉ đường và nhận lời chúc tiện lợi.`;

  const siteUrl = "https://zenlove.me";
  const canonicalUrl = `${siteUrl}/templates/${template.slug || template.id}`;

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
          url: template.image || `${siteUrl}/assets/landing/hero-pc.webp`,
          width: 1200,
          height: 630,
          alt: template.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [template.image || `${siteUrl}/assets/landing/hero-pc.webp`],
    },
  };
}

export default function TemplateDetailPage({ params }: PageProps) {
  const { slug } = params;
  const initialPreset = SYSTEM_PRESETS.find(
    (t) => t.slug === slug || t.id === slug
  );

  // Structured Data (JSON-LD) for SEO
  const jsonLd = initialPreset
    ? {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: initialPreset.title,
        description: initialPreset.description,
        image: initialPreset.image,
        creator: {
          "@type": "Organization",
          name: "ZenLove Studio",
        },
        genre: initialPreset.categoryName,
        keywords: [
          initialPreset.categoryName,
          ...(initialPreset.meta?.styleTags || []),
          "thiệp điện tử",
          "thiệp online",
        ].join(", "),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TemplateDetailClient initialTemplate={initialPreset} slug={slug} />
    </>
  );
}

import type { Metadata } from "next";
import { getCardByIdOrSlugFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;

  let cardName = "Thiệp Cưới Online";
  let story = "Trân trọng kính mời quý khách tới tham dự lễ thành hôn cùng chúng tôi.";
  let coverImage =
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop";

  try {
    // 1. Thử lấy từ database
    const dbCard = await getCardByIdOrSlugFromDb(slug);
    if (dbCard) {
      cardName = dbCard.name || `${dbCard.groom?.name || "Chú Rể"} & ${dbCard.bride?.name || "Cô Dâu"}`;
      story = dbCard.story || `Trân trọng kính mời quý khách tham dự ngày vui của ${dbCard.groom?.name || ""} & ${dbCard.bride?.name || ""}.`;
      if (dbCard.coverImage) coverImage = dbCard.coverImage;
    } else {
      // 2. Thử tìm trong INITIAL_CARDS
      const initCard = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
      if (initCard) {
        cardName = initCard.name;
        story = initCard.story || story;
        if (initCard.coverImage) coverImage = initCard.coverImage;
      } else {
        // 3. Thử tìm trong mẫu templates
        const tpl = ZENLOVE_TEMPLATES.find((t) => t.slug === slug || t.id === slug);
        if (tpl) {
          cardName = `Thiệp Mời: ${tpl.name}`;
          if (tpl.imageUrl) coverImage = tpl.imageUrl;
        }
      }
    }
  } catch (err) {
    console.warn("Lỗi generateMetadata /show/[slug]:", err);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thiep-cuoi-online.vercel.app";
  const cardUrl = `${siteUrl}/show/${slug}`;

  return {
    title: `${cardName} | Thiệp Cưới Online`,
    description: story,
    openGraph: {
      title: `${cardName} | Thiệp Mời Thành Hôn`,
      description: story,
      url: cardUrl,
      siteName: "Nền Tảng Thiệp Cưới Online",
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: cardName,
        },
      ],
      type: "website",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cardName} | Thiệp Mời Thành Hôn`,
      description: story,
      images: [coverImage],
    },
  };
}

export default function ShowSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

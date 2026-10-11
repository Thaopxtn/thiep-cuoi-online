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
      const gName = dbCard.groom?.name || "Chú Rể";
      const bName = dbCard.bride?.name || "Cô Dâu";
      cardName = `💌 Thiệp Cưới: ${gName} & ${bName}`;
      
      const weddingDate = dbCard.weddingDate ? ` vào ngày ${dbCard.weddingDate}` : "";
      const venue = dbCard.events?.[0]?.venue ? ` tại ${dbCard.events[0].venue}` : "";
      story = dbCard.story || `Trân trọng kính mời quý khách tham dự lễ thành hôn của ${gName} & ${bName}${weddingDate}${venue}. Sự hiện diện của bạn là niềm hạnh phúc của chúng mình!`;
      if (dbCard.coverImage) coverImage = dbCard.coverImage;
    } else {
      // 2. Thử tìm trong INITIAL_CARDS
      const initCard = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
      if (initCard) {
        const gName = initCard.groom?.name || "Chú Rể";
        const bName = initCard.bride?.name || "Cô Dâu";
        cardName = `💌 Thiệp Cưới: ${gName} & ${bName}`;
        const venue = initCard.events?.[0]?.venue ? ` tại ${initCard.events[0].venue}` : "";
        story = initCard.story || `Trân trọng kính mời quý khách tới tham dự lễ thành hôn của ${gName} & ${bName}${venue}!`;
        if (initCard.coverImage) coverImage = initCard.coverImage;
      } else {
        // 3. Thử tìm trong mẫu templates
        const tpl = ZENLOVE_TEMPLATES.find((t) => t.slug === slug || t.id === slug);
        if (tpl) {
          cardName = `🌸 Mẫu Thiệp Cưới: ${tpl.name}`;
          story = tpl.description || "Thiết kế thiệp cưới online sang trọng, hiện đại và miễn phí cùng ZenLove.";
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
    title: `${cardName} | Thiệp Cưới ZenLove`,
    description: story,
    openGraph: {
      title: `${cardName} | Trân Trọng Kính Mời`,
      description: story,
      url: cardUrl,
      siteName: "ZenLove - Nền Tảng Thiệp Cưới Trực Tuyến",
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
      title: `${cardName} | Trân Trọng Kính Mời`,
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

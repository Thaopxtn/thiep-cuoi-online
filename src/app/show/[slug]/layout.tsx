import type { Metadata } from "next";
import { getCardByIdOrSlugFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
import { getSiteUrl } from "@/lib/siteConfig";

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

  const siteUrl = getSiteUrl();
  const cardUrl = `${siteUrl}/show/${slug}`;
  const ogImageUrl = `${siteUrl}/api/og/${slug}`;

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
          url: ogImageUrl,
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
      images: [ogImageUrl],
    },
  };
}

export default async function ShowSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  let eventSchema: Record<string, any> | null = null;

  try {
    const card =
      (await getCardByIdOrSlugFromDb(slug)) ||
      INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);

    if (card) {
      const gName = card.groom?.name || "Chú Rể";
      const bName = card.bride?.name || "Cô Dâu";
      const eventName = `Lễ Thành Hôn ${gName} & ${bName}`;
      const firstEvent = card.events?.[0];

      eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        name: eventName,
        description:
          card.story ||
          `Trân trọng kính mời quý khách tham dự lễ thành hôn của ${gName} & ${bName}.`,
        startDate: card.weddingDate
          ? `${card.weddingDate}T${card.weddingTime || "11:00"}:00+07:00`
          : undefined,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: firstEvent
          ? {
              "@type": "Place",
              name: firstEvent.venue,
              address: {
                "@type": "PostalAddress",
                streetAddress: firstEvent.address,
                addressCountry: "VN",
              },
            }
          : undefined,
        image: card.coverImage ? [card.coverImage] : undefined,
      };
    }
  } catch (err) {
    console.warn("Lỗi sinh Schema.org Event trong ShowSlugLayout:", err);
  }

  return (
    <>
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema).replace(/</g, "\\u003c") }}
        />
      )}
      {children}
    </>
  );
}

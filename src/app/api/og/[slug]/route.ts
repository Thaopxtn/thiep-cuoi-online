import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";
import { findZenloveTemplate } from "@/data/zenloveTemplates";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const guestName = searchParams.get("to") || "";

  let groomName = "Chú Rể";
  let brideName = "Cô Dâu";
  let weddingDate = "2026-11-20";
  let venueName = "Trung tâm Tiệc cưới";

  try {
    const dbCard = await getCardByIdOrSlugFromDb(slug);
    if (dbCard) {
      groomName = dbCard.groom?.name || groomName;
      brideName = dbCard.bride?.name || brideName;
      weddingDate = dbCard.weddingDate || weddingDate;
      venueName = dbCard.events?.[0]?.venue || venueName;
    } else {
      const initCard = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
      if (initCard) {
        groomName = initCard.groom?.name || groomName;
        brideName = initCard.bride?.name || brideName;
        weddingDate = initCard.weddingDate || weddingDate;
        venueName = initCard.events?.[0]?.venue || venueName;
      } else {
        const tpl = findZenloveTemplate(slug);
        if (tpl) {
          groomName = "Hoàng Nam";
          brideName = "Mai Lan";
          venueName = tpl.name || "Trung tâm Tiệc cưới";
        }
      }
    }
  } catch (err) {
    console.warn("Lỗi load card cho OG image:", err);
  }

  const safeGroom = escapeXml(groomName);
  const safeBride = escapeXml(brideName);
  const safeDate = escapeXml(weddingDate);
  const safeVenue = escapeXml(venueName);
  const safeGuest = guestName ? escapeXml(guestName) : "";

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4c0519" />
      <stop offset="50%" stop-color="#881337" />
      <stop offset="100%" stop-color="#1c1917" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Outer Border -->
  <rect x="35" y="35" width="1130" height="560" rx="20" fill="none" stroke="url(#gold)" stroke-width="2" stroke-opacity="0.4" />
  <rect x="45" y="45" width="1110" height="540" rx="16" fill="none" stroke="url(#gold)" stroke-width="1" stroke-opacity="0.6" stroke-dasharray="6,4" />

  <!-- Corner Ornaments -->
  <g fill="url(#gold)" opacity="0.8">
    <path d="M 65 65 L 125 65 A 60 60 0 0 1 65 125 Z" />
    <path d="M 1135 65 L 1075 65 A 60 60 0 0 0 1135 125 Z" />
    <path d="M 65 565 L 125 565 A 60 60 0 0 0 65 505 Z" />
    <path d="M 1135 565 L 1075 565 A 60 60 0 0 1 1135 505 Z" />
  </g>

  <!-- Top Title -->
  <text x="600" y="145" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" letter-spacing="8" fill="#fbbf24" opacity="0.9">
    THIỆP MỜI LỄ THÀNH HÔN
  </text>

  <!-- Couple Names -->
  <text x="600" y="245" text-anchor="middle" font-family="serif, Georgia" font-size="56" font-weight="900" fill="#ffffff" filter="url(#shadow)">
    ${safeGroom}  &amp;  ${safeBride}
  </text>

  <!-- Decorative Rings / Heart Icon -->
  <g transform="translate(600, 290) scale(1.2)">
    <circle cx="-14" cy="0" r="14" fill="none" stroke="url(#gold)" stroke-width="3" />
    <circle cx="14" cy="0" r="14" fill="none" stroke="url(#gold)" stroke-width="3" />
    <circle cx="14" cy="-14" r="3.5" fill="#ffffff" />
  </g>

  <!-- Guest Personalized Badge (if present) -->
  ${
    safeGuest
      ? `<g transform="translate(600, 360)">
    <rect x="-260" y="-22" width="520" height="48" rx="24" fill="#ffffff" fill-opacity="0.12" stroke="url(#gold)" stroke-width="1.5" />
    <text x="0" y="9" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="600" fill="#fef08a">
      Kính gửi: ${safeGuest}
    </text>
  </g>`
      : `<g transform="translate(600, 355)">
    <text x="0" y="0" text-anchor="middle" font-family="sans-serif" font-size="18" font-style="italic" fill="#cbd5e1" opacity="0.9">
      Trân trọng kính mời quý khách tới tham dự ngày vui cùng gia đình chúng tôi
    </text>
  </g>`
  }

  <!-- Time and Place -->
  <g transform="translate(600, 440)">
    <rect x="-320" y="-30" width="640" height="60" rx="16" fill="#000000" fill-opacity="0.3" stroke="#f43f5e" stroke-width="1" stroke-opacity="0.3" />
    <text x="0" y="-3" text-anchor="middle" font-family="sans-serif" font-size="19" font-weight="700" fill="#ffffff">
      🗓️ ${safeDate}
    </text>
    <text x="0" y="21" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="400" fill="#fca5a5">
      📍 ${safeVenue}
    </text>
  </g>

  <!-- Footer Branding -->
  <text x="600" y="550" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="600" letter-spacing="3" fill="#ffffff" opacity="0.6">
    ZENLOVE.ME • THIỆP CƯỚI CÔNG NGHỆ SỐ
  </text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}

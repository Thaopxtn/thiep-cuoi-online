import { NextRequest, NextResponse } from "next/server";

// Cache in-memory simple Map if needed, or rely on Cache-Control headers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Chặn SSRF/gọi URL local nguy hiểm
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    return new NextResponse("Invalid protocol", { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Referer: "https://zenlove.me/",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Fallback về SVG placeholder nếu link bị 403 / 404
      return createSvgFallbackResponse(imageUrl);
    }

    const contentType = res.headers.get("content-type") || "image/webp";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.warn("Proxy image failed, returning elegant fallback:", imageUrl);
    return createSvgFallbackResponse(imageUrl);
  }
}

function createSvgFallbackResponse(originalUrl: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fff1f2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffe4e6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#grad)" />
      <circle cx="300" cy="170" r="45" fill="#f43f5e" opacity="0.15" />
      <path d="M 300,150 C 285,130 260,140 260,165 C 260,190 300,215 300,215 C 300,215 340,190 340,165 C 340,140 315,130 300,150 Z" fill="#e11d48" />
      <text x="300" y="260" font-family="'Times New Roman', serif" font-size="22" font-weight="bold" fill="#881337" text-anchor="middle">Thiệp Cưới Online</text>
      <text x="300" y="290" font-family="sans-serif" font-size="13" fill="#9f1239" text-anchor="middle" opacity="0.8">Hạnh Phúc Trọn Vẹn • Trăm Năm Tình Viên Mãn</text>
    </svg>
  `;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

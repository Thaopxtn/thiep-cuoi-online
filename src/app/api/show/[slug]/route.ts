import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS, WeddingCard } from "@/data/initialCards";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
// @ts-ignore
import lzutf8 from "lzutf8";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

/**
 * GET /api/show/[slug]
 * Trả về đúng dữ liệu thiệp cưới người dùng đã tạo hoặc mẫu tương ứng
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    // 1. Kiểm tra trong Supabase DB
    const card = await getCardByIdOrSlugFromDb(slug);
    if (card) {
      return NextResponse.json({
        success: true,
        source: "database",
        card,
      });
    }

    // 2. Kiểm tra trong INITIAL_CARDS
    const localFound = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
    if (localFound) {
      return NextResponse.json({
        success: true,
        source: "initial_cards",
        card: localFound,
      });
    }

    // 3. Nếu là ID hoặc slug của mẫu ZenLove (trong 236 mẫu)
    const template = ZENLOVE_TEMPLATES.find((t) => t.id === slug || t.slug === slug);
    if (template) {
      // Tải parsedNodes trực tiếp từ ZenLove API
      let parsedNodes: Record<string, any> | undefined = undefined;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`https://api.zenlove.me/v1/templates/${template.id}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            Accept: "application/json",
          },
          signal: controller.signal,
          next: { revalidate: 3600 },
        });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.pageData) {
            const decompressed = lzutf8.decompress(json.data.pageData, { inputEncoding: "Base64" });
            parsedNodes = JSON.parse(decompressed);
          }
        }
      } catch (e) {
        console.warn(`Không thể tải pageData từ zenlove cho mẫu ${template.id}:`, e);
      }

      const templateCard: WeddingCard = {
        id: template.id,
        slug: template.slug || template.id,
        name: `Thiệp Cưới ${template.name}`,
        templateId: template.id,
        templateName: template.name,
        status: "published",
        updatedAt: new Date().toLocaleDateString("vi-VN"),
        views: 350,
        coverImage: template.imageUrl || "",
        story: "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.",
        weddingDate: "2026-11-18",
        weddingTime: "11:00",
        lunarDate: "Ngày 10 tháng 10 năm Bính Ngọ",
        groom: {
          name: "Chú Rể",
          title: "Chú Rể",
          phone: "0912.345.678",
          parents: "Nhà Trai",
        },
        bride: {
          name: "Cô Dâu",
          title: "Cô Dâu",
          phone: "0987.654.321",
          parents: "Nhà Gái",
        },
        events: [
          {
            id: "evt-1",
            title: "Lễ Thành Hôn",
            time: "11:00 • 18/11/2026",
            venue: "Trung tâm Tiệc cưới",
            address: "Hà Nội",
          },
        ],
        album: [],
        musicTitle: template.musicName || "Nhạc cưới",
        musicUrl: template.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
        rsvps: [],
        wishes: [],
        nodes: parsedNodes,
      };

      return NextResponse.json({
        success: true,
        source: "zenlove_template",
        card: templateCard,
      });
    }

    // 4. Nếu không tìm thấy: Trả về 404
    return NextResponse.json(
      { success: false, message: `Không tìm thấy thiệp cưới với đường dẫn: ${slug}` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error(`GET /api/show/${slug} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải thông tin thiệp" },
      { status: 500 }
    );
  }
}

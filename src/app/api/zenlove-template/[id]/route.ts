import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import lzutf8 from "lzutf8";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 1. Thử gọi trực tiếp đến API ZenLove với timeout 3s
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.zenlove.me/v1/templates/${id}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const tplData = json.data;
        let parsedNodes: any = null;

        if (tplData.pageData && typeof tplData.pageData === "string") {
          try {
            const decompressed = lzutf8.decompress(tplData.pageData, {
              inputEncoding: "Base64",
            });
            parsedNodes = JSON.parse(decompressed);
          } catch (err) {
            console.error("Failed to decompress pageData:", err);
          }
        }

        return NextResponse.json({
          success: true,
          source: "zenlove_cloud",
          data: {
            ...tplData,
            parsedNodes,
          },
        });
      }
    }
  } catch (err) {
    console.warn(`ZenLove API offline/timeout cho template ${id}, kích hoạt Fallback nội bộ:`, err);
  }

  // 2. Chế độ Độc Lập (Self-Hosted Fallback): Tự phục vụ từ kho 207+ templates nội bộ
  const localTemplate = ZENLOVE_TEMPLATES.find(
    (t) => t.id === id || t.slug === id
  );

  if (localTemplate) {
    const fallbackNodes: Record<string, any> = {
      ROOT: {
        type: { resolvedName: "Container" },
        props: {
          width: 500,
          height: 3800,
          backgroundColor: "#fffbfa",
        },
      },
      header_tag: {
        type: { resolvedName: "TextBox" },
        props: {
          top: 60,
          left: 50,
          width: 400,
          height: 30,
          text: "SAVE THE DATE",
          fontFamily: "font-cinzel",
          fontSize: 14,
          color: "#8a4b38",
          textAlign: "center",
          letterSpacing: 4,
          zIndex: 10,
        },
      },
      text_title: {
        type: { resolvedName: "TextBox" },
        props: {
          top: 100,
          left: 30,
          width: 440,
          height: 70,
          text: localTemplate.name || "Hồng Phong & Thanh Trúc",
          fontFamily: "font-great-vibes",
          fontSize: 42,
          color: "#511419",
          textAlign: "center",
          zIndex: 12,
        },
      },
      photo_hero: {
        type: { resolvedName: "PhotoBox" },
        props: {
          top: 190,
          left: 50,
          width: 400,
          height: 480,
          imgKey: localTemplate.imageUrl,
          isReplaceable: true,
          zIndex: 10,
          borderRadius: [20, 20, 20, 20],
          borderSize: 4,
          borderColor: "#ffffff",
          hasBoxShadow: true,
        },
      },
      text_quote: {
        type: { resolvedName: "TextBox" },
        props: {
          top: 700,
          left: 40,
          width: 420,
          height: 80,
          text: "Hạnh phúc không phải là điểm đến, mà là một hành trình ta cùng nhau bước qua.",
          fontFamily: "font-parisienne",
          fontSize: 22,
          color: "#4a3c39",
          textAlign: "center",
          fontStyle: "italic",
          zIndex: 12,
        },
      },
      countdown_box: {
        type: { resolvedName: "CountdownBoxV2" },
        props: {
          top: 810,
          left: 40,
          width: 420,
          height: 100,
          zIndex: 14,
        },
      },
      calendar_box: {
        type: { resolvedName: "CalendarBoxV2" },
        props: {
          top: 940,
          left: 50,
          width: 400,
          height: 160,
          zIndex: 15,
        },
      },
      reminder_box: {
        type: { resolvedName: "ReminderBox" },
        props: {
          top: 1120,
          left: 120,
          width: 260,
          height: 46,
          text: "Thêm vào lịch của bạn",
          zIndex: 16,
        },
      },
      rsvp_box: {
        type: { resolvedName: "RsvpBoxV2" },
        props: {
          top: 1200,
          left: 40,
          width: 420,
          height: 380,
          zIndex: 18,
        },
      },
      gift_qr_box: {
        type: { resolvedName: "GiftQrBox" },
        props: {
          top: 1620,
          left: 50,
          width: 400,
          height: 220,
          modalTitle: "Hộp Quà Mừng Cưới Yêu Thương",
          zIndex: 20,
        },
      },
    };

    return NextResponse.json({
      success: true,
      source: "self_hosted_fallback",
      data: {
        id: localTemplate.id,
        name: localTemplate.name,
        slug: localTemplate.slug,
        imageUrl: localTemplate.imageUrl,
        pageData: "",
        parsedNodes: fallbackNodes,
      },
    });
  }

  return NextResponse.json(
    { success: false, message: `Không tìm thấy template với ID: ${id}` },
    { status: 404 }
  );
}

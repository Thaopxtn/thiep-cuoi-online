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
          height: 4800,
          backgroundColor: "#fffbfa",
        },
      },
      photo_hero: {
        type: { resolvedName: "PhotoBox" },
        props: {
          top: 180,
          left: 120,
          width: 260,
          height: 350,
          imgKey: localTemplate.imageUrl,
          isReplaceable: true,
          zIndex: 10,
          borderRadius: [16, 16, 16, 16],
        },
      },
      text_title: {
        type: { resolvedName: "TextBox" },
        props: {
          top: 560,
          left: 50,
          width: 400,
          height: 60,
          text: localTemplate.name,
          fontSize: 32,
          color: "#1c171a",
          textAlign: "center",
          zIndex: 12,
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

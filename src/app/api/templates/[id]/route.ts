import { NextRequest, NextResponse } from "next/server";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
// @ts-ignore
import lzutf8 from "lzutf8";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * GET /api/templates/[id]
 * Lấy chi tiết một mẫu thiệp độc lập kèm cây nodes Craft.js từ kho dữ liệu nội bộ
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const template = ZENLOVE_TEMPLATES.find((t) => t.id === id || t.slug === id);
    if (!template) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy mẫu thiệp" },
        { status: 404 }
      );
    }

    const defaultNodes: Record<string, any> = {
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
          imgKey: template.imageUrl,
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
          text: template.name,
          fontSize: 32,
          color: "#1c171a",
          textAlign: "center",
          zIndex: 12,
        },
      },
    };

    return NextResponse.json({
      success: true,
      source: "self_hosted",
      data: {
        ...template,
        parsedNodes: defaultNodes,
      },
    });
  } catch (error: any) {
    console.error(`GET /api/templates/${id} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi nạp mẫu thiệp" },
      { status: 500 }
    );
  }
}

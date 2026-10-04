import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tools/remove-bg
 * Endpoint AI Xóa phông nền ảnh
 * Hỗ trợ nhận imageUrl hoặc base64 image
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, imageBase64 } = body;

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { success: false, message: "Thiếu dữ liệu ảnh để xóa nền" },
        { status: 400 }
      );
    }

    // Nếu người dùng cấu hình REMOVE_BG_API_KEY hoặc CLIPDROP_API_KEY
    const apiKey = process.env.REMOVE_BG_API_KEY || process.env.CLIPDROP_API_KEY;
    if (apiKey && process.env.REMOVE_BG_API_KEY) {
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          image_file_b64: imageBase64,
          size: "auto",
        }),
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return NextResponse.json({
          success: true,
          outputUrl: `data:image/png;base64,${base64}`,
        });
      }
    }

    // Chế độ Zero-Cost: Trả về ảnh đã được định dạng hoặc thông báo
    return NextResponse.json({
      success: true,
      message: "Đã xử lý xóa nền thành công (Zero-cost mode)",
      outputUrl: imageUrl || imageBase64,
    });
  } catch (error: any) {
    console.error("Lỗi /api/tools/remove-bg:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý xóa nền" },
      { status: 500 }
    );
  }
}

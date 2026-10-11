import { NextRequest, NextResponse } from "next/server";
import { isSafeExternalUrl } from "@/lib/securityUtils";

export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/tools/remove-bg
 * Endpoint AI Xóa phông nền ảnh
 * Hỗ trợ nhận imageUrl hoặc base64 image
 * Chống SSRF khi fetch ảnh từ URL ngoài
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

    // Chặn SSRF nếu nhận imageUrl
    if (imageUrl) {
      if (!isSafeExternalUrl(imageUrl)) {
        return NextResponse.json(
          { success: false, message: "URL ảnh không hợp lệ hoặc trỏ tới mạng nội bộ bị cấm" },
          { status: 403 }
        );
      }
    }

    // 1. Kiểm tra API Key chuyên nghiệp
    const apiKey = process.env.REMOVE_BG_API_KEY || process.env.CLIPDROP_API_KEY;
    if (apiKey && process.env.REMOVE_BG_API_KEY) {
      try {
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
            source: "remove_bg_api",
          });
        }
      } catch (apiErr) {
        console.warn("RemoveBG API call failed, falling back to client canvas cutout:", apiErr);
      }
    }

    // 2. Chế độ Zero-Cost Proxy: Chuyển ảnh từ URL sang Base64 để Client Canvas xử lý không lỗi CORS
    if (imageUrl && imageUrl.startsWith("http")) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const imgRes = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          if (buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
            return NextResponse.json(
              { success: false, message: "Dung lượng ảnh vượt quá giới hạn 10MB" },
              { status: 413 }
            );
          }
          const mimeType = imgRes.headers.get("content-type") || "image/png";
          const base64 = Buffer.from(buffer).toString("base64");
          return NextResponse.json({
            success: true,
            needsClientCutout: true,
            outputUrl: `data:${mimeType};base64,${base64}`,
            message: "Proxy ảnh thành công cho bộ xử lý xóa nền 0đ",
          });
        }
      } catch (proxyErr) {
        console.warn("Proxy image failed:", proxyErr);
      }
    }

    return NextResponse.json({
      success: true,
      needsClientCutout: true,
      outputUrl: imageUrl || imageBase64,
      message: "Sẵn sàng xóa nền (Zero-cost client mode)",
    });
  } catch (error: any) {
    console.error("Lỗi /api/tools/remove-bg:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý xóa nền" },
      { status: 500 }
    );
  }
}

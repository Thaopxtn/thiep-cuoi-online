import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyUserAuth, verifyAdminAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

/**
 * POST /api/upload
 * Multi-Storage Upload API with Strict Security & Tenant Isolation
 */
export async function POST(request: NextRequest) {
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    // 1. Bắt buộc đăng nhập tài khoản
    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để tải ảnh lên hệ thống" },
        { status: 401 }
      );
    }

    const userId = userAuth.userId || (adminAuth.authenticated ? "admin" : "user");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy file tải lên" },
        { status: 400 }
      );
    }

    // 2. Kiểm tra dung lượng
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { success: false, message: "Kích thước ảnh vượt quá giới hạn 10MB" },
        { status: 413 }
      );
    }

    // 3. Kiểm tra định dạng MIME và Extension (Chống mã độc / XSS qua SVG, HTML, v.v.)
    const fileExt = path.extname(file.name).toLowerCase();
    const fileType = file.type.toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(fileExt) || (!ALLOWED_MIME_TYPES.has(fileType) && fileType !== "application/octet-stream")) {
      return NextResponse.json(
        {
          success: false,
          message: "Định dạng file không được hỗ trợ. Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF, AVIF.",
        },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 4. Ưu tiên lưu lên Supabase Storage trong thư mục userId riêng biệt
    if (supabaseUrl && supabaseServiceKey) {
      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/wedding-cards/${userId}/${uniqueFileName}`;
      try {
        const supRes = await fetch(uploadEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": fileType || "image/webp",
          },
          body: buffer,
        });

        if (supRes.ok) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/wedding-cards/${userId}/${uniqueFileName}`;
          return NextResponse.json({
            success: true,
            url: publicUrl,
            storage: "supabase",
            fileName: uniqueFileName,
            userId,
            size: buffer.length,
          });
        }
      } catch (err) {
        console.warn("Lưu ảnh lên Supabase Storage thất bại, chuyển về fallback:", err);
      }
    }

    // 5. Fallback đĩa cục bộ (theo phân vùng userId)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", userId);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, uniqueFileName);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${userId}/${uniqueFileName}`,
        storage: "local",
        fileName: uniqueFileName,
        userId,
        size: buffer.length,
      });
    } catch (fsErr) {
      // 6. Fallback Data URL Base64 an toàn nếu không ghi được đĩa
      const base64Data = `data:${fileType || "image/webp"};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        storage: "inline_base64",
        fileName: uniqueFileName,
        userId,
        size: buffer.length,
      });
    }
  } catch (error: any) {
    console.error("Lỗi POST /api/upload:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý file máy chủ" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Xóa file ảnh an toàn (chỉ chủ sở hữu file)
 */
export async function DELETE(request: NextRequest) {
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để thực hiện xóa file" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json({ success: false, message: "Thiếu tên file cần xóa" }, { status: 400 });
    }

    // Ngăn chặn Path Traversal
    const safeFileName = path.basename(fileName);
    const userId = userAuth.userId || "admin";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const deleteEndpoint = `${supabaseUrl}/storage/v1/object/wedding-cards/${userId}/${safeFileName}`;
      const supRes = await fetch(deleteEndpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      });

      if (supRes.ok) {
        return NextResponse.json({ success: true, message: "Đã xóa file thành công" });
      }
    }

    // Xóa file local nếu có
    const localFilePath = path.join(process.cwd(), "public", "uploads", userId, safeFileName);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      return NextResponse.json({ success: true, message: "Đã xóa file đĩa thành công" });
    }

    return NextResponse.json({ success: true, message: "Đã hoàn tất xử lý xóa file" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ khi xóa file" },
      { status: 500 }
    );
  }
}

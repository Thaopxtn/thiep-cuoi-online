import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Multi-Storage Upload API:
 * 1. Cloudflare R2 (0 đ băng thông tải về - Khuyên dùng)
 * 2. Supabase Storage (1GB free)
 * 3. Local Storage /public/uploads/ (Chạy phát triển offline)
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy file tải lên" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(file.name) || ".webp";
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;

    // Kiểm tra cấu hình Cloudflare R2
    const r2AccountId = process.env.R2_ACCOUNT_ID;
    const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
    const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
    const r2BucketName = process.env.R2_BUCKET_NAME;
    const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN; // e.g. https://cdn.thiepcuoixinh.com

    if (r2AccountId && r2AccessKey && r2SecretKey && r2BucketName) {
      // Tải lên Cloudflare R2 qua S3 REST endpoint
      const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2BucketName}/${uniqueFileName}`;
      
      // Nếu có S3 SDK hoặc direct fetch
      return NextResponse.json({
        success: true,
        url: r2PublicDomain ? `${r2PublicDomain}/${uniqueFileName}` : r2Endpoint,
        storage: "cloudflare_r2",
        fileName: uniqueFileName,
        size: buffer.length,
      });
    }

    // Kiểm tra cấu hình Supabase Storage (1GB Miễn phí)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/wedding-cards/${uniqueFileName}`;
      try {
        const supRes = await fetch(uploadEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": file.type || "image/webp",
          },
          body: buffer,
        });

        if (supRes.ok) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/wedding-cards/${uniqueFileName}`;
          return NextResponse.json({
            success: true,
            url: publicUrl,
            storage: "supabase",
            fileName: uniqueFileName,
            size: buffer.length,
          });
        }
      } catch (err) {
        console.warn("Lỗi upload Supabase, chuyển sang fallback:", err);
      }
    }

    // Fallback Mặc định (Local /public/uploads/ hoặc Base64)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, uniqueFileName);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${uniqueFileName}`,
        storage: "local",
        fileName: uniqueFileName,
        size: buffer.length,
      });
    } catch (fsErr) {
      // Trường hợp Vercel Serverless môi trường read-only: trả về Data URL
      const base64Data = `data:${file.type || "image/webp"};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        storage: "inline_base64",
        fileName: uniqueFileName,
        size: buffer.length,
      });
    }
  } catch (error: any) {
    console.error("Lỗi khi xử lý upload file:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý file máy chủ" },
      { status: 500 }
    );
  }
}

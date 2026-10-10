import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Multi-Storage Upload API with User Isolation:
 * 1. Cloudflare R2
 * 2. Supabase Storage (Isolated by userId folder)
 * 3. Local Storage /public/uploads/userId/
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy file tải lên" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(file.name) || ".webp";
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    let userId = "guest";

    if (token && supabaseUrl) {
      try {
        const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData && authData.id) {
            userId = authData.id;
          }
        }
      } catch (e) {}
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/wedding-cards/${userId}/${uniqueFileName}`;
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
      } catch (err) {}
    }

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
      const base64Data = `data:${file.type || "image/webp"};base64,${buffer.toString("base64")}`;
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
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý file máy chủ" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!fileName || !token) {
      return NextResponse.json({ success: false, message: "Thiếu tên file hoặc token" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    if (!supabaseUrl) return NextResponse.json({ success: false, message: "Chưa cấu hình Supabase" }, { status: 500 });

    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!authRes.ok) {
      return NextResponse.json({ success: false, message: "Token không hợp lệ" }, { status: 401 });
    }
    const authData = await authRes.json();
    const userId = authData.id;

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const deleteEndpoint = `${supabaseUrl}/storage/v1/object/wedding-cards/${userId}/${fileName}`;
    
    const supRes = await fetch(deleteEndpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    if (supRes.ok) {
      return NextResponse.json({ success: true, message: "Đã xóa file thành công" });
    } else {
      return NextResponse.json({ success: false, message: "Lỗi xóa file trên storage" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}

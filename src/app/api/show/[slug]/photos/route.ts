import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { detectImageMimeFromBuffer } from "@/lib/securityUtils";
import { getCardByIdOrSlug } from "@/lib/weddingCardService";

export const dynamic = "force-dynamic";

const MAX_GUEST_PHOTO_SIZE = 6 * 1024 * 1024; // 6MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

interface GuestPhotoEntry {
  id: string;
  senderName: string;
  url: string;
  caption?: string;
  createdAt: string;
  likes: number;
}

const GUEST_PHOTOS_DIR = path.join(process.cwd(), "public", "uploads", "guest_photos");

function getGuestPhotosStoragePath(slug: string): string {
  const dir = path.join(process.cwd(), "data", "guest_photos");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `${slug}.json`);
}

function readGuestPhotos(slug: string): GuestPhotoEntry[] {
  try {
    const filePath = getGuestPhotosStoragePath(slug);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Lỗi khi đọc album ảnh khách mời:", err);
  }
  return [];
}

function saveGuestPhotos(slug: string, photos: GuestPhotoEntry[]) {
  try {
    const filePath = getGuestPhotosStoragePath(slug);
    fs.writeFileSync(filePath, JSON.stringify(photos, null, 2), "utf8");
  } catch (err) {
    console.error("Lỗi khi lưu album ảnh khách mời:", err);
  }
}

/**
 * GET /api/show/[slug]/photos
 * Lấy danh sách ảnh do khách mời tải lên
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  const photos = readGuestPhotos(slug);
  return NextResponse.json({ success: true, photos });
}

/**
 * POST /api/show/[slug]/photos
 * Khách mời tải ảnh kỷ niệm chụp tại tiệc cưới lên
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const card = getCardByIdOrSlug(slug);
    if (!card) {
      return NextResponse.json({ success: false, message: "Không tìm thấy thiệp cưới" }, { status: 404 });
    }

    const formData = await request.formData();
    const botTrap = formData.get("botTrap") as string | null;
    if (botTrap) {
      // Honeypot trap against bots
      return NextResponse.json({ success: true, message: "Thành công" });
    }

    const senderName = (formData.get("senderName") as string) || "Khách Quý";
    const caption = (formData.get("caption") as string) || "";
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Vui lòng chọn ảnh để tải lên" },
        { status: 400 }
      );
    }

    if (file.size > MAX_GUEST_PHOTO_SIZE) {
      return NextResponse.json(
        { success: false, message: "Kích thước ảnh tối đa là 6MB" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectImageMimeFromBuffer(buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
      return NextResponse.json(
        { success: false, message: "Chỉ hỗ trợ file ảnh định dạng JPG, PNG hoặc WebP" },
        { status: 415 }
      );
    }

    // Save image to public folder
    const targetDir = path.join(GUEST_PHOTOS_DIR, slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = detectedMime === "image/png" ? ".png" : detectedMime === "image/webp" ? ".webp" : ".jpg";
    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const filePath = path.join(targetDir, filename);

    fs.writeFileSync(filePath, buffer);
    const photoUrl = `/uploads/guest_photos/${slug}/${filename}`;

    const newEntry: GuestPhotoEntry = {
      id: `gp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderName: senderName.trim(),
      url: photoUrl,
      caption: caption.trim() || undefined,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    const currentPhotos = readGuestPhotos(slug);
    const updatedPhotos = [newEntry, ...currentPhotos];
    saveGuestPhotos(slug, updatedPhotos);

    return NextResponse.json({
      success: true,
      message: "Tải ảnh kỷ niệm thành công!",
      photo: newEntry,
    });
  } catch (err) {
    console.error("Lỗi khi xử lý ảnh khách mời:", err);
    return NextResponse.json(
      { success: false, message: "Không thể tải ảnh lên, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}

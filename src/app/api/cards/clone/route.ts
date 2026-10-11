import { NextRequest, NextResponse } from "next/server";
import { upsertCardToDb } from "@/lib/serverDb";
import { WeddingCard } from "@/data/initialCards";
import { ZENLOVE_TEMPLATES, findZenloveTemplate } from "@/data/zenloveTemplates";
import { convertFormTemplateToCanvasNodes } from "@/lib/templateFormAdapter";
import { recordActivity } from "@/lib/activityService";
import { generateBrandedWeddingSlug } from "@/lib/brandedSlug";
import { extractWeddingDetailsFromTemplate } from "@/lib/templateExtractor";
import fs from "fs";
import path from "path";
// @ts-ignore
import lzutf8 from "lzutf8";
import { verifyUserAuth, verifyAdminAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/cards/clone
 * Clone một template Zenlove thành WeddingCard mới độc lập trong tài khoản người dùng
 */
export async function POST(request: NextRequest) {
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    // Yêu cầu bắt buộc đăng nhập để tạo/clone thiệp mời
    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "Vui lòng đăng nhập để bắt đầu tạo thiệp cưới.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, templateSlug, customGroom, customBride } = body;
    const userId = adminAuth.authenticated && body.userId ? body.userId : userAuth.userId;

    if (!templateId && !templateSlug) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID hoặc slug của mẫu" },
        { status: 400 }
      );
    }

    const targetKey = String(templateSlug || templateId).trim();
    // Chống Path Traversal: chỉ cho phép chữ cái, chữ số, gạch ngang và gạch dưới
    if (!/^[a-zA-Z0-9_-]+$/.test(targetKey)) {
      return NextResponse.json(
        { success: false, message: "ID hoặc slug mẫu không hợp lệ" },
        { status: 400 }
      );
    }

    const meta = findZenloveTemplate(targetKey) || findZenloveTemplate(templateId);

    let parsedNodes: Record<string, any> | null = null;
    let coverImage = meta?.imageUrl || "";
    let musicUrl = meta?.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3";
    let musicTitle = meta?.musicName || "Beautiful In White";

    // 1. Kiểm tra cache đĩa
    const cacheDir = path.join(process.cwd(), "src", "data", "templates", "cloned-cache");
    const candidateFiles = [
      path.join(cacheDir, `${targetKey}.json`),
      meta ? path.join(cacheDir, `${meta.id}.json`) : null,
      meta ? path.join(cacheDir, `${meta.slug}.json`) : null,
    ].filter(Boolean) as string[];

    for (const f of candidateFiles) {
      if (fs.existsSync(f)) {
        try {
          const raw = fs.readFileSync(f, "utf8");
          const cached = JSON.parse(raw);
          if (cached?.parsedNodes) {
            parsedNodes = cached.parsedNodes;
            if (cached.imageUrl) coverImage = cached.imageUrl;
            if (cached.audioSettings?.fileUrl) {
              musicUrl = cached.audioSettings.fileUrl;
              musicTitle = cached.audioSettings.name || musicTitle;
            }
            break;
          }
        } catch {}
      }
    }

    // 2. Nếu chưa có trong cache, gọi API ZenLove
    if (!parsedNodes) {
      try {
        const idToFetch = meta?.id || targetKey;
        const res = await fetch(`https://api.zenlove.me/v1/templates/${idToFetch}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            Accept: "application/json",
          },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const tpl = json.data;
            if (tpl.pageData) {
              const dec = lzutf8.decompress(tpl.pageData, { inputEncoding: "Base64" });
              parsedNodes = JSON.parse(dec);
            }
            if (tpl.audioSettings?.fileUrl) {
              musicUrl = tpl.audioSettings.fileUrl;
              musicTitle = tpl.audioSettings.name || musicTitle;
            }
            if (tpl.imageUrl) coverImage = tpl.imageUrl;

            // Ghi cache đĩa
            try {
              if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
              const cacheData = {
                id: tpl.id,
                name: tpl.name,
                slug: tpl.slug,
                imageUrl: coverImage,
                audioSettings: tpl.audioSettings,
                parsedNodes,
                clonedAt: new Date().toISOString(),
              };
              if (tpl.id) fs.writeFileSync(path.join(cacheDir, `${tpl.id}.json`), JSON.stringify(cacheData, null, 2));
              if (tpl.slug) fs.writeFileSync(path.join(cacheDir, `${tpl.slug}.json`), JSON.stringify(cacheData, null, 2));
            } catch {}
          }
        }
      } catch (fetchErr) {
        console.warn("Clone fetch from ZenLove error:", fetchErr);
      }
    }

    // 3. Trích xuất thông tin thực tế từ template nodes và meta
    const extracted = extractWeddingDetailsFromTemplate(parsedNodes || undefined, meta);

    let groom = customGroom || extracted.groomName || "Tiến Đạt";
    let bride = customBride || extracted.brideName || "Ngọc Nhi";
    const weddingDate = extracted.weddingDate || "2026-11-18";
    const weddingTime = extracted.weddingTime || "11:00";
    const lunarDate = extracted.lunarDate || "Ngày 10 tháng 10 năm Bính Ngọ";
    const venueAddress = extracted.venueAddress || "125 Đường Nguyễn Thị Minh Khai, P. Bến Thành, TP HCM";
    const venueName = extracted.venueName || "Tư gia Nhà Trai";
    coverImage = meta?.imageUrl || extracted.coverImage || coverImage;
    musicUrl = extracted.musicUrl || musicUrl;
    musicTitle = extracted.musicTitle || musicTitle;

    // 3.1. Tự động chuyển đổi nếu là mẫu dạng FORM sang cây Craft.js Canvas
    if (parsedNodes && !parsedNodes.ROOT) {
      parsedNodes = convertFormTemplateToCanvasNodes(parsedNodes, {
        id: meta?.id || templateId,
        name: meta?.name,
        imageUrl: coverImage,
        slug: meta?.slug || templateSlug,
      });
    }

    const templateName = meta?.name || "Mẫu cưới ZenLove";
    const templateCode = meta?.code || (meta?.orderNumber ? `mau${String(meta.orderNumber).padStart(2, "0")}` : "mau01");

    // Sinh slug chuẩn nhận diện thương hiệu ZenLove: [Tên người dùng/Cặp đôi] + zenlove + [mã mẫu] + [hậu tố ngẫu nhiên]
    const newSlug = generateBrandedWeddingSlug({
      userName: body.userName,
      groomName: groom,
      brideName: bride,
      websiteName: "zenlove",
      templateCode,
      includeUniqueSuffix: true,
    });

    const newCardId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newCard: WeddingCard = {
      id: newCardId,
      slug: newSlug,
      name: `Thiệp Cưới ${templateName} - ${groom} & ${bride}`,
      templateId: meta?.id || templateId,
      templateName,
      status: "draft", // Bản sao mới tạo luôn là Draft
      updatedAt: new Date().toLocaleDateString("vi-VN"),
      views: 0,
      userId,
      coverImage,
      story:
        extracted.story ||
        "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.",
      weddingDate,
      weddingTime,
      lunarDate,
      groom: {
        userId,
        name: groom,
        title: "Chú Rể",
        phone: "",
        parents: extracted.parentsGroom || "",
        bankName: "",
        accountNumber: "",
      },
      bride: {
        name: bride,
        title: "Cô Dâu",
        phone: "",
        parents: extracted.parentsBride || "",
        bankName: "",
        accountNumber: "",
      },
      events: [
        {
          id: "evt-1",
          title: "Lễ Vu Quy (Nhà Gái)",
          time: `08:30 • ${weddingDate.split("-").reverse().join("/")}`,
          venue: "Tư gia Nhà Gái",
          address: venueAddress,
          mapUrl: `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`,
        },
        {
          id: "evt-2",
          title: "Lễ Thành Hôn (Nhà Trai)",
          time: `${weddingTime} • ${weddingDate.split("-").reverse().join("/")}`,
          venue: venueName,
          address: venueAddress,
          mapUrl: `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`,
        },
        {
          id: "evt-3",
          title: "Tiệc Cưới Chung Vui",
          time: `17:30 • ${weddingDate.split("-").reverse().join("/")}`,
          venue: "Trung tâm Tiệc cưới",
          address: venueAddress,
          mapUrl: `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`,
        },
      ],
      album: extracted.album.length > 0 ? extracted.album : [coverImage].filter(Boolean),
      musicTitle,
      musicUrl,
      rsvps: [],
      wishes: [],
      nodes: parsedNodes || undefined,
    };

    // 4. Lưu lên Supabase Database và xác nhận kết quả
    const savedCard = await upsertCardToDb(newCard);
    if (!savedCard) {
      console.error("LỖI: upsertCardToDb thất bại khi clone thiệp:", newCard.id);
      return NextResponse.json(
        { success: false, message: "Không thể lưu thiệp mới vào cơ sở dữ liệu máy chủ" },
        { status: 500 }
      );
    }

    recordActivity({
      type: "card_create",
      title: "Khởi tạo thiệp cưới mới",
      actorName: `${groom} & ${bride}`,
      actorType: "user",
      targetName: newCard.name,
      targetId: newCard.id,
      targetSlug: newCard.slug,
      details: `Nhân bản từ mẫu "${templateName}" (Bản nháp)`,
      metadata: { userId, templateId },
    });

    return NextResponse.json({
      success: true,
      message: `Đã clone thành công mẫu "${templateName}"!`,
      card: newCard,
    });
  } catch (error: any) {
    console.error("POST /api/cards/clone error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi khi clone mẫu" },
      { status: 500 }
    );
  }
}

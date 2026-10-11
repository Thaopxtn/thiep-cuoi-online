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

export const dynamic = "force-dynamic";

/**
 * Trích xuất tên Cô dâu, Chú rể từ cây nodes
 */
function extractNamesFromNodes(nodes?: Record<string, any>): { groom: string; bride: string } {
  let groom = "Đức Mạnh";
  let bride = "Lệ Quyên";

  if (!nodes) return { groom, bride };

  // 1. Xử lý mẫu FORM (như Đồng Xanh)
  if (nodes.basicInfo) {
    const b = nodes.basicInfo;
    if (b.groomFullName || b.groomShortName) groom = b.groomFullName || b.groomShortName;
    if (b.brideFullName || b.brideShortName) bride = b.brideFullName || b.brideShortName;
    return { groom, bride };
  }

  const textBoxes = Object.values(nodes)
    .filter((n) => n?.type?.resolvedName === "TextBox" && typeof n.props?.text === "string")
    .map((n) => ({
      text: n.props.text
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .trim(),
      top: Number(n.props.top) || 0,
    }))
    .sort((a, b) => a.top - b.top);

  // 2. Tìm TextBox chứa cả 2 tên dạng "Chú rể & Cô dâu" hoặc "Chú rể và Cô dâu"
  for (const tb of textBoxes) {
    const clean = tb.text;
    if ((clean.includes("&") || clean.includes(" và ")) && clean.length > 5 && clean.length < 50) {
      const parts = clean.split(/&|\bvà\b/);
      const p0 = parts[0]?.trim();
      const p1 = parts[1]?.trim();
      if (
        p0 &&
        p1 &&
        p0.length >= 2 &&
        p1.length >= 2 &&
        !p0.includes("Save") &&
        !p1.includes("Save") &&
        p1 !== "amp;" &&
        !p1.startsWith("amp;")
      ) {
        return { groom: p0, bride: p1 };
      }
    }
  }

  // 3. Tìm TextBox cô lập '&' có tên chú rể phía trên và tên cô dâu phía dưới (như mẫu Hồng Phong)
  const ampersandIdx = textBoxes.findIndex(
    (tb) => tb.text === "&" || tb.text === "♥" || tb.text === "+"
  );
  if (ampersandIdx > 0 && ampersandIdx < textBoxes.length - 1) {
    const prev = textBoxes[ampersandIdx - 1].text;
    const next = textBoxes[ampersandIdx + 1].text;
    if (
      prev.length >= 2 &&
      prev.length < 30 &&
      next.length >= 2 &&
      next.length < 30 &&
      !prev.includes("Save") &&
      !next.includes("Save")
    ) {
      return { groom: prev, bride: next };
    }
  }

  return { groom, bride };
}

/**
 * POST /api/cards/clone
 * Clone một template Zenlove thành WeddingCard mới độc lập trong tài khoản người dùng
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, templateSlug, customGroom, customBride, userId: bodyUserId } = body;
    const userId = bodyUserId || request.headers.get("x-user-id") || undefined;

    // Yêu cầu bắt buộc đăng nhập để tạo/clone thiệp mời
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Vui lòng đăng nhập để bắt đầu tạo thiệp cưới.",
        },
        { status: 401 }
      );
    }

    if (!templateId && !templateSlug) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID hoặc slug của mẫu" },
        { status: 400 }
      );
    }

    const targetKey = templateSlug || templateId;
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
      status: "published",
      updatedAt: new Date().toLocaleDateString("vi-VN"),
      views: 1,
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
        phone: "0912.345.678",
        parents: extracted.parentsGroom || "Ông Nguyễn Văn Hùng & Bà Trần Thị Lan",
        bankName: "MB BANK",
        accountNumber: "240220038888",
      },
      bride: {
        name: bride,
        title: "Cô Dâu",
        phone: "0987.654.321",
        parents: extracted.parentsBride || "Ông Lê Văn Thành & Bà Vũ Thị Mai",
        bankName: "TECHCOMBANK",
        accountNumber: "190365824988",
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

    // 4. Lưu lên Supabase Database
    try {
      await upsertCardToDb(newCard);
    } catch (dbErr) {
      console.warn("upsertCardToDb error in clone:", dbErr);
    }

    recordActivity({
      type: "card_create",
      title: "Khởi tạo thiệp cưới mới",
      actorName: `${groom} & ${bride}`,
      actorType: "user",
      targetName: newCard.name,
      targetId: newCard.id,
      targetSlug: newCard.slug,
      details: `Nhân bản từ mẫu "${templateName}"`,
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

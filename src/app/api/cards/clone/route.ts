import { NextRequest, NextResponse } from "next/server";
import { upsertCardToDb } from "@/lib/serverDb";
import { WeddingCard } from "@/lib/weddingCardService";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
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
  let bride = "Thùy Dung";

  if (!nodes) return { groom, bride };

  // Xử lý mẫu FORM (như Đồng Xanh)
  if (nodes.basicInfo) {
    const b = nodes.basicInfo;
    if (b.groomFullName || b.groomShortName) groom = b.groomFullName || b.groomShortName;
    if (b.brideFullName || b.brideShortName) bride = b.brideFullName || b.brideShortName;
    return { groom, bride };
  }

  // Quét TextBox có chứa '&' hoặc 'và'
  for (const node of Object.values(nodes)) {
    if (node?.type?.resolvedName === "TextBox" && typeof node.props?.text === "string") {
      const clean = node.props.text.replace(/<[^>]*>/g, "").trim();
      if ((clean.includes("&") || clean.includes("và")) && clean.length > 3 && clean.length < 50) {
        const parts = clean.split(/&|và/);
        if (parts[0]?.trim()) groom = parts[0].trim();
        if (parts[1]?.trim()) bride = parts[1].trim();
        break;
      }
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
    const { templateId, templateSlug, customGroom, customBride } = body;

    if (!templateId && !templateSlug) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID hoặc slug của mẫu" },
        { status: 400 }
      );
    }

    const targetKey = templateSlug || templateId;
    const meta = ZENLOVE_TEMPLATES.find(
      (t) => t.id === templateId || t.slug === targetKey || t.id === targetKey
    );

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

    // 3. Trích xuất tên và thông tin
    let { groom, bride } = extractNamesFromNodes(parsedNodes || undefined);
    if (customGroom) groom = customGroom;
    if (customBride) bride = customBride;

    const templateName = meta?.name || "Mẫu cưới ZenLove";
    const baseSlug = (meta?.slug || "thiep-cuoi")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    const newCardId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSlug = `${baseSlug}-${randomSuffix}`;

    const newCard: WeddingCard = {
      id: newCardId,
      slug: newSlug,
      name: `Thiệp Cưới ${templateName} - ${groom} & ${bride}`,
      templateId: meta?.id || templateId,
      templateName,
      status: "published",
      updatedAt: new Date().toLocaleDateString("vi-VN"),
      views: 1,
      coverImage,
      story: "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.",
      weddingDate: "2026-11-18",
      weddingTime: "11:00",
      lunarDate: "Ngày 10 tháng 10 năm Bính Ngọ",
      groom: {
        name: groom,
        title: "Chú Rể",
        phone: "0912.345.678",
        parents: "Ông Nguyễn Văn Hùng & Bà Trần Thị Lan",
        bankName: "MB BANK",
        accountNumber: "240220038888",
      },
      bride: {
        name: bride,
        title: "Cô Dâu",
        phone: "0987.654.321",
        parents: "Ông Lê Văn Thành & Bà Vũ Thị Mai",
        bankName: "TECHCOMBANK",
        accountNumber: "190365824988",
      },
      events: [
        {
          id: "evt-1",
          title: "Lễ Vu Quy (Nhà Gái)",
          time: "08:30 • 18/11/2026",
          venue: "Tư gia Nhà Gái",
          address: "Số 45 Tràng Tiền, Hoàn Kiếm, Hà Nội",
          mapUrl: "https://maps.google.com/?q=Trang+Tien+Hanoi",
        },
        {
          id: "evt-2",
          title: "Lễ Thành Hôn (Nhà Trai)",
          time: "10:00 • 18/11/2026",
          venue: "Tư gia Nhà Trai",
          address: "Số 88 Hoàng Hoa Thám, Ba Đình, Hà Nội",
          mapUrl: "https://maps.google.com/?q=Hoang+Hoa+Tham+Hanoi",
        },
        {
          id: "evt-3",
          title: "Tiệc Cưới Chung Vui",
          time: "11:30 • 18/11/2026",
          venue: "Trung tâm Tiệc cưới Trống Đồng Palace",
          address: "72 Quán Sứ, Hoàn Kiếm, Hà Nội",
          mapUrl: "https://maps.google.com/?q=Trong+Dong+Palace",
        },
      ],
      album: [coverImage].filter(Boolean),
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

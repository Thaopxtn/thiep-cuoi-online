import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS, WeddingCard } from "@/data/initialCards";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
// @ts-ignore
import lzutf8 from "lzutf8";

import { convertFormTemplateToCanvasNodes } from "@/lib/templateFormAdapter";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

/**
 * GET /api/show/[slug]
 * Trả về đúng dữ liệu thiệp cưới người dùng đã tạo hoặc mẫu tương ứng
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    // 1. Kiểm tra trong Supabase DB
    const card = await getCardByIdOrSlugFromDb(slug);
    if (card) {
      return NextResponse.json({
        success: true,
        source: "database",
        card,
      });
    }

    // 2. Kiểm tra trong INITIAL_CARDS
    const localFound = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
    if (localFound) {
      return NextResponse.json({
        success: true,
        source: "initial_cards",
        card: localFound,
      });
    }

    // 3. Nếu là ID hoặc slug của mẫu ZenLove (trong 236 mẫu)
    const template = ZENLOVE_TEMPLATES.find((t) => t.id === slug || t.slug === slug);
    if (template) {
      let parsedNodes: Record<string, any> | undefined = undefined;
      let rawFormData: Record<string, any> | undefined = undefined;
      let coverImage = template.imageUrl || "";
      let musicUrl = template.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3";
      let musicTitle = template.musicName || "Nhạc cưới";

      const cacheDir = path.join(process.cwd(), "src", "data", "templates", "cloned-cache");
      const candidateFiles = [
        path.join(cacheDir, `${slug}.json`),
        path.join(cacheDir, `${template.id}.json`),
        template.slug ? path.join(cacheDir, `${template.slug}.json`) : null,
      ].filter(Boolean) as string[];

      // 3.1 Thử đọc từ cloned-cache cục bộ
      for (const f of candidateFiles) {
        if (fs.existsSync(f)) {
          try {
            const raw = fs.readFileSync(f, "utf8");
            const cached = JSON.parse(raw);
            if (cached?.parsedNodes) {
              parsedNodes = cached.parsedNodes;
              if (cached.pageData) {
                if (typeof cached.pageData === "string") {
                  try {
                    const dec = lzutf8.decompress(cached.pageData, { inputEncoding: "Base64" });
                    rawFormData = JSON.parse(dec);
                  } catch {}
                } else {
                  rawFormData = cached.pageData;
                }
              }
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

      // 3.2 Nếu chưa có cache, tải từ ZenLove API
      if (!parsedNodes) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`https://api.zenlove.me/v1/templates/${template.id}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              Accept: "application/json",
            },
            signal: controller.signal,
            next: { revalidate: 3600 },
          });
          clearTimeout(timeout);
          if (res.ok) {
            const json = await res.json();
            if (json.data?.pageData) {
              const decompressed = lzutf8.decompress(json.data.pageData, { inputEncoding: "Base64" });
              parsedNodes = JSON.parse(decompressed);
              rawFormData = parsedNodes;
            }
            if (json.data?.audioSettings?.fileUrl) {
              musicUrl = json.data.audioSettings.fileUrl;
              musicTitle = json.data.audioSettings.name || musicTitle;
            }
            if (json.data?.imageUrl) coverImage = json.data.imageUrl;

            // Ghi cache đĩa
            try {
              if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
              const cacheData = {
                id: template.id,
                name: template.name,
                slug: template.slug,
                imageUrl: coverImage,
                audioSettings: json.data?.audioSettings,
                parsedNodes,
                clonedAt: new Date().toISOString(),
              };
              fs.writeFileSync(path.join(cacheDir, `${template.id}.json`), JSON.stringify(cacheData, null, 2));
              if (template.slug) {
                fs.writeFileSync(path.join(cacheDir, `${template.slug}.json`), JSON.stringify(cacheData, null, 2));
              }
            } catch {}
          }
        } catch (e) {
          console.warn(`Không thể tải pageData từ zenlove cho mẫu ${template.id}:`, e);
        }
      }

      // Lưu lại tham chiếu form data trước khi convert
      if (!rawFormData && parsedNodes && !parsedNodes.ROOT) {
        rawFormData = parsedNodes;
      }

      // 3.3 Chuyển đổi sang Canvas Craft.js Nodes đầy đủ 100% nếu là mẫu FORM
      if (parsedNodes && !parsedNodes.ROOT) {
        parsedNodes = convertFormTemplateToCanvasNodes(parsedNodes, {
          id: template.id,
          name: template.name,
          imageUrl: coverImage,
          slug: template.slug || template.id,
        });
      }

      // 3.4 Trích xuất thông tin thực tế từ formData
      let groom = "Đức Mạnh";
      let bride = "Thùy Dung";
      let groomParents = "Nhà Trai";
      let brideParents = "Nhà Gái";
      let groomBankName = "MB BANK";
      let groomAccountNumber = "240220038888";
      let brideBankName = "TECHCOMBANK";
      let brideAccountNumber = "190365824988";
      let weddingDate = "2026-11-18";
      let weddingTime = "11:00";
      let lunarDate = "Ngày 10 tháng 10 năm Bính Ngọ";
      let story = "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.";

      if (rawFormData?.basicInfo) {
        const b = rawFormData.basicInfo;
        if (b.groomFullName || b.groomShortName) groom = b.groomFullName || b.groomShortName;
        if (b.brideFullName || b.brideShortName) bride = b.brideFullName || b.brideShortName;
        if (b.groomFatherName) {
          groomParents = `${b.groomParentTitle || "Ông Bà"} ${b.groomFatherName}${b.groomMatherName ? " & " + b.groomMatherName : ""}`;
        }
        if (b.brideFatherName) {
          brideParents = `${b.brideParentTitle || "Ông Bà"} ${b.brideFatherName}${b.brideMatherName ? " & " + b.brideMatherName : ""}`;
        }
      }

      if (rawFormData?.account) {
        const acc = rawFormData.account;
        if (acc.groomBankName) groomBankName = acc.groomBankName;
        if (acc.groomAccountNumber) groomAccountNumber = acc.groomAccountNumber;
        if (acc.brideBankName) brideBankName = acc.brideBankName;
        if (acc.brideAccountNumber) brideAccountNumber = acc.brideAccountNumber;
      }

      if (rawFormData?.weddingDate?.date) {
        try {
          const d = new Date(rawFormData.weddingDate.date);
          weddingDate = d.toISOString().split("T")[0];
          if (rawFormData.weddingDate.hour !== undefined) {
            weddingTime = `${String(rawFormData.weddingDate.hour).padStart(2, "0")}:${String(rawFormData.weddingDate.minute || 0).padStart(2, "0")}`;
          }
        } catch {}
      }
      if (rawFormData?.weddingDate?.lunarDate) {
        lunarDate = rawFormData.weddingDate.lunarDate;
      }
      if (rawFormData?.introMent?.description) {
        story = rawFormData.introMent.description.replace(/<[^>]*>/g, " ").trim();
      }

      // 3.5 Khởi tạo danh sách sự kiện cưới từ ceremonies hoặc locations
      const events: any[] = [];
      if (Array.isArray(rawFormData?.ceremonies?.lists) && rawFormData.ceremonies.lists.length > 0) {
        rawFormData.ceremonies.lists.forEach((c: any, idx: number) => {
          events.push({
            id: c.id || `ceremony-${idx}`,
            title: c.name || (idx === 0 ? "Lễ Vu Quy" : "Lễ Thành Hôn"),
            time: `${c.time || weddingTime} • ${c.date || weddingDate}`,
            venue: c.location || "Tư gia",
            address: c.location || "",
          });
        });
      } else if (Array.isArray(rawFormData?.weddingLocation?.locations) && rawFormData.weddingLocation.locations.length > 0) {
        rawFormData.weddingLocation.locations.forEach((loc: any, idx: number) => {
          events.push({
            id: loc.id || `loc-${idx}`,
            title: loc.title || "Địa điểm hôn lễ",
            time: `${weddingTime} • ${weddingDate}`,
            venue: loc.roadAddress || loc.displayAddress || "Tư gia",
            address: loc.roadAddress || loc.displayAddress || "",
            mapUrl: `https://maps.google.com/?q=${encodeURIComponent(loc.roadAddress || loc.displayAddress || "")}`,
          });
        });
      } else {
        events.push({
          id: "evt-1",
          title: "Lễ Thành Hôn",
          time: `${weddingTime} • ${weddingDate}`,
          venue: "Trung tâm Tiệc cưới",
          address: "Hà Nội",
        });
      }

      const templateCard: WeddingCard = {
        id: template.id,
        slug: template.slug || template.id,
        name: `Thiệp Cưới ${template.name} - ${groom} & ${bride}`,
        templateId: template.id,
        templateName: template.name,
        status: "published",
        updatedAt: new Date().toLocaleDateString("vi-VN"),
        views: 350,
        coverImage,
        story,
        weddingDate,
        weddingTime,
        lunarDate,
        groom: {
          name: groom,
          title: "Chú Rể",
          phone: "0912.345.678",
          parents: groomParents,
          bankName: groomBankName,
          accountNumber: groomAccountNumber,
        },
        bride: {
          name: bride,
          title: "Cô Dâu",
          phone: "0987.654.321",
          parents: brideParents,
          bankName: brideBankName,
          accountNumber: brideAccountNumber,
        },
        events,
        album: [],
        musicTitle,
        musicUrl,
        rsvps: [],
        wishes: [],
        nodes: parsedNodes,
      };

      return NextResponse.json({
        success: true,
        source: "zenlove_template",
        card: templateCard,
      });
    }

    // 4. Nếu không tìm thấy: Trả về 404
    return NextResponse.json(
      { success: false, message: `Không tìm thấy thiệp cưới với đường dẫn: ${slug}` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error(`GET /api/show/${slug} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải thông tin thiệp" },
      { status: 500 }
    );
  }
}

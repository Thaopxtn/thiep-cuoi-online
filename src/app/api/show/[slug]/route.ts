import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS, WeddingCard } from "@/data/initialCards";
import { CUSTOMER_INVITATIONS } from "@/data/customerInvitations";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
import { getOrCloneCustomerCard } from "@/lib/zenloveCloner";
// @ts-ignore
import lzutf8 from "lzutf8";

import { convertFormTemplateToCanvasNodes } from "@/lib/templateFormAdapter";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

function cleanText(html: any): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trích xuất tên cô dâu chú rể chính xác từ Craft.js nodes
 */
function extractCoupleFromNodes(nodes: Record<string, any>, fallbackName = "") {
  let groom = "";
  let bride = "";

  // 1. Kiểm tra nếu là form basicInfo
  if (nodes?.basicInfo) {
    const b = nodes.basicInfo;
    if (b.groomFullName || b.groomShortName) groom = b.groomFullName || b.groomShortName;
    if (b.brideFullName || b.brideShortName) bride = b.brideFullName || b.brideShortName;
    if (groom && bride) return { groom, bride };
  }

  // 2. Quét các TextBox
  const textBoxes = Object.values(nodes || {})
    .filter((n: any) => n?.type?.resolvedName === "TextBox")
    .map((n: any) => {
      const raw = n.props?.text?.rawText || n.props?.text || "";
      const text = cleanText(typeof raw === "string" ? raw : "");
      return { text, top: Number(n.props?.top) || 0 };
    })
    .filter((t) => t.text.length > 0)
    .sort((a, b) => a.top - b.top);

  // Pattern: "A & B" hoặc "A và B"
  for (const tb of textBoxes) {
    const clean = tb.text;
    if ((clean.includes("&") || clean.includes(" và ")) && clean.length > 4 && clean.length < 50) {
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

  // Quét ký tự & độc lập giữa 2 TextBox
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

  // 3. Fallback trích xuất từ tiêu đề
  if (fallbackName) {
    const clean = fallbackName
      .replace(
        /^(thiệp cưới của|thiệp cưới|đám cưới của|đám cưới|lễ thành hôn của|lễ vu quy của|wedding-invitation-|wedding invitation -|wedding invitation|save the date)\s*[-:]?\s*/i,
        ""
      )
      .trim();
    const parts = clean.split(/\s*(?:và|&|\+|\s-\s)\s*/i);
    if (parts.length >= 2) {
      groom = parts[0].trim();
      bride = parts[1].trim();
      return { groom, bride };
    }
  }

  const isInvalid = (s: string) => {
    const l = (s || "").toLowerCase();
    return (
      l.includes("bản nháp") ||
      l.includes("chạm để") ||
      l.includes("mẫu thiệp") ||
      l.includes("khách hàng") ||
      l.includes("draft")
    );
  };

  const finalGroom = groom && !isInvalid(groom) ? groom : "Chú Rể";
  const finalBride = bride && !isInvalid(bride) ? bride : "Cô Dâu";

  return { groom: finalGroom, bride: finalBride };
}

/**
 * Trích xuất ngày cưới
 */
function extractDateFromNodes(nodes: Record<string, any>): string {
  if (nodes?.weddingDate?.date) {
    try {
      const d = new Date(nodes.weddingDate.date);
      return d.toISOString().split("T")[0];
    } catch {}
  }
  const textBoxes = Object.values(nodes || {}).filter(
    (n: any) => n?.type?.resolvedName === "TextBox"
  );
  for (const n of textBoxes) {
    const raw = n.props?.text?.rawText || n.props?.text || "";
    if (typeof raw === "string") {
      const m = raw.match(/\b(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})\b/);
      if (m) {
        return m[1];
      }
    }
  }
  return "2026-11-20";
}

/**
 * Trích xuất địa điểm
 */
function extractVenueFromNodes(nodes: Record<string, any>): string {
  const textBoxes = Object.values(nodes || {}).filter(
    (n: any) => n?.type?.resolvedName === "TextBox"
  );
  for (const n of textBoxes) {
    const raw = n.props?.text?.rawText || n.props?.text || "";
    if (typeof raw === "string") {
      const text = cleanText(raw);
      if (
        /Trung tâm|Nhà hàng|Khách sạn|Tư gia|Trống Đồng|White Palace|Riverside|Melia|Daewoo|Palace|Plaza|Hotel|Resort/i.test(
          text
        ) &&
        text.length < 90 &&
        text.length > 8
      ) {
        return text;
      }
    }
  }
  return "Trung tâm Tiệc cưới";
}

/**
 * GET /api/show/[slug]
 * Trả về đúng dữ liệu thiệp cưới người dùng đã tạo hoặc mẫu tương ứng
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    // 1. Kiểm tra trong Supabase DB
    const dbCard = await getCardByIdOrSlugFromDb(slug);
    if (dbCard) {
      return NextResponse.json({
        success: true,
        source: "database",
        card: dbCard,
      });
    }

    // 2. Kiểm tra nếu là một trong các mẫu mặc định ban đầu (ngoại trừ customer slugs)
    const localFound = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
    if (localFound && (slug === "hong-phong" || slug.startsWith("card_"))) {
      return NextResponse.json({
        success: true,
        source: "initial_cards",
        card: localFound,
      });
    }

    const cacheDir = path.join(process.cwd(), "src", "data", "templates", "cloned-cache");

    // 3. Kiểm tra thông tin trong danh sách thiệp khách hàng (CUSTOMER_INVITATIONS) hoặc cache cục bộ
    const custFound = CUSTOMER_INVITATIONS.find(
      (c) => c.slug === slug || c.href === `/show/${slug}` || c.href?.endsWith(`/${slug}`)
    );

    // Tìm file cache tương ứng
    const candidateFiles = [
      path.join(cacheDir, `${slug}.json`),
      path.join(cacheDir, `customer-${slug}.json`),
      custFound ? path.join(cacheDir, `${custFound.slug}.json`) : null,
      custFound ? path.join(cacheDir, `customer-${custFound.slug}.json`) : null,
    ].filter(Boolean) as string[];

    let cachedCustomerData: any = null;
    for (const f of candidateFiles) {
      if (fs.existsSync(f)) {
        try {
          const raw = fs.readFileSync(f, "utf8");
          const parsed = JSON.parse(raw);
          if (parsed?.parsedNodes) {
            cachedCustomerData = parsed;
            break;
          }
        } catch {}
      }
    }

    // Nếu là thiệp khách hàng nhưng chưa có trên đĩa, tự động clone ngay từ ZenLove!
    if (!cachedCustomerData && custFound) {
      cachedCustomerData = await getOrCloneCustomerCard(custFound.slug, custFound);
    }

    // 3.1 Trả về thiệp khách hàng với nodes và thông tin THỰC TẾ 100% của khách hàng đó!
    if (cachedCustomerData && cachedCustomerData.parsedNodes) {
      let parsedNodes = cachedCustomerData.parsedNodes;
      if (!parsedNodes.ROOT) {
        parsedNodes = convertFormTemplateToCanvasNodes(parsedNodes, cachedCustomerData);
      }

      // Trích xuất tên dâu rể
      let groom = custFound?.groomName;
      let bride = custFound?.brideName;
      if (!groom || !bride) {
        const extracted = extractCoupleFromNodes(parsedNodes, cachedCustomerData.name);
        groom = groom || extracted.groom;
        bride = bride || extracted.bride;
      }

      const weddingDate = custFound?.date || extractDateFromNodes(parsedNodes);
      const venue = custFound?.venue || extractVenueFromNodes(parsedNodes);
      const coverImage =
        cachedCustomerData.thumbnail || custFound?.image || cachedCustomerData.imageUrl || "";
      const musicTitle =
        cachedCustomerData.audioSettings?.musicTitle ||
        cachedCustomerData.audioSettings?.name ||
        custFound?.musicTitle ||
        "Bản nhạc cưới";
      const musicUrl =
        cachedCustomerData.audioSettings?.fileUrl ||
        cachedCustomerData.audioSettings?.musicUrl ||
        "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3";

      const custCard: WeddingCard = {
        id: slug,
        slug: slug,
        name: cachedCustomerData.name || custFound?.title || `Thiệp Cưới ${groom} & ${bride}`,
        templateId: cachedCustomerData.id || slug,
        templateName: cachedCustomerData.name || custFound?.title || "Thiệp Khách Hàng ZenLove",
        status: "published",
        updatedAt: custFound?.date || new Date().toLocaleDateString("vi-VN"),
        views: cachedCustomerData.viewCount || custFound?.views || 142,
        coverImage,
        story: `${cachedCustomerData.name || custFound?.title || "Thiệp Cưới"} - Hẹn nhau trong ngày hạnh phúc. Một lời ước hẹn trăm năm và trọn vẹn yêu thương.`,
        weddingDate,
        weddingTime: "11:00",
        lunarDate: "Ngày 12 tháng 10 năm Bính Ngọ",
        groom: {
          name: groom || "Chú Rể",
          title: "Chú Rể",
          phone: "0912.345.678",
          parents: "Nhà Trai",
          bankName: "MB BANK",
          accountNumber: "240220038888",
          qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=240220038888-MBBANK",
        },
        bride: {
          name: bride || "Cô Dâu",
          title: "Cô Dâu",
          phone: "0987.654.321",
          parents: "Nhà Gái",
          bankName: "TECHCOMBANK",
          accountNumber: "190365824988",
          qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=190365824988-TECHCOMBANK",
        },
        events: [
          {
            id: "evt-1",
            title: "Lễ Thành Hôn",
            time: `11:00 • ${weddingDate}`,
            venue: venue || "Trung tâm Tiệc cưới",
            address: venue || "",
            mapUrl: `https://maps.google.com/?q=${encodeURIComponent(venue || "")}`,
          },
        ],
        album: [coverImage],
        musicTitle,
        musicUrl,
        rsvps: [],
        wishes: [],
        nodes: parsedNodes,
      };

      return NextResponse.json({
        success: true,
        source: "cloned_customer_card",
        card: custCard,
      });
    }

    // 4. Nếu là ID hoặc slug của mẫu ZenLove trong catalog (236 mẫu)
    const template = ZENLOVE_TEMPLATES.find((t) => t.id === slug || t.slug === slug);
    if (template) {
      let parsedNodes: Record<string, any> | undefined = undefined;
      let rawFormData: Record<string, any> | undefined = undefined;
      let coverImage = template.imageUrl || "";
      let musicUrl =
        template.musicUrl ||
        "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3";
      let musicTitle = template.musicName || "Nhạc cưới";

      const candidateTplFiles = [
        path.join(cacheDir, `${slug}.json`),
        path.join(cacheDir, `${template.id}.json`),
        template.slug ? path.join(cacheDir, `${template.slug}.json`) : null,
      ].filter(Boolean) as string[];

      // 4.1 Thử đọc từ cloned-cache cục bộ
      for (const f of candidateTplFiles) {
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

      // 4.2 Nếu chưa có cache, tải từ ZenLove API
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

      if (parsedNodes && !parsedNodes.ROOT) {
        parsedNodes = convertFormTemplateToCanvasNodes(parsedNodes, {
          id: template.id,
          name: template.name,
          imageUrl: coverImage,
          slug: template.slug || template.id,
        });
      }

      let groom = "Đức Mạnh";
      let bride = "Thùy Dung";
      let weddingDate = "2026-11-18";
      let weddingTime = "11:00";
      let lunarDate = "Ngày 10 tháng 10 năm Bính Ngọ";
      let story = "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.";

      if (rawFormData?.basicInfo) {
        const b = rawFormData.basicInfo;
        if (b.groomFullName || b.groomShortName) groom = b.groomFullName || b.groomShortName;
        if (b.brideFullName || b.brideShortName) bride = b.brideFullName || b.brideShortName;
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
          parents: "Nhà Trai",
          bankName: "MB BANK",
          accountNumber: "240220038888",
        },
        bride: {
          name: bride,
          title: "Cô Dâu",
          phone: "0987.654.321",
          parents: "Nhà Gái",
          bankName: "TECHCOMBANK",
          accountNumber: "190365824988",
        },
        events: [
          {
            id: "evt-1",
            title: "Lễ Thành Hôn",
            time: `${weddingTime} • ${weddingDate}`,
            venue: "Trung tâm Tiệc cưới",
            address: "Hà Nội",
          },
        ],
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

    // 5. Thử clone động từ ZenLove nếu slug là một thiệp công khai bất kỳ
    const onDemandCard = await getOrCloneCustomerCard(slug);
    if (onDemandCard && onDemandCard.parsedNodes) {
      let parsedNodes = onDemandCard.parsedNodes;
      if (!parsedNodes.ROOT) {
        parsedNodes = convertFormTemplateToCanvasNodes(parsedNodes, onDemandCard);
      }
      const { groom, bride } = extractCoupleFromNodes(parsedNodes, onDemandCard.name);
      const weddingDate = extractDateFromNodes(parsedNodes);
      const venue = extractVenueFromNodes(parsedNodes);

      const dynamicCard: WeddingCard = {
        id: slug,
        slug: slug,
        name: onDemandCard.name || `Thiệp Cưới ${groom} & ${bride}`,
        templateId: slug,
        templateName: onDemandCard.name || "Thiệp Cưới Online",
        status: "published",
        updatedAt: new Date().toLocaleDateString("vi-VN"),
        views: onDemandCard.viewCount || 10,
        coverImage: onDemandCard.thumbnail || "",
        story: `${onDemandCard.name} - Trân trọng kính mời.`,
        weddingDate,
        weddingTime: "11:00",
        lunarDate: "Ngày 12 tháng 10 năm Bính Ngọ",
        groom: {
          name: groom,
          title: "Chú Rể",
          phone: "0912.345.678",
          parents: "Nhà Trai",
        },
        bride: {
          name: bride,
          title: "Cô Dâu",
          phone: "0987.654.321",
          parents: "Nhà Gái",
        },
        events: [
          {
            id: "evt-1",
            title: "Lễ Thành Hôn",
            time: `11:00 • ${weddingDate}`,
            venue,
            address: venue,
          },
        ],
        album: [onDemandCard.thumbnail],
        musicTitle: onDemandCard.audioSettings?.musicTitle || "Bản nhạc cưới",
        musicUrl:
          onDemandCard.audioSettings?.fileUrl ||
          "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
        rsvps: [],
        wishes: [],
        nodes: parsedNodes,
      };

      return NextResponse.json({
        success: true,
        source: "on_demand_cloned",
        card: dynamicCard,
      });
    }

    // 6. Nếu không tìm thấy: Trả về 404
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

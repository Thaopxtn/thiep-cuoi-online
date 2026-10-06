import fs from "fs";
import path from "path";
// @ts-ignore
import LZUTF8 from "lzutf8";

const CACHE_DIR = path.join(process.cwd(), "src", "data", "templates", "cloned-cache");

export interface ClonedCustomerCardData {
  id: string;
  name: string;
  slug: string;
  slugShow: string;
  source: string;
  clonedAt: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  audioSettings?: {
    fileUrl?: string;
    musicTitle?: string;
    musicId?: string;
    name?: string;
  } | null;
  toolbarSettings?: any;
  parsedNodes: Record<string, any>;
}

/**
 * Lấy dữ liệu thiệp cưới khách hàng từ cache cục bộ hoặc clone trực tiếp từ ZenLove nếu chưa có
 */
export async function getOrCloneCustomerCard(
  slugShow: string,
  meta: Record<string, any> = {}
): Promise<ClonedCustomerCardData | null> {
  if (!slugShow) return null;

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const file1 = path.join(CACHE_DIR, `${slugShow}.json`);
  const file2 = path.join(CACHE_DIR, `customer-${slugShow}.json`);

  // 1. Kiểm tra cache cục bộ trước
  for (const f of [file1, file2]) {
    if (fs.existsSync(f)) {
      try {
        const raw = fs.readFileSync(f, "utf8");
        const cached = JSON.parse(raw);
        if (cached && cached.parsedNodes && Object.keys(cached.parsedNodes).length > 0) {
          return cached;
        }
      } catch (err) {
        console.warn(`Lỗi đọc cache ${f}:`, err);
      }
    }
  }

  // 2. Nếu chưa có trong cache, clone từ ZenLove
  const url = `https://zenlove.me/show/${slugShow}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Zenlove Cloner] ${slugShow} HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Decompress pageData from large Base64 blocks
    const b64Blocks = html.match(/([A-Za-z0-9+/=]{1000,})/g) || [];
    let parsedNodes: Record<string, any> | null = null;

    for (const block of b64Blocks) {
      try {
        const dec = LZUTF8.decompress(block, { inputEncoding: "Base64" });
        if (dec.includes('"ROOT"') || dec.includes("basicInfo") || dec.includes("TextBox")) {
          parsedNodes = JSON.parse(dec);
          break;
        }
      } catch {}
    }

    if (!parsedNodes) {
      console.warn(`[Zenlove Cloner] Không tìm thấy dữ liệu nodes cho ${slugShow}`);
      return null;
    }

    let audioSettings: any = null;
    let toolbarSettings: any = null;
    let cardName = meta.name || "";
    let thumbnail = meta.thumbnailKey
      ? `https://cdn-resource.zenlove.me/${meta.thumbnailKey}`
      : meta.thumbnail || "";

    const audioMatch = html.match(/"audioSettings":(\{.+?\})/);
    if (audioMatch) {
      try {
        audioSettings = JSON.parse(audioMatch[1]);
        if (audioSettings.musicId && !audioSettings.fileUrl) {
          audioSettings.fileUrl = `https://cdn-resource.zenlove.me/${audioSettings.musicId}`;
        }
      } catch {}
    }

    const toolbarMatch = html.match(/"toolbarSettings":(\{.+?\}),"viewContext"/);
    if (toolbarMatch) {
      try {
        toolbarSettings = JSON.parse(toolbarMatch[1]);
      } catch {}
    }

    const nameMatch = html.match(/"page":\{"name":"([^"]+)"/);
    if (nameMatch) {
      cardName = nameMatch[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
    }

    const cardPackage: ClonedCustomerCardData = {
      id: meta.id || slugShow,
      name: cardName || meta.name || meta.title || "Thiệp Cưới Khách Hàng",
      slug: slugShow,
      slugShow,
      source: "zenlove_customer_product",
      clonedAt: new Date().toISOString(),
      thumbnail,
      viewCount: meta.viewCount || meta.views || 0,
      likeCount: meta.likeCount || 0,
      audioSettings,
      toolbarSettings,
      parsedNodes,
    };

    // Lưu vào đĩa cache
    try {
      fs.writeFileSync(file1, JSON.stringify(cardPackage, null, 2), "utf8");
      fs.writeFileSync(file2, JSON.stringify(cardPackage, null, 2), "utf8");
    } catch {}

    return cardPackage;
  } catch (err: any) {
    console.error(`[Zenlove Cloner] Lỗi clone ${slugShow}:`, err?.message);
    return null;
  }
}

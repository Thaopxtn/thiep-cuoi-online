/**
 * Tiện ích tạo và xử lý đường dẫn URL chia sẻ thiệp cưới chuẩn SEO & Thương hiệu ZenLove
 * Cấu trúc: [Tên người dùng/Cặp đôi] + [Tên website (zenlove)] + [Mã mẫu / Thành phần khác]
 * Ví dụ:
 * - nguyen-tuan-zenlove-mau01
 * - duc-manh-thuy-dung-zenlove-mau01
 * - duc-manh-thuy-dung-zenlove-mau01-8392
 */

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu sang định dạng URL Slug không dấu, viết thường
 */
export function normalizeToSlug(text?: string | null): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
    .replace(/[đĐ]/g, "d")          // Bỏ chữ đ
    .toLowerCase()
    .replace(/&/g, " ")             // Ký tự & thành khoảng trắng
    .replace(/[^a-z0-9\s-]/g, "")   // Bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, "-")           // Khoảng trắng thành dấu gạch nối
    .replace(/-+/g, "-")            // Gộp nhiều dấu gạch nối liên tiếp
    .replace(/^-|-$/g, "");         // Bỏ gạch nối ở đầu/cuối
}

export interface BrandedSlugOptions {
  /** Tên người dùng tài khoản (ví dụ: "Nguyễn Tuấn", "Lan Anh") */
  userName?: string;
  /** Tên chú rể (ví dụ: "Đức Mạnh") */
  groomName?: string;
  /** Tên cô dâu (ví dụ: "Thùy Dung") */
  brideName?: string;
  /** Tên website (Mặc định: "zenlove") */
  websiteName?: string;
  /** Mã mẫu hoặc số thứ tự mẫu (ví dụ: "mau01", "mau-01", "01") */
  templateCode?: string;
  /** Có thêm mã số ngẫu nhiên để đảm bảo không trùng URL không */
  includeUniqueSuffix?: boolean;
  /** Hậu tố tùy chỉnh (ví dụ: năm cưới "2026" hoặc mã 4 số) */
  customSuffix?: string;
}

/**
 * Sinh chuỗi slug thiệp cưới mang thương hiệu theo định dạng:
 * [Tên người dùng/Cặp đôi] + [tên website] + [các thành phần khác nếu cần]
 */
export function generateBrandedWeddingSlug(options: BrandedSlugOptions): string {
  const {
    userName,
    groomName,
    brideName,
    websiteName = "zenlove",
    templateCode,
    includeUniqueSuffix = false,
    customSuffix,
  } = options;

  // 1. Xác định Thành phần 1: Tên người dùng / Cặp đôi
  let userPart = "";
  const cleanUser = userName ? normalizeToSlug(userName) : "";

  // Nếu có tên người dùng rõ ràng (không phải generic "user", "admin")
  if (cleanUser && cleanUser !== "user" && cleanUser !== "admin" && cleanUser !== "khach-hang") {
    userPart = cleanUser;
  } else if (groomName || brideName) {
    const cleanGroom = normalizeToSlug(groomName);
    const cleanBride = normalizeToSlug(brideName);
    if (cleanGroom && cleanBride) {
      userPart = `${cleanGroom}-${cleanBride}`;
    } else {
      userPart = cleanGroom || cleanBride || "doi-uy-uong";
    }
  } else {
    userPart = "doi-uy-uong";
  }

  // 2. Thành phần 2: Tên website (chuẩn hóa)
  const webPart = normalizeToSlug(websiteName) || "zenlove";

  // 3. Thành phần 3: Các thành phần khác (Mã mẫu, hậu tố)
  let extraPart = "";
  if (templateCode) {
    // Chuẩn hóa mã mẫu: "mau-01" -> "mau01", "Mẫu 01" -> "mau01", "01" -> "mau01"
    const cleanedCode = normalizeToSlug(templateCode).replace(/-/g, "");
    if (/^\d+$/.test(cleanedCode)) {
      extraPart = `mau${cleanedCode.padStart(2, "0")}`;
    } else if (cleanedCode.startsWith("mau")) {
      extraPart = cleanedCode;
    } else {
      extraPart = normalizeToSlug(templateCode);
    }
  }

  // Tạo slug cơ sở
  const parts: string[] = [userPart, webPart];
  if (extraPart) {
    parts.push(extraPart);
  }

  // Thêm hậu tố nhận diện nếu được yêu cầu (tránh trùng URL giữa các cặp đôi cùng tên)
  if (customSuffix) {
    parts.push(normalizeToSlug(customSuffix));
  } else if (includeUniqueSuffix) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    parts.push(String(randomSuffix));
  }

  return parts.filter(Boolean).join("-");
}

/**
 * Phân tích chuỗi URL slug xem có thuộc định dạng Branded Slug không:
 * [Tên người dùng/Cặp đôi] + [Tên website (zenlove)] + [Mẫu] + [Thông tin khác nếu có]
 */
export function parseBrandedSlug(slug?: string | null): {
  isBranded: boolean;
  userPart?: string;
  websitePart?: string;
  templateCode?: string;
  templateOrder?: number;
  suffix?: string;
} {
  if (!slug || typeof slug !== "string") {
    return { isBranded: false };
  }

  const clean = slug.trim().toLowerCase();
  // Regex tìm pattern: ...-zenlove-mau[0-9]+(-...)?
  // Hoặc pattern: ...-(zenlove|website)-...
  const match = clean.match(/^(.*?)-(zenlove|thiepcuoi|wedding)(?:-(mau\d+|mau-\d+|\d+))?(?:-(.*))?$/);
  if (match) {
    const rawUser = match[1];
    const web = match[2];
    const rawMau = match[3];
    const rawSuffix = match[4];

    let templateOrder: number | undefined = undefined;
    let templateCode: string | undefined = undefined;
    if (rawMau) {
      const numMatch = rawMau.match(/\d+/);
      if (numMatch) {
        templateOrder = parseInt(numMatch[0], 10);
        templateCode = `mau${String(templateOrder).padStart(2, "0")}`;
      } else {
        templateCode = rawMau;
      }
    }

    return {
      isBranded: true,
      userPart: rawUser,
      websitePart: web,
      templateCode,
      templateOrder,
      suffix: rawSuffix,
    };
  }

  // Trường hợp slug có chứa mau\d+ ở đâu đó
  const mauMatch = clean.match(/(?:^|-)(mau\d+)(?:-|$)/);
  if (mauMatch) {
    const num = parseInt(mauMatch[1].replace("mau", ""), 10);
    return {
      isBranded: false,
      templateCode: mauMatch[1],
      templateOrder: num,
    };
  }


  return { isBranded: false };
}

/**
 * Xây dựng URL chia sẻ hoàn chỉnh cho thiệp cưới
 */
export function buildShareableWeddingUrl(baseUrl: string, slug: string): string {
  const cleanBase = (baseUrl || "").replace(/\/+$/, "");
  const cleanSlug = (slug || "").replace(/^\/+/, "");
  return `${cleanBase}/show/${cleanSlug}`;
}

/**
 * Kiểm tra tính hợp lệ của chuỗi slug
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.trim().length < 3) return false;
  return /^[a-z0-9-]+$/.test(slug.trim());
}

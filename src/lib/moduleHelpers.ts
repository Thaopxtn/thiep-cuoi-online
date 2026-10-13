import { resolveBankCode, generateVietQrUrl } from "./vietQrBankCodes";

/** Escape user supplied values before placing them in the inline HTML used by canvas modules. */
export function escapeModuleHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeModuleHtml(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
}

export interface DressCodeColor {
  color: string;
  label: string;
}

export interface CeremonyData {
  ceremonyName: string;
  time: string;
  date: string;
  lunarDate: string;
  location: string;
}

export interface FamilyInfoData {
  groomFather: string;
  groomMother: string;
  groomName: string;
  brideFather: string;
  brideMother: string;
  brideName: string;
}

export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface BankCardData {
  title: string;
  description: string;
  groomBank: BankAccountInfo;
  brideBank: BankAccountInfo;
}

export function getSafeMapUrl(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

/** Explicit account fields take precedence over an old QR image, including when cleared. */
export function getGiftQrUrl(props: Record<string, any>): string {
  if (props.accountNumber !== undefined) {
    return props.bankName ? generateVietQrUrl(props.bankName, props.accountNumber, props.accountName, undefined, "Mung cuoi hai ban") : "";
  }
  try {
    const url = new URL(props.imgKey);
    return url.protocol === "https:" && url.hostname === "img.vietqr.io" ? url.toString() : "";
  } catch {
    return "";
  }
}

// ================= TIMELINE HELPERS =================
export function parseTimelineItems(text?: string, fallbackItems?: TimelineItem[]): TimelineItem[] {
  const defaultItems: TimelineItem[] = [
    { id: "1", time: "10:00", title: "Đón khách" },
    { id: "2", time: "10:30", title: "Photo Booth" },
    { id: "3", time: "11:00", title: "Làm lễ" },
    { id: "4", time: "11:30", title: "Cắt bánh" },
    { id: "5", time: "12:00", title: "Khai tiệc" },
    { id: "6", time: "13:30", title: "Tiễn khách" },
  ];

  if (!text || typeof text !== "string") {
    return fallbackItems && fallbackItems.length > 0 ? fallbackItems : defaultItems;
  }

  const items: TimelineItem[] = [];
  // Regex: tìm cặp time và title từ cấu trúc HTML
  // min-width:65px; ...>TIME</div> ... font-size:14px; ...>TITLE</div>
  const timeTitleRegex = /min-width:65px[^>]*>([\s\S]*?)<\/div>[\s\S]*?font-size:14px[^>]*>([\s\S]*?)<\/div>/gi;
  let match: RegExpExecArray | null;

  while ((match = timeTitleRegex.exec(text)) !== null) {
    const rawTime = decodeModuleHtml(match[1].replace(/<[^>]*>/g, "").trim());
    const rawTitle = decodeModuleHtml(match[2].replace(/<[^>]*>/g, "").trim());
    if (rawTime || rawTitle) {
      items.push({
        id: `t_${items.length + 1}`,
        time: rawTime || "10:00",
        title: rawTitle || "Hoạt động cưới",
      });
    }
  }

  if (items.length > 0) return items;
  return fallbackItems && fallbackItems.length > 0 ? fallbackItems : defaultItems;
}

export function generateTimelineHtml(
  items: TimelineItem[],
  primaryColor = "#6b3b59",
  textColor = "#2c2420"
): string {
  const safeItems = items && items.length > 0 ? items : [
    { id: "1", time: "10:00", title: "Đón khách" },
    { id: "2", time: "11:00", title: "Làm lễ" },
  ];

  const itemsHtml = safeItems
    .map(
      (item, idx) => `
      <div style="display:flex; align-items:center; gap:16px; padding:10px 0; ${
        idx < safeItems.length - 1 ? "border-bottom:1px dashed rgba(0,0,0,0.08);" : ""
      }">
        <div style="min-width:65px; font-weight:bold; font-size:13px; color:${escapeModuleHtml(primaryColor)}; text-align:right;">${
        escapeModuleHtml(item.time || "10:00")
      }</div>
        <div style="width:10px; height:10px; border-radius:50%; background:${escapeModuleHtml(primaryColor)}; flex-shrink:0;"></div>
        <div style="font-weight:600; font-size:14px; color:${escapeModuleHtml(textColor)};">${escapeModuleHtml(item.title || "Sự kiện cưới")}</div>
      </div>
    `
    )
    .join("");

  return `<div style="padding:16px 20px; background:rgba(255,255,255,0.8); border:1px solid rgba(0,0,0,0.06); border-radius:20px; box-shadow:0 6px 20px rgba(0,0,0,0.03);">
    ${itemsHtml}
  </div>`;
}

// ================= DRESS CODE HELPERS =================
export function parseDressCode(
  text?: string,
  fallbackColors?: DressCodeColor[],
  fallbackDesc?: string
): { colors: DressCodeColor[]; description: string } {
  const defaultColors: DressCodeColor[] = [
    { color: "#D7CCB8", label: "Be" },
    { color: "#FFFFFF", label: "Trắng" },
    { color: "#7BA7D9", label: "Xanh dương" },
  ];
  const defaultDesc =
    "Để bức hình kỷ niệm thêm trọn vẹn, quý khách vui lòng lựa chọn trang phục theo tông màu:";

  if (!text || typeof text !== "string") {
    return {
      colors: fallbackColors && fallbackColors.length > 0 ? fallbackColors : defaultColors,
      description: fallbackDesc || defaultDesc,
    };
  }

  // Parse description từ thẻ <p>
  const descMatch = text.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const description = descMatch
    ? decodeModuleHtml(descMatch[1].replace(/<[^>]*>/g, "").trim())
    : fallbackDesc || defaultDesc;

  // Parse colors từ các khối swatch hình tròn (border-radius:50%)
  const colors: DressCodeColor[] = [];
  const swatchRegex = /border-radius:\s*50%;\s*background:\s*([^;]+);[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi;
  let match: RegExpExecArray | null;

  while ((match = swatchRegex.exec(text)) !== null) {
    const rawColor = match[1].trim();
    const rawLabel = match[2].replace(/<[^>]*>/g, "").trim();
    if (rawColor) {
      colors.push({
        color: rawColor,
      label: decodeModuleHtml(rawLabel || "Màu phối"),
      });
    }
  }

  // Fallback nếu không có border-radius:50%
  if (colors.length === 0) {
    const fallbackRegex = /width:\s*(?:36|40|30)px;[^>]*background:\s*([^;]+);[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi;
    while ((match = fallbackRegex.exec(text)) !== null) {
      const rawColor = match[1].trim();
      const rawLabel = match[2].replace(/<[^>]*>/g, "").trim();
      if (rawColor) {
        colors.push({
          color: rawColor,
        label: decodeModuleHtml(rawLabel || "Màu phối"),
        });
      }
    }
  }

  return {
    colors: colors.length > 0 ? colors : fallbackColors && fallbackColors.length > 0 ? fallbackColors : defaultColors,
    description,
  };
}

export function generateDressCodeHtml(
  colors: DressCodeColor[],
  description?: string,
  textColor = "#2c2420"
): string {
  const safeColors = colors && colors.length > 0 ? colors : [
    { color: "#D7CCB8", label: "Be" },
    { color: "#FFFFFF", label: "Trắng" },
    { color: "#7BA7D9", label: "Xanh dương" },
  ];
  const safeDesc =
    description || "Để bức hình kỷ niệm thêm trọn vẹn, quý khách vui lòng lựa chọn trang phục theo tông màu:";

  const colorsHtml = safeColors
    .map(
      (c) => `
      <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
        <div style="width:36px; height:36px; border-radius:50%; background:${
          escapeModuleHtml(c.color || "#fff")
        }; border:2px solid rgba(0,0,0,0.12); box-shadow:0 3px 8px rgba(0,0,0,0.1);"></div>
        <span style="font-size:11px; font-weight:600; color:#555;">${escapeModuleHtml(c.label || "")}</span>
      </div>
    `
    )
    .join("");

  return `<div style="padding:16px; background:rgba(255,255,255,0.75); border:1px solid rgba(0,0,0,0.06); border-radius:20px; text-align:center;">
    <p style="font-size:12px; color:#666; margin-bottom:12px; line-height:1.4;">${escapeModuleHtml(safeDesc)}</p>
    <div style="display:flex; justify-content:center; gap:22px;">
      ${colorsHtml}
    </div>
  </div>`;
}

// ================= CEREMONY HELPERS =================
export function parseCeremony(text?: string, fallback?: Partial<CeremonyData>): CeremonyData {
  const def: CeremonyData = {
    ceremonyName: fallback?.ceremonyName || "Lễ Thành Hôn",
    time: fallback?.time || "11:30",
    date: fallback?.date || "2027-09-15",
    lunarDate: fallback?.lunarDate || "(Tức ngày 15 tháng 8 năm Đinh Mùi)",
    location: fallback?.location || "Tại Trung Tâm Tiệc Cưới",
  };

  if (!text || typeof text !== "string") return def;

  // Lễ name
  const nameMatch = text.match(/text-transform:uppercase;[^>]*>([\s\S]*?)<\/div>/i);
  if (nameMatch) def.ceremonyName = decodeModuleHtml(nameMatch[1].replace(/<[^>]*>/g, "").trim());

  // Time & Date (⏰ 11:30 • 2027-09-15)
  const timeDateMatch = text.match(/⏰\s*([0-9:]+)\s*•\s*([^\s<]+)/i);
  if (timeDateMatch) {
    def.time = decodeModuleHtml(timeDateMatch[1].trim());
    def.date = decodeModuleHtml(timeDateMatch[2].trim());
  }

  // Lunar
  const lunarMatch = text.match(/font-style:italic;[^>]*>([\s\S]*?)<\/div>/i);
  if (lunarMatch) def.lunarDate = decodeModuleHtml(lunarMatch[1].replace(/<[^>]*>/g, "").trim());

  // Location
  const locMatch = text.match(/📍\s*([\s\S]*?)<\/div>/i);
  if (locMatch) def.location = decodeModuleHtml(locMatch[1].replace(/<[^>]*>/g, "").trim());

  return def;
}

export function generateCeremonyHtml(
  data: CeremonyData,
  primaryColor = "#6b3b59",
  textColor = "#2c2420"
): string {
  const lunarHtml = data.lunarDate
    ? `<div style="font-size:11px; color:#888; margin-top:2px; font-style:italic;">${escapeModuleHtml(data.lunarDate)}</div>`
    : "";
  const locHtml = data.location
    ? `<div style="font-size:12px; color:#555; margin-top:4px;">📍 ${escapeModuleHtml(data.location)}</div>`
    : "";

  return `<div style="padding:14px 18px; background:rgba(255,255,255,0.75); border:1px solid rgba(212,175,55,0.3); border-radius:18px; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
    <div style="font-size:14px; font-weight:bold; color:${escapeModuleHtml(primaryColor)}; letter-spacing:1px; text-transform:uppercase;">${
    escapeModuleHtml(data.ceremonyName || "Lễ Thành Hôn")
  }</div>
    <div style="font-size:15px; font-weight:bold; color:${escapeModuleHtml(textColor)}; margin-top:4px;">⏰ ${escapeModuleHtml(data.time || "11:30")} • ${
    escapeModuleHtml(data.date || "2027-09-15")
  }</div>
    ${lunarHtml}
    ${locHtml}
  </div>`;
}

// ================= FAMILY INFO HELPERS =================
export function parseFamilyInfo(text?: string, fallback?: Partial<FamilyInfoData>): FamilyInfoData {
  const def: FamilyInfoData = {
    groomFather: fallback?.groomFather || "Ông Ngô Hữu Việt",
    groomMother: fallback?.groomMother || "Bà Lê Ngọc Linh",
    groomName: fallback?.groomName || "Ngô Gia Dũng",
    brideFather: fallback?.brideFather || "Ông Đặng Đức Quân",
    brideMother: fallback?.brideMother || "Bà Hồ Mỹ Anh",
    brideName: fallback?.brideName || "Đặng Thanh Nhung",
  };

  if (!text || typeof text !== "string") return def;

  // Try extracting Nhà Trai and Nhà Gái text blocks
  const parts = text.split(/NHÀ GÁI/i);
  if (parts.length === 2) {
    const groomPart = parts[0].replace(/<[^>]*>/g, "\n");
    const groomLines = groomPart.split("\n").map((s) => s.trim()).filter(Boolean);
    const groomRows = groomLines.slice(Math.max(0, groomLines.findIndex((l) => /NHÀ TRAI/i.test(l)) + 1));
    if (groomRows[0]) def.groomFather = decodeModuleHtml(groomRows[0]);
    if (groomRows[1]) def.groomMother = decodeModuleHtml(groomRows[1]);
    if (groomRows[2]) def.groomName = decodeModuleHtml(groomRows[2]);

    const bridePart = parts[1].replace(/<[^>]*>/g, "\n");
    const brideLines = bridePart.split("\n").map((s) => s.trim()).filter(Boolean);
    const brideRows = brideLines.slice(Math.max(0, brideLines.findIndex((l) => /NHÀ GÁI/i.test(l)) + 1));
    if (brideRows[0]) def.brideFather = decodeModuleHtml(brideRows[0]);
    if (brideRows[1]) def.brideMother = decodeModuleHtml(brideRows[1]);
    if (brideRows[2]) def.brideName = decodeModuleHtml(brideRows[2]);
  }

  return def;
}

export function generateFamilyInfoHtml(
  data: FamilyInfoData,
  primaryColor = "#6b3b59",
  textColor = "#2c2420"
): string {
  return `<div style="display:flex; justify-content:space-around; font-size:13px; line-height:1.7;">
    <div><b>NHÀ TRAI</b><br/>${escapeModuleHtml(data.groomFather || "Ông Bố Chú Rể")}<br/>${
    escapeModuleHtml(data.groomMother || "Bà Mẹ Chú Rể")
  }<br/><span style="color:${escapeModuleHtml(primaryColor)}; font-weight:bold;">${escapeModuleHtml(data.groomName || "Chú Rể")}</span></div>
    <div><b>NHÀ GÁI</b><br/>${escapeModuleHtml(data.brideFather || "Ông Bố Cô Dâu")}<br/>${
    escapeModuleHtml(data.brideMother || "Bà Mẹ Cô Dâu")
  }<br/><span style="color:${escapeModuleHtml(primaryColor)}; font-weight:bold;">${escapeModuleHtml(data.brideName || "Cô Dâu")}</span></div>
  </div>`;
}

// ================= BANK CARD / VIETQR HELPERS =================
export function parseBankCard(text?: string, fallback?: Partial<BankCardData>): BankCardData {
  const def: BankCardData = {
    title: fallback?.title || "HỘP MỪNG CƯỚI",
    description:
      fallback?.description ||
      "Sự hiện diện của quý vị là món quà quý giá nhất. Quý vị cũng có thể gửi lời chúc và quà mừng qua số tài khoản:",
    groomBank: { bankName: "", accountNumber: "", accountHolder: "", ...fallback?.groomBank },
    brideBank: { bankName: "", accountNumber: "", accountHolder: "", ...fallback?.brideBank },
  };

  if (!text || typeof text !== "string") return def;

  // Extract description
  const titleMatch = text.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
  if (titleMatch) def.title = decodeModuleHtml(titleMatch[1].replace(/<[^>]*>/g, "").trim());
  const pMatch = text.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (pMatch) {
    def.description = decodeModuleHtml(pMatch[1].replace(/<[^>]*>/g, "").trim());
  }

  // Extract account numbers and banks
  const stks: string[] = [];
  const stkRegex = /STK:\s*<b[^>]*>([0-9]+)<\/b>/gi;
  let match: RegExpExecArray | null;
  while ((match = stkRegex.exec(text)) !== null) {
    stks.push(match[1]);
  }

  if (stks[0] && !fallback?.groomBank) def.groomBank.accountNumber = stks[0];
  if (stks[1] && !fallback?.brideBank) def.brideBank.accountNumber = stks[1];

  return def;
}

export function generateBankCardHtml(
  data: BankCardData,
  primaryColor = "#6b3b59",
  textColor = "#2c2420"
): string {
  const accounts = [
    { label: "NHÀ TRAI", account: data.groomBank },
    { label: "NHÀ GÁI", account: data.brideBank },
  ];
  const accountHtml = accounts.map(({ label, account }) => {
    const number = String(account?.accountNumber || "").replace(/[^a-zA-Z0-9]/g, "");
    const bank = account?.bankName || "";
    const holder = (account?.accountHolder || "").toUpperCase();
    const qr = number && !/^0+$/.test(number) && bank
      ? generateVietQrUrl(bank, number, holder, undefined, `Mung cuoi ${holder}`)
      : "";
    return `<div style="background:#fff; border-radius:14px; padding:12px; border:1px solid rgba(0,0,0,0.06); text-align:center;">
      <div style="font-weight:bold; font-size:11px; color:${escapeModuleHtml(primaryColor)}; margin-bottom:6px;">${label}</div>
      ${qr ? `<img src="${escapeModuleHtml(qr)}" alt="VietQR ${label}" style="width:125px; height:140px; object-fit:contain; margin:0 auto 8px;" />` : `<p style="font-size:12px; color:#777;">Chưa có thông tin tài khoản</p>`}
      <div style="font-weight:bold; font-size:12px; color:${escapeModuleHtml(textColor)};">${escapeModuleHtml(bank)}</div>
      ${number && !/^0+$/.test(number) ? `<div style="font-size:11px; color:#555;">STK: <b style="color:#d93849;">${number}</b></div>` : ""}
      <div style="font-size:10px; color:#777; text-transform:uppercase;">${escapeModuleHtml(holder)}</div>
    </div>`;
  }).join("");
  return `<div style="padding:18px; background:rgba(255,255,255,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:24px;">
    <h3 style="margin:0 0 10px; text-align:center; font-size:15px; letter-spacing:1px; color:${escapeModuleHtml(primaryColor)};">${escapeModuleHtml(data.title ?? "HỘP MỪNG CƯỚI")}</h3>
    <p style="font-size:12px; color:#666; text-align:center; margin-bottom:14px; line-height:1.5;">${escapeModuleHtml(data.description ?? "Sự hiện diện của quý vị là món quà quý giá nhất.")}</p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">${accountHtml}</div>
  </div>`;
}

// ================= REAL COUNTDOWN CALCULATOR =================
export function calculateCountdown(targetDate?: string, targetTime?: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isCompleted: boolean;
} {
  if (!targetDate) {
    // Default fallback: 30 days from now
    return { days: 28, hours: 14, minutes: 36, seconds: 50, isCompleted: false };
  }

  let fullTarget = targetDate;
  if (!fullTarget.includes("T") && !fullTarget.includes(":")) {
    const time = targetTime || "11:00:00";
    fullTarget = `${targetDate}T${time.length === 5 ? time + ":00" : time}`;
  }

  const targetTs = new Date(fullTarget).getTime();
  if (isNaN(targetTs)) {
    return { days: 28, hours: 14, minutes: 36, seconds: 50, isCompleted: false };
  }

  const now = Date.now();
  const diff = targetTs - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isCompleted: false,
  };
}

// ================= REAL CALENDAR DATA FORMATTER =================
export function formatCalendarData(props: {
  day?: number;
  month?: number;
  year?: number;
  time?: string;
  targetTime?: string;
  selectedDate?: string;
  targetDate?: string;
}): {
  day: number;
  month: number;
  year: number;
  time: string;
  dayOfWeek: string;
  formattedTitle: string;
} {
  let day = props.day;
  let month = props.month;
  let year = props.year;

  if (props.selectedDate || props.targetDate) {
    const dObj = new Date(props.selectedDate || props.targetDate || "");
    if (!isNaN(dObj.getTime())) {
      if (!day) day = dObj.getDate();
      if (!month) month = dObj.getMonth() + 1;
      if (!year) year = dObj.getFullYear();
    }
  }

  day = day || 29;
  month = month || 12;
  year = year || 2026;

  const dateObj = new Date(year, month - 1, day);
  const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayOfWeek = daysOfWeek[dateObj.getDay()] || "Thứ Ba";
  const time = props.time || props.targetTime || "16:30";

  return {
    day,
    month,
    year,
    time,
    dayOfWeek,
    formattedTitle: `THÁNG ${month} • ${year}`,
  };
}

// ================= UNIFIED MODULE HTML RENDERER =================
export function getModuleRenderHtml(type: string, props: any): string {
  if (!props) return "";

  if (type === "TimelineBox") {
    if (props.items && props.items.length > 0) {
      return generateTimelineHtml(props.items, props.primaryColor, props.textColor);
    }
    if (props.text) return props.text;
    return generateTimelineHtml([], props.primaryColor, props.textColor);
  }

  if (type === "DressCodeBox") {
    if (props.colors && props.colors.length > 0) {
      return generateDressCodeHtml(props.colors, props.description, props.textColor);
    }
    if (props.text) return props.text;
    return generateDressCodeHtml([], props.description, props.textColor);
  }

  if (type === "CeremonyBox") {
    if (props.ceremonyName || props.date || props.location) {
      return generateCeremonyHtml(props, props.primaryColor, props.textColor);
    }
    if (props.text) return props.text;
    return generateCeremonyHtml(props, props.primaryColor, props.textColor);
  }

  if (type === "FamilyInfoBox") {
    if (props.groomName || props.brideName || props.groomFather) {
      return generateFamilyInfoHtml(props, props.primaryColor, props.textColor);
    }
    if (props.text) return props.text;
    return generateFamilyInfoHtml(props, props.primaryColor, props.textColor);
  }

  if (type === "BankCardBox") {
    if (props.groomBank || props.brideBank) {
      return generateBankCardHtml(props, props.primaryColor, props.textColor);
    }
    if (props.text) return props.text;
    return generateBankCardHtml(props, props.primaryColor, props.textColor);
  }

  return props.text || "";
}


/**
 * Helper hỗ trợ định dạng và tạo link mời thiệp cưới đa kênh
 * (Zalo, SMS, Email, Copy link)
 */

export interface FormattedInviteParams {
  guestName: string;
  groomName: string;
  brideName: string;
  guestLink: string;
  weddingDate?: string;
  weddingVenue?: string;
}

export type GuestGroupType = "all" | "groom" | "bride" | "friends" | "colleagues";

export interface ParsedGuestEntry {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  group: GuestGroupType;
  isSent: boolean;
}

/**
 * Tạo URL thiệp cưới có tham số cá nhân hóa tên khách mời
 */
export function formatGuestLink(baseUrl: string, guestName: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}?to=${encodeURIComponent(guestName.trim())}`;
}

/**
 * Tạo nội dung tin nhắn gửi Zalo
 */
export function formatZaloInvite({
  guestName,
  groomName,
  brideName,
  guestLink,
  weddingDate,
}: FormattedInviteParams): string {
  const dateInfo = weddingDate ? ` vào ngày ${weddingDate}` : "";
  return [
    `🌸 THIỆP CƯỚI TRÂN TRỌNG 🌸`,
    `Kính gửi: ${guestName.trim()}`,
    ``,
    `Chúng mình là ${groomName.trim()} & ${brideName.trim()}.`,
    `Trân trọng kính mời bạn và gia đình tới tham dự lễ thành hôn cùng chúng mình${dateInfo} tại:`,
    `👉 ${guestLink}`,
    ``,
    `Sự hiện diện và lời chúc phúc của bạn là niềm vinh hạnh và hạnh phúc lớn nhất của chúng mình! ❤️`,
  ].join("\n");
}

/**
 * Tạo nội dung và URI cho tin nhắn SMS điện thoại (hỗ trợ cả iOS và Android)
 */
export function formatSmsInvite({
  guestName,
  groomName,
  brideName,
  guestLink,
  weddingDate,
}: FormattedInviteParams): { text: string; smsUri: string } {
  const dateInfo = weddingDate ? ` (${weddingDate})` : "";
  const text = `Trân trọng kính mời ${guestName.trim()} tới tham dự lễ cưới của ${groomName.trim()} & ${brideName.trim()}${dateInfo}. Xem thiệp mời tại: ${guestLink}`;
  // Chuẩn SMS separator: iOS hỗ trợ '&body=', Android hỗ trợ '?body='
  const smsUri = `sms:?body=${encodeURIComponent(text)}`;
  return { text, smsUri };
}

/**
 * Tạo tiêu đề, nội dung và mailto link gửi qua Email
 */
export function formatEmailInvite({
  guestName,
  groomName,
  brideName,
  guestLink,
  weddingDate,
  weddingVenue,
}: FormattedInviteParams): { subject: string; body: string; mailtoUrl: string } {
  const subject = `[Thiệp Cưới] Lời Mời Trân Trọng Tới ${guestName.trim()} - Đám Cưới ${groomName.trim()} & ${brideName.trim()}`;
  const dateInfo = weddingDate ? `\n- Thời gian: ${weddingDate}` : "";
  const venueInfo = weddingVenue ? `\n- Địa điểm: ${weddingVenue}` : "";

  const body = [
    `Kính gửi ${guestName.trim()},`,
    ``,
    `Chúng mình là ${groomName.trim()} & ${brideName.trim()}.`,
    `Rất mong được đón tiếp bạn và gia đình trong ngày vui trọng đại của chúng mình!`,
    dateInfo,
    venueInfo,
    ``,
    `Vui lòng bấm vào liên kết dưới đây để mở thiệp cưới điện tử và xem lịch trình hôn lễ:`,
    guestLink,
    ``,
    `Trân trọng,`,
    `${groomName.trim()} & ${brideName.trim()}`,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n");

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailtoUrl };
}

/**
 * Phân tích danh sách nhập hàng loạt từ textarea
 * Hỗ trợ các định dạng:
 * 1. "Nguyễn Văn A"
 * 2. "Nguyễn Văn A - 0912345678"
 * 3. "Nguyễn Văn A, 0912345678, a@gmail.com"
 * 4. "Nguyễn Văn A | Bạn bè | 0912345678"
 */
export function parseBulkGuestInput(
  rawText: string,
  defaultGroup: GuestGroupType = "all"
): ParsedGuestEntry[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const phoneRegex = /(?:\+84|0)[35789]\d{8}\b/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  return lines.map((line, idx) => {
    // Tách các trường theo dấu gạch ngang '-', phẩy ',', hoặc gạch đứng '|'
    const parts = line.split(/[-|,]/).map((p) => p.trim());
    let name = parts[0] || `Khách ${idx + 1}`;
    let phone: string | undefined = undefined;
    let email: string | undefined = undefined;
    let group: GuestGroupType = defaultGroup;

    // Quét các phần tử còn lại để nhận diện phone / email / group
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      if (phoneRegex.test(p)) {
        phone = p;
      } else if (emailRegex.test(p)) {
        email = p;
      } else if (["groom", "bride", "friends", "colleagues"].includes(p.toLowerCase())) {
        group = p.toLowerCase() as GuestGroupType;
      }
    }

    return {
      id: `guest_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      phone,
      email,
      group,
      isSent: false,
    };
  });
}

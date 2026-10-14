import { describe, it, expect } from "vitest";

describe("Bulk Guest Personalized Invitation & Zalo Sharing Logic", () => {
  const cardSlug = "thao-anh-hanh-phuc-2026";
  const baseUrl = `https://zenlove.vn/show/${cardSlug}`;
  const groomName = "Văn Thảo";
  const brideName = "Phương Anh";

  // Hàm sinh URL mời riêng
  function generateGuestLink(base: string, name: string): string {
    return `${base}?to=${encodeURIComponent(name.trim())}`;
  }

  // Hàm tạo tin nhắn Zalo trang trọng
  function generateZaloInvitationText(guestName: string, groom: string, bride: string, link: string): string {
    return `Trân trọng kính mời ${guestName} tới dự lễ thành hôn của ${groom} & ${bride}!\nXem chi tiết thiệp cưới và địa điểm tại: ${link}`;
  }

  // Hàm phân tích danh sách dán thô (multiline raw text)
  function parseRawGuestList(rawText: string, defaultGroup: string = "all") {
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return lines.map((line, idx) => {
      // Hỗ trợ định dạng "Tên - SĐT" hoặc chỉ "Tên"
      const parts = line.split(/[-–—,]/).map((p) => p.trim());
      const name = parts[0] || line;
      const phone = parts.length > 1 ? parts[1] : undefined;

      return {
        id: `guest-${Date.now()}-${idx}`,
        name,
        phone,
        group: defaultGroup,
        isSent: false,
      };
    });
  }

  // Hàm tạo nội dung CSV chuẩn UTF-8 tương thích MS Excel
  function generateCsvContent(guests: Array<{ name: string; phone?: string; group: string; isSent: boolean }>, base: string) {
    const headers = ["STT", "Họ và tên khách mời", "Số điện thoại", "Nhóm khách", "Trạng thái", "Đường dẫn thiệp riêng"];
    const rows = guests.map((g, i) => [
      i + 1,
      `"${g.name.replace(/"/g, '""')}"`,
      `"${g.phone || ""}"`,
      `"${g.group}"`,
      g.isSent ? "Đã gửi" : "Chưa gửi",
      `"${generateGuestLink(base, g.name)}"`,
    ]);

    return "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  it("should generate valid personalized invitation URL with encoded Vietnamese characters", () => {
    const guest1 = "Gia đình Bác Hùng";
    const link1 = generateGuestLink(baseUrl, guest1);
    expect(link1).toContain("to=Gia%20%C4%91%C3%ACnh%20B%C3%A1c%20H%C3%B9ng");
    expect(decodeURIComponent(new URL(link1).searchParams.get("to") || "")).toBe(guest1);

    const guest2 = "Cô & Chú Ba (Đồng Tháp)";
    const link2 = generateGuestLink(baseUrl, guest2);
    expect(link2).toContain(encodeURIComponent(guest2));
  });

  it("should generate respectful Vietnamese invitation message for Zalo sharing", () => {
    const guestName = "Anh Hoàng & Chị Lan";
    const link = generateGuestLink(baseUrl, guestName);
    const msg = generateZaloInvitationText(guestName, groomName, brideName, link);

    expect(msg).toContain("Trân trọng kính mời Anh Hoàng & Chị Lan");
    expect(msg).toContain("Văn Thảo & Phương Anh");
    expect(msg).toContain(link);
  });

  it("should parse multiline raw text into individual guests and clean empty lines", () => {
    const raw = `
      Bác Ba Cà Mau - 0912345678
      Cô Út Sài Gòn
      
      Bạn Tuấn Cấp 3 - 0987654321
      Anh Minh & Chị Mai
    `;

    const parsed = parseRawGuestList(raw, "groom");
    expect(parsed.length).toBe(4);
    expect(parsed[0].name).toBe("Bác Ba Cà Mau");
    expect(parsed[0].phone).toBe("0912345678");
    expect(parsed[0].group).toBe("groom");
    expect(parsed[1].name).toBe("Cô Út Sài Gòn");
    expect(parsed[1].phone).toBeUndefined();
    expect(parsed[2].name).toBe("Bạn Tuấn Cấp 3");
    expect(parsed[3].name).toBe("Anh Minh & Chị Mai");
  });

  it("should export CSV with UTF-8 BOM to ensure flawless display in Microsoft Excel", () => {
    const sampleGuests = [
      { name: "Vợ chồng Chú Năm", phone: "0901234567", group: "Họ Nhà Trai", isSent: true },
      { name: "Đại gia đình Bác Tuấn", phone: "", group: "Họ Nhà Gái", isSent: false },
    ];

    const csv = generateCsvContent(sampleGuests, baseUrl);
    // Phải bắt đầu bằng UTF-8 BOM \uFEFF
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Vợ chồng Chú Năm");
    expect(csv).toContain("Đại gia đình Bác Tuấn");
    expect(csv).toContain("Đã gửi");
    expect(csv).toContain("Chưa gửi");
  });
});

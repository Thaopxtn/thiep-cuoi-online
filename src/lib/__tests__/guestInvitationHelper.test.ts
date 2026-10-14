import { describe, it, expect } from "vitest";
import {
  formatGuestLink,
  formatZaloInvite,
  formatSmsInvite,
  formatEmailInvite,
  parseBulkGuestInput,
} from "../guestInvitationHelper";

describe("guestInvitationHelper", () => {
  const baseUrl = "https://thiepcuoionline.vn/show/quoc-anh-thu-trang";

  it("formatGuestLink should properly append encoded guest name", () => {
    const link = formatGuestLink(baseUrl, "Bác Hùng & Bác Gái");
    expect(link).toBe(
      "https://thiepcuoionline.vn/show/quoc-anh-thu-trang?to=B%C3%A1c%20H%C3%B9ng%20%26%20B%C3%A1c%20G%C3%A1i"
    );
  });

  it("formatZaloInvite should format polite wedding message", () => {
    const link = formatGuestLink(baseUrl, "Anh Hoàng");
    const msg = formatZaloInvite({
      guestName: "Anh Hoàng",
      groomName: "Quốc Anh",
      brideName: "Thu Trang",
      guestLink: link,
      weddingDate: "20/11/2026",
    });

    expect(msg).toContain("🌸 THIỆP CƯỚI TRÂN TRỌNG 🌸");
    expect(msg).toContain("Kính gửi: Anh Hoàng");
    expect(msg).toContain("Quốc Anh & Thu Trang");
    expect(msg).toContain("vào ngày 20/11/2026");
    expect(msg).toContain(link);
  });

  it("formatSmsInvite should produce valid text and smsUri", () => {
    const link = formatGuestLink(baseUrl, "Bạn Mai");
    const { text, smsUri } = formatSmsInvite({
      guestName: "Bạn Mai",
      groomName: "Quốc Anh",
      brideName: "Thu Trang",
      guestLink: link,
    });

    expect(text).toContain("Trân trọng kính mời Bạn Mai");
    expect(text).toContain("Quốc Anh & Thu Trang");
    expect(smsUri.startsWith("sms:?body=")).toBe(true);
    expect(decodeURIComponent(smsUri)).toContain(text);
  });

  it("formatEmailInvite should produce subject, body, and mailtoUrl", () => {
    const link = formatGuestLink(baseUrl, "Chú Tuấn");
    const { subject, body, mailtoUrl } = formatEmailInvite({
      guestName: "Chú Tuấn",
      groomName: "Quốc Anh",
      brideName: "Thu Trang",
      guestLink: link,
      weddingDate: "20/11/2026",
      weddingVenue: "Khách sạn Daewoo Hà Nội",
    });

    expect(subject).toContain("[Thiệp Cưới]");
    expect(subject).toContain("Chú Tuấn");
    expect(body).toContain("Khách sạn Daewoo Hà Nội");
    expect(mailtoUrl.startsWith("mailto:?subject=")).toBe(true);
  });

  describe("parseBulkGuestInput", () => {
    it("should handle empty or whitespace input", () => {
      expect(parseBulkGuestInput("")).toEqual([]);
      expect(parseBulkGuestInput("   \n  \n  ")).toEqual([]);
    });

    it("should parse simple names line by line", () => {
      const input = `Gia đình Bác Hùng\nAnh Tuấn\nChị Lan`;
      const res = parseBulkGuestInput(input, "all");
      expect(res).toHaveLength(3);
      expect(res[0].name).toBe("Gia đình Bác Hùng");
      expect(res[0].group).toBe("all");
      expect(res[0].isSent).toBe(false);
      expect(res[1].name).toBe("Anh Tuấn");
      expect(res[2].name).toBe("Chị Lan");
    });

    it("should extract phone and email when present with delimiters", () => {
      const input = `
        Bác Hùng - 0912345678
        Anh Hoàng - hoang@gmail.com
        Chị Lan & Người thương - 0987654321 - lan@gmail.com - friends
      `;
      const res = parseBulkGuestInput(input, "groom");
      expect(res).toHaveLength(3);

      expect(res[0].name).toBe("Bác Hùng");
      expect(res[0].phone).toBe("0912345678");
      expect(res[0].group).toBe("groom");

      expect(res[1].name).toBe("Anh Hoàng");
      expect(res[1].email).toBe("hoang@gmail.com");

      expect(res[2].name).toBe("Chị Lan & Người thương");
      expect(res[2].phone).toBe("0987654321");
      expect(res[2].email).toBe("lan@gmail.com");
      expect(res[2].group).toBe("friends");
    });
  });
});

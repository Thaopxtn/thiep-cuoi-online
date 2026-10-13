import { describe, it, expect } from "vitest";
import {
  parseTimelineItems,
  generateTimelineHtml,
  parseDressCode,
  generateDressCodeHtml,
  parseCeremony,
  generateCeremonyHtml,
  parseFamilyInfo,
  generateFamilyInfoHtml,
  parseBankCard,
  generateBankCardHtml,
  calculateCountdown,
  formatCalendarData,
  getModuleRenderHtml,
  escapeModuleHtml,
  getGiftQrUrl,
  getSafeMapUrl,
} from "../moduleHelpers";
import { syncCardDataToCanvasNodes } from "../textSyncService";
import { convertFormTemplateToCanvasNodes } from "../templateFormAdapter";

describe("Wedding Card Customization & Real Data Modules", () => {
  describe("Timeline Module", () => {
    it("parses timeline items from HTML correctly", () => {
      const html = generateTimelineHtml([
        { id: "1", time: "09:00", title: "Lễ Dạm Ngõ" },
        { id: "2", time: "11:00", title: "Tiệc Thân Mật" },
      ]);
      const parsed = parseTimelineItems(html);
      expect(parsed.length).toBe(2);
      expect(parsed[0].time).toBe("09:00");
      expect(parsed[0].title).toBe("Lễ Dạm Ngõ");
      expect(parsed[1].time).toBe("11:00");
      expect(parsed[1].title).toBe("Tiệc Thân Mật");
    });

    it("generates timeline HTML safely with items", () => {
      const html = generateTimelineHtml([
        { id: "1", time: "10:00", title: "Đón khách" },
      ]);
      expect(html).toContain("10:00");
      expect(html).toContain("Đón khách");
    });
  });

  describe("Dress Code Module", () => {
    it("parses dress code colors and description", () => {
      const colors = [
        { color: "#D7CCB8", label: "Beige" },
        { color: "#FFFFFF", label: "White" },
      ];
      const desc = "Vui lòng mặc đồ thanh lịch";
      const html = generateDressCodeHtml(colors, desc);
      const parsed = parseDressCode(html);
      expect(parsed.description).toBe(desc);
      expect(parsed.colors.length).toBe(2);
      expect(parsed.colors[0].label).toBe("Beige");
    });
  });

  describe("Ceremony Module", () => {
    it("generates ceremony HTML with dynamic ceremony data", () => {
      const data = {
        ceremonyName: "Lễ Vu Quy",
        time: "09:30",
        date: "2026-11-20",
        lunarDate: "(Tức ngày 10 tháng 10)",
        location: "Tư gia Nhà Gái",
      };
      const html = generateCeremonyHtml(data);
      expect(html).toContain("Lễ Vu Quy");
      expect(html).toContain("09:30");
      expect(html).toContain("2026-11-20");
      expect(html).toContain("Tư gia Nhà Gái");
    });

    it("parses ceremony HTML back to structured data", () => {
      const data = {
        ceremonyName: "Lễ Vu Quy",
        time: "09:30",
        date: "2026-11-20",
        lunarDate: "(Tức ngày 10 tháng 10)",
        location: "Tư gia Nhà Gái",
      };
      const html = generateCeremonyHtml(data);
      const parsed = parseCeremony(html);
      expect(parsed.ceremonyName).toBe("Lễ Vu Quy");
      expect(parsed.time).toBe("09:30");
      expect(parsed.date).toBe("2026-11-20");
    });
  });

  describe("Family Info Module", () => {
    it("generates and parses family info", () => {
      const data = {
        groomFather: "Ông Nguyễn Văn A",
        groomMother: "Bà Trần Thị B",
        groomName: "Nguyễn Văn C",
        brideFather: "Ông Lê Văn D",
        brideMother: "Bà Phạm Thị E",
        brideName: "Lê Thị F",
      };
      const html = generateFamilyInfoHtml(data);
      expect(html).toContain("NHÀ TRAI");
      expect(html).toContain("NHÀ GÁI");
      expect(html).toContain("Nguyễn Văn A");
      expect(html).toContain("Lê Thị F");
      const parsed = parseFamilyInfo(html);
      expect(parsed.groomName).toBe("Nguyễn Văn C");
      expect(parsed.brideName).toBe("Lê Thị F");
    });
  });

  describe("Bank Card / VietQR Module", () => {
    it("generates 2-family VietQR card HTML with valid Napas urls", () => {
      const data = {
        title: "HỘP MỪNG CƯỚI",
        description: "Lời chúc và quà mừng",
        groomBank: {
          bankName: "MB BANK",
          accountNumber: "240220038888",
          accountHolder: "DUC MANH",
        },
        brideBank: {
          bankName: "TECHCOMBANK",
          accountNumber: "190365824988",
          accountHolder: "THUY DUNG",
        },
      };
      const html = generateBankCardHtml(data);
      expect(html).toContain("MB BANK");
      expect(html).toContain("TECHCOMBANK");
      expect(html).toContain("HỘP MỪNG CƯỚI");
      expect(html).toContain("240220038888");
      expect(html).toContain("190365824988");
      expect(html).toContain("vietqr.io");
    });

    it("does not invent a QR account when the account was cleared", () => {
      expect(getGiftQrUrl({ bankName: "MB", accountNumber: "", accountName: "" })).toBe("");
      expect(getSafeMapUrl("javascript:alert(1)", "https://maps.google.com")).toBe("https://maps.google.com");
    });
  });

  describe("Real Countdown Calculator", () => {
    it("calculates countdown for future date", () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 48); // 2 days in future
      const targetDate = future.toISOString().split("T")[0];
      const cd = calculateCountdown(targetDate, "12:00:00");
      expect(cd.isCompleted).toBe(false);
      expect(typeof cd.days).toBe("number");
      expect(typeof cd.hours).toBe("number");
      expect(typeof cd.minutes).toBe("number");
      expect(typeof cd.seconds).toBe("number");
    });

    it("returns isCompleted true for past date", () => {
      const past = "2020-01-01";
      const cd = calculateCountdown(past, "10:00:00");
      expect(cd.isCompleted).toBe(true);
      expect(cd.days).toBe(0);
      expect(cd.seconds).toBe(0);
    });
  });

  describe("Real Calendar Formatter", () => {
    it("computes day of week and title correctly", () => {
      // 2026-12-29 is a Tuesday
      const res = formatCalendarData({ day: 29, month: 12, year: 2026, time: "16:30" });
      expect(res.day).toBe(29);
      expect(res.month).toBe(12);
      expect(res.year).toBe(2026);
      expect(res.dayOfWeek).toBe("Thứ Ba");
      expect(res.formattedTitle).toBe("THÁNG 12 • 2026");
      expect(res.time).toBe("16:30");
    });
  });

  describe("Unified Module HTML Renderer (getModuleRenderHtml)", () => {
    it("escapes user supplied module content before rendering HTML", () => {
      const html = generateTimelineHtml([
        { id: "x", time: "10:00", title: `<img src=x onerror=alert(1)>` },
      ]);
      expect(html).toContain(escapeModuleHtml(`<img src=x onerror=alert(1)>`));
      expect(html).not.toContain(`<img src=x onerror=alert(1)>`);
    });
    it("falls back to generating HTML from structured items if text is missing", () => {
      const html = getModuleRenderHtml("TimelineBox", {
        items: [{ id: "1", time: "10:00", title: "Làm lễ" }],
      });
      expect(html).toContain("10:00");
      expect(html).toContain("Làm lễ");
    });

    it("returns existing text if available", () => {
      const custom = "<div>Custom HTML</div>";
      const html = getModuleRenderHtml("TextBox", { text: custom });
      expect(html).toBe(custom);
    });
  });

  describe("Two-way Sync to Canvas Modules (syncCardDataToCanvasNodes)", () => {
    it("keeps indexed ceremony modules tied to their matching event", () => {
      const nodes: Record<string, any> = {
        ceremony_0: { type: { resolvedName: "CeremonyBox" }, props: { eventIndex: 0 } },
        ceremony_1: { type: { resolvedName: "CeremonyBox" }, props: { eventIndex: 1 } },
      };
      const { syncedNodes } = syncCardDataToCanvasNodes({
        weddingDate: "2026-12-29",
        weddingTime: "16:30",
        events: [
          { id: "a", title: "Lễ Vu Quy", time: "09:00", venue: "Nhà gái", address: "A" },
          { id: "b", title: "Lễ Thành Hôn", time: "16:30", venue: "Nhà trai", address: "B" },
        ],
      }, nodes);
      expect(syncedNodes.ceremony_0.props.ceremonyName).toBe("Lễ Vu Quy");
      expect(syncedNodes.ceremony_1.props.ceremonyName).toBe("Lễ Thành Hôn");
    });
    it("synchronizes wedding date to CountdownBoxV2 and CalendarBoxV2", () => {
      const nodes: Record<string, any> = {
        node_countdown: {
          type: { resolvedName: "CountdownBoxV2" },
          props: { targetDate: "2026-10-10T10:00:00" },
        },
        node_cal: {
          type: { resolvedName: "CalendarBoxV2" },
          props: { day: 10, month: 10, year: 2026, time: "10:00" },
        },
      };

      const { syncedNodes, hasChanges } = syncCardDataToCanvasNodes(
        {
          weddingDate: "2026-12-29",
          weddingTime: "16:30",
        },
        nodes
      );

      expect(hasChanges).toBe(true);
      expect(syncedNodes.node_countdown.props.targetDate).toBe("2026-12-29T16:30:00");
      expect(syncedNodes.node_cal.props.day).toBe(29);
      expect(syncedNodes.node_cal.props.month).toBe(12);
      expect(syncedNodes.node_cal.props.year).toBe(2026);
      expect(syncedNodes.node_cal.props.time).toBe("16:30");
    });

    it("synchronizes venue address to MapBox", () => {
      const nodes: Record<string, any> = {
        node_map: {
          type: { resolvedName: "MapBox" },
          props: { venueName: "Cũ", address: "Hà Nội" },
        },
      };

      const { syncedNodes, hasChanges } = syncCardDataToCanvasNodes(
        {
          events: [
            {
              id: "1",
              title: "Lễ Cưới",
              venue: "Trống Đồng Palace",
              address: "72 Quán Sứ, Hoàn Kiếm, Hà Nội",
              mapUrl: "https://maps.google.com/?q=72+Quan+Su",
            },
          ],
        },
        nodes
      );

      expect(hasChanges).toBe(true);
      expect(syncedNodes.node_map.props.venueName).toBe("Trống Đồng Palace");
      expect(syncedNodes.node_map.props.address).toBe("72 Quán Sứ, Hoàn Kiếm, Hà Nội");
      expect(syncedNodes.node_map.props.mapUrl).toBe("https://maps.google.com/?q=72+Quan+Su");
    });
  });

  it("preserves a form date when the ISO value is at UTC midnight", () => {
    const nodes = convertFormTemplateToCanvasNodes({
      basicInfo: { groomFullName: "A", brideFullName: "B" },
      weddingDate: { date: "2026-12-29T00:00:00.000Z", hour: 0, minute: 5 },
    });
    expect(nodes.node_calendar.props.day).toBe(29);
    expect(nodes.node_calendar.props.month).toBe(12);
    expect(nodes.node_calendar.props.year).toBe(2026);
    expect(nodes.node_calendar.props.time).toBe("00:05");
  });
});

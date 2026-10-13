import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPrivateIp,
  isSafeExternalUrl,
  isSafeExternalUrlAsync,
  sanitizeCsvField,
  getSafeSiteUrl,
  resolveOAuthRedirectOrigin,
} from "../securityUtils";
import {
  generateAdminSessionToken,
  verifyAdminSessionToken,
  revokeAdminSessionToken,
  isCardOwner,
  canClaimLegacyCard,
  checkAdminRateLimit,
  recordAdminFailedAttempt,
  resetAdminRateLimit,
  isAdminAuthConfigured,
  getAdminHmacSecret,
  getConfiguredAdminPasscode,
} from "../serverAuth";
import { toPublicCardDTO, sanitizeRsvpsForPublic } from "../cardDto";
import { WeddingCard } from "@/data/initialCards";

describe("Security Utilities - SSRF Protection & URL Sanitization", () => {
  it("chặn chính xác các dải địa chỉ IP nội bộ (private/loopback/cloud metadata/IPv6)", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("127.0.1.5")).toBe(true);
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("::")).toBe(true);
    expect(isPrivateIp("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true); // IPv6 link-local
    expect(isPrivateIp("fc00::1")).toBe(true); // IPv6 unique local
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.254")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true); // AWS/GCP Metadata
    expect(isPrivateIp("0.0.0.0")).toBe(true);

    // IP công khai hợp lệ
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("142.250.190.46")).toBe(false);
  });

  it("chặn các URL nguy hiểm có nguy cơ tấn công SSRF (cấu trúc và hostname)", () => {
    expect(isSafeExternalUrl("http://localhost:3005/api/admin")).toBe(false);
    expect(isSafeExternalUrl("http://127.0.0.1:8080")).toBe(false);
    expect(isSafeExternalUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSafeExternalUrl("http://metadata.google.internal")).toBe(false);
    expect(isSafeExternalUrl("http://server.local/admin")).toBe(false);
    expect(isSafeExternalUrl("ftp://example.com/image.png")).toBe(false);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);

    // URL an toàn công khai
    expect(isSafeExternalUrl("https://images.unsplash.com/photo-1583939003579")).toBe(true);
    expect(isSafeExternalUrl("https://cdn.pixabay.com/image.jpg")).toBe(true);
    expect(isSafeExternalUrl("https://api.zenlove.me/v1/templates/1")).toBe(true);
  });

  it("xác thực bất đồng bộ DNS resolution ngăn chặn SSRF và DNS Rebinding", async () => {
    // Chặn localhost và metadata
    expect(await isSafeExternalUrlAsync("http://127.0.0.1")).toBe(false);
    expect(await isSafeExternalUrlAsync("http://localhost:3000")).toBe(false);
    // Domain công khai hợp lệ
    expect(await isSafeExternalUrlAsync("https://google.com")).toBe(true);
  });

  it("triệt tiêu lỗ hổng CSV Formula Injection bằng cách escape tiền tố nguy hiểm", () => {
    expect(sanitizeCsvField("=SUM(A1:A10)")).toBe("\"'=SUM(A1:A10)\"");
    expect(sanitizeCsvField("+123456")).toBe("\"'+123456\"");
    expect(sanitizeCsvField("-cmd|' /C calc'!A0")).toBe("\"'-cmd|' /C calc'!A0\"");
    expect(sanitizeCsvField("@SUM(1,2)")).toBe("\"'@SUM(1,2)\"");

    // Dữ liệu văn bản và số bình thường
    expect(sanitizeCsvField("Nguyễn Văn A")).toBe('"Nguyễn Văn A"');
    expect(sanitizeCsvField('Lời chúc "hạnh phúc"')).toBe('"Lời chúc ""hạnh phúc"""');
    expect(sanitizeCsvField(100)).toBe('"100"');
    expect(sanitizeCsvField(null)).toBe('""');
  });

  it("xác định Safe Site URL chuẩn và chống Host Header Poisoning", () => {
    expect(getSafeSiteUrl("localhost:3005")).toBe("http://localhost:3005");
    expect(getSafeSiteUrl("thiepcuoi.zenlove.me")).toBe("https://thiepcuoi.zenlove.me");
    expect(getSafeSiteUrl("evil.com<script>")).toBe("http://localhost:3005");

    // Ngay cả khi biến môi trường NEXT_PUBLIC_SITE_URL là localhost, tên miền thật không bị kéo về localhost
    const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3005";
      expect(getSafeSiteUrl("thiepcuoi.zenlove.me")).toBe("https://thiepcuoi.zenlove.me");
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  it("resolveOAuthRedirectOrigin xác định chính xác domain redirect OAuth, ngăn chặn nhảy về localhost", () => {
    // 1. Khi chạy trên domain thật, bất kể configuredSiteUrl là localhost: trả về đúng tên miền thật
    const prodResult = resolveOAuthRedirectOrigin({
      requestHost: "thiepcuoidep.vn",
      requestProto: "https",
      originParam: "https://thiepcuoidep.vn",
      configuredSiteUrl: "http://localhost:3005",
    });
    expect(prodResult).toBe("https://thiepcuoidep.vn");

    // 2. Khi chạy local dev: trả về localhost
    const localResult = resolveOAuthRedirectOrigin({
      requestHost: "localhost:3005",
      requestProto: "http",
      originParam: "http://localhost:3005",
      configuredSiteUrl: "http://localhost:3005",
    });
    expect(localResult).toBe("http://localhost:3005");

    // 3. Khi kẻ tấn công gửi originParam giả mạo (Open Redirect Attack): bị chặn và trả về domain của server
    const attackResult = resolveOAuthRedirectOrigin({
      requestHost: "thiepcuoidep.vn",
      requestProto: "https",
      originParam: "https://evil-phishing.com",
      configuredSiteUrl: "https://thiepcuoidep.vn",
    });
    expect(attackResult).toBe("https://thiepcuoidep.vn");

    // 4. Khi đi qua Reverse Proxy với header x-forwarded-host và x-forwarded-proto
    const proxyResult = resolveOAuthRedirectOrigin({
      requestHost: "zenlove-wedding.vercel.app",
      requestProto: "https",
      originParam: null,
      configuredSiteUrl: "http://localhost:3005",
    });
    expect(proxyResult).toBe("https://zenlove-wedding.vercel.app");
  });
});

describe("Server Authentication & Admin Session Security", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = "test_super_secure_admin_session_secret_2026_xyz";
  });

  afterEach(() => {
    process.env.ADMIN_SESSION_SECRET = originalSecret;
  });

  it("fail-closed khi thiếu ADMIN_SESSION_SECRET", () => {
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => generateAdminSessionToken()).toThrow("ADMIN_SESSION_SECRET chưa được cấu hình");
    expect(verifyAdminSessionToken("zen_1234_abcd_ef01")).toBe(false);
  });

  it("sinh và xác minh token Admin HMAC hợp lệ với nonce và chữ ký số", () => {
    const token = generateAdminSessionToken();
    expect(token).toMatch(/^zen_\d+_[a-f0-9]{16}_[a-f0-9]{64}$/);

    // Xác minh token hợp lệ
    expect(verifyAdminSessionToken(token)).toBe(true);

    // Token giả mạo hoặc sai HMAC bị từ chối
    expect(verifyAdminSessionToken("zen_123456_fakehash")).toBe(false);
    expect(verifyAdminSessionToken("zen_123456_0123456789abcdef_wronghmac")).toBe(false);
    expect(verifyAdminSessionToken("adm_fake_token")).toBe(false);
    expect(verifyAdminSessionToken("")).toBe(false);
  });

  it("từ chối token Admin đã quá hạn (4 giờ)", () => {
    // Tạo token giả với timestamp từ 5 giờ trước
    const oldTimestamp = Date.now() - 5 * 60 * 60 * 1000;
    const token = `zen_${oldTimestamp}_0123456789abcdef_somehash`;
    expect(verifyAdminSessionToken(token)).toBe(false);
  });

  it("hỗ trợ thu hồi (Revoke) token Admin tức thì", () => {
    const token = generateAdminSessionToken();
    expect(verifyAdminSessionToken(token)).toBe(true);

    // Thu hồi token
    revokeAdminSessionToken(token);
    expect(verifyAdminSessionToken(token)).toBe(false);
  });

  it("kiểm tra chính xác quyền sở hữu thiệp cưới (isCardOwner) - KHÔNG BAO GIỜ gán thiệp không chủ cho khách lạ", () => {
    const cardOwnedByUser1 = { userId: "user-1", groom: { userId: "user-1" } };
    expect(isCardOwner(cardOwnedByUser1, "user-1")).toBe(true);
    expect(isCardOwner(cardOwnedByUser1, "user-2")).toBe(false);

    // Thiệp cũ chưa gắn userId -> Bắt buộc trả về false cho bất kỳ user nào!
    const legacyCard = { userId: undefined, groom: {} };
    expect(isCardOwner(legacyCard, "user-1")).toBe(false);
    expect(isCardOwner(legacyCard, "user-2")).toBe(false);
    expect(isCardOwner(null, "user-1")).toBe(false);
    expect(isCardOwner(legacyCard, "")).toBe(false);
  });

  it("kiểm tra quy trình claim/migrate thiệp cũ (canClaimLegacyCard) có kiểm soát", () => {
    const legacyCard = { userId: undefined, groom: {} };
    const claimedCard = { userId: "user-owner", groom: {} };

    // Admin được phép claim thiệp chưa có chủ
    expect(canClaimLegacyCard(legacyCard, true)).toBe(true);

    // Người dùng thường không được phép tự claim nếu không có quyền Admin
    expect(canClaimLegacyCard(legacyCard, false)).toBe(false);

    // Thiệp đã có chủ thì Admin hay user thường cũng không được ghi đè trái phép
    expect(canClaimLegacyCard(claimedCard, true)).toBe(false);
    expect(canClaimLegacyCard(claimedCard, false)).toBe(false);
  });

  it("hoạt động chuẩn xác của cơ chế Rate Limiting chống Brute-force mã PIN", () => {
    const testIp = "192.0.2.1"; // TEST-NET-1 IP
    resetAdminRateLimit(testIp);

    // Ban đầu được phép
    expect(checkAdminRateLimit(testIp).allowed).toBe(true);

    // Thử sai 5 lần
    for (let i = 0; i < 5; i++) {
      recordAdminFailedAttempt(testIp);
    }

    // Sau 5 lần bị chặn
    const limited = checkAdminRateLimit(testIp);
    expect(limited.allowed).toBe(false);
    expect(limited.retryAfter).toBeGreaterThan(0);

    // Reset lại mở khóa
    resetAdminRateLimit(testIp);
    expect(checkAdminRateLimit(testIp).allowed).toBe(true);
  });
});

describe("PublicCardDTO Data Isolation - Ngăn Lộ Dữ Liệu Khách Mời", () => {
  const mockCard: WeddingCard = {
    id: "card_secret_123",
    slug: "chu-re-co-dau-2026",
    name: "Thiệp Cưới Chú Rể & Cô Dâu",
    templateId: "son-duyen",
    templateName: "Sơn Duyên",
    status: "published",
    updatedAt: "12/10/2026",
    views: 42,
    userId: "secret_owner_id_999",
    coverImage: "https://example.com/cover.jpg",
    story: "Câu chuyện trăm năm",
    weddingDate: "2026-12-25",
    weddingTime: "11:00",
    lunarDate: "Ngày 15 tháng 11 năm Bính Ngọ",
    groom: {
      userId: "secret_owner_id_999",
      name: "Nguyễn Văn Chú Rể",
      title: "Chú Rể",
      phone: "0912345678",
      bankName: "MB Bank",
      accountNumber: "99998888",
    },
    bride: {
      name: "Trần Thị Cô Dâu",
      title: "Cô Dâu",
      phone: "0987654321",
      bankName: "Techcombank",
      accountNumber: "11112222",
    },
    events: [],
    album: [],
    musicTitle: "Beautiful in White",
    musicUrl: "https://example.com/music.mp3",
    rsvps: [
      {
        id: "rsvp_1",
        cardId: "card_secret_123",
        name: "Bác Ba",
        phone: "0909123456",
        attending: true,
        guests: 2,
        note: "Gia đình bác sẽ đi xe riêng tới sớm",
        createdAt: "10/10/2026",
      },
    ],
    wishes: [
      {
        id: "wish_1",
        cardId: "card_secret_123",
        name: "Bạn Cấp 3",
        content: "Chúc hai bạn trăm năm hạnh phúc!",
        createdAt: "11/10/2026",
      },
    ],
  };

  it("toPublicCardDTO loại bỏ hoàn toàn userId của chủ thiệp", () => {
    const publicDto = toPublicCardDTO(mockCard);
    expect((publicDto as any).userId).toBeUndefined();
    expect((publicDto.groom as any).userId).toBeUndefined();
  });

  it("toPublicCardDTO loại bỏ số điện thoại và ghi chú riêng tư của khách mời", () => {
    const publicDto = toPublicCardDTO(mockCard);
    expect(publicDto.rsvps.length).toBe(1);

    const guestRsvp = publicDto.rsvps[0];
    expect(guestRsvp.name).toBe("Bác Ba");
    expect(guestRsvp.attending).toBe(true);
    expect(guestRsvp.guests).toBe(2);

    // Tuyệt đối không để lộ phone và note
    expect((guestRsvp as any).phone).toBeUndefined();
    expect((guestRsvp as any).note).toBeUndefined();
  });

  it("sanitizeRsvpsForPublic làm sạch đúng chuẩn danh sách RSVP", () => {
    const sanitized = sanitizeRsvpsForPublic(mockCard.rsvps);
    expect(sanitized[0].name).toBe("Bác Ba");
    expect((sanitized[0] as any).phone).toBeUndefined();
    expect((sanitized[0] as any).note).toBeUndefined();
  });
});

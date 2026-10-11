import { describe, it, expect } from "vitest";
import { isPrivateIp, isSafeExternalUrl, sanitizeCsvField, getSafeSiteUrl } from "../securityUtils";
import {
  generateAdminSessionToken,
  verifyAdminSessionToken,
  isCardOwner,
  checkAdminRateLimit,
  recordAdminFailedAttempt,
  resetAdminRateLimit,
} from "../serverAuth";

describe("Security Utilities - SSRF Protection & URL Sanitization", () => {
  it("chặn chính xác các dải địa chỉ IP nội bộ (private/loopback/cloud metadata)", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("127.0.1.5")).toBe(true);
    expect(isPrivateIp("::1")).toBe(true);
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

  it("chặn các URL nguy hiểm có nguy cơ tấn công SSRF", () => {
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

  it("triệt tiêu lỗ hổng CSV Formula Injection bằng cách escape tiền tố nguy hiểm", () => {
    // Ký tự công thức nguy hiểm =, +, -, @, \t, \r
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
    // Host có ký tự lạ nguy hiểm -> fallback về mặc định
    expect(getSafeSiteUrl("evil.com<script>")).toBe("http://localhost:3005");
  });
});

describe("Server Authentication & Admin Session Security", () => {
  it("sinh và xác minh token Admin HMAC hợp lệ với chữ ký số", () => {
    const token = generateAdminSessionToken();
    expect(token).toMatch(/^zen_\d+_[a-f0-9]{64}$/);

    // Xác minh token hợp lệ
    expect(verifyAdminSessionToken(token)).toBe(true);

    // Token giả mạo hoặc sai HMAC bị từ chối
    expect(verifyAdminSessionToken("zen_123456_fakehmachash")).toBe(false);
    expect(verifyAdminSessionToken("adm_fake_token")).toBe(false);
    expect(verifyAdminSessionToken("")).toBe(false);
  });

  it("từ chối token Admin đã quá hạn", () => {
    // Tạo token giả với timestamp từ 8 ngày trước (quá hạn 7 ngày)
    const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const token = `zen_${oldTimestamp}_somehash`;
    expect(verifyAdminSessionToken(token)).toBe(false);
  });

  it("kiểm tra chính xác quyền sở hữu thiệp cưới (isCardOwner)", () => {
    const cardOwnedByUser1 = { userId: "user-1", groom: { userId: "user-1" } };
    expect(isCardOwner(cardOwnedByUser1, "user-1")).toBe(true);
    expect(isCardOwner(cardOwnedByUser1, "user-2")).toBe(false);

    // Thiệp cũ chưa gắn userId
    const legacyCard = { userId: undefined, groom: {} };
    expect(isCardOwner(legacyCard, "any-user")).toBe(true);
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

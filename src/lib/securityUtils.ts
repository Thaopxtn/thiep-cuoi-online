/**
 * Security Utilities for ZenLove Wedding
 * - SSRF Protection & Private IP Filtering
 * - CSV Formula Injection Prevention
 * - Safe URL Resolution (Prevent Host Header Poisoning)
 */

import net from "net";

/**
 * Kiểm tra xem một địa chỉ IP có thuộc dải mạng nội bộ (private/loopback/cloud metadata) hay không
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;

  // Xử lý IPv6 loopback
  if (ip === "::1" || ip === "::") return true;

  // Xử lý IPv6 mapping IPv4 dạng ::ffff:127.0.0.1
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // Nếu là IPv4
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [p0, p1] = parts;
    // 0.0.0.0/8 (Broadcast/This network)
    if (p0 === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 10.0.0.0/8 (Private Network Class A)
    if (p0 === 10) return true;
    // 172.16.0.0/12 (Private Network Class B: 172.16.0.0 - 172.31.255.255)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16 (Private Network Class C)
    if (p0 === 192 && p1 === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata AWS/GCP/Azure)
    if (p0 === 169 && p1 === 254) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
  }

  return false;
}

/**
 * Xác thực URL để ngăn chặn SSRF (Server-Side Request Forgery)
 * Chặn localhost, internal IP, cloud metadata endpoints
 */
export function isSafeExternalUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);

    // Chỉ chấp nhận HTTP hoặc HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Chặn hostname đặc biệt
    const blockedHosts = [
      "localhost",
      "127.0.0.1",
      "::1",
      "0.0.0.0",
      "metadata.google.internal",
      "instance-data",
    ];
    if (blockedHosts.includes(hostname)) {
      return false;
    }

    // Chặn các domain kết thúc bằng .internal, .local, .localhost
    if (
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".onion")
    ) {
      return false;
    }

    // Nếu hostname là IP trực tiếp, kiểm tra private IP
    if (net.isIP(hostname)) {
      if (isPrivateIp(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Phòng chống CSV Formula Injection (CWE-1236)
 * Các ký tự =, +, -, @, \t, \r ở đầu ô có thể khiến Excel hoặc Sheets thực thi lệnh độc hại
 */
export function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();

  // Kiểm tra tiền tố công thức nguy hiểm
  const dangerousPrefixes = ["=", "+", "-", "@", "\t", "\r"];
  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    // Thêm dấu nháy đơn ' ở đầu để Excel hiểu là chuỗi văn bản thuần
    str = `'${str}`;
  }

  // Thoát dấu ngoặc kép theo chuẩn RFC 4180
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Lấy URL hệ thống an toàn (chống Host Header Poisoning)
 */
export function getSafeSiteUrl(requestHost?: string | null): string {
  // Ưu tiên biến môi trường cấu hình chính thức
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("your-domain")) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (requestHost) {
    // Chỉ chấp nhận các host hợp lệ (không chứa ký tự lạ)
    const cleanHost = requestHost.split(":")[0];
    if (/^[a-zA-Z0-9.-]+$/.test(cleanHost)) {
      const isLocal = cleanHost === "localhost" || cleanHost === "127.0.0.1";
      const protocol = isLocal ? "http" : "https";
      return `${protocol}://${requestHost}`;
    }
  }

  return "http://localhost:3005";
}

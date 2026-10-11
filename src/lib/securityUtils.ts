/**
 * Security Utilities for ZenLove Wedding
 * - SSRF Protection with DNS Resolution & Rebinding Defense
 * - CSV Formula Injection Prevention (CWE-1236)
 * - Safe URL Resolution (Host Header Poisoning Defense)
 */

import net from "net";
import dns from "dns/promises";

/**
 * Kiểm tra xem một địa chỉ IP có thuộc dải mạng nội bộ (private/loopback/cloud metadata) hay không
 * Hỗ trợ cả IPv4 và IPv6
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;

  const normalized = ip.trim().toLowerCase();

  // IPv6 loopback
  if (normalized === "::1" || normalized === "::" || normalized === "0:0:0:0:0:0:0:1") return true;

  // IPv6 link-local (fe80::/10)
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }

  // IPv6 unique local (fc00::/7 -> fc00... hoặc fd00...)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  // IPv6 mapping IPv4 dạng ::ffff:127.0.0.1 hoặc ::ffff:7f00:1
  let ipv4Str = normalized;
  if (normalized.startsWith("::ffff:")) {
    ipv4Str = normalized.replace("::ffff:", "");
  }

  // Nếu là IPv4
  const parts = ipv4Str.split(".").map(Number);
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
 * Kiểm tra định dạng cơ bản của URL bên ngoài (Synchronous check)
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

    // Chặn các domain nội bộ
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
 * Xác thực an toàn URL nâng cao với DNS Resolution (Chống DNS Rebinding)
 */
export async function isSafeExternalUrlAsync(inputUrl: string): Promise<boolean> {
  if (!isSafeExternalUrl(inputUrl)) return false;

  try {
    const parsed = new URL(inputUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Nếu là IP thuần đã kiểm tra qua isSafeExternalUrl
    if (net.isIP(hostname)) {
      return !isPrivateIp(hostname);
    }

    // Phân giải DNS kiểm tra toàn bộ IPv4 và IPv6 đích
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    // Không phân giải được DNS -> chặn an toàn (Fail Closed)
    return false;
  }
}

/**
 * Hàm fetch an toàn:
 * - Kiểm tra DNS Rebinding trước khi gọi
 * - Xử lý redirect thủ công (chặn redirect sang IP nội bộ)
 * - Timeout và giới hạn dung lượng tải về
 */
export async function safeFetchExternal(
  targetUrl: string,
  options: {
    maxSizeBytes?: number;
    timeoutMs?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const maxBytes = options.maxSizeBytes || 10 * 1024 * 1024;
  const timeoutMs = options.timeoutMs || 6000;

  let currentUrl = targetUrl;
  let redirectsRemaining = 3;

  while (redirectsRemaining >= 0) {
    const isSafe = await isSafeExternalUrlAsync(currentUrl);
    if (!isSafe) {
      throw new Error(`SSRF Blocked: URL mục tiêu hoặc điểm redirect trỏ tới mạng nội bộ: ${currentUrl}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(currentUrl, {
        headers: options.headers,
        signal: controller.signal,
        redirect: "manual",
      });
      clearTimeout(timer);

      // Nếu là redirect (301, 302, 307, 308)
      if ([301, 302, 307, 308].includes(res.status)) {
        const location = res.headers.get("location");
        if (!location) {
          throw new Error("Redirect response thiếu Location header");
        }
        currentUrl = new URL(location, currentUrl).toString();
        redirectsRemaining--;
        continue;
      }

      // Kiểm tra Content-Length
      const cl = res.headers.get("content-length");
      if (cl && parseInt(cl, 10) > maxBytes) {
        throw new Error(`Dung lượng tài nguyên vượt quá giới hạn cho phép (${maxBytes} bytes)`);
      }

      return res;
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  }

  throw new Error("Vượt quá số lần chuyển hướng tối đa (Max redirects exceeded)");
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

/**
 * Phát hiện MIME type thực tế từ Magic Bytes dữ liệu nhị phân (chống bypass MIME)
 */
export function detectImageMimeFromBuffer(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: GIF87a hoặc GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  ) {
    return "image/webp";
  }

  // AVIF: ....ftypavif hoặc ftypavis
  if (buffer.subarray(4, 8).toString() === "ftyp") {
    const brand = buffer.subarray(8, 12).toString();
    if (brand === "avif" || brand === "avis" || brand === "mif1") {
      return "image/avif";
    }
  }

  return null;
}

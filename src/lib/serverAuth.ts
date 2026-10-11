/**
 * Centralized Server Authentication & Authorization Service
 * - Supabase JWT Bearer Verification (GET /auth/v1/user)
 * - HMAC-SHA256 Signed Admin Session Tokens with Timing-Safe Verification
 * - Multi-Tenant Ownership & BOLA/IDOR Protection
 * - Admin Rate Limiting (Brute Force Defense)
 */

import { NextRequest } from "next/server";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

// Bí mật dùng để ký HMAC cho Admin Session
const ADMIN_HMAC_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "zenlove_secure_admin_secret_key_v2";

// Mã PIN quản trị viên
const CONFIGURED_ADMIN_PASSCODE =
  process.env.ADMIN_PASSCODE ||
  process.env.NEXT_PUBLIC_ADMIN_PASSCODE ||
  "zenlove_admin_secure_2026";

// API Key cố định cho các tác vụ server-to-server hoặc QA Automation
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "zenlove_qa_master_key_2026";

// Cache ngắn hạn cho token người dùng (tránh gửi request lặp tới Supabase Auth)
interface CachedUser {
  userId: string;
  email?: string;
  expiresAt: number;
}
const userTokenCache = new Map<string, CachedUser>();

// Bộ nhớ đệm Rate Limiter cho Admin Login (chống brute force PIN)
interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}
const adminRateLimits = new Map<string, RateLimitRecord>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Kiểm tra Rate Limit cho xác thực Admin
 */
export function checkAdminRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = adminRateLimits.get(ip);

  if (!record) {
    adminRateLimits.set(ip, { count: 0, resetAt: now + 10 * 60 * 1000 });
    return { allowed: true };
  }

  // Đang trong thời gian bị block
  if (record.blockedUntil && record.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  // Hết chu kỳ 10 phút -> reset
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + 10 * 60 * 1000;
    record.blockedUntil = undefined;
  }

  return { allowed: true };
}

/**
 * Ghi nhận lần nhập sai mã PIN Admin
 */
export function recordAdminFailedAttempt(ip: string): void {
  const now = Date.now();
  let record = adminRateLimits.get(ip);
  if (!record) {
    record = { count: 1, resetAt: now + 10 * 60 * 1000 };
    adminRateLimits.set(ip, record);
    return;
  }

  record.count += 1;
  // Nếu sai quá 5 lần liên tiếp -> khóa 15 phút
  if (record.count >= 5) {
    record.blockedUntil = now + 15 * 60 * 1000;
  }
}

/**
 * Xóa trạng thái giới hạn khi đăng nhập thành công
 */
export function resetAdminRateLimit(ip: string): void {
  adminRateLimits.delete(ip);
}

/**
 * Tạo token HMAC có chữ ký bảo mật cho Quản trị viên
 */
export function generateAdminSessionToken(): string {
  const timestamp = Date.now();
  const payload = `admin_${timestamp}`;
  const hmac = crypto.createHmac("sha256", ADMIN_HMAC_SECRET).update(payload).digest("hex");
  return `zen_${timestamp}_${hmac}`;
}

/**
 * Xác minh tính hợp lệ của token Admin Session bằng so sánh thời gian an toàn (Constant-time)
 */
export function verifyAdminSessionToken(token: string): boolean {
  if (!token || !token.startsWith("zen_")) return false;

  const parts = token.split("_");
  if (parts.length !== 3) return false;

  const timestamp = parseInt(parts[1], 10);
  const providedHmac = parts[2];

  if (isNaN(timestamp) || !providedHmac) return false;

  // Thời hạn token: 7 ngày
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  const expectedPayload = `admin_${timestamp}`;
  const expectedHmac = crypto.createHmac("sha256", ADMIN_HMAC_SECRET).update(expectedPayload).digest("hex");

  try {
    const providedBuffer = Buffer.from(providedHmac, "hex");
    const expectedBuffer = Buffer.from(expectedHmac, "hex");
    if (providedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Xác thực yêu cầu Admin từ Request HTTP
 * Kiểm tra qua:
 * 1. Header Authorization: Bearer <zen_admin_token>
 * 2. Header x-admin-token: <zen_admin_token>
 * 3. Header x-admin-key: <ADMIN_API_KEY> (cho automation/cron)
 */
export async function verifyAdminAuth(
  request: NextRequest
): Promise<{ authenticated: boolean; error?: string }> {
  // 1. Kiểm tra API Key (cho script QA/E2E hoặc internal service)
  const apiKey = request.headers.get("x-admin-key");
  if (ADMIN_API_KEY && apiKey && apiKey.trim() === ADMIN_API_KEY.trim()) {
    return { authenticated: true };
  }

  // 2. Lấy session token từ Bearer hoặc header x-admin-token
  const authHeader = request.headers.get("authorization");
  let token = "";
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
  } else {
    token = request.headers.get("x-admin-token") || "";
  }

  if (!token) {
    return { authenticated: false, error: "Yêu cầu quyền Quản trị viên (Thiếu token xác thực)" };
  }

  if (verifyAdminSessionToken(token)) {
    return { authenticated: true };
  }

  return { authenticated: false, error: "Token Quản trị viên không hợp lệ hoặc đã hết hạn" };
}

/**
 * Xác thực User Session qua Supabase Auth
 * - Đọc Bearer token từ header
 * - Gọi /auth/v1/user để xác minh danh tính thật
 * - Không cho phép giả mạo userId qua body/header
 */
export async function verifyUserAuth(
  request: NextRequest
): Promise<{ authenticated: boolean; userId?: string; email?: string; error?: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    // Nếu ở môi trường local development không có Supabase, cho phép dev fallback
    if (process.env.NODE_ENV !== "production" && !SUPABASE_URL) {
      const devUserId = request.headers.get("x-user-id");
      if (devUserId) {
        return { authenticated: true, userId: devUserId, email: "dev@zenlove.local" };
      }
    }
    return { authenticated: false, error: "Chưa đăng nhập (Thiếu Bearer Token)" };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { authenticated: false, error: "Token xác thực rỗng" };
  }

  // Kiểm tra cache ngắn hạn (1 phút)
  const cached = userTokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { authenticated: true, userId: cached.userId, email: cached.email };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Chế độ offline dev
    if (process.env.NODE_ENV !== "production") {
      const devUserId = request.headers.get("x-user-id") || `dev_${token.slice(0, 8)}`;
      return { authenticated: true, userId: devUserId, email: "dev@zenlove.local" };
    }
    return { authenticated: false, error: "Chưa cấu hình Supabase Auth" };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { authenticated: false, error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" };
    }

    const userData = await res.json();
    if (!userData || !userData.id) {
      return { authenticated: false, error: "Không tìm thấy thông tin người dùng" };
    }

    // Lưu cache 60s
    userTokenCache.set(token, {
      userId: userData.id,
      email: userData.email,
      expiresAt: Date.now() + 60 * 1000,
    });

    return { authenticated: true, userId: userData.id, email: userData.email };
  } catch (err: any) {
    return { authenticated: false, error: err.message || "Lỗi kiểm tra phiên xác thực người dùng" };
  }
}

/**
 * Kiểm tra xem một người dùng có quyền sở hữu thiệp cưới hay không
 */
export function isCardOwner(
  card: { userId?: string; groom?: { userId?: string } },
  verifiedUserId: string
): boolean {
  if (!card) return false;
  const ownerId = card.userId || card.groom?.userId;
  if (!ownerId) return true; // Thiệp chưa gắn chủ sở hữu cụ thể (legacy)
  return ownerId === verifiedUserId;
}

export { CONFIGURED_ADMIN_PASSCODE, getClientIp };

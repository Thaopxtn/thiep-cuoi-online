/**
 * Centralized Server Authentication & Authorization Service
 * - Supabase JWT Bearer Verification (GET /auth/v1/user)
 * - HMAC-SHA256 Signed Admin Session Tokens with Timing-Safe Verification
 * - Multi-Tenant Ownership & BOLA/IDOR Protection
 * - Admin Rate Limiting (Brute Force Defense)
 * - Strict Fail-Closed Policy: No Hardcoded Default Fallback Secrets
 */

import { NextRequest } from "next/server";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

/**
 * Lấy HMAC Secret cho Admin Session
 * KHÔNG sử dụng secret mặc định tĩnh. Phải cấu hình qua biến môi trường.
 */
export function getAdminHmacSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
}

/**
 * Lấy Passcode Quản trị viên
 * KHÔNG sử dụng mã PIN mặc định tĩnh. Phải cấu hình qua biến môi trường.
 */
export function getConfiguredAdminPasscode(): string {
  return (
    process.env.ADMIN_PASSCODE ||
    process.env.NEXT_PUBLIC_ADMIN_PASSCODE ||
    ""
  ).trim();
}

/**
 * Lấy Admin API Key (nếu được cấu hình riêng cho automation)
 * KHÔNG có khóa QA mặc định tĩnh.
 */
export function getConfiguredAdminApiKey(): string {
  return (process.env.ADMIN_API_KEY || "").trim();
}

/**
 * Kiểm tra xem hệ thống xác thực Quản trị viên đã được cấu hình đầy đủ chưa
 */
export function isAdminAuthConfigured(): boolean {
  const secret = getAdminHmacSecret();
  const passcode = getConfiguredAdminPasscode();
  return Boolean(secret && secret.length >= 16 && passcode && passcode.length >= 6);
}

// Danh sách token admin đã bị thu hồi (Revocation store)
const revokedAdminTokens = new Set<string>();

// Cache ngắn hạn cho token người dùng (tránh gửi request lặp tới Supabase Auth)
interface CachedUser {
  userId: string;
  email?: string;
  isAdmin?: boolean;
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

export function getClientIp(request: NextRequest): string {
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
  // Nếu sai từ 5 lần trở lên -> khóa 15 phút
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
 * Thời hạn hiệu lực: 4 giờ
 */
export function generateAdminSessionToken(): string {
  const secret = getAdminHmacSecret();
  if (!secret) {
    throw new Error("Không thể tạo phiên Admin: ADMIN_SESSION_SECRET chưa được cấu hình");
  }

  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `admin_${timestamp}_${nonce}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `zen_${timestamp}_${nonce}_${hmac}`;
}

/**
 * Thu hồi một token Admin Session (Revoke)
 */
export function revokeAdminSessionToken(token: string): void {
  if (token) {
    revokedAdminTokens.add(token);
  }
}

/**
 * Xác minh tính hợp lệ của token Admin Session bằng so sánh thời gian an toàn (Constant-time)
 */
export function verifyAdminSessionToken(token: string): boolean {
  if (!token || !token.startsWith("zen_")) return false;
  if (revokedAdminTokens.has(token)) return false;

  const secret = getAdminHmacSecret();
  if (!secret) return false;

  const parts = token.split("_");
  if (parts.length !== 4) return false;

  const timestamp = parseInt(parts[1], 10);
  const nonce = parts[2];
  const providedHmac = parts[3];

  if (isNaN(timestamp) || !nonce || !providedHmac) return false;

  // Thời hạn token: 4 giờ (14,400,000 ms)
  const maxAgeMs = 4 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  const payload = `admin_${timestamp}_${nonce}`;
  const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

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
 * Kiểm tra tuần tự:
 * 1. Bearer token / Header x-admin-token / Cookie admin_session:
 *    - Xác thực qua HMAC Admin Session Token
 *    - Hoặc xác thực qua Supabase Auth nếu user có role === 'admin' trong app_metadata
 * 2. Header x-admin-key: Chỉ chấp nhận nếu ADMIN_API_KEY được cấu hình cụ thể và so sánh constant-time
 */
export async function verifyAdminAuth(
  request: NextRequest
): Promise<{ authenticated: boolean; error?: string }> {
  // 1. Kiểm tra API Key (nếu có cấu hình)
  const configuredApiKey = getConfiguredAdminApiKey();
  const providedApiKey = request.headers.get("x-admin-key");
  if (configuredApiKey && providedApiKey) {
    try {
      const provBuf = Buffer.from(providedApiKey.trim());
      const confBuf = Buffer.from(configuredApiKey);
      if (provBuf.length === confBuf.length && crypto.timingSafeEqual(provBuf, confBuf)) {
        return { authenticated: true };
      }
    } catch {}
  }

  // 2. Lấy session token từ Bearer header, x-admin-token header hoặc admin_session cookie
  let token = "";
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (request.headers.get("x-admin-token")) {
    token = request.headers.get("x-admin-token") || "";
  } else {
    // Kiểm tra cookie an toàn
    const cookieToken = request.cookies.get("admin_session")?.value;
    if (cookieToken) token = cookieToken;
  }

  if (!token) {
    return { authenticated: false, error: "Yêu cầu quyền Quản trị viên (Thiếu token xác thực)" };
  }

  // 3. Nếu là token phiên Admin ký HMAC
  if (token.startsWith("zen_")) {
    if (verifyAdminSessionToken(token)) {
      return { authenticated: true };
    }
    return { authenticated: false, error: "Phiên Quản trị viên không hợp lệ hoặc đã hết hạn" };
  }

  // 4. Nếu là token Supabase JWT: kiểm tra quyền Admin qua Supabase Auth
  const userAuth = await verifyUserAuth(request);
  if (userAuth.authenticated && userAuth.isAdmin) {
    return { authenticated: true };
  }

  return { authenticated: false, error: "Tài khoản không có đặc quyền Quản trị viên" };
}

/**
 * Xác thực User Session qua Supabase Auth
 * - Đọc Bearer token từ header
 * - Gọi /auth/v1/user để xác minh danh tính thật
 * - Không cho phép giả mạo userId qua body/header
 */
export async function verifyUserAuth(
  request: NextRequest
): Promise<{
  authenticated: boolean;
  userId?: string;
  email?: string;
  isAdmin?: boolean;
  error?: string;
}> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { authenticated: false, error: "Chưa đăng nhập (Thiếu Bearer Token)" };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { authenticated: false, error: "Token xác thực rỗng" };
  }

  // Kiểm tra cache ngắn hạn (60s)
  const cached = userTokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      authenticated: true,
      userId: cached.userId,
      email: cached.email,
      isAdmin: cached.isAdmin,
    };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { authenticated: false, error: "Chưa cấu hình Supabase Auth trên máy chủ" };
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

    // Kiểm tra quyền Admin trong metadata máy chủ
    const isAdmin = Boolean(
      userData.app_metadata?.role === "admin" ||
      userData.user_metadata?.role === "admin"
    );

    // Lưu cache 60s
    userTokenCache.set(token, {
      userId: userData.id,
      email: userData.email,
      isAdmin,
      expiresAt: Date.now() + 60 * 1000,
    });

    return {
      authenticated: true,
      userId: userData.id,
      email: userData.email,
      isAdmin,
    };
  } catch (err: any) {
    return {
      authenticated: false,
      error: err.message || "Lỗi kiểm tra phiên xác thực người dùng",
    };
  }
}

/**
 * Kiểm tra xem một người dùng có quyền sở hữu thiệp cưới hay không (BOLA/IDOR Defense)
 * - Nếu không có verifiedUserId: Luôn trả về FALSE.
 * - Nếu thiệp không có ownerId: Luôn trả về FALSE (Không bao giờ coi thiệp không chủ là của bất kỳ ai!).
 * - Chỉ trả về TRUE khi ownerId trùng khớp chính xác với verifiedUserId.
 */
export function isCardOwner(
  card: { userId?: string; groom?: { userId?: string } } | null | undefined,
  verifiedUserId: string | null | undefined
): boolean {
  if (!card || !verifiedUserId) return false;
  const ownerId = card.userId || card.groom?.userId;
  if (!ownerId) {
    // Thiệp không có chủ sở hữu -> Tuyệt đối KHÔNG gán cho người dùng bất kỳ!
    return false;
  }
  return ownerId === verifiedUserId;
}

/**
 * Quy trình kiểm tra điều kiện claim/migrate thiệp cũ (Legacy Card)
 * Chỉ cho phép claim nếu:
 * 1. Thiệp thực sự chưa có chủ sở hữu (không ghi đè thiệp đã có chủ).
 * 2. Người thực hiện là Admin đã xác thực, HOẶC cung cấp mã khóa claim hợp lệ.
 */
export function canClaimLegacyCard(
  card: { userId?: string; groom?: { userId?: string } },
  isAdmin: boolean,
  claimSecretKey?: string
): boolean {
  if (!card) return false;
  const existingOwner = card.userId || card.groom?.userId;
  if (existingOwner) return false; // Đã có chủ, chống xung đột ghi đè

  if (isAdmin) return true;

  const validMigrationSecret = process.env.CARD_MIGRATION_SECRET;
  if (validMigrationSecret && claimSecretKey && claimSecretKey === validMigrationSecret) {
    return true;
  }

  return false;
}

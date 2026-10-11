/**
 * Client-Side API Fetch Wrapper
 * - Tự động đính kèm Supabase Access Token (Bearer)
 * - Tự động làm mới phiên (Refresh Token) khi gặp HTTP 401
 * - Bảo tồn thay đổi trong Visual Editor khi phiên hết hạn
 */

const STORAGE_KEY = "zenlove_auth_user";

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthAccessToken(): string | undefined {
  const user = getStoredUser();
  return user?.accessToken || undefined;
}

export function getAuthRefreshToken(): string | undefined {
  const user = getStoredUser();
  return user?.refreshToken || undefined;
}

export function setStoredAccessToken(newAccessToken: string, newRefreshToken?: string): void {
  if (typeof window === "undefined") return;
  const user = getStoredUser();
  if (user) {
    user.accessToken = newAccessToken;
    if (newRefreshToken) user.refreshToken = newRefreshToken;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Thử làm mới token khi token cũ hết hạn
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getAuthRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.accessToken) {
        setStoredAccessToken(data.accessToken, data.refreshToken);
        return data.accessToken;
      }
    }
  } catch (err) {
    console.warn("Lỗi refresh token tự động:", err);
  }

  return null;
}

/**
 * API Fetch Client tập trung cho toàn bộ ứng dụng
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAuthAccessToken();

  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  // Nếu trả về 401 Unauthorized và có refresh token: thử refresh một lần
  if (response.status === 401 && getAuthRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        return fetch(input, {
          ...init,
          headers,
        });
      }
    } else {
      // Đang có request khác refresh: đợi token mới
      return new Promise<Response>((resolve) => {
        refreshSubscribers.push(async (newToken) => {
          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            resolve(fetch(input, { ...init, headers }));
          } else {
            resolve(response);
          }
        });
      });
    }

    // Nếu không refresh được: kích hoạt sự kiện session expired
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("zenlove:session-expired", {
          detail: { url: input },
        })
      );
    }
  }

  return response;
}

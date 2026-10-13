"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: "google" | "email";
  accessToken?: string;
  refreshToken?: string;
  createdAt: string;
}

export interface PendingIntent {
  type: "clone_template" | "open_editor";
  templateId: string;
  customGroom?: string;
  customBride?: string;
  targetUrl?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: UserProfile }>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string; user?: UserProfile }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (name: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  loginModalMessage: string | null;
  pendingIntent: PendingIntent | null;
  openLoginModal: (message?: string | unknown, intent?: PendingIntent) => void;
  closeLoginModal: () => void;
  clearPendingIntent: () => void;
  syncSession: () => void;
  setAuthUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  loginWithGoogle: () => {},
  loginWithEmail: async () => ({ success: false }),
  registerWithEmail: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  logout: () => {},
  isLoginModalOpen: false,
  loginModalMessage: null,
  pendingIntent: null,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  clearPendingIntent: () => {},
  syncSession: () => {},
  setAuthUser: () => {},
});

const STORAGE_KEY = "zenlove_auth_user";
const PENDING_INTENT_KEY = "zenlove_pending_intent";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<PendingIntent | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const syncSession = React.useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        return parsed;
      } else {
        setUser(null);
        return null;
      }
    } catch (e) {
      console.error("Failed to sync user session:", e);
      return null;
    }
  }, []);

  const setAuthUser = React.useCallback((profile: UserProfile | null) => {
    setUser(profile);
    if (typeof window !== "undefined") {
      if (profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      window.dispatchEvent(new CustomEvent("zenlove:auth-changed", { detail: profile }));
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    syncSession();

    try {
      const storedIntent = sessionStorage.getItem(PENDING_INTENT_KEY);
      if (storedIntent) {
        setPendingIntent(JSON.parse(storedIntent));
      }
    } catch (e) {
      console.error("Failed to restore pending intent:", e);
    }

    const handleSessionExpired = (e: any) => {
      openLoginModal("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục lưu và xuất bản.");
    };

    const handleAuthChanged = (e: any) => {
      if (e?.detail) {
        setUser(e.detail);
      } else {
        syncSession();
      }
    };

    window.addEventListener("zenlove:session-expired", handleSessionExpired);
    window.addEventListener("zenlove:auth-changed", handleAuthChanged);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener("zenlove:session-expired", handleSessionExpired);
      window.removeEventListener("zenlove:auth-changed", handleAuthChanged);
      window.removeEventListener("storage", syncSession);
    };
  }, [syncSession]);

  const loginWithGoogle = () => {
    if (typeof window !== "undefined") {
      const origin = encodeURIComponent(window.location.origin);
      window.location.href = `/api/auth/google?origin=${origin}`;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user && data.session?.access_token) {
        const sessionUser = {
          ...data.user,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        };
        setUser(sessionUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
        setIsLoginModalOpen(false);
        setLoginModalMessage(null);
        return { success: true, message: data.message, user: sessionUser };
      }
      if (data.success && data.user && !data.session?.access_token) {
        return { success: false, message: "Tài khoản đã được tạo. Vui lòng xác minh email trước khi đăng nhập." };
      }
      return { success: false, message: data.message || "Đăng nhập thất bại" };
    } catch (err: any) {
      return { success: false, message: err.message || "Lỗi kết nối máy chủ" };
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success && data.user && data.session?.access_token) {
        const sessionUser = {
          ...data.user,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        };
        setUser(sessionUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
        setIsLoginModalOpen(false);
        setLoginModalMessage(null);
        return { success: true, message: data.message, user: sessionUser };
      }
      if (data.success && data.user && !data.session?.access_token) {
        return { success: false, message: "Đăng ký thành công. Vui lòng xác minh email trước khi đăng nhập." };
      }
      return { success: false, message: data.message || "Đăng ký thất bại" };
    } catch (err: any) {
      return { success: false, message: err.message || "Lỗi kết nối máy chủ" };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return { success: false, message: "Bạn chưa đăng nhập" };
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(user.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {})
        },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Lỗi cập nhật mật khẩu" };
    }
  };

  const updateProfile = async (name: string) => {
    if (!user) return { success: false, message: "Bạn chưa đăng nhập" };
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(user.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {})
        },
        body: JSON.stringify({ userId: user.id, name }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...user, name };
        setUser(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return { success: true, message: "Cập nhật họ tên thành công!" };
      }
      return { success: false, message: data.message || "Cập nhật thất bại" };
    } catch (err: any) {
      return { success: false, message: err.message || "Lỗi cập nhật hồ sơ" };
    }
  };

  const openLoginModal = (message?: string | unknown, intent?: PendingIntent) => {
    if (typeof message === "string") {
      setLoginModalMessage(message);
    } else {
      setLoginModalMessage(null);
    }
    if (intent) {
      setPendingIntent(intent);
      try {
        sessionStorage.setItem(PENDING_INTENT_KEY, JSON.stringify(intent));
      } catch (e) {}
    }
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginModalMessage(null);
  };

  const clearPendingIntent = () => {
    setPendingIntent(null);
    try {
      sessionStorage.removeItem(PENDING_INTENT_KEY);
    } catch (e) {}
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    clearPendingIntent();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: isMounted ? user : null,
        isLoggedIn: isMounted ? !!user : false,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        updatePassword,
        updateProfile,
        logout,
        isLoginModalOpen,
        loginModalMessage,
        pendingIntent,
        openLoginModal,
        closeLoginModal,
        clearPendingIntent,
        syncSession,
        setAuthUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

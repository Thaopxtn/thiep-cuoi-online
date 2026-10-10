"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: "google" | "email";
  accessToken?: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (name: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
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
  openLoginModal: () => {},
  closeLoginModal: () => {},
});

const STORAGE_KEY = "zenlove_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to restore user session:", e);
    }
  }, []);

  const loginWithGoogle = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/api/auth/google";
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
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setIsLoginModalOpen(false);
        return { success: true, message: data.message };
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
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setIsLoginModalOpen(false);
        return { success: true, message: data.message };
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

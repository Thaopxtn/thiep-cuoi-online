"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: "google";
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  loginWithGoogle: (customUser?: Partial<UserProfile>) => void;
  openNativeBrowserLogin: () => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  loginWithGoogle: () => {},
  openNativeBrowserLogin: () => {},
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

  const loginWithGoogle = (customUser?: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      id: customUser?.id || "google-user-" + Date.now(),
      name: customUser?.name || "Tài khoản Google",
      email: customUser?.email || "user@gmail.com",
      avatar:
        customUser?.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
      provider: "google",
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setIsLoginModalOpen(false);
  };

  const openNativeBrowserLogin = () => {
    if (typeof window !== "undefined") {
      window.open("https://zenlove.me/login", "_blank");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user: isMounted ? user : null,
        isLoggedIn: isMounted ? !!user : false,
        loginWithGoogle,
        openNativeBrowserLogin,
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

"use client";

import React, { useState } from "react";
import { X, ExternalLink, CheckCircle, ShieldCheck, Mail, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, loginWithGoogle, openNativeBrowserLogin, user } =
    useAuth();
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleQuickGoogleLogin = () => {
    loginWithGoogle({
      name: googleName.trim() || "Người dùng Google",
      email: googleEmail.trim() || "thaoh.user@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={closeLoginModal}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 relative transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
          aria-label="Đóng modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-3 shadow-inner">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Đăng nhập tài khoản</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Đăng nhập bằng tài khoản Google để lưu trữ, quản lý và chỉnh sửa mẫu thiệp của bạn
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* One click Google login */}
          <button
            onClick={handleQuickGoogleLogin}
            className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm shadow-xs flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>

          {/* Open Native Browser to ZenLove */}
          <button
            onClick={openNativeBrowserLogin}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-zen-primary to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-zen-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Đăng nhập trên zenlove.me (Trình duyệt)</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Custom Details */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-xs text-gray-500 hover:text-zen-primary transition-colors underline"
          >
            {isCustomMode ? "Ẩn tùy chỉnh thông tin" : "Tùy chỉnh thông tin tài khoản Google"}
          </button>

          {isCustomMode && (
            <div className="mt-3 text-left space-y-2.5 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên hiển thị:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàng Thảo"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-zen-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Google:
                </label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-zen-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleQuickGoogleLogin}
                className="w-full mt-2 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-bold"
              >
                Lưu và đăng nhập
              </button>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Bảo mật an toàn & đồng bộ trực tiếp với trình duyệt</span>
        </div>
      </div>
    </div>
  );
}

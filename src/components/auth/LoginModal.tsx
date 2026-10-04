"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, loginWithGoogle, loginWithEmail, registerWithEmail } =
    useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "login") {
      const res = await loginWithEmail(email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.message || "Email hoặc mật khẩu không chính xác");
      }
    } else {
      if (!name.trim()) {
        setError("Vui lòng nhập họ và tên của bạn");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự");
        setLoading(false);
        return;
      }
      const res = await registerWithEmail(name, email, password);
      setLoading(false);
      if (res.success) {
        setSuccess("Đăng ký tài khoản thành công! Đang đăng nhập...");
      } else {
        setError(res.message || "Không thể đăng ký tài khoản");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={closeLoginModal}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 relative transition-all animate-scale-up"
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
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-3 shadow-inner font-bold text-xl">
            💌
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "login" ? "Đăng nhập tài khoản" : "Tạo tài khoản mới"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {mode === "login"
              ? "Đăng nhập để lưu, quản lý và xuất bản thiệp cưới của bạn"
              : "Đăng ký miễn phí để bắt đầu tạo thiệp cưới online cao cấp"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "register"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-2xs flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.98] mb-4"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-400">
            <span className="bg-white px-2">Hoặc dùng tài khoản Email</span>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Manual Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
          {mode === "register" && (
            <div>
              <label className="block text-gray-700 font-bold mb-1">Họ và tên</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Thảo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-zen-primary transition-colors font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-zen-primary transition-colors font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-zen-primary transition-colors font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === "login" ? "Đăng nhập ngay" : "Tạo tài khoản"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Bảo mật mã hóa 256-bit qua Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}

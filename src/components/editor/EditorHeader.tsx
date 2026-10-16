"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  Undo2,
  Redo2,
  Moon,
  Sun,
  Keyboard,
  Eye,
  Upload,
  Settings,
  Save,
  ShieldCheck,
  Camera,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface EditorHeaderProps {
  templateName: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onRepairDecorations?: () => void;
  onExportImage?: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings?: () => void;
  isSaved?: boolean;
  onBackToTemplates?: () => void;
}

export default function EditorHeader({
  templateName,
  canUndo = true,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  onRepairDecorations,
  onExportImage,
  onPreview,
  onPublish,
  onOpenShortcuts,
  onOpenSettings,
  isSaved = true,
}: EditorHeaderProps) {
  const { user, isLoggedIn, openLoginModal } = useAuth();
  const [isDark, setIsDark] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMobileMenuOpen]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="h-13 sm:h-14 bg-[#18181b] text-zinc-200 px-2.5 sm:px-4 flex items-center justify-between z-50 border-b border-zinc-800/80 select-none shrink-0">
      {/* 1. KHU VỰC BÊN TRÁI: Menu, Logo tinh gọn, Tên mẫu & Trạng thái lưu */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <Link
          href="/templates"
          className="p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors shrink-0"
          title="Quay lại kho mẫu thiệp"
        >
          <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </Link>

        {/* Logo: Khi thiếu khoảng trống chỉ hiển thị biểu tượng logo (♥), khi rộng hiển thị thêm chữ zenlove */}
        <Link
          href="/"
          className="flex items-center gap-1.5 group shrink-0"
          title="Trang chủ ZenLove"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-500 to-[#e54153] flex items-center justify-center text-white font-bold shadow-xs transition-transform group-hover:scale-105">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          {/* Ẩn chữ zenlove khi không đủ khoảng trống (chỉ hiện trên màn hình rộng) */}
          <span className="font-bold text-sm tracking-tight text-white hidden xl:inline-block">
            zenlove
          </span>
        </Link>

        <div className="w-px h-4 bg-zinc-800 mx-0.5 sm:mx-1 shrink-0" />

        {/* Tên mẫu thiệp & Trạng thái lưu tinh tế chuẩn Figma/Canva (Không dùng khung viền màu sặc sỡ) */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-zinc-300 truncate max-w-[100px] sm:max-w-[160px] md:max-w-[220px]">
            {templateName}
          </span>

          {/* Trạng thái lưu: Dấu chấm và chữ tinh gọn, không viền khung */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] shrink-0">
            {isSaved ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium" title="Bản thiết kế đã được lưu tự động">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="hidden md:inline text-zinc-400">Đã lưu</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium" title="Đang lưu thay đổi...">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="hidden md:inline text-zinc-400">Đang lưu...</span>
              </span>
            )}
          </div>
        </div>

        {/* Hoàn tác / Làm lại (Undo & Redo) */}
        <div className="flex items-center gap-0.5 ml-1 sm:ml-2 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. KHU VỰC BÊN PHẢI: Các công cụ thao tác tinh gọn, chuyên nghiệp (Ghost style không khung lòe loẹt) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Nút Lưu (Desktop) */}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-300 hover:text-white text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
            title="Lưu bản thiết kế (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
            <span className="hidden lg:inline">Lưu</span>
          </button>
        )}

        {/* Cài đặt thiệp (Desktop) */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-300 hover:text-white text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
            title="Cài đặt Hộp mừng VietQR, Sổ lưu bút, RSVP"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden lg:inline">Cài đặt</span>
          </button>
        )}

        {/* Tải ảnh HD (Desktop) */}
        {onExportImage && (
          <button
            type="button"
            onClick={onExportImage}
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-300 hover:text-white text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
            title="Tải ảnh thiệp PNG độ nét cao"
          >
            <Camera className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden lg:inline">Tải ảnh</span>
          </button>
        )}

        {/* Khóa/Sửa họa tiết chuẩn (Desktop) */}
        {onRepairDecorations && (
          <button
            type="button"
            onClick={onRepairDecorations}
            className="hidden sm:flex p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Khóa cố định họa tiết chuẩn của mẫu"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}

        {/* Xem thử (Hiển thị cả Mobile & Desktop) */}
        <button
          type="button"
          onClick={onPreview}
          className="px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          title="Xem thử giao diện thiệp"
        >
          <Eye className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Xem thử</span>
        </button>

        {/* Phím tắt trợ giúp (Desktop) */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors hidden sm:block"
          title="Phím tắt trợ giúp"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Chuyển đổi giao diện Sáng / Tối (Desktop) */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors hidden sm:block"
          title={isDark ? "Giao diện sáng" : "Giao diện tối"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Mobile More Options Button & Dropdown */}
        <div className="relative sm:hidden" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-300 hover:text-white transition-colors"
            title="Tùy chọn khác"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl py-1.5 z-50 animate-slide-up text-xs">
              {onSave && (
                <button
                  type="button"
                  onClick={() => {
                    onSave();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lưu bản thiết kế</span>
                </button>
              )}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cài đặt thông tin & Ngân hàng</span>
                </button>
              )}
              {onExportImage && (
                <button
                  type="button"
                  onClick={() => {
                    onExportImage();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tải ảnh thiệp PNG (HD)</span>
                </button>
              )}
              {onRepairDecorations && (
                <button
                  type="button"
                  onClick={() => {
                    onRepairDecorations();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>Khóa/Sửa họa tiết chuẩn</span>
                </button>
              )}
              <div className="h-px bg-zinc-800 my-1" />
              <button
                type="button"
                onClick={() => {
                  toggleDarkMode();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
                <span>{isDark ? "Giao diện sáng" : "Giao diện tối"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenShortcuts();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
              >
                <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
                <span>Phím tắt trợ giúp</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-zinc-800 mx-1 shrink-0" />

        {/* Nút Xuất bản: Điểm nhấn hành động chính duy nhất (Solid Primary Button) */}
        <button
          type="button"
          onClick={onPublish}
          className="px-3 py-1.5 rounded-lg bg-zen-primary hover:bg-[#d93849] text-xs font-bold text-white shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Xuất bản</span>
        </button>

        {/* Google User Avatar / Đăng nhập */}
        {isLoggedIn && user ? (
          <div className="relative pl-1">
            <img
              src={user.avatar}
              alt={user.name}
              title={user.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-zinc-700/80 shadow-xs cursor-pointer hover:ring-2 hover:ring-zen-primary/60 transition-all"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300 ml-0.5 sm:ml-1 transition-colors"
            title="Đăng nhập tài khoản"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24">
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
          </button>
        )}
      </div>
    </header>
  );
}

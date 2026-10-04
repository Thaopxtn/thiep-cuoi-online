"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  Undo2,
  Redo2,
  Moon,
  Sun,
  CheckCircle2,
  Keyboard,
  Eye,
  Upload,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface EditorHeaderProps {
  templateName: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onOpenShortcuts: () => void;
  isSaved?: boolean;
  onBackToTemplates?: () => void;
}

export default function EditorHeader({
  templateName,
  canUndo = true,
  canRedo = false,
  onUndo,
  onRedo,
  onPreview,
  onPublish,
  onOpenShortcuts,
  isSaved = true,
  onBackToTemplates,
}: EditorHeaderProps) {
  const { user, isLoggedIn, openLoginModal } = useAuth();
  const [isDark, setIsDark] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="h-14 bg-[#18181b] text-white px-3 sm:px-4 flex items-center justify-between z-50 border-b border-zinc-800 select-none shrink-0">
      {/* Left side: Hamburger, Logo, Undo/Redo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/templates"
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Quay lại kho mẫu"
        >
          <Menu className="w-5 h-5" />
        </Link>

        {/* ZenLove Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 group mr-1 sm:mr-3"
          title="Trang chủ ZenLove"
        >
          <div className="w-7 h-7 rounded-full bg-zen-primary flex items-center justify-center text-white font-bold text-xs shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline-block">
            zenlove
          </span>
        </Link>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-l border-zinc-700/60 pl-2 sm:pl-3">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Template Title Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 pl-2 text-xs text-zinc-400 truncate max-w-xs">
          <span>|</span>
          <span className="truncate">{templateName}</span>
        </div>
      </div>

      {/* Right side: DarkMode, Save status, Keyboard, Preview, Publish, Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title={isDark ? "Giao diện sáng" : "Giao diện tối"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Saved status */}
        <div className="hidden md:flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isSaved ? "Đã sao lưu" : "Đang lưu..."}</span>
        </div>

        {/* Keyboard shortcuts */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors hidden sm:block"
          title="Phím tắt trợ giúp"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          className="px-3 py-1.5 rounded-full border border-zinc-700 hover:border-zinc-500 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-all shadow-xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Xem trước</span>
        </button>

        {/* Publish Button */}
        <button
          type="button"
          onClick={onPublish}
          className="px-4 py-1.5 rounded-full bg-zen-primary hover:bg-[#d93849] text-xs font-bold text-white shadow-md shadow-zen-primary/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Xuất bản</span>
        </button>

        {/* Google User Avatar */}
        {isLoggedIn && user ? (
          <div className="relative pl-1">
            <img
              src={user.avatar}
              alt={user.name}
              title={user.name}
              className="w-8 h-8 rounded-full object-cover border border-zinc-700 shadow-xs cursor-pointer hover:ring-2 hover:ring-zen-primary/60 transition-all"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={openLoginModal}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300 ml-1 transition-colors"
            title="Đăng nhập tài khoản"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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

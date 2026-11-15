"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Undo2, Redo2, Keyboard, Eye, Upload, Settings, Save,
  ShieldCheck, Camera, MoreVertical, Heart, UserRound, Check, Loader2,
  CloudOff, AlertCircle,
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
  saveStatus?: "saved" | "saving" | "offline" | "error";
  isPublishing?: boolean;
  onRetrySave?: () => void;
  onBackToTemplates?: () => void;
}

const SAVE_LABELS = {
  saved: "Đã lưu",
  saving: "Đang lưu…",
  offline: "Đã lưu trên máy",
  error: "Lưu thất bại",
} as const;

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
  saveStatus = isSaved ? "saved" : "saving",
  isPublishing = false,
  onRetrySave,
  onBackToTemplates,
}: EditorHeaderProps) {
  const { user, isLoggedIn, openLoginModal } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const morePanelId = useId();

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    Array.from(morePanelRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])
      .find((button) => button.offsetParent !== null)?.focus();
    const closeOutside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Node && !mobileMenuRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, [isMobileMenuOpen]);

  const runMenuAction = (action: () => void) => {
    moreButtonRef.current?.focus();
    setIsMobileMenuOpen(false);
    action();
  };

  const handleMoreKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setIsMobileMenuOpen(false);
      moreButtonRef.current?.focus();
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && isMobileMenuOpen) {
      event.preventDefault();
      event.stopPropagation();
      const buttons = Array.from(morePanelRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])
        .filter((button) => button.offsetParent !== null);
      const currentIndex = buttons.findIndex((button) => button === document.activeElement);
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
        : (currentIndex + (event.key === "ArrowUp" ? -1 : 1) + buttons.length) % buttons.length;
      buttons[nextIndex]?.focus();
    }
  };

  const historyControls = (
    <div className="flex shrink-0 items-center" role="group" aria-label="Lịch sử chỉnh sửa">
      <button type="button" onClick={onUndo} disabled={!canUndo} className="studio-icon-button" title="Hoàn tác (Ctrl+Z)" aria-label="Hoàn tác (Ctrl+Z)">
        <Undo2 className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onRedo} disabled={!canRedo} className="studio-icon-button" title="Làm lại (Ctrl+Y)" aria-label="Làm lại (Ctrl+Y)">
        <Redo2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  const saveStatusContent = (
    <div className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--studio-muted)]">
      <span className="flex min-w-0 items-center gap-1.5" role="status" aria-live="polite" aria-atomic="true">
        {saveStatus === "saved" && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        {saveStatus === "saving" && <Loader2 className="h-3.5 w-3.5 shrink-0 motion-safe:animate-spin" aria-hidden="true" />}
        {saveStatus === "offline" && <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        {saveStatus === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[var(--studio-accent)]" aria-hidden="true" />}
        <span className="truncate">{SAVE_LABELS[saveStatus]}</span>
      </span>
      {saveStatus === "error" && (onRetrySave || onSave) && (
        <button type="button" onClick={onRetrySave ?? onSave} className="min-h-11 shrink-0 px-1 font-medium text-[var(--studio-accent)] underline underline-offset-2" title="Lỗi lưu! Bấm để thử lưu lại ngay">Thử lại</button>
      )}
    </div>
  );

  return (
    <header className="relative z-50 shrink-0 select-none border-b border-[var(--studio-border)] bg-[var(--studio-surface)] text-[var(--studio-text)]" aria-label="Thanh điều khiển ZenLove Studio">
      <div className="flex h-16 min-w-0 items-center justify-between gap-1 px-1.5 sm:gap-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-0.5 sm:gap-2">
          {onBackToTemplates ? (
            <button type="button" onClick={onBackToTemplates} className="studio-icon-button shrink-0" title="Quay lại kho mẫu thiệp" aria-label="Quay lại kho mẫu thiệp"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
          ) : (
            <Link href="/templates" className="studio-icon-button shrink-0" title="Quay lại kho mẫu thiệp" aria-label="Quay lại kho mẫu thiệp"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Link>
          )}
          <Link href="/" className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-1.5" title="Trang chủ ZenLove" aria-label="Trang chủ ZenLove">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--studio-accent)] text-white"><Heart className="h-4 w-4" fill="currentColor" aria-hidden="true" /></span>
            <span className="hidden text-sm font-semibold tracking-tight xl:inline">ZenLove <span className="font-normal text-[var(--studio-muted)]">Studio</span></span>
          </Link>
          <div className="ml-1 hidden min-w-0 border-l border-[var(--studio-border)] pl-3 md:block">
            <h1 className="max-w-[130px] truncate text-xs font-semibold lg:max-w-[190px] xl:max-w-[220px]" title={templateName}>{templateName}</h1>
            {saveStatusContent}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="mr-1 hidden border-r border-[var(--studio-border)] pr-1 md:block">{historyControls}</div>
          {onSave && <button type="button" onClick={onSave} className="studio-icon-button hidden sm:flex" title="Lưu bản thiết kế (Ctrl+S)" aria-label="Lưu bản thiết kế (Ctrl+S)"><Save className="h-4 w-4" aria-hidden="true" /></button>}
          {onOpenSettings && <button type="button" onClick={onOpenSettings} className="studio-icon-button hidden lg:flex" title="Cài đặt Hộp mừng VietQR, Sổ lưu bút, RSVP" aria-label="Cài đặt Hộp mừng VietQR, Sổ lưu bút, RSVP"><Settings className="h-4 w-4" aria-hidden="true" /></button>}
          {onExportImage && <button type="button" onClick={onExportImage} className="studio-icon-button hidden xl:flex" title="Tải ảnh thiệp PNG độ nét cao" aria-label="Tải ảnh thiệp PNG độ nét cao"><Camera className="h-4 w-4" aria-hidden="true" /></button>}
          <button type="button" onClick={onPreview} className="studio-button border border-[var(--studio-border)] px-3" title="Xem thử giao diện thiệp" aria-label="Xem trước">
            <Eye className="h-4 w-4" aria-hidden="true" /><span className="hidden text-xs font-medium lg:inline">Xem trước</span>
          </button>
          <div className="relative" ref={mobileMenuRef} onKeyDown={handleMoreKeyDown}>
            <button ref={moreButtonRef} type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} className="studio-icon-button" title="Tùy chọn khác" aria-label="Tùy chọn khác" aria-expanded={isMobileMenuOpen} aria-controls={morePanelId}>
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </button>
            {isMobileMenuOpen && (
              <div id={morePanelId} ref={morePanelRef} role="region" aria-label="Tùy chọn bản thiết kế" className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-[var(--studio-border)] bg-[var(--studio-surface)] p-1.5 shadow-lg">
                {onSave && <button type="button" onClick={() => runMenuAction(onSave)} className="studio-button w-full justify-start gap-2 px-3 text-left text-xs sm:hidden"><Save className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Lưu bản thiết kế</span></button>}
                {onOpenSettings && <button type="button" onClick={() => runMenuAction(onOpenSettings)} className="studio-button w-full justify-start gap-2 px-3 text-left text-xs lg:hidden"><Settings className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Cài đặt thông tin & Ngân hàng</span></button>}
                {onExportImage && <button type="button" onClick={() => runMenuAction(onExportImage)} className="studio-button w-full justify-start gap-2 px-3 text-left text-xs xl:hidden"><Camera className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Tải ảnh thiệp PNG (HD)</span></button>}
                {onRepairDecorations && <button type="button" onClick={() => runMenuAction(onRepairDecorations)} className="studio-button w-full justify-start gap-2 px-3 text-left text-xs"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Khóa/Sửa họa tiết chuẩn</span></button>}
                <button type="button" onClick={() => runMenuAction(onOpenShortcuts)} className="studio-button w-full justify-start gap-2 px-3 text-left text-xs"><Keyboard className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Phím tắt trợ giúp</span></button>
                {!isLoggedIn && <button type="button" onClick={() => runMenuAction(openLoginModal)} className="studio-button w-full justify-start gap-2 px-3 text-left text-xs sm:hidden"><UserRound className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Đăng nhập tài khoản</span></button>}
              </div>
            )}
          </div>
          <button type="button" onClick={onPublish} disabled={isPublishing} aria-busy={isPublishing} className="studio-button studio-button-primary gap-1.5 px-3 text-xs font-semibold" title={isPublishing ? "Đang xử lý xuất bản thiệp..." : "Xuất bản thiệp cưới để chia sẻ"}>
            {isPublishing ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}<span>{isPublishing ? "Đang lưu…" : "Xuất bản"}</span>
          </button>
          {isLoggedIn && user ? (
            <div className="ml-1 hidden h-11 w-11 shrink-0 items-center justify-center sm:flex"><img src={user.avatar} alt={user.name} title={user.name} className="h-8 w-8 rounded-full border border-[var(--studio-border)] object-cover" /></div>
          ) : (
            <button type="button" onClick={openLoginModal} className="studio-icon-button ml-1 hidden sm:flex" title="Đăng nhập tài khoản" aria-label="Đăng nhập tài khoản"><UserRound className="h-4 w-4" aria-hidden="true" /></button>
          )}
        </div>
      </div>
      <div className="flex min-h-12 min-w-0 items-center justify-between gap-2 border-t border-[var(--studio-border)] px-3 md:hidden">
        <div className="min-w-0"><h1 className="truncate text-xs font-semibold" title={templateName}>{templateName}</h1>{saveStatusContent}</div>
        {historyControls}
      </div>
    </header>
  );
}

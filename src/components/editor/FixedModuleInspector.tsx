"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Gift,
  Send,
  Camera,
  MessageSquare,
  Plus,
  Trash2,
  Sliders,
  Palette,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { WeddingCard } from "@/data/initialCards";
import { POPULAR_BANKS, generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { DEFAULT_LOVE_STORY, LoveStoryItem } from "@/components/show/InteractiveSections";
import {
  MODULE_STYLE_CATALOG,
  FixedModuleId,
} from "./EditorFixedModuleEditModal";
import { scrollToFixedModule } from "./EditorFixedModulesCanvas";
import { weddingSounds } from "@/lib/soundEffects";
import ModuleStyleVisualPreview from "./ModuleStyleVisualPreview";

interface FixedModuleInspectorProps {
  moduleId: FixedModuleId;
  card: WeddingCard;
  onUpdateCard: (updatedCard: WeddingCard) => void;
  onToggleModule?: (moduleKey: any, val: boolean) => void;
  onClose: () => void;
  onOpenAlbumDrawer?: () => void;
}

export default function FixedModuleInspector({
  moduleId,
  card,
  onUpdateCard,
  onToggleModule,
  onClose,
  onOpenAlbumDrawer,
}: FixedModuleInspectorProps) {
  const [activeTab, setActiveTab] = useState<"info" | "styles">("styles");

  // Map module ID to its toggle property on card
  const toggleKeyMap: Record<FixedModuleId, keyof WeddingCard> = {
    calendar: "showCalendar",
    events: "showEvents",
    giftBox: "showGiftBox",
    rsvp: "showRsvp",
    wishes: "showWishes",
    album: "showAlbum",
    loveStory: "showLoveStory",
  };

  const toggleKey = toggleKeyMap[moduleId];
  const isEnabled = card[toggleKey] !== false;

  const currentStyles = card.fixedModuleStyles || {};
  const defaultStyleMap: Record<FixedModuleId, string> = {
    calendar: "classic-cream",
    events: "timeline-cards",
    album: "grid-modern",
    rsvp: "clean-rounded",
    giftBox: "dual-bank-cards",
    wishes: "stream-bubble",
    loveStory: "vertical-timeline",
  };
  const activeStyleId = currentStyles[moduleId] || defaultStyleMap[moduleId];

  const meta = MODULE_STYLE_CATALOG[moduleId];

  // Quick style change handler
  const handleSelectStyle = (styleId: string) => {
    const updatedStyles = {
      ...(card.fixedModuleStyles || {}),
      [moduleId]: styleId,
    };
    const updatedCard: WeddingCard = {
      ...card,
      fixedModuleStyles: updatedStyles,
      [toggleKey]: true,
    };

    onUpdateCard(updatedCard);
    weddingSounds.playChime();
    scrollToFixedModule(moduleId);
  };

  // Toggle module visibility
  const handleToggle = () => {
    const nextVal = !isEnabled;
    if (onToggleModule) {
      onToggleModule(String(toggleKey), nextVal);
    } else {
      const updatedCard = { ...card, [toggleKey]: nextVal };
      onUpdateCard(updatedCard);
    }
    if (nextVal) {
      scrollToFixedModule(moduleId);
    }
  };

  // Love Story handlers
  const handleUpdateLoveStoryItem = (index: number, patch: Partial<LoveStoryItem>) => {
    const currentList = card.loveStory && card.loveStory.length > 0 ? [...card.loveStory] : [...DEFAULT_LOVE_STORY];
    currentList[index] = { ...currentList[index], ...patch };
    onUpdateCard({ ...card, loveStory: currentList });
  };

  const handleAddLoveStoryItem = () => {
    const currentList = card.loveStory && card.loveStory.length > 0 ? [...card.loveStory] : [...DEFAULT_LOVE_STORY];
    currentList.push({
      id: `step-${Date.now()}`,
      date: "Cột mốc mới",
      title: "Khoảnh Khắc Đáng Nhớ",
      description: "Ghi lại câu chuyện ngọt ngào của hai bạn tại đây...",
    });
    onUpdateCard({ ...card, loveStory: currentList });
  };

  const handleDeleteLoveStoryItem = (index: number) => {
    const currentList = card.loveStory && card.loveStory.length > 0 ? [...card.loveStory] : [...DEFAULT_LOVE_STORY];
    currentList.splice(index, 1);
    onUpdateCard({ ...card, loveStory: currentList });
  };

  // Field change helpers
  const handleFieldChange = (field: keyof WeddingCard, value: any) => {
    onUpdateCard({
      ...card,
      [field]: value,
    });
  };

  // Event handlers
  const handleUpdateEvent = (index: number, updatedFields: Record<string, any>) => {
    const nextEvents = [...(card.events || [])];
    if (nextEvents[index]) {
      nextEvents[index] = { ...nextEvents[index], ...updatedFields };
      onUpdateCard({ ...card, events: nextEvents });
    }
  };

  const handleAddEvent = () => {
    const newEvent = {
      id: `evt-${Date.now()}`,
      time: "11:30",
      title: "Tiệc Cưới Thân Mật",
      venue: "Trung Tâm Tiệc Cưới",
      address: "123 Đường Hoa Hồng, TP. Hồ Chí Minh",
    };
    onUpdateCard({
      ...card,
      events: [...(card.events || []), newEvent],
    });
    weddingSounds.playPop();
  };

  const handleDeleteEvent = (index: number) => {
    const nextEvents = (card.events || []).filter((_, i) => i !== index);
    onUpdateCard({ ...card, events: nextEvents });
  };

  // Bank change helpers
  const handleGroomBankChange = (field: "bankName" | "accountNumber" | "accountName", value: string) => {
    onUpdateCard({
      ...card,
      groom: {
        ...(card.groom || { name: "Chú Rể", role: "Chú Rể" }),
        [field]: value,
      },
    });
  };

  const handleBrideBankChange = (field: "bankName" | "accountNumber" | "accountName", value: string) => {
    onUpdateCard({
      ...card,
      bride: {
        ...(card.bride || { name: "Cô Dâu", role: "Cô Dâu" }),
        [field]: value,
      },
    });
  };

  const IconComponent = meta?.icon || Sliders;

  return (
    <aside className="w-[300px] sm:w-[330px] bg-white border-l border-gray-200 h-full flex flex-col z-30 select-none shrink-0 shadow-xs">
      {/* Top Header */}
      <div className="p-3.5 border-b border-gray-200 bg-gradient-to-r from-stone-50 via-white to-stone-50 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-zen-primary border border-rose-200/60 flex items-center justify-center shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-gray-900 truncate">
              {meta?.title || "Khối Mẫu Cố Định"}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isEnabled ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span className="text-[10px] font-medium text-gray-500">
                {isEnabled ? "Đang bật trên thiệp" : "Đang ẩn"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          title="Đóng bảng chỉnh sửa"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Switch bật/tắt module & Tabs chuyển: Kiểu dáng | Thông tin */}
      <div className="p-3 border-b border-gray-100 bg-white space-y-2.5 shrink-0">
        {/* Toggle Bar */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200/80">
          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            {isEnabled ? (
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span>Hiển thị trên thiệp</span>
          </span>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggle}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Tab Switcher: Kiểu dáng vs Điền thông tin */}
        <div className="flex bg-gray-100/80 p-0.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("styles")}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "styles"
                ? "bg-white text-gray-900 shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-rose-500" />
            <span>Kiểu dáng ({meta?.styles.length || 0})</span>
          </button>

          {true && (
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "info"
                  ? "bg-white text-gray-900 shadow-2xs font-bold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nội dung</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ================= TAB 1: CHỌN KIỂU DÁNG ================= */}
        {activeTab === "styles" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Chọn mẫu hiển thị:
              </span>
              <span className="text-[10px] text-gray-400">
                1-chạm đổi mẫu tức thì
              </span>
            </div>

            <div className="space-y-2.5">
              {meta?.styles.map((style) => {
                const isSelected = activeStyleId === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => handleSelectStyle(style.id)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                      isSelected
                        ? "border-[#e54153] ring-2 ring-rose-300 bg-rose-50/15 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">{style.icon}</span>
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-zen-primary" : "text-gray-900"
                          }`}
                        >
                          {style.name}
                        </h4>
                        {style.badge && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0">
                            {style.badge}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0">
                        <div
                          className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-zen-primary border-zen-primary text-white"
                              : "border-gray-300 group-hover:border-gray-400 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    {/* MẪU ĐỒ HỌA THỰC TẾ TRỰC QUAN */}
                    <ModuleStyleVisualPreview moduleId={moduleId} styleId={style.id} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: ĐIỀN NỘI DUNG ================= */}
        {activeTab === "info" && (
          <div className="space-y-4 text-left">
            {/* --- 1. CALENDAR INFO --- */}
            {moduleId === "calendar" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ngày cưới Dương lịch
                  </label>
                  <input
                    type="date"
                    value={card.weddingDate || "2026-11-18"}
                    onChange={(e) => handleFieldChange("weddingDate", e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-zen-primary focus:outline-none bg-white text-gray-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Giờ tổ chức hôn lễ
                  </label>
                  <input
                    type="time"
                    value={card.weddingTime || "11:00"}
                    onChange={(e) => handleFieldChange("weddingTime", e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-zen-primary focus:outline-none bg-white text-gray-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ghi chú ngày Âm lịch
                  </label>
                  <input
                    type="text"
                    value={card.lunarDate || ""}
                    placeholder="VD: Ngày 16 tháng 10 năm Giáp Thìn"
                    onChange={(e) => handleFieldChange("lunarDate", e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-zen-primary focus:outline-none bg-white text-gray-800"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    💡 Hiển thị trang trọng bên dưới ngày Dương lịch trên thiệp.
                  </p>
                </div>
              </div>
            )}

            {/* --- 2. EVENTS INFO --- */}
            {moduleId === "events" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Các mốc sự kiện ({card.events?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEvent}
                    className="px-2 py-1 rounded-lg bg-rose-50 text-zen-primary text-[10px] font-bold hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm sự kiện</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(card.events || []).map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                          Sự kiện #{idx + 1}
                        </span>
                        {(card.events?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(idx)}
                            className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                            title="Xóa sự kiện này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                            Giờ
                          </label>
                          <input
                            type="text"
                            value={evt.time || ""}
                            placeholder="11:00"
                            onChange={(e) => handleUpdateEvent(idx, { time: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                            Tên sự kiện
                          </label>
                          <input
                            type="text"
                            value={evt.title || ""}
                            placeholder="Lễ Vu Quy"
                            onChange={(e) => handleUpdateEvent(idx, { title: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                          Địa điểm / Nhà hàng
                        </label>
                        <input
                          type="text"
                          value={evt.venue || ""}
                          placeholder="Trung tâm tiệc cưới Melisa"
                          onChange={(e) => handleUpdateEvent(idx, { venue: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                          Địa chỉ chi tiết
                        </label>
                        <input
                          type="text"
                          value={evt.address || ""}
                          placeholder="85 Thoại Ngọc Hầu, Tân Phú..."
                          onChange={(e) => handleUpdateEvent(idx, { address: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- 2.5. LOVE STORY INFO --- */}
            {moduleId === "loveStory" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Các mốc kỷ niệm ({(card.loveStory && card.loveStory.length > 0 ? card.loveStory : DEFAULT_LOVE_STORY).length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLoveStoryItem}
                    className="px-2 py-1 rounded-lg bg-rose-50 text-zen-primary text-[10px] font-bold hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm mốc</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(card.loveStory && card.loveStory.length > 0 ? card.loveStory : DEFAULT_LOVE_STORY).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-rose-600 uppercase">
                          Mốc #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLoveStoryItem(idx)}
                          className="text-gray-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Xóa mốc này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                            Ngày / Thời gian
                          </label>
                          <input
                            type="text"
                            value={item.date || ""}
                            placeholder="14 / 02 / 2021"
                            onChange={(e) => handleUpdateLoveStoryItem(idx, { date: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                            Tiêu đề mốc
                          </label>
                          <input
                            type="text"
                            value={item.title || ""}
                            placeholder="Lần Đầu Gặp Gỡ"
                            onChange={(e) => handleUpdateLoveStoryItem(idx, { title: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                          Nội dung kỷ niệm
                        </label>
                        <textarea
                          rows={2}
                          value={item.description || ""}
                          placeholder="Mô tả cảm xúc hoặc khoảnh khắc..."
                          onChange={(e) => handleUpdateLoveStoryItem(idx, { description: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-700 leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- 3. GIFTBOX INFO --- */}
            {moduleId === "giftBox" && (
              <div className="space-y-4">
                {/* Chú Rể */}
                <div className="p-3 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                      Tài khoản Nhà Trai (Chú Rể)
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                      Ngân hàng
                    </label>
                    <select
                      value={card.groom?.bankName || "MB BANK"}
                      onChange={(e) => handleGroomBankChange("bankName", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                      Số tài khoản (STK)
                    </label>
                    <input
                      type="text"
                      value={card.groom?.accountNumber || ""}
                      placeholder="0123456789"
                      onChange={(e) => handleGroomBankChange("accountNumber", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                      Tên chủ tài khoản
                    </label>
                    <input
                      type="text"
                      value={card.groom?.accountName || card.groom?.name || ""}
                      placeholder="NGUYEN VAN A"
                      onChange={(e) => handleGroomBankChange("accountName", e.target.value.toUpperCase())}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white uppercase font-medium"
                    />
                  </div>
                </div>

                {/* Cô Dâu */}
                <div className="p-3 rounded-2xl border border-rose-200/80 bg-rose-50/30 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                      Tài khoản Nhà Gái (Cô Dâu)
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                      Ngân hàng
                    </label>
                    <select
                      value={card.bride?.bankName || "TECHCOMBANK"}
                      onChange={(e) => handleBrideBankChange("bankName", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                      Số tài khoản (STK)
                    </label>
                    <input
                      type="text"
                      value={card.bride?.accountNumber || ""}
                      placeholder="9876543210"
                      onChange={(e) => handleBrideBankChange("accountNumber", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                      Tên chủ tài khoản
                    </label>
                    <input
                      type="text"
                      value={card.bride?.accountName || card.bride?.name || ""}
                      placeholder="TRAN THI B"
                      onChange={(e) => handleBrideBankChange("accountName", e.target.value.toUpperCase())}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white uppercase font-medium"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 leading-relaxed bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                  ✨ Mã QR VietQR động chuẩn Napas 24/7 và nút sao chép STK 1 chạm sẽ được hệ thống tự động tạo trên thiệp cưới.
                </p>
              </div>
            )}

            {/* --- 4. RSVP INFO --- */}
            {moduleId === "rsvp" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tiêu đề khối RSVP
                  </label>
                  <input
                    type="text"
                    value={card.rsvpTitle || "XÁC NHẬN THAM DỰ"}
                    onChange={(e) => handleFieldChange("rsvpTitle", e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-zen-primary focus:outline-none bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Lời nhắn gửi khách mời
                  </label>
                  <textarea
                    rows={3}
                    value={
                      card.rsvpMessage ||
                      "Để công tác đón tiếp được chu đáo nhất, xin quý khách vui lòng xác nhận sự hiện diện trước ngày cưới."
                    }
                    onChange={(e) => handleFieldChange("rsvpMessage", e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-zen-primary focus:outline-none bg-white text-gray-700 leading-relaxed"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 leading-normal">
                  💡 Khách mời khi mở thiệp có thể xác nhận tham dự, số người đi cùng và gửi lời nhắn. Toàn bộ phản hồi được lưu tự động vào mục RSVP trên Dashboard.
                </div>
              </div>
            )}

            {/* --- 5. WISHES INFO --- */}
            {moduleId === "wishes" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tiêu đề Sổ Lưu Bút
                  </label>
                  <input
                    type="text"
                    value={card.wishesTitle || "SỔ LƯU BÚT CƯỚI"}
                    onChange={(e) => handleFieldChange("wishesTitle", e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-zen-primary focus:outline-none bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Hướng dẫn khách gửi lời chúc
                  </label>
                  <textarea
                    rows={3}
                    value={
                      card.wishesDescription ||
                      "Hãy gửi những lời chúc ngọt ngào nhất để lưu giữ kỷ niệm đẹp cho ngày chung đôi của chúng mình!"
                    }
                    onChange={(e) => handleFieldChange("wishesDescription", e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-zen-primary focus:outline-none bg-white text-gray-700 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* --- 6. ALBUM INFO --- */}
            {moduleId === "album" && (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-center space-y-2">
                  <Camera className="w-8 h-8 text-zen-primary mx-auto opacity-75" />
                  <h4 className="text-xs font-bold text-gray-900">
                    Album Hiện Có {card.album?.length || 0} Ảnh
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Bạn có thể tải ảnh mới, đổi thứ tự ảnh hoặc chọn ảnh bìa cho thiệp trong kho ảnh.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAlbumDrawer}
                    className="w-full py-2 bg-zen-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#d93849] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Mở Kho Ảnh & Album Cưới</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

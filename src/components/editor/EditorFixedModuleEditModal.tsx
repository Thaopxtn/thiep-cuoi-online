"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Sparkles,
  Calendar as CalendarIcon,
  Heart,
  Clock,
  MapPin,
  Gift,
  Send,
  Camera,
  MessageSquare,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  Sliders,
  Layers,
  Palette,
  Edit3,
} from "lucide-react";
import { WeddingCard } from "@/data/initialCards";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";

import { FixedModuleId, StyleOption, MODULE_STYLE_CATALOG } from "@/lib/fixedModulesCatalog";
export { type FixedModuleId, type StyleOption, MODULE_STYLE_CATALOG };

const COMMON_BANKS = [
  "MB BANK",
  "TECHCOMBANK",
  "VIETCOMBANK",
  "ACB",
  "VPBANK",
  "TPBANK",
  "BIDV",
  "AGRIBANK",
  "VIETINBANK",
  "SACOMBANK",
  "HDBANK",
  "OCB",
  "SHB",
  "MSB",
  "VIB",
  "SEABANK",
];

interface EditorFixedModuleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: FixedModuleId | null;
  card: WeddingCard;
  onSaveCard: (updatedCard: WeddingCard) => void;
  onOpenAlbumDrawer?: () => void;
}

export default function EditorFixedModuleEditModal({
  isOpen,
  onClose,
  moduleId,
  card,
  onSaveCard,
  onOpenAlbumDrawer,
}: EditorFixedModuleEditModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "styles">("info");

  // Form local state (deep clone from card)
  const [formData, setFormData] = useState<WeddingCard>(card);
  const [selectedStyle, setSelectedStyle] = useState<string>("default");

  useEffect(() => {
    if (card && moduleId) {
      setFormData(JSON.parse(JSON.stringify(card)));
      const currentStyle = card.fixedModuleStyles?.[moduleId] || MODULE_STYLE_CATALOG[moduleId]?.styles[0]?.id || "default";
      setSelectedStyle(currentStyle);
      setActiveTab("info");
    }
  }, [card, moduleId, isOpen]);

  if (!isOpen || !moduleId) return null;

  const catalog = MODULE_STYLE_CATALOG[moduleId];
  if (!catalog) return null;

  const ModuleIcon = catalog.icon;

  const handleSave = () => {
    const updatedCard: WeddingCard = {
      ...formData,
      fixedModuleStyles: {
        ...(formData.fixedModuleStyles || {}),
        [moduleId]: selectedStyle,
      },
    };
    onSaveCard(updatedCard);
    onClose();
  };

  // Quick event handlers
  const handleUpdateEvent = (idx: number, field: string, val: string) => {
    const events = [...(formData.events || [])];
    if (events[idx]) {
      events[idx] = { ...events[idx], [field]: val };
      setFormData({ ...formData, events });
    }
  };

  const handleAddEvent = () => {
    const events = [...(formData.events || [])];
    events.push({
      id: `evt-${Date.now()}`,
      title: "Tiệc Cưới Chung Vui",
      time: "17:30 • " + (formData.weddingDate ? formData.weddingDate.split("-").reverse().join("/") : "20/11/2026"),
      venue: "Trung tâm Tiệc cưới",
      address: "Hà Nội",
      mapUrl: "",
    });
    setFormData({ ...formData, events });
  };

  const handleDeleteEvent = (idx: number) => {
    const events = (formData.events || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, events });
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="bg-gradient-to-r from-[#2a080c] via-[#511419] to-[#2a080c] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
              <ModuleIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                  Cấu Hình Khối Cố Định
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  Đang hoạt động
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                {catalog.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= SUB-TAB SWITCHER (Điền thông tin vs Chọn kiểu mẫu) ================= */}
        <div className="bg-gray-100 p-2 flex items-center gap-2 border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "info"
                ? "bg-white text-[#511419] shadow-xs border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>✏️ Điền Thông Tin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("styles")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "styles"
                ? "bg-white text-[#511419] shadow-xs border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>🎨 Chọn Kiểu Mẫu ({catalog.styles.length} mẫu)</span>
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: ĐIỀN THÔNG TIN */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* 1. GIFT BOX CONFIG */}
              {moduleId === "giftBox" && (
                <div className="space-y-5">
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    💡 <strong>Mẹo VietQR:</strong> Nhập chính xác số tài khoản ngân hàng để hệ thống tự động sinh mã VietQR chuẩn NAPAS247. Khách mời quét mã là có thể chuyển khoản mừng cưới ngay lập tức.
                  </div>

                  {/* Chú rể */}
                  <div className="p-4 rounded-2xl bg-[#faf7f2] border border-amber-900/15 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-rose-600" />
                        <span>Tài Khoản Mừng Chú Rể</span>
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">Chú rể: {formData.groom?.name}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Ngân hàng:</label>
                        <select
                          value={formData.groom?.bankName || "MB BANK"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              groom: { ...formData.groom, bankName: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                        >
                          {COMMON_BANKS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Số tài khoản:</label>
                        <input
                          type="text"
                          value={formData.groom?.accountNumber || ""}
                          placeholder="Nhập số tài khoản..."
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              groom: { ...formData.groom, accountNumber: e.target.value.replace(/[^0-9]/g, "") },
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white font-mono font-bold focus:outline-none focus:border-[#511419]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Tên chủ tài khoản (In hoa không dấu):</label>
                      <input
                        type="text"
                        value={formData.groom?.accountName || ""}
                        placeholder="NGUYEN VAN A"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            groom: { ...formData.groom, accountName: e.target.value.toUpperCase() },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white font-bold uppercase focus:outline-none focus:border-[#511419]"
                      />
                    </div>
                  </div>

                  {/* Cô dâu */}
                  <div className="p-4 rounded-2xl bg-[#faf7f2] border border-amber-900/15 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-rose-600" />
                        <span>Tài Khoản Mừng Cô Dâu</span>
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">Cô dâu: {formData.bride?.name}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Ngân hàng:</label>
                        <select
                          value={formData.bride?.bankName || "TECHCOMBANK"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bride: { ...formData.bride, bankName: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                        >
                          {COMMON_BANKS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Số tài khoản:</label>
                        <input
                          type="text"
                          value={formData.bride?.accountNumber || ""}
                          placeholder="Nhập số tài khoản..."
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bride: { ...formData.bride, accountNumber: e.target.value.replace(/[^0-9]/g, "") },
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white font-mono font-bold focus:outline-none focus:border-[#511419]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Tên chủ tài khoản (In hoa không dấu):</label>
                      <input
                        type="text"
                        value={formData.bride?.accountName || ""}
                        placeholder="TRAN THI B"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bride: { ...formData.bride, accountName: e.target.value.toUpperCase() },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white font-bold uppercase focus:outline-none focus:border-[#511419]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CALENDAR & COUNTDOWN CONFIG */}
              {moduleId === "calendar" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Ngày cưới (Dương lịch):</label>
                      <input
                        type="date"
                        value={formData.weddingDate || "2026-11-20"}
                        onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Giờ cử hành hôn lễ:</label>
                      <input
                        type="time"
                        value={formData.weddingTime || "11:00"}
                        onChange={(e) => setFormData({ ...formData, weddingTime: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ngày Âm lịch (Hiển thị chú thích):</label>
                    <input
                      type="text"
                      value={formData.lunarDate || ""}
                      placeholder="Ngày 12 tháng 10 năm Bính Ngọ..."
                      onChange={(e) => setFormData({ ...formData, lunarDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                    />
                  </div>
                </div>
              )}

              {/* 3. EVENTS SCHEDULE CONFIG */}
              {moduleId === "events" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700">
                      Danh sách mốc sự kiện ({formData.events?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEvent}
                      className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#511419] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm sự kiện</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(formData.events || []).map((evt, idx) => (
                      <div key={evt.id || idx} className="p-3.5 rounded-2xl bg-[#faf7f2] border border-amber-900/15 relative space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#511419] uppercase tracking-wider">
                            Sự kiện #{idx + 1}
                          </span>
                          {(formData.events?.length || 0) > 1 && (
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Tên sự kiện:</label>
                            <input
                              type="text"
                              value={evt.title}
                              placeholder="Lễ Thành Hôn / Vu Quy / Tiệc Cưới..."
                              onChange={(e) => handleUpdateEvent(idx, "title", e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Thời gian:</label>
                            <input
                              type="text"
                              value={evt.time}
                              placeholder="11:30 • 20/11/2026..."
                              onChange={(e) => handleUpdateEvent(idx, "time", e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Địa điểm:</label>
                            <input
                              type="text"
                              value={evt.venue}
                              placeholder="Tư gia Nhà Trai / Trung tâm Tiệc cưới..."
                              onChange={(e) => handleUpdateEvent(idx, "venue", e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Địa chỉ cụ thể:</label>
                            <input
                              type="text"
                              value={evt.address || ""}
                              placeholder="Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội..."
                              onChange={(e) => handleUpdateEvent(idx, "address", e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Đường link Google Maps chỉ đường:</label>
                          <input
                            type="url"
                            value={evt.mapUrl || ""}
                            placeholder="https://maps.google.com/?q=..."
                            onChange={(e) => handleUpdateEvent(idx, "mapUrl", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. ALBUM CONFIG */}
              {moduleId === "album" && (
                <div className="space-y-4 text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">
                    Album cưới hiện có {formData.album?.length || 0} ảnh phát hành
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Bạn có thể thêm nhiều ảnh từ máy tính, đặt ảnh bìa chính (👑), xóa hoặc đổi thứ tự hiển thị bằng bảng quản lý Album cưới.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAlbumDrawer?.();
                    }}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Mở khay Quản lý Album Ảnh Cưới ➔</span>
                  </button>
                </div>
              )}

              {/* 5. RSVP CONFIG */}
              {moduleId === "rsvp" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Lời nhắn mở đầu form RSVP:</label>
                    <textarea
                      rows={2}
                      value={formData.story || "Sự hiện diện của bạn là niềm hạnh phúc lớn nhất của chúng mình!"}
                      onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                      placeholder="Lời nhắn nhủ đến khách mời..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại liên hệ Chú rể:</label>
                      <input
                        type="text"
                        value={formData.groom?.phone || ""}
                        placeholder="0912..."
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            groom: { ...formData.groom, phone: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại liên hệ Cô dâu:</label>
                      <input
                        type="text"
                        value={formData.bride?.phone || ""}
                        placeholder="0987..."
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bride: { ...formData.bride, phone: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. WISHES CONFIG */}
              {moduleId === "wishes" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề mục Sổ lưu bút:</label>
                    <input
                      type="text"
                      defaultValue="Sổ Lưu Bút & Lời Chúc Mừng"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Lời nhắn mở đầu mời chúc phúc:</label>
                    <textarea
                      rows={2}
                      defaultValue="Cảm ơn bạn bè và người thân đã gửi những lời chúc phúc ngọt ngào nhất đến hai chúng mình!"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#511419] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHỌN KIỂU MẪU */}
          {activeTab === "styles" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Nhấp vào kiểu mẫu bạn thích để xem trước và áp dụng cho thiệp cưới của bạn:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catalog.styles.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group hover:shadow-md ${
                        isSelected
                          ? "border-[#511419] bg-rose-50/40 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{style.icon}</span>
                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#511419] transition-colors">
                              {style.name}
                            </h4>
                          </div>

                          {style.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                              {style.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {style.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-medium">
                          Mã: <code className="text-gray-600 font-mono">{style.id}</code>
                        </span>

                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Đang chọn</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 group-hover:text-gray-700 font-medium">
                            Chọn mẫu này ➔
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl hover:bg-gray-200 text-gray-600 font-semibold text-xs transition-colors cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7a1820] to-[#511419] hover:from-[#8b1c25] hover:to-[#63191f] text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Lưu & Áp Dụng Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

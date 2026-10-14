"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Users,
  Copy,
  Check,
  Share2,
  Download,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
  MessageCircle,
  Filter,
} from "lucide-react";

export interface GuestItem {
  id: string;
  name: string;
  group?: "all" | "groom" | "bride" | "friends" | "colleagues";
  phone?: string;
  isSent?: boolean;
}

interface BulkGuestInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardSlug: string;
  cardTitle?: string;
  groomName?: string;
  brideName?: string;
  weddingDate?: string;
}

const DEFAULT_GROUPS = [
  { id: "all", label: "Tất cả" },
  { id: "groom", label: "Họ Nhà Trai" },
  { id: "bride", label: "Họ Nhà Gái" },
  { id: "friends", label: "Bạn Bè" },
  { id: "colleagues", label: "Đồng Nghiệp" },
];

export default function BulkGuestInvitationModal({
  isOpen,
  onClose,
  cardSlug,
  groomName = "Chú Rể",
  brideName = "Cô Dâu",
}: BulkGuestInvitationModalProps) {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [rawInput, setRawInput] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isImportMode, setIsImportMode] = useState(false);

  const storageKey = `zenlove_guests_${cardSlug}`;

  // Load guests from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && cardSlug) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setGuests(JSON.parse(saved));
        } else {
          // Mẫu mặc định ban đầu để người dùng dễ hình dung
          const initialSamples: GuestItem[] = [
            { id: "1", name: "Gia đình Bác Hùng", group: "groom", isSent: false },
            { id: "2", name: "Anh Hoàng & Chị Lan", group: "friends", isSent: true },
            { id: "3", name: "Bạn Thảo (Cấp 3)", group: "bride", isSent: false },
          ];
          setGuests(initialSamples);
        }
      } catch (err) {
        console.error("Lỗi đọc danh sách khách mời:", err);
      }
    }
  }, [cardSlug, storageKey]);

  // Save guests to localStorage
  const saveGuests = (newList: GuestItem[]) => {
    setGuests(newList);
    if (typeof window !== "undefined" && cardSlug) {
      localStorage.setItem(storageKey, JSON.stringify(newList));
    }
  };

  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3005";
  const baseUrl = `${currentOrigin}/show/${cardSlug}`;

  // Hàm tạo link riêng cho khách
  const getGuestLink = (guestName: string) => {
    return `${baseUrl}?to=${encodeURIComponent(guestName.trim())}`;
  };

  // Hàm tạo tin nhắn mời Zalo chuẩn mực
  const getZaloMessage = (guestName: string) => {
    const link = getGuestLink(guestName);
    return `🌸 THIỆP CƯỚI TRÂN TRỌNG 🌸\nKính gửi: ${guestName}\n\nChúng mình là ${groomName} & ${brideName}.\nTrân trọng kính mời bạn và gia đình tới tham dự lễ thành hôn cùng chúng mình tại:\n👉 ${link}\n\nSự hiện diện và lời chúc phúc của bạn là niềm vinh hạnh và hạnh phúc lớn nhất của chúng mình! ❤️`;
  };

  // Xử lý import hàng loạt từ Textarea
  const handleBulkImport = () => {
    if (!rawInput.trim()) return;

    const lines = rawInput
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const newItems: GuestItem[] = lines.map((name, idx) => ({
      id: `guest_${Date.now()}_${idx}`,
      name,
      group: (selectedGroup as any) || "all",
      isSent: false,
    }));

    const merged = [...guests, ...newItems];
    saveGuests(merged);
    setRawInput("");
    setIsImportMode(false);
  };

  // Toggle trạng thái Đã gửi
  const toggleSentStatus = (id: string) => {
    const updated = guests.map((g) => (g.id === id ? { ...g, isSent: !g.isSent } : g));
    saveGuests(updated);
  };

  // Xóa 1 khách
  const handleDeleteGuest = (id: string) => {
    const updated = guests.filter((g) => g.id !== id);
    saveGuests(updated);
  };

  // Sao chép link 1 khách
  const handleCopyGuestLink = (guest: GuestItem) => {
    const link = getGuestLink(guest.name);
    navigator.clipboard?.writeText(link);
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Mở Zalo chia sẻ 1 chạm
  const handleSendViaZalo = (guest: GuestItem) => {
    const msg = getZaloMessage(guest.name);
    navigator.clipboard?.writeText(msg);

    // Mở trang share Zalo hoặc zalo.me
    const shareUrl = `https://zalo.me/share?url=${encodeURIComponent(getGuestLink(guest.name))}`;
    window.open(shareUrl, "_blank");

    // Tự động đánh dấu đã gửi
    if (!guest.isSent) {
      toggleSentStatus(guest.id);
    }
  };

  // Sao chép toàn bộ danh sách link
  const handleCopyAllLinks = () => {
    const text = guests.map((g) => `${g.name}: ${getGuestLink(g.name)}`).join("\n");
    navigator.clipboard?.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Xuất file CSV / Excel
  const handleExportCsv = () => {
    const header = "Họ và tên,Nhóm,Đã gửi,Link thiệp cưới\n";
    const rows = guests
      .map(
        (g) =>
          `"${g.name}","${
            DEFAULT_GROUPS.find((gr) => gr.id === g.group)?.label || "Tất cả"
          }","${g.isSent ? "Đã gửi" : "Chưa gửi"}","${getGuestLink(g.name)}"`
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh-sach-khach-moi-${cardSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lọc danh sách theo nhóm & tìm kiếm
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchGroup = filterGroup === "all" || g.group === filterGroup;
      const matchSearch =
        searchQuery === "" || g.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [guests, filterGroup, searchQuery]);

  const sentCount = guests.filter((g) => g.isSent).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#fffaf8]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#e54153] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <span>Tạo Thiệp Mời Cá Nhân Hóa Hàng Loạt</span>
                <span className="text-[10px] bg-rose-100 text-[#e54153] font-bold px-2 py-0.5 rounded-full">
                  Zalo 1 Chạm
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Tự động in tên khách lên phong bì sáp niêm phong & gửi Zalo siêu nhanh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Header & Statistics */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Tổng khách mời:</span>
            <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 font-bold text-gray-900">
              {guests.length}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã gửi: {sentCount}</span>
            </span>
            <span className="text-gray-400 font-medium">Chưa gửi: {guests.length - sentCount}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsImportMode(!isImportMode)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 font-bold border border-gray-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#e54153]" />
              <span>{isImportMode ? "Đóng ô nhập" : "+ Nhập hàng loạt"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAllLinks}
              disabled={guests.length === 0}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 font-semibold border border-gray-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Sao chép toàn bộ danh sách link khách mời"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? "Đã chép tất cả!" : "Chép tất cả link"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={guests.length === 0}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Tải về file Excel (CSV)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Panel Nhập hàng loạt (Bulk Import Dropdown) */}
        {isImportMode && (
          <div className="p-4 bg-rose-50/40 border-b border-rose-100 animate-slide-down shrink-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-800">
                📋 Dán danh sách tên khách mời (Mỗi người 1 dòng):
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">Phân nhóm:</span>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#e54153]"
                >
                  {DEFAULT_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={4}
              placeholder={`Bác Hùng & Bác Gái\nAnh Hoàng (Bạn chú rể)\nChị Lan & Người thương\nBạn Tuấn (Lớp 12A1)...`}
              className="w-full p-3 rounded-2xl bg-white border border-rose-200 focus:outline-none focus:border-[#e54153] focus:ring-2 focus:ring-[#e54153]/20 text-xs font-sans leading-relaxed resize-none shadow-2xs"
            />

            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-gray-500">
                Mẹo: Hệ thống tự động tạo mã URL an toàn cho từng khách
              </span>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={!rawInput.trim()}
                className="px-4 py-1.5 bg-[#e54153] hover:bg-[#c93243] text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
              >
                Thêm vào danh sách
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
          {/* Nhóm Filter */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {DEFAULT_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setFilterGroup(g.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterGroup === g.id
                    ? "bg-[#e54153] text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-48 sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-[#e54153] focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Danh Sách Khách Mời (Table View) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredGuests.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-medium">Chưa có khách mời nào trong danh sách</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Bấm "+ Nhập hàng loạt" ở trên để thêm danh sách khách mời
              </p>
            </div>
          ) : (
            filteredGuests.map((guest, idx) => {
              const guestLink = getGuestLink(guest.name);
              return (
                <div
                  key={guest.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    guest.isSent
                      ? "bg-emerald-50/30 border-emerald-100"
                      : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
                  }`}
                >
                  {/* Left: Tên khách & Link preview */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {guest.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-gray-100 text-gray-500 font-medium">
                          {DEFAULT_GROUPS.find((g) => g.id === guest.group)?.label || "Tất cả"}
                        </span>
                        {guest.isSent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>Đã gửi</span>
                          </span>
                        )}
                      </div>

                      <a
                        href={guestLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-gray-400 hover:text-[#e54153] font-mono truncate max-w-xs sm:max-w-md block mt-0.5 transition-colors"
                        title="Bấm để mở xem thử trang thiệp của khách"
                      >
                        {guestLink}
                      </a>
                    </div>
                  </div>

                  {/* Right: Actions (Gửi Zalo 1 chạm, Chép link, Đánh dấu, Xóa) */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Nút gửi Zalo 1 chạm */}
                    <button
                      type="button"
                      onClick={() => handleSendViaZalo(guest)}
                      className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Mở Zalo và tự động soạn sẵn lời mời kèm link"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Gửi Zalo</span>
                    </button>

                    {/* Nút sao chép link */}
                    <button
                      type="button"
                      onClick={() => handleCopyGuestLink(guest)}
                      className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                      title="Sao chép đường dẫn riêng của khách"
                    >
                      {copiedId === guest.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Toggle Đã gửi */}
                    <button
                      type="button"
                      onClick={() => toggleSentStatus(guest.id)}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        guest.isSent
                          ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                          : "bg-white border-gray-200 text-gray-400 hover:text-gray-700"
                      }`}
                      title={guest.isSent ? "Đánh dấu chưa gửi" : "Đánh dấu đã gửi thành công"}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Xóa khách */}
                    <button
                      type="button"
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Xóa khách mời này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>
            Khách mở link sẽ thấy tên mình được in trân trọng trên phong bì hoàng gia
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-black text-white font-bold transition-all cursor-pointer"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}

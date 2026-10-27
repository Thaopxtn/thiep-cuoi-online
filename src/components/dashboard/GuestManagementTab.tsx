"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  MessageCircle,
  UtensilsCrossed,
  FileSpreadsheet,
  Plus,
  Sparkles,
  Gift,
} from "lucide-react";
import { WeddingCard } from "@/data/initialCards";
import {
  GuestItem,
  GuestGroup,
  GuestInviteStatus,
  GUEST_GROUPS,
  getGuestsByCardId,
  addGuest,
  updateGuest,
  deleteGuest,
  bulkImportGuests,
  calculateGuestStats,
  getZaloSharePayload,
  exportGuestsToCsv,
} from "@/lib/guestManagementService";
import { addGiftEntry } from "@/lib/giftLedgerService";

interface GuestManagementTabProps {
  cards: WeddingCard[];
  onOpenGiftTab?: (guestName: string) => void;
}

export default function GuestManagementTab({
  cards,
  onOpenGiftTab,
}: GuestManagementTabProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || "");
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal: Thêm / Sửa khách mời
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formGroup, setFormGroup] = useState<GuestGroup>("friends");
  const [formTable, setFormTable] = useState("");
  const [formGuestsCount, setFormGuestsCount] = useState(1);
  const [formStatus, setFormStatus] = useState<GuestInviteStatus>("not_sent");
  const [formNotes, setFormNotes] = useState("");

  // Modal: Nhập hàng loạt
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState("");
  const [bulkDefaultGroup, setBulkDefaultGroup] = useState<GuestGroup>("friends");

  // Modal: Xem nội dung tin nhắn Zalo 1-chạm
  const [zaloPreviewGuest, setZaloPreviewGuest] = useState<GuestItem | null>(null);

  const activeCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId) || cards[0],
    [cards, selectedCardId]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync selected card
  useEffect(() => {
    if (!selectedCardId && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Load guests
  useEffect(() => {
    if (selectedCardId) {
      const data = getGuestsByCardId(selectedCardId);
      if (data.length === 0 && typeof window !== "undefined") {
        // Tạo sẵn dữ liệu mẫu thực tế để người dùng thấy ngay cấu trúc phân bàn tiệc
        const sampleData: Omit<GuestItem, "id" | "cardId" | "createdAt" | "updatedAt">[] = [
          {
            name: "Anh Tuấn VIP",
            phone: "0901234567",
            group: "vip",
            tableNumber: "Bàn VIP 1",
            estimatedGuests: 2,
            status: "confirmed",
            notes: "Trưởng phòng, ngồi cùng đoàn công ty",
          },
          {
            name: "Bác Hùng & Bác Gái",
            phone: "0912345678",
            group: "groom_side",
            tableNumber: "Bàn 1 (Họ Nội)",
            estimatedGuests: 2,
            status: "confirmed",
            notes: "Bác ruột chú rể",
          },
          {
            name: "Bạn Lan (Hội bạn thân)",
            phone: "0987654321",
            group: "friends",
            tableNumber: "Bàn 6 (Hội Cấp 3)",
            estimatedGuests: 1,
            status: "sent",
            notes: "Đã gửi link Zalo",
          },
        ];
        sampleData.forEach((item) => addGuest(selectedCardId, item));
        setGuests(getGuestsByCardId(selectedCardId));
      } else {
        setGuests(data);
      }
    }
  }, [selectedCardId]);

  // Calculate statistics
  const stats = useMemo(() => calculateGuestStats(guests), [guests]);

  // Filtered guests list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.phone && g.phone.includes(searchQuery)) ||
        (g.tableNumber && g.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGroup = groupFilter === "all" || g.group === groupFilter;
      const matchStatus = statusFilter === "all" || g.status === statusFilter;

      return matchSearch && matchGroup && matchStatus;
    });
  }, [guests, searchQuery, groupFilter, statusFilter]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingGuestId(null);
    setFormName("");
    setFormPhone("");
    setFormGroup("friends");
    setFormTable("");
    setFormGuestsCount(1);
    setFormStatus("not_sent");
    setFormNotes("");
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (guest: GuestItem) => {
    setEditingGuestId(guest.id);
    setFormName(guest.name);
    setFormPhone(guest.phone || "");
    setFormGroup(guest.group);
    setFormTable(guest.tableNumber || "");
    setFormGuestsCount(guest.estimatedGuests || 1);
    setFormStatus(guest.status);
    setFormNotes(guest.notes || "");
    setIsModalOpen(true);
  };

  // Save guest (create or update)
  const handleSaveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !selectedCardId) return;

    if (editingGuestId) {
      updateGuest(selectedCardId, editingGuestId, {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        group: formGroup,
        tableNumber: formTable.trim() || undefined,
        estimatedGuests: formGuestsCount,
        status: formStatus,
        notes: formNotes.trim() || undefined,
      });
      showToast("✨ Đã cập nhật thông tin khách mời!");
    } else {
      addGuest(selectedCardId, {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        group: formGroup,
        tableNumber: formTable.trim() || undefined,
        estimatedGuests: formGuestsCount,
        status: formStatus,
        notes: formNotes.trim() || undefined,
      });
      showToast("✨ Đã thêm khách mời vào danh sách!");
    }

    setGuests(getGuestsByCardId(selectedCardId));
    setIsModalOpen(false);
  };

  // Delete guest
  const handleDeleteGuest = (guestId: string, guestName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách mời "${guestName}" khỏi danh sách?`)) {
      deleteGuest(selectedCardId, guestId);
      setGuests(getGuestsByCardId(selectedCardId));
      showToast(`Đã xóa khách mời "${guestName}".`);
    }
  };

  // Handle Bulk Import
  const handleBulkImport = () => {
    if (!bulkInputText.trim() || !selectedCardId) return;
    const imported = bulkImportGuests(selectedCardId, bulkInputText, bulkDefaultGroup);
    setGuests(getGuestsByCardId(selectedCardId));
    setIsBulkModalOpen(false);
    setBulkInputText("");
    showToast(`🎉 Đã thêm thành công ${imported.length} khách mời vào danh sách!`);
  };

  // Handle Export CSV
  const handleExportCsv = () => {
    if (guests.length === 0) {
      alert("Danh sách khách mời đang trống.");
      return;
    }
    const csvData = exportGuestsToCsv(guests);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Danh_sach_khach_moi_${activeCard?.slug || "wedding"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✨ Đã tải xuống file Excel danh sách khách mời!");
  };

  // Handle Quick Zalo Click
  const handleOpenZaloModal = (guest: GuestItem) => {
    setZaloPreviewGuest(guest);
  };

  const handleMarkAsSentAndOpenZalo = (guest: GuestItem) => {
    if (!activeCard) return;
    const payload = getZaloSharePayload(guest, activeCard);
    
    // Đánh dấu là đã gửi nếu đang là 'not_sent'
    if (guest.status === "not_sent") {
      updateGuest(selectedCardId, guest.id, { status: "sent" });
      setGuests(getGuestsByCardId(selectedCardId));
    }

    // Mở trang Zalo Share
    window.open(payload.zaloUrl, "_blank");
    setZaloPreviewGuest(null);
    showToast(`Đã mở Zalo để gửi thiệp cho "${guest.name}"!`);
  };

  // Copy Personalized Link
  const handleCopyLink = (guest: GuestItem) => {
    if (!activeCard) return;
    const payload = getZaloSharePayload(guest, activeCard);
    navigator.clipboard.writeText(payload.cardUrl).then(() => {
      showToast(`✨ Đã sao chép liên kết riêng của "${guest.name}"!`);
    });
  };

  // Quick link to Gift Ledger
  const handleQuickAddGift = (guest: GuestItem) => {
    if (!selectedCardId) return;
    addGiftEntry(selectedCardId, {
      senderName: guest.name,
      amount: 500000,
      method: "cash",
      relation: guest.group === "groom_side" ? "groom_side" : guest.group === "bride_side" ? "bride_side" : "friends",
      wishes: "Mừng hạnh phúc hai bạn!",
    });
    showToast(`🎁 Đã ghi nhận mừng cưới cho "${guest.name}" vào Sổ Mừng Cưới!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-400/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Card Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-zen-primary" />
            <span>Quản Lý Khách Mời & Phân Bàn Tiệc (Guest CRM)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Gán số bàn tiệc, gửi thiệp cá nhân hóa 1-chạm qua Zalo và theo dõi trạng thái phản hồi.
          </p>
        </div>

        {/* Card Selector & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {cards.length > 1 && (
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-zen-primary"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  Thiệp: {c.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nhập Excel / Nhiều khách</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-zen-primary/20 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm khách mới</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Guests */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Tổng số khách</span>
          <span className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</span>
          <span className="text-[10px] text-gray-400 mt-0.5">Trong danh bạ thiệp</span>
        </div>

        {/* Not Sent */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Chưa gửi thiệp</span>
          </span>
          <span className="text-2xl font-bold text-amber-600 mt-1">{stats.notSent}</span>
          <span className="text-[10px] text-amber-600/80 mt-0.5">Cần gửi qua Zalo / SMS</span>
        </div>

        {/* Confirmed Seats */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Sẽ tham dự</span>
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.confirmed} <span className="text-xs text-gray-400 font-normal">({stats.totalSeats} ghế)</span>
          </span>
          <span className="text-[10px] text-emerald-600/80 mt-0.5">Đã xác nhận RSVP</span>
        </div>

        {/* Table Count */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-700 uppercase flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3 text-indigo-500" />
            <span>Bàn tiệc đã gán</span>
          </span>
          <span className="text-2xl font-bold text-indigo-600 mt-1">
            {stats.assignedTablesCount} <span className="text-xs text-gray-400 font-normal">bàn</span>
          </span>
          <span className="text-[10px] text-indigo-600/80 mt-0.5">Phân bổ chỗ ngồi</span>
        </div>

        {/* Declined */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
            <XCircle className="w-3 h-3 text-gray-400" />
            <span>Báo bận</span>
          </span>
          <span className="text-2xl font-bold text-gray-500 mt-1">{stats.declined}</span>
          <span className="text-[10px] text-gray-400 mt-0.5">Không thể tới dự</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, số bàn tiệc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-zen-primary focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-700 focus:outline-none"
          >
            <option value="all">Tất cả nhóm</option>
            {GUEST_GROUPS.map((grp) => (
              <option key={grp.id} value={grp.id}>
                {grp.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-700 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="not_sent">Chưa gửi</option>
            <option value="sent">Đã gửi</option>
            <option value="confirmed">Sẽ tham dự</option>
            <option value="declined">Báo bận</option>
          </select>
        </div>
      </div>

      {/* 4. Guests Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {filteredGuests.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">Chưa có khách mời nào phù hợp</p>
            <p className="text-xs text-gray-400 mt-1">Bấm "Thêm khách mới" hoặc "Nhập Excel" để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Khách mời & Nhóm</th>
                  <th className="py-3 px-3">Số điện thoại</th>
                  <th className="py-3 px-3">Bàn tiệc</th>
                  <th className="py-3 px-3 text-center">Số người</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Gửi thiệp & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredGuests.map((guest) => {
                  const grpMeta = GUEST_GROUPS.find((g) => g.id === guest.group) || GUEST_GROUPS[5];

                  return (
                    <tr key={guest.id} className="hover:bg-gray-50/60 transition-colors group">
                      {/* Name & Group */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm group-hover:text-zen-primary transition-colors">
                            {guest.name}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold border ${grpMeta.badgeColor}`}>
                              {grpMeta.label}
                            </span>
                            {guest.notes && (
                              <span className="text-[10px] text-gray-400 italic truncate max-w-[140px]" title={guest.notes}>
                                • {guest.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 text-gray-600 font-mono text-[11px]">
                        {guest.phone || <span className="text-gray-300 italic">Chưa có</span>}
                      </td>

                      {/* Table Number */}
                      <td className="py-3 px-3">
                        {guest.tableNumber ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-bold text-[11px]">
                            <UtensilsCrossed className="w-3 h-3" />
                            <span>{guest.tableNumber}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Chưa xếp bàn</span>
                        )}
                      </td>

                      {/* Guests Count */}
                      <td className="py-3 px-3 text-center font-bold text-gray-800">
                        {guest.estimatedGuests || 1}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={guest.status}
                          onChange={(e) => {
                            updateGuest(selectedCardId, guest.id, {
                              status: e.target.value as GuestInviteStatus,
                            });
                            setGuests(getGuestsByCardId(selectedCardId));
                          }}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            guest.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : guest.status === "sent"
                              ? "bg-blue-50 text-blue-700 border-blue-300"
                              : guest.status === "declined"
                              ? "bg-gray-100 text-gray-500 border-gray-300"
                              : "bg-amber-50 text-amber-700 border-amber-300"
                          }`}
                        >
                          <option value="not_sent">Chưa gửi</option>
                          <option value="sent">Đã gửi</option>
                          <option value="confirmed">Sẽ tham dự</option>
                          <option value="declined">Báo bận</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Gửi Zalo 1-Chạm Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenZaloModal(guest)}
                            className="px-2.5 py-1 rounded-lg bg-[#0068ff] hover:bg-[#0054cc] text-white text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                            title="Gửi lời mời trang trọng qua Zalo 1-chạm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Gửi Zalo</span>
                          </button>

                          {/* Copy Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(guest)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                            title="Sao chép liên kết thiệp riêng của khách"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Add Gift */}
                          <button
                            type="button"
                            onClick={() => handleQuickAddGift(guest)}
                            className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-700 transition-colors cursor-pointer"
                            title="Ghi nhận vào Sổ Mừng Cưới"
                          >
                            <Gift className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(guest)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin khách"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteGuest(guest.id, guest.name)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title="Xóa khách mời"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: THÊM / SỬA KHÁCH MỜI ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-zen-primary" />
                <span>{editingGuestId ? "Chỉnh Sửa Khách Mời" : "Thêm Khách Mời Mới"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Họ và tên khách mời: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Anh Nam & Bạn Gái, Gia đình Bác Hùng..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Số điện thoại:</label>
                  <input
                    type="tel"
                    placeholder="VD: 0912345678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nhóm quan hệ:</label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as GuestGroup)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  >
                    {GUEST_GROUPS.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Số bàn tiệc:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Bàn 5, Bàn VIP 1..."
                    value={formTable}
                    onChange={(e) => setFormTable(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Số lượng người:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formGuestsCount}
                    onChange={(e) => setFormGuestsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Trạng thái gửi:</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as GuestInviteStatus)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                >
                  <option value="not_sent">Chưa gửi thiệp</option>
                  <option value="sent">Đã gửi link mời</option>
                  <option value="confirmed">Đã xác nhận sẽ tham dự</option>
                  <option value="declined">Báo bận không đến</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Ghi chú riêng:</label>
                <textarea
                  rows={2}
                  placeholder="VD: Ăn chay, ngồi cùng hội đại học..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {editingGuestId ? "Lưu thay đổi" : "Thêm khách"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NHẬP DANH SÁCH HÀNG LOẠT (BULK IMPORT) ================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Nhập Hàng Loạt Từ Excel / Danh Sách</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/60 text-xs text-emerald-900 leading-relaxed space-y-1">
              <p className="font-bold">💡 Hướng dẫn cú pháp (Mỗi khách 1 dòng):</p>
              <p className="font-mono text-[11px] text-emerald-800">
                Nguyễn Văn A - 0912345678 - Bàn 1<br />
                Trần Thị B - 0987654321 - Bàn 2<br />
                Gia đình Bác Hùng - Bàn VIP
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Nhóm mặc định cho danh sách này:
              </label>
              <select
                value={bulkDefaultGroup}
                onChange={(e) => setBulkDefaultGroup(e.target.value as GuestGroup)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
              >
                {GUEST_GROUPS.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Dán nội dung danh sách vào đây:
              </label>
              <textarea
                rows={8}
                placeholder="Dán nội dung copy từ cột Excel hoặc file Word tại đây..."
                value={bulkInputText}
                onChange={(e) => setBulkInputText(e.target.value)}
                className="w-full p-3 text-xs font-mono border border-gray-300 rounded-2xl focus:outline-none focus:border-zen-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400">
                {bulkInputText.trim().split("\n").filter(Boolean).length} dòng phát hiện
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Xác nhận nạp khách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: XEM & GỬI THIỆP ZALO 1-CHẠM ================= */}
      {zaloPreviewGuest && activeCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">💌</span>
                <h3 className="text-base font-bold text-gray-900">
                  Gửi Thiệp Zalo Cho "{zaloPreviewGuest.name}"
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setZaloPreviewGuest(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const payload = getZaloSharePayload(zaloPreviewGuest, activeCard);

              return (
                <div className="space-y-3.5">
                  <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200/60 text-xs text-blue-900">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <span>🔗 Liên kết thiệp riêng:</span>
                    </p>
                    <p className="font-mono text-[11px] text-blue-800 break-all select-all bg-white p-2 rounded-xl border border-blue-200">
                      {payload.cardUrl}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Nội dung tin nhắn Zalo gửi kèm:
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-800 font-sans whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                      {payload.shareText}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(payload.shareText);
                        showToast("✨ Đã sao chép nội dung tin nhắn!");
                      }}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all"
                    >
                      Copy nội dung
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAsSentAndOpenZalo(zaloPreviewGuest)}
                      className="px-5 py-2 rounded-xl bg-[#0068ff] hover:bg-[#0054cc] text-white text-xs font-bold shadow-md shadow-blue-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Mở Zalo Gửi Ngay</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

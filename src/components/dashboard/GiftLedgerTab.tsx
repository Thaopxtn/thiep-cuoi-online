"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Gift,
  Plus,
  Download,
  Search,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  X,
  Sparkles,
} from "lucide-react";
import {
  GiftEntry,
  GiftPaymentMethod,
  getGiftEntries,
  addGiftEntry,
  deleteGiftEntry,
  calculateGiftStats,
  formatVndCurrency,
  exportGiftLedgerToCsv,
} from "@/lib/giftLedgerService";
import { WeddingCard } from "@/lib/weddingCardService";

interface GiftLedgerTabProps {
  cards: WeddingCard[];
}

export default function GiftLedgerTab({ cards }: GiftLedgerTabProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(
    cards[0]?.id || ""
  );
  const [entries, setEntries] = useState<GiftEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [relationFilter, setRelationFilter] = useState<string>("all");

  // Modal thêm bản ghi mừng cưới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [amount, setAmount] = useState<number>(500000);
  const [method, setMethod] = useState<GiftPaymentMethod>("cash");
  const [relation, setRelation] = useState<
    "groom_side" | "bride_side" | "friends" | "colleagues" | "other"
  >("friends");
  const [wishes, setWishes] = useState("");

  // Update selected card if cards change
  useEffect(() => {
    if (!selectedCardId && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Load entries when selected card changes
  useEffect(() => {
    if (selectedCardId) {
      const data = getGiftEntries(selectedCardId);
      // Nếu chưa có dữ liệu mẫu, tạo sẵn 3 mẫu demo để cô dâu chú rể dễ hình dung
      if (data.length === 0 && typeof window !== "undefined") {
        const demo: Omit<GiftEntry, "id" | "cardId" | "createdAt">[] = [
          {
            senderName: "Bác Hùng & Bác Gái",
            amount: 1000000,
            method: "cash",
            relation: "groom_side",
            wishes: "Chúc hai cháu trăm năm tình viên mãn!",
          },
          {
            senderName: "Anh Hoàng (Bạn Thân)",
            amount: 500000,
            method: "transfer",
            relation: "friends",
            wishes: "Mừng ngày trọng đại của đôi bạn trẻ!",
          },
        ];
        demo.forEach((d) => addGiftEntry(selectedCardId, d));
        setEntries(getGiftEntries(selectedCardId));
      } else {
        setEntries(data);
      }
    }
  }, [selectedCardId]);

  // Calculate statistics
  const stats = useMemo(() => calculateGiftStats(entries), [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        !searchQuery ||
        e.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.wishes && e.wishes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchMethod = methodFilter === "all" || e.method === methodFilter;
      const matchRelation =
        relationFilter === "all" || e.relation === relationFilter;
      return matchSearch && matchMethod && matchRelation;
    });
  }, [entries, searchQuery, methodFilter, relationFilter]);

  // Handle add gift
  const handleAddGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || amount <= 0 || !selectedCardId) return;

    addGiftEntry(selectedCardId, {
      senderName: senderName.trim(),
      amount: Number(amount),
      method,
      relation,
      wishes: wishes.trim(),
    });

    setEntries(getGiftEntries(selectedCardId));
    setSenderName("");
    setAmount(500000);
    setWishes("");
    setIsAddModalOpen(false);
  };

  // Handle delete gift
  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bản ghi tiền mừng này không?")) {
      deleteGiftEntry(selectedCardId, id);
      setEntries(getGiftEntries(selectedCardId));
    }
  };

  // Handle export CSV
  const handleExportCsv = () => {
    const activeCard = cards.find((c) => c.id === selectedCardId);
    const csv = exportGiftLedgerToCsv(entries, activeCard?.name);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `so-mung-cuoi-${selectedCardId || "zenlove"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-rose-100 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-rose-500" />
            <span>Sổ Mừng Cưới & Tiền Mừng Online</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Quản lý phong bì cưới, thống kê số tiền mừng từ quét QR & tiền mặt
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {cards.length > 1 && (
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#e54153] hover:bg-[#c93243] text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Thêm phong bì</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={entries.length === 0}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Xuất danh sách ra file Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Amount */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-100">
              Tổng tiền mừng cưới
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">
              {formatVndCurrency(stats.totalAmount)}
            </h3>
            <p className="text-xs text-rose-100/90 mt-1 flex items-center gap-1">
              <span>Đã nhận:</span>
              <strong className="text-white">{stats.totalCount} phong bì</strong>
            </p>
          </div>
          <Gift className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4" />
        </div>

        {/* Transfer (VietQR) */}
        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-2xs relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Chuyển khoản VietQR
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {formatVndCurrency(stats.transferAmount)}
          </h3>
          <p className="text-xs text-sky-600 font-semibold mt-1">
            {stats.transferCount} lượt quét chuyển khoản
          </p>
        </div>

        {/* Cash (Phong bì) */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-2xs relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Tiền mặt tại tiệc
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {formatVndCurrency(stats.cashAmount)}
          </h3>
          <p className="text-xs text-amber-600 font-semibold mt-1">
            {stats.cashCount} phong bì trao tay
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc lời chúc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:border-rose-500"
          >
            <option value="all">Tất cả phương thức</option>
            <option value="transfer">Chuyển khoản VietQR</option>
            <option value="cash">Tiền mặt tại tiệc</option>
          </select>

          <select
            value={relationFilter}
            onChange={(e) => setRelationFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:border-rose-500"
          >
            <option value="all">Tất cả quan hệ</option>
            <option value="groom_side">Họ Nhà Trai</option>
            <option value="bride_side">Họ Nhà Gái</option>
            <option value="friends">Bạn Bè</option>
            <option value="colleagues">Đồng Nghiệp</option>
          </select>
        </div>
      </div>

      {/* Gift Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <Gift className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">
              Chưa có bản ghi mừng cưới nào
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Bấm "+ Thêm phong bì" để ghi lại tiền mừng từ khách mời
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Người mừng</th>
                  <th className="py-3.5 px-4">Số tiền mừng</th>
                  <th className="py-3.5 px-4">Phương thức</th>
                  <th className="py-3.5 px-4">Quan hệ</th>
                  <th className="py-3.5 px-4">Lời chúc phúc</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredEntries.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3 px-4 text-center text-gray-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {entry.senderName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600 text-sm">
                      {formatVndCurrency(entry.amount)}
                    </td>
                    <td className="py-3 px-4">
                      {entry.method === "transfer" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          <CreditCard className="w-3 h-3" />
                          <span>VietQR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Banknote className="w-3 h-3" />
                          <span>Tiền mặt</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-500 text-[11px]">
                        {entry.relation === "groom_side" && "Họ Nhà Trai"}
                        {entry.relation === "bride_side" && "Họ Nhà Gái"}
                        {entry.relation === "friends" && "Bạn Bè"}
                        {entry.relation === "colleagues" && "Đồng Nghiệp"}
                        {entry.relation === "other" && "Khác"}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-500 italic">
                      {entry.wishes || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Xóa bản ghi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm Tiền Mừng Mới */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-rose-500" />
              <span>Ghi Nhận Tiền Mừng Mới</span>
            </h3>

            <form onSubmit={handleAddGift} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Tên người mừng / Gia đình <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Bác Hùng & Bác Gái"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Số tiền mừng (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={50000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-rose-500"
                />
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {[200000, 500000, 1000000, 2000000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setAmount(quick)}
                      className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-700 cursor-pointer"
                    >
                      {quick.toLocaleString("vi-VN")} đ
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Phương thức
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as GiftPaymentMethod)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
                  >
                    <option value="cash">Tiền mặt tại tiệc</option>
                    <option value="transfer">Chuyển khoản VietQR</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Quan hệ
                  </label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
                  >
                    <option value="friends">Bạn Bè</option>
                    <option value="groom_side">Họ Nhà Trai</option>
                    <option value="bride_side">Họ Nhà Gái</option>
                    <option value="colleagues">Đồng Nghiệp</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Lời chúc mừng (nếu có)
                </label>
                <textarea
                  rows={2}
                  placeholder="Vd: Chúc hai bạn trăm năm hạnh phúc..."
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#e54153] hover:bg-[#c93243] text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Lưu vào sổ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

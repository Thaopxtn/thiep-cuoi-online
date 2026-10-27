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
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Receipt,
  Scale,
  Check,
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
  BudgetItem,
  BudgetCategory,
  BUDGET_CATEGORIES,
  getBudgetItems,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  calculateBudgetStats,
} from "@/lib/giftLedgerService";
import { WeddingCard } from "@/data/initialCards";

interface GiftLedgerTabProps {
  cards: WeddingCard[];
}

export default function GiftLedgerTab({ cards }: GiftLedgerTabProps) {
  const [activeFinanceTab, setActiveFinanceTab] = useState<"gifts" | "budget" | "balance">("gifts");
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || "");

  // Gifts state
  const [entries, setEntries] = useState<GiftEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [relationFilter, setRelationFilter] = useState<string>("all");

  // Add Gift Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [amount, setAmount] = useState<number>(500000);
  const [method, setMethod] = useState<GiftPaymentMethod>("cash");
  const [relation, setRelation] = useState<
    "groom_side" | "bride_side" | "friends" | "colleagues" | "other"
  >("friends");
  const [wishes, setWishes] = useState("");

  // Budget state
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [budgetTitle, setBudgetTitle] = useState("");
  const [budgetCategory, setBudgetCategory] = useState<BudgetCategory>("venue");
  const [budgetEstimated, setBudgetEstimated] = useState<number>(10000000);
  const [budgetActual, setBudgetActual] = useState<number>(10000000);
  const [budgetIsPaid, setBudgetIsPaid] = useState<boolean>(false);
  const [budgetNotes, setBudgetNotes] = useState("");

  // Update selected card if cards change
  useEffect(() => {
    if (!selectedCardId && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Load entries and budget items when selected card changes
  useEffect(() => {
    if (selectedCardId) {
      const data = getGiftEntries(selectedCardId);
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

      // Load budget items
      const bData = getBudgetItems(selectedCardId);
      if (bData.length === 0 && typeof window !== "undefined") {
        const bDemo: Omit<BudgetItem, "id" | "cardId" | "createdAt">[] = [
          {
            category: "venue",
            title: "Tiệc cưới 30 bàn tại Nhà Hàng Trống Đồng",
            estimatedCost: 105000000,
            actualCost: 102000000,
            isPaid: true,
            notes: "Đã thanh toán đợt cuối sau tiệc",
          },
          {
            category: "media",
            title: "Gói phóng sự cưới & Quay Highlight Full HD",
            estimatedCost: 18000000,
            actualCost: 16500000,
            isPaid: true,
            notes: "Bao gồm 2 máy quay + 2 máy chụp",
          },
          {
            category: "outfit",
            title: "Thuê váy cưới cô dâu VIP & 2 Vest chú rể",
            estimatedCost: 14000000,
            actualCost: 14000000,
            isPaid: false,
            notes: "Đã cọc 50%, còn lại trả khi trả váy",
          },
          {
            category: "decor",
            title: "Trang trí backdrop hoa tươi & cổng cưới",
            estimatedCost: 20000000,
            actualCost: 22000000,
            isPaid: false,
            notes: "Phát sinh thêm hoa hồng nhập",
          },
        ];
        bDemo.forEach((b) => addBudgetItem(selectedCardId, b));
        setBudgetItems(getBudgetItems(selectedCardId));
      } else {
        setBudgetItems(bData);
      }
    }
  }, [selectedCardId]);

  // Statistics
  const giftStats = useMemo(() => calculateGiftStats(entries), [entries]);
  const budgetStats = useMemo(() => calculateBudgetStats(budgetItems), [budgetItems]);

  // Balance calculation
  const netBalance = giftStats.totalAmount - budgetStats.totalActual;

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
    a.download = `so-mung-cuoi-${activeCard?.slug || "wedding"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle add budget item
  const handleAddBudgetItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetTitle.trim() || !selectedCardId) return;

    addBudgetItem(selectedCardId, {
      category: budgetCategory,
      title: budgetTitle.trim(),
      estimatedCost: Number(budgetEstimated) || 0,
      actualCost: Number(budgetActual) || Number(budgetEstimated) || 0,
      isPaid: budgetIsPaid,
      notes: budgetNotes.trim() || undefined,
    });

    setBudgetItems(getBudgetItems(selectedCardId));
    setBudgetTitle("");
    setBudgetEstimated(10000000);
    setBudgetActual(10000000);
    setBudgetIsPaid(false);
    setBudgetNotes("");
    setIsAddBudgetModalOpen(false);
  };

  // Handle toggle paid
  const handleTogglePaid = (item: BudgetItem) => {
    updateBudgetItem(selectedCardId, item.id, { isPaid: !item.isPaid });
    setBudgetItems(getBudgetItems(selectedCardId));
  };

  // Handle delete budget item
  const handleDeleteBudgetItem = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa mục chi phí này không?")) {
      deleteBudgetItem(selectedCardId, id);
      setBudgetItems(getBudgetItems(selectedCardId));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Card Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#e54153]" />
            <span>Sổ Mừng Cưới & Quản Trị Ngân Sách Đám Cưới</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi tiền mừng phong bì & VietQR, dự toán chi phí nhà hàng dịch vụ và cân đối tài chính tiệc cưới.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {cards.length > 1 && (
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-rose-500"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  Thiệp: {c.name}
                </option>
              ))}
            </select>
          )}

          {activeFinanceTab === "gifts" && (
            <>
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Xuất Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#e54153] hover:bg-[#c93243] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi phong bì mới</span>
              </button>
            </>
          )}

          {activeFinanceTab === "budget" && (
            <button
              type="button"
              onClick={() => setIsAddBudgetModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm khoản chi</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveFinanceTab("gifts")}
          className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeFinanceTab === "gifts"
              ? "bg-white text-rose-600 shadow-xs border border-gray-200/80"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Sổ Mừng Cưới (Thu: {formatVndCurrency(giftStats.totalAmount)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFinanceTab("budget")}
          className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeFinanceTab === "budget"
              ? "bg-white text-indigo-600 shadow-xs border border-gray-200/80"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Chi Phí Tiệc Cưới (Chi: {formatVndCurrency(budgetStats.totalActual)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFinanceTab("balance")}
          className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeFinanceTab === "balance"
              ? "bg-white text-emerald-600 shadow-xs border border-gray-200/80"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Cân Đối Thu - Chi</span>
        </button>
      </div>

      {/* ================= VIEW 1: SỔ MỪNG CƯỚI (GIFTS) ================= */}
      {activeFinanceTab === "gifts" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Tổng tiền mừng nhận được
              </span>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#e54153]">
                  {formatVndCurrency(giftStats.totalAmount)}
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Tổng {giftStats.totalCount} phong bì mừng
                </p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Chuyển khoản (VietQR)</span>
              </span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold text-blue-900">
                  {formatVndCurrency(giftStats.transferAmount)}
                </span>
                <p className="text-[11px] text-blue-600/80 mt-0.5">
                  {giftStats.transferCount} lượt chuyển khoản trực tuyến
                </p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="w-4 h-4" />
                <span>Tiền mặt / Phong bì tại sảnh</span>
              </span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold text-emerald-900">
                  {formatVndCurrency(giftStats.cashAmount)}
                </span>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">
                  {giftStats.cashCount} phong bì trao tay
                </p>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên người mừng, lời chúc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-700 focus:outline-none"
              >
                <option value="all">Tất cả hình thức</option>
                <option value="transfer">Chuyển khoản VietQR</option>
                <option value="cash">Tiền mặt</option>
              </select>

              <select
                value={relationFilter}
                onChange={(e) => setRelationFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-700 focus:outline-none"
              >
                <option value="all">Tất cả quan hệ</option>
                <option value="groom_side">Họ Nhà Trai</option>
                <option value="bride_side">Họ Nhà Gái</option>
                <option value="friends">Bạn Bè</option>
                <option value="colleagues">Đồng Nghiệp</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          {/* Table of Gifts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {filteredEntries.length === 0 ? (
              <div className="py-16 text-center">
                <Gift className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">Chưa có bản ghi tiền mừng nào</p>
                <p className="text-xs text-gray-400 mt-1">Bấm "Ghi phong bì mới" để bắt đầu ghi nhận.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Người mừng & Quan hệ</th>
                      <th className="py-3 px-3">Số tiền</th>
                      <th className="py-3 px-3">Hình thức</th>
                      <th className="py-3 px-3">Lời chúc mừng</th>
                      <th className="py-3 px-3">Thời gian</th>
                      <th className="py-3 px-4 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block">{e.senderName}</span>
                          <span className="text-[10px] text-gray-400">
                            {e.relation === "groom_side"
                              ? "Họ Nhà Trai"
                              : e.relation === "bride_side"
                              ? "Họ Nhà Gái"
                              : e.relation === "friends"
                              ? "Bạn Bè"
                              : e.relation === "colleagues"
                              ? "Đồng Nghiệp"
                              : "Khách Quý"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-rose-600 text-sm">
                          {formatVndCurrency(e.amount)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              e.method === "transfer"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {e.method === "transfer" ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                            {e.method === "transfer" ? "Chuyển khoản" : "Tiền mặt"}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[220px]">
                          <p className="text-gray-600 line-clamp-2 text-[11px]">
                            {e.wishes || <span className="text-gray-300 italic">Không có lời nhắn</span>}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-[10.5px]">
                          {new Date(e.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(e.id)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa bản ghi"
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
        </div>
      )}

      {/* ================= VIEW 2: DỰ TOÁN & CHI PHÍ (BUDGET) ================= */}
      {activeFinanceTab === "budget" && (
        <div className="space-y-6">
          {/* Budget KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Dự toán chi phí ban đầu
              </span>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-900">
                  {formatVndCurrency(budgetStats.totalEstimated)}
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">Ước tính theo kế hoạch</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                Tổng chi phí thực tế phát sinh
              </span>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-purple-700">
                  {formatVndCurrency(budgetStats.totalActual)}
                </span>
                <p className="text-[11px] text-purple-600/80 mt-0.5">
                  {budgetStats.totalActual > budgetStats.totalEstimated
                    ? `Vượt dự toán ${formatVndCurrency(budgetStats.totalActual - budgetStats.totalEstimated)}`
                    : "Trong tầm kiểm soát"}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Đã thanh toán cho nhà cung cấp
              </span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {formatVndCurrency(budgetStats.totalPaid)}
                </span>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">
                  Còn phải thanh toán: {formatVndCurrency(Math.max(0, budgetStats.totalActual - budgetStats.totalPaid))}
                </p>
              </div>
            </div>
          </div>

          {/* Budget Items Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {budgetItems.length === 0 ? (
              <div className="py-16 text-center">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">Chưa có danh mục chi phí nào</p>
                <p className="text-xs text-gray-400 mt-1">Bấm "Thêm khoản chi" để lập ngân sách đám cưới.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Hạng mục & Nội dung chi</th>
                      <th className="py-3 px-3">Dự kiến</th>
                      <th className="py-3 px-3">Thực tế chi</th>
                      <th className="py-3 px-3">Trạng thái thanh toán</th>
                      <th className="py-3 px-3">Ghi chú nhà cung cấp</th>
                      <th className="py-3 px-4 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {budgetItems.map((item) => {
                      const catMeta = BUDGET_CATEGORIES.find((c) => c.id === item.category) || BUDGET_CATEGORIES[0];
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 block">{item.title}</span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <span>{catMeta.icon}</span>
                              <span>{catMeta.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-500 font-medium">
                            {formatVndCurrency(item.estimatedCost)}
                          </td>
                          <td className="py-3 px-3 font-bold text-indigo-700 text-sm">
                            {formatVndCurrency(item.actualCost)}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleTogglePaid(item)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-colors cursor-pointer ${
                                item.isPaid
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              {item.isPaid ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                              <span>{item.isPaid ? "Đã thanh toán đủ" : "Chưa trả / Còn cọc"}</span>
                            </button>
                          </td>
                          <td className="py-3 px-3 max-w-[200px] text-gray-500 text-[11px] truncate">
                            {item.notes || <span className="text-gray-300 italic">Không có ghi chú</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteBudgetItem(item.id)}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Xóa khoản chi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 3: CÂN ĐỐI THU - CHI (BALANCE) ================= */}
      {activeFinanceTab === "balance" && (
        <div className="space-y-6">
          {/* Main Net Profit / Loss Banner */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 ${
              netBalance >= 0
                ? "bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400"
                : "bg-gradient-to-br from-rose-500 to-red-700 text-white border-rose-400"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-white/90" />
                <span className="text-xs uppercase font-bold tracking-widest text-white/80">
                  Cân Đối Tài Chính Tiệc Cưới Toàn Diện
                </span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {netBalance >= 0
                  ? `Thặng Dư: +${formatVndCurrency(netBalance)}`
                  : `Bù Chi Phí: -${formatVndCurrency(Math.abs(netBalance))}`}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mt-2 max-w-xl leading-relaxed">
                {netBalance >= 0
                  ? "🎉 Chúc mừng bạn! Tổng số tiền mừng cưới đã bù đắp hoàn toàn chi phí tiệc cưới và tạo ra số dư tài chính tuyệt vời để bắt đầu cuộc sống hôn nhân!"
                  : "💡 Chi phí thực tế đang cao hơn tiền mừng cưới nhận được. Hãy kiểm tra lại các khoản đặt cọc và tối ưu các dịch vụ chưa thanh toán."}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-[200px]">
              <span className="text-[11px] font-bold text-white/80 block uppercase">Tỷ lệ hoàn vốn</span>
              <span className="text-3xl font-extrabold block mt-1">
                {budgetStats.totalActual > 0
                  ? `${Math.round((giftStats.totalAmount / budgetStats.totalActual) * 100)}%`
                  : "100%"}
              </span>
              <span className="text-[10px] text-white/80 mt-0.5 block">
                Tổng thu / Tổng chi phí
              </span>
            </div>
          </div>

          {/* Breakdown Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-rose-500" />
                <span>Nguồn Thu Mừng Cưới ({formatVndCurrency(giftStats.totalAmount)})</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Phong bì tiền mặt ({giftStats.cashCount} khách):</span>
                  <strong className="text-gray-900">{formatVndCurrency(giftStats.cashAmount)}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Chuyển khoản VietQR ({giftStats.transferCount} khách):</span>
                  <strong className="text-blue-600">{formatVndCurrency(giftStats.transferAmount)}</strong>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-500" />
                <span>Chi Phí Tiệc Cưới ({formatVndCurrency(budgetStats.totalActual)})</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Đã thanh toán dứt điểm:</span>
                  <strong className="text-emerald-600">{formatVndCurrency(budgetStats.totalPaid)}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Còn nợ / Phải trả sau tiệc:</span>
                  <strong className="text-rose-600">
                    {formatVndCurrency(Math.max(0, budgetStats.totalActual - budgetStats.totalPaid))}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM BẢN GHI PHONG BÌ MỪNG CƯỚI ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-rose-500" />
                <span>Ghi Nhận Tiền Mừng Cưới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGift} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Tên người mừng / Gia đình: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Bác Hùng, Bạn Lan Đại Học..."
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Số tiền (VNĐ): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={50000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500 font-bold text-rose-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Hình thức mừng
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as GiftPaymentMethod)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
                  >
                    <option value="cash">Tiền mặt / Phong bì</option>
                    <option value="transfer">Chuyển khoản (VietQR)</option>
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

      {/* ================= MODAL: THÊM KHOẢN CHI PHÍ TIỆC CƯỚI ================= */}
      {isAddBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Thêm Khoản Chi Phí Tiệc Cưới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddBudgetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBudgetItem} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Nội dung chi phí: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Tiền cọc nhà hàng, Thuê váy cưới, Hoa tươi..."
                  value={budgetTitle}
                  onChange={(e) => setBudgetTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Hạng mục:
                </label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value as BudgetCategory)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {BUDGET_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Dự kiến (VNĐ):
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={budgetEstimated}
                    onChange={(e) => setBudgetEstimated(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Thực tế (VNĐ):
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={budgetActual}
                    onChange={(e) => setBudgetActual(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-indigo-500 font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={budgetIsPaid}
                  onChange={(e) => setBudgetIsPaid(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <label htmlFor="paidCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Đã thanh toán đủ cho nhà cung cấp
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Ghi chú nhà cung cấp / Hạn trả nợ:
                </label>
                <textarea
                  rows={2}
                  placeholder="Vd: Số điện thoại quản lý nhà hàng, hạn thanh toán..."
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBudgetModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Lưu khoản chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

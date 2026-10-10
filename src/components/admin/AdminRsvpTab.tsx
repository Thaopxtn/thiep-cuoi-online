"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Calendar,
  Phone,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";

interface RsvpItem {
  id: string;
  cardId: string;
  cardName?: string;
  cardSlug?: string;
  name: string;
  phone: string;
  attending: boolean;
  guests?: number;
  note?: string;
  createdAt?: string;
}

interface WishItem {
  id: string;
  cardId: string;
  cardName?: string;
  cardSlug?: string;
  name: string;
  content: string;
  createdAt?: string;
}

interface AdminRsvpTabProps {
  rsvps: RsvpItem[];
  wishes: WishItem[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteRsvp: (id: string, name: string) => Promise<void>;
  onDeleteWish: (id: string, name: string) => Promise<void>;
}

export default function AdminRsvpTab({
  rsvps,
  wishes,
  loading,
  onRefresh,
  onDeleteRsvp,
  onDeleteWish,
}: AdminRsvpTabProps) {
  const [subTab, setSubTab] = useState<"rsvp" | "wishes">("rsvp");
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "attending" | "declining">("all");

  // Lọc RSVP
  const filteredRsvps = useMemo(() => {
    return rsvps.filter((r) => {
      const matchStatus =
        attendanceFilter === "all"
          ? true
          : attendanceFilter === "attending"
          ? r.attending !== false
          : r.attending === false;

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.cardName?.toLowerCase().includes(q) ||
        r.note?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [rsvps, searchTerm, attendanceFilter]);

  // Lọc Lời chúc
  const filteredWishes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return wishes;
    return wishes.filter(
      (w) =>
        w.name?.toLowerCase().includes(q) ||
        w.content?.toLowerCase().includes(q) ||
        w.cardName?.toLowerCase().includes(q)
    );
  }, [wishes, searchTerm]);

  // Xuất file CSV hỗ trợ tiếng Việt UTF-8 BOM
  const exportRsvpsCsv = () => {
    if (rsvps.length === 0) {
      alert("Chưa có dữ liệu khách mời để xuất file!");
      return;
    }

    const headers = [
      "ID",
      "Tên Khách Mời",
      "Số Điện Thoại",
      "Đám Cưới (Thiệp)",
      "Trạng Thái",
      "Số Người Đi Cùng",
      "Lời Nhắn Gửi Cặp Đôi",
      "Thời Gian Xác Nhận",
    ];

    const rows = filteredRsvps.map((r) => [
      `"${r.id}"`,
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${r.phone || ""}"`,
      `"${(r.cardName || "").replace(/"/g, '""')}"`,
      r.attending !== false ? '"Có tham dự"' : '"Không thể đến"',
      r.attending !== false ? r.guests || 1 : 0,
      `"${(r.note || "").replace(/"/g, '""')}"`,
      `"${r.createdAt || ""}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `danh-sach-khach-moi-zenlove-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Chọn Sub-tab */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSubTab("rsvp");
              setSearchTerm("");
            }}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              subTab === "rsvp"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Khách mời RSVP</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                subTab === "rsvp" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {rsvps.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab("wishes");
              setSearchTerm("");
            }}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              subTab === "wishes"
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Sổ lưu bút &amp; Lời chúc</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                subTab === "wishes" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {wishes.length}
            </span>
          </button>
        </div>

        {/* Thanh tác vụ phụ */}
        <div className="flex items-center gap-2">
          {subTab === "rsvp" && (
            <button
              type="button"
              onClick={exportRsvpsCsv}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất file Excel (CSV)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Thanh tìm kiếm & Lọc */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              subTab === "rsvp"
                ? "Tìm theo tên khách, số điện thoại, tên đám cưới..."
                : "Tìm theo tên người chúc, nội dung, tên đám cưới..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-zen-primary transition-colors bg-gray-50/50"
          />
        </div>

        {subTab === "rsvp" && (
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAttendanceFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                attendanceFilter === "all"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tất cả ({rsvps.length})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter("attending")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                attendanceFilter === "attending"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-gray-500 hover:text-emerald-700"
              }`}
            >
              Tham dự ({rsvps.filter((r) => r.attending !== false).length})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter("declining")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                attendanceFilter === "declining"
                  ? "bg-white text-rose-700 shadow-2xs"
                  : "text-gray-500 hover:text-rose-700"
              }`}
            >
              Báo bận ({rsvps.filter((r) => r.attending === false).length})
            </button>
          </div>
        )}
      </div>

      {/* NỘI DUNG 1: BẢNG KHÁCH MỜI RSVP */}
      {subTab === "rsvp" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[11px] font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Tên khách mời</th>
                  <th className="py-3.5 px-4">Số điện thoại</th>
                  <th className="py-3.5 px-4">Thuộc thiệp cưới</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Số người</th>
                  <th className="py-3.5 px-4">Lời nhắn</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredRsvps.length > 0 ? (
                  filteredRsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{rsvp.name}</td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono">{rsvp.phone}</td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/show/${rsvp.cardSlug || ""}`}
                          target="_blank"
                          className="font-medium text-zen-primary hover:underline flex items-center gap-1 max-w-[180px] truncate"
                        >
                          <span className="truncate">{rsvp.cardName || "Thiệp cưới"}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-gray-400" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        {rsvp.attending !== false ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Có tham dự</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500 font-semibold bg-gray-100 px-2.5 py-0.5 rounded-full text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Không thể đến</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-900">
                        {rsvp.attending !== false ? rsvp.guests || 1 : "-"}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-gray-500 italic truncate">
                        {rsvp.note ? `"${rsvp.note}"` : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-[11px] whitespace-nowrap">
                        {rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("vi-VN") : "Gần đây"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteRsvp(rsvp.id, rsvp.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa phản hồi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Chưa có phản hồi khách mời nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>
              Tổng số <strong>{filteredRsvps.length}</strong> khách mời hiển thị
            </span>
          </div>
        </div>
      )}

      {/* NỘI DUNG 2: DANH SÁCH LỜI CHÚC SỔ LƯU BÚT */}
      {subTab === "wishes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWishes.length > 0 ? (
              filteredWishes.map((wish) => (
                <div
                  key={wish.id}
                  className="bg-white rounded-2xl p-5 border border-rose-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                          {wish.name}
                        </h4>
                        <Link
                          href={`/show/${wish.cardSlug || ""}`}
                          target="_blank"
                          className="text-[11px] text-zen-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>{wish.cardName || "Thiệp cưới"}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteWish(wish.id, wish.name)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Xóa lời chúc vi phạm / spam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-700 italic font-serif leading-relaxed">
                      "{wish.content}"
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{wish.createdAt ? new Date(wish.createdAt).toLocaleString("vi-VN") : "Gần đây"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteWish(wish.id, wish.name)}
                      className="text-rose-500 hover:underline md:hidden text-[10px] font-bold"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 p-8">
                Không tìm thấy lời chúc mừng nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

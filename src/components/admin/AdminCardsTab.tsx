"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Users,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Plus,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface CardItem {
  id: string;
  slug: string;
  name: string;
  templateId?: string;
  templateName?: string;
  status: "published" | "draft";
  views: number;
  coverImage?: string;
  weddingDate?: string;
  weddingTime?: string;
  groomName?: string;
  brideName?: string;
  groomPhone?: string;
  bridePhone?: string;
  rsvpsCount: number;
  wishesCount: number;
  updatedAt?: string;
  musicTitle?: string;
}

interface AdminCardsTabProps {
  cards: CardItem[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteCard: (id: string, name: string) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: "published" | "draft") => Promise<void>;
}

export default function AdminCardsTab({
  cards,
  loading,
  onRefresh,
  onDeleteCard,
  onToggleStatus,
}: AdminCardsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Lọc thiệp theo từ khóa và trạng thái
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchStatus =
        statusFilter === "all" ? true : card.status === statusFilter;

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        card.name?.toLowerCase().includes(q) ||
        card.slug?.toLowerCase().includes(q) ||
        card.groomName?.toLowerCase().includes(q) ||
        card.brideName?.toLowerCase().includes(q) ||
        card.groomPhone?.includes(q) ||
        card.bridePhone?.includes(q) ||
        card.templateName?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [cards, searchTerm, statusFilter]);

  const copyCardLink = (id: string, slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/show/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Thanh công cụ tìm kiếm và bộ lọc */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên thiệp, cặp đôi, slug, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-zen-primary transition-colors bg-gray-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Bộ lọc trạng thái & Làm mới */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tất cả ({cards.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("published")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "published"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-gray-500 hover:text-emerald-700"
              }`}
            >
              Đã xuất bản ({cards.filter((c) => c.status === "published").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("draft")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "draft"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-gray-500 hover:text-amber-700"
              }`}
            >
              Bản nháp ({cards.filter((c) => c.status === "draft").length})
            </button>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/templates"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-zen-primary text-white text-xs font-bold shadow-md hover:bg-[#d93849] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo thiệp mới</span>
          </Link>
        </div>
      </div>

      {/* Bảng danh sách thiệp cưới */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[11px] font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Thiệp cưới & Mẫu</th>
                <th className="py-3.5 px-4">Cặp đôi</th>
                <th className="py-3.5 px-4">Ngày giờ cưới</th>
                <th className="py-3.5 px-4 text-center">Lượt xem</th>
                <th className="py-3.5 px-4 text-center">Tương tác</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-rose-50/20 transition-colors">
                    {/* Ảnh bìa + Tên thiệp */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                          <img
                            src={card.coverImage || "/assets/images/placeholder.jpg"}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="min-w-0 max-w-[220px]">
                          <p className="font-bold text-gray-900 truncate text-xs sm:text-sm">
                            {card.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono truncate">
                            /{card.slug}
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {card.templateName || "Hồng Phong"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cặp đôi */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800">
                        {card.groomName || "Chú rể"} &amp; {card.brideName || "Cô dâu"}
                      </div>
                      {(card.groomPhone || card.bridePhone) && (
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          SĐT: {card.groomPhone || card.bridePhone}
                        </div>
                      )}
                    </td>

                    {/* Ngày cưới */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-gray-800">
                        <Calendar className="w-3.5 h-3.5 text-zen-primary" />
                        <span>{card.weddingDate || "Chưa đặt"}</span>
                      </div>
                      {card.weddingTime && (
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Giờ: {card.weddingTime}
                        </div>
                      )}
                    </td>

                    {/* Lượt xem */}
                    <td className="py-3.5 px-4 text-center font-bold text-gray-900">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        <span>{card.views || 0}</span>
                      </div>
                    </td>

                    {/* Tương tác: RSVP + Wishes */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-3 text-[11px]">
                        <span
                          className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full"
                          title="Số khách xác nhận tham dự"
                        >
                          <Users className="w-3 h-3" />
                          <span>{card.rsvpsCount || 0}</span>
                        </span>
                        <span
                          className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full"
                          title="Số lời chúc trong Sổ lưu bút"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{card.wishesCount || 0}</span>
                        </span>
                      </div>
                    </td>

                    {/* Trạng thái Switch */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        disabled={processingId === card.id}
                        onClick={async () => {
                          setProcessingId(card.id);
                          await onToggleStatus(card.id, card.status);
                          setProcessingId(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all active:scale-95 ${
                          card.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Bấm để đổi trạng thái Xuất bản / Bản nháp"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            card.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        <span>
                          {card.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                        </span>
                      </button>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Xem thiệp */}
                        <Link
                          href={`/show/${card.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-zen-primary hover:bg-gray-100 transition-colors"
                          title="Xem thiệp cưới online"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Sửa thiệp */}
                        <Link
                          href={`/design-template/${card.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-zen-primary hover:bg-rose-50 transition-colors"
                          title="Mở trình thiết kế kéo thả"
                        >
                          <Edit3 className="w-4 h-4 text-zen-primary" />
                        </Link>

                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => copyCardLink(card.id, card.slug)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Sao chép link xem thiệp"
                        >
                          {copiedId === card.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Xóa thiệp */}
                        <button
                          type="button"
                          onClick={() => onDeleteCard(card.id, card.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa vĩnh viễn thiệp cưới này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-zen-primary border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải danh sách thiệp cưới...</span>
                      </div>
                    ) : (
                      "Không tìm thấy thiệp cưới nào phù hợp"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer bảng */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
          <span>
            Hiển thị <strong>{filteredCards.length}</strong> / {cards.length} thiệp cưới toàn sàn
          </span>
          <span className="text-[11px] text-gray-400">
            Mẹo: Bấm vào nhãn trạng thái để chuyển đổi nhanh giữa Bản nháp và Đã xuất bản
          </span>
        </div>
      </div>
    </div>
  );
}

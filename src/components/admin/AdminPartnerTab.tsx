"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Handshake,
  Search,
  Filter,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Building,
  Sparkles,
  MessageSquare,
  ChevronDown,
} from "lucide-react";

export interface PartnerApplicationItem {
  id: string;
  brandName: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  website?: string;
  message?: string;
  status: "pending" | "contacted" | "approved" | "rejected";
  createdAt: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  all: "Tất cả lĩnh vực",
  studio: "Studio Chụp Ảnh",
  jewelry: "Nhẫn Cưới & Trang Sức",
  dress: "Váy Cưới & Vest",
  venue: "Sảnh Tiệc & Khách Sạn",
  decor: "Tráp Ăn Hỏi & Hoa",
  honeymoon: "Tuần Trăng Mật",
};

export default function AdminPartnerTab() {
  const [partners, setPartners] = useState<PartnerApplicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partners");
      const data = await res.json();
      if (data.success && Array.isArray(data.partners)) {
        setPartners(data.partners);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đối tác:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: "pending" | "contacted" | "approved" | "rejected"
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn đăng ký đối tác này?")) return;
    try {
      const res = await fetch(`/api/partners?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Lỗi xóa đơn đối tác:", err);
    }
  };

  // KPIs
  const totalCount = partners.length;
  const pendingCount = partners.filter((p) => p.status === "pending").length;
  const contactedCount = partners.filter((p) => p.status === "contacted").length;
  const approvedCount = partners.filter((p) => p.status === "approved").length;

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBrand = p.brandName.toLowerCase().includes(q);
        const matchName = p.contactName.toLowerCase().includes(q);
        const matchPhone = p.phone.toLowerCase().includes(q);
        const matchEmail = p.email.toLowerCase().includes(q);
        return matchBrand || matchName || matchPhone || matchEmail;
      }
      return true;
    });
  }, [partners, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header & Quick Controls */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Quản Lý Đối Tác Cưới & Tiếp Thị Liên Kết
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tiếp nhận và kích hoạt ưu đãi cho các thương hiệu, Studio cưới đồng hành cùng ZenLove
              </p>
            </div>
          </div>

          <button
            onClick={fetchPartners}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zen-primary" : "text-gray-500"}`} />
            <span>Làm mới danh sách</span>
          </button>
        </div>

        {/* 2. KPI Summary Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-xs font-medium text-gray-500">Tổng đối tác đăng ký</span>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <span className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ liên hệ</span>
            </span>
            <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>Đang trao đổi</span>
            </span>
            <p className="text-2xl font-black text-blue-900 mt-1">{contactedCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã duyệt hợp tác</span>
            </span>
            <p className="text-2xl font-black text-emerald-900 mt-1">{approvedCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên thương hiệu, người liên hệ, số điện thoại, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc Trạng Thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 focus:border-zen-primary focus:outline-none bg-white cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ liên hệ</option>
            <option value="contacted">Đã liên hệ</option>
            <option value="approved">Đã duyệt hợp tác</option>
            <option value="rejected">Từ chối / Hủy</option>
          </select>

          {/* Lọc Lĩnh Vực */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 focus:border-zen-primary focus:outline-none bg-white cursor-pointer"
          >
            <option value="all">Tất cả lĩnh vực</option>
            <option value="studio">Studio ảnh</option>
            <option value="jewelry">Nhẫn cưới</option>
            <option value="dress">Váy cưới / Vest</option>
            <option value="venue">Sảnh tiệc</option>
            <option value="decor">Tráp ăn hỏi</option>
            <option value="honeymoon">Tuần trăng mật</option>
          </select>
        </div>
      </div>

      {/* 4. Applications List */}
      <div className="space-y-3">
        {filteredPartners.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Chưa có đơn đối tác nào phù hợp</p>
            <p className="text-xs text-gray-400 mt-1">Các đơn đăng ký mới từ trang /doi-tac-cuoi sẽ hiển thị tự động tại đây.</p>
          </div>
        ) : (
          filteredPartners.map((partner) => {
            const catName = CATEGORY_NAMES[partner.category] || partner.category;
            const isUpdating = updatingId === partner.id;

            return (
              <div
                key={partner.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 hover:border-rose-100 hover:shadow-xs transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-zen-primary flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">{partner.brandName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                          {catName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Người đại diện: <strong className="text-gray-800">{partner.contactName}</strong> • Đăng ký lúc:{" "}
                        {new Date(partner.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={partner.status}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleUpdateStatus(
                          partner.id,
                          e.target.value as "pending" | "contacted" | "approved" | "rejected"
                        )
                      }
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition-colors ${
                        partner.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : partner.status === "contacted"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : partner.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <option value="pending">⏳ Chờ liên hệ</option>
                      <option value="contacted">📞 Đã liên hệ</option>
                      <option value="approved">✅ Đã duyệt hợp tác</option>
                      <option value="rejected">❌ Hủy / Từ chối</option>
                    </select>

                    <button
                      onClick={() => handleDelete(partner.id)}
                      title="Xóa đơn đăng ký"
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Offer details & proposal message */}
                {partner.message && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Đề xuất chính sách ưu đãi: </span>
                      <span>"{partner.message}"</span>
                    </div>
                  </div>
                )}

                {/* Contact Quick Buttons */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    <a
                      href={`tel:${partner.phone}`}
                      className="flex items-center gap-1.5 font-bold text-zen-primary hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{partner.phone}</span>
                    </a>
                    <a
                      href={`mailto:${partner.email}`}
                      className="flex items-center gap-1.5 hover:text-gray-900 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{partner.email}</span>
                    </a>
                    {partner.website && (
                      <a
                        href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-gray-900 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        <span>Website thương hiệu</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${partner.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-zen-primary text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Gọi ngay</span>
                    </a>
                    <a
                      href={`mailto:${partner.email}?subject=${encodeURIComponent("ZenLove Wedding - Xác nhận đăng ký hợp tác thương hiệu " + partner.brandName)}`}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-zen-primary text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Gửi Email</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Users,
  CreditCard,
  MessageSquare,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  XCircle,
  LogIn,
  UserPlus,
  Send,
  Trash2,
  Share2,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

export interface SystemActivityItem {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  actorName: string;
  actorEmail?: string;
  actorType: "user" | "guest" | "system";
  targetName?: string;
  targetId?: string;
  targetSlug?: string;
  details?: string;
  metadata?: Record<string, any>;
}

interface AdminActivityTabProps {
  initialActivities?: SystemActivityItem[];
  onRefreshParent?: () => void;
}

export default function AdminActivityTab({
  initialActivities = [],
  onRefreshParent,
}: AdminActivityTabProps) {
  const [activities, setActivities] = useState<SystemActivityItem[]>(initialActivities);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedActorType, setSelectedActorType] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(15);

  // Hàm fetch hoạt động mới nhất từ server API
  const fetchActivities = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/admin/activities?limit=200");
      const data = await res.json();
      if (data.success && Array.isArray(data.activities)) {
        setActivities(data.activities);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Lỗi khi tải nhật ký hoạt động:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Đồng bộ với prop khi nhận prop mới
  useEffect(() => {
    if (initialActivities.length > 0 && activities.length === 0) {
      setActivities(initialActivities);
    }
  }, [initialActivities]);

  // Bộ đếm tự động làm mới (Auto Refresh interval)
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchActivities(true);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, fetchActivities]);

  // Lọc danh sách hoạt động
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Lọc theo loại hoạt động
      if (selectedType !== "all") {
        if (selectedType === "users" && !["user_register", "user_login"].includes(act.type)) {
          return false;
        }
        if (selectedType === "cards" && !["card_create", "card_update", "card_publish", "card_delete"].includes(act.type)) {
          return false;
        }
        if (selectedType === "rsvps" && act.type !== "rsvp_submit") {
          return false;
        }
        if (selectedType === "wishes" && act.type !== "wish_submit") {
          return false;
        }
        if (selectedType === "views" && act.type !== "card_view") {
          return false;
        }
      }

      // Lọc theo tác nhân
      if (selectedActorType !== "all" && act.actorType !== selectedActorType) {
        return false;
      }

      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchActor = act.actorName.toLowerCase().includes(q);
        const matchEmail = act.actorEmail ? act.actorEmail.toLowerCase().includes(q) : false;
        const matchTarget = act.targetName ? act.targetName.toLowerCase().includes(q) : false;
        const matchDetails = act.details ? act.details.toLowerCase().includes(q) : false;
        const matchSlug = act.targetSlug ? act.targetSlug.toLowerCase().includes(q) : false;

        return matchTitle || matchActor || matchEmail || matchTarget || matchDetails || matchSlug;
      }

      return true;
    });
  }, [activities, selectedType, selectedActorType, searchQuery]);

  // Thống kê nhanh theo nhóm
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayEvents = 0;
    let userEvents = 0;
    let cardEvents = 0;
    let rsvpEvents = 0;
    let wishEvents = 0;
    let viewEvents = 0;

    activities.forEach((a) => {
      const time = new Date(a.timestamp).getTime();
      if (time >= today.getTime()) todayEvents++;

      if (["user_register", "user_login"].includes(a.type)) userEvents++;
      else if (["card_create", "card_update", "card_publish", "card_delete"].includes(a.type)) cardEvents++;
      else if (a.type === "rsvp_submit") rsvpEvents++;
      else if (a.type === "wish_submit") wishEvents++;
      else if (a.type === "card_view") viewEvents++;
    });

    return {
      total: activities.length,
      today: todayEvents,
      users: userEvents,
      cards: cardEvents,
      rsvps: rsvpEvents,
      wishes: wishEvents,
      views: viewEvents,
    };
  }, [activities]);

  // Xuất file CSV
  const handleExportCSV = () => {
    if (filteredActivities.length === 0) {
      alert("Không có dữ liệu hoạt động để xuất file!");
      return;
    }

    const headers = ["Thời gian", "Loại hành động", "Mô tả", "Tác nhân", "Đối tượng", "Chi tiết", "Ghi chú"];
    const rows = filteredActivities.map((a) => [
      new Date(a.timestamp).toLocaleString("vi-VN"),
      a.type,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${(a.actorEmail ? `${a.actorName} (${a.actorEmail})` : a.actorName).replace(/"/g, '""')}"`,
      `"${(a.targetName || "").replace(/"/g, '""')}"`,
      `"${(a.details || "").replace(/"/g, '""')}"`,
      a.targetSlug ? `/show/${a.targetSlug}` : "",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `nhat-ky-hoat-dong-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hàm hiển thị thời gian tương đối & đẹp
  const formatTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 45) return "Vừa xong";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} giờ trước`;
    const day = Math.floor(hour / 24);
    if (day < 7) return `${day} ngày trước`;
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render badge cấu hình loại hoạt động
  const renderActionBadge = (type: string) => {
    switch (type) {
      case "user_register":
        return {
          icon: UserPlus,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          label: "Tài khoản mới",
        };
      case "user_login":
        return {
          icon: LogIn,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          label: "Đăng nhập",
        };
      case "card_create":
        return {
          icon: Sparkles,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          dot: "bg-purple-500",
          label: "Tạo thiệp mới",
        };
      case "card_update":
        return {
          icon: CreditCard,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          label: "Chỉnh sửa thiệp",
        };
      case "card_publish":
        return {
          icon: Share2,
          bg: "bg-teal-50 text-teal-700 border-teal-200",
          dot: "bg-teal-500",
          label: "Xuất bản thiệp",
        };
      case "card_delete":
        return {
          icon: Trash2,
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          label: "Xóa thiệp",
        };
      case "rsvp_submit":
        return {
          icon: CheckCircle2,
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          label: "Phản hồi RSVP",
        };
      case "wish_submit":
        return {
          icon: MessageSquare,
          bg: "bg-pink-50 text-pink-700 border-pink-200",
          dot: "bg-pink-500",
          label: "Lời chúc mừng",
        };
      case "card_view":
        return {
          icon: Eye,
          bg: "bg-sky-50 text-sky-700 border-sky-200",
          dot: "bg-sky-500",
          label: "Xem thiệp",
        };
      default:
        return {
          icon: Activity,
          bg: "bg-gray-50 text-gray-700 border-gray-200",
          dot: "bg-gray-500",
          label: "Hoạt động",
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP HEADER & ĐIỀU KHIỂN THỜI GIAN THỰC */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-zen-primary text-white flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  Theo Dõi Hoạt Động Hệ Thống & Người Dùng
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-zen-primary text-[11px] font-bold border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-zen-primary animate-ping" />
                  <span>Live Feed</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Ghi nhận trực tiếp mọi hành vi: Đăng ký, Đăng nhập, Tạo thiệp, Khách RSVP, Lời chúc & Lượt xem
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Nút bật/tắt tự động làm mới */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoRefresh
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
              title="Bật/Tắt tự động nạp sự kiện mới mỗi 15s"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span>Tự động ({refreshCountdown}s)</span>
            </button>

            {/* Nút Làm mới ngay */}
            <button
              type="button"
              onClick={() => {
                fetchActivities();
                if (onRefreshParent) onRefreshParent();
              }}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>

            {/* Nút Xuất CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-zen-primary border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* 2. CHỈ SỐ NHANH HOẠT ĐỘNG */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/70 rounded-2xl p-3 border border-gray-100 text-center">
            <span className="text-[11px] font-medium text-gray-500">Toàn bộ sự kiện</span>
            <p className="text-lg font-black text-gray-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-100 text-center">
            <span className="text-[11px] font-bold text-rose-700">Hôm nay</span>
            <p className="text-lg font-black text-rose-600 mt-0.5">+{stats.today}</p>
          </div>
          <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100 text-center">
            <span className="text-[11px] font-medium text-blue-700">Tài khoản</span>
            <p className="text-lg font-black text-blue-600 mt-0.5">{stats.users}</p>
          </div>
          <div className="bg-purple-50/50 rounded-2xl p-3 border border-purple-100 text-center">
            <span className="text-[11px] font-medium text-purple-700">Thiết kế thiệp</span>
            <p className="text-lg font-black text-purple-600 mt-0.5">{stats.cards}</p>
          </div>
          <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100 text-center">
            <span className="text-[11px] font-medium text-emerald-700">Khách RSVP</span>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{stats.rsvps}</p>
          </div>
          <div className="bg-amber-50/50 rounded-2xl p-3 border border-amber-100 text-center">
            <span className="text-[11px] font-medium text-amber-700">Lời chúc mừng</span>
            <p className="text-lg font-black text-amber-600 mt-0.5">{stats.wishes}</p>
          </div>
        </div>
      </div>

      {/* 3. THANH BỘ LỌC & TÌM KIẾM */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Input Tìm kiếm */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên người dùng, khách mời, tên thiệp cưới, email, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary transition-all bg-gray-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc đối tượng (Actor) */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select
              value={selectedActorType}
              onChange={(e) => setSelectedActorType(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-medium bg-white text-gray-700 focus:outline-none focus:border-zen-primary cursor-pointer"
            >
              <option value="all">Tất cả đối tượng tác vụ</option>
              <option value="user">Chỉ thành viên / Người dùng</option>
              <option value="guest">Chỉ khách mời trực tuyến</option>
              <option value="system">Hệ thống tự động</option>
            </select>
          </div>
        </div>

        {/* Danh mục bộ lọc nhanh (Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-gray-50 scrollbar-none text-xs">
          <span className="text-gray-400 font-medium text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Phân loại:</span>
          </span>

          {[
            { id: "all", label: "Tất cả", count: stats.total },
            { id: "users", label: "Tài khoản & Đăng nhập", count: stats.users },
            { id: "cards", label: "Tạo & Sửa thiệp", count: stats.cards },
            { id: "rsvps", label: "Phản hồi RSVP", count: stats.rsvps },
            { id: "wishes", label: "Lời chúc mừng", count: stats.wishes },
            { id: "views", label: "Lượt xem thiệp", count: stats.views },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedType(pill.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                selectedType === pill.id
                  ? "bg-zen-primary text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedType === pill.id ? "bg-white/20 text-white" : "bg-white text-gray-500"
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. DÒNG THỜI GIAN HOẠT ĐỘNG (ACTIVITY TIMELINE STREAM) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zen-primary" />
            <h3 className="text-sm font-bold text-gray-900">
              Nhật Ký Dòng Thời Gian ({filteredActivities.length})
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">
            Cập nhật lần cuối: {lastUpdated.toLocaleTimeString("vi-VN")}
          </span>
        </div>

        {loading && activities.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-rose-200 border-t-zen-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500">Đang đồng bộ dòng hoạt động...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <Activity className="w-10 h-10 mx-auto text-gray-300 stroke-1" />
            <p className="text-sm font-medium text-gray-600">Không tìm thấy hoạt động nào phù hợp</p>
            <p className="text-xs text-gray-400">
              Thử xóa bộ lọc tìm kiếm hoặc quay lại sau khi người dùng tương tác trên web.
            </p>
            {(searchQuery || selectedType !== "all" || selectedActorType !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("all");
                  setSelectedActorType("all");
                }}
                className="mt-2 text-xs text-zen-primary font-bold hover:underline"
              >
                Đặt lại toàn bộ bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 divide-y divide-gray-100">
            {filteredActivities.map((act) => {
              const badge = renderActionBadge(act.type);
              const IconComp = badge.icon;
              const formattedTime = new Date(act.timestamp).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const formattedDate = new Date(act.timestamp).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              return (
                <div
                  key={act.id}
                  className="py-4 hover:bg-gray-50/60 rounded-2xl px-3 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Icon & Core Info */}
                  <div className="flex items-start gap-3.5">
                    {/* Activity Icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${badge.bg}`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      {/* Tiêu đề & Tag loại */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-gray-900 group-hover:text-zen-primary transition-colors">
                          {act.title}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>

                        {act.actorType === "guest" ? (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">
                            Khách mời
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                            Thành viên
                          </span>
                        )}
                      </div>

                      {/* Người thực hiện & Chi tiết */}
                      <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold text-gray-800">
                          {act.actorName}
                        </span>
                        {act.actorEmail && (
                          <span className="text-gray-400 font-mono text-[11px]">
                            ({act.actorEmail})
                          </span>
                        )}

                        {act.targetName && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500 font-medium">
                              Thiệp: <strong className="text-gray-800">{act.targetName}</strong>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Details Snippet */}
                      {act.details && (
                        <p className="text-xs text-gray-500 italic bg-gray-50/80 px-2.5 py-1.5 rounded-xl border border-gray-100 inline-block max-w-2xl mt-1">
                          {act.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Timestamp & Action Link */}
                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-700">{formatTimeAgo(act.timestamp)}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formattedTime} • {formattedDate}
                    </span>

                    {/* Quick navigation link */}
                    {act.targetSlug && (
                      <div className="mt-1 flex items-center gap-2">
                        <Link
                          href={`/show/${act.targetSlug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-zen-primary hover:underline"
                        >
                          <span>Xem thiệp</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        {act.targetId && (
                          <Link
                            href={`/design-template/${act.targetId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-900"
                          >
                            <span>Studio</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

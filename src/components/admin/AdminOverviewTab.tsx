"use client";

import React from "react";
import Link from "next/link";
import {
  CreditCard,
  Eye,
  Users,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Heart,
  BarChart3,
  Award,
} from "lucide-react";

interface AdminOverviewTabProps {
  stats: {
    totalCards: number;
    publishedCards: number;
    draftCards: number;
    totalViews: number;
    totalRsvps: number;
    attendingRsvps: number;
    decliningRsvps: number;
    attendingRate: number;
    totalWishes: number;
    topViewedCards: any[];
    recentCards: any[];
  } | null;
  loading: boolean;
  onNavigateTab: (tabId: "overview" | "cards" | "rsvps" | "templates" | "settings") => void;
  onRefresh: () => void;
}

export default function AdminOverviewTab({
  stats,
  loading,
  onNavigateTab,
  onRefresh,
}: AdminOverviewTabProps) {
  if (loading && !stats) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-zen-primary/20 border-t-zen-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-500">Đang tổng hợp số liệu thời gian thực...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Tổng số thiệp cưới",
      value: stats?.totalCards ?? 0,
      sub: `${stats?.publishedCards ?? 0} đã xuất bản • ${stats?.draftCards ?? 0} bản nháp`,
      icon: CreditCard,
      color: "from-rose-500 to-pink-500",
      bgLight: "bg-rose-50 text-rose-600 border-rose-100",
      tab: "cards" as const,
    },
    {
      title: "Tổng lượt xem thiệp",
      value: (stats?.totalViews ?? 0).toLocaleString("vi-VN"),
      sub: "Lưu lượng truy cập tích lũy toàn sàn",
      icon: Eye,
      color: "from-blue-500 to-indigo-500",
      bgLight: "bg-blue-50 text-blue-600 border-blue-100",
      tab: "cards" as const,
    },
    {
      title: "Khách mời xác nhận (RSVP)",
      value: stats?.totalRsvps ?? 0,
      sub: `${stats?.attendingRsvps ?? 0} tham dự (${stats?.attendingRate ?? 0}%) • ${stats?.decliningRsvps ?? 0} vắng`,
      icon: Users,
      color: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50 text-emerald-600 border-emerald-100",
      tab: "rsvps" as const,
    },
    {
      title: "Sổ lưu bút & Lời chúc",
      value: stats?.totalWishes ?? 0,
      sub: "Thông điệp chúc phúc từ người thân",
      icon: MessageSquare,
      color: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50 text-amber-600 border-amber-100",
      tab: "rsvps" as const,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4 Thẻ KPI hàng đầu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(kpi.tab)}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.bgLight} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span>{kpi.sub}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-400 group-hover:text-zen-primary transition-colors">
                <span>Xem chi tiết danh sách</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tỷ lệ tham dự & Tình trạng vận hành */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ thanh tỷ lệ RSVP */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Tỷ lệ Tham Dự (RSVP)</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {stats?.attendingRate ?? 0}% Sẽ đến
              </span>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center text-center">
              <div className="relative w-36 h-36 flex items-center justify-center rounded-full bg-emerald-50 border-8 border-emerald-500/20 shadow-inner">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {stats?.attendingRate ?? 0}%
                  </span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Tỷ lệ đến</p>
                </div>
              </div>

              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Có tham dự
                  </span>
                  <span className="font-bold text-gray-900">
                    {stats?.attendingRsvps ?? 0} khách ({stats?.attendingRate ?? 0}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats?.attendingRate ?? 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-2 text-gray-600 font-medium">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Báo bận / Không đến
                  </span>
                  <span className="font-bold text-gray-900">
                    {stats?.decliningRsvps ?? 0} khách ({100 - (stats?.attendingRate ?? 0)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("rsvps")}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Quản lý danh sách khách mời</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top 5 thiệp cưới xem nhiều nhất */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">Top Thiệp Xem Nhiều Nhất</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("cards")}
                className="text-xs text-zen-primary font-bold hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả ({stats?.totalCards ?? 0})</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {stats?.topViewedCards && stats.topViewedCards.length > 0 ? (
                stats.topViewedCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-gray-50/60 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-zen-primary text-xs font-black flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/show/${card.slug}`}
                          target="_blank"
                          className="font-bold text-gray-900 text-xs hover:text-zen-primary transition-colors flex items-center gap-1.5 truncate"
                        >
                          <span className="truncate">{card.name}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                        </Link>
                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                          <span>📅 Ngày cưới: {card.weddingDate || "Chưa chọn"}</span>
                          <span>•</span>
                          <span className={card.status === "published" ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                            {card.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="text-right">
                        <div className="text-xs font-black text-gray-900 flex items-center gap-1 justify-end">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>{(card.views || 0).toLocaleString("vi-VN")}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">lượt xem</p>
                      </div>

                      <Link
                        href={`/design-template/${card.id}`}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-zen-primary hover:bg-rose-50 transition-colors"
                        title="Chỉnh sửa thiệp này"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  Chưa có thiệp cưới nào trên hệ thống
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Dữ liệu thống kê được cập nhật tự động theo thời gian thực</span>
            <button
              onClick={onRefresh}
              className="text-zen-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Làm mới số liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Thiệp Cưới Hoạt Động Gần Đây</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("cards")}
            className="text-xs text-zen-primary font-bold hover:underline flex items-center gap-1"
          >
            <span>Quản lý toàn bộ thiệp</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-500 uppercase tracking-wider text-[11px] font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Tên thiệp cưới</th>
                <th className="py-3 px-4">Đường dẫn (Slug)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Lượt xem</th>
                <th className="py-3 px-4">Cập nhật</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {stats?.recentCards && stats.recentCards.length > 0 ? (
                stats.recentCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {card.name}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      /show/{card.slug}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          card.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {card.status === "published" ? "🟢 Đã xuất bản" : "🟡 Bản nháp"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">
                      {card.views || 0}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">
                      {card.updatedAt || "Hôm nay"}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href={`/show/${card.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Xem</span>
                      </Link>
                      <Link
                        href={`/design-template/${card.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-zen-primary text-[11px] font-semibold transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Sửa</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    Chưa có dữ liệu thiệp cưới
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

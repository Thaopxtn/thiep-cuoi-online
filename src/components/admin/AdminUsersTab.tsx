"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  Calendar,
  CreditCard,
  Eye,
  Shield,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  UserCheck,
} from "lucide-react";
import { AdminUserStats } from "@/lib/serverDb";

interface AdminUsersTabProps {
  users: AdminUserStats[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AdminUsersTab({
  users,
  loading,
  onRefresh,
}: AdminUsersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserForCards, setSelectedUserForCards] = useState<AdminUserStats | null>(null);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const googleUsersCount = users.filter((u) => u.provider?.toLowerCase().includes("google")).length;
  const emailUsersCount = users.filter((u) => u.provider?.toLowerCase().includes("email")).length;
  const totalUserCards = users.reduce((acc, u) => acc + (u.cardsCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 4 Thẻ KPI người dùng */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Tổng tài khoản
          </span>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {users.length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Tài khoản Google
          </span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {googleUsersCount}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Tài khoản Email
          </span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {emailUsersCount}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Thiệp thuộc người dùng
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {totalUserCards}
          </p>
        </div>
      </div>

      {/* Thanh tìm kiếm & Làm mới */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên người dùng, email, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-zen-primary transition-colors bg-gray-50/50"
          />
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer self-end md:self-auto"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Bảng danh sách người dùng */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[11px] font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Tài khoản &amp; Họ tên</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Hình thức</th>
                <th className="py-3.5 px-4 text-center">Số thiệp tạo</th>
                <th className="py-3.5 px-4 text-center">Tổng lượt xem</th>
                <th className="py-3.5 px-4">Ngày đăng ký</th>
                <th className="py-3.5 px-4 text-right">Chi tiết thiệp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-rose-50/20 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">
                            ID: {u.id.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {u.email}
                    </td>

                    {/* Provider */}
                    <td className="py-3.5 px-4">
                      {u.provider?.includes("google") ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                          <span>Google</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-200">
                          <span>Email/Pass</span>
                        </span>
                      )}
                    </td>

                    {/* Cards Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-zen-primary">
                        {u.cardsCount || 0}
                      </span>
                    </td>

                    {/* Views */}
                    <td className="py-3.5 px-4 text-center font-bold text-gray-900">
                      {(u.totalViews || 0).toLocaleString("vi-VN")}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-400 text-[11px] whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "Gần đây"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {u.cardsCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedUserForCards(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-zen-primary text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem {u.cardsCount} thiệp</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Chưa tạo thiệp</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {loading ? "Đang tải danh sách tài khoản..." : "Không tìm thấy người dùng nào phù hợp"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT CÁC THIỆP CỦA TỪNG NGƯỜI DÙNG */}
      {selectedUserForCards && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserForCards.avatar}
                  alt={selectedUserForCards.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Thiệp cưới của {selectedUserForCards.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedUserForCards.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserForCards(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {selectedUserForCards.cards && selectedUserForCards.cards.length > 0 ? (
                selectedUserForCards.cards.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-3 hover:bg-rose-50/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">/{c.slug}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {c.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-blue-500" />
                          <span>{c.views || 0} lượt xem</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/show/${c.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </Link>
                      <Link
                        href={`/design-template/${c.id}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  Người dùng này chưa có thiệp cưới nào
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

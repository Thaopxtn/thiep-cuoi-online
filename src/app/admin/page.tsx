"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Layers,
  Settings,
  Lock,
  Unlock,
  LogOut,
  RefreshCw,
  Globe,
  ShieldCheck,
  Clock,
  Menu,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserCheck,
} from "lucide-react";

import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminCardsTab from "@/components/admin/AdminCardsTab";
import AdminRsvpTab from "@/components/admin/AdminRsvpTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminTemplatesTab from "@/components/admin/AdminTemplatesTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";

const ADMIN_SESSION_KEY = "zenlove_admin_auth_token";
const DEFAULT_PIN = "zenlove8888";

export default function AdminPage() {
  // Trạng thái xác thực Admin
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Tab đang hoạt động
  const [activeTab, setActiveTab] = useState<
    "overview" | "cards" | "rsvps" | "users" | "templates" | "settings"
  >("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dữ liệu toàn sàn
  const [statsData, setStatsData] = useState<any>(null);
  const [cardsData, setCardsData] = useState<any[]>([]);
  const [rsvpsData, setRsvpsData] = useState<any[]>([]);
  const [wishesData, setWishesData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Đồng hồ thời gian thực
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Cập nhật đồng hồ mỗi giây
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }) + ` • ${now.toLocaleTimeString("vi-VN")}`
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Kiểm tra phiên đăng nhập đã có trong localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem(ADMIN_SESSION_KEY);
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      setIsAuthenticated(false);
    }
  }, []);

  // Hàm tải toàn bộ dữ liệu quản trị
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, cardsRes, rsvpsRes, wishesRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/cards"),
        fetch("/api/admin/rsvps"),
        fetch("/api/admin/wishes"),
        fetch("/api/admin/users"),
      ]);

      const [statsJson, cardsJson, rsvpsJson, wishesJson, usersJson] = await Promise.all([
        statsRes.json(),
        cardsRes.json(),
        rsvpsRes.json(),
        wishesRes.json(),
        usersRes.json(),
      ]);

      if (statsJson.success) setStatsData(statsJson.stats);
      if (cardsJson.success) setCardsData(cardsJson.cards);
      if (rsvpsJson.success) setRsvpsData(rsvpsJson.rsvps);
      if (wishesJson.success) setWishesData(wishesJson.wishes);
      if (usersJson.success) setUsersData(usersJson.users);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu Admin:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  // Xử lý xác thực mã PIN
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setVerifyingPin(true);
    setPinError(null);

    try {
      const customPin = localStorage.getItem("zenlove_custom_admin_pin");
      const expectedPin = customPin || DEFAULT_PIN;

      // So khớp với API Server hoặc mã PIN tùy biến
      if (pinInput.trim() === expectedPin || pinInput.trim() === DEFAULT_PIN) {
        const fakeToken = "adm_" + Date.now().toString(36);
        localStorage.setItem(ADMIN_SESSION_KEY, fakeToken);
        setIsAuthenticated(true);
        setPinInput("");
      } else {
        // Thử gửi lên server kiểm tra
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode: pinInput.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem(ADMIN_SESSION_KEY, data.token || "adm_token");
          setIsAuthenticated(true);
          setPinInput("");
        } else {
          setPinError(data.message || "Mã PIN Quản trị viên không chính xác!");
        }
      }
    } catch (err: any) {
      setPinError("Lỗi kết nối máy chủ khi xác thực PIN");
    } finally {
      setVerifyingPin(false);
    }
  };

  // Khóa màn hình Admin
  const handleLogoutAdmin = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setPinInput("");
    setPinError(null);
  };

  // Hành động xóa thiệp cưới
  const handleDeleteCard = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn thiệp "${name}" khỏi cơ sở dữ liệu?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/cards?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCardsData((prev) => prev.filter((c) => c.id !== id));
        // Cập nhật lại stats
        fetchAllData();
      } else {
        alert(data.message || "Không thể xóa thiệp");
      }
    } catch (e) {
      alert("Lỗi khi xóa thiệp cưới");
    }
  };

  // Hành động chuyển đổi trạng thái (Draft <-> Published)
  const handleToggleStatus = async (id: string, currentStatus: "published" | "draft") => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    try {
      const res = await fetch("/api/admin/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCardsData((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
        );
        fetchAllData();
      } else {
        alert(data.message || "Không thể đổi trạng thái");
      }
    } catch (e) {
      alert("Lỗi kết nối khi cập nhật trạng thái");
    }
  };

  // Hành động xóa RSVP
  const handleDeleteRsvp = async (id: string, name: string) => {
    if (!confirm(`Xóa phản hồi tham dự của khách "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/rsvps?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRsvpsData((prev) => prev.filter((r) => r.id !== id));
        fetchAllData();
      }
    } catch (e) {
      alert("Lỗi khi xóa RSVP");
    }
  };

  // Hành động xóa Lời chúc
  const handleDeleteWish = async (id: string, name: string) => {
    if (!confirm(`Xóa lời chúc của "${name}" khỏi Sổ lưu bút?`)) return;
    try {
      const res = await fetch(`/api/admin/wishes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setWishesData((prev) => prev.filter((w) => w.id !== id));
        fetchAllData();
      }
    } catch (e) {
      alert("Lỗi khi xóa lời chúc");
    }
  };

  // ================= 1. GIAO DIỆN KHÓA BẢO MẬT (PIN LOCK SCREEN) =================
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-rose-50 via-white to-gray-50 px-4">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-gray-100 shadow-2xl relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-200/50 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

          <div className="relative text-center">
            {/* Logo & Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-zen-primary text-white flex items-center justify-center mx-auto shadow-lg mb-4">
              <Lock className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-50 text-zen-primary text-[11px] font-bold uppercase tracking-wider border border-rose-200">
              ZenLove Admin Portal
            </span>

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-3">
              Khu Vực Quản Trị Hệ Thống
            </h1>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Trang web được bảo vệ an toàn. Vui lòng nhập mã PIN Quản trị viên để mở khóa quyền quản trị toàn sàn.
            </p>

            {pinError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Nhập mã PIN bảo mật..."
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(null);
                  }}
                  className="w-full text-center text-lg tracking-widest font-mono py-3 px-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-zen-primary transition-all bg-gray-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={verifyingPin}
                className="w-full py-3 px-4 rounded-2xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {verifyingPin ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                <span>Mở Khóa Quản Trị</span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span className="text-[11px]">
                PIN mặc định: <strong className="text-gray-700 font-mono">zenlove8888</strong>
              </span>
              <Link
                href="/"
                className="text-zen-primary font-bold hover:underline flex items-center gap-1"
              >
                <span>Về trang chủ</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Đang tải kiểm tra session ban đầu
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf8]">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-zen-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ================= 2. GIAO DIỆN QUẢN TRỊ ADMIN PORTAL CHÍNH THỨC =================
  type TabId = "overview" | "cards" | "rsvps" | "users" | "templates" | "settings";

  interface NavTabItem {
    id: TabId;
    label: string;
    icon: any;
    badge?: number;
  }

  const navTabs: NavTabItem[] = [
    { id: "overview", label: "Tổng quan & Thống kê", icon: LayoutDashboard },
    {
      id: "cards",
      label: "Quản lý Thiệp cưới",
      icon: CreditCard,
      badge: cardsData.length,
    },
    {
      id: "rsvps",
      label: "Khách mời & Lời chúc",
      icon: Users,
      badge: rsvpsData.length,
    },
    {
      id: "users",
      label: "Quản lý Tài khoản",
      icon: UserCheck,
      badge: usersData.length,
    },
    { id: "templates", label: "Kho mẫu giao diện", icon: Layers },
    { id: "settings", label: "Cấu hình & Trạng thái", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#fbf9f8] text-zen-black">
      {/* ================= SIDEBAR TRÁI CỐ ĐỊNH ================= */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 p-5 shrink-0 justify-between">
        <div>
          {/* Logo & Header */}
          <div className="flex items-center gap-2.5 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-zen-primary text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-gray-900 leading-tight">
                ZenLove
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zen-primary bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Globe className="w-4 h-4 text-gray-400" />
            <span>Xem website chính</span>
          </Link>

          <button
            type="button"
            onClick={handleLogoutAdmin}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Khóa trang Admin</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE DRAWER SIDEBAR ================= */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full p-5 flex flex-col justify-between animate-slide-in">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-zen-primary text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">ZenLove Admin</h3>
                    <span className="text-[10px] text-zen-primary font-bold">Portal Quản Trị</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-5 space-y-1.5">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-rose-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link
                href="/"
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <Globe className="w-4 h-4 text-gray-400" />
                <span>Xem website chính</span>
              </Link>
              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                <Lock className="w-4 h-4" />
                <span>Khóa trang Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= KHU VỰC NỘI DUNG CHÍNH (RIGHT MAIN) ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR QUẢN TRỊ */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span>
                  {navTabs.find((t) => t.id === activeTab)?.label || "Quản trị hệ thống"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Trực tuyến</span>
                </span>
              </h1>
              <p className="text-[11px] text-gray-400 hidden sm:flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>{currentTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút Làm Mới Toàn Bộ */}
            <button
              type="button"
              onClick={fetchAllData}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Làm mới toàn bộ số liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            {/* Badge Quản trị viên */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-400 to-zen-primary text-white flex items-center justify-center text-xs font-bold shadow-xs">
                ZL
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-tight">Admin Master</p>
                <p className="text-[10px] text-gray-400">ZenLove System</p>
              </div>
            </div>
          </div>
        </header>

        {/* NỘI DUNG TỪNG TAB */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-20">
          {activeTab === "overview" && (
            <AdminOverviewTab
              stats={statsData}
              loading={loading}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "cards" && (
            <AdminCardsTab
              cards={cardsData}
              loading={loading}
              onRefresh={fetchAllData}
              onDeleteCard={handleDeleteCard}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {activeTab === "rsvps" && (
            <AdminRsvpTab
              rsvps={rsvpsData}
              wishes={wishesData}
              loading={loading}
              onRefresh={fetchAllData}
              onDeleteRsvp={handleDeleteRsvp}
              onDeleteWish={handleDeleteWish}
            />
          )}

          {activeTab === "users" && (
            <AdminUsersTab
              users={usersData}
              loading={loading}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "templates" && <AdminTemplatesTab />}

          {activeTab === "settings" && (
            <AdminSettingsTab onLogoutAdmin={handleLogoutAdmin} />
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Moon, Sun, ArrowRight, User, LogOut, FolderHeart, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isLoggedIn, openLoginModal, logout } = useAuth();

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const navLinks = [
    { name: "Trang chủ", href: "/", active: true },
    { name: "Mẫu thiệp", href: "/templates" },
    { name: "Thiệp đã tạo", href: "/thiep-online/khach-hang" },
    { name: "Đối tác & Ưu đãi", href: "/doi-tac-cuoi" },
    { name: "Gói dịch vụ", href: "#solution" },
    { name: "Cẩm nang", href: "#faq" },
    { name: "Liên hệ", href: "#footer" },
  ];

  return (
    <header
      className="fixed left-0 right-0 z-[999] px-2.5 sm:px-6 lg:px-8 top-0"
      role="banner"
      aria-label="Thanh điều hướng chính"
    >
      <div className="mx-auto transition-all duration-700 mt-2 max-w-7xl">
        <div className="flex justify-between items-center transition-all duration-300 h-14 rounded-full border bg-white/85 backdrop-blur-md border-[#e6ced4] shadow-[0_12px_35px_rgba(16,24,40,0.08)] px-4 md:px-6">
          {/* Desktop Nav */}
          <div className="hidden lg:flex w-full justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                aria-label="Zenlove - Thiệp cưới online miễn phí"
                title="Zenlove - Thiệp cưới online miễn phí"
                className="group relative flex items-center justify-center cursor-pointer gap-1.5"
              >
                <img
                  src="/assets/logo/logo-6.svg"
                  className="h-10"
                  alt="Zenlove - Thiệp cưới online miễn phí"
                  title="Zenlove - Tạo thiệp cưới online đẹp nhất"
                />
                <span className="h-5">
                  <img
                    src="/assets/logo/text-logo-dark.svg"
                    className="h-5 dark:hidden"
                    alt="Zenlove - Website thiệp cưới online miễn phí"
                    title="Zenlove - Thiệp cưới điện tử đẹp và hiện đại"
                  />
                  <img
                    src="/assets/logo/text-logo-light.svg"
                    className="hidden h-5 dark:block"
                    alt=""
                    aria-hidden="true"
                  />
                </span>
                <div className="absolute -top-1.5 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none">
                  <span className="text-xs text-gray-500 font-mono bg-white/80 px-1 py-0.5 rounded shadow-sm border border-gray-100">
                    v1.26.10a1
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation links */}
            <nav aria-label="Main navigation">
              <ul className="flex space-x-5 xl:space-x-8">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className={`whitespace-nowrap text-sm font-medium transition-all duration-200 hover:text-zen-primary hover:font-bold hover:scale-105 ${
                        link.active
                          ? "text-zen-primary font-bold scale-105"
                          : "text-zen-black"
                      }`}
                      title={link.name}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right actions */}
            <div className="flex flex-shrink-0 items-center space-x-2 xl:space-x-3">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
                title={isDark ? "Giao diện sáng" : "Giao diện tối"}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-zen-black transition-colors hover:bg-gray-100 hover:text-zen-primary"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Google Auth / User Avatar */}
              {isLoggedIn && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-zen-primary/40 transition-all"
                    aria-label="Tài khoản cá nhân"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-rose-200 shadow-xs"
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-zen-primary transition-colors"
                      >
                        <FolderHeart className="w-4 h-4 text-zen-primary" />
                        <span>Kho thiệp của tôi</span>
                      </Link>

                      <Link
                        href="/design-template/8c5055d8-30db-4b38-8831-e11063e3d352"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-zen-primary transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Chỉnh sửa mẫu Hồng Phong</span>
                      </Link>

                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-gray-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-zen-primary" />
                        <span>Trang Quản trị (Admin)</span>
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-zen-primary/60 bg-white text-xs font-semibold text-gray-700 shadow-2xs hover:shadow-xs transition-all hover:scale-105"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập</span>
                </button>
              )}

              <Link
                href="/templates"
                id="header-btn-create"
                className="bg-zen-primary hover:bg-[#d93849] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-[0_4px_14px_rgba(229,65,83,0.35)] transition-all duration-300 hover:scale-105 flex items-center gap-1.5"
              >
                <span>Tạo thiệp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Mobile Nav Bar */}
          <div className="lg:hidden flex w-full justify-between items-center">
            <Link
              href="/"
              aria-label="Zenlove - Thiệp cưới online miễn phí"
              title="Zenlove - Thiệp cưới online miễn phí"
              className="group relative flex items-center justify-center cursor-pointer gap-1.5"
            >
              <img
                src="/assets/logo/logo-6.svg"
                className="h-9"
                alt="Zenlove - Thiệp cưới online miễn phí"
              />
              <span className="h-4">
                <img
                  src="/assets/logo/text-logo-dark.svg"
                  className="h-4 dark:hidden"
                  alt="Zenlove"
                />
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label="Giao diện tối"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-zen-black transition-colors hover:bg-gray-100"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {isLoggedIn && user ? (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-0.5 rounded-full ring-1 ring-zen-primary/40"
                  aria-label="Tài khoản"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                </button>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="p-1 rounded-full text-gray-700 hover:text-zen-primary hover:bg-gray-100 transition-colors"
                  aria-label="Đăng nhập"
                  title="Đăng nhập"
                >
                  <User className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="focus:outline-none text-zen-black hover:text-zen-primary transition-colors flex justify-center items-center p-1.5 rounded-full hover:bg-gray-100"
                aria-label="Mở menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[99999] w-screen h-screen isolate">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside
            id="mobile-menu"
            className="fixed top-0 left-0 h-screen w-[85vw] max-w-80 bg-white shadow-2xl z-10 border-r border-gray-200 rounded-r-2xl overflow-hidden flex flex-col animate-slide-in"
            role="dialog"
            aria-modal="true"
            aria-label="Menu chính"
          >
            {/* Header */}
            <div className="flex items-center justify-between py-3.5 px-5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <img
                  src="/assets/logo/logo-6.svg"
                  className="h-8 w-auto"
                  alt="Zenlove"
                />
                <img
                  src="/assets/logo/text-logo-dark.svg"
                  className="h-4 w-auto object-contain"
                  alt="Zenlove"
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 bg-gray-100 rounded-full flex justify-center items-center transition-colors"
                aria-label="Đóng menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu items */}
            <nav className="flex-1 py-4 overflow-y-auto" aria-label="Menu chính (di động)">
              <ul className="space-y-1 px-4">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-zen-black hover:text-zen-primary hover:bg-rose-50/60 px-4 text-base font-semibold block w-full py-2.5 rounded-lg transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Action Button & Auth in Mobile Drawer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2.5">
              {isLoggedIn && user ? (
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-t border-gray-100"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zen-primary" />
                    <span>Trang Quản trị (Admin)</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center text-xs text-gray-500 font-semibold py-1.5 hover:bg-gray-50 rounded-lg transition-colors border-t border-gray-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLoginModal();
                  }}
                  className="w-full py-2.5 px-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-center gap-2 shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập với Google</span>
                </button>
              )}

              <Link
                href="/templates"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-zen-primary hover:bg-[#d93849] text-white py-3 rounded-full text-sm font-bold shadow-md transition-colors"
              >
                Tạo thiệp ngay
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

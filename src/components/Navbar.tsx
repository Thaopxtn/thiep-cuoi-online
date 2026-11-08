"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  User,
  LogOut,
  FolderHeart,
  Sparkles,
  ShieldCheck,
  Home,
  LayoutTemplate,
  Gift,
  HelpCircle,
  Mail,
  HeartHandshake,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Dialog from "@/components/ui/Dialog";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoggedIn, openLoginModal, logout } = useAuth();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    userMenuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setUserMenuOpen(false);
      userMenuTriggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 15);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (currentScrollY / totalHeight) * 100)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Trang chủ", href: "/", icon: Home },
    { name: "Mẫu thiệp", href: "/templates", icon: LayoutTemplate },
    { name: "Thiệp đã tạo", href: "/thiep-online/khach-hang", icon: FolderHeart },
    { name: "Đối tác & Ưu đãi", href: "/doi-tac-cuoi", icon: HeartHandshake },
    { name: "Bảng giá", href: "/#pricing", icon: Gift },
    { name: "Cẩm nang", href: "/#faq", icon: HelpCircle },
    { name: "Liên hệ", href: "/#footer", icon: Mail },
  ];

  return (
    <header
      className="fixed left-0 right-0 z-[999] px-3 sm:px-6 lg:px-8 top-0 transition-all duration-300"
      role="banner"
      aria-label="Thanh điều hướng chính"
    >
      {/* Scroll progress indicator */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-transparent overflow-hidden pointer-events-none z-[1000]">
        <div
          className="h-full bg-gradient-to-r from-zen-primary via-rose-500 to-pink-500 transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="mx-auto transition-all duration-300 mt-2.5 max-w-7xl">
        <div
          className={`flex justify-between items-center transition-all duration-300 h-14 rounded-full border px-4 md:px-6 ${
            scrolled
              ? "bg-white/95 backdrop-blur-md border-rose-100/90 shadow-[0_12px_36px_rgba(16,24,40,0.08)]"
              : "bg-white/88 backdrop-blur-md border-[#e6ced4]/80 shadow-[0_8px_24px_rgba(16,24,40,0.05)]"
          }`}
        >
          {/* Desktop Nav */}
          <div className="hidden xl:flex w-full justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                aria-label="Zenlove - Thiệp cưới online miễn phí"
                title="Zenlove - Thiệp cưới online miễn phí"
                className="group relative flex items-center justify-center cursor-pointer gap-2"
              >
                <div className="relative h-9 w-9">
                  <Image
                    src="/assets/logo/logo-6.svg"
                    alt="Zenlove logo"
                    fill
                    sizes="36px"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="relative h-5 w-24">
                  <Image
                    src="/assets/logo/text-logo-dark.svg"
                    alt="Zenlove"
                    fill
                    sizes="96px"
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Navigation links */}
            <nav aria-label="Điều hướng chính">
              <ul className="flex space-x-1 xl:space-x-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className={`relative inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zen-primary/30 ${
                          isActive
                            ? "bg-rose-50/90 font-bold text-zen-primary shadow-2xs"
                            : "text-gray-700 hover:text-zen-primary hover:bg-rose-50/50"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                        title={link.name}
                      >
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Right actions */}
            <div className="flex flex-shrink-0 items-center space-x-2 xl:space-x-3">
              {/* Google Auth / User Avatar */}
              {isLoggedIn && user ? (
                <div
                  ref={userMenuRef}
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setUserMenuOpen(false);
                  }}
                >
                  <button
                    ref={userMenuTriggerRef}
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex min-h-11 min-w-11 items-center justify-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-zen-primary/40 transition-all cursor-pointer"
                    aria-label="Tài khoản cá nhân"
                    aria-expanded={userMenuOpen}
                    aria-controls="account-navigation"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-rose-200 shadow-2xs"
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      id="account-navigation"
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/dashboard"
                        className="flex min-h-11 items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-zen-primary transition-colors"
                      >
                        <FolderHeart className="w-4 h-4 text-zen-primary" />
                        <span>Kho thiệp của tôi</span>
                      </Link>

                      <Link
                        href="/templates"
                        className="flex min-h-11 items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-zen-primary transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Tạo thiệp cưới mới</span>
                      </Link>

                      <Link
                        href="/admin"
                        className="flex min-h-11 items-center gap-2.5 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-gray-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-zen-primary" />
                        <span>Trang Quản trị (Admin)</span>
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full min-h-11 flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1 cursor-pointer"
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
                  onClick={() => openLoginModal()}
                  className="flex min-h-11 items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-zen-primary/50 bg-white text-xs font-semibold text-gray-700 shadow-2xs hover:shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
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
                className="bg-zen-primary hover:bg-zen-primary-hover text-white px-4 py-1.5 min-h-11 rounded-full text-xs sm:text-sm font-semibold shadow-[0_4px_14px_rgba(229,65,83,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(229,65,83,0.4)] flex items-center gap-1.5"
              >
                <span>Tạo thiệp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Mobile Nav Bar */}
          <div className="xl:hidden flex w-full justify-between items-center">
            <Link
              href="/"
              aria-label="Zenlove - Thiệp cưới online miễn phí"
              title="Zenlove - Thiệp cưới online miễn phí"
              className="group relative flex items-center justify-center cursor-pointer gap-2"
            >
              <div className="relative h-8 w-8">
                <Image
                  src="/assets/logo/logo-6.svg"
                  alt="Zenlove logo"
                  fill
                  sizes="32px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="relative h-4 w-20">
                <Image
                  src="/assets/logo/text-logo-dark.svg"
                  alt="Zenlove"
                  fill
                  sizes="80px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {isLoggedIn && user ? (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="min-h-11 min-w-11 flex items-center justify-center p-0.5 rounded-full ring-2 ring-zen-primary/40 cursor-pointer"
                  aria-label="Tài khoản"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-haspopup="dialog"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="min-h-11 min-w-11 flex items-center justify-center p-1.5 rounded-full text-gray-700 hover:text-zen-primary hover:bg-rose-50/60 transition-colors cursor-pointer"
                  aria-label="Đăng nhập"
                  title="Đăng nhập"
                >
                  <User className="h-5 w-5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="min-h-11 min-w-11 text-zen-black hover:text-zen-primary transition-colors flex justify-center items-center p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
                aria-label="Mở menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-haspopup="dialog"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <Dialog
          id="mobile-menu"
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          label="Menu chính"
          className="min-h-full"
        >
          <aside
            className="fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-80 bg-white shadow-2xl z-10 border-r border-gray-100 rounded-r-3xl overflow-hidden flex flex-col animate-slide-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between py-4 px-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8">
                  <Image
                    src="/assets/logo/logo-6.svg"
                    alt="Zenlove"
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </div>
                <div className="relative h-4 w-20">
                  <Image
                    src="/assets/logo/text-logo-dark.svg"
                    alt="Zenlove"
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-gray-700 w-11 h-11 bg-gray-100/80 rounded-full flex justify-center items-center transition-colors cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu items */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Menu chính (di động)">
              <ul className="space-y-1">
                {navLinks.map((link, idx) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <li key={link.name} style={{ animationDelay: `${idx * 40}ms` }}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
                            : "text-gray-700 hover:text-zen-primary hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                            isActive ? "bg-zen-primary text-white" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Action Button & Auth in Mobile Drawer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2.5">
              {isLoggedIn && user ? (
                <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-rose-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center gap-2 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border-t border-gray-100"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zen-primary" />
                    <span>Trang Quản trị (Admin)</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-11 text-center text-sm text-gray-600 font-semibold py-1.5 hover:bg-gray-50 rounded-xl transition-colors border-t border-gray-50 cursor-pointer"
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
                  className="w-full min-h-11 py-2.5 px-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
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
                  <span>Đăng nhập</span>
                </button>
              )}

              <Link
                href="/templates"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-zen-primary hover:bg-zen-primary-hover text-white py-3 rounded-full text-sm font-bold shadow-md transition-colors"
              >
                Tạo thiệp ngay
              </Link>
            </div>
          </aside>
        </Dialog>
      )}
    </header>
  );
}

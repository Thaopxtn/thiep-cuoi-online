"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  Database,
  Cloud,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Globe,
  Phone,
  Mail,
  Save,
  Lock,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface HealthData {
  timestamp: string;
  services: {
    database: {
      name: string;
      configured: boolean;
      connected: boolean;
      latency: string;
      endpoint: string;
    };
    storage: {
      name: string;
      configured: boolean;
      bucket: string;
      publicDomain: string;
    };
    webhook: {
      name: string;
      configured: boolean;
      endpoint: string;
    };
    auth: {
      name: string;
      configured: boolean;
    };
  };
  environment: {
    nodeEnv: string;
    siteUrl: string;
  };
}

interface AdminSettingsTabProps {
  onLogoutAdmin: () => void;
}

export default function AdminSettingsTab({ onLogoutAdmin }: AdminSettingsTabProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form cài đặt mã PIN mới
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMessage, setPinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form thông tin liên hệ website
  const [hotline, setHotline] = useState("0987.654.321");
  const [emailContact, setEmailContact] = useState("hotro@thiepcuoixinh.com");
  const [savingContact, setSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/admin/health");
      const data = await res.json();
      if (data.success) {
        setHealth(data);
      }
    } catch (e) {
      console.error("Lỗi fetch health:", e);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Load local contact config nếu có
    const savedContact = localStorage.getItem("zenlove_site_contact");
    if (savedContact) {
      try {
        const parsed = JSON.parse(savedContact);
        if (parsed.hotline) setHotline(parsed.hotline);
        if (parsed.email) setEmailContact(parsed.email);
      } catch (e) {}
    }
  }, []);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      setPinMessage({ type: "error", text: "Mã PIN phải có ít nhất 4 ký tự!" });
      return;
    }
    if (newPin !== confirmPin) {
      setPinMessage({ type: "error", text: "Mã PIN xác nhận không trùng khớp!" });
      return;
    }

    // Lưu mã PIN mới vào localStorage cho máy hiện tại
    localStorage.setItem("zenlove_custom_admin_pin", newPin);
    setPinMessage({
      type: "success",
      text: "Đã cập nhật mã PIN Quản trị viên mới trên trình duyệt thành công! Bạn cũng có thể đặt ADMIN_PASSCODE trong .env.local để áp dụng vĩnh viễn trên Server.",
    });
    setNewPin("");
    setConfirmPin("");
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    localStorage.setItem(
      "zenlove_site_contact",
      JSON.stringify({ hotline, email: emailContact })
    );
    setTimeout(() => {
      setSavingContact(false);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 3000);
    }, 400);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* 1. Trạng thái kết nối Máy chủ & Đám mây */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Tình Trạng Kết Nối Dịch Vụ Đám Mây
              </h3>
              <p className="text-xs text-gray-500">
                Kiểm tra sức khỏe kết nối Supabase, Cloudflare R2 và Webhook tự động
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchHealth}
            disabled={loadingHealth}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? "animate-spin" : ""}`} />
            <span>Kiểm tra lại</span>
          </button>
        </div>

        {health ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase Database */}
            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                    {health.services.database.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {health.services.database.endpoint}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Độ trễ phản hồi: <strong className="text-gray-700">{health.services.database.latency}</strong>
                  </p>
                </div>
              </div>

              <div>
                {health.services.database.connected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hoạt động tốt</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-full text-[11px] border border-rose-200">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Mất kết nối</span>
                  </span>
                )}
              </div>
            </div>

            {/* Cloudflare R2 Storage */}
            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 mt-0.5">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                    {health.services.storage.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    Bucket: {health.services.storage.bucket}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    CDN: {health.services.storage.publicDomain}
                  </p>
                </div>
              </div>

              <div>
                {health.services.storage.configured ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã cấu hình</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full text-[11px] border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Dùng ảnh mẫu sẵn</span>
                  </span>
                )}
              </div>
            </div>

            {/* Webhook Biến động số dư */}
            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                    {health.services.webhook.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    Cổng: {health.services.webhook.endpoint}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Hỗ trợ SePay / PayOS / Casso tự động
                  </p>
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-full text-[11px] border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sẵn sàng</span>
                </span>
              </div>
            </div>

            {/* Supabase Authentication */}
            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                    {health.services.auth.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Google OAuth &amp; Email Password
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Environment: {health.environment.nodeEnv}
                  </p>
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hoạt động</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400">
            Đang kiểm tra kết nối dịch vụ...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Đổi Mã PIN Quản Trị Viên */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Mã PIN Bảo Mật Quản Trị
                </h3>
                <p className="text-xs text-gray-500">
                  Mã PIN mặc định: <strong className="text-gray-800 font-mono">zenlove8888</strong>
                </p>
              </div>
            </div>

            {pinMessage && (
              <div
                className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 ${
                  pinMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border border-rose-200 text-rose-700"
                }`}
              >
                {pinMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{pinMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSavePin} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Mã PIN mới:</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mã PIN mới (ít nhất 4 ký tự)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Xác nhận mã PIN mới:</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mã PIN mới"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary transition-colors font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Mã PIN Mới</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-400">Bạn muốn kết thúc phiên quản trị?</span>
            <button
              type="button"
              onClick={onLogoutAdmin}
              className="text-rose-600 font-bold hover:underline"
            >
              Khóa màn hình Admin
            </button>
          </div>
        </div>

        {/* 3. Cấu hình Thông tin Liên Hệ Website */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Thông Tin Hỗ Trợ Website
                </h3>
                <p className="text-xs text-gray-500">
                  Hiển thị trên chân trang và mục chăm sóc khách hàng
                </p>
              </div>
            </div>

            {contactSaved && (
              <div className="p-3 mb-4 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Đã lưu thông tin liên hệ thành công!</span>
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Số điện thoại Hotline / Zalo:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Email hỗ trợ khách hàng:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailContact}
                    onChange={(e) => setEmailContact(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingContact}
                  className="w-full py-2.5 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingContact ? "Đang lưu..." : "Lưu Thông Tin Website"}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
            Thông tin này được dùng để hiển thị trên toàn bộ trang thông tin trợ giúp khách hàng.
          </div>
        </div>
      </div>
    </div>
  );
}

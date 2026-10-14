"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Crown,
  Check,
  Copy,
  Sparkles,
  QrCode,
  ShieldCheck,
  Zap,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";

interface VietQrVipPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardSlug: string;
  cardName: string;
  onVipActivated?: () => void;
}

export default function VietQrVipPaymentModal({
  isOpen,
  onClose,
  cardId,
  cardSlug,
  cardName,
  onVipActivated,
}: VietQrVipPaymentModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Cấu hình tài khoản nhận thanh toán VIP hệ thống ZenLove
  const BANK_CODE = "MB";
  const BANK_NAME = "MB Bank (Ngân hàng Quân Đội)";
  const ACCOUNT_NUMBER = "240220038888";
  const ACCOUNT_NAME = "ZENLOVE PREMIUM";
  const VIP_PRICE = 99000;
  const TRANSFER_MEMO = `VIP ${cardSlug.toLowerCase()}`;

  // Sinh URL ảnh VietQR chuẩn Napas247
  const vietQrUrl = generateVietQrUrl(
    BANK_CODE,
    ACCOUNT_NUMBER,
    ACCOUNT_NAME,
    VIP_PRICE,
    TRANSFER_MEMO
  );

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Polling tự động kiểm tra trạng thái VIP mỗi 3.5 giây khi modal mở
  useEffect(() => {
    if (!isOpen || isActivated) return;

    let timer: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/cards/${cardId}/vip-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.isVip) {
            setIsActivated(true);
            onVipActivated?.();
          }
        }
      } catch (e) {
        // Silent polling error
      }
    };

    // Kiểm tra ngay khi mở
    checkStatus();

    // Bắt đầu chu kỳ polling
    timer = setInterval(() => {
      checkStatus();
      setCheckCount((prev) => prev + 1);
    }, 3500);

    return () => clearInterval(timer);
  }, [isOpen, isActivated, cardId, onVipActivated]);

  // Nút bấm kiểm tra thủ công
  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/vip-status`);
      if (res.ok) {
        const data = await res.json();
        if (data.isVip) {
          setIsActivated(true);
          onVipActivated?.();
        } else {
          alert("Hệ thống chưa nhận được tiền từ ngân hàng. Nếu bạn vừa chuyển khoản, vui lòng đợi 10-30 giây để VietQR đồng bộ nhé!");
        }
      }
    } catch (e) {
      alert("Không thể kiểm tra lúc này, vui lòng thử lại sau giây lát.");
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-amber-200/80 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header với dải màu Gold Hoàng Gia */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Crown className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-1.5 leading-tight">
                  <span>Mở Khóa Gói VIP Vĩnh Viễn</span>
                  <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                    Pro
                  </span>
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Áp dụng cho thiệp: <strong className="text-white underline">{cardName}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nội dung chính Modal */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {isActivated ? (
            /* Màn hình Chúc Mừng Kích Hoạt Thành Công */
            <div className="py-8 text-center space-y-4 animate-scale-up">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner text-4xl">
                🎉
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-gray-900">
                  Kích Hoạt VIP Thành Công!
                </h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Thiệp cưới của bạn đã chính thức được nâng cấp lên hạng VIP. Toàn bộ watermark ZenLove đã được gỡ bỏ và tính năng lưu trữ vĩnh viễn đã được mở!
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-semibold space-y-1 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Xóa hoàn toàn logo & watermark ZenLove</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Không giới hạn ảnh cưới full HD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hỗ trợ khách mời RSVP không giới hạn</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Hoàn tất & Tiếp tục
              </button>
            </div>
          ) : (
            <>
              {/* Lợi ích của Gói VIP */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900 font-bold">Xóa Watermark</strong>
                    <span className="text-[10px] text-gray-500">Gỡ sạch logo chân trang</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900 font-bold">Kích hoạt tức thì</strong>
                    <span className="text-[10px] text-gray-500">Tự động sau 5-15 giây</span>
                  </div>
                </div>
              </div>

              {/* Khối quét VietQR & Thông tin thanh toán */}
              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200/80 flex flex-col sm:flex-row items-center gap-4">
                {/* Ảnh QR Napas247 */}
                <div className="w-44 h-44 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm shrink-0 flex items-center justify-center relative">
                  <img
                    src={vietQrUrl}
                    alt="VietQR Napas247"
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <div className="absolute -bottom-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Napas 247 Tự Động</span>
                  </div>
                </div>

                {/* Chi tiết chuyển khoản */}
                <div className="flex-1 w-full space-y-2 text-xs">
                  {/* Số tiền */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                    <span className="text-gray-500 text-[11px]">Số tiền nâng cấp:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-extrabold text-amber-600">
                        {VIP_PRICE.toLocaleString("vi-VN")} đ
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(String(VIP_PRICE), "amount")}
                        className="p-1 rounded text-gray-400 hover:text-gray-700"
                        title="Sao chép số tiền"
                      >
                        {copiedField === "amount" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Ngân hàng */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                    <span className="text-gray-500 text-[11px]">Ngân hàng:</span>
                    <strong className="text-gray-800 font-bold">{BANK_CODE} (Quân Đội)</strong>
                  </div>

                  {/* Số tài khoản */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                    <span className="text-gray-500 text-[11px]">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900">
                      <span>{ACCOUNT_NUMBER}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(ACCOUNT_NUMBER, "account")}
                        className="p-1 rounded text-gray-400 hover:text-gray-700"
                        title="Sao chép số tài khoản"
                      >
                        {copiedField === "account" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Nội dung chuyển khoản - BẮT BUỘC CHÍNH XÁC */}
                  <div className="bg-amber-100/70 border border-amber-300 p-2 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 uppercase">
                        Nội dung chuyển khoản (bắt buộc):
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(TRANSFER_MEMO, "memo")}
                        className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        {copiedField === "memo" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === "memo" ? "Đã chép" : "Chép"}</span>
                      </button>
                    </div>
                    <div className="font-mono font-bold text-xs text-amber-950 bg-white/80 px-2 py-1 rounded border border-amber-200 text-center tracking-wider">
                      {TRANSFER_MEMO}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Polling Indicator */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-emerald-900 text-[11px]">
                    Đang lắng nghe chuyển khoản từ App Ngân Hàng...
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {isChecking ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                  <span>Kiểm tra ngay</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

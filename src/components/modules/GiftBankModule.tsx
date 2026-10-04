"use client";

import React, { useState } from "react";
import { Copy, Check, Gift } from "lucide-react";

export interface GiftBankProps {
  title?: string;
  subtitle?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrImage?: string;
  theme?: "wedding" | "sky";
}

export default function GiftBankModule({
  title = "Hộp Mừng Quà / Mừng Cưới",
  subtitle = "Cảm ơn tấm lòng chân thành và sự chung vui của bạn!",
  bankName,
  accountNumber,
  accountHolder,
  qrImage,
  theme = "wedding",
}: GiftBankProps) {
  const [copied, setCopied] = useState(false);

  const isSky = theme === "sky";

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl =
    qrImage ||
    `https://api.vietqr.io/image/970422-${accountNumber}-compact2.png?amount=0&addInfo=Mung%20Cuoi&accountName=${encodeURIComponent(
      accountHolder
    )}`;

  return (
    <section className="py-6 px-4 max-w-md mx-auto">
      <div
        className={`rounded-3xl p-5 shadow-lg border text-center ${
          isSky
            ? "bg-white/95 border-sky-100"
            : "bg-white/95 border-stone-200"
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${
            isSky ? "bg-sky-50 text-sky-600" : "bg-rose-50 text-rose-500"
          }`}
        >
          🎁
        </div>

        <h3
          className={`font-serif font-bold text-lg ${
            isSky ? "text-[#1e6091]" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">{subtitle}</p>

        {/* QR Code */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-center mb-4 max-w-[220px] mx-auto">
          <img
            src={qrUrl}
            alt="Mã QR Chuyển khoản"
            className="w-44 h-44 object-contain rounded-lg shadow-xs"
          />
          <span className="text-[10px] text-gray-400 mt-1">
            Quét mã QR bằng App Ngân hàng
          </span>
        </div>

        {/* Bank Info */}
        <div className="bg-stone-50 rounded-2xl p-3.5 text-left space-y-1.5 text-xs text-gray-700 border border-stone-100">
          <div>
            <span className="text-gray-500">Ngân hàng:</span>{" "}
            <strong className="text-gray-900 font-semibold">{bankName}</strong>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-500">Số tài khoản:</span>{" "}
              <strong className="text-rose-600 font-mono text-sm">
                {accountNumber}
              </strong>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-semibold text-zen-primary hover:underline"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
          <div>
            <span className="text-gray-500">Chủ tài khoản:</span>{" "}
            <strong className="text-gray-900 uppercase font-semibold">
              {accountHolder}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

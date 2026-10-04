"use client";

import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";

export interface RedEnvelopeGiftCardProps {
  cardTitle?: string;
  avatarImage?: string;
  envelopeIllustration?: string;
  groomBank?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  brideBank?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  patternBackground?: string;
}

export default function RedEnvelopeGiftCardModule({
  cardTitle = "Gửi Mừng Cưới",
  avatarImage = "https://content.pancake.vn/1/s526x789/fwebp80/cc/e1/b5/09/bd4b4fbddc55863731312442a7c7589ae694033e899cfb77bd70e67e-w:1707-h:2560-l:500758-t:image/jpeg.jpg",
  envelopeIllustration = "https://content.pancake.vn/1/s489x489/fwebp80/68/00/1f/72/59dd385d3ef5958cb0fed576ba82ddd8bfa1c07818f908df341f3e36-w:2048-h:2048-l:777409-t:image/png.png",
  groomBank = {
    bankName: "BIDV",
    accountNumber: "1290457180",
    accountHolder: "NONG VAN SAM",
  },
  brideBank = {
    bankName: "AGRIBANK",
    accountNumber: "8502281029435",
    accountHolder: "MAI THI LAN",
  },
  patternBackground = "https://content.pancake.vn/web-media/5a/52/74/74/574a7c4763d40620ff28f78743b60b877bb2496e5c1cd8d94ca90f99-w:1313-h:2500-l:21034-t:image/png.png",
}: RedEnvelopeGiftCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"groom" | "bride">("groom");
  const [copied, setCopied] = useState(false);

  const currentBank = activeTab === "groom" ? groomBank : brideBank;
  const qrUrl = `https://api.vietqr.io/image/970418-${currentBank.accountNumber}-compact2.png?amount=0&addInfo=Mung%20Cuoi&accountName=${encodeURIComponent(
    currentBank.accountHolder
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentBank.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className="relative w-full py-8 px-5 overflow-hidden bg-[#FAF8F5] flex justify-center"
      style={{
        backgroundImage: `url(${patternBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Clickable Gift Card */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full max-w-sm bg-white rounded-2xl p-3 border-2 border-[#8C1007]/80 shadow-[0_6px_20px_rgba(0,0,0,0.1)] flex items-center justify-between text-left transition-all duration-300 hover:scale-[1.02] active:scale-98 cursor-pointer"
      >
        {/* Left Photo */}
        <div className="w-28 h-28 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
          <img
            src={avatarImage}
            alt="Dâu rể"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Info */}
        <div className="flex-1 pl-4 flex flex-col items-center justify-center text-center">
          <h4 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 tracking-wide">
            {cardTitle}
          </h4>
          <div className="w-16 h-16 mt-1 flex items-center justify-center">
            <img
              src={envelopeIllustration}
              alt="Phong bì"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </button>

      {/* Gift Bank Popup Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl relative text-center"
            style={{
              animation: "mc-popup-fade-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#8C1007]">
              Mừng Cưới Dâu Rể
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Cảm ơn tình cảm chân thành và lời chúc của bạn!
            </p>

            {/* Tab Chú Rể / Cô Dâu */}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("groom")}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "groom"
                    ? "bg-[#700000] text-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Nhà Trai (Chú Rể)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bride")}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "bride"
                    ? "bg-[#700000] text-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Nhà Gái (Cô Dâu)
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center mb-4">
              <img
                src={qrUrl}
                alt="QR Ngân hàng"
                className="w-48 h-48 object-contain rounded-lg shadow-sm"
                style={{
                  animation: "mc-qr-fade-in 0.4s ease-out forwards",
                }}
              />
              <span className="text-[11px] text-gray-400 mt-1">
                Quét mã QR bằng App Ngân hàng
              </span>
            </div>

            {/* Bank details */}
            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 text-left space-y-1 text-xs text-gray-700 mb-4">
              <div>
                <span className="text-gray-500">Ngân hàng:</span>{" "}
                <strong className="text-gray-900 font-bold">
                  {currentBank.bankName}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-500">Số tài khoản:</span>{" "}
                  <strong className="text-[#8C1007] font-mono text-sm font-bold">
                    {currentBank.accountNumber}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#8C1007] hover:underline"
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
                <strong className="text-gray-900 font-semibold uppercase">
                  {currentBank.accountHolder}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

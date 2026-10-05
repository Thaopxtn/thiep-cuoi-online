"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Gift, ExternalLink, Copy, Check, Sparkles, Star, Tag, ChevronRight } from "lucide-react";
import { WEDDING_PARTNERS, WeddingPartner } from "@/data/weddingPartners";

export default function WeddingPerksWidget() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Chọn 4 đối tác tiêu biểu để hiển thị trong widget Dashboard
  const featuredPartners = WEDDING_PARTNERS.slice(0, 4);

  return (
    <div className="bg-gradient-to-br from-amber-50/60 via-rose-50/40 to-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-xs mb-8 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-zen-primary text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ĐẶC QUYỀN DÀNH CHO CẶP ĐÔI ZENLOVE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Ưu Đãi Dịch Vụ Cưới Độc Quyền
          </h2>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Tiết kiệm đến hàng chục triệu đồng chi phí tổ chức đám cưới với voucher độc quyền từ các đối tác hàng đầu (Nhẫn cưới, Studio, Váy cưới, Sảnh tiệc).
          </p>
        </div>

        <Link
          href="/doi-tac-cuoi"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zen-primary hover:text-red-700 px-4 py-2 rounded-xl bg-white border border-rose-200 hover:border-zen-primary shadow-2xs transition-all shrink-0 hover:scale-105"
        >
          <span>Xem tất cả ưu đãi</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid Partner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {featuredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white rounded-2xl border border-rose-100/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-1"
          >
            <div>
              {/* Image & Badge */}
              <div className="relative h-28 rounded-xl overflow-hidden mb-3 bg-gray-100">
                <img
                  src={partner.coverUrl}
                  alt={partner.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white">
                  {partner.categoryName}
                </span>
                <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-md text-[10px] font-bold text-amber-700">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{partner.rating}</span>
                </div>
              </div>

              {/* Partner Name */}
              <h3 className="font-bold text-xs text-gray-900 line-clamp-1 group-hover:text-zen-primary transition-colors">
                {partner.name}
              </h3>

              {/* Discount Offer */}
              <div className="mt-1.5 mb-3 flex items-start gap-1 text-zen-primary">
                <Tag className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="text-[11px] font-bold leading-tight">
                  {partner.discount}
                </span>
              </div>
            </div>

            {/* Actions: Coupon copy & External Link */}
            <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleCopyCode(partner.couponCode)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-zen-primary text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title={`Sao chép mã ${partner.couponCode}`}
              >
                {copiedCode === partner.couponCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="font-mono">{partner.couponCode}</span>
                  </>
                )}
              </button>

              <a
                href={partner.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800 transition-colors"
                title="Đến trang đối tác nhận ưu đãi"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

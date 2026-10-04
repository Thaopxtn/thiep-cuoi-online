"use client";

import React, { useState } from "react";
import { Sparkles, X, Heart, Check, ArrowRight } from "lucide-react";
import { ZenLoveTemplate } from "@/data/zenloveTemplates";

interface SmartSuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ZenLoveTemplate[];
  onSelectTemplate: (template: ZenLoveTemplate) => void;
}

export default function SmartSuggestModal({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
}: SmartSuggestModalProps) {
  const [occasion, setOccasion] = useState<string>("wedding");
  const [style, setStyle] = useState<string>("modern");
  const [type, setType] = useState<string>("all");
  const [suggested, setSuggested] = useState<ZenLoveTemplate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleFind = () => {
    let pool = templates;
    if (occasion === "wedding") {
      pool = pool.filter((t) => t.categorySlug === "thiep-cuoi");
    } else if (occasion === "graduation") {
      pool = pool.filter((t) => t.categorySlug === "thiep-tot-nghiep");
    } else if (occasion === "birthday") {
      pool = pool.filter((t) => t.categorySlug === "thiep-sinh-nhat");
    }

    if (type === "form") {
      pool = pool.filter((t) => t.targetPageType === "FORM");
    } else if (type === "canvas") {
      pool = pool.filter((t) => t.targetPageType === "CANVAS");
    }

    // Sort by popularity and select top 6
    const top = [...pool].sort((a, b) => b.likeCount + b.viewCount - (a.likeCount + a.viewCount)).slice(0, 6);
    setSuggested(top);
    setHasSearched(true);
  };

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 p-5 sm:p-7 relative transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-2.5">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
            Gợi ý mẫu thiệp phù hợp
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Chọn một vài sở thích để ZenLove gợi ý mẫu thiết kế hoàn hảo nhất cho bạn
          </p>
        </div>

        {!hasSearched ? (
          <div className="space-y-4">
            {/* Step 1: Dịp tổ chức */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                1. Dịp sự kiện của bạn:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "wedding", label: "Thiệp Cưới", icon: "💍" },
                  { id: "graduation", label: "Tốt Nghiệp", icon: "🎓" },
                  { id: "birthday", label: "Sinh Nhật", icon: "🎂" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOccasion(item.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      occasion === item.id
                        ? "border-zen-primary bg-rose-50 text-zen-primary shadow-xs"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Phong cách */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                2. Phong cách mong muốn:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "modern", label: "Hiện đại & Tinh tế" },
                  { id: "classic", label: "Truyền thống sang trọng" },
                  { id: "romantic", label: "Lãng mạn & Ngọt ngào" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStyle(item.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                      style === item.id
                        ? "border-zen-primary bg-rose-50 text-zen-primary font-semibold shadow-xs"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Loại thiệp */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                3. Định dạng mong muốn:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "all", label: "Tất cả kiểu" },
                  { id: "canvas", label: "Tự do kéo thả" },
                  { id: "form", label: "Biểu mẫu nhanh" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                      type === item.id
                        ? "border-zen-primary bg-rose-50 text-zen-primary font-semibold shadow-xs"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search button */}
            <button
              type="button"
              onClick={handleFind}
              className="w-full mt-4 py-3 rounded-full bg-zen-primary hover:bg-[#d93849] text-white font-bold text-sm shadow-md shadow-zen-primary/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tìm kiếm mẫu phù hợp nhất</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700">
                Tìm thấy {suggested.length} mẫu gợi ý hoàn hảo:
              </span>
              <button
                onClick={() => setHasSearched(false)}
                className="text-xs text-zen-primary hover:underline font-medium"
              >
                Chọn lại tiêu chí
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {suggested.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    onSelectTemplate(tpl);
                    onClose();
                  }}
                  className="group cursor-pointer rounded-xl border border-gray-100 hover:border-zen-primary p-2 transition-all hover:shadow-md bg-white text-center"
                >
                  <div className="relative aspect-[1000/1470] overflow-hidden rounded-lg bg-gray-50 mb-2">
                    <img
                      src={tpl.imageUrl}
                      alt={tpl.name}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-zen-primary">
                    {tpl.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {tpl.likeCount} yêu thích
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

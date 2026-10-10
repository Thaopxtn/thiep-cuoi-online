"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Eye,
  Plus,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Tag,
  Flame,
  Crown,
  Heart,
} from "lucide-react";
import { ZENLOVE_TEMPLATES, ZENLOVE_CATEGORIES, ZenLoveTemplate } from "@/data/zenloveTemplates";

export default function AdminTemplatesTab() {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Lọc mẫu thiệp
  const filteredTemplates = useMemo(() => {
    return ZENLOVE_TEMPLATES.filter((tpl) => {
      const matchCat =
        selectedCat === "all"
          ? true
          : tpl.categoryId === selectedCat ||
            tpl.categorySlug === selectedCat ||
            (tpl as any).idCat === selectedCat;

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.slug.toLowerCase().includes(q) ||
        (tpl.description && tpl.description.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [selectedCat, searchTerm]);

  const copyLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/templates/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Thống kê nhanh kho mẫu */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Tổng số mẫu thiết kế
          </span>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {ZENLOVE_TEMPLATES.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Danh mục chủ đề
          </span>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {ZENLOVE_CATEGORIES.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Mẫu Miễn Phí (Free)
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {ZENLOVE_TEMPLATES.filter((t) => t.templateType === "free").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Mẫu Cao Cấp (VIP)
          </span>
          <p className="text-2xl font-black text-amber-500 mt-1">
            {ZENLOVE_TEMPLATES.filter((t) => t.templateType !== "free").length}
          </p>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc danh mục */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên mẫu thiết kế, mã slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-zen-primary transition-colors bg-gray-50/50"
            />
          </div>

          <Link
            href="/templates"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-zen-primary text-white text-xs font-bold shadow-md hover:bg-[#d93849] transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem Kho Mẫu Ngoài Website</span>
          </Link>
        </div>

        {/* Danh mục cuộn ngang */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCat("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCat === "all"
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tất cả ({ZENLOVE_TEMPLATES.length})
          </button>
          {ZENLOVE_CATEGORIES.map((cat) => {
            const count = ZENLOVE_TEMPLATES.filter(
              (t) =>
                t.categoryId === cat.id ||
                t.categorySlug === cat.idCat ||
                (t as any).idCat === cat.idCat
            ).length;
            const isSelected = selectedCat === cat.id || selectedCat === cat.idCat;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.idCat || cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid danh sách mẫu thiệp */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredTemplates.map((template) => {
          const isVip = template.templateType !== "free";
          return (
            <div
              key={template.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Ảnh thumbnail */}
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Badge */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isVip ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" />
                        <span>VIP</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        Free
                      </span>
                    )}
                  </div>

                  {/* Lớp phủ hành động nhanh khi hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <Link
                      href={`/templates/${template.slug}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-white text-gray-900 hover:text-zen-primary shadow-md transition-colors"
                      title="Xem trước mẫu chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/design-template/${template.id}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-zen-primary text-white hover:bg-[#d93849] shadow-md transition-colors"
                      title="Chỉnh sửa mẫu trong Canvas Editor"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Thông tin mẫu */}
                <div className="p-3">
                  <h4 className="font-bold text-gray-900 text-xs truncate" title={template.name}>
                    {template.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                    /{template.slug}
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 truncate max-w-full">
                    {template.categoryName || "Thiệp cưới"}
                  </span>
                </div>
              </div>

              {/* Thao tác chân thẻ */}
              <div className="p-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => copyLink(template.slug)}
                  className="p-1 rounded text-gray-400 hover:text-zen-primary transition-colors cursor-pointer"
                  title="Sao chép đường dẫn xem mẫu"
                >
                  {copiedSlug === template.slug ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <Link
                  href={`/design-template/${template.id}`}
                  target="_blank"
                  className="text-[11px] font-bold text-zen-primary hover:underline flex items-center gap-1"
                >
                  <span>Mở Editor</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
        Hiển thị {filteredTemplates.length} trên tổng số {ZENLOVE_TEMPLATES.length} mẫu thiệp cưới toàn hệ thống
      </div>
    </div>
  );
}

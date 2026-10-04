"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Eye,
  Share2,
  Copy,
  Check,
  Sparkles,
  SlidersHorizontal,
  Download,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Layers,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import ModuleRenderer from "@/components/modules/ModuleRenderer";
import TemplateCard from "@/components/templates/TemplateCard";
import ExportTemplateModal from "@/components/templates/ExportTemplateModal";
import TemplatePreviewModal from "@/components/templates/TemplatePreviewModal";
import {
  TemplateItem,
  TEMPLATES_DATA,
  generateDefaultModules,
} from "@/data/templates";
import {
  duplicateTemplate,
  getStoredTemplateById,
  hydrateStorage,
} from "@/lib/templateStorage";
import { isFavorite, toggleFavorite, FAVORITES_EVENT_CHANGE } from "@/lib/storage/favorites";

interface TemplateDetailClientProps {
  initialTemplate?: TemplateItem;
  slug: string;
}

export default function TemplateDetailClient({
  initialTemplate,
  slug,
}: TemplateDetailClientProps) {
  const router = useRouter();

  const [template, setTemplate] = useState<TemplateItem | null>(
    initialTemplate || null
  );
  const [deviceView, setDeviceView] = useState<"mobile" | "tablet">("mobile");
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [previewRelated, setPreviewRelated] = useState<TemplateItem | null>(null);
  const [allTemplates, setAllTemplates] = useState<TemplateItem[]>(TEMPLATES_DATA);

  // Hydrate storage and find template if initialTemplate not found (e.g. custom template)
  useEffect(() => {
    hydrateStorage().then(() => {
      const found = getStoredTemplateById(slug);
      if (found) {
        setTemplate(found);
      }
      // Read all templates for related recommendations
      const { getAllTemplates } = require("@/lib/templateStorage");
      setAllTemplates(getAllTemplates());
    });
  }, [slug]);

  // Sync favorite state
  useEffect(() => {
    if (template) {
      setIsLiked(isFavorite(template.id));

      const handleFavChange = () => {
        setIsLiked(isFavorite(template.id));
      };

      window.addEventListener(FAVORITES_EVENT_CHANGE, handleFavChange);
      return () => window.removeEventListener(FAVORITES_EVENT_CHANGE, handleFavChange);
    }
  }, [template]);

  const handleToggleLike = () => {
    if (!template) return;
    const next = toggleFavorite(template.id);
    setIsLiked(next);
  };

  const handleCopyShareLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleDuplicateToWarehouse = () => {
    if (!template) return;
    const cloned = duplicateTemplate(template);
    alert(`Đã nhân bản mẫu "${template.title}" vào kho của bạn! 🎉`);
    router.push(`/kho-template`);
  };

  // Related templates recommendation algorithm
  const relatedTemplates = useMemo(() => {
    if (!template) return [];

    return allTemplates
      .filter((t) => t.id !== template.id)
      .map((t) => {
        let score = 0;
        if (t.category === template.category) score += 3;
        if (t.meta?.colorFamily === template.meta?.colorFamily) score += 1;

        const currentStyles = template.meta?.styleTags || [];
        const candidateStyles = t.meta?.styleTags || [];
        const commonStyles = currentStyles.filter((s) => candidateStyles.includes(s));
        score += commonStyles.length * 2;

        return { template: t, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.template);
  }, [template, allTemplates]);

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fffbfa] text-zen-black">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-32 pb-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">
            Không tìm thấy mẫu thiệp này
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Mẫu thiệp có thể đã bị xóa hoặc đường dẫn không chính xác. Bạn có thể
            quay lại thư viện để khám phá thêm nhiều mẫu khác.
          </p>
          <div className="mt-6">
            <Link
              href="/templates"
              className="px-6 py-2.5 rounded-full bg-zen-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-red-600 transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Thư Viện Mẫu</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const modules = generateDefaultModules(template);
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://zenlove.me";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `${currentOrigin}/design-template/${template.id}`
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#fffbfa] text-zen-black">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs text-gray-500 mb-6"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-zen-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link href="/templates" className="hover:text-zen-primary transition-colors">
            Mẫu thiệp
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-800 truncate">
            {template.title}
          </span>
        </nav>

        {/* Detail Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Interactive Mockup (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Device Switcher Bar */}
            <div className="mb-4 flex items-center gap-2 p-1 bg-stone-100 rounded-2xl text-xs font-semibold text-gray-600">
              <button
                type="button"
                onClick={() => setDeviceView("mobile")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  deviceView === "mobile"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "hover:text-gray-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Di động (Mobile)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView("tablet")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  deviceView === "tablet"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "hover:text-gray-900"
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Máy tính bảng (Tablet)</span>
              </button>
            </div>

            {/* Phone Container */}
            <div
              className={`relative bg-black rounded-[44px] p-3 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border-[5px] border-gray-800 flex flex-col overflow-hidden transition-all duration-300 ${
                deviceView === "mobile"
                  ? "w-full max-w-[360px] h-[640px] sm:h-[680px]"
                  : "w-full max-w-[460px] h-[640px] sm:h-[680px]"
              }`}
            >
              {/* Phone Camera Notch */}
              <div className="absolute top-4 inset-x-0 z-30 flex justify-center pointer-events-none">
                <div className="w-24 h-4 bg-black rounded-full" />
              </div>

              {/* Heart favorite on screen top-left */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`absolute top-6 left-6 z-40 w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-115 active:scale-95 ${
                  isLiked ? "bg-rose-500 text-white" : "bg-white/90 text-rose-500"
                }`}
                title={isLiked ? "Đã yêu thích" : "Yêu thích mẫu"}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
              </button>

              {/* Live Interactive Screen */}
              <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-white">
                <ModuleRenderer
                  modules={modules}
                  bankInfo={template.defaultData.bankInfo}
                  musicUrl={template.defaultData.musicUrl}
                  musicTitle={template.defaultData.musicTitle}
                  initialWishes={template.defaultData.initialWishes}
                  interactive={true}
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-3 text-center">
              💡 Bạn có thể cuộn và tương tác trực tiếp trên màn hình điện thoại
            </p>
          </div>

          {/* Right Column: Template Info & Actions (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
            {/* Badges & Meta Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-zen-primary text-white">
                  {template.categoryName}
                </span>

                {template.tag && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    {template.tag}
                  </span>
                )}

                {template.meta?.author && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                    Bởi {template.meta.author}
                  </span>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 ml-auto">
                  <span className="flex items-center gap-1 text-rose-500 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>{template.likes}</span>
                  </span>
                  <span className="flex items-center gap-1 text-blue-500 font-semibold">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{template.views}</span>
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif leading-tight">
                {template.title}
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {template.description}
              </p>
            </div>

            {/* Color Palette Display */}
            {template.meta?.palette && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Bảng màu chủ đạo ({template.meta.colorFamily})
                  </span>
                  {copiedColor && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Đã sao chép {copiedColor}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(template.meta.palette).map(([role, hex]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleCopyColor(hex)}
                      className="group/palette flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-200 hover:border-zen-primary shadow-2xs transition-all text-left"
                    >
                      <span
                        className="w-7 h-7 rounded-lg border border-black/10 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <div className="min-w-0">
                        <span className="text-[9px] text-gray-400 block uppercase">
                          {role}
                        </span>
                        <span className="text-xs font-mono font-semibold text-gray-800 group-hover/palette:text-zen-primary">
                          {hex}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900 block font-semibold">
                    Xem trước thực tế
                  </strong>
                  Hiển thị hoàn hảo 100% trên mọi dòng điện thoại thông minh.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900 block font-semibold">
                    Đầy đủ tính năng
                  </strong>
                  Bản đồ Google Maps, form RSVP, mã VietQR mừng cưới & sổ lời chúc.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900 block font-semibold">
                    Chia sẻ nhanh
                  </strong>
                  Một đường link duy nhất gửi qua Zalo, Messenger, SMS.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900 block font-semibold">
                    Tùy biến không giới hạn
                  </strong>
                  Thêm bớt module, đổi bố cục và thay nhạc nền trong Studio.
                </div>
              </div>
            </div>

            {/* Included Modules Structure */}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zen-primary" />
                <span>Cấu trúc module có trong mẫu ({modules.length} khối)</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {modules.map((m, idx) => (
                  <span
                    key={m.id || idx}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200/60"
                  >
                    {idx + 1}. {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/design-template/${template.id}`}
                  className="flex-1 py-3 px-6 rounded-full bg-zen-primary hover:bg-red-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-zen-primary/30 transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Sử dụng & Thiết kế ngay</span>
                </Link>

                <Link
                  href={`/template-builder?id=${template.id}`}
                  className="py-3 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                  title="Mở trong Studio tạo mẫu để kéo thả module"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Tùy biến Studio</span>
                </Link>

                <button
                  type="button"
                  onClick={handleDuplicateToWarehouse}
                  className="py-3 px-4 rounded-full bg-stone-100 hover:bg-stone-200 text-gray-800 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
                  title="Nhân bản mẫu này vào kho của bạn"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                  <span className="hidden sm:inline">Nhân bản</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExportOpen(true)}
                  className="py-3 px-4 rounded-full bg-stone-100 hover:bg-stone-200 text-gray-800 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
                  title="Xuất file JSON"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span className="hidden sm:inline">Xuất JSON</span>
                </button>
              </div>

              {/* Share Bar */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-600 font-medium truncate">
                  <Share2 className="w-4 h-4 text-zen-primary shrink-0" />
                  <span className="truncate">Chia sẻ mẫu này cho bạn bè</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 border border-gray-200 text-gray-700 font-semibold transition-colors flex items-center gap-1"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Đã chép link</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Templates Section */}
        {relatedTemplates.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200/80">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
                  Mẫu thiệp tương tự bạn có thể thích
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Được đề xuất dựa trên cùng phong cách và danh mục {template.categoryName}
                </p>
              </div>
              <Link
                href="/templates"
                className="text-xs sm:text-sm font-semibold text-zen-primary hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {relatedTemplates.map((rel) => (
                <TemplateCard
                  key={rel.id}
                  template={rel}
                  onPreview={(tpl) => setPreviewRelated(tpl)}
                  onUse={(id) => router.push(`/design-template/${id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Export Modal */}
      <ExportTemplateModal
        template={template}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Related Preview Modal */}
      <TemplatePreviewModal
        template={previewRelated}
        onClose={() => setPreviewRelated(null)}
        onUse={(id) => router.push(`/design-template/${id}`)}
      />

      <Footer />
      <FloatingSupport />
    </div>
  );
}

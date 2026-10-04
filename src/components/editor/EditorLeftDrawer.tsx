"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  ChevronLeft,
  Folder,
  Image as ImageIcon,
  Plus,
  Music,
  MapPin,
  Calendar,
  Gift,
  Heart,
  Sparkles,
  FileText,
  Search,
  Check,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { EditorToolTab } from "./EditorLeftRail";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "@/data/zenloveTemplates";
import { compressImageToWebP, formatBytes } from "@/lib/imageCompression";

interface EditorLeftDrawerProps {
  activeTab: EditorToolTab;
  isOpen: boolean;
  onClose: () => void;
  onAddImage: (url: string) => void;
  onAddText: (text: string, type: "heading" | "subheading" | "body") => void;
  onChangeMusic: (title: string, url: string) => void;
  onSelectTemplate: (template: ZenLoveTemplate) => void;
  onToggleEffect?: (effectName: string) => void;
  activeEffects?: string[];
}

export default function EditorLeftDrawer({
  activeTab,
  isOpen,
  onClose,
  onAddImage,
  onAddText,
  onChangeMusic,
  onSelectTemplate,
  onToggleEffect,
  activeEffects = [],
}: EditorLeftDrawerProps) {
  const [imageSubTab, setImageSubTab] = useState<"all" | "folders">("all");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [lastCompressionInfo, setLastCompressionInfo] = useState<string | null>(null);
  const [searchTemplate, setSearchTemplate] = useState("");
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      const newUrls: string[] = [];
      let totalOriginal = 0;
      let totalCompressed = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // BÍ QUYẾT KỸ THUẬT: Tự động nén WebP trên trình duyệt (giảm 90-95% dung lượng, 0đ chi phí máy chủ)
          const result = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
          totalOriginal += result.originalSize;
          totalCompressed += result.compressedSize;

          // Gửi lên API upload (hỗ trợ Cloudflare R2 / Supabase / Local)
          const formData = new FormData();
          formData.append("file", result.file);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const json = await res.json();
            if (json.url) newUrls.push(json.url);
          } else {
            newUrls.push(result.dataUrl);
          }
        } catch (err) {
          const url = URL.createObjectURL(file);
          newUrls.push(url);
        }
      }

      const savings =
        totalOriginal > 0
          ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
          : 0;
      setLastCompressionInfo(
        `Nén WebP: ${formatBytes(totalOriginal)} ➔ ${formatBytes(totalCompressed)} (-${savings}%)`
      );
      setTimeout(() => setLastCompressionInfo(null), 6000);

      setUploadedImages((prev) => [...prev, ...newUrls]);
      setIsCompressing(false);
    }
  };

  const weddingSongs = [
    {
      id: "s-1",
      title: "Beautiful In White - Shane Filan",
      url: "https://res.cloudinary.com/dsi9iqgmw/video/upload/v1711234567/romantic-wedding.mp3",
    },
    {
      id: "s-2",
      title: "A Thousand Years - Christina Perri",
      url: "https://res.cloudinary.com/dsi9iqgmw/video/upload/v1711234567/romantic-wedding.mp3",
    },
    {
      id: "s-3",
      title: "Until I Found You - Stephen Sanchez",
      url: "https://res.cloudinary.com/dsi9iqgmw/video/upload/v1711234567/romantic-wedding.mp3",
    },
    {
      id: "s-4",
      title: "Hạnh Phúc Cuối Cùng - Trương Việt Thái",
      url: "https://res.cloudinary.com/dsi9iqgmw/video/upload/v1711234567/romantic-wedding.mp3",
    },
  ];

  return (
    <aside className="w-[300px] sm:w-[320px] bg-white border-r border-gray-200 h-full flex flex-col z-30 select-none shrink-0 shadow-sm relative animate-slide-in">
      {/* Collapse Drawer button on right edge */}
      <button
        type="button"
        onClick={onClose}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-gray-900 flex items-center justify-center z-40 transition-transform hover:scale-110"
        title="Thu gọn bảng công cụ"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900 capitalize">
          {activeTab === "image" && "Hình ảnh"}
          {activeTab === "text" && "Văn bản"}
          {activeTab === "background" && "Nền thiệp"}
          {activeTab === "stock" && "Kho ảnh & Sticker"}
          {activeTab === "tools" && "Công cụ thiết kế"}
          {activeTab === "music" && "Nhạc nền đám cưới"}
          {activeTab === "widgets" && "Tiện ích tương tác"}
          {activeTab === "templates" && "Đổi mẫu thiệp"}
          {activeTab === "effects" && "Hiệu ứng chuyển động"}
          {activeTab === "presets" && "Bộ phối màu & Font"}
          {activeTab === "support" && "Hỗ trợ khách hàng"}
        </h3>
        <span className="text-[11px] text-gray-400">ZenLove Studio</span>
      </div>

      {/* Drawer Body corresponding to activeTab */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= 1. TAB: HÌNH ẢNH (Matches screenshot!) ================= */}
        {activeTab === "image" && (
          <div className="space-y-4">
            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-rose-200 hover:border-zen-primary rounded-2xl p-5 text-center cursor-pointer bg-rose-50/30 hover:bg-rose-50/60 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                <UploadCloud className={`w-6 h-6 ${isCompressing ? "animate-bounce" : ""}`} />
              </div>
              <p className="text-xs text-gray-600 leading-snug font-medium">
                {isCompressing
                  ? "Đang tự động nén WebP siêu nhẹ..."
                  : "Kéo thả hoặc nhấn vào đây để tải lên file. Tự động nén WebP tiết kiệm 95% dung lượng."}
              </p>

              {lastCompressionInfo && (
                <div className="mt-2 py-1 px-2.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-block animate-fade-in">
                  ✨ {lastCompressionInfo}
                </div>
              )}

              <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                <span>Tải lên: <strong className="text-gray-700">Root</strong></span>
                <span>•</span>
                <span>Đã: {uploadedImages.length}/10</span>
                <span>•</span>
                <span className="text-zen-primary font-semibold">Còn lại: {Math.max(0, 10 - uploadedImages.length)}</span>
              </div>
            </div>

            {/* Sub-tabs: Tất cả ảnh | Thư mục */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <button
                type="button"
                onClick={() => setImageSubTab("all")}
                className={`text-xs font-bold pb-1 transition-colors relative ${
                  imageSubTab === "all" ? "text-zen-primary" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Tất cả ảnh
                {imageSubTab === "all" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-zen-primary rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setImageSubTab("folders")}
                className={`text-xs font-bold pb-1 transition-colors relative ${
                  imageSubTab === "folders" ? "text-zen-primary" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Thư mục
                {imageSubTab === "folders" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-zen-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Total files text */}
            <div className="text-[11px] text-gray-400">
              Tổng {uploadedImages.length} tệp
            </div>

            {/* Images Grid or Empty State */}
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map((src, idx) => (
                  <div
                    key={idx}
                    onClick={() => onAddImage(src)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all"
                  >
                    <img src={src} alt="Uploaded" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                      Chèn ảnh
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">
                Bạn chưa tải lên ảnh nào.
              </div>
            )}
          </div>
        )}

        {/* ================= 2. TAB: VĂN BẢN ================= */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onAddText("Tiêu đề tiệc cưới", "heading")}
              className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:border-zen-primary bg-gray-50/50 hover:bg-rose-50/30 text-left transition-all"
            >
              <span className="text-lg font-black font-serif text-gray-900 block">
                Thêm tiêu đề lớn
              </span>
              <span className="text-[11px] text-gray-400">Dành cho tên cô dâu, chú rể</span>
            </button>

            <button
              type="button"
              onClick={() => onAddText("Trân trọng kính mời quý khách", "subheading")}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-zen-primary bg-gray-50/50 hover:bg-rose-50/30 text-left transition-all"
            >
              <span className="text-sm font-bold text-gray-800 block">
                Thêm tiêu đề phụ
              </span>
              <span className="text-[11px] text-gray-400">Dành cho lời chào, ngày tháng</span>
            </button>

            <button
              type="button"
              onClick={() => onAddText("Đoạn nội dung thư mời...", "body")}
              className="w-full py-2 px-4 rounded-xl border border-gray-200 hover:border-zen-primary bg-gray-50/50 hover:bg-rose-50/30 text-left transition-all"
            >
              <span className="text-xs text-gray-700 block">
                Thêm đoạn văn bản ngắn
              </span>
              <span className="text-[10px] text-gray-400">Dành cho địa chỉ, thông điệp</span>
            </button>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Kiểu chữ mẫu sẵn:
              </h4>
              <div className="space-y-1.5">
                {[
                  { text: "Save the date", font: "font-serif italic", size: "text-lg" },
                  { text: "Lễ Thành Hôn", font: "font-signature", size: "text-xl" },
                  { text: "Trăm Năm Hạnh Phúc", font: "font-serif", size: "text-base" },
                ].map((sample, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onAddText(sample.text, "heading")}
                    className={`w-full p-2.5 rounded-xl border border-gray-100 hover:border-zen-primary/50 text-center ${sample.font} ${sample.size} text-gray-800 hover:bg-rose-50/20`}
                  >
                    {sample.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. TAB: NHẠC NỀN ================= */}
        {activeTab === "music" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              Chọn bản nhạc du dương để phát tự động khi khách mở thiệp cưới:
            </p>

            <div className="space-y-2">
              {weddingSongs.map((song) => {
                const isSelected = isPlayingPreview === song.id;
                return (
                  <div
                    key={song.id}
                    className="p-3 rounded-xl border border-gray-100 hover:border-zen-primary bg-gray-50/50 flex items-center justify-between gap-2 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-zen-primary flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {song.title}
                        </p>
                        <p className="text-[10px] text-gray-400">Nhạc không lời lãng mạn</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onChangeMusic(song.title, song.url);
                        setIsPlayingPreview(song.id);
                      }}
                      className="px-2.5 py-1 rounded-full bg-zen-primary hover:bg-[#d93849] text-white text-[11px] font-bold shrink-0 transition-transform active:scale-95"
                    >
                      {isSelected ? "Đang chọn" : "Chọn"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= 4. TAB: TIỆN ÍCH ================= */}
        {activeTab === "widgets" && (
          <div className="space-y-2.5">
            {[
              {
                title: "Đếm ngược ngày cưới",
                desc: "Hiển thị đồng hồ đếm ngược đến ngày trọng đại",
                icon: <Calendar className="w-5 h-5 text-indigo-500" />,
              },
              {
                title: "Bản đồ chỉ đường (Maps)",
                desc: "Tích hợp Google Maps dẫn đường khách đến tiệc",
                icon: <MapPin className="w-5 h-5 text-blue-500" />,
              },
              {
                title: "Hộp mừng cưới (QR Ngân hàng)",
                desc: "Nhận tiền mừng cưới qua mã QR tiện lợi",
                icon: <Gift className="w-5 h-5 text-amber-500" />,
              },
              {
                title: "Sổ lưu bút & Lời chúc",
                desc: "Khách mời gửi lời chúc phúc trực tiếp trên thiệp",
                icon: <Heart className="w-5 h-5 text-rose-500" />,
              },
            ].map((widget, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-gray-100 hover:border-zen-primary bg-white flex items-start gap-3 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="p-2 rounded-xl bg-gray-50 shrink-0">
                  {widget.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{widget.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                    {widget.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= 5. TAB: MẪU ================= */}
        {activeTab === "templates" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mẫu..."
                value={searchTemplate}
                onChange={(e) => setSearchTemplate(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-zen-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {ZENLOVE_TEMPLATES.filter((t) =>
                t.name.toLowerCase().includes(searchTemplate.toLowerCase())
              )
                .slice(0, 16)
                .map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTemplate(t)}
                    className="group cursor-pointer rounded-xl border border-gray-100 hover:border-zen-primary p-1 bg-white text-center hover:shadow-sm transition-all"
                  >
                    <div className="aspect-[1000/1470] overflow-hidden rounded-lg bg-gray-100 mb-1">
                      <img
                        src={t.imageUrl}
                        alt={t.name}
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[11px] font-bold text-gray-900 truncate">
                      {t.name}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================= 6. TAB: HIỆU ỨNG ================= */}
        {activeTab === "effects" && (
          <div className="space-y-2">
            {[
              { id: "petals", name: "Cánh hoa rơi", icon: "🌸" },
              { id: "hearts", name: "Trái tim bay", icon: "💖" },
              { id: "glitter", name: "Lấp lánh hoàng kim", icon: "✨" },
              { id: "snow", name: "Tuyết rơi mùa đông", icon: "❄️" },
            ].map((eff) => {
              const active = activeEffects.includes(eff.id);
              return (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => onToggleEffect && onToggleEffect(eff.id)}
                  className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    active
                      ? "border-zen-primary bg-rose-50 text-zen-primary shadow-xs"
                      : "border-gray-100 hover:border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{eff.icon}</span>
                    <span>{eff.name}</span>
                  </div>
                  {active && <Check className="w-4 h-4 text-zen-primary" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Default / Fallback for other tabs */}
        {["background", "stock", "tools", "presets", "support"].includes(activeTab) && (
          <div className="text-center py-10 space-y-2">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-zen-primary flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-800">
              Công cụ sẵn sàng sử dụng
            </p>
            <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto leading-relaxed">
              Bạn có thể click vào bất kỳ thành phần nào trên trang thiệp để chỉnh sửa nhanh qua bảng thuộc tính bên phải.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

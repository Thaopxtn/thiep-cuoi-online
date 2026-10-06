"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Wand2,
  Sparkles,
  Heart,
  Calendar,
  MapPin,
  Image as ImageIcon,
  QrCode,
  Check,
  UploadCloud,
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
  Info,
} from "lucide-react";
import { WeddingCard } from "@/data/initialCards";
import { AutoFillFormData, applyAutoFillToNodes } from "@/lib/templateValidation";
import { compressImageToWebP } from "@/lib/imageCompression";
import { addUploadedImageToLibrary, addUploadedImagesToLibrary } from "@/lib/mediaLibraryService";
import { POPULAR_BANKS } from "@/lib/vietQrBankCodes";

interface EditorAutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: WeddingCard | null;
  nodes: Record<string, any>;
  onApply: (
    updatedNodes: Record<string, any>,
    updatedCard: Partial<WeddingCard>,
    stats: { textCount: number; photoCount: number; widgetCount: number }
  ) => void;
}

export default function EditorAutoFillModal({
  isOpen,
  onClose,
  card,
  nodes,
  onApply,
}: EditorAutoFillModalProps) {
  const [activeTab, setActiveTab] = useState<"couple" | "datetime" | "photos" | "bank">("couple");

  // Form states initialized from card
  const [formData, setFormData] = useState<AutoFillFormData>({
    groomName: card?.groom?.name || "",
    groomPhone: card?.groom?.phone || "",
    groomFather: "",
    groomMother: "",
    groomBank: card?.groom?.bankName || "MB BANK",
    groomAccount: card?.groom?.accountNumber || "",
    groomAccountName: card?.groom?.accountName || card?.groom?.name || "",

    brideName: card?.bride?.name || "",
    bridePhone: card?.bride?.phone || "",
    brideFather: "",
    brideMother: "",
    brideBank: card?.bride?.bankName || "TECHCOMBANK",
    brideAccount: card?.bride?.accountNumber || "",
    brideAccountName: card?.bride?.accountName || card?.bride?.name || "",

    weddingDate: card?.weddingDate || "2026-11-20",
    weddingTime: card?.weddingTime || "11:00",
    lunarDate: card?.lunarDate || "Ngày 12 tháng 10 năm Bính Ngọ",

    venueName: card?.events?.[0]?.venue || "Trung tâm Hội nghị & Tiệc cưới Trống Đồng Palace",
    address: card?.events?.[0]?.address || "72 Quán Sứ, Hoàn Kiếm, Hà Nội",
    mapUrl: card?.events?.[0]?.mapUrl || "https://maps.google.com/?q=21.0254,105.8458",

    coverPhoto: card?.coverImage || "",
    groomPhoto: "",
    bridePhoto: "",
    additionalPhotos: [],
    albumPhotos: card?.album || [],
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Hidden file input refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const groomInputRef = useRef<HTMLInputElement>(null);
  const brideInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Xử lý tải ảnh đơn lẻ (nén WebP + upload API)
  const handleSinglePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldKey: "coverPhoto" | "groomPhoto" | "bridePhoto"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(fieldKey);
      const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
      let uploadedUrl = compressed.dataUrl;

      try {
        const data = new FormData();
        data.append("file", compressed.file);
        const res = await fetch("/api/upload", { method: "POST", body: data });
        if (res.ok) {
          const json = await res.json();
          if (json.url) uploadedUrl = json.url;
        }
      } catch (uploadErr) {
        console.warn("Upload API fallback:", uploadErr);
      }

      addUploadedImageToLibrary(uploadedUrl);
      setFormData((prev) => ({ ...prev, [fieldKey]: uploadedUrl }));
    } catch (err) {
      console.error("Lỗi upload ảnh:", err);
    } finally {
      setIsUploadingPhoto(null);
      e.target.value = "";
    }
  };

  // Xử lý tải nhiều ảnh album
  const handleAlbumPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploadingPhoto("album");
      const newUrls: string[] = [];

      for (const file of files) {
        try {
          const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
          let uploadedUrl = compressed.dataUrl;

          try {
            const data = new FormData();
            data.append("file", compressed.file);
            const res = await fetch("/api/upload", { method: "POST", body: data });
            if (res.ok) {
              const json = await res.json();
              if (json.url) uploadedUrl = json.url;
            }
          } catch {
            // fallback
          }

          newUrls.push(uploadedUrl);
        } catch {
          newUrls.push(URL.createObjectURL(file));
        }
      }

      addUploadedImagesToLibrary(newUrls);
      setFormData((prev) => ({
        ...prev,
        albumPhotos: [...(prev.albumPhotos || []), ...newUrls],
      }));
    } catch (err) {
      console.error("Lỗi upload album:", err);
    } finally {
      setIsUploadingPhoto(null);
      e.target.value = "";
    }
  };

  // Điền dữ liệu mẫu nhanh (Mock Data)
  const handleFillSampleData = () => {
    setFormData({
      groomName: "Trần Minh Quân",
      groomPhone: "0912.888.999",
      groomFather: "Trần Văn Hưng",
      groomMother: "Nguyễn Thị Mai",
      groomBank: "MB",
      groomAccount: "999924021995",
      groomAccountName: "TRAN MINH QUAN",

      brideName: "Phạm Mai Linh",
      bridePhone: "0988.666.777",
      brideFather: "Phạm Văn Đức",
      brideMother: "Hoàng Kim Oanh",
      brideBank: "TCB",
      brideAccount: "190388889999",
      brideAccountName: "PHAM MAI LINH",

      weddingDate: "2026-12-25",
      weddingTime: "11:30",
      lunarDate: "Ngày 17 tháng 11 năm Bính Ngọ",

      venueName: "Trung tâm Tiệc cưới Trống Đồng Palace",
      address: "Số 65 Quán Sứ, Hoàn Kiếm, TP. Hà Nội",
      mapUrl: "https://maps.google.com/?q=21.0254,105.8458",

      coverPhoto:
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200",
      groomPhoto:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800",
      bridePhoto:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
      additionalPhotos: [
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200",
      ],
      albumPhotos: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800",
      ],
    });
  };

  // Thực hiện áp dụng vào thiệp
  const handleSubmit = () => {
    setIsApplying(true);
    try {
      const { updatedNodes, updatedCard, stats } = applyAutoFillToNodes(nodes, card, formData);
      onApply(updatedNodes, updatedCard, stats);
      onClose();
    } catch (err) {
      console.error("Lỗi áp dụng tự động điền:", err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-50 via-white to-amber-50/40 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#e54153] to-[#ff5b70] text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Wand2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Biểu mẫu Tự động điền thông tin thiệp
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#e54153]">
                  ⚡ Tiết kiệm 90% thời gian
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Nhập 1 lần tại đây, hệ thống tự động gán tên, ngày giờ, địa điểm và ảnh vào toàn bộ thiệp cưới.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSampleData}
              className="hidden sm:flex px-3 py-1.5 rounded-xl border border-rose-200 text-[#e54153] hover:bg-rose-50 text-[11px] font-bold items-center gap-1.5 transition-colors cursor-pointer"
              title="Điền sẵn dữ liệu mẫu thử để trải nghiệm tính năng"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Điền mẫu thử</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("couple")}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "couple"
                ? "bg-white text-gray-900 shadow-2xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Cô dâu & Chú rể</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("datetime")}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "datetime"
                ? "bg-white text-gray-900 shadow-2xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Thời gian & Địa điểm</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "photos"
                ? "bg-white text-gray-900 shadow-2xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>Hình ảnh cưới & Album</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "bank"
                ? "bg-white text-gray-900 shadow-2xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-purple-500" />
            <span>Mừng cưới (VietQR)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: CÔ DÂU & CHÚ RỂ */}
          {activeTab === "couple" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Chú rể (Nhà trai) */}
              <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100 space-y-3">
                <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase">
                    Thông tin Chú Rể (Nhà Trai)
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Họ và tên Chú Rể *</label>
                  <input
                    type="text"
                    value={formData.groomName}
                    onChange={(e) => setFormData({ ...formData, groomName: e.target.value })}
                    placeholder="VD: Nguyễn Đức Mạnh"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={formData.groomPhone}
                    onChange={(e) => setFormData({ ...formData, groomPhone: e.target.value })}
                    placeholder="0912.xxx.xxx"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Ông (Thân phụ)</label>
                    <input
                      type="text"
                      value={formData.groomFather}
                      onChange={(e) => setFormData({ ...formData, groomFather: e.target.value })}
                      placeholder="Nguyễn Văn Hùng"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Bà (Thân mẫu)</label>
                    <input
                      type="text"
                      value={formData.groomMother}
                      onChange={(e) => setFormData({ ...formData, groomMother: e.target.value })}
                      placeholder="Trần Thị Lan"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cô dâu (Nhà gái) */}
              <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100 space-y-3">
                <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase">
                    Thông tin Cô Dâu (Nhà Gái)
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Họ và tên Cô Dâu *</label>
                  <input
                    type="text"
                    value={formData.brideName}
                    onChange={(e) => setFormData({ ...formData, brideName: e.target.value })}
                    placeholder="VD: Trần Lệ Quyên"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={formData.bridePhone}
                    onChange={(e) => setFormData({ ...formData, bridePhone: e.target.value })}
                    placeholder="0987.xxx.xxx"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Ông (Thân phụ)</label>
                    <input
                      type="text"
                      value={formData.brideFather}
                      onChange={(e) => setFormData({ ...formData, brideFather: e.target.value })}
                      placeholder="Lê Văn Thành"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Bà (Thân mẫu)</label>
                    <input
                      type="text"
                      value={formData.brideMother}
                      onChange={(e) => setFormData({ ...formData, brideMother: e.target.value })}
                      placeholder="Vũ Thị Mai"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THỜI GIAN & ĐỊA ĐIỂM */}
          {activeTab === "datetime" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/30 border border-blue-100 space-y-3">
                <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase">
                    Thời gian tổ chức hôn lễ
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Ngày cưới (Dương lịch) *</label>
                    <input
                      type="date"
                      value={formData.weddingDate}
                      onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Giờ tổ chức (VD: 11:00) *</label>
                    <input
                      type="time"
                      value={formData.weddingTime}
                      onChange={(e) => setFormData({ ...formData, weddingTime: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Ngày âm lịch</label>
                    <input
                      type="text"
                      value={formData.lunarDate}
                      onChange={(e) => setFormData({ ...formData, lunarDate: e.target.value })}
                      placeholder="Ngày 10 tháng 10 năm Bính Ngọ"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase">
                    Địa điểm tiệc cưới
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">
                    Tên Trung tâm tiệc cưới / Tư gia nhà rạp *
                  </label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    placeholder="Trung tâm Hội nghị & Tiệc cưới Trống Đồng Palace"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Địa chỉ cụ thể *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Số 72 Quán Sứ, P. Trần Hưng Đạo, Hoàn Kiếm, Hà Nội"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Đường dẫn Google Maps chỉ đường</label>
                  <input
                    type="text"
                    value={formData.mapUrl}
                    onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HÌNH ẢNH CƯỚI & ALBUM */}
          {activeTab === "photos" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Ảnh đôi chính / Ảnh bìa */}
                <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-gray-800 mb-1">Ảnh bìa / Ảnh đôi chính</span>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 hover:border-[#e54153] bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
                  >
                    {formData.coverPhoto ? (
                      <img
                        src={formData.coverPhoto}
                        alt="Cover"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="p-3 text-center text-gray-400">
                        <UploadCloud className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <span className="text-[10px] font-semibold">Tải ảnh bìa</span>
                      </div>
                    )}
                    {isUploadingPhoto === "coverPhoto" && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSinglePhotoUpload(e, "coverPhoto")}
                    className="hidden"
                  />
                </div>

                {/* 2. Ảnh Chú Rể */}
                <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-gray-800 mb-1">Ảnh Chú Rể</span>
                  <div
                    onClick={() => groomInputRef.current?.click()}
                    className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 hover:border-[#e54153] bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
                  >
                    {formData.groomPhoto ? (
                      <img
                        src={formData.groomPhoto}
                        alt="Groom"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="p-3 text-center text-gray-400">
                        <UploadCloud className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <span className="text-[10px] font-semibold">Tải ảnh chú rể</span>
                      </div>
                    )}
                    {isUploadingPhoto === "groomPhoto" && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={groomInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSinglePhotoUpload(e, "groomPhoto")}
                    className="hidden"
                  />
                </div>

                {/* 3. Ảnh Cô Dâu */}
                <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-gray-800 mb-1">Ảnh Cô Dâu</span>
                  <div
                    onClick={() => brideInputRef.current?.click()}
                    className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 hover:border-[#e54153] bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
                  >
                    {formData.bridePhoto ? (
                      <img
                        src={formData.bridePhoto}
                        alt="Bride"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="p-3 text-center text-gray-400">
                        <UploadCloud className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <span className="text-[10px] font-semibold">Tải ảnh cô dâu</span>
                      </div>
                    )}
                    {isUploadingPhoto === "bridePhoto" && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={brideInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSinglePhotoUpload(e, "bridePhoto")}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Album ảnh cưới (Carousel) */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      Album ảnh cưới trượt ({formData.albumPhotos?.length || 0} ảnh)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Tự động gán vào tiện ích trình chiếu album ảnh cưới trên thiệp
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => albumInputRef.current?.click()}
                    disabled={isUploadingPhoto === "album"}
                    className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isUploadingPhoto === "album" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e54153]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-[#e54153]" />
                    )}
                    <span>+ Thêm ảnh album</span>
                  </button>
                </div>

                <input
                  ref={albumInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAlbumPhotosUpload}
                  className="hidden"
                />

                {formData.albumPhotos && formData.albumPhotos.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                    {formData.albumPhotos.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-white shadow-2xs"
                      >
                        <img src={url} alt={`Album ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...(formData.albumPhotos || [])];
                            copy.splice(idx, 1);
                            setFormData({ ...formData, albumPhotos: copy });
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl bg-white">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                    <span>Chưa có ảnh nào trong album. Bấm &quot;+ Thêm ảnh album&quot; để chọn.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MỪNG CƯỚI (VIETQR) */}
          {activeTab === "bank" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-start gap-2.5 text-xs text-purple-950">
                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Hệ thống tự động liên kết với cổng ngân hàng Quốc Gia VietQR. Khách quét mã sẽ tự động điền đúng Số tài khoản, Ngân hàng và nội dung mừng cưới mà không sợ chuyển nhầm!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tài khoản Chú rể */}
                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Tài khoản Chú Rể (Nhà trai)
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Ngân hàng</label>
                    <select
                      value={formData.groomBank}
                      onChange={(e) => setFormData({ ...formData, groomBank: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white cursor-pointer"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Số tài khoản</label>
                    <input
                      type="text"
                      value={formData.groomAccount}
                      onChange={(e) => setFormData({ ...formData, groomAccount: e.target.value })}
                      placeholder="VD: 0912345678"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Tên chủ tài khoản (In hoa không dấu)</label>
                    <input
                      type="text"
                      value={formData.groomAccountName}
                      onChange={(e) => setFormData({ ...formData, groomAccountName: e.target.value })}
                      placeholder="VD: NGUYEN DUC MANH"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                </div>

                {/* Tài khoản Cô dâu */}
                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Tài khoản Cô Dâu (Nhà gái)
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Ngân hàng</label>
                    <select
                      value={formData.brideBank}
                      onChange={(e) => setFormData({ ...formData, brideBank: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white cursor-pointer"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Số tài khoản</label>
                    <input
                      type="text"
                      value={formData.brideAccount}
                      onChange={(e) => setFormData({ ...formData, brideAccount: e.target.value })}
                      placeholder="VD: 190365824988"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Tên chủ tài khoản (In hoa không dấu)</label>
                    <input
                      type="text"
                      value={formData.brideAccountName}
                      onChange={(e) => setFormData({ ...formData, brideAccountName: e.target.value })}
                      placeholder="VD: TRAN LE QUYEN"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleFillSampleData}
            className="sm:hidden px-3 py-2 rounded-xl border border-rose-200 text-[#e54153] text-xs font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Điền mẫu thử</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs font-semibold transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isApplying || !formData.groomName || !formData.brideName}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#e54153] to-[#ff5268] hover:from-[#d93849] hover:to-[#e54153] text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>✨ Áp dụng vào thiệp cưới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

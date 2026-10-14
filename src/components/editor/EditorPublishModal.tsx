"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Copy,
  ExternalLink,
  QrCode,
  Smartphone,
  Download,
  Share2,
  Camera,
  Edit3,
  Sparkles,
  Save,
  Users,
  Crown,
} from "lucide-react";
import { WeddingCard, INITIAL_CARDS } from "@/data/initialCards";
import { downloadCardImageAsPng } from "@/lib/cardImageExporter";
import { findZenloveTemplate } from "@/data/zenloveTemplates";
import BulkGuestInvitationModal from "@/components/invitations/BulkGuestInvitationModal";
import VietQrVipPaymentModal from "@/components/payment/VietQrVipPaymentModal";
import {
  generateBrandedWeddingSlug,
  normalizeToSlug,
  buildShareableWeddingUrl,
  isValidSlug,
  parseBrandedSlug,
} from "@/lib/brandedSlug";
import { saveCard, saveCardAsync } from "@/lib/weddingCardService";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiClient";

interface EditorPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  templateId: string;
  cardSlug?: string;
  card?: WeddingCard;
  onSlugUpdated?: (newSlug: string) => void;
}

export default function EditorPublishModal({
  isOpen,
  onClose,
  templateName,
  templateId,
  cardSlug,
  card,
  onSlugUpdated,
}: EditorPublishModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [copiedGuest, setCopiedGuest] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isBulkGuestModalOpen, setIsBulkGuestModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isVipLocal, setIsVipLocal] = useState(Boolean(card?.isVip || (card?.groom as any)?.isVip));

  // Trạng thái tùy chỉnh Slug theo 4 thành phần chuẩn:
  // [Tên người dùng] + [Địa chỉ web] + [Mẫu] + [Thông tin khác nếu có]
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [userPartInput, setUserPartInput] = useState("");
  const [webPartInput, setWebPartInput] = useState("zenlove");
  const [mauPartInput, setMauPartInput] = useState("");
  const [extraPartInput, setExtraPartInput] = useState("");

  const [customSlugInput, setCustomSlugInput] = useState("");
  const [slugSuccessMsg, setSlugSuccessMsg] = useState("");
  const [slugErrorMsg, setSlugErrorMsg] = useState("");
  const [currentSlug, setCurrentSlug] = useState("");

  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3005";

  // Xác định thông tin mẫu thiệp
  const templateMeta = findZenloveTemplate(templateId) || findZenloveTemplate(card?.templateId);
  const displayCode = templateMeta?.displayCode || (templateMeta?.orderNumber ? `Mẫu ${String(templateMeta.orderNumber).padStart(2, "0")}` : "Mẫu 01");
  const codeSlug = templateMeta?.code ? templateMeta.code.replace(/-/g, "") : (templateMeta?.orderNumber ? `mau${String(templateMeta.orderNumber).padStart(2, "0")}` : "mau01");

  // Khởi tạo active slug khi modal mở và tự động lưu bảo đảm tính khả dụng 100% của URL
  useEffect(() => {
    if (isOpen) {
      let initialSlug = cardSlug || card?.slug;

      const defaultUser = user?.name
        ? normalizeToSlug(user.name)
        : (user?.email ? normalizeToSlug(user.email.split("@")[0]) : (card?.groom?.name ? normalizeToSlug(card.groom.name) : "nguoi-dung"));

      const defaultYear = card?.weddingDate ? new Date(card.weddingDate).getFullYear().toString() : "";

      // Phân tích nếu slug hiện tại đã là dạng branded
      const parsed = parseBrandedSlug(initialSlug);

      const uPart = parsed.userPart || defaultUser;
      const wPart = parsed.websitePart || "zenlove";
      const mPart = parsed.templateCode || codeSlug;
      const ePart = parsed.suffix || defaultYear;

      setUserPartInput(uPart);
      setWebPartInput(wPart);
      setMauPartInput(mPart);
      setExtraPartInput(ePart);

      // Nếu slug chưa có hoặc còn là UUID thô -> sinh Branded Slug chuẩn: [Tên người dùng] + [zenlove] + [Mẫu] + [Khác]
      if (!initialSlug || initialSlug.length > 35 || initialSlug === templateId || initialSlug.startsWith("card_") || initialSlug.includes("-01d9-")) {
        initialSlug = generateBrandedWeddingSlug({
          userName: uPart,
          groomName: card?.groom?.name,
          brideName: card?.bride?.name,
          websiteName: wPart,
          templateCode: mPart,
          customSuffix: ePart,
        });
      }

      setCurrentSlug(initialSlug);
      setCustomSlugInput(initialSlug);
      setIsEditingSlug(false);
      setSlugSuccessMsg("");
      setSlugErrorMsg("");

      // LƯU NGAY LẬP TỨC: Đảm bảo link đã tồn tại trong DB và LocalStorage trước khi người dùng bấm mở
      if (card && card.slug !== initialSlug) {
        const updated: WeddingCard = {
          ...card,
          slug: initialSlug,
          status: "published",
        };
        saveCard(updated);
        if (card.id) {
          apiFetch(`/api/cards/${card.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          }).catch((err) => console.warn("Lỗi sync slug khi mở modal:", err));
        }
        if (onSlugUpdated) {
          onSlugUpdated(initialSlug);
        }
      }
    }
  }, [isOpen, templateId, cardSlug, card?.slug, codeSlug, user?.name, user?.email]);

  if (!isOpen) return null;

  const publicUrl = `${currentOrigin}/show/${currentSlug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}`;

  const handleCopy = () => {
    // Đảm bảo card đã lưu trước khi sao chép
    if (card) {
      const updated: WeddingCard = { ...card, slug: currentSlug, status: "published" };
      saveCard(updated);
    }
    navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cập nhật slug theo 4 trường riêng biệt
  const updateSlugFromParts = (u: string, w: string, m: string, e: string) => {
    const nextSlug = generateBrandedWeddingSlug({
      userName: u,
      websiteName: w,
      templateCode: m,
      customSuffix: e,
    });
    setCustomSlugInput(nextSlug);
  };

  // Lưu tùy chỉnh slug mới
  const handleSaveCustomSlug = async () => {
    setSlugErrorMsg("");
    setSlugSuccessMsg("");

    const formatted = normalizeToSlug(customSlugInput);
    if (!formatted || formatted.length < 3) {
      setSlugErrorMsg("Tên đường dẫn quá ngắn, tối thiểu 3 ký tự.");
      return;
    }

    try {
      setCurrentSlug(formatted);
      setIsEditingSlug(false);

      // Cập nhật card nếu có
      if (card) {
        const updatedCard: WeddingCard = {
          ...card,
          slug: formatted,
          status: "published",
        };
        saveCard(updatedCard);

        // Đồng bộ lên API nếu card đã có id
        if (card.id) {
          await apiFetch(`/api/cards/${card.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedCard),
          }).catch((err) => console.warn("Lỗi đồng bộ slug lên server:", err));
        }
      }

      if (onSlugUpdated) {
        onSlugUpdated(formatted);
      }

      setSlugSuccessMsg("✨ Đã cập nhật và lưu đường dẫn mới thành công!");
      setTimeout(() => setSlugSuccessMsg(""), 3000);
    } catch (err: any) {
      setSlugErrorMsg(err.message || "Lỗi khi lưu đường dẫn");
    }
  };

  // Xử lý mở thiệp đảm bảo 100% dữ liệu đã lưu
  const handleOpenInvitationPage = (e: React.MouseEvent) => {
    if (card) {
      const updatedCard: WeddingCard = {
        ...card,
        slug: currentSlug,
        status: "published",
      };
      saveCard(updatedCard);
      if (card.id) {
        apiFetch(`/api/cards/${card.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCard),
        }).catch(() => {});
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 relative animate-scale-up max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-gray-900">
            Xuất bản thiệp thành công!
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {displayCode}
            </span>
            <span className="text-xs sm:text-sm text-gray-600">
              Thiệp cưới <strong>{templateName}</strong> đã sẵn sàng để gửi tới khách mời.
            </span>
          </div>
        </div>

        {/* Banner Mở Khóa VIP VietQR */}
        {!isVipLocal ? (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200/90 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Nâng cấp VIP (Xóa Watermark)</h4>
                <p className="text-[10px] text-gray-500">Quét VietQR kích hoạt tự động sau 10s</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsVipModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
            >
              Nâng cấp 99k
            </button>
          </div>
        ) : (
          <div className="mb-4 p-2.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-center gap-2 text-xs font-bold text-amber-800">
            <Crown className="w-4 h-4 text-amber-600" />
            <span>Thiệp cưới đã kích hoạt VIP Vĩnh Viễn (Đã xóa Watermark)</span>
          </div>
        )}

        {/* QR Code & Link preview */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-xs border border-gray-200 shrink-0">
            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-2 min-w-0 w-full text-left">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                Đường link thiệp mời:
              </label>
              <button
                type="button"
                onClick={() => setIsEditingSlug(!isEditingSlug)}
                className="text-[11px] font-semibold text-zen-primary hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingSlug ? "Hủy sửa" : "Đổi URL"}</span>
              </button>
            </div>

            {/* Ô xem đường link */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 shadow-2xs">
              <span className="truncate flex-1 font-mono text-[11px] font-semibold text-zen-primary">
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-zen-primary hover:text-red-700 font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã chép" : "Chép"}</span>
              </button>
            </div>

            <p className="text-[10px] text-gray-500">
              Cấu trúc: <code>[Tên người dùng] + [Địa chỉ web] + [Mẫu] + [Thông tin khác nếu có]</code>
            </p>
          </div>
        </div>

        {/* Khu vực Tùy chỉnh URL theo ý muốn: 4 thành phần rõ ràng */}
        {isEditingSlug && (
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 mb-4 text-left animate-fade-in space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block">
                ✏️ Cấu trúc URL thiệp chia sẻ:
              </label>
              <span className="text-[10px] text-amber-700 font-medium">Tự động ghép link</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                  1. Tên người dùng
                </label>
                <input
                  type="text"
                  value={userPartInput}
                  onChange={(e) => {
                    const nextU = normalizeToSlug(e.target.value);
                    setUserPartInput(nextU);
                    updateSlugFromParts(nextU, webPartInput, mauPartInput, extraPartInput);
                  }}
                  placeholder="VD: thaoh"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-zen-primary font-mono text-gray-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                  2. Địa chỉ web
                </label>
                <input
                  type="text"
                  value={webPartInput}
                  onChange={(e) => {
                    const nextW = normalizeToSlug(e.target.value);
                    setWebPartInput(nextW);
                    updateSlugFromParts(userPartInput, nextW, mauPartInput, extraPartInput);
                  }}
                  placeholder="zenlove"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-zen-primary font-mono text-gray-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                  3. Mẫu thiệp
                </label>
                <input
                  type="text"
                  value={mauPartInput}
                  onChange={(e) => {
                    const nextM = normalizeToSlug(e.target.value);
                    setMauPartInput(nextM);
                    updateSlugFromParts(userPartInput, webPartInput, nextM, extraPartInput);
                  }}
                  placeholder="mau01"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-zen-primary font-mono text-gray-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                  4. Khác (năm/mã)
                </label>
                <input
                  type="text"
                  value={extraPartInput}
                  onChange={(e) => {
                    const nextE = normalizeToSlug(e.target.value);
                    setExtraPartInput(nextE);
                    updateSlugFromParts(userPartInput, webPartInput, mauPartInput, nextE);
                  }}
                  placeholder="2026"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-zen-primary font-mono text-gray-800"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="text-[10px] font-semibold text-gray-500 block mb-1">
                Chuỗi liên kết hoàn chỉnh (có thể sửa tự do):
              </label>
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
                  .../show/
                </span>
                <input
                  type="text"
                  value={customSlugInput}
                  onChange={(e) => setCustomSlugInput(normalizeToSlug(e.target.value))}
                  placeholder="VD: nguyen-tuan-zenlove-mau01"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-zen-primary font-mono text-gray-800 font-bold"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomSlug}
                  className="px-3 py-1.5 bg-zen-primary hover:bg-[#d93849] text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu URL</span>
                </button>
              </div>
            </div>
            {slugErrorMsg && (
              <p className="text-[10px] text-red-600 mt-1 font-semibold">{slugErrorMsg}</p>
            )}
          </div>
        )}

        {slugSuccessMsg && (
          <div className="p-2 mb-3 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-semibold text-center border border-emerald-200">
            {slugSuccessMsg}
          </div>
        )}

        {/* Personalized Guest Link Section */}
        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100 mb-4 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-rose-900 block">
              💌 Gửi riêng cho từng khách (Tự in tên lên bìa thư sáp):
            </label>
            <button
              type="button"
              onClick={() => setIsBulkGuestModalOpen(true)}
              className="text-[10px] font-bold text-[#e54153] hover:text-[#c93243] bg-white border border-rose-200 px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>Gửi Zalo hàng loạt</span>
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tên khách: VD Anh Tuấn, Cô Lan..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:border-zen-primary shadow-2xs"
            />
            <button
              type="button"
              onClick={() => {
                const link = guestName.trim()
                  ? `${publicUrl}?to=${encodeURIComponent(guestName.trim())}`
                  : publicUrl;
                navigator.clipboard?.writeText(link);
                setCopiedGuest(true);
                setTimeout(() => setCopiedGuest(false), 2000);
              }}
              className="px-3.5 py-1.5 bg-zen-primary hover:bg-[#d93849] text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              {copiedGuest ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedGuest ? "Đã sao chép!" : "Chép link riêng"}</span>
            </button>
          </div>
          {guestName.trim() && (
            <p className="text-[10px] text-rose-700 font-mono truncate mt-1.5">
              Link: {`${publicUrl}?to=${encodeURIComponent(guestName.trim())}`}
            </p>
          )}
        </div>

        {/* Extra Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              const link = guestName.trim()
                ? `${publicUrl}?to=${encodeURIComponent(guestName.trim())}`
                : publicUrl;
              const msg = `🌸 THIỆP MỜI THÀNH HÔN 🌸\nTrân trọng kính mời: ${guestName.trim() || "Quý khách"}\nTới dự ngày vui cùng chúng mình tại:\n👉 ${link}\nSự hiện diện của bạn là niềm hạnh phúc lớn nhất của chúng mình!`;
              navigator.clipboard?.writeText(msg);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="py-2.5 px-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-1 transition-all cursor-pointer text-center"
          >
            <span>💬 Chép mẫu Zalo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const link = guestName.trim()
                ? `${publicUrl}?to=${encodeURIComponent(guestName.trim())}`
                : publicUrl;
              window.open(`https://zalo.me/share?url=${encodeURIComponent(link)}`, "_blank");
            }}
            className="py-2.5 px-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1 transition-all cursor-pointer text-center"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Mở gửi Zalo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const link = guestName.trim()
                ? `${publicUrl}?to=${encodeURIComponent(guestName.trim())}`
                : publicUrl;
              const qrDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(link)}`;
              window.open(qrDownloadUrl, "_blank");
            }}
            className="py-2.5 px-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs border border-purple-200 flex items-center justify-center gap-1 transition-all cursor-pointer text-center"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải QR in thiệp</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                setIsExportingPng(true);
                const targetCard = card || INITIAL_CARDS.find((c) => c.slug === currentSlug || c.id === currentSlug) || ({
                  id: templateId,
                  slug: currentSlug,
                  name: templateName,
                  templateId,
                  templateName,
                  status: "published",
                  updatedAt: new Date().toLocaleDateString("vi-VN"),
                  views: 1,
                  coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
                  story: "Hẹn nhau trong ngày hạnh phúc.",
                  weddingDate: "2026-11-20",
                  weddingTime: "11:00",
                  lunarDate: "Ngày lành tháng tốt",
                  groom: { name: "Chú Rể", title: "Chú Rể", phone: "" },
                  bride: { name: "Cô Dâu", title: "Cô Dâu", phone: "" },
                  events: [],
                  album: [],
                  musicTitle: "Canon in D",
                  musicUrl: "",
                  rsvps: [],
                  wishes: [],
                } as unknown as WeddingCard);

                await downloadCardImageAsPng(targetCard, { mode: "story" });
              } catch (err) {
                console.error(err);
              } finally {
                setIsExportingPng(false);
              }
            }}
            disabled={isExportingPng}
            className="py-2.5 px-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 flex items-center justify-center gap-1 transition-all cursor-pointer text-center"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isExportingPng ? "Đang tải..." : "Tải ảnh HD"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenInvitationPage}
            className="py-3 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-gray-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span>Mở trang thiệp</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-zen-primary/20 transition-all hover:scale-105 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>Chia sẻ đường dẫn</span>
          </button>
        </div>

        <p className="text-[11px] text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
          <span>✨</span>
          <span>Đường dẫn mang tên cặp đôi & thương hiệu ZenLove • Miễn phí trọn đời</span>
          <span>✨</span>
        </p>
      </div>

      {/* Bulk Guest Invitation Modal */}
      {isBulkGuestModalOpen && (
        <BulkGuestInvitationModal
          isOpen={isBulkGuestModalOpen}
          onClose={() => setIsBulkGuestModalOpen(false)}
          cardSlug={currentSlug}
          groomName={card?.groom?.name || "Chú Rể"}
          brideName={card?.bride?.name || "Cô Dâu"}
        />
      )}

      {/* VietQR VIP Auto-Activation Modal */}
      {isVipModalOpen && (
        <VietQrVipPaymentModal
          isOpen={isVipModalOpen}
          onClose={() => setIsVipModalOpen(false)}
          cardId={card?.id || templateId}
          cardSlug={currentSlug}
          cardName={card?.name || templateName}
          onVipActivated={() => {
            setIsVipLocal(true);
            if (card) {
              const updatedCard: WeddingCard = {
                ...card,
                isVip: true,
                plan: "vip",
                showWatermark: false,
              };
              saveCard(updatedCard);
              saveCardAsync(updatedCard).catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
}

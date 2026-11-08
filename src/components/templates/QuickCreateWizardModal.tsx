"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Heart,
  CreditCard,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  X,
  Upload,
} from "lucide-react";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
import { cloneTemplateToNewCard, saveCard, saveCardAsync, WeddingCard } from "@/lib/weddingCardService";
import { apiFetch } from "@/lib/apiClient";
import { POPULAR_VIETNAMESE_BANKS } from "@/lib/vietQrBankCodes";
import { weddingSounds } from "@/lib/soundEffects";

interface QuickCreateWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onRequireLogin?: () => void;
}

export default function QuickCreateWizardModal({
  isOpen,
  onClose,
  userId,
  onRequireLogin,
}: QuickCreateWizardModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    ZENLOVE_TEMPLATES[0]?.slug || "hong-phong"
  );

  // Step 2: Couple info
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [groomPhone, setGroomPhone] = useState("");
  const [bridePhone, setBridePhone] = useState("");

  // Step 3: Event info
  const [weddingDate, setWeddingDate] = useState("2026-11-20");
  const [weddingTime, setWeddingTime] = useState("18:00");
  const [venueName, setVenueName] = useState("Trung Tâm Tiệc Cưới Trống Đồng");
  const [venueAddress, setVenueAddress] = useState("Hà Nội");

  // Step 4: Bank QR info
  const [bankCode, setBankCode] = useState("MB");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Khôi phục dữ liệu nháp nếu người dùng vừa đăng nhập thành công
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem("zenlove_wizard_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedTemplateId) setSelectedTemplateId(parsed.selectedTemplateId);
        if (parsed.groomName) setGroomName(parsed.groomName);
        if (parsed.brideName) setBrideName(parsed.brideName);
        if (parsed.groomPhone) setGroomPhone(parsed.groomPhone);
        if (parsed.bridePhone) setBridePhone(parsed.bridePhone);
        if (parsed.weddingDate) setWeddingDate(parsed.weddingDate);
        if (parsed.weddingTime) setWeddingTime(parsed.weddingTime);
        if (parsed.venueName) setVenueName(parsed.venueName);
        if (parsed.venueAddress) setVenueAddress(parsed.venueAddress);
        if (parsed.bankCode) setBankCode(parsed.bankCode);
        if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
        if (parsed.accountName) setAccountName(parsed.accountName);
        if (parsed.coverImageUrl) setCoverImageUrl(parsed.coverImageUrl);
        setStep(4);
        sessionStorage.removeItem("zenlove_wizard_draft");
      }
    } catch {}
  }, []);

  if (!isOpen) return null;

  const popularTemplates = ZENLOVE_TEMPLATES.slice(0, 6);

  const handleNextStep = () => {
    if (step === 2 && (!groomName.trim() || !brideName.trim())) {
      alert("Vui lòng điền tên Chú Rể và Cô Dâu để tiếp tục.");
      return;
    }
    try {
      weddingSounds.playSoftClick();
    } catch {}
    if (step < 4) setStep((step + 1) as any);
  };

  const handlePrevStep = () => {
    try {
      weddingSounds.playSoftClick();
    } catch {}
    if (step > 1) setStep((step - 1) as any);
  };

  const handleFinishAndCreate = async () => {
    if (!userId) {
      try {
        sessionStorage.setItem(
          "zenlove_wizard_draft",
          JSON.stringify({
            selectedTemplateId,
            groomName,
            brideName,
            groomPhone,
            bridePhone,
            weddingDate,
            weddingTime,
            venueName,
            venueAddress,
            bankCode,
            accountNumber,
            accountName,
            coverImageUrl,
          })
        );
      } catch {}
      onRequireLogin?.();
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        weddingSounds.playCelebration();
      } catch {}

      // 1. Clone template
      const newCard = await cloneTemplateToNewCard(
        selectedTemplateId,
        groomName.trim(),
        brideName.trim(),
        userId
      );

      // 2. Update card with user inputs
      const updatedCard: WeddingCard = {
        ...newCard,
        weddingDate,
        weddingTime,
        coverImage: coverImageUrl || newCard.coverImage,
        groom: {
          ...newCard.groom,
          name: groomName.trim(),
          phone: groomPhone.trim() || newCard.groom.phone,
          bankName: bankCode,
          accountNumber: accountNumber.trim() || newCard.groom.accountNumber,
          accountName: accountName.trim() || groomName.trim(),
        },
        bride: {
          ...newCard.bride,
          name: brideName.trim(),
          phone: bridePhone.trim() || newCard.bride.phone,
        },
        events: [
          {
            id: "event_main_reception",
            title: "Tiệc Cưới Thân Mật",
            time: weddingTime,
            venue: venueName.trim() || "Trung tâm tiệc cưới",
            address: venueAddress.trim() || "Hà Nội",
          },
        ],
        status: "draft",
      };

      // 3. Lưu thông tin cập nhật lên máy chủ
      const saveRes = await saveCardAsync(updatedCard);
      if (!saveRes.success) {
        throw new Error(saveRes.message || "Không thể lưu thiệp cưới lên máy chủ.");
      }

      // 4. Xuất bản thiệp có xác nhận từ máy chủ
      const pubRes = await apiFetch(`/api/cards/${updatedCard.id}/publish`, {
        method: "POST",
      });
      if (!pubRes.ok) {
        const errData = await pubRes.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể xuất bản thiệp cưới lên máy chủ.");
      }
      const pubData = await pubRes.json();
      const finalCard: WeddingCard = {
        ...updatedCard,
        status: "published",
        slug: pubData.card?.slug || updatedCard.slug,
      };
      saveCard(finalCard);
      onClose();

      // Chuyển hướng tới trang thiệp đã xuất bản thành công
      router.push(`/show/${finalCard.slug}`);
    } catch (err: any) {
      console.error("Lỗi khi tạo thiệp nhanh:", err);
      alert(err.message || "Không thể tạo thiệp, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 flex flex-col gap-5 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
                <span>Tạo Thiệp Siêu Tốc Trong 3 Phút</span>
                <span className="px-2 py-0.2 rounded-full bg-rose-50 text-zen-primary text-[10px] font-bold">
                  Dành cho Mobile
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Bước {step}/4: {step === 1 ? "Chọn Mẫu" : step === 2 ? "Cô Dâu & Chú Rể" : step === 3 ? "Thời Gian & Sảnh Tiệc" : "Mừng Cưới VietQR"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? "bg-zen-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* ================= STEP 1: CHỌN MẪU THIỆP ================= */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Chọn mẫu thiệp bạn ưng ý nhất để bắt đầu điền nhanh:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {popularTemplates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.slug;
                return (
                  <div
                    key={tpl.slug}
                    onClick={() => setSelectedTemplateId(tpl.slug)}
                    className={`p-2 rounded-2xl border transition-all cursor-pointer select-none group relative flex flex-col justify-between ${
                      isSelected
                        ? "border-zen-primary ring-2 ring-rose-200 bg-rose-50/20 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100 mb-2 relative">
                      <img
                        src={tpl.imageUrl}
                        alt={tpl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-zen-primary text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-800 truncate block text-center">
                      {tpl.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 2: THÔNG TIN CÔ DÂU & CHÚ RỂ ================= */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Điền họ tên cô dâu chú rể để in lên thiệp cưới và phong bì hoàng gia:
            </p>

            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-3">
              <h4 className="text-xs font-bold text-zen-primary flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-zen-primary" />
                <span>Thông tin Chú Rể</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Họ và tên Chú Rể: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vd: Nguyễn Quốc Tuấn"
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Số điện thoại Chú Rể:
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={groomPhone}
                    onChange={(e) => setGroomPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-3">
              <h4 className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-pink-600" />
                <span>Thông tin Cô Dâu</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Họ và tên Cô Dâu: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vd: Lê Thùy Linh"
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Số điện thoại Cô Dâu:
                  </label>
                  <input
                    type="tel"
                    placeholder="0987654321"
                    value={bridePhone}
                    onChange={(e) => setBridePhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: THỜI GIAN & ĐỊA ĐIỂM ================= */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Nhập thời gian và địa điểm nhà hàng tổ chức tiệc cưới:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Ngày tổ chức:
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Giờ đón khách:
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    value={weddingTime}
                    onChange={(e) => setWeddingTime(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Tên Trung tâm / Nhà hàng tiệc cưới:
              </label>
              <input
                type="text"
                placeholder="Vd: Trung tâm Hội nghị Tiệc cưới Trống Đồng"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Địa chỉ chi tiết (để chỉ đường Google Maps):
              </label>
              <input
                type="text"
                placeholder="Vd: 65 Quán Sứ, Hoàn Kiếm, Hà Nội"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 4: QUÉT MÃ MỪNG CƯỚI VIETQR & ẢNH ================= */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Nhập tài khoản ngân hàng để hệ thống tự động sinh mã VietQR mừng cưới thông minh:
            </p>

            <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-3">
              <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>Tài khoản nhận mừng cưới (VietQR)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Ngân hàng:
                  </label>
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary font-bold"
                  >
                    {POPULAR_VIETNAMESE_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Số tài khoản:
                  </label>
                  <input
                    type="text"
                    placeholder="Vd: 0912345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Tên chủ tài khoản:
                </label>
                <input
                  type="text"
                  placeholder="Vd: NGUYEN QUOC TUAN"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Đường dẫn ảnh cưới đại diện (tùy chọn):
              </label>
              <input
                type="url"
                placeholder="https://... (hoặc để trống để dùng ảnh mẫu)"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary"
              />
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white text-xs font-bold shadow-md shadow-zen-primary/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>Tiếp theo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishAndCreate}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zen-primary to-amber-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-zen-primary/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
              <span>{isSubmitting ? "Đang xuất bản thiệp..." : "🚀 Xuất Bản Thiệp Ngay"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

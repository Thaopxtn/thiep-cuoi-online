"use client";

import React from "react";
import {
  AlertTriangle,
  X,
  Heart,
  Camera,
  Calendar,
  MapPin,
  QrCode,
  Wand2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { ValidationWarning } from "@/lib/templateValidation";

interface PublishWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: ValidationWarning[];
  onProceedPublish: () => void;
  onOpenAutoFill?: () => void;
}

export default function PublishWarningModal({
  isOpen,
  onClose,
  warnings,
  onProceedPublish,
  onOpenAutoFill,
}: PublishWarningModalProps) {
  if (!isOpen) return null;

  const getIconForType = (type: string) => {
    switch (type) {
      case "name":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "photo":
        return <Camera className="w-4 h-4 text-amber-500" />;
      case "date":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "venue":
        return <MapPin className="w-4 h-4 text-purple-500" />;
      case "qr":
        return <QrCode className="w-4 h-4 text-emerald-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleFixField = () => {
    onClose();
    if (onOpenAutoFill) {
      onOpenAutoFill();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 pb-4 bg-gradient-to-br from-rose-50 via-amber-50/40 to-white border-b border-rose-100/80 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 font-serif">
                Kiểm tra trước khi xuất bản thiệp
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Phát hiện {warnings.length} mục có thể bạn chưa kịp cập nhật từ mẫu gốc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Danh sách Checklist cảnh báo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-xs text-gray-600">
            Để thiệp cưới gửi đến khách mời được trọn vẹn và không bị nhầm lẫn với thông tin mẫu demo, bạn nên kiểm tra lại các mục sau:
          </p>

          <div className="space-y-2.5">
            {warnings.map((w) => (
              <div
                key={w.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  w.severity === "high"
                    ? "bg-rose-50/50 border-rose-200/80"
                    : "bg-amber-50/40 border-amber-200/70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0 border border-gray-100 mt-0.5">
                    {getIconForType(w.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900">
                        {w.title}
                      </span>
                      {w.severity === "high" && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                          Quan trọng
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                      {w.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFixField}
                  className="shrink-0 py-1.5 px-2.5 rounded-lg bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-300 text-rose-600 text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Điền</span>
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200 text-gray-600 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Mẹo: Bạn có thể bấm nút <strong>Tự động điền</strong> để cập nhật nhanh toàn bộ thông tin cùng lúc chỉ trong 10 giây.
            </span>
          </div>
        </div>

        {/* Footer 2 nút */}
        <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onProceedPublish}
            className="w-full sm:w-auto order-2 sm:order-1 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Tôi hiểu rủi ro, vẫn xuất bản
          </button>

          <button
            type="button"
            onClick={handleFixField}
            className="w-full sm:w-auto order-1 sm:order-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e54153] to-[#ff5268] hover:from-[#d93849] hover:to-[#e54153] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Bổ sung thông tin ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

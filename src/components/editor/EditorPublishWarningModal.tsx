"use client";

import React from "react";
import {
  AlertTriangle,
  X,
  Wand2,
  ArrowRight,
  CheckCircle2,
  User,
  Image as ImageIcon,
  Calendar,
  MapPin,
  QrCode,
} from "lucide-react";
import { ValidationWarning } from "@/lib/templateValidation";

interface EditorPublishWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: ValidationWarning[];
  onOpenAutoFill: () => void;
  onProceedPublish: () => void;
}

export default function EditorPublishWarningModal({
  isOpen,
  onClose,
  warnings,
  onOpenAutoFill,
  onProceedPublish,
}: EditorPublishWarningModalProps) {
  if (!isOpen) return null;

  const getWarningIcon = (type: ValidationWarning["type"]) => {
    switch (type) {
      case "name":
        return <User className="w-4 h-4 text-amber-500" />;
      case "photo":
        return <ImageIcon className="w-4 h-4 text-rose-500" />;
      case "date":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "venue":
        return <MapPin className="w-4 h-4 text-emerald-500" />;
      case "qr":
        return <QrCode className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const highPriorityCount = warnings.filter((w) => w.severity === "high").length;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-scale-up">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-50 via-rose-50/40 to-white border-b border-amber-100/60 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Lưu ý trước khi xuất bản thiệp
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {warnings.length} mục cần kiểm tra
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Thiệp cưới của bạn vẫn còn một số thông tin hoặc hình ảnh mặc định của mẫu chưa được thay đổi.
              </p>
            </div>
          </div>
        </div>

        {/* Warning Checklist Body */}
        <div className="p-6 max-h-[360px] overflow-y-auto space-y-3">
          {warnings.map((w) => (
            <div
              key={w.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                w.severity === "high"
                  ? "bg-rose-50/40 border-rose-100 text-rose-950"
                  : "bg-amber-50/30 border-amber-100 text-amber-950"
              }`}
            >
              <div className="mt-0.5 p-1.5 rounded-xl bg-white shadow-xs shrink-0">
                {getWarningIcon(w.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-gray-900">{w.title}</h4>
                  {w.severity === "high" && (
                    <span className="text-[9px] font-semibold text-rose-600 bg-rose-100/80 px-1.5 py-0.2 rounded">
                      Quan trọng
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                  {w.description}
                </p>
              </div>
            </div>
          ))}

          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-900 text-[11px] flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Mẹo: Sử dụng tính năng <strong>Tự động điền</strong> để cập nhật toàn bộ tên, ngày giờ, địa điểm và ảnh cưới chỉ trong 30 giây!
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onProceedPublish();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Vẫn tiếp tục xuất bản
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAutoFill();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e54153] to-[#ff5268] hover:from-[#d93849] hover:to-[#e54153] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>⚡ Tự động điền thông tin ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

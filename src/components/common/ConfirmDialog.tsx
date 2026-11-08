"use client";

import { useId } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Dialog from "@/components/ui/Dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy bỏ",
  isDanger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogId = useId();

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      labelledBy={`${dialogId}-title`}
      describedBy={`${dialogId}-message`}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-rose-100 text-rose-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 id={`${dialogId}-title`} className="font-bold text-gray-900 text-base">{title}</h3>
            <p id={`${dialogId}-message`} className="text-sm text-gray-600 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 px-4 py-2 rounded-full border border-gray-200 hover:bg-stone-50 text-gray-700 text-sm font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-11 px-5 py-2 rounded-full text-white text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                : "bg-zen-primary hover:bg-red-600 shadow-zen-primary/25"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

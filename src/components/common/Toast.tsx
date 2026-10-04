"use client";

import React from "react";
import { Check, AlertCircle, RotateCcw, X } from "lucide-react";

export interface ToastData {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999999] bg-stone-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up text-xs sm:text-sm font-medium border border-stone-800 max-w-md">
      {toast.type === "error" ? (
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
      ) : (
        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
      )}

      <span className="flex-1 text-stone-100">{toast.message}</span>

      {toast.undoAction && (
        <button
          type="button"
          onClick={() => {
            toast.undoAction?.();
            onClose();
          }}
          className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-amber-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{toast.undoLabel || "Hoàn tác"}</span>
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="text-stone-400 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi nhận lỗi để phân tích và gỡ lỗi
    console.error("Ứng dụng gặp lỗi runtime:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Đã xảy ra sự cố
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Rất tiếc, hệ thống đã gặp sự cố không mong muốn trong khi xử lý trang. Bạn có thể thử tải lại hoặc quay về trang chủ.
        </p>

        {process.env.NODE_ENV !== "production" && error.message && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-700 font-mono overflow-auto max-h-32">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition shadow-md shadow-rose-200 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 text-gray-700 text-sm font-semibold hover:bg-slate-200 transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

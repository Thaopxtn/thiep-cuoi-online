"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Lỗi cấp Root Layout:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Hệ thống gián đoạn
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Đã có lỗi hệ thống cấp cấu trúc xảy ra. Vui lòng thử nạp lại trang để khôi phục trạng thái.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => reset()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition shadow-md shadow-rose-200"
            >
              <RotateCcw className="w-4 h-4" />
              Tải lại trang
            </button>
            <a
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 text-gray-700 text-sm font-semibold hover:bg-slate-200 transition"
            >
              Về trang chủ
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

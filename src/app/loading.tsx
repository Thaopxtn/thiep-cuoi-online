import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        {/* Vòng quay tinh tế phong cách ZenLove */}
        <div className="w-12 h-12 rounded-full border-3 border-rose-100 border-t-rose-500 animate-spin" />
        <div className="absolute text-rose-500 text-xs font-semibold">
          ❤
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-gray-400 tracking-wider uppercase animate-pulse">
        Đang tải dữ liệu...
      </p>
    </div>
  );
}
